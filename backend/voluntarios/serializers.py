from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Atividade, Badge, Volunteer, VolunteerBadge, Schedule, Task, Occurrence


class AtividadeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Atividade
        fields = '__all__'


class BadgeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Badge
        fields = '__all__'


class VolunteerBadgeSerializer(serializers.ModelSerializer):
    badge = BadgeSerializer(read_only=True)
    badge_id = serializers.PrimaryKeyRelatedField(
        queryset=Badge.objects.all(), source='badge', write_only=True
    )
    concedido_por_nome = serializers.SerializerMethodField()

    def get_concedido_por_nome(self, obj):
        if obj.concedido_por:
            return obj.concedido_por.get_full_name() or obj.concedido_por.username
        return None

    class Meta:
        model = VolunteerBadge
        fields = ['id', 'badge', 'badge_id', 'data_conquista', 'concedido_por_nome']


class VolunteerPublicSerializer(serializers.ModelSerializer):
    nome = serializers.SerializerMethodField()
    semanas_na_pousada = serializers.IntegerField(read_only=True)
    horas_semana = serializers.FloatField(read_only=True)
    turno_hoje = serializers.CharField(read_only=True, allow_null=True)
    habilidades = BadgeSerializer(many=True, read_only=True)
    conquistas = VolunteerBadgeSerializer(many=True, read_only=True)
    total_insignias = serializers.SerializerMethodField()

    def get_nome(self, obj):
        return obj.user.get_full_name() or obj.user.username

    def get_total_insignias(self, obj):
        return obj.habilidades.count() + obj.conquistas.count()

    class Meta:
        model = Volunteer
        fields = [
            'id', 'nome', 'pais_origem', 'idiomas', 'bio', 'data_chegada',
            'semanas_na_pousada', 'horas_semana', 'turno_hoje', 'habilidades',
            'conquistas', 'total_insignias', 'status',
        ]


class VolunteerSerializer(serializers.ModelSerializer):
    nome = serializers.SerializerMethodField()
    username = serializers.CharField(source='user.username', read_only=True)
    semanas_na_pousada = serializers.IntegerField(read_only=True)
    horas_semana = serializers.FloatField(read_only=True)
    turno_hoje = serializers.CharField(read_only=True, allow_null=True)
    habilidades = BadgeSerializer(many=True, read_only=True)
    habilidades_ids = serializers.PrimaryKeyRelatedField(
        queryset=Badge.objects.filter(tipo='habilidade'),
        source='habilidades', many=True, write_only=True, required=False
    )
    conquistas = VolunteerBadgeSerializer(many=True, read_only=True)
    total_insignias = serializers.SerializerMethodField()

    def get_nome(self, obj):
        return obj.user.get_full_name() or obj.user.username

    def get_total_insignias(self, obj):
        return obj.habilidades.count() + obj.conquistas.count()

    class Meta:
        model = Volunteer
        fields = [
            'id', 'nome', 'username', 'pais_origem', 'idiomas', 'bio',
            'data_chegada', 'data_saida', 'semanas_na_pousada', 'horas_semana',
            'turno_hoje', 'habilidades', 'habilidades_ids', 'conquistas',
            'total_insignias', 'status',
        ]


class ScheduleSerializer(serializers.ModelSerializer):
    volunteer_nome = serializers.SerializerMethodField()

    def get_volunteer_nome(self, obj):
        return obj.volunteer.nome

    class Meta:
        model = Schedule
        fields = ['id', 'volunteer', 'volunteer_nome', 'turno', 'data']


class TaskTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Atividade
        fields = [
            'id', 'nome', 'area', 'turno_sugerido', 'tempo_estimado',
            'dificuldade', 'proc_type', 'checklist_steps', 'proc_text',
            'perguntas_finalizacao',
        ]


class TaskSerializer(serializers.ModelSerializer):
    template = TaskTemplateSerializer(read_only=True)
    template_id = serializers.PrimaryKeyRelatedField(
        queryset=Atividade.objects.all(), source='template', write_only=True, required=False
    )
    volunteer_nome = serializers.SerializerMethodField()
    duracao_minutos = serializers.IntegerField(read_only=True, allow_null=True)
    foto_url = serializers.SerializerMethodField()

    def get_volunteer_nome(self, obj):
        return obj.volunteer.nome

    def get_foto_url(self, obj):
        if obj.foto:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.foto.url)
            return obj.foto.url
        return None

    class Meta:
        model = Task
        fields = [
            'id', 'template', 'template_id', 'volunteer', 'volunteer_nome',
            'data', 'turno', 'status',
            'hora_inicio', 'hora_fim', 'horas_gastas', 'duracao_minutos',
            'checklist_progress', 'respostas_finalizacao',
            'foto', 'foto_url', 'problema_reportado', 'notes',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at', 'hora_inicio', 'hora_fim']
        extra_kwargs = {'foto': {'write_only': True, 'required': False}}


class OccurrenceSerializer(serializers.ModelSerializer):
    volunteer_nome = serializers.SerializerMethodField()
    created_by_nome = serializers.SerializerMethodField()

    def get_volunteer_nome(self, obj):
        return obj.volunteer.nome if obj.volunteer else None

    def get_created_by_nome(self, obj):
        if obj.created_by:
            return obj.created_by.get_full_name() or obj.created_by.username
        return None

    class Meta:
        model = Occurrence
        fields = [
            'id', 'tipo', 'prioridade', 'descricao', 'status',
            'volunteer', 'volunteer_nome', 'data',
            'created_by', 'created_by_nome',
        ]
        read_only_fields = ['data']
