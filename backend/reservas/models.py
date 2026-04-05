# reservas/models.py
from django.db import models
from django.utils import timezone
from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator, RegexValidator

# models.py
from django.db import models

class Quarto(models.Model):
    """Model for rooms in the property with expanded fields to match frontend"""
    # Room types as needed by frontend
    TIPO_CHOICES = [
        ('suite_casal', 'Suíte Casal'),
        ('suite_duplo', 'Suíte Duplo ou Casal'),
        ('suite_quadruplo', 'Suíte Quádruplo')
    ]
    
    # Room classes as needed by frontend
    CLASSE_CHOICES = [
        ('luxo_terreo', 'Luxo Térreo'),
        ('luxo_superior', 'Luxo Superior'),
        ('padrao', 'Padrão')
    ]
    
    # Bathroom types
    TIPO_BANHEIRO_CHOICES = [
        ('privativo', 'Banheiro Privativo'),
        ('compartilhado', 'Banheiro Compartilhado'),
        ('privativo_externo', 'Privativo fora do quarto')
    ]
    
    # Bathroom features
    RECURSOS_BANHEIRO_CHOICES = [
        ('apenas_chuveiro', 'Apenas chuveiro'),
        ('chuveiro_banheira', 'Chuveiro e banheira'),
        ('apenas_banheira', 'Apenas banheira')
    ]
    
    # External space types
    ESPACO_EXTERNO_CHOICES = [
        ('varanda_coberta', 'Varanda coberta'),
        ('varanda_descoberta', 'Varanda sem cobertura'),
        ('patio', 'Pátio'),
        ('jardim', 'Jardim privativo'),
        ('nenhum', 'Nenhum')
    ]
    
    # Basic room info
    nome = models.CharField(max_length=20, unique=True)
    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES, default='suite_casal')
    classe = models.CharField(max_length=20, choices=CLASSE_CHOICES, default='padrao')
    capacidade_adultos = models.PositiveSmallIntegerField(default=2)
    capacidade_criancas = models.PositiveSmallIntegerField(default=1)
    capacidade_maxima = models.PositiveSmallIntegerField(default=2)
    valor_diaria_padrao = models.DecimalField(max_digits=10, decimal_places=2)
    descricao = models.TextField(blank=True)
    quantidade = models.PositiveSmallIntegerField(default=1)
    
    # Room status
    status = models.CharField(
        max_length=20, 
        choices=[
            ('disponivel', 'Disponível'),
            ('ocupado', 'Ocupado'),
            ('manutencao', 'Manutenção'),
            ('bloqueado', 'Bloqueado'),
        ], 
        default='disponivel'
    )
    
    # Additional properties matching frontend
    tamanho = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    tem_vista = models.BooleanField(default=False)
    tipo_banheiro = models.CharField(max_length=30, choices=TIPO_BANHEIRO_CHOICES, default='privativo')
    recursos_banheiro = models.CharField(max_length=30, choices=RECURSOS_BANHEIRO_CHOICES, default='apenas_chuveiro')
    espaco_externo = models.CharField(max_length=30, choices=ESPACO_EXTERNO_CHOICES, default='nenhum')
    
    # Amenities and beds stored as JSON
    amenities = models.JSONField(default=dict)
    camas = models.JSONField(default=list, encoder=None, decoder=None)
    
    def __str__(self):
        return f"Quarto {self.nome} - {self.get_tipo_display()}"
    
    def get_status_display(self):
        """Get display value for status field"""
        for choice in self._meta.get_field('status').choices:
            if choice[0] == self.status:
                return choice[1]
        return self.status
    
    def get_tipo_display(self):
        """Get display value for tipo field"""
        for choice in self._meta.get_field('tipo').choices:
            if choice[0] == self.tipo:
                return choice[1]
        return self.tipo
        
    def get_classe_display(self):
        """Get display value for classe field"""
        for choice in self._meta.get_field('classe').choices:
            if choice[0] == self.classe:
                return choice[1]
        return self.classe
    
    class Meta:
        verbose_name = 'Quarto'
        verbose_name_plural = 'Quartos'
        ordering = ['nome']        

class Hospede(models.Model):
    """Model for guest information"""
    TIPO_DOCUMENTO_CHOICES = [
        ('cpf', 'CPF'),
        ('rg', 'RG'),
        ('passaporte', 'Passaporte'),
    ]
    
    nome = models.CharField(max_length=100)
    sobrenome = models.CharField(max_length=100)
    email = models.EmailField(blank=True)
    telefone = models.CharField(max_length=20, blank=True)
    data_nascimento = models.DateField(null=True, blank=True)
    tipo_documento = models.CharField(max_length=20, choices=TIPO_DOCUMENTO_CHOICES, default='cpf')
    numero_documento = models.CharField(max_length=50)
    data_cadastro = models.DateTimeField(auto_now_add=True)
    
    # Validators for document number based on document type
    cpf_validator = RegexValidator(
        regex=r'^\d{11}$',
        message='CPF deve conter 11 dígitos numéricos'
    )
    
    def clean(self):
        """Validate document number based on document type"""
        if self.tipo_documento == 'cpf':
            try:
                self.cpf_validator(self.numero_documento)
            except ValidationError:
                raise ValidationError({'numero_documento': 'CPF inválido'})
    
    def nome_completo(self):
        return f"{self.nome} {self.sobrenome}"
    
    def __str__(self):
        return self.nome_completo()
    
    class Meta:
        verbose_name = 'Hóspede'
        verbose_name_plural = 'Hóspedes'
        ordering = ['nome', 'sobrenome']

