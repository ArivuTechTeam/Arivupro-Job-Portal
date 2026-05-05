"""Views for user accounts."""

import random
import logging
from django.core.cache import cache
from django.core.mail import send_mail
from django.conf import settings
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import get_user_model
from django.db.models import Q

from .serializers import RegisterSerializer, UserSerializer, UserProfileUpdateSerializer, AdminUserSerializer, NotificationSerializer
from .models import SystemConfig, Notification

logger = logging.getLogger(__name__)

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    """Register a new user — always creates a student account."""
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        data = request.data.copy()
        data['role'] = 'student'  # public registration is always student
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response({
            'user': UserSerializer(user).data,
            'message': 'Account created successfully.',
        }, status=status.HTTP_201_CREATED)


class ProfileView(generics.RetrieveUpdateAPIView):
    """Get or update the current user's profile."""
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user

    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return UserProfileUpdateSerializer
        return UserSerializer


class DashboardStatsView(APIView):
    """Get dashboard statistics for the current user."""

    def get(self, request):
        user = request.user
        from apps.exams.models import Submission, Evaluation

        submissions = Submission.objects.filter(student=user)
        evaluations = Evaluation.objects.filter(submission__student=user, status='completed')

        total_submissions = submissions.count()
        evaluated_count = evaluations.count()

        avg_score = None
        avg_percentage = None
        best_score = None
        if evaluated_count > 0:
            scores = evaluations.values_list('total_marks_obtained', 'submission__exam_paper__total_marks')
            total_obtained = sum(s[0] or 0 for s in scores)
            total_possible = sum(s[1] or 0 for s in scores)
            avg_percentage = round((total_obtained / total_possible * 100), 1) if total_possible else 0
            avg_score = round(total_obtained / evaluated_count, 1)
            best_score = max((s[0] or 0) for s in scores)

        # Weak areas
        from apps.evaluator.models import MistakeLog
        mistake_counts = (
            MistakeLog.objects.filter(evaluation__submission__student=user)
            .values('category')
            .annotate(count=models.Count('id'))
            .order_by('-count')[:5]
        )

        return Response({
            'total_submissions': total_submissions,
            'evaluated_count': evaluated_count,
            'pending_count': submissions.filter(status='pending').count(),
            'avg_score': avg_score,
            'avg_percentage': avg_percentage,
            'best_score': best_score,
            'mistake_breakdown': list(mistake_counts),
            'improvement_streak': self._calculate_streak(evaluations),
        })

    def _calculate_streak(self, evaluations):
        """Calculate consecutive improvement streak."""
        recent = evaluations.order_by('-created_at')[:10]
        scores = [e.percentage for e in recent if e.percentage is not None]
        streak = 0
        for i in range(len(scores) - 1):
            if scores[i] >= scores[i + 1]:
                streak += 1
            else:
                break
        return streak


# Need to import models for the aggregation
from django.db import models


# ── OTP ──────────────────────────────────────────────────────────────────────

class SendOTPView(APIView):
    """Send a 6-digit OTP to the given email address."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email', '').strip().lower()
        if not email or '@' not in email:
            return Response({'error': 'A valid email address is required.'}, status=400)

        otp = str(random.randint(100000, 999999))
        expiry = getattr(settings, 'OTP_EXPIRY_SECONDS', 600)
        cache.set(f'otp_{email}', otp, timeout=expiry)

        try:
            send_mail(
                subject='Your ArivuPro Verification Code',
                message=(
                    f'Hello,\n\n'
                    f'Your ArivuPro email verification code is:\n\n'
                    f'  {otp}\n\n'
                    f'This code is valid for {expiry // 60} minutes.\n'
                    f'If you did not request this, please ignore this email.\n\n'
                    f'— ArivuPro Team'
                ),
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[email],
                fail_silently=False,
            )
        except Exception as exc:
            logger.error('Failed to send OTP email to %s: %s', email, exc)
            # Email failed — return OTP in response so user can still verify
            return Response({'message': 'Email delivery failed. Use the code below to verify.', 'otp': otp})

        return Response({'message': 'OTP sent successfully. Check your inbox.'})


class VerifyOTPView(APIView):
    """Verify a previously sent OTP."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email', '').strip().lower()
        otp = request.data.get('otp', '').strip()

        if not email or not otp:
            return Response({'valid': False, 'error': 'Email and OTP are required.'}, status=400)

        stored = cache.get(f'otp_{email}')
        if not stored:
            return Response({'valid': False, 'error': 'OTP has expired. Please request a new one.'}, status=400)
        if stored != otp:
            return Response({'valid': False, 'error': 'Incorrect OTP. Please try again.'}, status=400)

        cache.delete(f'otp_{email}')
        return Response({'valid': True, 'message': 'Email verified successfully.'})


