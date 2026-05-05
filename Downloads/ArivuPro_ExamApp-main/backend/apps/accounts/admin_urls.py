"""Admin URL patterns for user management."""

from django.urls import path
from . import views

urlpatterns = [
    path('users/', views.AdminUserListCreateView.as_view(), name='admin-user-list'),
    path('users/<int:pk>/', views.AdminUserDetailView.as_view(), name='admin-user-detail'),
    path('stats/', views.AdminStatsView.as_view(), name='admin-stats'),
    path('settings/', views.AdminSettingsView.as_view(), name='admin-settings'),
    path('bulk-actions/', views.AdminBulkActionsView.as_view(), name='admin-bulk-actions'),
]
