"""URL patterns for evaluator."""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'mistakes', views.MistakeLibraryViewSet, basename='mistake')
router.register(r'analytics', views.StudentAnalyticsViewSet, basename='analytics')

urlpatterns = [
    path('', include(router.urls)),
    path('revision/', views.RevisionModeView.as_view(), name='revision'),
    path('gamification/', views.GamificationView.as_view(), name='gamification'),
]
