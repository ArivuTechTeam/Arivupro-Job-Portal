"""Views for exam management."""

import json
import logging
import os
from typing import Optional

from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Avg, Count, Max, Min
from django.conf import settings

from .models import (
    Subject, Chapter, ExamPaper, Question, MarkingScheme,
    Submission, Evaluation, QuestionEvaluation, PDFDocument,
    FacultyValidationRequest,
)
from .serializers import (
    SubjectSerializer, SubjectListSerializer, ChapterSerializer,
    ExamPaperSerializer, ExamPaperListSerializer, ExamPaperCreateSerializer,
    QuestionSerializer, QuestionCreateSerializer, MarkingSchemeSerializer,
    SubmissionSerializer, SubmissionCreateSerializer,
    EvaluationSerializer, EvaluationListSerializer,
    QuestionEvaluationSerializer, PDFDocumentSerializer, PDFDocumentCreateSerializer,
    FacultyValidationRequestSerializer,
)

logger = logging.getLogger(__name__)


class IsAdminUser(permissions.BasePermission):
    """Allow admin/evaluator roles, or any Django staff/superuser."""
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        return (
            getattr(request.user, 'role', '') in ('admin', 'evaluator')
            or request.user.is_staff
            or request.user.is_superuser
        )


class IsOwnerOrAdmin(permissions.BasePermission):
    """Allow owners or admins."""
    def has_object_permission(self, request, view, obj):
        if (getattr(request.user, 'role', '') in ('admin', 'evaluator')
                or request.user.is_staff or request.user.is_superuser):
            return True
        if hasattr(obj, 'student'):
            return obj.student == request.user
        return False


class SubjectViewSet(viewsets.ModelViewSet):
    """CRUD for subjects."""
    queryset = Subject.objects.filter(is_active=True)
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['exam_type', 'exam_level']
    search_fields = ['name', 'code']

    def get_serializer_class(self):
        if self.action == 'list':
            return SubjectListSerializer
        return SubjectSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.IsAuthenticated()]
        return [IsAdminUser()]


class ChapterViewSet(viewsets.ModelViewSet):
    """CRUD for chapters within a subject."""
    serializer_class = ChapterSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['subject']

    def get_queryset(self):
        return Chapter.objects.all()

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.IsAuthenticated()]
        return [IsAdminUser()]


class ExamPaperViewSet(viewsets.ModelViewSet):
    """CRUD for exam papers - admin creates, students view published ones."""
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['subject', 'attempt_type', 'is_published']
    search_fields = ['title', 'exam_session']
    ordering_fields = ['created_at', 'total_marks']

    def get_queryset(self):
        user = self.request.user
        if user.role in ('admin', 'evaluator'):
            return ExamPaper.objects.all()
        return ExamPaper.objects.filter(is_published=True)

    def get_serializer_class(self):
        if self.action == 'list':
            return ExamPaperListSerializer
        if self.action in ['create', 'update', 'partial_update']:
            return ExamPaperCreateSerializer
        return ExamPaperSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.IsAuthenticated()]
        return [IsAdminUser()]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def add_question(self, request, pk=None):
        """Add a question to the exam paper."""
        paper = self.get_object()
        serializer = QuestionCreateSerializer(data={**request.data, 'exam_paper': paper.pk})
        serializer.is_valid(raise_exception=True)
        question = serializer.save()
        return Response(QuestionSerializer(question).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['get'])
    def questions(self, request, pk=None):
        """List all questions for an exam paper."""
        paper = self.get_object()
        questions = paper.questions.all()
        return Response(QuestionSerializer(questions, many=True).data)

    @action(detail=True, methods=['get'])
    def statistics(self, request, pk=None):
        """Get submission statistics for an exam paper."""
        paper = self.get_object()
        evals = Evaluation.objects.filter(
            submission__exam_paper=paper, status__in=['completed', 'approved']
        )
        return Response({
            'total_submissions': paper.submissions.count(),
            'evaluated_count': evals.count(),
            'avg_score': evals.aggregate(avg=Avg('percentage'))['avg'],
            'highest_score': evals.aggregate(max=Max('total_marks_obtained'))['max'],
            'lowest_score': evals.aggregate(min=Min('total_marks_obtained'))['min'],
        })


