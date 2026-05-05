from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ['username', 'email', 'role', 'exam_type', 'exam_level', 'is_active']
    list_filter = ['role', 'exam_type', 'exam_level', 'is_active']
    search_fields = ['username', 'email', 'first_name', 'last_name']
    fieldsets = UserAdmin.fieldsets + (
        ('Exam Details', {
            'fields': ('role', 'exam_type', 'exam_level', 'phone', 'avatar',
                       'institute', 'registration_number'),
        }),
    )
