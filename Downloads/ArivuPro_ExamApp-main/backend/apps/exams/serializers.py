"""Serializers for exam models."""

from rest_framework import serializers
from .models import (
    Subject, Chapter, ExamPaper, Question, MarkingScheme,
    Submission, Evaluation, QuestionEvaluation, PDFDocument,
    FacultyValidationRequest,
)


class ChapterSerializer(serializers.ModelSerializer):
    class Meta:
        model = Chapter
        fields = '__all__'


class SubjectSerializer(serializers.ModelSerializer):
    chapters = ChapterSerializer(many=True, read_only=True)

    class Meta:
        model = Subject
        fields = '__all__'


class SubjectListSerializer(serializers.ModelSerializer):
    """Lightweight subject serializer for lists."""
    class Meta:
        model = Subject
        fields = ['id', 'name', 'code', 'exam_type', 'exam_level']


class MarkingSchemeSerializer(serializers.ModelSerializer):
    class Meta:
        model = MarkingScheme
        fields = '__all__'


class QuestionSerializer(serializers.ModelSerializer):
    marking_steps = MarkingSchemeSerializer(many=True, read_only=True)
    chapter_name = serializers.CharField(source='chapter', read_only=True, default='')

    class Meta:
        model = Question
        fields = '__all__'


class QuestionCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating questions with marking scheme."""
    marking_steps = MarkingSchemeSerializer(many=True, required=False)

    class Meta:
        model = Question
        fields = '__all__'

    def create(self, validated_data):
        steps_data = validated_data.pop('marking_steps', [])
        question = Question.objects.create(**validated_data)
        for step_data in steps_data:
            MarkingScheme.objects.create(question=question, **step_data)
        return question


class ExamPaperSerializer(serializers.ModelSerializer):
    questions = QuestionSerializer(many=True, read_only=True)
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    subject_code = serializers.CharField(source='subject.code', read_only=True)
    submission_count = serializers.SerializerMethodField()

    class Meta:
        model = ExamPaper
        fields = '__all__'

    def get_submission_count(self, obj):
        return obj.submissions.count()


class ExamPaperListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for listing exam papers."""
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    subject_code = serializers.CharField(source='subject.code', read_only=True)

    class Meta:
        model = ExamPaper
        fields = [
            'id', 'title', 'course_name', 'subject_name', 'subject_code', 'attempt_type',
            'exam_session', 'total_marks', 'duration_minutes', 'is_published', 'created_at',
            'question_paper_file', 'suggested_answer_file',
        ]


class ExamPaperCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExamPaper
        fields = [
            'id', 'title', 'course_name', 'subject', 'attempt_type', 'exam_session',
            'total_marks', 'duration_minutes', 'question_paper_file',
            'suggested_answer_file', 'is_published',
        ]
        read_only_fields = ['id']


class SubmissionSerializer(serializers.ModelSerializer):
    student_name     = serializers.CharField(source='student.get_full_name', read_only=True)
    student_username = serializers.CharField(source='student.username', read_only=True)
    student_email    = serializers.EmailField(source='student.email', read_only=True)
    exam_paper_title = serializers.CharField(source='exam_paper.title', read_only=True)
    subject_name     = serializers.CharField(source='exam_paper.subject.name', read_only=True)
    total_marks      = serializers.IntegerField(source='exam_paper.total_marks', read_only=True)
    has_evaluation   = serializers.SerializerMethodField()
    marks_obtained   = serializers.SerializerMethodField()
    marks_possible   = serializers.SerializerMethodField()
    eval_percentage  = serializers.SerializerMethodField()
    eval_status      = serializers.SerializerMethodField()

    class Meta:
        model = Submission
        fields = '__all__'
        read_only_fields = ['student', 'status']

    def get_has_evaluation(self, obj):
        try:
            return obj.evaluation is not None
        except Exception:
            return False

    def get_marks_obtained(self, obj):
        try:
            return obj.evaluation.total_marks_obtained
        except Exception:
            return None

    def get_marks_possible(self, obj):
        try:
            return obj.evaluation.total_marks_possible
        except Exception:
            return obj.exam_paper.total_marks

    def get_eval_percentage(self, obj):
        try:
            return obj.evaluation.percentage
        except Exception:
            return None

    def get_eval_status(self, obj):
        try:
            return obj.evaluation.status
        except Exception:
            return None


class SubmissionCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Submission
        fields = [
            'id',
            'exam_paper', 'answer_script_file', 'additional_pages',
            'started_at', 'completed_at', 'time_taken_minutes',
            'is_timed_attempt', 'notes',
        ]
        read_only_fields = ['id']


