from django.db import models
from django.contrib.auth.models import User
from datetime import date, timedelta


class Atividade(models.Model):
    AREA_CHOICES = [
        ('Cozinha', 'Cozinha'),
        ('Limpeza', 'Limpeza'),
        ('Jardim', 'Jardim'),
        ('Manutenção', 'Manutenção'),
        ('Administrativo', 'Administrativo'),
    ]
    TURNO_CHOICES = [
        ('6-11h', '6-11h'),
        ('11-16h', '11-16h'),
        ('16-21h', '16-21h'),
        ('Flexível', 'Flexível'),
    ]
    DIFICULDADE_CHOICES = [
        ('Baixa', 'Baixa'),
        ('Média', 'Média'),
        ('Alta', 'Alta'),
    ]
    FREQUENCIA_CHOICES = [
        ('Diária', 'Diária'),
        ('2x semana', '2x semana'),
        ('3x semana', '3x semana'),
        ('Semanal', 'Semanal'),
        ('Quinzenal', 'Quinzenal'),
        ('Mensal', 'Mensal'),
        ('Conforme demanda', 'Conforme demanda'),
    ]
    PROC_TYPE_CHOICES = [
        ('checklist', 'Checklist'),
        ('text', 'Texto livre'),
    ]

    nome = models.CharField(max_length=200)
    area = models.CharField(max_length=50, choices=AREA_CHOICES)
    turno_sugerido = models.CharField(max_length=20, choices=TURNO_CHOICES)
    tempo_estimado = models.DecimalField(max_digits=4, decimal_places=1)
    dificuldade = models.CharField(max_length=10, choices=DIFICULDADE_CHOICES, default='Baixa')
    frequencia = models.CharField(max_length=20, choices=FREQUENCIA_CHOICES, default='Diária')
    proc_type = models.CharField(max_length=10, choices=PROC_TYPE_CHOICES, default='checklist')
    checklist_steps = models.JSONField(default=list, blank=True)
    proc_text = models.TextField(blank=True)
    ativa = models.BooleanField(default=True)
    # Perguntas exibidas após o voluntário clicar em Finalizar
    # Formato: [{"id": "q1", "texto": "...", "tipo": "sim_nao|texto|numero"}]
    perguntas_finalizacao = models.JSONField(default=list, blank=True)
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.nome} ({self.area})"

    class Meta:
        verbose_name = 'Atividade'
        verbose_name_plural = 'Atividades'
        ordering = ['area', 'nome']


class Badge(models.Model):
    TIPO_CHOICES = [
        ('habilidade', 'Habilidade'),
        ('conquista', 'Conquista'),
    ]
    nome = models.CharField(max_length=100)
    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES)
    descricao = models.TextField(blank=True)
    icone = models.CharField(max_length=50, blank=True)

    def __str__(self):
        return f"{self.nome} ({self.tipo})"

    class Meta:
        verbose_name = 'Insígnia'
        verbose_name_plural = 'Insígnias'
        ordering = ['tipo', 'nome']


class Volunteer(models.Model):
    STATUS_CHOICES = [
        ('ativo', 'Ativo'),
        ('saiu', 'Saiu'),
        ('aguardando', 'Aguardando'),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='volunteer_profile')
    foto = models.ImageField(upload_to='volunteers/', blank=True)
    data_chegada = models.DateField()
    data_saida = models.DateField(null=True, blank=True)
    pais_origem = models.CharField(max_length=100, blank=True)
    idiomas = models.CharField(max_length=200, blank=True)
    bio = models.TextField(blank=True)
    habilidades = models.ManyToManyField(Badge, related_name='volunteers', blank=True,
                                         limit_choices_to={'tipo': 'habilidade'})
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='ativo')

    def __str__(self):
        return self.user.get_full_name() or self.user.username

    @property
    def nome(self):
        return self.user.get_full_name() or self.user.username

    @property
    def semanas_na_pousada(self):
        delta = date.today() - self.data_chegada
        return max(0, delta.days // 7)

    @property
    def horas_semana(self):
        hoje = date.today()
        inicio = hoje - timedelta(days=hoje.weekday())
        fim = inicio + timedelta(days=6)
        total = Task.objects.filter(
            volunteer=self,
            data__range=(inicio, fim),
            status='done'
        ).values_list('horas_gastas', flat=True)
        return float(sum(h for h in total if h is not None))

    @property
    def turno_hoje(self):
        schedule = Schedule.objects.filter(volunteer=self, data=date.today()).first()
        return schedule.turno if schedule else None

    class Meta:
        verbose_name = 'Voluntário'
        verbose_name_plural = 'Voluntários'
        ordering = ['user__first_name', 'user__last_name']


class VolunteerBadge(models.Model):
    volunteer = models.ForeignKey(Volunteer, on_delete=models.CASCADE, related_name='conquistas')
    badge = models.ForeignKey(Badge, on_delete=models.CASCADE)
    data_conquista = models.DateField(auto_now_add=True)
    concedido_por = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL,
                                      related_name='badges_concedidos')

    def __str__(self):
        return f"{self.volunteer} — {self.badge.nome}"

    class Meta:
        verbose_name = 'Conquista'
        verbose_name_plural = 'Conquistas'
        unique_together = ['volunteer', 'badge']


