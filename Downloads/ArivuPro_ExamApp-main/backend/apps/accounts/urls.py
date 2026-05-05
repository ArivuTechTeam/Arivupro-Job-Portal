"""URL patterns for accounts."""

from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from . import views

urlpatterns = [
    path('register/', views.RegisterView.as_view(), name='register'),
    path('login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('profile/', views.ProfileView.as_view(), name='profile'),
    path('dashboard/', views.DashboardStatsView.as_view(), name='dashboard-stats'),
    path('send-otp/', views.SendOTPView.as_view(), name='send-otp'),
    path('verify-otp/', views.VerifyOTPView.as_view(), name='verify-otp'),
    path('ai-chat/', views.AIChatView.as_view(), name='ai-chat'),
    path('register-admin/', views.AdminRegisterView.as_view(), name='register-admin'),
    path('admin-code/', views.AdminCodeView.as_view(), name='admin-code'),
    path('promote-me/', views.PromoteMeView.as_view(), name='promote-me'),
    path('notifications/', views.NotificationListView.as_view(), name='notifications'),
    path('notifications/<int:pk>/read/', views.NotificationReadView.as_view(), name='notification-read'),
]