class QuestionEvaluationSerializer(serializers.ModelSerializer):
    # Works for both step-wise (question FK) and holistic (null FK) modes
    question_number = serializers.SerializerMethodField()
    question_text   = serializers.SerializerMethodField()
    question_type   = serializers.SerializerMethodField()

    def _meta(self, obj):
        """Return holistic metadata stored in step_scores JSON."""
        ss = obj.step_scores
        return ss if isinstance(ss, dict) and 'q_number' in ss else {}

    def get_question_number(self, obj):
        if obj.question:
            return obj.question.question_number
        return self._meta(obj).get('q_number')

    def get_question_text(self, obj):
        if obj.question:
            return obj.question.question_text
        return self._meta(obj).get('q_text')

    def get_question_type(self, obj):
        if obj.question:
            return obj.question.question_type
        return self._meta(obj).get('q_type', 'descriptive')

    class Meta:
        model = QuestionEvaluation
        fields = '__all__'


class EvaluationSerializer(serializers.ModelSerializer):
    question_evaluations = QuestionEvaluationSerializer(many=True, read_only=True)
    student_name = serializers.CharField(
        source='submission.student.get_full_name', read_only=True)
    exam_paper_title = serializers.CharField(
        source='submission.exam_paper.title', read_only=True)
    subject_name = serializers.CharField(
        source='submission.exam_paper.subject.name', read_only=True)

    class Meta:
        model = Evaluation
        fields = '__all__'


class EvaluationListSerializer(serializers.ModelSerializer):
    """Lightweight evaluation serializer for admin lists."""
    exam_paper_title  = serializers.CharField(source='submission.exam_paper.title', read_only=True)
    subject_name      = serializers.CharField(source='submission.exam_paper.subject.name', read_only=True)
    student_name      = serializers.SerializerMethodField()
    student_username  = serializers.CharField(source='submission.student.username', read_only=True)
    submission_id     = serializers.UUIDField(source='submission.id', read_only=True)
    answer_script_url = serializers.SerializerMethodField()

    class Meta:
        model = Evaluation
        fields = [
            'id', 'submission_id',
            'student_name', 'student_username', 'exam_paper_title', 'subject_name',
            'total_marks_obtained', 'total_marks_possible', 'percentage',
            'presentation_score', 'status', 'is_ai_evaluated', 'created_at',
            'answer_script_url',
        ]

    def get_student_name(self, obj):
        user = obj.submission.student
        full = user.get_full_name()
        return full if full.strip() else user.username

    def get_answer_script_url(self, obj):
        request = self.context.get('request')
        sf = obj.submission.answer_script_file
        if sf and request:
            try:
                return request.build_absolute_uri(sf.url)
            except Exception:
                pass
        return None


class FacultyValidationRequestSerializer(serializers.ModelSerializer):
    """Full serializer for admin — includes student contact details."""
    student_name     = serializers.SerializerMethodField()
    student_email    = serializers.EmailField(source='submission.student.email', read_only=True)
    student_phone    = serializers.CharField(source='submission.student.phone', read_only=True, default='')
    student_username = serializers.CharField(source='submission.student.username', read_only=True)
    paper_title      = serializers.CharField(source='submission.exam_paper.title', read_only=True)
    subject_name     = serializers.CharField(source='submission.exam_paper.subject.name', read_only=True)
    submission_id    = serializers.UUIDField(source='submission.id', read_only=True)
    answer_script_url = serializers.SerializerMethodField()
    ai_score         = serializers.SerializerMethodField()

    class Meta:
        model = FacultyValidationRequest
        fields = [
            'id', 'status', 'note', 'faculty_name', 'admin_remarks',
            'student_name', 'student_email', 'student_phone', 'student_username',
            'paper_title', 'subject_name', 'submission_id',
            'answer_script_url', 'ai_score',
            'reviewed_by', 'reviewed_at', 'created_at',
        ]
        read_only_fields = ['id', 'created_at']

    def get_student_name(self, obj):
        u = obj.submission.student
        full = u.get_full_name()
        return full.strip() if full.strip() else u.username

    def get_answer_script_url(self, obj):
        request = self.context.get('request')
        sf = obj.submission.answer_script_file
        if sf and request:
            try:
                return request.build_absolute_uri(sf.url)
            except Exception:
                pass
        return None

    def get_ai_score(self, obj):
        try:
            ev = obj.submission.evaluation
            return f"{ev.total_marks_obtained}/{ev.total_marks_possible} ({ev.percentage}%)"
        except Exception:
            return None


class PDFDocumentSerializer(serializers.ModelSerializer):
    filename = serializers.SerializerMethodField()

    class Meta:
        model = PDFDocument
        fields = [
            'id', 'title', 'pdf_file', 'filename', 'ai_summary',
            'key_points', 'status', 'created_at',
        ]
        read_only_fields = ['id', 'ai_summary', 'key_points', 'status', 'created_at']

    def get_filename(self, obj):
        return obj.pdf_file.name.split('/')[-1] if obj.pdf_file else ''


class PDFDocumentCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = PDFDocument
        fields = ['pdf_file', 'title']
