from django.contrib import admin
from .models import MistakeLog, StudentAnalytics, RevisionItem


@admin.register(MistakeLog)
class MistakeLogAdmin(admin.ModelAdmin):
    list_display = ['category', 'severity', 'description', 'marks_lost', 'is_recurring', 'created_at']
    list_filter = ['category', 'severity', 'is_recurring']
    search_fields = ['description']


@admin.register(StudentAnalytics)
class StudentAnalyticsAdmin(admin.ModelAdmin):
    list_display = ['student', 'subject', 'total_attempts', 'avg_percentage', 'current_level']
    list_filter = ['current_level', 'subject']


@admin.register(RevisionItem)
class RevisionItemAdmin(admin.ModelAdmin):
    list_display = ['student', 'title', 'subject', 'priority', 'is_resolved', 'occurrence_count']
    list_filter = ['priority', 'is_resolved']
