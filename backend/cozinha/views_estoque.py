from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction
from django.db.models import Sum, F, Q, ExpressionWrapper, DecimalField
from django.utils import timezone
from datetime import datetime, timedelta

from .models import ItemCardapio
from .models_estoque import Fornecedor, Compra, Estoque, MovimentacaoEstoque, ItemCompra

from .serializers_estoque import (
    FornecedorSerializer,
    CompraSerializer,
    CompraCreateSerializer,
    ItemCompraSerializer,
    ItemCompraCreateSerializer,
    EstoqueSerializer,
    MovimentacaoEstoqueSerializer,
    EstoqueAjusteSerializer
)

class FornecedorViewSet(viewsets.ModelViewSet):
    queryset = Fornecedor.objects.all()
    serializer_class = FornecedorSerializer
    
    def create(self, request, *args, **kwargs):
        # Log para debug
        print("Dados recebidos:", request.data)
        
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

class CompraViewSet(viewsets.ModelViewSet):
    queryset = Compra.objects.prefetch_related('itens', 'itens__item').all()
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return CompraCreateSerializer
        return CompraSerializer
    
    def get_queryset(self):
        queryset = self.queryset
        
        # Filtro por fornecedor
        fornecedor_id = self.request.query_params.get('fornecedor')
        if fornecedor_id:
            queryset = queryset.filter(fornecedor_id=fornecedor_id)
        
        # Filtro por período
        data_inicio = self.request.query_params.get('data_inicio')
        data_fim = self.request.query_params.get('data_fim')
        
        if data_inicio:
            try:
                data_inicio = datetime.strptime(data_inicio, '%Y-%m-%d')
                queryset = queryset.filter(data__gte=data_inicio)
            except ValueError:
                pass
        
        if data_fim:
            try:
                data_fim = datetime.strptime(data_fim, '%Y-%m-%d')
                data_fim = data_fim.replace(hour=23, minute=59, second=59)
                queryset = queryset.filter(data__lte=data_fim)
            except ValueError:
                pass
        
        # Adicionar um campo 'ativa' ao modelo Compra para indicar se está ativa
        # Retornar apenas compras ativas
        queryset = queryset.filter(ativa=True)
        
        return queryset
    
    def destroy(self, request, *args, **kwargs):
        """
        Implementa uma exclusão lógica das compras,
        atualizando o campo 'ativa' para False ao invés de excluir o registro
        """
        instance = self.get_object()
        
        # Atualização para exclusão lógica
        instance.ativa = False
        instance.save()
        
        # Reverter os efeitos da compra no estoque
        self.reverter_efeitos_compra(instance)
        
        return Response(status=status.HTTP_204_NO_CONTENT)
    
    def reverter_efeitos_compra(self, compra):
        """
        Reverte os efeitos da compra no estoque quando ela é excluída
        """
        # Para cada item da compra
        for item_compra in compra.itens.all():
            try:
                # Obter o estoque do item
                estoque = Estoque.objects.get(item=item_compra.item)
                
                # Registrar movimentação negativa no estoque
                MovimentacaoEstoque.objects.create(
                    item=item_compra.item,
                    tipo='ajuste',
                    quantidade=item_compra.quantidade,
                    unidade=item_compra.unidade,
                    valor_unitario=item_compra.valor_unitario,
                    origem=f"Exclusão da Compra #{compra.id}",
                    observacao="Exclusão de compra"
                )
                
                # Atualizar quantidade em estoque
                estoque.quantidade = max(0, estoque.quantidade - item_compra.quantidade)
                estoque.save()
                
                # Atualizar disponibilidade
                estoque.atualizar_disponibilidade()
                
            except Estoque.DoesNotExist:
                # Se não existir estoque para este item, apenas ignoramos
                pass
    
    @action(detail=True, methods=['post'])
    def adicionar_item(self, request, pk=None):
        compra = self.get_object()
        
        # Verificar se estamos recebendo um ou múltiplos itens
        itens_data = request.data.get('itens')
        
        if itens_data and isinstance(itens_data, list):
            # Processamento em lote
            itens_criados = []
            with transaction.atomic():
                for item_data in itens_data:
                    item_data['compra'] = compra.id
                    serializer = ItemCompraCreateSerializer(data=item_data)
                    
                    if serializer.is_valid():
                        item = serializer.save()
                        itens_criados.append(item)
                    else:
                        return Response(
                            serializer.errors,
                            status=status.HTTP_400_BAD_REQUEST
                        )
            
            # Recalcular o total da compra
            compra.calcular_total()
            
            return Response(
                ItemCompraSerializer(itens_criados, many=True).data,
                status=status.HTTP_201_CREATED
            )
        else:
            # Processamento de um único item
            data = request.data.copy()
            data['compra'] = compra.id
            
            serializer = ItemCompraCreateSerializer(data=data)
            if serializer.is_valid():
                item = serializer.save()
                return Response(
                    ItemCompraSerializer(item).data,
                    status=status.HTTP_201_CREATED
                )
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )
    
    def update(self, request, *args, **kwargs):
        """
        Implementação da atualização de compras
        """
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        
        # Retorna o objeto atualizado com todos os dados
        return Response(CompraSerializer(instance).data)
    
    @action(detail=False, methods=['get'])
    def dashboard_data(self, request):
        # Obter período 
        data_inicio = request.query_params.get('data_inicio')
        data_fim = request.query_params.get('data_fim')
        
        if data_inicio:
            try:
                data_inicio = datetime.strptime(data_inicio, '%Y-%m-%d')
            except ValueError:
                data_inicio = timezone.now() - timedelta(days=30)
        else:
            data_inicio = timezone.now() - timedelta(days=30)
        
        if data_fim:
            try:
                data_fim = datetime.strptime(data_fim, '%Y-%m-%d')
                data_fim = data_fim.replace(hour=23, minute=59, second=59)
            except ValueError:
                data_fim = timezone.now()
        else:
            data_fim = timezone.now()
        
        # Total de compras no período
        total_compras = Compra.objects.filter(
            data__range=(data_inicio, data_fim),
            ativa=True  # Somente compras ativas
        ).aggregate(
            total=Sum('valor_total')
        )['total'] or 0
        
        # Compras por fornecedor
        compras_por_fornecedor = Compra.objects.filter(
            data__range=(data_inicio, data_fim),
            ativa=True  # Somente compras ativas
        ).values(
            'fornecedor__nome'
        ).annotate(
            total=Sum('valor_total')
        ).order_by('-total')
        
        # Itens mais comprados (por valor)
        itens_mais_comprados = ItemCompra.objects.filter(
            compra__data__range=(data_inicio, data_fim),
            compra__ativa=True  # Somente itens de compras ativas
        ).values(
            'item__nome'
        ).annotate(
            total_valor=Sum(F('quantidade') * F('valor_unitario')),
            total_quantidade=Sum('quantidade')
        ).order_by('-total_valor')[:10]
        
        # Total de compras por dia
        compras_por_dia = Compra.objects.filter(
            data__range=(data_inicio, data_fim),
            ativa=True  # Somente compras ativas
        ).extra(
            select={'dia': "DATE(data)"}
        ).values('dia').annotate(
            total=Sum('valor_total')
        ).order_by('dia')
        
        return Response({
            'total_compras': total_compras,
            'compras_por_fornecedor': list(compras_por_fornecedor),
            'itens_mais_comprados': list(itens_mais_comprados),
            'compras_por_dia': list(compras_por_dia)
        })
    