class Reserva(models.Model):
    """Model for room reservations"""
    STATUS_CHOICES = [
        ('confirmada', 'Confirmada'),
        ('pendente', 'Pendente'),
        ('cancelada', 'Cancelada'),
        ('concluida', 'Concluída'),
        ('no_show', 'No Show'),
    ]
    
    quarto = models.ForeignKey(Quarto, on_delete=models.PROTECT, related_name='reservas')
    hospede = models.ForeignKey(Hospede, on_delete=models.PROTECT, related_name='reservas')
    data_chegada = models.DateField()
    data_saida = models.DateField()
    hora_chegada_prevista = models.TimeField(default='14:00')
    hora_saida_prevista = models.TimeField(default='12:00')
    num_adultos = models.PositiveSmallIntegerField(default=1, validators=[MinValueValidator(1)])
    num_criancas = models.PositiveSmallIntegerField(default=0)
    valor_diaria = models.DecimalField(max_digits=10, decimal_places=2)
    valor_total = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pendente')
    observacoes = models.TextField(blank=True)
    data_criacao = models.DateTimeField(auto_now_add=True)
    data_atualizacao = models.DateTimeField(auto_now=True)
    
    def clean(self):
        """Validate reservation dates and guest capacity"""
        if self.data_chegada and self.data_saida:
            if self.data_chegada >= self.data_saida:
                raise ValidationError({'data_saida': 'Data de saída deve ser posterior à data de chegada'})
            
            # Check for overlapping reservations
            sobreposicao = Reserva.objects.filter(
                quarto=self.quarto,
                status__in=['confirmada', 'pendente'],
                data_chegada__lt=self.data_saida,
                data_saida__gt=self.data_chegada
            )
            
            # Exclude self when updating
            if self.pk:
                sobreposicao = sobreposicao.exclude(pk=self.pk)
            
            if sobreposicao.exists():
                raise ValidationError('Já existe uma reserva para este quarto nas datas selecionadas')
            
            # Check room capacity
            if self.quarto:
                if self.num_adultos > self.quarto.capacidade_adultos:
                    raise ValidationError({
                        'num_adultos': f'O quarto suporta no máximo {self.quarto.capacidade_adultos} adultos'
                    })
                if self.num_criancas > self.quarto.capacidade_criancas:
                    raise ValidationError({
                        'num_criancas': f'O quarto suporta no máximo {self.quarto.capacidade_criancas} crianças'
                    })
    
    def calcular_valor_total(self):
        """Calculate total reservation value based on daily rate"""
        if self.data_chegada and self.data_saida and self.valor_diaria:
            dias = (self.data_saida - self.data_chegada).days
            if dias > 0:
                return self.valor_diaria * dias
        return 0
    
    def save(self, *args, **kwargs):
        # Calculate total value if not provided
        if not self.valor_total:
            self.valor_total = self.calcular_valor_total()
            
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"Reserva #{self.id} - {self.hospede.nome_completo()} - {self.data_chegada} a {self.data_saida}"
    
    class Meta:
        verbose_name = 'Reserva'
        verbose_name_plural = 'Reservas'
        ordering = ['-data_chegada', 'quarto']

class CheckIn(models.Model):
    """Model for check-in information"""
    reserva = models.OneToOneField(Reserva, on_delete=models.CASCADE, related_name='checkin')
    data_hora = models.DateTimeField(default=timezone.now)
    observacoes = models.TextField(blank=True)
    
    def __str__(self):
        return f"Check-in {self.reserva}"
    
    class Meta:
        verbose_name = 'Check-in'
        verbose_name_plural = 'Check-ins'

class CheckOut(models.Model):
    """Model for check-out information"""
    reserva = models.OneToOneField(Reserva, on_delete=models.CASCADE, related_name='checkout')
    data_hora = models.DateTimeField(default=timezone.now)
    valor_consumo = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    valor_total = models.DecimalField(max_digits=10, decimal_places=2)
    observacoes = models.TextField(blank=True)
    
    def __str__(self):
        return f"Check-out {self.reserva}"
    
    class Meta:
        verbose_name = 'Check-out'
        verbose_name_plural = 'Check-outs'