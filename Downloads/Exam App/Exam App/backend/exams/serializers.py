"""Serializers for exam models."""

from rest_framework import serializers
from .models import (
    Subject, Chapter, ExamPaper, Question, MarkingScheme,
    Submission, Evaluation, QuestionEvaluation,
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
    chapter_name = serializers.CharField(source='chapter.name', read_only=True, default='')

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
            'id', 'title', 'subject_name', 'subject_code', 'attempt_type',
            'exam_session', 'total_marks', 'duration_minutes', 'is_published', 'created_at',
        ]


class ExamPaperCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExamPaper
        fields = [
            'title', 'subject', 'attempt_type', 'exam_session',
            'total_marks', 'duration_minutes', 'question_paper_file',
            'suggested_answer_file', 'is_published',
        ]


class SubmissionSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    exam_paper_title = serializers.CharField(source='exam_paper.title', read_only=True)
    subject_name = serializers.CharField(source='exam_paper.subject.name', read_only=True)
    has_evaluation = serializers.SerializerMethodField()

    class Meta:
        model = Submission
        fields = '__all__'
        read_only_fields = ['student', 'status']

    def get_has_evaluation(self, obj):
        return hasattr(obj, 'evaluation')


class SubmissionCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Submission
        fields = [
            'exam_paper', 'answer_script_file', 'additional_pages',
            'started_at', 'completed_at', 'time_taken_minutes',
            'is_timed_attempt', 'notes',
        ]


class QuestionEvaluationSerializer(serializers.ModelSerializer):
    question_number = serializers.CharField(source='question.question_number', read_only=True)
    question_text = serializers.CharField(source='question.question_text', read_only=True)
    question_type = serializers.CharField(source='question.question_type', read_only=True)

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
    """Lightweight evaluation serializer for lists."""
    exam_paper_title = serializers.CharField(
        source='submission.exam_paper.title', read_only=True)

    class Meta:
        model = Evaluation
        fields = [
            'id', 'exam_paper_title', 'total_marks_obtained',
            'total_marks_possible', 'percentage', 'presentation_score',
            'status', 'is_ai_evaluated', 'created_at',
        ]
