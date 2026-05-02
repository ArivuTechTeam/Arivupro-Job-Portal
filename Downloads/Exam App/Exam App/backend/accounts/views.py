"""Views for user accounts."""

from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import get_user_model

from .serializers import RegisterSerializer, UserSerializer, UserProfileUpdateSerializer

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    """Register a new user."""
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
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
        from exams.models import Submission, Evaluation

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
        from evaluator.models import MistakeLog
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
