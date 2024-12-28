from django.db import models
from django.shortcuts import render
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Sum, Count
from django.utils import timezone
from datetime import datetime, timedelta

class Categoria(models.Model):
    nome = models.CharField(max_length=100)
    descricao = models.TextField(blank=True)
    categoria_pai = models.ForeignKey('self', null=True, blank=True, 
                                    on_delete=models.CASCADE, 
                                    related_name='subcategorias')

    def __str__(self):
        if self.categoria_pai:
            return f"{self.categoria_pai.nome} > {self.nome}"
        return self.nome

    class Meta:
        verbose_name = 'Categoria'
        verbose_name_plural = 'Categorias'
        ordering = ['categoria_pai__nome', 'nome']

class ItemCardapio(models.Model):
    nome = models.CharField(max_length=200)
    descricao = models.TextField()
    ativo = models.BooleanField(default=True)
    preco = models.DecimalField(max_digits=10, decimal_places=2)
    # Add worker price field
    preco_custo = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    categoria = models.ForeignKey(Categoria, on_delete=models.SET_NULL, null=True)
    disponivel = models.BooleanField(default=True)
    imagem = models.ImageField(upload_to='', null=True, blank=True)
    
    def __str__(self):
        return f"{self.nome} - {self.categoria}"

    class Meta:
        verbose_name = 'Item do Cardápio'
        verbose_name_plural = 'Itens do Cardápio'
        ordering = ['categoria__nome', 'nome']    

class Consumacao(models.Model):
    quarto = models.CharField(max_length=50)
    data_hora = models.DateTimeField(auto_now_add=True)
    itens = models.ManyToManyField(ItemCardapio, through='ItemConsumacao')
    status = models.CharField(max_length=20, choices=[
        ('aberto', 'Aberto'),
        ('fechado', 'Fechado'),
        ('pago', 'Pago')
    ], default='aberto')
    # Add isBusinessWorker field
    isBusinessWorker = models.BooleanField(default=False)
    
    def total(self):
        total = 0
        for item_consumacao in self.itemconsumacao_set.all():
            if self.isBusinessWorker and item_consumacao.item.preco_funcionario is not None:
                preco = item_consumacao.item.preco_funcionario
            else:
                preco = item_consumacao.item.preco
            total += item_consumacao.quantidade * preco
        return total
    
    def total_pago(self):
        return self.pagamentos.aggregate(
            total=models.Sum('valor')
        )['total'] or 0
    
    def saldo(self):
        return self.total() - self.total_pago()

class ItemConsumacao(models.Model):
    consumacao = models.ForeignKey(Consumacao, on_delete=models.CASCADE)
    item = models.ForeignKey(ItemCardapio, on_delete=models.PROTECT)
    quantidade = models.IntegerField(default=1)
    observacao = models.TextField(blank=True)

class Pagamento(models.Model):
    FORMA_PAGAMENTO_CHOICES = [
        ('dinheiro', 'Dinheiro'),
        ('cartao_credito', 'Cartão de Crédito'),
        ('cartao_debito', 'Cartão de Débito'),
        ('pix', 'PIX'),
        ('outros', 'Outros')
    ]
    
    consumacao = models.ForeignKey(
        'Consumacao', 
        on_delete=models.CASCADE,
        related_name='pagamentos'
    )
    valor = models.DecimalField(max_digits=10, decimal_places=2)
    data = models.DateTimeField(auto_now_add=True)
    forma_pagamento = models.CharField(
        max_length=50,
        choices=FORMA_PAGAMENTO_CHOICES,
        default='dinheiro'
    )
    observacao = models.TextField(blank=True)

    class Meta:
        ordering = ['-data']
        
    def __str__(self):
        return f"Pagamento {self.forma_pagamento} - R${self.valor}"

class ConsumacaoViewSet(viewsets.ModelViewSet):
    queryset = Consumacao.objects.all()
    
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
        ).aggregate(
            total=Sum('itemconsumacao__quantidade' * 'itemconsumacao__item__preco')
        )['total'] or 0
        
        itens_mais_vendidos = ItemConsumacao.objects.filter(
            consumacao__data_hora__range=(start_date, end_date)
        ).values(
            'item__nome'
        ).annotate(
            total_vendido=Sum('quantidade'),
            receita_total=Sum('quantidade' * 'item__preco')
        ).order_by('-total_vendido')[:5]
        
        vendas_por_categoria = ItemConsumacao.objects.filter(
            consumacao__data_hora__range=(start_date, end_date)
        ).values(
            'item__categoria__nome'
        ).annotate(
            total_vendas=Sum('quantidade' * 'item__preco')
        ).order_by('-total_vendas')
        
        vendas_por_hora = Consumacao.objects.filter(
            data_hora__gte=timezone.now() - timedelta(days=1)
        ).extra(
            select={'hora': "EXTRACT(hour FROM data_hora)"}
        ).values('hora').annotate(
            total=Sum('itemconsumacao__quantidade' * 'itemconsumacao__item__preco')
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
        
        if not item_id:
            return Response({'error': 'item_id é obrigatório'}, status=400)
            
        try:
            item = ItemCardapio.objects.get(id=item_id)
            ItemConsumacao.objects.create(
                consumacao=consumacao,
                item=item,
                quantidade=quantidade
            )
            return Response({'status': 'item adicionado'})
        except ItemCardapio.DoesNotExist:
            return Response({'error': 'Item não encontrado'}, status=404)