# ── Admin Registration ────────────────────────────────────────────────────────

class AdminRegisterView(APIView):
    """Self-registration for admin accounts, protected by a secret code."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        admin_code = request.data.get('admin_code', '').strip()
        # DB value takes precedence over .env value
        expected = SystemConfig.get('admin_registration_code') or getattr(settings, 'ADMIN_REGISTRATION_CODE', '')
        if not expected or admin_code != expected:
            return Response({'admin_code': 'Invalid admin registration code.'}, status=400)

        data = {
            'username': request.data.get('username', ''),
            'email': request.data.get('email', ''),
            'first_name': request.data.get('first_name', ''),
            'last_name': request.data.get('last_name', ''),
            'password': request.data.get('password', ''),
            'password_confirm': request.data.get('password_confirm', ''),
            'phone': request.data.get('phone', ''),
            'role': 'admin',
        }

        serializer = RegisterSerializer(data=data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)

        user = serializer.save()
        user.role = 'admin'
        user.is_staff = True
        user.save(update_fields=['role', 'is_staff'])

        return Response({
            'user': UserSerializer(user).data,
            'message': 'Admin account created successfully.',
        }, status=status.HTTP_201_CREATED)


# ── Admin Code Management ─────────────────────────────────────────────────────

class AdminCodeView(APIView):
    """Get or update the admin registration code. Admin only."""

    def _is_admin(self, user):
        return (
            user.is_authenticated and (
                getattr(user, 'role', '') in ('admin', 'evaluator')
                or user.is_staff or user.is_superuser
            )
        )

    def get(self, request):
        if not self._is_admin(request.user):
            return Response({'error': 'Admin access required.'}, status=403)
        # Return DB value if set, else fall back to .env
        code = SystemConfig.get('admin_registration_code') or getattr(settings, 'ADMIN_REGISTRATION_CODE', '')
        return Response({'code': code})

    def post(self, request):
        if not self._is_admin(request.user):
            return Response({'error': 'Admin access required.'}, status=403)
        new_code = request.data.get('code', '').strip()
        if len(new_code) < 6:
            return Response({'error': 'Code must be at least 6 characters.'}, status=400)
        SystemConfig.set('admin_registration_code', new_code)
        return Response({'code': new_code, 'message': 'Admin registration code updated.'})


# ── AI Chat ───────────────────────────────────────────────────────────────────

class AIChatView(APIView):
    """Admin-only AI assistant endpoint backed by OpenAI."""

    def post(self, request):
        is_admin = (
            request.user.is_authenticated and (
                getattr(request.user, 'role', '') in ('admin', 'evaluator')
                or request.user.is_staff or request.user.is_superuser
            )
        )
        if not is_admin:
            return Response({'error': 'Admin access required.'}, status=403)

        messages = request.data.get('messages', [])
        system_prompt = request.data.get('system_prompt', '')

        if not messages:
            return Response({'error': 'messages field is required.'}, status=400)

        # Prefer OpenRouter (Claude), fall back to OpenAI
        openrouter_key = getattr(settings, 'OPENROUTER_API_KEY', '')
        openai_key = getattr(settings, 'OPENAI_API_KEY', '')
        api_key = openrouter_key or openai_key
        if not api_key:
            return Response({'error': 'No AI API key configured on server.'}, status=503)

        default_system = (
            'You are an expert AI assistant for ArivuPro, a score improvement system for '
            'CA / CS / CMA exam candidates in India. You help administrators with: '
            'exam analysis, question creation, student performance insights, marking scheme '
            'suggestions, topic coverage analysis, and general educational guidance. '
            'Be concise, structured, and professional. Use markdown formatting when helpful.'
        )

        try:
            from openai import OpenAI
            client = OpenAI(
                api_key=api_key,
                base_url='https://openrouter.ai/api/v1' if openrouter_key else None,
            )
            model = (
                getattr(settings, 'OPENROUTER_MODEL', 'anthropic/claude-sonnet-4.5')
                if openrouter_key
                else getattr(settings, 'AI_MODEL', 'gpt-4o')
            )
            response = client.chat.completions.create(
                model=model,
                messages=[{'role': 'system', 'content': system_prompt or default_system}] + messages,
                max_tokens=2000,
                temperature=0.7,
            )
            return Response({
                'message': response.choices[0].message.content,
                'usage': {
                    'prompt_tokens': response.usage.prompt_tokens,
                    'completion_tokens': response.usage.completion_tokens,
                    'total_tokens': response.usage.total_tokens,
                },
            })
        except Exception as exc:
            logger.error('AI chat error: %s', exc)
            return Response({'error': f'AI error: {str(exc)}'}, status=500)


class PromoteMeView(APIView):
    """Dev-only: promote the currently authenticated user to admin role.
    Only works when DEBUG=True. Safe because it requires a valid JWT."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        if not getattr(settings, 'DEBUG', False):
            return Response({'error': 'Only available in DEBUG mode.'}, status=403)
        user = request.user
        user.role = 'admin'
        user.is_staff = True
        user.save(update_fields=['role', 'is_staff'])
        return Response({
            'success': True,
            'message': f'User "{user.username}" promoted to admin.',
            'role': user.role,
            'is_staff': user.is_staff,
        })


