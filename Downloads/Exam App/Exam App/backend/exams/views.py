"""Views for exam management."""

from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Avg, Count, Max, Min

from .models import (
    Subject, Chapter, ExamPaper, Question, MarkingScheme,
    Submission, Evaluation, QuestionEvaluation,
)
from .serializers import (
    SubjectSerializer, SubjectListSerializer, ChapterSerializer,
    ExamPaperSerializer, ExamPaperListSerializer, ExamPaperCreateSerializer,
    QuestionSerializer, QuestionCreateSerializer, MarkingSchemeSerializer,
    SubmissionSerializer, SubmissionCreateSerializer,
    EvaluationSerializer, EvaluationListSerializer,
    QuestionEvaluationSerializer,
)


class IsAdminUser(permissions.BasePermission):
    """Allow only admin users."""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ('admin', 'evaluator')


class IsOwnerOrAdmin(permissions.BasePermission):
    """Allow owners or admins."""
    def has_object_permission(self, request, view, obj):
        if request.user.role in ('admin', 'evaluator'):
            return True
        if hasattr(obj, 'student'):
            return obj.student == request.user
        return False


class SubjectViewSet(viewsets.ModelViewSet):
    """CRUD for subjects."""
    queryset = Subject.objects.filter(is_active=True)
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['exam_type', 'exam_level']
    search_fields = ['name', 'code']

    def get_serializer_class(self):
        if self.action == 'list':
            return SubjectListSerializer
        return SubjectSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.IsAuthenticated()]
        return [IsAdminUser()]


class ChapterViewSet(viewsets.ModelViewSet):
    """CRUD for chapters within a subject."""
    serializer_class = ChapterSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['subject']

    def get_queryset(self):
        return Chapter.objects.all()

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.IsAuthenticated()]
        return [IsAdminUser()]


class ExamPaperViewSet(viewsets.ModelViewSet):
    """CRUD for exam papers - admin creates, students view published ones."""
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['subject', 'attempt_type', 'is_published']
    search_fields = ['title', 'exam_session']
    ordering_fields = ['created_at', 'total_marks']

    def get_queryset(self):
        user = self.request.user
        if user.role in ('admin', 'evaluator'):
            return ExamPaper.objects.all()
        return ExamPaper.objects.filter(is_published=True)

    def get_serializer_class(self):
        if self.action == 'list':
            return ExamPaperListSerializer
        if self.action in ['create', 'update', 'partial_update']:
            return ExamPaperCreateSerializer
        return ExamPaperSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.IsAuthenticated()]
        return [IsAdminUser()]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def add_question(self, request, pk=None):
        """Add a question to the exam paper."""
        paper = self.get_object()
        serializer = QuestionCreateSerializer(data={**request.data, 'exam_paper': paper.pk})
        serializer.is_valid(raise_exception=True)
        question = serializer.save()
        return Response(QuestionSerializer(question).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['get'])
    def questions(self, request, pk=None):
        """List all questions for an exam paper."""
        paper = self.get_object()
        questions = paper.questions.all()
        return Response(QuestionSerializer(questions, many=True).data)

    @action(detail=True, methods=['get'])
    def statistics(self, request, pk=None):
        """Get submission statistics for an exam paper."""
        paper = self.get_object()
        evals = Evaluation.objects.filter(
            submission__exam_paper=paper, status__in=['completed', 'approved']
        )
        return Response({
            'total_submissions': paper.submissions.count(),
            'evaluated_count': evals.count(),
            'avg_score': evals.aggregate(avg=Avg('percentage'))['avg'],
            'highest_score': evals.aggregate(max=Max('total_marks_obtained'))['max'],
            'lowest_score': evals.aggregate(min=Min('total_marks_obtained'))['min'],
        })


class QuestionViewSet(viewsets.ModelViewSet):
    """CRUD for questions."""
    queryset = Question.objects.all()
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['exam_paper', 'question_type', 'chapter']

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return QuestionCreateSerializer
        return QuestionSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.IsAuthenticated()]
        return [IsAdminUser()]

    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def add_marking_step(self, request, pk=None):
        """Add a marking step to a question."""
        question = self.get_object()
        serializer = MarkingSchemeSerializer(data={**request.data, 'question': question.pk})
        serializer.is_valid(raise_exception=True)
        step = serializer.save()
        return Response(MarkingSchemeSerializer(step).data, status=status.HTTP_201_CREATED)


