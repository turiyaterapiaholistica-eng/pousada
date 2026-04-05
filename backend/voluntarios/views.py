from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.db.models import Sum, Count, Q
from django.utils import timezone
from datetime import date, timedelta

from .models import Atividade, Badge, Volunteer, VolunteerBadge, Schedule, Task, Occurrence
from .serializers import (
    AtividadeSerializer, BadgeSerializer, VolunteerPublicSerializer,
    VolunteerSerializer, VolunteerBadgeSerializer, ScheduleSerializer,
    TaskSerializer, OccurrenceSerializer,
)


class AtividadeViewSet(viewsets.ModelViewSet):
    serializer_class = AtividadeSerializer

    def get_queryset(self):
        queryset = Atividade.objects.all()
        area = self.request.query_params.get('area')
        ativa = self.request.query_params.get('ativa')
        if area:
            queryset = queryset.filter(area=area)
        if ativa is not None:
            queryset = queryset.filter(ativa=ativa.lower() == 'true')
        return queryset


class BadgeViewSet(viewsets.ModelViewSet):
    queryset = Badge.objects.all()
    serializer_class = BadgeSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAuthenticated()]

    def get_queryset(self):
        queryset = Badge.objects.all()
        tipo = self.request.query_params.get('tipo')
        if tipo:
            queryset = queryset.filter(tipo=tipo)
        return queryset


class VolunteerViewSet(viewsets.ModelViewSet):
    queryset = Volunteer.objects.select_related('user').prefetch_related(
        'habilidades', 'conquistas__badge'
    )

    def get_serializer_class(self):
        if self.request.user.is_authenticated and self.request.user.is_staff:
            return VolunteerSerializer
        return VolunteerPublicSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'volunteer_of_week']:
            return [AllowAny()]
        return [IsAuthenticated()]

    def get_queryset(self):
        queryset = super().get_queryset()
        status_filter = self.request.query_params.get('status', 'ativo')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        return queryset

    @action(detail=False, methods=['get'], permission_classes=[AllowAny])
    def volunteer_of_week(self, request):
        hoje = date.today()
        inicio = hoje - timedelta(days=hoje.weekday())
        fim = inicio + timedelta(days=6)
        best = (
            Volunteer.objects.filter(status='ativo')
            .annotate(horas=Sum('tasks__horas_gastas',
                filter=Q(tasks__data__range=(inicio, fim), tasks__status='done')))
            .order_by('-horas', 'data_chegada')
            .first()
        )
        if best:
            return Response(VolunteerPublicSerializer(best).data)
        return Response(None)

    @action(detail=True, methods=['get'], permission_classes=[IsAuthenticated])
    def weekly_hours(self, request, pk=None):
        volunteer = self.get_object()
        hoje = date.today()
        inicio = hoje - timedelta(days=hoje.weekday())
        fim = inicio + timedelta(days=6)
        tasks = Task.objects.filter(volunteer=volunteer, data__range=(inicio, fim), status='done')
        total = sum(t.horas_gastas or 0 for t in tasks)
        return Response({'horas_semana': total, 'meta': 25})

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def me(self, request):
        try:
            volunteer = Volunteer.objects.get(user=request.user)
            return Response(VolunteerSerializer(volunteer).data)
        except Volunteer.DoesNotExist:
            return Response({'detail': 'Perfil de voluntário não encontrado.'}, status=404)


class VolunteerBadgeViewSet(viewsets.ModelViewSet):
    queryset = VolunteerBadge.objects.select_related('volunteer', 'badge', 'concedido_por')
    serializer_class = VolunteerBadgeSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        volunteer_id = self.request.query_params.get('volunteer')
        if volunteer_id:
            queryset = queryset.filter(volunteer_id=volunteer_id)
        return queryset

    def perform_create(self, serializer):
        serializer.save(concedido_por=self.request.user)