class IsAdminRole(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        # Accept admin/evaluator role, or any Django staff/superuser
        return (
            getattr(request.user, 'role', '') in ('admin', 'evaluator')
            or request.user.is_staff
            or request.user.is_superuser
        )


class AdminUserListCreateView(generics.ListCreateAPIView):
    """Admin: list all users with search/filter, or create a new user."""
    permission_classes = [IsAdminRole]
    serializer_class = AdminUserSerializer

    def get_queryset(self):
        qs = User.objects.all()
        search = self.request.query_params.get('search', '')
        role = self.request.query_params.get('role', '')
        if search:
            qs = qs.filter(
                Q(username__icontains=search) |
                Q(email__icontains=search) |
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search)
            )
        if role:
            qs = qs.filter(role=role)
        return qs


class AdminUserDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Admin: get, update, or delete a specific user."""
    permission_classes = [IsAdminRole]
    serializer_class = AdminUserSerializer
    queryset = User.objects.all()


class AdminStatsView(APIView):
    """Admin: return user counts by role."""
    permission_classes = [IsAdminRole]

    def get(self, request):
        return Response({
            'total': User.objects.count(),
            'students': User.objects.filter(role='student').count(),
            'admins': User.objects.filter(role='admin').count(),
            'evaluators': User.objects.filter(role='evaluator').count(),
        })


class AdminSettingsView(APIView):
    """Admin: get or update platform settings stored in SystemConfig."""
    permission_classes = [IsAdminRole]

    SETTINGS_KEYS = [
        'platform_name', 'allow_student_registration',
        'ai_auto_evaluate', 'max_file_size_mb',
        'admin_registration_code',
    ]

    def get(self, request):
        data = {}
        for key in self.SETTINGS_KEYS:
            val = SystemConfig.get(key)
            if val is not None:
                data[key] = val
        data.setdefault('platform_name', 'ArivuPro')
        data.setdefault('allow_student_registration', 'true')
        data.setdefault('ai_auto_evaluate', 'true')
        data.setdefault('max_file_size_mb', '20')
        code = SystemConfig.get('admin_registration_code') or getattr(settings, 'ADMIN_REGISTRATION_CODE', '')
        data['admin_registration_code'] = code
        return Response(data)

    def post(self, request):
        for key in self.SETTINGS_KEYS:
            if key in request.data:
                SystemConfig.set(key, str(request.data[key]))
        return Response({'message': 'Settings updated successfully.'})


class AdminBulkActionsView(APIView):
    """Admin: perform bulk operations on users."""
    permission_classes = [IsAdminRole]

    def post(self, request):
        action = request.data.get('action', '')
        ids = request.data.get('ids', [])

        if not action or not ids:
            return Response({'error': 'action and ids are required.'}, status=400)

        qs = User.objects.filter(id__in=ids)
        count = qs.count()

        if action == 'activate':
            qs.update(is_active=True)
        elif action == 'deactivate':
            qs.update(is_active=False)
        elif action == 'delete':
            # Prevent deleting admins via bulk action
            qs.filter(role='student').delete()
        elif action == 'set_role_student':
            qs.update(role='student')
        elif action == 'set_role_evaluator':
            qs.update(role='evaluator')
        else:
            return Response({'error': f'Unknown action: {action}'}, status=400)

        return Response({'message': f'Action "{action}" applied to {count} user(s).', 'count': count})


class NotificationListView(generics.ListAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user, read=False)[:30]


class NotificationReadView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk):
        try:
            notif = Notification.objects.get(id=pk, user=request.user)
            notif.read = True
            notif.save()
            return Response({'ok': True})
        except Notification.DoesNotExist:
            return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)