class Schedule(models.Model):
    TURNO_CHOICES = [
        ('6-11h', '6-11h'),
        ('11-16h', '11-16h'),
        ('16-21h', '16-21h'),
        ('folga', 'Folga'),
        ('Flexível', 'Flexível'),
    ]

    volunteer = models.ForeignKey(Volunteer, on_delete=models.CASCADE, related_name='schedules')
    turno = models.CharField(max_length=20, choices=TURNO_CHOICES)
    data = models.DateField()

    def __str__(self):
        return f"{self.volunteer} — {self.data} ({self.turno})"

    class Meta:
        verbose_name = 'Escala'
        verbose_name_plural = 'Escalas'
        unique_together = ['volunteer', 'data']
        ordering = ['data', 'volunteer']


class Task(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pendente'),
        ('in_progress', 'Em andamento'),
        ('done', 'Concluída'),
    ]

    template = models.ForeignKey(Atividade, on_delete=models.CASCADE, related_name='tasks')
    volunteer = models.ForeignKey(Volunteer, on_delete=models.CASCADE, related_name='tasks')
    data = models.DateField()
    turno = models.CharField(max_length=20, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')

    # Controle de tempo
    hora_inicio = models.DateTimeField(null=True, blank=True)
    hora_fim = models.DateTimeField(null=True, blank=True)
    horas_gastas = models.FloatField(null=True, blank=True)

    # Execução
    checklist_progress = models.JSONField(default=list)
    respostas_finalizacao = models.JSONField(default=dict, blank=True)

    # Extras
    foto = models.ImageField(upload_to='tasks/fotos/', null=True, blank=True)
    problema_reportado = models.TextField(blank=True)
    notes = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.template.nome} — {self.volunteer} ({self.data})"

    @property
    def duracao_minutos(self):
        if self.hora_inicio and self.hora_fim:
            delta = self.hora_fim - self.hora_inicio
            return int(delta.total_seconds() / 60)
        return None

    class Meta:
        verbose_name = 'Tarefa'
        verbose_name_plural = 'Tarefas'
        ordering = ['data', 'turno', 'template__nome']


class Occurrence(models.Model):
    TIPO_CHOICES = [
        ('manutenção', 'Manutenção'),
        ('comportamento', 'Comportamento'),
        ('saúde', 'Saúde'),
        ('segurança', 'Segurança'),
        ('outros', 'Outros'),
    ]
    PRIORIDADE_CHOICES = [
        ('baixa', 'Baixa'),
        ('média', 'Média'),
        ('alta', 'Alta'),
        ('urgente', 'Urgente'),
    ]
    STATUS_CHOICES = [
        ('aberto', 'Aberto'),
        ('em_andamento', 'Em andamento'),
        ('resolvido', 'Resolvido'),
    ]

    tipo = models.CharField(max_length=50, choices=TIPO_CHOICES)
    prioridade = models.CharField(max_length=20, choices=PRIORIDADE_CHOICES)
    descricao = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='aberto')
    volunteer = models.ForeignKey(Volunteer, null=True, blank=True,
                                  on_delete=models.SET_NULL, related_name='occurrences')
    data = models.DateField(auto_now_add=True)
    created_by = models.ForeignKey(User, null=True, blank=True,
                                   on_delete=models.SET_NULL, related_name='occurrences_criadas')

    def __str__(self):
        return f"{self.tipo} — {self.prioridade} ({self.data})"

    class Meta:
        verbose_name = 'Ocorrência'
        verbose_name_plural = 'Ocorrências'
        ordering = ['-data', 'prioridade']