class ScheduleViewSet(viewsets.ModelViewSet):
    queryset = Schedule.objects.select_related('volunteer__user')
    serializer_class = ScheduleSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        volunteer_id = self.request.query_params.get('volunteer')
        data = self.request.query_params.get('data')
        if volunteer_id:
            queryset = queryset.filter(volunteer_id=volunteer_id)
        if data:
            queryset = queryset.filter(data=data)
        return queryset

    @action(detail=False, methods=['get'], permission_classes=[AllowAny])
    def weekly_schedule(self, request):
        week_start_str = request.query_params.get('week_start')
        if week_start_str:
            try:
                week_start = date.fromisoformat(week_start_str)
            except ValueError:
                week_start = date.today() - timedelta(days=date.today().weekday())
        else:
            hoje = date.today()
            week_start = hoje - timedelta(days=hoje.weekday())

        week_end = week_start + timedelta(days=6)
        days = [(week_start + timedelta(days=i)).isoformat() for i in range(7)]

        # Todos os voluntários ativos
        volunteers = Volunteer.objects.filter(status='ativo').select_related('user')
        schedules = Schedule.objects.filter(
            data__range=(week_start, week_end),
            volunteer__status='ativo'
        ).select_related('volunteer__user')

        schedule_map = {}
        for s in schedules:
            vid = s.volunteer.id
            if vid not in schedule_map:
                schedule_map[vid] = {}
            schedule_map[vid][str(s.data)] = {'turno': s.turno, 'schedule_id': s.id}

        volunteers_data = [{'id': v.id, 'nome': v.nome} for v in volunteers]

        return Response({
            'days': days,
            'volunteers': volunteers_data,
            'schedule': schedule_map,
        })

    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def set_turno(self, request):
        """Cria ou atualiza o turno de um voluntário em uma data."""
        volunteer_id = request.data.get('volunteer')
        data_str = request.data.get('data')
        turno = request.data.get('turno')

        if not all([volunteer_id, data_str, turno]):
            return Response({'detail': 'volunteer, data e turno são obrigatórios.'}, status=400)

        try:
            volunteer = Volunteer.objects.get(pk=volunteer_id)
            data_obj = date.fromisoformat(data_str)
        except (Volunteer.DoesNotExist, ValueError) as e:
            return Response({'detail': str(e)}, status=400)

        if turno == 'remover':
            Schedule.objects.filter(volunteer=volunteer, data=data_obj).delete()
            return Response({'detail': 'Escala removida.'})

        schedule, _ = Schedule.objects.update_or_create(
            volunteer=volunteer, data=data_obj,
            defaults={'turno': turno}
        )
        return Response(ScheduleSerializer(schedule).data)