class ItemCompraViewSet(viewsets.ModelViewSet):
    queryset = ItemCompra.objects.all()
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return ItemCompraCreateSerializer
        return ItemCompraSerializer
    
    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        
        # Salva valores antigos para ajuste de estoque
        quantidade_antiga = instance.quantidade
        
        # Atualiza item
        partial = kwargs.pop('partial', False)
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        
        # Se a quantidade foi alterada, precisa ajustar o estoque
        if quantidade_antiga != instance.quantidade:
            try:
                estoque = Estoque.objects.get(item=instance.item)
                
                # Calcula a diferença
                diferenca = instance.quantidade - quantidade_antiga
                
                # Atualiza estoque
                estoque.quantidade = F('quantidade') + diferenca
                estoque.save()
                estoque.refresh_from_db()
                
                # Registra movimentação
                MovimentacaoEstoque.objects.create(
                    item=instance.item,
                    tipo='ajuste',
                    quantidade=abs(diferenca),
                    unidade=instance.unidade,
                    valor_unitario=instance.valor_unitario,
                    origem=f"Ajuste de item compra #{instance.compra.id}",
                    observacao="Atualização de item de compra"
                )
                
                # Atualiza disponibilidade
                estoque.atualizar_disponibilidade()
                
            except Estoque.DoesNotExist:
                # Se não existir estoque, não faz nada
                pass
        
        # Recalcula o total da compra
        instance.compra.calcular_total()
        
        return Response(ItemCompraSerializer(instance).data)