class QuestionViewSet(viewsets.ModelViewSet):
    """CRUD for questions."""
    queryset = Question.objects.all()
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['exam_paper', 'question_type', 'chapter']

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return QuestionCreateSerializer
        return QuestionSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.IsAuthenticated()]
        return [IsAdminUser()]

    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def add_marking_step(self, request, pk=None):
        """Add a marking step to a question."""
        question = self.get_object()
        serializer = MarkingSchemeSerializer(data={**request.data, 'question': question.pk})
        serializer.is_valid(raise_exception=True)
        step = serializer.save()
        return Response(MarkingSchemeSerializer(step).data, status=status.HTTP_201_CREATED)


class SubmissionViewSet(viewsets.ModelViewSet):
    """Student submissions."""
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['status', 'exam_paper']
    ordering_fields = ['created_at']

    def get_queryset(self):
        user = self.request.user
        if user.role in ('admin', 'evaluator'):
            return Submission.objects.all()
        return Submission.objects.filter(student=user)

    def get_serializer_class(self):
        if self.action in ['create']:
            return SubmissionCreateSerializer
        return SubmissionSerializer

    def perform_create(self, serializer):
        submission = serializer.save(student=self.request.user, status='pending')
        # Run AI evaluation in a background thread so the HTTP response
        # returns immediately (201 Created) without waiting for AI processing.
        import threading
        from apps.evaluator.engine import trigger_evaluation
        t = threading.Thread(target=trigger_evaluation, args=(submission.id,), daemon=True)
        t.start()

    @action(detail=True, methods=['get'])
    def evaluation(self, request, pk=None):
        """Get evaluation for a submission."""
        submission = self.get_object()
        try:
            evaluation = submission.evaluation
            return Response(EvaluationSerializer(evaluation).data)
        except Evaluation.DoesNotExist:
            return Response(
                {'detail': 'Evaluation not yet available.'},
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=True, methods=['post'])
    def request_validation(self, request, pk=None):
        """Student requests faculty validation for their evaluated submission."""
        submission = self.get_object()
        # Only the student who owns this submission can request
        if submission.student != request.user and not request.user.is_staff \
                and getattr(request.user, 'role', '') not in ('admin', 'evaluator'):
            return Response({'detail': 'Not allowed.'}, status=status.HTTP_403_FORBIDDEN)

        # Check evaluation exists
        try:
            submission.evaluation
        except Evaluation.DoesNotExist:
            return Response(
                {'detail': 'Evaluation not complete yet. Cannot request validation.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        vr, created = FacultyValidationRequest.objects.get_or_create(
            submission=submission,
            defaults={'note': request.data.get('note', '')}
        )
        if not created:
            vr.status = 'pending'
            vr.note   = request.data.get('note', vr.note)
            vr.save()

        return Response(
            {'detail': 'Validation request submitted.', 'status': vr.status},
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK
        )

    @action(detail=True, methods=['post'])
    def retrigger(self, request, pk=None):
        """Re-trigger AI evaluation for a stuck or failed submission.
        Admins can retrigger any submission; students can only retrigger their own."""
        submission = self.get_object()
        user = request.user
        if not (user.role in ('admin', 'evaluator') or user.is_staff or submission.student == user):
            return Response({'detail': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)

        # Delete any incomplete evaluation so a fresh one can be created
        try:
            old_eval = submission.evaluation
            if old_eval.status not in ('completed', 'approved'):
                old_eval.delete()
        except Evaluation.DoesNotExist:
            pass

        submission.status = 'pending'
        submission.save()

        import threading
        from apps.evaluator.engine import trigger_evaluation
        t = threading.Thread(target=trigger_evaluation, args=(submission.id,), daemon=True)
        t.start()
        return Response({'detail': 'Evaluation re-triggered.', 'submission_id': str(submission.id)})

    @action(detail=True, methods=['get'])
    def report(self, request, pk=None):
        """Get full ICAI-style evaluation report."""
        submission = self.get_object()
        try:
            evaluation = submission.evaluation
        except Evaluation.DoesNotExist:
            return Response(
                {
                    'detail': 'Evaluation not yet available.',
                    'status': submission.status,
                },
                status=status.HTTP_202_ACCEPTED
            )

        from apps.evaluator.models import MistakeLog
        mistakes = MistakeLog.objects.filter(evaluation=evaluation)
        paper = submission.exam_paper

        def mistake_desc(qs):
            items = list(qs.values_list('description', flat=True)[:3])
            return ' | '.join(items) if items else ''

        def mistake_marks(qs):
            return sum(qs.values_list('marks_lost', flat=True))

        m_conceptual   = mistakes.filter(category='conceptual')
        m_presentation = mistakes.filter(category='presentation')
        m_calculation  = mistakes.filter(category='calculation')
        m_step_loss    = mistakes.filter(category='step_loss')

        # Build absolute URL for the student's uploaded answer sheet
        answer_url = None
        if submission.answer_script_file:
            try:
                answer_url = request.build_absolute_uri(submission.answer_script_file.url)
            except Exception:
                pass

        report = {
            # Exam / submission info
            'exam_paper': {
                'id':      str(paper.id),
                'title':   paper.title,
                'subject': paper.subject.name,
            },
            'evaluation_date':   evaluation.created_at.isoformat(),
            'submission_date':   submission.created_at.isoformat(),
            'status':            evaluation.status,
            'answer_script_url': answer_url,

            # Faculty validation request status (None if not yet requested)
            'validation_request_status': (
                submission.validation_request.status
                if hasattr(submission, 'validation_request') else None
            ),

            # Scores (flat numbers)
            'total_score':    evaluation.total_marks_obtained or 0,
            'total_marks':    evaluation.total_marks_possible or paper.total_marks or 100,
            'percentage':     evaluation.percentage or 0,
            'improvement_potential': evaluation.improvement_potential,

            # Presentation (flat)
            'presentation_score':         evaluation.presentation_score or 0,
            'presentation_format':        evaluation.format_score or 0,
            'presentation_headings':      evaluation.heading_score or 0,
            'presentation_working_notes': evaluation.working_notes_score or 0,
            'presentation_neatness':      evaluation.neatness_score or 0,

            # Question-wise analysis (works for both step-wise and holistic mode)
            'questions': QuestionEvaluationSerializer(
                evaluation.question_evaluations.all().order_by('id'), many=True
            ).data,
            'is_holistic': not paper.questions.exists(),

            # Mistake counts & summaries
            'mistake_conceptual_count':          m_conceptual.count(),
            'mistake_conceptual_marks':          mistake_marks(m_conceptual),
            'mistake_conceptual_description':    mistake_desc(m_conceptual),
            'mistake_presentation_count':        m_presentation.count(),
            'mistake_presentation_marks':        mistake_marks(m_presentation),
            'mistake_presentation_description':  mistake_desc(m_presentation),
            'mistake_calculation_count':         m_calculation.count(),
            'mistake_calculation_marks':         mistake_marks(m_calculation),
            'mistake_calculation_description':   mistake_desc(m_calculation),
            'mistake_step_loss_count':           m_step_loss.count(),
            'mistake_step_loss_marks':           mistake_marks(m_step_loss),
            'mistake_step_loss_description':     mistake_desc(m_step_loss),

            # Feedback arrays
            'overall_feedback': evaluation.overall_feedback,
            'strengths':        evaluation.strengths or [],
            'areas_to_improve': evaluation.areas_to_improve or [],
            'action_plan':      evaluation.action_plan or [],
            'suggestions':      evaluation.ai_suggestions or [],
        }
        return Response(report)


class EvaluationViewSet(viewsets.ReadOnlyModelViewSet):
    """Read-only evaluation results."""
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['status', 'is_ai_evaluated']
    ordering_fields = ['created_at', 'percentage']

    def get_queryset(self):
        user = self.request.user
        if user.role in ('admin', 'evaluator'):
            return Evaluation.objects.all()
        return Evaluation.objects.filter(submission__student=user)

    def get_serializer_class(self):
        if self.action == 'list':
            return EvaluationListSerializer
        return EvaluationSerializer

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['request'] = self.request
        return ctx

    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def approve(self, request, pk=None):
        """Admin approves an AI evaluation."""
        evaluation = self.get_object()
        evaluation.status = 'approved'
        evaluation.evaluated_by = request.user
        evaluation.admin_remarks = request.data.get('remarks', '')
        if 'total_marks_obtained' in request.data:
            evaluation.total_marks_obtained = request.data['total_marks_obtained']
            if evaluation.total_marks_possible:
                evaluation.percentage = round(
                    evaluation.total_marks_obtained / evaluation.total_marks_possible * 100, 1
                )
        evaluation.save()
        return Response(EvaluationSerializer(evaluation).data)

    @action(detail=False, methods=['get'])
    def my_history(self, request):
        """Get evaluation history for the current student."""
        evaluations = Evaluation.objects.filter(
            submission__student=request.user,
            status__in=['completed', 'approved']
        ).order_by('created_at')
        return Response(EvaluationListSerializer(evaluations, many=True).data)

    @action(detail=False, methods=['get'])
    def ranking(self, request):
        """Get ranking/benchmarking data."""
        exam_paper_id = request.query_params.get('exam_paper')
        if not exam_paper_id:
            return Response({'detail': 'exam_paper parameter required.'}, status=400)

        evals = Evaluation.objects.filter(
            submission__exam_paper_id=exam_paper_id,
            status__in=['completed', 'approved']
        ).order_by('-percentage')

        total = evals.count()
        user_eval = evals.filter(submission__student=request.user).first()

        if not user_eval:
            return Response({'detail': 'No evaluation found for this paper.'}, status=404)

        rank = list(evals.values_list('id', flat=True)).index(user_eval.id) + 1
        percentile = round((1 - rank / total) * 100, 1) if total > 0 else 0

        avg_score = evals.aggregate(avg=Avg('percentage'))['avg'] or 0
        top_score = evals.first().percentage if evals.exists() else 0

        return Response({
            'your_score': user_eval.percentage,
            'your_rank': rank,
            'total_students': total,
            'percentile': percentile,
            'average_score': round(avg_score, 1),
            'top_score': top_score,
            'message': f"You are in top {100 - percentile:.0f}%" if percentile > 0 else "N/A",
        })


def _extract_pdf_text(file_path: str) -> str:
    """Extract text from a PDF file using PyPDF2, falling back to OCR."""
    ext = os.path.splitext(file_path)[1].lower()
    if ext == '.pdf':
        try:
            from PyPDF2 import PdfReader
            reader = PdfReader(file_path)
            text = ''.join(page.extract_text() or '' for page in reader.pages)
            if len(text.strip()) >= 50:
                return text
        except Exception as e:
            logger.warning(f"PyPDF2 extraction failed: {e}")
        # Fall back to OCR
        try:
            from pdf2image import convert_from_path
            import pytesseract
            images = convert_from_path(file_path)
            return '\n'.join(pytesseract.image_to_string(img) for img in images)
        except Exception as e:
            logger.error(f"PDF OCR failed: {e}")
            return ''
    elif ext in ('.png', '.jpg', '.jpeg', '.webp', '.bmp', '.tiff'):
        try:
            import pytesseract
            from PIL import Image
            return pytesseract.image_to_string(Image.open(file_path))
        except Exception as e:
            logger.error(f"Image OCR failed: {e}")
            return ''
    else:
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                return f.read()
        except Exception:
            return ''


def _call_openai(prompt: str, system: str = '', temperature: float = 0.4) -> Optional[str]:
    """Call GPT-4o and return the response text, or None on failure."""
    api_key = getattr(settings, 'OPENAI_API_KEY', '')
    if not api_key or api_key.startswith('your-') or api_key.startswith('sk-your'):
        return None
    try:
        from openai import OpenAI
        client = OpenAI(api_key=api_key)
        messages = []
        if system:
            messages.append({'role': 'system', 'content': system})
        messages.append({'role': 'user', 'content': prompt})
        response = client.chat.completions.create(
            model=getattr(settings, 'AI_MODEL', 'gpt-4o'),
            messages=messages,
            temperature=temperature,
            max_tokens=3000,
        )
        content = response.choices[0].message.content.strip()
        if content.startswith('```'):
            content = content.split('\n', 1)[1] if '\n' in content else content[3:]
            if content.endswith('```'):
                content = content[:-3]
        return content.strip()
    except Exception as e:
        logger.error(f"OpenAI call failed: {e}")
        return None


def _call_claude(prompt: str, system: str = '', temperature: float = 0.4) -> Optional[str]:
    """Call Anthropic Claude and return the response text, or None on failure."""
    api_key = getattr(settings, 'ANTHROPIC_API_KEY', '')
    if not api_key or api_key.startswith('your-'):
        return None
    try:
        import anthropic
        client = anthropic.Anthropic(api_key=api_key)
        model = getattr(settings, 'CLAUDE_MODEL', 'claude-haiku-4-5-20251001')
        msg = client.messages.create(
            model=model,
            max_tokens=3000,
            system=system or 'You are a helpful academic tutor. Always respond with valid JSON only.',
            messages=[{'role': 'user', 'content': prompt}],
        )
        content = msg.content[0].text.strip()
        if content.startswith('```'):
            content = content.split('\n', 1)[1] if '\n' in content else content[3:]
            if content.endswith('```'):
                content = content[:-3]
        return content.strip()
    except Exception as e:
        logger.error(f"Claude call failed: {e}")
        return None


def _call_ai(prompt: str, system: str = '', temperature: float = 0.4) -> Optional[str]:
    """Try Claude → OpenAI → None."""
    result = _call_claude(prompt, system, temperature)
    if result:
        return result
    return _call_openai(prompt, system, temperature)


def _smart_text_analysis(text: str) -> dict:
    """Extract insights from text without any AI API — used as offline fallback."""
    import re

    lines  = [l.strip() for l in text.splitlines() if l.strip()]
    words  = text.split()
    sentences = re.split(r'(?<=[.!?])\s+', text.strip())

    # Summary: first 3–4 non-trivial sentences
    summary_sents = [s for s in sentences if len(s.split()) >= 6][:4]
    summary = ' '.join(summary_sents) if summary_sents else text[:400]

    # Key concepts: capitalized multi-word phrases + standalone capitalized words
    concept_pattern = re.compile(r'\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\b')
    concepts = list(dict.fromkeys(concept_pattern.findall(text)))[:15]
    if len(concepts) < 5:
        # fallback: most frequent words (length > 5, not stopwords)
        stopwords = {'which', 'their', 'there', 'these', 'those', 'where', 'about',
                     'would', 'could', 'should', 'after', 'before', 'being', 'having'}
        freq = {}
        for w in words:
            w_clean = re.sub(r'[^a-zA-Z]', '', w).lower()
            if len(w_clean) > 5 and w_clean not in stopwords:
                freq[w_clean] = freq.get(w_clean, 0) + 1
        concepts += [w.capitalize() for w, _ in sorted(freq.items(), key=lambda x: -x[1])[:15 - len(concepts)]]

    # Section breakdown: split by blank lines or heading-like lines
    raw_sections = re.split(r'\n\s*\n', text)
    section_breakdown = []
    for sec in raw_sections[:6]:
        sec_lines = [l.strip() for l in sec.splitlines() if l.strip()]
        if not sec_lines:
            continue
        title = sec_lines[0][:60]
        body  = ' '.join(sec_lines[1:4]) if len(sec_lines) > 1 else sec_lines[0]
        if len(body.split()) < 4:
            body = sec_lines[0]
        section_breakdown.append({'title': title, 'explanation': body[:300]})

    if not section_breakdown:
        chunk_size = max(len(sentences) // 4, 1)
        for i in range(0, min(len(sentences), 4 * chunk_size), chunk_size):
            chunk = ' '.join(sentences[i:i + chunk_size])
            section_breakdown.append({
                'title': f'Section {i // chunk_size + 1}',
                'explanation': chunk[:300],
            })

    # Flashcards: sentence pairs (question from first, answer from next)
    flashcards = []
    for i in range(0, min(len(sentences) - 1, 20), 2):
        q = sentences[i].strip()
        a = sentences[i + 1].strip() if i + 1 < len(sentences) else ''
        if len(q.split()) >= 5 and len(a.split()) >= 3:
            if not q.endswith('?'):
                q = f"What does the document say about: {q[:80]}?"
            flashcards.append({'question': q, 'answer': a[:200]})
        if len(flashcards) >= 8:
            break

    return {
        'summary': summary[:600],
        'key_concepts': concepts[:15],
        'section_breakdown': section_breakdown[:6],
        'flashcards': flashcards[:8],
    }


class PDFDocumentViewSet(viewsets.ModelViewSet):
    """Student PDF upload and AI explanation."""
    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ['get', 'post', 'delete', 'head', 'options']

    def get_queryset(self):
        return PDFDocument.objects.filter(student=self.request.user)

    def get_serializer_class(self):
        if self.action == 'create':
            return PDFDocumentCreateSerializer
        return PDFDocumentSerializer

    def create(self, request, *args, **kwargs):
        serializer = PDFDocumentCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        doc = serializer.save(student=request.user, status='processing')

        try:
            file_path = doc.pdf_file.path
            extracted = _extract_pdf_text(file_path)

            if not extracted.strip():
                doc.status = 'failed'
                doc.ai_summary = 'Could not extract text from the uploaded file.'
                doc.save()
                return Response(PDFDocumentSerializer(doc).data, status=status.HTTP_201_CREATED)

            prompt = f"""You are an expert academic tutor. A student has uploaded a study document.
Analyze it thoroughly and return a JSON object with these exact keys:

{{
  "summary": "<2-4 sentence overview of the entire document>",
  "key_concepts": ["<concept 1>", "<concept 2>", ...],
  "section_breakdown": [
    {{"title": "<topic name>", "explanation": "<clear explanation in 2-3 sentences>"}},
    ...
  ],
  "flashcards": [
    {{"question": "<question>", "answer": "<answer>"}},
    ...
  ]
}}

Rules:
- key_concepts: list 8-15 important terms or ideas
- section_breakdown: cover every major topic, at least 4 sections
- flashcards: generate 8-12 Q&A pairs for self-testing
- Write in simple, student-friendly language
- Return ONLY valid JSON, no markdown or extra text

Document text:
---
{extracted[:9000]}
---"""

            ai_raw = _call_ai(
                prompt,
                system='You are a helpful academic tutor. Always respond with valid JSON only.',
            )

            if ai_raw:
                try:
                    ai_data = json.loads(ai_raw)
                except json.JSONDecodeError:
                    # AI returned text instead of JSON — still use it for summary
                    ai_data = _smart_text_analysis(extracted)
                    ai_data['summary'] = ai_raw[:500]
            else:
                # No AI API available — use smart text-only analysis
                logger.info(f"No AI API key configured, using smart text analysis for doc {doc.id}")
                ai_data = _smart_text_analysis(extracted)

            doc.ai_summary = ai_data.get('summary', '')
            doc.key_points = {
                'extracted_text': extracted[:12000],
                'key_concepts': ai_data.get('key_concepts', []),
                'section_breakdown': ai_data.get('section_breakdown', []),
                'flashcards': ai_data.get('flashcards', []),
            }
            doc.status = 'completed'
            doc.save()

        except Exception as e:
            logger.error(f"PDF analysis failed for doc {doc.id}: {e}")
            doc.status = 'failed'
            doc.save()

        return Response(PDFDocumentSerializer(doc).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def chat(self, request, pk=None):
        """Answer a follow-up question about the uploaded PDF."""
        doc = self.get_object()
        question = request.data.get('question', '').strip()
        if not question:
            return Response({'error': 'Question is required.'}, status=400)

        if doc.status != 'completed' or not doc.key_points:
            return Response({'error': 'Document not yet analyzed.'}, status=400)

        extracted = doc.key_points.get('extracted_text', '')

        prompt = f"""A student is asking a question about their study document.

Document content:
---
{extracted[:8000]}
---

Student's question: {question}

Give a clear, helpful, and educational answer based strictly on the document content.
If the answer is not in the document, say so honestly."""

        answer = _call_ai(
            prompt,
            system="You are a helpful academic tutor answering questions about a student's study material.",
            temperature=0.5,
        )

        if not answer:
            # Fallback: simple keyword search in extracted text
            extracted_lower = extracted.lower()
            q_lower = question.lower()
            keywords = [w for w in q_lower.split() if len(w) > 3]
            relevant = []
            for sent in extracted.replace('\n', ' ').split('.'):
                if any(kw in sent.lower() for kw in keywords):
                    relevant.append(sent.strip())
                if len(relevant) >= 3:
                    break
            if relevant:
                answer = 'Based on the document: ' + '. '.join(relevant[:3]) + '.'
            else:
                answer = ('I could not find a direct answer in the document. '
                          'For AI-powered answers, please configure an API key in the backend .env file '
                          '(ANTHROPIC_API_KEY or OPENAI_API_KEY).')

        return Response({'answer': answer})


class FacultyValidationViewSet(viewsets.ModelViewSet):
    """Admin endpoint to manage faculty validation requests."""
    serializer_class = FacultyValidationRequestSerializer
    permission_classes = [IsAdminUser]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['status']
    ordering_fields  = ['created_at']

    def get_queryset(self):
        return FacultyValidationRequest.objects.select_related(
            'submission__student',
            'submission__exam_paper__subject',
            'submission__evaluation',
        ).all()

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['request'] = self.request
        return ctx

    @action(detail=True, methods=['post'])
    def mark_reviewed(self, request, pk=None):
        """Admin marks a request as reviewed with faculty name and remarks."""
        from django.utils import timezone
        vr = self.get_object()
        vr.status        = 'reviewed'
        vr.faculty_name  = request.data.get('faculty_name', vr.faculty_name)
        vr.admin_remarks = request.data.get('admin_remarks', vr.admin_remarks)
        vr.reviewed_by   = request.user
        vr.reviewed_at   = timezone.now()
        vr.save()
        return Response(FacultyValidationRequestSerializer(vr, context={'request': request}).data)

    @action(detail=True, methods=['patch'])
    def update_review(self, request, pk=None):
        """Admin edits an already-reviewed request (faculty name or remarks)."""
        from django.utils import timezone
        vr = self.get_object()
        if 'faculty_name' in request.data:
            vr.faculty_name = request.data['faculty_name']
        if 'admin_remarks' in request.data:
            vr.admin_remarks = request.data['admin_remarks']
        vr.reviewed_by  = request.user
        vr.reviewed_at  = timezone.now()
        vr.save()
        return Response(FacultyValidationRequestSerializer(vr, context={'request': request}).data)
