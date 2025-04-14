from rest_framework import serializers
from .models_estoque import Fornecedor, Compra, Estoque, MovimentacaoEstoque, ItemCompra
from .serializers import ItemCardapioSerializer

class FornecedorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Fornecedor
        fields = ['id', 'nome']

class ItemCompraSerializer(serializers.ModelSerializer):
    item_nome = serializers.CharField(source='item.nome', read_only=True)
    categoria_nome = serializers.CharField(source='item.categoria.nome', read_only=True)
    
    class Meta:
        model = ItemCompra
        fields = [
            'id', 'item', 'item_nome', 'categoria_nome',
            'quantidade', 'unidade', 'valor_unitario'
        ]

class CompraSerializer(serializers.ModelSerializer):
    itens = ItemCompraSerializer(many=True, read_only=True)
    fornecedor_nome = serializers.CharField(source='fornecedor.nome', read_only=True)
    
    class Meta:
        model = Compra
        fields = [
            'id', 'data', 'fornecedor', 'fornecedor_nome',
            'nota_fiscal', 'valor_total', 'observacao', 'itens'
        ]

class CompraCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Compra
        fields = [
            'id','fornecedor', 'nota_fiscal', 'observacao'
        ]

class ItemCompraCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ItemCompra
        fields = [
            'compra', 'item', 'quantidade', 'unidade', 'valor_unitario'
        ]

class EstoqueSerializer(serializers.ModelSerializer):
    item_nome = serializers.CharField(source='item.nome', read_only=True)
    categoria_nome = serializers.CharField(source='item.categoria.nome', read_only=True)
    status = serializers.SerializerMethodField()
    valor_total = serializers.SerializerMethodField()
    
    class Meta:
        model = Estoque
        fields = [
            'id', 'item', 'item_nome', 'categoria_nome', 'quantidade', 
            'unidade', 'quantidade_minima', 'ultimo_preco', 
            'ultima_atualizacao', 'status', 'valor_total'
        ]
    
    def get_status(self, obj):
        status = obj.status()
        return {
            'codigo': status,
            'descricao': {
                'normal': 'Normal',
                'baixo': 'Baixo',
                'critico': 'Crítico',
                'sem_estoque': 'Sem estoque'
            }.get(status, 'Desconhecido')
        }
    
    def get_valor_total(self, obj):
        return obj.quantidade * (obj.ultimo_preco or 0)

class MovimentacaoEstoqueSerializer(serializers.ModelSerializer):
    item_nome = serializers.CharField(source='item.nome', read_only=True)
    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)
    valor_total = serializers.SerializerMethodField()
    
    class Meta:
        model = MovimentacaoEstoque
        fields = [
            'id', 'item', 'item_nome', 'data', 'tipo', 'tipo_display',
            'quantidade', 'unidade', 'valor_unitario', 'valor_total',
            'origem', 'observacao'
        ]
    
    def get_valor_total(self, obj):
        if obj.valor_unitario:
            return obj.quantidade * obj.valor_unitario
        return None

class EstoqueAjusteSerializer(serializers.Serializer):
    quantidade = serializers.DecimalField(max_digits=10, decimal_places=3)
    motivo = serializers.CharField(required=True)
    
    def save(self, **kwargs):
        item = kwargs.get('item')
        quantidade = self.validated_data['quantidade']
        motivo = self.validated_data['motivo']
        
        # Obter objeto de estoque
        estoque = Estoque.objects.get(item=item)
        
        # Calcular diferença
        diferenca = quantidade - estoque.quantidade
        
        # Registrar movimentação
        MovimentacaoEstoque.objects.create(
            item=item,
            tipo='ajuste',
            quantidade=abs(diferenca),
            unidade=estoque.unidade,
            valor_unitario=estoque.ultimo_preco,
            origem='Ajuste manual',
            observacao=motivo
        )
        
        # Atualizar estoque
        estoque.quantidade = quantidade
        estoque.save()
        
        # Atualizar disponibilidade
        estoque.atualizar_disponibilidade()
        
        return estoque