"""User models for ExamReview platform."""

from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """Custom user model supporting student and admin roles."""

    ROLE_CHOICES = [
        ('student', 'Student'),
        ('admin', 'Admin'),
        ('evaluator', 'Evaluator'),
    ]

    EXAM_TYPE_CHOICES = [
        ('CA', 'Chartered Accountant'),
        ('CS', 'Company Secretary'),
        ('CMA', 'Cost & Management Accountant'),
    ]

    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='student')
    exam_type = models.CharField(max_length=5, choices=EXAM_TYPE_CHOICES, blank=True)
    exam_level = models.CharField(max_length=50, blank=True)
    phone = models.CharField(max_length=15, blank=True)
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)
    institute = models.CharField(max_length=200, blank=True)
    registration_number = models.CharField(max_length=50, blank=True,
                                           help_text="ICAI/ICSI/ICMAI Registration Number")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.get_full_name()} ({self.role})"

    @property
    def is_admin_user(self):
        return self.role == 'admin'

    @property
    def is_student(self):
        return self.role == 'student'
