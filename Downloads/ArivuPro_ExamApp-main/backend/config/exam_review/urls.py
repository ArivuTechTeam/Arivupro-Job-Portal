"""URL configuration for ExamReview platform."""

from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.views.static import serve

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('apps.accounts.urls')),
    path('api/admin/', include('apps.accounts.admin_urls')),
    path('api/exams/', include('apps.exams.urls')),
    path('api/evaluate/', include('apps.evaluator.urls')),
    # Serve uploaded media files in both dev and production (Railway volume)
    re_path(r'^media/(?P<path>.*)$', serve, {'document_root': settings.MEDIA_ROOT}),
]
