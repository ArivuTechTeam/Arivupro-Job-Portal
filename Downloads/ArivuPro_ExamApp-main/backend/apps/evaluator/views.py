"""Views for evaluation engine and analytics."""

from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Count, Sum, Avg

from .models import MistakeLog, StudentAnalytics, RevisionItem
from .serializers import (
    MistakeLogSerializer, StudentAnalyticsSerializer,
    RevisionItemSerializer, WeakAreaSerializer,
)


class MistakeLibraryViewSet(viewsets.ReadOnlyModelViewSet):
    """Student's personal mistake library."""
    serializer_class = MistakeLogSerializer

    def get_queryset(self):
        user = self.request.user
        qs = MistakeLog.objects.filter(evaluation__submission__student=user)

        # Optional filters
        category = self.request.query_params.get('category')
        if category:
            qs = qs.filter(category=category)

        subject = self.request.query_params.get('subject')
        if subject:
            qs = qs.filter(evaluation__submission__exam_paper__subject_id=subject)

        recurring_only = self.request.query_params.get('recurring')
        if recurring_only == 'true':
            qs = qs.filter(is_recurring=True)

        return qs.order_by('-created_at')

    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get mistake summary by category."""
        qs = self.get_queryset()
        summary = qs.values('category').annotate(
            count=Count('id'),
            total_marks_lost=Sum('marks_lost'),
        ).order_by('-total_marks_lost')
        return Response(list(summary))

    @action(detail=False, methods=['get'])
    def top_mistakes(self, request):
        """Get top 20 most impactful mistakes for revision."""
        limit = int(request.query_params.get('limit', 20))
        qs = self.get_queryset().order_by('-marks_lost')[:limit]
        return Response(MistakeLogSerializer(qs, many=True).data)

    @action(detail=False, methods=['get'])
    def recurring(self, request):
        """Get recurring mistakes — patterns the student keeps repeating."""
        qs = self.get_queryset().filter(is_recurring=True)
        return Response(MistakeLogSerializer(qs, many=True).data)


class StudentAnalyticsViewSet(viewsets.ReadOnlyModelViewSet):
    """Student analytics and progress tracking."""
    serializer_class = StudentAnalyticsSerializer

    def get_queryset(self):
        return StudentAnalytics.objects.filter(student=self.request.user)

    @action(detail=False, methods=['get'])
    def overview(self, request):
        """Get overall analytics across all subjects."""
        analytics = self.get_queryset()
        total_attempts = sum(a.total_attempts for a in analytics)
        avg_score = analytics.aggregate(avg=Avg('avg_percentage'))['avg'] or 0

        return Response({
            'total_subjects': analytics.count(),
            'total_attempts': total_attempts,
            'overall_avg': round(avg_score, 1),
            'subjects': StudentAnalyticsSerializer(analytics, many=True).data,
        })

    @action(detail=False, methods=['get'])
    def weak_areas(self, request):
        """Get weak areas across all subjects."""
        mistakes = MistakeLog.objects.filter(
            evaluation__submission__student=request.user
        )

        # Aggregate by chapter
        chapter_weakness = (
            mistakes.values('chapter_name')
            .annotate(
                count=Count('id'),
                total_marks_lost=Sum('marks_lost'),
            )
            .filter(chapter_name__gt='')
            .order_by('-total_marks_lost')[:10]
        )

        # Aggregate by mistake type
        type_weakness = (
            mistakes.values('category')
            .annotate(
                count=Count('id'),
                total_marks_lost=Sum('marks_lost'),
            )
            .order_by('-total_marks_lost')
        )

        return Response({
            'weak_chapters': list(chapter_weakness),
            'mistake_patterns': list(type_weakness),
        })

    @action(detail=False, methods=['get'])
    def progress_chart(self, request):
        """Get score progression data for charts."""
        subject_id = request.query_params.get('subject')
        analytics = self.get_queryset()
        if subject_id:
            analytics = analytics.filter(subject_id=subject_id)

        data = []
        for a in analytics:
            data.append({
                'subject': a.subject.name,
                'history': a.score_history,
                'current_level': a.current_level,
                'improvement_rate': a.improvement_rate,
            })
        return Response(data)


class RevisionModeView(APIView):
    """Revision mode — consolidated view of what to revise before exams."""

    def get(self, request):
        student = request.user
        subject_id = request.query_params.get('subject')

        # Get revision items
        revision_items = RevisionItem.objects.filter(
            student=student, is_resolved=False
        )
        if subject_id:
            revision_items = revision_items.filter(subject_id=subject_id)

        # Get top recurring mistakes
        recurring_mistakes = MistakeLog.objects.filter(
            evaluation__submission__student=student,
            is_recurring=True,
        )
        if subject_id:
            recurring_mistakes = recurring_mistakes.filter(
                evaluation__submission__exam_paper__subject_id=subject_id
            )

        # Get weak chapters
        weak_chapters = (
            MistakeLog.objects.filter(evaluation__submission__student=student)
            .values('chapter_name')
            .annotate(total_lost=Sum('marks_lost'), count=Count('id'))
            .filter(chapter_name__gt='')
            .order_by('-total_lost')[:5]
        )

        return Response({
            'revision_items': RevisionItemSerializer(
                revision_items[:30], many=True
            ).data,
            'recurring_mistakes': MistakeLogSerializer(
                recurring_mistakes[:20], many=True
            ).data,
            'weak_chapters': list(weak_chapters),
            'total_items': revision_items.count(),
        })

    def patch(self, request):
        """Mark revision items as resolved."""
        item_ids = request.data.get('item_ids', [])
        RevisionItem.objects.filter(
            student=request.user, id__in=item_ids
        ).update(is_resolved=True)
        return Response({'status': 'updated'})


class GamificationView(APIView):
    """Gamification data — streaks, progress, achievements."""

    def get(self, request):
        student = request.user
        from apps.exams.models import Evaluation

        evaluations = Evaluation.objects.filter(
            submission__student=student,
            status__in=['completed', 'approved'],
        ).order_by('created_at')

        scores = list(evaluations.values_list('percentage', flat=True))

        # Calculate streaks
        improvement_streak = 0
        for i in range(len(scores) - 1, 0, -1):
            if scores[i] >= scores[i-1]:
                improvement_streak += 1
            else:
                break

        # Score journey
        journey = []
        for e in evaluations[:20]:
            journey.append({
                'date': str(e.created_at.date()),
                'score': e.percentage,
                'paper': e.submission.exam_paper.title,
            })

        # Achievements
        achievements = []
        if len(scores) >= 1:
            achievements.append({'name': 'First Attempt', 'icon': 'star'})
        if len(scores) >= 5:
            achievements.append({'name': '5 Papers Done', 'icon': 'trophy'})
        if len(scores) >= 10:
            achievements.append({'name': 'Consistent Practicer', 'icon': 'fire'})
        if any(s >= 80 for s in scores):
            achievements.append({'name': 'High Scorer', 'icon': 'medal'})
        if improvement_streak >= 3:
            achievements.append({'name': 'On a Roll', 'icon': 'rocket'})
        if scores and max(scores) - min(scores) >= 20:
            achievements.append({'name': 'Major Improvement', 'icon': 'chart'})

        # Current stats
        latest = scores[-1] if scores else 0
        best = max(scores) if scores else 0
        first = scores[0] if scores else 0

        return Response({
            'total_attempts': len(scores),
            'improvement_streak': improvement_streak,
            'latest_score': latest,
            'best_score': best,
            'total_improvement': round(latest - first, 1) if scores else 0,
            'journey': journey,
            'achievements': achievements,
            'score_summary': f"From {first:.0f} to {latest:.0f}" if len(scores) >= 2 else "Getting started",
        })
