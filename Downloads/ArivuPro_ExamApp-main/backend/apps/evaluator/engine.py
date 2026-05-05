"""
AI Evaluation Engine — Direct PDF approach.

Mirrors the index.html implementation exactly:
  1. Read student answer PDF as base64
  2. Read suggested answer PDF as base64
  3. Send BOTH directly to Claude (anthropic/claude-sonnet-4-5) via OpenRouter
  4. Claude reads the PDFs natively — no OCR needed
  5. One single API call returns the full evaluation JSON

This matches what the standalone HTML tool does and is the fastest,
most accurate approach for handwritten answer scripts.
"""

import base64
import json
import logging
import os
import re
import traceback
from typing import Optional

from django.conf import settings

logger = logging.getLogger(__name__)

MAX_PDF_BYTES = 8 * 1024 * 1024   # 8 MB base64 limit per file
MAX_TOKENS    = 4096


# ─── Background trigger ────────────────────────────────────────────────────────

def trigger_evaluation(submission_id):
    """Trigger AI evaluation in a background daemon thread."""
    from django.db import close_old_connections
    close_old_connections()

    from apps.exams.models import Submission
    try:
        submission = Submission.objects.get(id=submission_id)
        submission.status = 'processing'
        submission.save()

        EvaluationEngine(submission).evaluate()

        submission.status = 'evaluated'
        submission.save()
        logger.info(f"Evaluation completed for submission {submission_id}")

    except Exception as e:
        logger.error(f"Evaluation FAILED for {submission_id}: {e}\n{traceback.format_exc()}")
        try:
            from django.db import close_old_connections
            close_old_connections()
            sub = Submission.objects.get(id=submission_id)
            sub.status = 'failed'
            sub.save()
        except Exception as ie:
            logger.error(f"Could not mark as failed: {ie}")
    finally:
        from django.db import connection
        connection.close()


# ─── Engine ────────────────────────────────────────────────────────────────────

