"""URL patterns for exams."""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'subjects', views.SubjectViewSet)
router.register(r'chapters', views.ChapterViewSet, basename='chapter')
router.register(r'papers', views.ExamPaperViewSet, basename='exampaper')
router.register(r'questions', views.QuestionViewSet)
router.register(r'submissions', views.SubmissionViewSet, basename='submission')
router.register(r'evaluations', views.EvaluationViewSet, basename='evaluation')

urlpatterns = [
    path('', include(router.urls)),
]
