# serializers.py
from rest_framework import serializers
from .models import Categoria, ItemCardapio, Consumacao, ItemConsumacao, Pagamento
from django.contrib.auth import authenticate
from django.contrib.auth.models import User

class SubcategoriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Categoria
        fields = ['id', 'nome', 'descricao']

class CategoriaSerializer(serializers.ModelSerializer):
    subcategorias = SubcategoriaSerializer(many=True, read_only=True)
    
    class Meta:
        model = Categoria
        fields = ['id', 'nome', 'descricao', 'categoria_pai', 'subcategorias']

class ItemCardapioSerializer(serializers.ModelSerializer):
    categoria_nome = serializers.CharField(source='categoria.nome', read_only=True)
    categoria_pai_nome = serializers.CharField(source='categoria.categoria_pai.nome', read_only=True)

    class Meta:
        model = ItemCardapio
        fields = ['id', 'nome', 'descricao', 'preco', 'preco_custo', 'preco_compra', 
                 'categoria', 'categoria_nome', 'categoria_pai_nome', 
                 'disponivel', 'venda', 'imagem']
        
class ItemConsumacaoSerializer(serializers.ModelSerializer):
    item = ItemCardapioSerializer(read_only=True)
    
    class Meta:
        model = ItemConsumacao
        fields = ['id', 'item', 'quantidade', 'observacao']

class ConsumacaoSerializer(serializers.ModelSerializer):
    itens = ItemConsumacaoSerializer(source='itemconsumacao_set', many=True, read_only=True)
    total = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    total_pago = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    saldo = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    codigo_valido = serializers.BooleanField(read_only=True)

    class Meta:
        model = Consumacao
        fields = [
            'id', 'quarto', 'nome_cliente', 'data_hora', 'status', 'tipo_cliente',
            'codigo', 'forma_pagamento', 'checkin_date', 'checkout_date',
            'itens', 'total', 'total_pago', 'saldo', 'codigo_valido'
        ]
        read_only_fields = ['codigo_valido']

    # def validate(self, data):
    #     if data.get('tipo_cliente') == 'hospede':
    #         if not data.get('checkin_date'):
    #             raise serializers.ValidationError({'checkin_date': 'Required for guests'})
    #         if not data.get('checkout_date'):
    #             raise serializers.ValidationError({'checkout_date': 'Required for guests'})
    #         if data['checkout_date'] <= data['checkin_date']:
    #             raise serializers.ValidationError({
    #                 'checkout_date': 'Must be after checkin date'
    #             })
    #     return data

    def get_total(self, obj):
        return obj.total()

class PagamentoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Pagamento
        fields = ['id', 'valor', 'data', 'forma_pagamento', 'observacao']
        read_only_fields = ['data']

class ConsumacaoDetailSerializer(ConsumacaoSerializer):
    pagamentos = PagamentoSerializer(many=True, read_only=True)
    
    class Meta(ConsumacaoSerializer.Meta):
        fields = ConsumacaoSerializer.Meta.fields + ['pagamentos']

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'is_staff')

class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField()

    def validate(self, data):
        user = authenticate(**data)
        if user and user.is_active:
            return user
        raise serializers.ValidationError("Incorrect Credentials")