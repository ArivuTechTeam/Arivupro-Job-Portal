"""Models for the evaluation engine - mistake tracking and analytics."""

from django.db import models
from django.conf import settings
from exams.models import Evaluation, Question
import uuid


class MistakeLog(models.Model):
    """Tracks every mistake a student makes — powers the Mistake Library."""
    CATEGORY_CHOICES = [
        ('conceptual', 'Conceptual Error'),
        ('presentation', 'Presentation Error'),
        ('calculation', 'Calculation Error'),
        ('step_loss', 'Step/Working Note Missing'),
        ('keyword', 'Missing Keywords (Theory)'),
        ('format', 'Format/Structure Error'),
        ('time_management', 'Time Management'),
    ]

    SEVERITY_CHOICES = [
        ('minor', 'Minor (0.5-1 mark)'),
        ('moderate', 'Moderate (1-3 marks)'),
        ('major', 'Major (3+ marks)'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    evaluation = models.ForeignKey(Evaluation, on_delete=models.CASCADE, related_name='mistakes')
    question = models.ForeignKey(Question, on_delete=models.CASCADE, null=True, blank=True)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    severity = models.CharField(max_length=10, choices=SEVERITY_CHOICES, default='moderate')
    description = models.TextField()
    marks_lost = models.FloatField(default=0)
    suggestion = models.TextField(blank=True, help_text="How to avoid this mistake")
    chapter_name = models.CharField(max_length=200, blank=True)
    is_recurring = models.BooleanField(default=False,
                                       help_text="Has this type of mistake occurred before?")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-marks_lost', 'category']

    def __str__(self):
        return f"[{self.category}] {self.description[:50]} (-{self.marks_lost}m)"


class StudentAnalytics(models.Model):
    """Aggregated analytics per student per subject — powers the dashboard."""
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
                                related_name='analytics')
    subject = models.ForeignKey('exams.Subject', on_delete=models.CASCADE)

    total_attempts = models.PositiveIntegerField(default=0)
    avg_percentage = models.FloatField(default=0)
    best_percentage = models.FloatField(default=0)
    latest_percentage = models.FloatField(default=0)

    # Score progression
    score_history = models.JSONField(default=list, blank=True,
                                     help_text="List of {date, score, paper_title}")

    # Weak chapters
    weak_chapters = models.JSONField(default=list, blank=True,
                                     help_text="List of {chapter, avg_loss, count}")

    # Mistake pattern
    top_mistake_categories = models.JSONField(default=dict, blank=True,
                                              help_text="{category: count}")

    # Presentation trend
    presentation_scores = models.JSONField(default=list, blank=True,
                                           help_text="List of presentation scores over time")

    # Improvement metrics
    improvement_rate = models.FloatField(default=0,
                                         help_text="Avg % improvement per attempt")
    streak_count = models.PositiveIntegerField(default=0)
    current_level = models.CharField(max_length=20, default='beginner',
                                     choices=[
                                         ('beginner', 'Beginner'),
                                         ('improving', 'Improving'),
                                         ('proficient', 'Proficient'),
                                         ('advanced', 'Advanced'),
                                         ('exam_ready', 'Exam Ready'),
                                     ])

    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['student', 'subject']

    def __str__(self):
        return f"{self.student.username} - {self.subject.name}: {self.avg_percentage}%"


class RevisionItem(models.Model):
    """Items flagged for revision before exams."""
    PRIORITY_CHOICES = [
        ('high', 'High Priority'),
        ('medium', 'Medium Priority'),
        ('low', 'Low Priority'),
    ]

    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
                                related_name='revision_items')
    mistake = models.ForeignKey(MistakeLog, on_delete=models.CASCADE, null=True, blank=True)
    title = models.CharField(max_length=300)
    description = models.TextField()
    subject = models.ForeignKey('exams.Subject', on_delete=models.CASCADE)
    chapter = models.CharField(max_length=200, blank=True)
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='medium')
    is_resolved = models.BooleanField(default=False)
    occurrence_count = models.PositiveIntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-occurrence_count', 'priority']

    def __str__(self):
        return f"[{self.priority}] {self.title}"