class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.select_related('template', 'volunteer__user')
    serializer_class = TaskSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_permissions(self):
        return [IsAuthenticated()]

    def get_queryset(self):
        queryset = super().get_queryset()
        volunteer_id = self.request.query_params.get('volunteer')
        data = self.request.query_params.get('data')
        status_filter = self.request.query_params.get('status')
        if volunteer_id:
            queryset = queryset.filter(volunteer_id=volunteer_id)
        if data:
            queryset = queryset.filter(data=data)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        return queryset

    @action(detail=False, methods=['get'])
    def my_tasks(self, request):
        try:
            volunteer = Volunteer.objects.get(user=request.user)
        except Volunteer.DoesNotExist:
            return Response([])

        data_str = request.query_params.get('data', date.today().isoformat())
        try:
            task_date = date.fromisoformat(data_str)
        except ValueError:
            task_date = date.today()

        tasks = Task.objects.filter(
            volunteer=volunteer, data=task_date
        ).select_related('template').order_by('turno', 'template__nome')
        return Response(TaskSerializer(tasks, many=True, context={'request': request}).data)

    @action(detail=False, methods=['get'])
    def my_week_hours(self, request):
        try:
            volunteer = Volunteer.objects.get(user=request.user)
        except Volunteer.DoesNotExist:
            return Response({'horas_semana': 0, 'meta': 25})

        hoje = date.today()
        inicio = hoje - timedelta(days=hoje.weekday())
        fim = inicio + timedelta(days=6)
        tasks = Task.objects.filter(volunteer=volunteer, data__range=(inicio, fim), status='done')
        total = sum(t.horas_gastas or 0 for t in tasks)
        return Response({'horas_semana': total, 'meta': 25})

    @action(detail=True, methods=['post'])
    def iniciar(self, request, pk=None):
        task = self.get_object()
        if task.status != 'pending':
            return Response({'detail': 'Tarefa já foi iniciada.'}, status=400)
        task.hora_inicio = timezone.now()
        task.status = 'in_progress'
        task.save()
        return Response(TaskSerializer(task, context={'request': request}).data)

    @action(detail=True, methods=['post'])
    def finalizar(self, request, pk=None):
        task = self.get_object()
        if task.status == 'done':
            return Response({'detail': 'Tarefa já foi concluída.'}, status=400)

        task.hora_fim = timezone.now()
        task.status = 'done'

        # Horas gastas: calculadas automaticamente ou informadas manualmente
        horas_gastas = request.data.get('horas_gastas')
        if horas_gastas:
            task.horas_gastas = float(horas_gastas)
        elif task.hora_inicio:
            delta = task.hora_fim - task.hora_inicio
            task.horas_gastas = round(delta.total_seconds() / 3600, 2)

        task.checklist_progress = request.data.get('checklist_progress', task.checklist_progress)
        task.respostas_finalizacao = request.data.get('respostas_finalizacao', {})
        task.problema_reportado = request.data.get('problema_reportado', '')
        task.notes = request.data.get('notes', task.notes)

        if 'foto' in request.FILES:
            task.foto = request.FILES['foto']

        task.save()
        return Response(TaskSerializer(task, context={'request': request}).data)

    @action(detail=False, methods=['get'])
    def dashboard(self, request):
        """Dashboard do gestor: visão geral das tarefas de hoje."""
        hoje_str = request.query_params.get('data', date.today().isoformat())
        try:
            hoje_date = date.fromisoformat(hoje_str)
        except ValueError:
            hoje_date = date.today()

        tasks_hoje = Task.objects.filter(data=hoje_date).select_related('template', 'volunteer__user')

        total = tasks_hoje.count()
        concluidas = tasks_hoje.filter(status='done').count()
        em_andamento = tasks_hoje.filter(status='in_progress').count()
        pendentes = tasks_hoje.filter(status='pending').count()
        com_problema = tasks_hoje.filter(problema_reportado__gt='').count()

        horas_totais = sum(t.horas_gastas or 0 for t in tasks_hoje.filter(status='done'))

        por_area = (
            tasks_hoje.values('template__area')
            .annotate(total=Count('id'), concluidas=Count('id', filter=Q(status='done')))
            .order_by('template__area')
        )

        problemas = TaskSerializer(
            tasks_hoje.filter(problema_reportado__gt=''),
            many=True, context={'request': request}
        ).data

        return Response({
            'data': hoje_str,
            'resumo': {
                'total': total,
                'concluidas': concluidas,
                'em_andamento': em_andamento,
                'pendentes': pendentes,
                'com_problema': com_problema,
                'horas_totais': round(horas_totais, 1),
            },
            'por_area': list(por_area),
            'problemas': problemas,
        })


class OccurrenceViewSet(viewsets.ModelViewSet):
    queryset = Occurrence.objects.select_related('volunteer__user', 'created_by')
    serializer_class = OccurrenceSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        status_filter = self.request.query_params.get('status')
        volunteer_id = self.request.query_params.get('volunteer')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        if volunteer_id:
            queryset = queryset.filter(volunteer_id=volunteer_id)
        return queryset

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
