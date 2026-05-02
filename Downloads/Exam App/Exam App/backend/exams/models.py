"""Models for exam papers, submissions, and evaluations."""

from django.db import models
from django.conf import settings
import uuid


class Subject(models.Model):
    """Subjects for CA/CS/CMA exams."""
    EXAM_TYPE_CHOICES = [
        ('CA', 'Chartered Accountant'),
        ('CS', 'Company Secretary'),
        ('CMA', 'Cost & Management Accountant'),
    ]

    name = models.CharField(max_length=200)
    code = models.CharField(max_length=20, unique=True)
    exam_type = models.CharField(max_length=5, choices=EXAM_TYPE_CHOICES)
    exam_level = models.CharField(max_length=50)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['exam_type', 'exam_level', 'name']
        unique_together = ['code', 'exam_type']

    def __str__(self):
        return f"{self.name} ({self.exam_type} - {self.exam_level})"


class Chapter(models.Model):
    """Chapters/Topics within a subject."""
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='chapters')
    name = models.CharField(max_length=200)
    chapter_number = models.PositiveIntegerField()
    weightage = models.FloatField(default=0, help_text="Approximate weightage in percentage")

    class Meta:
        ordering = ['chapter_number']
        unique_together = ['subject', 'chapter_number']

    def __str__(self):
        return f"Ch.{self.chapter_number}: {self.name}"


class ExamPaper(models.Model):
    """Question papers uploaded by admin."""
    ATTEMPT_CHOICES = [
        ('mock', 'Mock Test'),
        ('practice', 'Practice Paper'),
        ('past_paper', 'Past Exam Paper'),
        ('rtp', 'Revision Test Paper'),
        ('mtp', 'Mock Test Paper (ICAI)'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=300)
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='papers')
    attempt_type = models.CharField(max_length=20, choices=ATTEMPT_CHOICES)
    exam_session = models.CharField(max_length=50, blank=True, help_text="e.g., May 2025, Nov 2024")
    total_marks = models.PositiveIntegerField()
    duration_minutes = models.PositiveIntegerField(default=180)
    question_paper_file = models.FileField(upload_to='question_papers/')
    suggested_answer_file = models.FileField(upload_to='suggested_answers/', blank=True)

    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
                                   null=True, related_name='created_papers')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_published = models.BooleanField(default=False)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} ({self.subject.code})"


class Question(models.Model):
    """Individual questions within an exam paper."""
    QUESTION_TYPE_CHOICES = [
        ('practical', 'Practical/Numerical'),
        ('theory', 'Theory/Descriptive'),
        ('case_study', 'Case Study'),
        ('mcq', 'Multiple Choice'),
        ('short_note', 'Short Note'),
    ]

    exam_paper = models.ForeignKey(ExamPaper, on_delete=models.CASCADE, related_name='questions')
    question_number = models.CharField(max_length=20, help_text="e.g., 1, 1a, 2b(i)")
    question_text = models.TextField()
    question_type = models.CharField(max_length=20, choices=QUESTION_TYPE_CHOICES)
    marks = models.FloatField()
    chapter = models.ForeignKey(Chapter, on_delete=models.SET_NULL, null=True, blank=True)
    is_compulsory = models.BooleanField(default=True)
    or_group = models.CharField(max_length=10, blank=True,
                                help_text="Questions in the same OR group are alternatives")

    class Meta:
        ordering = ['question_number']

    def __str__(self):
        return f"Q.{self.question_number} ({self.marks} marks)"


class MarkingScheme(models.Model):
    """Step-wise marking scheme for each question."""
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='marking_steps')
    step_number = models.PositiveIntegerField()
    description = models.TextField(help_text="What this step/point expects")
    marks = models.FloatField()

    STEP_TYPE_CHOICES = [
        ('concept', 'Concept/Logic'),
        ('working', 'Working Note'),
        ('format', 'Presentation/Format'),
        ('calculation', 'Calculation'),
        ('conclusion', 'Final Answer/Conclusion'),
        ('keyword', 'Key Term/Keyword'),
        ('section_heading', 'Section/Heading'),
    ]
    step_type = models.CharField(max_length=20, choices=STEP_TYPE_CHOICES, default='concept')
    ideal_answer_text = models.TextField(blank=True,
                                         help_text="The ideal/expected answer for this step")

    class Meta:
        ordering = ['step_number']
        unique_together = ['question', 'step_number']

    def __str__(self):
        return f"Step {self.step_number}: {self.description[:50]} ({self.marks}m)"