class SubmissionViewSet(viewsets.ModelViewSet):
    """Student submissions."""
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['status', 'exam_paper']
    ordering_fields = ['created_at']

    def get_queryset(self):
        user = self.request.user
        if user.role in ('admin', 'evaluator'):
            return Submission.objects.all()
        return Submission.objects.filter(student=user)

    def get_serializer_class(self):
        if self.action in ['create']:
            return SubmissionCreateSerializer
        return SubmissionSerializer

    def perform_create(self, serializer):
        submission = serializer.save(student=self.request.user, status='pending')
        # Trigger AI evaluation asynchronously (in production, use Celery)
        from evaluator.engine import trigger_evaluation
        trigger_evaluation(submission.id)

    @action(detail=True, methods=['get'])
    def evaluation(self, request, pk=None):
        """Get evaluation for a submission."""
        submission = self.get_object()
        try:
            evaluation = submission.evaluation
            return Response(EvaluationSerializer(evaluation).data)
        except Evaluation.DoesNotExist:
            return Response(
                {'detail': 'Evaluation not yet available.'},
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=True, methods=['get'])
    def report(self, request, pk=None):
        """Get full ICAI-style evaluation report."""
        submission = self.get_object()
        try:
            evaluation = submission.evaluation
        except Evaluation.DoesNotExist:
            return Response(
                {'detail': 'Evaluation not yet available.'},
                status=status.HTTP_404_NOT_FOUND
            )

        from evaluator.models import MistakeLog
        mistakes = MistakeLog.objects.filter(evaluation=evaluation)

        report = {
            'summary': {
                'score': f"{evaluation.total_marks_obtained}/{evaluation.total_marks_possible}",
                'percentage': evaluation.percentage,
                'presentation_score': evaluation.presentation_score,
                'status': evaluation.status,
                'improvement_potential': evaluation.improvement_potential,
            },
            'question_wise_analysis': QuestionEvaluationSerializer(
                evaluation.question_evaluations.all(), many=True
            ).data,
            'mistake_breakdown': {
                'conceptual': list(mistakes.filter(category='conceptual').values(
                    'description', 'question__question_number', 'marks_lost')),
                'presentation': list(mistakes.filter(category='presentation').values(
                    'description', 'question__question_number', 'marks_lost')),
                'calculation': list(mistakes.filter(category='calculation').values(
                    'description', 'question__question_number', 'marks_lost')),
                'step_loss': list(mistakes.filter(category='step_loss').values(
                    'description', 'question__question_number', 'marks_lost')),
            },
            'presentation_breakdown': {
                'format': evaluation.format_score,
                'headings': evaluation.heading_score,
                'working_notes': evaluation.working_notes_score,
                'neatness': evaluation.neatness_score,
                'total': evaluation.presentation_score,
            },
            'strengths': evaluation.strengths,
            'areas_to_improve': evaluation.areas_to_improve,
            'action_plan': evaluation.action_plan,
            'ai_suggestions': evaluation.ai_suggestions,
        }
        return Response(report)


class EvaluationViewSet(viewsets.ReadOnlyModelViewSet):
    """Read-only evaluation results."""
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['status', 'is_ai_evaluated']
    ordering_fields = ['created_at', 'percentage']

    def get_queryset(self):
        user = self.request.user
        if user.role in ('admin', 'evaluator'):
            return Evaluation.objects.all()
        return Evaluation.objects.filter(submission__student=user)

    def get_serializer_class(self):
        if self.action == 'list':
            return EvaluationListSerializer
        return EvaluationSerializer

    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def approve(self, request, pk=None):
        """Admin approves an AI evaluation."""
        evaluation = self.get_object()
        evaluation.status = 'approved'
        evaluation.evaluated_by = request.user
        evaluation.admin_remarks = request.data.get('remarks', '')
        if 'total_marks_obtained' in request.data:
            evaluation.total_marks_obtained = request.data['total_marks_obtained']
            if evaluation.total_marks_possible:
                evaluation.percentage = round(
                    evaluation.total_marks_obtained / evaluation.total_marks_possible * 100, 1
                )
        evaluation.save()
        return Response(EvaluationSerializer(evaluation).data)

    @action(detail=False, methods=['get'])
    def my_history(self, request):
        """Get evaluation history for the current student."""
        evaluations = Evaluation.objects.filter(
            submission__student=request.user,
            status__in=['completed', 'approved']
        ).order_by('created_at')
        return Response(EvaluationListSerializer(evaluations, many=True).data)

    @action(detail=False, methods=['get'])
    def ranking(self, request):
        """Get ranking/benchmarking data."""
        exam_paper_id = request.query_params.get('exam_paper')
        if not exam_paper_id:
            return Response({'detail': 'exam_paper parameter required.'}, status=400)

        evals = Evaluation.objects.filter(
            submission__exam_paper_id=exam_paper_id,
            status__in=['completed', 'approved']
        ).order_by('-percentage')

        total = evals.count()
        user_eval = evals.filter(submission__student=request.user).first()

        if not user_eval:
            return Response({'detail': 'No evaluation found for this paper.'}, status=404)

        rank = list(evals.values_list('id', flat=True)).index(user_eval.id) + 1
        percentile = round((1 - rank / total) * 100, 1) if total > 0 else 0

        avg_score = evals.aggregate(avg=Avg('percentage'))['avg'] or 0
        top_score = evals.first().percentage if evals.exists() else 0

        return Response({
            'your_score': user_eval.percentage,
            'your_rank': rank,
            'total_students': total,
            'percentile': percentile,
            'average_score': round(avg_score, 1),
            'top_score': top_score,
            'message': f"You are in top {100 - percentile:.0f}%" if percentile > 0 else "N/A",
        })
