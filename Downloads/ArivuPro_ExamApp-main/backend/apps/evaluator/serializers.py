"""Serializers for evaluator models."""

from rest_framework import serializers
from .models import MistakeLog, StudentAnalytics, RevisionItem


class MistakeLogSerializer(serializers.ModelSerializer):
    question_number = serializers.CharField(
        source='question.question_number', read_only=True, default='')
    paper_title = serializers.CharField(
        source='evaluation.submission.exam_paper.title', read_only=True, default='')

    class Meta:
        model = MistakeLog
        fields = [
            'id', 'category', 'severity', 'description', 'marks_lost',
            'suggestion', 'chapter_name', 'is_recurring', 'question_number',
            'paper_title', 'created_at',
        ]


class StudentAnalyticsSerializer(serializers.ModelSerializer):
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    subject_code = serializers.CharField(source='subject.code', read_only=True)

    class Meta:
        model = StudentAnalytics
        fields = [
            'id', 'subject_name', 'subject_code', 'total_attempts',
            'avg_percentage', 'best_percentage', 'latest_percentage',
            'score_history', 'weak_chapters', 'top_mistake_categories',
            'presentation_scores', 'improvement_rate', 'streak_count',
            'current_level', 'updated_at',
        ]


class RevisionItemSerializer(serializers.ModelSerializer):
    subject_name = serializers.CharField(source='subject.name', read_only=True)

    class Meta:
        model = RevisionItem
        fields = [
            'id', 'title', 'description', 'subject_name', 'chapter',
            'priority', 'is_resolved', 'occurrence_count', 'created_at',
        ]


class WeakAreaSerializer(serializers.Serializer):
    chapter_name = serializers.CharField()
    count = serializers.IntegerField()
    total_marks_lost = serializers.FloatField()
