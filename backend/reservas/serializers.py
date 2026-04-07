# reservas/serializers.py
from rest_framework import serializers
from .models import Quarto, Hospede, Reserva, CheckIn, CheckOut

class QuartoSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)
    classe_display = serializers.CharField(source='get_classe_display', read_only=True)

    amenities = serializers.JSONField(required=False)
    camas = serializers.JSONField(required=False)
    
    class Meta:
        model = Quarto
        fields = [
            'id', 'nome', 'tipo', 'tipo_display', 'classe', 'classe_display',
            'capacidade_adultos', 'capacidade_criancas', 'capacidade_maxima',
            'valor_diaria_padrao', 'descricao', 'quantidade', 'status', 'status_display',
            'tamanho', 'tem_vista', 'tipo_banheiro', 'recursos_banheiro', 
            'espaco_externo', 'amenities', 'camas'
        ]

class HospedeSerializer(serializers.ModelSerializer):
    nome_completo = serializers.CharField(read_only=True)
    tipo_documento_display = serializers.CharField(source='get_tipo_documento_display', read_only=True)
    
    class Meta:
        model = Hospede
        fields = [
            'id', 'nome', 'sobrenome', 'nome_completo', 'email', 'telefone',
            'data_nascimento', 'tipo_documento', 'tipo_documento_display', 
            'numero_documento', 'data_cadastro'
        ]

class ReservaListSerializer(serializers.ModelSerializer):
    """Serializer for listing reservations with essential information"""
    quarto_nome = serializers.CharField(source='quarto.nome', read_only=True)
    hospede_nome = serializers.CharField(source='hospede.nome_completo', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = Reserva
        fields = [
            'id', 'quarto', 'quarto_nome', 'hospede', 'hospede_nome', 
            'data_chegada', 'data_saida', 'status', 'status_display',
            'num_adultos', 'num_criancas', 'valor_total'
        ]

class ReservaDetailSerializer(serializers.ModelSerializer):
    """Serializer for detailed reservation view"""
    quarto = QuartoSerializer(read_only=True)
    hospede = HospedeSerializer(read_only=True)
    quarto_id = serializers.PrimaryKeyRelatedField(
        queryset=Quarto.objects.all(), 
        write_only=True,
        source='quarto'
    )
    hospede_id = serializers.PrimaryKeyRelatedField(
        queryset=Hospede.objects.all(),
        write_only=True,
        source='hospede'
    )
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    duracao_estadia = serializers.SerializerMethodField()
    
    class Meta:
        model = Reserva
        fields = [
            'id', 'quarto', 'quarto_id', 'hospede', 'hospede_id',
            'data_chegada', 'data_saida', 'hora_chegada_prevista',
            'hora_saida_prevista', 'num_adultos', 'num_criancas',
            'valor_diaria', 'valor_total', 'status', 'status_display',
            'observacoes', 'data_criacao', 'data_atualizacao',
            'duracao_estadia'
        ]
    
    def get_duracao_estadia(self, obj):
        if obj.data_chegada and obj.data_saida:
            return (obj.data_saida - obj.data_chegada).days
        return None
    
    def create(self, validated_data):
        # Ensure valor_total is calculated if not provided
        instance = super().create(validated_data)
        if not instance.valor_total:
            instance.valor_total = instance.calcular_valor_total()
            instance.save()
        return instance
    
    def update(self, instance, validated_data):
        # Recalculate total value if dates or rate changed
        needs_recalculation = False
        if 'data_chegada' in validated_data or 'data_saida' in validated_data or 'valor_diaria' in validated_data:
            needs_recalculation = True
            
        instance = super().update(instance, validated_data)
        
        if needs_recalculation:
            instance.valor_total = instance.calcular_valor_total()
            instance.save()
            
        return instance

class ReservaCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating new reservations"""
    hospede = HospedeSerializer()
    
    class Meta:
        model = Reserva
        fields = [
            'quarto', 'hospede', 'data_chegada', 'data_saida',
            'hora_chegada_prevista', 'hora_saida_prevista',
            'num_adultos', 'num_criancas', 'valor_diaria',
            'observacoes'
        ]
    
    def create(self, validated_data):
        hospede_data = validated_data.pop('hospede')
        
        # Check if guest already exists
        existing_hospede = None
        if hospede_data.get('email'):
            try:
                existing_hospede = Hospede.objects.get(
                    email=hospede_data['email'],
                    tipo_documento=hospede_data['tipo_documento'],
                    numero_documento=hospede_data['numero_documento']
                )
            except Hospede.DoesNotExist:
                pass
                
        # Create or update guest
        if existing_hospede:
            hospede = existing_hospede
            # Update any changed information
            for key, value in hospede_data.items():
                setattr(hospede, key, value)
            hospede.save()
        else:
            hospede = Hospede.objects.create(**hospede_data)
        
        # Create reservation
        reserva = Reserva.objects.create(
            hospede=hospede,
            **validated_data
        )
        
        return reserva

class CheckInSerializer(serializers.ModelSerializer):
    reserva_id = serializers.PrimaryKeyRelatedField(
        queryset=Reserva.objects.filter(status='confirmada'),
        source='reserva'
    )
    
    class Meta:
        model = CheckIn
        fields = ['id', 'reserva_id', 'data_hora', 'observacoes']
    
    def create(self, validated_data):
        instance = super().create(validated_data)
        
        # Update reservation status
        reserva = instance.reserva
        reserva.status = 'concluida'
        reserva.save()
        
        # Update room status
        quarto = reserva.quarto
        quarto.status = 'ocupado'
        quarto.save()
        
        return instance

class CheckOutSerializer(serializers.ModelSerializer):
    reserva_id = serializers.PrimaryKeyRelatedField(
        queryset=Reserva.objects.filter(status='concluida'),
        source='reserva'
    )
    
    class Meta:
        model = CheckOut
        fields = ['id', 'reserva_id', 'data_hora', 'valor_consumo', 'valor_total', 'observacoes']
    
    def create(self, validated_data):
        # Calculate total value if not provided
        if 'valor_total' not in validated_data:
            reserva = validated_data['reserva']
            valor_consumo = validated_data.get('valor_consumo', 0)
            validated_data['valor_total'] = reserva.valor_total + valor_consumo
        
        instance = super().create(validated_data)
        
        # Update room status
        quarto = instance.reserva.quarto
        quarto.status = 'disponivel'
        quarto.save()
        
        return instance