class Submission(models.Model):
    """Student answer script submissions."""
    STATUS_CHOICES = [
        ('pending', 'Pending Evaluation'),
        ('processing', 'AI Processing'),
        ('evaluated', 'Evaluated'),
        ('review', 'Under Manual Review'),
        ('completed', 'Completed'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
                                related_name='submissions')
    exam_paper = models.ForeignKey(ExamPaper, on_delete=models.CASCADE, related_name='submissions')
    answer_script_file = models.FileField(upload_to='answer_scripts/')
    additional_pages = models.FileField(upload_to='answer_scripts/additional/', blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')

    # Time tracking for exam simulation
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    time_taken_minutes = models.PositiveIntegerField(null=True, blank=True)
    is_timed_attempt = models.BooleanField(default=False)

    notes = models.TextField(blank=True, help_text="Student notes about this attempt")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Submission by {self.student.username} for {self.exam_paper.title}"


class Evaluation(models.Model):
    """Overall evaluation of a submission."""
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('approved', 'Admin Approved'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    submission = models.OneToOneField(Submission, on_delete=models.CASCADE, related_name='evaluation')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')

    total_marks_obtained = models.FloatField(null=True, blank=True)
    total_marks_possible = models.FloatField(null=True, blank=True)
    percentage = models.FloatField(null=True, blank=True)

    # ICAI Presentation Score (out of 20)
    presentation_score = models.FloatField(null=True, blank=True)
    format_score = models.FloatField(null=True, blank=True, help_text="Score for proper formatting")
    heading_score = models.FloatField(null=True, blank=True, help_text="Score for proper headings")
    working_notes_score = models.FloatField(null=True, blank=True, help_text="Score for working notes")
    neatness_score = models.FloatField(null=True, blank=True, help_text="Score for neatness/cleanliness")

    # AI-generated summary
    overall_feedback = models.TextField(blank=True)
    strengths = models.JSONField(default=list, blank=True)
    areas_to_improve = models.JSONField(default=list, blank=True)
    action_plan = models.JSONField(default=list, blank=True)
    ai_suggestions = models.JSONField(default=list, blank=True)

    # Improvement tracking
    improvement_potential = models.FloatField(null=True, blank=True,
                                              help_text="Estimated potential score")

    # Manual override
    evaluated_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
                                      null=True, blank=True, related_name='evaluations_done')
    is_ai_evaluated = models.BooleanField(default=True)
    admin_remarks = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Evaluation for {self.submission} - {self.total_marks_obtained}/{self.total_marks_possible}"


class QuestionEvaluation(models.Model):
    """Per-question evaluation results."""
    evaluation = models.ForeignKey(Evaluation, on_delete=models.CASCADE,
                                   related_name='question_evaluations')
    question = models.ForeignKey(Question, on_delete=models.CASCADE)
    marks_obtained = models.FloatField(default=0)
    marks_possible = models.FloatField()

    # Step-wise breakdown
    step_scores = models.JSONField(default=dict, blank=True,
                                   help_text="JSON: {step_number: {marks, feedback}}")

    # Categorized marks
    concept_marks = models.FloatField(default=0)
    format_marks = models.FloatField(default=0)
    calculation_marks = models.FloatField(default=0)
    working_notes_marks = models.FloatField(default=0)

    feedback = models.TextField(blank=True)
    missing_points = models.JSONField(default=list, blank=True)
    student_answer_excerpt = models.TextField(blank=True)

    # Time tracking per question (for timed attempts)
    time_spent_minutes = models.FloatField(null=True, blank=True)

    class Meta:
        ordering = ['question__question_number']
        unique_together = ['evaluation', 'question']

    def __str__(self):
        return f"Q.{self.question.question_number}: {self.marks_obtained}/{self.marks_possible}"