class EvaluationEngine:

    def __init__(self, submission):
        self.submission = submission
        self.exam_paper  = submission.exam_paper
        self.questions   = self.exam_paper.questions.prefetch_related('marking_steps').all()

    # ── Main pipeline ──────────────────────────────────────────────────────────

    def evaluate(self):
        """
        Full pipeline — every step is try/except so it NEVER raises.
        total_possible comes from Claude's returned max_marks so it reflects
        the actual paper (e.g. 25) not the DB value (e.g. 100).
        """
        questions        = list(self.questions)
        question_results = self._zero_results(questions)
        all_mistakes     = []
        presentation     = self._default_presentation()
        answer_text      = ""
        # Will be overridden by Claude's actual max_marks
        total_possible   = (
            sum(q.marks for q in questions)
            or self.exam_paper.total_marks
            or 100
        )

        try:
            student_b64   = self._read_b64(self.submission.answer_script_file)
            student_ext   = self._file_ext(self.submission.answer_script_file)
            reference_b64 = self._read_b64(self.exam_paper.suggested_answer_file)

            if not student_b64:
                logger.error("No student answer file — cannot evaluate")
            else:
                ai_result = self._call_claude_with_files(
                    questions, student_b64, student_ext, reference_b64
                )
                if ai_result:
                    question_results, all_mistakes, presentation, answer_text, claude_max = ai_result
                    # Use Claude's detected total marks (e.g. 25) not DB value (e.g. 100)
                    if claude_max and claude_max > 0:
                        total_possible = claude_max
                    logger.info(f"AI evaluation complete — total_possible={total_possible}")
                else:
                    logger.error("AI returned no result — check OPENROUTER_API_KEY and logs above")

        except Exception as e:
            logger.error(f"evaluate() unhandled error: {e}\n{traceback.format_exc()}")

        total_obtained = sum(
            float(r.get('marks_obtained') or 0) for r in question_results
        )

        self._create_evaluation(
            question_results=question_results,
            total_obtained=total_obtained,
            total_possible=total_possible,
            presentation=presentation,
            mistakes=all_mistakes,
            answer_text=answer_text,
        )

    # ── File helpers ───────────────────────────────────────────────────────────

    def _read_b64(self, field) -> Optional[str]:
        """Read a Django FileField and return base64 string, or None."""
        try:
            if not field:
                return None
            path = field.path
            if not os.path.exists(path):
                logger.warning(f"File not found: {path}")
                return None
            size = os.path.getsize(path)
            if size > MAX_PDF_BYTES:
                logger.warning(f"File too large ({size/1024/1024:.1f}MB), skipping: {path}")
                return None
            with open(path, 'rb') as f:
                return base64.b64encode(f.read()).decode('utf-8')
        except Exception as e:
            logger.warning(f"_read_b64 failed: {e}")
            return None

    @staticmethod
    def _file_ext(field) -> str:
        try:
            return os.path.splitext(field.name)[1].lower().lstrip('.')
        except Exception:
            return 'pdf'

    # ── Single Claude API call (mirrors the HTML tool) ─────────────────────────

    def _call_claude_with_files(self, questions, student_b64, student_ext,
                                 reference_b64) -> Optional[tuple]:
        """
        Send question paper + suggested answers + student sheet to Claude.
        Returns (question_results, all_mistakes, presentation, answer_text, claude_max)
        or None on failure.
        """
        openrouter_key = getattr(settings, 'OPENROUTER_API_KEY', '')
        if not openrouter_key:
            logger.error("OPENROUTER_API_KEY is empty — cannot call Claude")
            return None

        model              = getattr(settings, 'OPENROUTER_MODEL', 'anthropic/claude-sonnet-4-5')
        subject            = self.exam_paper.subject
        paper_name         = self.exam_paper.title
        question_paper_b64 = self._read_b64(self.exam_paper.question_paper_file)

        logger.info(
            f"Claude call — model={model} | qp={bool(question_paper_b64)} "
            f"| ans={bool(reference_b64)} | student={bool(student_b64)}"
        )

        # ── Improved prompt ────────────────────────────────────────────────────
        prompt = f"""You are a strict, fair examiner grading a student's answer sheet.

PAPER: {paper_name}
SUBJECT: {subject.exam_type} — {subject.name}

You will receive 3 documents in this exact order:
1. QUESTION PAPER — find every question number and its allocated marks
2. SUGGESTED ANSWERS — use as the official marking scheme / model answer
3. STUDENT ANSWER SHEET — the actual student responses you must grade

GRADING RULES:
- Award full marks when the answer is completely correct.
- Award partial marks when the answer is partially correct (e.g. right method, wrong final value).
- Award 0 only when the answer is completely wrong or not attempted.
- Identify every specific error explicitly (wrong formula, wrong organelle, swapped examples, wrong calculation, etc.).
- Set max_marks per question from what the question paper states (e.g. [5 Marks] → 5).
- Set the top-level max_marks to the total marks of the paper.
- total_marks = sum of all marks_obtained.
- Grade EVERY question you find. Do not skip any.

Return ONLY valid JSON — absolutely no markdown, no triple backticks, no text before or after:
{{
  "questions": [
    {{
      "question_no": "1",
      "marks_obtained": 4.0,
      "max_marks": 5.0,
      "feedback": "2-3 sentences citing exactly what the student wrote and why marks were lost",
      "missing_points": ["specific concept or fact the student omitted"],
      "concept_marks": 2.0,
      "format_marks": 1.0,
      "calculation_marks": 1.0,
      "mistakes": [
        {{
          "category": "conceptual",
          "description": "Student wrote F = m + a instead of F = ma",
          "marks_lost": 1.0,
          "severity": "major",
          "suggestion": "Newton's 2nd law is F = ma (product, not sum)"
        }}
      ]
    }}
  ],
  "total_marks": 14.0,
  "max_marks": 25.0,
  "presentation": {{
    "format_score": 3,
    "heading_score": 3,
    "working_notes_score": 3,
    "neatness_score": 3,
    "total": 12,
    "feedback": "one sentence on overall presentation"
  }},
  "overall_feedback": "2-3 coaching sentences summarising the student's performance and key improvements needed"
}}"""

        # ── Build content array — question paper + suggested answers + student sheet ──
        content = [{"type": "text", "text": prompt}]

        # 1. Question paper PDF (Claude reads questions from here)
        if question_paper_b64:
            content.append({
                "type": "file",
                "file": {
                    "filename": "question-paper.pdf",
                    "file_data": f"data:application/pdf;base64,{question_paper_b64}",
                }
            })

        # 2. Suggested answers PDF (marking scheme / model answers)
        if reference_b64:
            content.append({
                "type": "file",
                "file": {
                    "filename": "suggested-answers.pdf",
                    "file_data": f"data:application/pdf;base64,{reference_b64}",
                }
            })

        # 3. Student answer sheet
        if student_b64:
            if student_ext in ('jpg', 'jpeg', 'png', 'webp'):
                mime = {'jpg':'image/jpeg','jpeg':'image/jpeg',
                        'png':'image/png','webp':'image/webp'}.get(student_ext,'image/jpeg')
                content.append({
                    "type": "image_url",
                    "image_url": {"url": f"data:{mime};base64,{student_b64}"},
                })
            else:
                content.append({
                    "type": "file",
                    "file": {
                        "filename": "student-answer-sheet.pdf",
                        "file_data": f"data:application/pdf;base64,{student_b64}",
                    }
                })

        # ── HTTP call to OpenRouter (urllib — no third-party dependency) ─────────
        payload = {
            'model':      model,
            'max_tokens': MAX_TOKENS,
            'messages':   [{'role': 'user', 'content': content}],
        }
        data = self._openrouter_post(openrouter_key, payload, timeout=180)
        if data is None:
            return None
        if data.get('error'):
            logger.error(f"OpenRouter error: {data['error']}")
            return None

        try:
            raw_txt = data['choices'][0]['message']['content']
            if isinstance(raw_txt, list):
                raw_txt = ''.join(b.get('text', '') for b in raw_txt)
            raw_txt = self._strip_markdown(raw_txt.strip())
            logger.info(f"Claude raw response (first 300 chars): {raw_txt[:300]}")
        except (KeyError, IndexError) as e:
            logger.error(f"Unexpected OpenRouter response shape: {e} — {str(data)[:500]}")
            return None

        # ── Parse JSON response ───────────────────────────────────────────────
        return self._parse_ai_response(raw_txt, questions)

    # ── Response parser ────────────────────────────────────────────────────────

    def _parse_ai_response(self, raw_txt: str, questions) -> Optional[tuple]:
        """
        Parse Claude's JSON into (results, mistakes, presentation, overall_text, claude_max).
        claude_max is the total paper marks as Claude detected from the question paper PDF.
        """
        try:
            match = re.search(r'\{[\s\S]*\}', raw_txt)
            if not match:
                logger.error(f"No JSON object in Claude response. Full response: {raw_txt[:500]}")
                return None
            data = json.loads(match.group())
        except (json.JSONDecodeError, Exception) as e:
            logger.error(f"JSON parse failed: {e} — raw (500 chars): {raw_txt[:500]}")
            return None

        question_results = []
        all_mistakes     = []
        q_by_no = {str(q.question_number): q for q in questions}

        ai_questions = data.get('questions', [])
        logger.info(f"Claude returned {len(ai_questions)} question(s) graded")

        for idx, item in enumerate(ai_questions):
            if not isinstance(item, dict):
                continue
            qno = str(item.get('question_no', idx + 1))
            q   = q_by_no.get(qno)
            if q is None and idx < len(questions):
                q = questions[idx]

            max_marks = self._safe_float(item.get('max_marks'), q.marks if q else 0)
            marks     = self._safe_float(item.get('marks_obtained'), 0, max_marks)
            logger.info(f"  Q{qno}: {marks}/{max_marks} — {str(item.get('feedback',''))[:80]}")

            result = {
                'question':              q,
                'marks_obtained':        marks,
                'marks_possible':        max_marks,
                'feedback':              str(item.get('feedback', '')),
                'missing_points':        item.get('missing_points', []) if isinstance(item.get('missing_points'), list) else [],
                'step_scores':           {},
                'concept_marks':         self._safe_float(item.get('concept_marks'), 0),
                'format_marks':          self._safe_float(item.get('format_marks'), 0),
                'calculation_marks':     self._safe_float(item.get('calculation_marks'), 0),
                'working_notes_marks':   0.0,
                'student_answer_excerpt': '',
                'mistakes':              item.get('mistakes', []) if isinstance(item.get('mistakes'), list) else [],
            }
            question_results.append(result)
            for m in result['mistakes']:
                if isinstance(m, dict):
                    all_mistakes.append({**m, 'question': q})

        # Presentation
        pres_raw = data.get('presentation', {}) or {}
        presentation = {
            'format_score':        self._safe_float(pres_raw.get('format_score'), 3),
            'heading_score':       self._safe_float(pres_raw.get('heading_score'), 3),
            'working_notes_score': self._safe_float(pres_raw.get('working_notes_score'), 3),
            'neatness_score':      self._safe_float(pres_raw.get('neatness_score'), 3),
            'total':               self._safe_float(pres_raw.get('total'), 12),
            'feedback':            str(pres_raw.get('feedback', '')),
        }
        presentation['total'] = round(min(
            presentation['format_score'] + presentation['heading_score'] +
            presentation['working_notes_score'] + presentation['neatness_score'], 20
        ), 1)

        # Fill any DB questions Claude skipped
        answered_qs = {r['question'].id for r in question_results if r['question']}
        for q in questions:
            if q.id not in answered_qs:
                question_results.append(self._zero_result(q))

        # Claude's detected total paper marks (e.g. 25 from the question paper PDF)
        claude_max = self._safe_float(data.get('max_marks'), 0)

        answer_text = data.get('overall_feedback', '')
        logger.info(f"Parse complete — questions={len(question_results)} claude_max={claude_max}")
        return question_results, all_mistakes, presentation, answer_text, claude_max

    # ── Fallback helpers ───────────────────────────────────────────────────────

    @staticmethod
    def _default_presentation() -> dict:
        return {'format_score':3,'heading_score':3,'working_notes_score':3,
                'neatness_score':3,'total':12,'feedback':'Pending.'}

    @staticmethod
    def _zero_result(q) -> dict:
        return {
            'question': q, 'marks_obtained': 0, 'marks_possible': q.marks,
            'feedback': 'AI evaluation unavailable. Pending manual review.',
            'missing_points': [], 'step_scores': {},
            'concept_marks': 0, 'format_marks': 0,
            'calculation_marks': 0, 'working_notes_marks': 0,
            'student_answer_excerpt': '', 'mistakes': [],
        }

    def _zero_results(self, questions) -> list:
        return [self._zero_result(q) for q in questions]

    @staticmethod
    def _safe_float(value, default=0.0, maximum=None) -> float:
        try:
            f = float(value or default)
        except (TypeError, ValueError):
            f = float(default)
        if maximum is not None:
            f = min(max(f, 0.0), float(maximum))
        return f

    @staticmethod
    def _strip_markdown(content: str) -> str:
        if content.startswith('```'):
            lines = content.split('\n')
            lines = lines[1:-1] if lines and lines[-1].strip() == '```' else lines[1:]
            content = '\n'.join(lines)
        return content.strip()

    # ── Database save ──────────────────────────────────────────────────────────

    def _create_evaluation(self, question_results, total_obtained, total_possible,
                            presentation, mistakes, answer_text):
        """Persist all evaluation data. Phase 1 must succeed; rest are best-effort."""
        from apps.exams.models import Evaluation, QuestionEvaluation
        from apps.evaluator.models import MistakeLog, RevisionItem

        percentage = round((total_obtained / total_possible * 100), 1) if total_possible else 0

        # Handle re-evaluation
        try:
            existing = self.submission.evaluation
            if existing.status == 'approved':
                logger.info(f"Evaluation {existing.id} already approved — skipping")
                return
            existing.delete()
        except Evaluation.DoesNotExist:
            pass

        # Overall feedback (best-effort AI call)
        overall = self._generate_overall_feedback(
            question_results, total_obtained, total_possible, percentage, presentation
        )

        # Phase 1 — create Evaluation record
        evaluation = Evaluation.objects.create(
            submission=self.submission,
            status='completed',
            total_marks_obtained=total_obtained,
            total_marks_possible=total_possible,
            percentage=percentage,
            presentation_score=presentation.get('total', 12),
            format_score=presentation.get('format_score', 3),
            heading_score=presentation.get('heading_score', 3),
            working_notes_score=presentation.get('working_notes_score', 3),
            neatness_score=presentation.get('neatness_score', 3),
            overall_feedback=overall.get('overall_feedback', answer_text or ''),
            strengths=overall.get('strengths', []),
            areas_to_improve=overall.get('areas_to_improve', []),
            action_plan=overall.get('action_plan', []),
            ai_suggestions=overall.get('ai_suggestions', []),
            improvement_potential=overall.get('improvement_potential', min(percentage + 15, 100)),
            is_ai_evaluated=True,
        )
        logger.info(f"Evaluation {evaluation.id} created — {total_obtained}/{total_possible} ({percentage}%)")

        # Phase 2 — per-question records
        seen = set()
        for r in question_results:
            try:
                q = r.get('question')
                if q is None or q.id in seen:
                    continue
                seen.add(q.id)
                QuestionEvaluation.objects.create(
                    evaluation=evaluation, question=q,
                    marks_obtained=r.get('marks_obtained', 0),
                    marks_possible=r.get('marks_possible', q.marks),
                    step_scores=r.get('step_scores', {}),
                    concept_marks=r.get('concept_marks', 0),
                    format_marks=r.get('format_marks', 0),
                    calculation_marks=r.get('calculation_marks', 0),
                    working_notes_marks=r.get('working_notes_marks', 0),
                    feedback=r.get('feedback', ''),
                    missing_points=r.get('missing_points', []),
                    student_answer_excerpt=r.get('student_answer_excerpt', ''),
                )
            except Exception as e:
                logger.warning(f"QuestionEvaluation save failed: {e}")

        # Phase 3 — mistake logs
        for m in mistakes:
            try:
                if not isinstance(m, dict):
                    continue
                mc = dict(m)
                q  = mc.pop('question', None)
                ml = MistakeLog.objects.create(
                    evaluation=evaluation, question=q,
                    category=mc.get('category', 'conceptual'),
                    severity=mc.get('severity', 'moderate'),
                    description=mc.get('description', ''),
                    marks_lost=mc.get('marks_lost', 0),
                    suggestion=mc.get('suggestion', ''),
                )
                recurring = MistakeLog.objects.filter(
                    evaluation__submission__student=self.submission.student,
                    category=ml.category,
                    description__icontains=ml.description[:30],
                ).exclude(id=ml.id).exists()
                if recurring:
                    ml.is_recurring = True; ml.save()
                    try:
                        RevisionItem.objects.update_or_create(
                            student=self.submission.student,
                            title=ml.description[:300],
                            defaults={
                                'description': ml.description,
                                'subject': self.exam_paper.subject,
                                'priority': 'high' if ml.severity == 'major' else 'medium',
                                'occurrence_count': MistakeLog.objects.filter(
                                    evaluation__submission__student=self.submission.student,
                                    category=ml.category,
                                    description__icontains=ml.description[:30],
                                ).count(),
                            }
                        )
                    except Exception as e:
                        logger.warning(f"RevisionItem save failed: {e}")
            except Exception as e:
                logger.warning(f"MistakeLog save failed: {e}")

        # Phase 4 — analytics
        try:
            self._update_analytics(evaluation)
        except Exception as e:
            logger.warning(f"Analytics update failed: {e}")

    # ── HTTP helper — stdlib only, no third-party dependency ─────────────────

    @staticmethod
    def _openrouter_post(api_key: str, payload: dict, timeout: int = 60) -> Optional[dict]:
        """
        POST to OpenRouter using urllib (Python built-in).
        Works in ANY venv — no requests package needed.
        """
        import urllib.request
        import urllib.error

        body = json.dumps(payload).encode('utf-8')
        req = urllib.request.Request(
            'https://openrouter.ai/api/v1/chat/completions',
            data=body,
            headers={
                'Authorization': f'Bearer {api_key}',
                'Content-Type':  'application/json',
                'HTTP-Referer':  'https://arivupro.com',
                'X-Title':       'ArivuPro Exam Evaluator',
            },
            method='POST',
        )
        try:
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                return json.loads(resp.read().decode('utf-8'))
        except urllib.error.HTTPError as e:
            body_err = e.read().decode('utf-8', errors='ignore')
            logger.error(f"OpenRouter HTTP {e.code}: {body_err[:500]}")
            return None
        except urllib.error.URLError as e:
            logger.error(f"OpenRouter connection error: {e.reason}")
            return None
        except Exception as e:
            logger.error(f"OpenRouter unexpected error: {e}")
            return None

    # ── Overall feedback (small second AI call) ────────────────────────────────

    def _generate_overall_feedback(self, question_results, total_obtained,
                                    total_possible, percentage, presentation) -> dict:
        """Short follow-up AI call for coaching feedback."""
        openrouter_key = getattr(settings, 'OPENROUTER_API_KEY', '')
        if not openrouter_key:
            return self._default_overall(percentage, total_obtained, total_possible)

        model = getattr(settings, 'OPENROUTER_MODEL', 'anthropic/claude-sonnet-4-5')
        attempted = sum(1 for r in question_results if r.get('marks_obtained', 0) > 0)

        prompt = (
            f"CA/CS/CMA exam coach feedback.\n"
            f"Score: {total_obtained}/{total_possible} ({percentage}%)\n"
            f"Presentation: {presentation.get('total','N/A')}/20\n"
            f"Attempted: {attempted}/{len(question_results)} questions\n\n"
            "Return JSON only:\n"
            '{"overall_feedback":"2-3 sentences","strengths":["s1","s2"],'
            '"areas_to_improve":["a1","a2"],"action_plan":["p1","p2"],'
            '"ai_suggestions":["tip1"],"improvement_potential":0.0}'
        )

        try:
            payload = {'model': model, 'max_tokens': 600,
                       'messages': [{'role': 'user', 'content': prompt}]}
            data = self._openrouter_post(openrouter_key, payload, timeout=30)
            if data and not data.get('error'):
                txt = data['choices'][0]['message']['content']
                if isinstance(txt, list):
                    txt = ''.join(b.get('text', '') for b in txt)
                return json.loads(self._strip_markdown(txt.strip()))
        except Exception as e:
            logger.warning(f"Overall feedback AI call failed: {e}")

        return self._default_overall(percentage, total_obtained, total_possible)

    @staticmethod
    def _default_overall(percentage, obtained, possible) -> dict:
        return {
            'overall_feedback': f'Score: {obtained}/{possible} ({percentage}%).',
            'strengths': [], 'areas_to_improve': [], 'action_plan': [],
            'ai_suggestions': [],
            'improvement_potential': min(percentage + 15, 100),
        }

    # ── Analytics ──────────────────────────────────────────────────────────────

    def _update_analytics(self, evaluation):
        from apps.evaluator.models import StudentAnalytics
        from apps.exams.models import Evaluation as EvalModel
        from django.db.models import Avg, Max

        student = self.submission.student
        subject = self.exam_paper.subject
        all_evals = EvalModel.objects.filter(
            submission__student=student,
            submission__exam_paper__subject=subject,
            status__in=['completed', 'approved'],
        )
        analytics, _ = StudentAnalytics.objects.get_or_create(student=student, subject=subject)
        analytics.total_attempts    = all_evals.count()
        analytics.avg_percentage    = all_evals.aggregate(avg=Avg('percentage'))['avg'] or 0
        analytics.best_percentage   = all_evals.aggregate(mx=Max('percentage'))['mx']  or 0
        analytics.latest_percentage = evaluation.percentage or 0

        history = list(all_evals.order_by('created_at').values_list(
            'created_at', 'percentage', 'submission__exam_paper__title'))
        analytics.score_history = [
            {'date': str(h[0].date()), 'score': h[1], 'paper': h[2]} for h in history
        ]
        avg = analytics.avg_percentage
        analytics.current_level = (
            'exam_ready' if avg >= 80 else 'advanced'   if avg >= 65 else
            'proficient' if avg >= 50 else 'improving' if avg >= 35 else 'beginner'
        )
        scores = [h[1] for h in history if h[1] is not None]
        if len(scores) >= 2:
            imps = [scores[i] - scores[i-1] for i in range(1, len(scores))]
            analytics.improvement_rate = sum(imps) / len(imps)
        analytics.save()


