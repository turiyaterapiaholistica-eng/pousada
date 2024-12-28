# serializers.py
from rest_framework import serializers
from .models import Categoria, ItemCardapio, Consumacao, ItemConsumacao, Pagamento

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
        fields = ['id', 'nome', 'descricao', 'preco', 'preco_custo', 'categoria', 
                 'categoria_nome', 'categoria_pai_nome', 'disponivel', 'imagem']

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

    class Meta:
        model = Consumacao
        fields = ['id', 'quarto', 'data_hora', 'status', 'itens', 'total', 
                 'isBusinessWorker', 'total_pago', 'saldo']

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