from django.shortcuts import render
from rest_framework import viewsets, status
from django.db.models import Sum, F
from django.utils import timezone
from datetime import datetime, timedelta
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import Categoria, ItemCardapio, Consumacao, ItemConsumacao, Pagamento
from .serializers import CategoriaSerializer, ItemCardapioSerializer, ConsumacaoSerializer, PagamentoSerializer, ConsumacaoDetailSerializer
from rest_framework.exceptions import ValidationError
from django.db import transaction
from decimal import Decimal


def index(request, *args, **kwargs):
    return render(request, 'frontend/index.html')

class CategoriaViewSet(viewsets.ModelViewSet):
    queryset = Categoria.objects.all()
    serializer_class = CategoriaSerializer
    
    def get_queryset(self):
        queryset = Categoria.objects.all()
        main_only = self.request.query_params.get('main_only', False)
        if main_only:
            queryset = queryset.filter(categoria_pai__isnull=True)
        return queryset

class ItemCardapioViewSet(viewsets.ModelViewSet):
    queryset = ItemCardapio.objects.all()
    serializer_class = ItemCardapioSerializer
    
    def get_queryset(self):
        queryset = ItemCardapio.objects.select_related('categoria', 'categoria__categoria_pai').all()
        categoria = self.request.query_params.get('categoria', None)
        if categoria:
            queryset = queryset.filter(categoria_id=categoria)
        return queryset
    
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.ativo = False
        instance.save()
        return Response(status=status.HTTP_204_NO_CONTENT)

class ConsumacaoViewSet(viewsets.ModelViewSet):
    queryset = Consumacao.objects.prefetch_related(
        'itemconsumacao_set',
        'itemconsumacao_set__item',
        'pagamentos'
    ).all()
    serializer_class = ConsumacaoSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        quarto = self.request.query_params.get('quarto', None)
        status = self.request.query_params.get('status', None)
        
        if quarto:
            queryset = queryset.filter(quarto=quarto)
        if status:
            queryset = queryset.filter(status=status)
            
        return queryset

    @action(detail=False, methods=['get'])
    def dashboard_data(self, request):
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        if start_date:
            start_date = datetime.strptime(start_date, '%Y-%m-%d')
        else:
            start_date = timezone.now().replace(hour=0, minute=0, second=0)
            
        if end_date:
            end_date = datetime.strptime(end_date, '%Y-%m-%d')
        else:
            end_date = timezone.now()
            
        comandas_ativas = Consumacao.objects.filter(status='aberto').count()
        
        vendas_periodo = Consumacao.objects.filter(
            data_hora__range=(start_date, end_date),
            status='pago'
        ).annotate(
            item_total=F('itemconsumacao__quantidade') * F('itemconsumacao__item__preco')
        ).aggregate(
            total=Sum('item_total')
        )['total'] or 0

        itens_mais_vendidos = ItemConsumacao.objects.filter(
            consumacao__data_hora__range=(start_date, end_date)
        ).values(
            'item__nome'
        ).annotate(
            total_vendido=Sum('quantidade'),
            receita_total=Sum(F('quantidade') * F('item__preco'))
        ).order_by('-total_vendido')[:5]

        vendas_por_categoria = ItemConsumacao.objects.filter(
            consumacao__data_hora__range=(start_date, end_date)
        ).values(
            'item__categoria__nome'
        ).annotate(
            total_vendas=Sum(F('quantidade') * F('item__preco'))
        ).order_by('-total_vendas')

        vendas_por_hora = Consumacao.objects.filter(
            data_hora__gte=timezone.now() - timedelta(days=1)
        ).extra(
            select={'hora': "EXTRACT(hour FROM data_hora)"}
        ).values('hora').annotate(
            total=Sum(F('itemconsumacao__quantidade') * F('itemconsumacao__item__preco'))
        ).order_by('hora')
                
        return Response({
            'comandas_ativas': comandas_ativas,
            'vendas_periodo': vendas_periodo,
            'itens_mais_vendidos': list(itens_mais_vendidos),
            'vendas_por_categoria': list(vendas_por_categoria),
            'vendas_por_hora': list(vendas_por_hora)
        })

    @action(detail=True, methods=['post'])
    def adicionar_item(self, request, pk=None):
        consumacao = self.get_object()
        item_id = request.data.get('item_id')
        quantidade = request.data.get('quantidade', 1)
        observacao = request.data.get('observacao', '')
        
        if not item_id:
            return Response(
                {'error': 'item_id é obrigatório'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        try:
            item = get_object_or_404(ItemCardapio, id=item_id)
            
            if not item.disponivel:
                return Response(
                    {'error': 'Item não está disponível'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            item_consumacao = ItemConsumacao.objects.create(
                consumacao=consumacao,
                item=item,
                quantidade=quantidade,
                observacao=observacao
            )
            
            serializer = self.get_serializer(consumacao)
            return Response(serializer.data)
            
        except ItemCardapio.DoesNotExist:
            return Response(
                {'error': 'Item não encontrado'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
    def get_serializer_class(self):
        if self.action in ['retrieve', 'registrar_pagamento']:
            return ConsumacaoDetailSerializer
        return ConsumacaoSerializer

    @action(detail=True, methods=['post'])
    def registrar_pagamento(self, request, pk=None):
        consumacao = self.get_object()
        
        valor = request.data.get('valor')
        if not valor:
            raise ValidationError({'valor': 'Este campo é obrigatório.'})
            
        try:
            valor = Decimal(str(valor))
        except decimal.InvalidOperation:
            raise ValidationError({'valor': 'Valor inválido.'})
            
        if valor <= 0:
            raise ValidationError({'valor': 'O valor deve ser maior que zero.'})
            
        saldo_atual = consumacao.saldo()
        if valor > saldo_atual:
            raise ValidationError({
                'valor': f'O valor excede o saldo pendente de {saldo_atual}.'
            })
            
        with transaction.atomic():
            pagamento = Pagamento.objects.create(
                consumacao=consumacao,
                valor=valor,
                forma_pagamento=request.data.get('forma_pagamento', 'dinheiro'),
                observacao=request.data.get('observacao', '')
            )
            
            # Update comanda status if fully paid
            novo_saldo = consumacao.saldo()
            if novo_saldo <= 0:
                consumacao.status = 'pago'
                consumacao.save()
            
            serializer = ConsumacaoDetailSerializer(consumacao)
            return Response(serializer.data)
            
    @action(detail=True, methods=['get'])
    def pagamentos(self, request, pk=None):
        consumacao = self.get_object()
        pagamentos = consumacao.pagamentos.all()
        serializer = PagamentoSerializer(pagamentos, many=True)
        return Response(serializer.data)
        

class PagamentoViewSet(viewsets.ModelViewSet):
    queryset = Pagamento.objects.all()
    serializer_class = PagamentoSerializer

    def get_queryset(self):
        return Pagamento.objects.filter(
            consumacao_id=self.kwargs.get('consumacao_pk')
        )