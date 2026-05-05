from rest_framework import viewsets, permissions, filters
from django_filters.rest_framework import DjangoFilterBackend
from django.contrib.auth import get_user_model

from .admin_serializers import UserAdminSerializer

User = get_user_model()

class IsAdminUser(permissions.BasePermission):
    """Allow only admin users."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'admin')

class UserAdminViewSet(viewsets.ModelViewSet):
    """
    CRUD for users via Admin Portal.
    Allows creating students, teachers, or other admins.
    """
    queryset = User.objects.all().order_by('-created_at')
    serializer_class = UserAdminSerializer
    permission_classes = [IsAdminUser]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['role', 'is_active', 'exam_type']
    search_fields = ['username', 'email', 'first_name', 'last_name']
