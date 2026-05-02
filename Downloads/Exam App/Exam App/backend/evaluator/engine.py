"""
AI Evaluation Engine for CA/CS/CMA Answer Scripts.

This module handles:
- OCR/text extraction from uploaded answer scripts
- Step-wise marking against the marking scheme
- ICAI presentation scoring
- Mistake detection and categorization
- Generating detailed feedback and suggestions
"""

import json
import logging
import os
from typing import Optional

from django.conf import settings

logger = logging.getLogger(__name__)


def trigger_evaluation(submission_id):
    """
    Trigger AI evaluation for a submission.
    In production, this should be a Celery task.
    """
    from exams.models import Submission
    try:
        submission = Submission.objects.get(id=submission_id)
        submission.status = 'processing'
        submission.save()

        engine = EvaluationEngine(submission)
        engine.evaluate()

        submission.status = 'evaluated'
        submission.save()
    except Exception as e:
        logger.error(f"Evaluation failed for submission {submission_id}: {e}")
        submission = Submission.objects.get(id=submission_id)
        submission.status = 'pending'
        submission.save()


class EvaluationEngine:
    """Core AI evaluation engine."""

    def __init__(self, submission):
        self.submission = submission
        self.exam_paper = submission.exam_paper
        self.questions = self.exam_paper.questions.prefetch_related('marking_steps').all()

    def evaluate(self):
        """Run the full evaluation pipeline."""
        # Step 1: Extract text from answer script
        answer_text = self._extract_text()

        # Step 2: Segment answers by question
        segmented_answers = self._segment_answers(answer_text)

        # Step 3: Evaluate each question
        question_results = []
        total_obtained = 0
        total_possible = 0
        all_mistakes = []

        for question in self.questions:
            student_answer = segmented_answers.get(question.question_number, '')
            result = self._evaluate_question(question, student_answer)
            question_results.append(result)
            total_obtained += result['marks_obtained']
            total_possible += question.marks
            all_mistakes.extend(result.get('mistakes', []))

        # Step 4: Calculate presentation score
        presentation = self._evaluate_presentation(answer_text)

        # Step 5: Generate overall evaluation
        self._create_evaluation(
            question_results=question_results,
            total_obtained=total_obtained,
            total_possible=total_possible,
            presentation=presentation,
            mistakes=all_mistakes,
            answer_text=answer_text,
        )

    def _extract_text(self) -> str:
        """Extract text from the uploaded answer script (PDF/images)."""
        file_path = self.submission.answer_script_file.path

        if file_path.lower().endswith('.pdf'):
            return self._extract_from_pdf(file_path)
        elif file_path.lower().endswith(('.png', '.jpg', '.jpeg')):
            return self._extract_from_image(file_path)
        else:
            # Try reading as text
            try:
                with open(file_path, 'r') as f:
                    return f.read()
            except Exception:
                return ""

    def _extract_from_pdf(self, file_path: str) -> str:
        """Extract text from PDF using PyPDF2, fallback to OCR."""
        try:
            from PyPDF2 import PdfReader
            reader = PdfReader(file_path)
            text = ""
            for page in reader.pages:
                text += page.extract_text() or ""

            # If no text extracted (scanned PDF), use OCR
            if len(text.strip()) < 50:
                return self._ocr_pdf(file_path)
            return text
        except Exception as e:
            logger.error(f"PDF extraction failed: {e}")
            return self._ocr_pdf(file_path)

    def _extract_from_image(self, file_path: str) -> str:
        """Extract text from image using OCR."""
        try:
            import pytesseract
            from PIL import Image
            image = Image.open(file_path)
            return pytesseract.image_to_string(image)
        except Exception as e:
            logger.error(f"OCR extraction failed: {e}")
            return ""

    def _ocr_pdf(self, file_path: str) -> str:
        """OCR a scanned PDF."""
        try:
            from pdf2image import convert_from_path
            import pytesseract

            images = convert_from_path(file_path)
            text = ""
            for image in images:
                text += pytesseract.image_to_string(image) + "\n"
            return text
        except Exception as e:
            logger.error(f"PDF OCR failed: {e}")
            return ""

    def _segment_answers(self, text: str) -> dict:
        """Use AI to segment the answer text by question number."""
        if not text.strip():
            return {}

        prompt = f"""You are an exam answer script analyzer for Indian CA/CS/CMA exams.

Given the following answer script text, segment it by question number.
Return a JSON object where keys are question numbers (matching: {[q.question_number for q in self.questions]})
and values are the student's answer text for that question.

If a question is not attempted, set its value to "NOT_ATTEMPTED".

Answer script text:
---
{text[:8000]}
---

Return ONLY valid JSON, no other text."""

        response = self._call_ai(prompt)
        try:
            return json.loads(response)
        except (json.JSONDecodeError, TypeError):
            # Fallback: treat entire text as one answer
            return {q.question_number: text for q in self.questions}

    def _evaluate_question(self, question, student_answer: str) -> dict:
        """Evaluate a single question against its marking scheme."""
        marking_steps = question.marking_steps.all()

        if not student_answer or student_answer == 'NOT_ATTEMPTED':
            return {
                'question': question,
                'marks_obtained': 0,
                'marks_possible': question.marks,
                'feedback': 'Question not attempted.',
                'missing_points': [s.description for s in marking_steps],
                'step_scores': {},
                'concept_marks': 0,
                'format_marks': 0,
                'calculation_marks': 0,
                'working_notes_marks': 0,
                'mistakes': [{
                    'category': 'step_loss',
                    'description': f'Q.{question.question_number}: Not attempted',
                    'marks_lost': question.marks,
                    'severity': 'major',
                }],
                'student_answer_excerpt': student_answer[:500] if student_answer else '',
            }

        # Build the marking scheme context
        scheme_text = "\n".join([
            f"Step {s.step_number} ({s.step_type}, {s.marks}m): {s.description}"
            + (f"\nIdeal answer: {s.ideal_answer_text}" if s.ideal_answer_text else "")
            for s in marking_steps
        ])

        prompt = f"""You are an expert evaluator for Indian {self.exam_paper.subject.exam_type} exams.
Evaluate the student's answer for Question {question.question_number} ({question.question_type}, {question.marks} marks).

QUESTION: {question.question_text}

MARKING SCHEME:
{scheme_text}

STUDENT'S ANSWER:
{student_answer[:4000]}

Evaluate step-by-step and return JSON:
{{
    "marks_obtained": <float>,
    "step_scores": {{
        "<step_number>": {{"marks": <float>, "feedback": "<brief feedback>"}}
    }},
    "concept_marks": <float - marks for correct concepts/logic>,
    "format_marks": <float - marks for proper format/presentation>,
    "calculation_marks": <float - marks for correct calculations>,
    "working_notes_marks": <float - marks for working notes>,
    "feedback": "<overall feedback for this question>",
    "missing_points": ["<point 1>", "<point 2>"],
    "mistakes": [
        {{
            "category": "<conceptual|presentation|calculation|step_loss|keyword|format>",
            "description": "<what went wrong>",
            "marks_lost": <float>,
            "severity": "<minor|moderate|major>",
            "suggestion": "<how to improve>"
        }}
    ]
}}

Be strict but fair. Follow ICAI/ICSI/ICMAI marking conventions.
Return ONLY valid JSON."""

        response = self._call_ai(prompt)
        try:
            result = json.loads(response)
            result['question'] = question
            result['marks_possible'] = question.marks
            result['student_answer_excerpt'] = student_answer[:500]
            # Ensure marks don't exceed maximum
            result['marks_obtained'] = min(result.get('marks_obtained', 0), question.marks)
            return result
        except (json.JSONDecodeError, TypeError):
            return {
                'question': question,
                'marks_obtained': 0,
                'marks_possible': question.marks,
                'feedback': 'AI evaluation failed. Pending manual review.',
                'missing_points': [],
                'step_scores': {},
                'concept_marks': 0,
                'format_marks': 0,
                'calculation_marks': 0,
                'working_notes_marks': 0,
                'mistakes': [],
                'student_answer_excerpt': student_answer[:500],
            }

    def _evaluate_presentation(self, answer_text: str) -> dict:
        """Evaluate ICAI-style presentation score (out of 20)."""
        prompt = f"""You are evaluating the PRESENTATION quality of a CA/CS/CMA exam answer script.
This is separate from content — focus ONLY on presentation aspects.

Answer script excerpt:
{answer_text[:5000]}

Score each aspect out of 5 and return JSON:
{{
    "format_score": <0-5, proper format, tables, journal entries structure>,
    "heading_score": <0-5, proper headings, sub-headings, labels>,
    "working_notes_score": <0-5, presence and quality of working notes>,
    "neatness_score": <0-5, overall neatness, legibility, organization>,
    "total": <0-20>,
    "feedback": "<brief feedback on presentation>"
}}

Return ONLY valid JSON."""

        response = self._call_ai(prompt)
        try:
            return json.loads(response)
        except (json.JSONDecodeError, TypeError):
            return {
                'format_score': 3, 'heading_score': 3,
                'working_notes_score': 3, 'neatness_score': 3,
                'total': 12, 'feedback': 'Presentation evaluation pending.',
            }

    def _create_evaluation(self, question_results, total_obtained, total_possible,
                            presentation, mistakes, answer_text):
        """Create the Evaluation and related records in the database."""
        from exams.models import Evaluation, QuestionEvaluation
        from .models import MistakeLog, RevisionItem, StudentAnalytics

        percentage = round((total_obtained / total_possible * 100), 1) if total_possible else 0

        # Generate overall feedback using AI
        overall = self._generate_overall_feedback(
            question_results, total_obtained, total_possible,
            percentage, presentation, mistakes
        )

        # Create Evaluation record
        evaluation = Evaluation.objects.create(
            submission=self.submission,
            status='completed',
            total_marks_obtained=total_obtained,
            total_marks_possible=total_possible,
            percentage=percentage,
            presentation_score=presentation.get('total'),
            format_score=presentation.get('format_score'),
            heading_score=presentation.get('heading_score'),
            working_notes_score=presentation.get('working_notes_score'),
            neatness_score=presentation.get('neatness_score'),
            overall_feedback=overall.get('overall_feedback', ''),
            strengths=overall.get('strengths', []),
            areas_to_improve=overall.get('areas_to_improve', []),
            action_plan=overall.get('action_plan', []),
            ai_suggestions=overall.get('ai_suggestions', []),
            improvement_potential=overall.get('improvement_potential'),
            is_ai_evaluated=True,
        )

        # Create per-question evaluations
        for result in question_results:
            QuestionEvaluation.objects.create(
                evaluation=evaluation,
                question=result['question'],
                marks_obtained=result['marks_obtained'],
                marks_possible=result['marks_possible'],
                step_scores=result.get('step_scores', {}),
                concept_marks=result.get('concept_marks', 0),
                format_marks=result.get('format_marks', 0),
                calculation_marks=result.get('calculation_marks', 0),
                working_notes_marks=result.get('working_notes_marks', 0),
                feedback=result.get('feedback', ''),
                missing_points=result.get('missing_points', []),
                student_answer_excerpt=result.get('student_answer_excerpt', ''),
            )

        # Log mistakes
        for mistake in mistakes:
            question = mistake.pop('question', None) if isinstance(mistake, dict) else None
            if isinstance(mistake, dict):
                ml = MistakeLog.objects.create(
                    evaluation=evaluation,
                    question=question,
                    category=mistake.get('category', 'conceptual'),
                    severity=mistake.get('severity', 'moderate'),
                    description=mistake.get('description', ''),
                    marks_lost=mistake.get('marks_lost', 0),
                    suggestion=mistake.get('suggestion', ''),
                )

                # Check for recurring mistakes
                existing = MistakeLog.objects.filter(
                    evaluation__submission__student=self.submission.student,
                    category=ml.category,
                    description__icontains=ml.description[:30],
                ).exclude(id=ml.id).exists()
                if existing:
                    ml.is_recurring = True
                    ml.save()

                    # Add to revision items
                    RevisionItem.objects.update_or_create(
                        student=self.submission.student,
                        title=ml.description[:300],
                        defaults={
                            'description': f"{ml.description}\nSuggestion: {ml.suggestion}",
                            'subject': self.exam_paper.subject,
                            'priority': 'high' if ml.severity == 'major' else 'medium',
                            'occurrence_count': MistakeLog.objects.filter(
                                evaluation__submission__student=self.submission.student,
                                category=ml.category,
                                description__icontains=ml.description[:30],
                            ).count(),
                        }
                    )

        # Update student analytics
        self._update_analytics(evaluation)

    def _generate_overall_feedback(self, question_results, total_obtained,
                                    total_possible, percentage, presentation, mistakes):
        """Generate comprehensive overall feedback."""
        mistake_summary = {}
        for m in mistakes:
            if isinstance(m, dict):
                cat = m.get('category', 'other')
                mistake_summary[cat] = mistake_summary.get(cat, 0) + 1

        prompt = f"""You are a CA/CS/CMA exam coach. Generate comprehensive feedback for a student.

RESULTS:
- Score: {total_obtained}/{total_possible} ({percentage}%)
- Presentation Score: {presentation.get('total', 'N/A')}/20
- Mistake Breakdown: {json.dumps(mistake_summary)}
- Questions attempted: {sum(1 for r in question_results if r.get('marks_obtained', 0) > 0)}/{len(question_results)}

Return JSON:
{{
    "overall_feedback": "<2-3 sentences summarizing performance>",
    "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
    "areas_to_improve": ["<actionable improvement 1>", "<improvement 2>", "<improvement 3>"],
    "action_plan": [
        "<specific action 1: e.g., Practice 2 full papers per week>",
        "<specific action 2>",
        "<specific action 3>"
    ],
    "ai_suggestions": [
        "<pattern-based suggestion 1: e.g., You consistently lose marks in working notes>",
        "<suggestion 2>"
    ],
    "improvement_potential": <estimated achievable score as float>
}}

Be encouraging but honest. Focus on actionable advice specific to CA/CS/CMA exams.
Return ONLY valid JSON."""

        response = self._call_ai(prompt)
        try:
            return json.loads(response)
        except (json.JSONDecodeError, TypeError):
            return {
                'overall_feedback': f'You scored {total_obtained}/{total_possible} ({percentage}%).',
                'strengths': [],
                'areas_to_improve': [],
                'action_plan': [],
                'ai_suggestions': [],
                'improvement_potential': min(percentage + 15, 100),
            }

    def _update_analytics(self, evaluation):
        """Update the StudentAnalytics for this student+subject."""
        from .models import StudentAnalytics
        from exams.models import Evaluation as EvalModel
        from django.db.models import Avg, Max

        student = self.submission.student
        subject = self.exam_paper.subject

        all_evals = EvalModel.objects.filter(
            submission__student=student,
            submission__exam_paper__subject=subject,
            status__in=['completed', 'approved'],
        )

        analytics, created = StudentAnalytics.objects.get_or_create(
            student=student, subject=subject
        )

        analytics.total_attempts = all_evals.count()
        analytics.avg_percentage = all_evals.aggregate(avg=Avg('percentage'))['avg'] or 0
        analytics.best_percentage = all_evals.aggregate(max=Max('percentage'))['max'] or 0
        analytics.latest_percentage = evaluation.percentage or 0

        # Update score history
        history = list(all_evals.order_by('created_at').values_list(
            'created_at', 'percentage', 'submission__exam_paper__title'
        ))
        analytics.score_history = [
            {'date': str(h[0].date()), 'score': h[1], 'paper': h[2]}
            for h in history
        ]

        # Determine level
        if analytics.avg_percentage >= 80:
            analytics.current_level = 'exam_ready'
        elif analytics.avg_percentage >= 65:
            analytics.current_level = 'advanced'
        elif analytics.avg_percentage >= 50:
            analytics.current_level = 'proficient'
        elif analytics.avg_percentage >= 35:
            analytics.current_level = 'improving'
        else:
            analytics.current_level = 'beginner'

        # Calculate improvement rate
        if len(history) >= 2:
            scores = [h[1] for h in history if h[1] is not None]
            if len(scores) >= 2:
                improvements = [scores[i] - scores[i-1] for i in range(1, len(scores))]
                analytics.improvement_rate = sum(improvements) / len(improvements)

        analytics.save()

    def _call_ai(self, prompt: str) -> Optional[str]:
        """Call the AI model (OpenAI API)."""
        api_key = settings.OPENAI_API_KEY
        if not api_key:
            logger.warning("OpenAI API key not configured. Using fallback evaluation.")
            return None

        try:
            from openai import OpenAI
            client = OpenAI(api_key=api_key)

            response = client.chat.completions.create(
                model=settings.AI_MODEL,
                messages=[
                    {"role": "system", "content": "You are an expert CA/CS/CMA exam evaluator. "
                     "Always respond with valid JSON only, no markdown or extra text."},
                    {"role": "user", "content": prompt},
                ],
                temperature=0.3,
                max_tokens=2000,
            )
            content = response.choices[0].message.content.strip()
            # Clean potential markdown wrapping
            if content.startswith('```'):
                content = content.split('\n', 1)[1] if '\n' in content else content[3:]
                if content.endswith('```'):
                    content = content[:-3]
            return content
        except Exception as e:
            logger.error(f"AI call failed: {e}")
            return None