class EstoqueViewSet(viewsets.ModelViewSet):
    queryset = Estoque.objects.select_related('item', 'item__categoria').all()
    serializer_class = EstoqueSerializer
    
    def get_queryset(self):
        queryset = self.queryset
        
        # Filtro por categoria
        categoria_id = self.request.query_params.get('categoria')
        if categoria_id:
            queryset = queryset.filter(item__categoria_id=categoria_id)
        
        # Filtro por status
        status = self.request.query_params.get('status')
        if status:
            if status == 'sem_estoque':
                queryset = queryset.filter(quantidade__lte=0)
            elif status == 'critico':
                queryset = queryset.filter(
                    quantidade__gt=0,
                    quantidade__lte=F('quantidade_minima') * 0.5
                )
            elif status == 'baixo':
                queryset = queryset.filter(
                    quantidade__gt=F('quantidade_minima') * 0.5,
                    quantidade__lte=F('quantidade_minima')
                )
        
        # Filtro por nome
        nome = self.request.query_params.get('nome')
        if nome:
            queryset = queryset.filter(item__nome__icontains=nome)
        
        return queryset
    
    @action(detail=True, methods=['post'])
    def ajustar(self, request, pk=None):
        estoque = self.get_object()
        
        serializer = EstoqueAjusteSerializer(data=request.data)
        if serializer.is_valid():
            estoque_atualizado = serializer.save(item=estoque.item)
            return Response(
                EstoqueSerializer(estoque_atualizado).data
            )
        
        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )
    
    @action(detail=False, methods=['get'])
    def dashboard_data(self, request):
        # Total de itens em estoque
        total_itens = Estoque.objects.count()
        
        # Valor total em estoque
        valor_total = Estoque.objects.annotate(
            valor_item=ExpressionWrapper(
                F('quantidade') * F('ultimo_preco'),
                output_field=DecimalField()
            )
        ).aggregate(
            total=Sum('valor_item')
        )['total'] or 0
        
        # Itens sem estoque
        itens_sem_estoque = Estoque.objects.filter(quantidade__lte=0).count()
        
        # Itens com estoque crítico
        itens_criticos = Estoque.objects.filter(
            quantidade__gt=0,
            quantidade__lte=F('quantidade_minima') * 0.5
        ).count()
        
        # Itens com estoque baixo
        itens_baixos = Estoque.objects.filter(
            quantidade__gt=F('quantidade_minima') * 0.5,
            quantidade__lte=F('quantidade_minima')
        ).count()
        
        # Top 10 itens mais valiosos em estoque
        itens_mais_valiosos = Estoque.objects.annotate(
            valor_total=ExpressionWrapper(
                F('quantidade') * F('ultimo_preco'),
                output_field=DecimalField()
            )
        ).select_related('item').values(
            'item__nome', 'quantidade', 'unidade', 'valor_total'
        ).order_by('-valor_total')[:10]
        
        return Response({
            'total_itens': total_itens,
            'valor_total': valor_total,
            'itens_sem_estoque': itens_sem_estoque,
            'itens_criticos': itens_criticos,
            'itens_baixos': itens_baixos,
            'itens_mais_valiosos': list(itens_mais_valiosos)
        })
    
    @action(detail=False, methods=['post'])
    def inicializar(self, request):
        """Inicializa o estoque para todos os itens do cardápio que não têm registro"""
        itens_sem_estoque = ItemCardapio.objects.filter(
            ~Q(estoque__isnull=False)
        )
        
        itens_criados = []
        for item in itens_sem_estoque:
            estoque = Estoque.objects.create(
                item=item,
                quantidade=0,
                unidade='un',
                quantidade_minima=10
            )
            itens_criados.append(estoque)
        
        return Response({
            'message': f'Estoque inicializado para {len(itens_criados)} itens',
            'itens': EstoqueSerializer(itens_criados, many=True).data
        })

class MovimentacaoEstoqueViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = MovimentacaoEstoque.objects.select_related('item').all()
    serializer_class = MovimentacaoEstoqueSerializer
    
    def get_queryset(self):
        queryset = self.queryset
        
        # Filtro por item
        item_id = self.request.query_params.get('item')
        if item_id:
            queryset = queryset.filter(item_id=item_id)
        
        # Filtro por tipo
        tipo = self.request.query_params.get('tipo')
        if tipo:
            queryset = queryset.filter(tipo=tipo)
        
        # Filtro por período
        data_inicio = self.request.query_params.get('data_inicio')
        data_fim = self.request.query_params.get('data_fim')
        
        if data_inicio:
            try:
                data_inicio = datetime.strptime(data_inicio, '%Y-%m-%d')
                queryset = queryset.filter(data__gte=data_inicio)
            except ValueError:
                pass
        
        if data_fim:
            try:
                data_fim = datetime.strptime(data_fim, '%Y-%m-%d')
                data_fim = data_fim.replace(hour=23, minute=59, second=59)
                queryset = queryset.filter(data__lte=data_fim)
            except ValueError:
                pass
        
        return queryset
    
    @action(detail=False, methods=['get'])
    def dashboard_data(self, request):
        # Obter período
        data_inicio = request.query_params.get('data_inicio')
        data_fim = request.query_params.get('data_fim')
        
        if data_inicio:
            try:
                data_inicio = datetime.strptime(data_inicio, '%Y-%m-%d')
            except ValueError:
                data_inicio = timezone.now() - timedelta(days=30)
        else:
            data_inicio = timezone.now() - timedelta(days=30)
        
        if data_fim:
            try:
                data_fim = datetime.strptime(data_fim, '%Y-%m-%d')
                data_fim = data_fim.replace(hour=23, minute=59, second=59)
            except ValueError:
                data_fim = timezone.now()
        else:
            data_fim = timezone.now()
        
        # Movimentação por tipo
        movimentacao_por_tipo = MovimentacaoEstoque.objects.filter(
            data__range=(data_inicio, data_fim)
        ).values('tipo').annotate(
            total_quantidade=Sum('quantidade'),
            total_valor=Sum(
                ExpressionWrapper(
                    F('quantidade') * F('valor_unitario'), 
                    output_field=DecimalField()
                )
            )
        )
        
        # Movimentação por dia
        movimentacao_por_dia = MovimentacaoEstoque.objects.filter(
            data__range=(data_inicio, data_fim)
        ).extra(
            select={'dia': "DATE(data)"}
        ).values('dia', 'tipo').annotate(
            total_quantidade=Sum('quantidade'),
            total_valor=Sum(
                ExpressionWrapper(
                    F('quantidade') * F('valor_unitario'), 
                    output_field=DecimalField()
                )
            )
        ).order_by('dia')
        
        # Itens mais movimentados (por valor)
        itens_mais_movimentados = MovimentacaoEstoque.objects.filter(
            data__range=(data_inicio, data_fim)
        ).values(
            'item__nome'
        ).annotate(
            total_entradas=Sum('quantidade', filter=Q(tipo='entrada')),
            total_saidas=Sum('quantidade', filter=Q(tipo='saida')),
            total_valor=Sum(
                ExpressionWrapper(
                    F('quantidade') * F('valor_unitario'), 
                    output_field=DecimalField()
                )
            )
        ).order_by('-total_valor')[:10]
        
        return Response({
            'movimentacao_por_tipo': list(movimentacao_por_tipo),
            'movimentacao_por_dia': list(movimentacao_por_dia),
            'itens_mais_movimentados': list(itens_mais_movimentados)
        })