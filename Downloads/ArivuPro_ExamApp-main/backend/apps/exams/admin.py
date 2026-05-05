"""Admin configuration for exams."""

from django.contrib import admin
from .models import (
    Subject, Chapter, ExamPaper, Question, MarkingScheme,
    Submission, Evaluation, QuestionEvaluation,
)


class ChapterInline(admin.TabularInline):
    model = Chapter
    extra = 1


@admin.register(Subject)
class SubjectAdmin(admin.ModelAdmin):
    list_display = ['name', 'code', 'exam_type', 'exam_level', 'is_active']
    list_filter = ['exam_type', 'exam_level', 'is_active']
    search_fields = ['name', 'code']
    inlines = [ChapterInline]


class QuestionInline(admin.TabularInline):
    model = Question
    extra = 1
    fields = ['question_number', 'question_type', 'marks', 'is_compulsory']


class MarkingSchemeInline(admin.TabularInline):
    model = MarkingScheme
    extra = 1


@admin.register(ExamPaper)
class ExamPaperAdmin(admin.ModelAdmin):
    list_display = ['title', 'subject', 'attempt_type', 'total_marks', 'is_published', 'created_at']
    list_filter = ['attempt_type', 'is_published', 'subject__exam_type']
    search_fields = ['title', 'exam_session']
    inlines = [QuestionInline]


@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ['question_number', 'exam_paper', 'question_type', 'marks']
    list_filter = ['question_type', 'exam_paper__subject']
    inlines = [MarkingSchemeInline]


@admin.register(Submission)
class SubmissionAdmin(admin.ModelAdmin):
    list_display = ['student', 'exam_paper', 'status', 'is_timed_attempt', 'created_at']
    list_filter = ['status', 'is_timed_attempt']
    search_fields = ['student__username', 'exam_paper__title']


class QuestionEvaluationInline(admin.TabularInline):
    model = QuestionEvaluation
    extra = 0
    readonly_fields = ['question', 'marks_obtained', 'marks_possible']


@admin.register(Evaluation)
class EvaluationAdmin(admin.ModelAdmin):
    list_display = ['submission', 'total_marks_obtained', 'total_marks_possible',
                    'percentage', 'status', 'is_ai_evaluated']
    list_filter = ['status', 'is_ai_evaluated']
    inlines = [QuestionEvaluationInline]
