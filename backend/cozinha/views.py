from django.shortcuts import render
from rest_framework import viewsets, status
from django.db.models import Case, When, F, Sum
from django.utils import timezone
from datetime import datetime, timedelta
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import Categoria, ItemCardapio, Consumacao, ItemConsumacao, Pagamento
from .serializers import CategoriaSerializer, ItemCardapioSerializer, ConsumacaoSerializer, PagamentoSerializer, ConsumacaoDetailSerializer
from rest_framework.exceptions import ValidationError
from django.db import transaction
from decimal import Decimal
from rest_framework.permissions import IsAuthenticated, AllowAny
# from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import login
from .serializers import UserSerializer, LoginSerializer
# from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import login, logout
from django.views.decorators.csrf import ensure_csrf_cookie
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from .services import generate_signature



def index(request, path=''):
    return render(request, 'frontend/index.html')

@ensure_csrf_cookie
@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    serializer = LoginSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.validated_data
        login(request, user)
        return Response({
            'user': UserSerializer(user).data,
            'success': True
        })
    return Response(serializer.errors, status=400)

@api_view(['POST'])
def logout_view(request):
    logout(request)
    return Response({'success': True})

@api_view(['GET'])
def user_info(request):
    if request.user.is_authenticated:
        return Response(UserSerializer(request.user).data)
    return Response({'authenticated': False}, status=403)

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
    
    @action(detail=True, methods=['POST'])
    def upload_image(self, request, pk=None):
        instance = self.get_object()
        try:
            if 'imagem' in request.FILES:
                file_obj = request.FILES['imagem']
                # Save the file path directly to the model
                instance.imagem = file_obj
                instance.save()
                
                return Response({
                    'status': 'success',
                    'url': instance.imagem.url if instance.imagem else None
                }, status=201)
            else:
                return Response({'error': 'No image file provided'}, status=400)
        except Exception as e:
            return Response({'error': str(e)}, status=400)

    @action(detail=False, methods=['GET'])
    def upload_params(self, request):
        try:
            params = generate_signature()
            return Response(params)
        except Exception as e:
            return Response({'error': str(e)}, status=500)

class ConsumacaoViewSet(viewsets.ModelViewSet):
    queryset = Consumacao.objects.prefetch_related(
        'itemconsumacao_set',
        'itemconsumacao_set__item',
        'pagamentos'
    ).all()
    serializer_class = ConsumacaoSerializer

    @action(detail=True, methods=['post'])
    def adicionar_item(self, request, pk=None):
        consumacao = self.get_object()
        
        # Check if we're receiving a batch of items
        items_data = request.data.get('items', None)
        
        if items_data:
            # Batch processing
            created_items = []
            for item_data in items_data:
                item_id = item_data.get('item_id')
                quantidade = item_data.get('quantidade', 1)
                observacao = item_data.get('observacao', '')
                
                if not item_id:
                    return Response(
                        {'error': 'item_id é obrigatório para todos os itens'}, 
                        status=status.HTTP_400_BAD_REQUEST
                    )
                    
                try:
                    item = get_object_or_404(ItemCardapio, id=item_id)
                    
                    if not item.disponivel:
                        return Response(
                            {'error': f'Item {item.nome} não está disponível'}, 
                            status=status.HTTP_400_BAD_REQUEST
                        )
                    
                    item_consumacao = ItemConsumacao.objects.create(
                        consumacao=consumacao,
                        item=item,
                        quantidade=quantidade,
                        observacao=observacao
                    )
                    created_items.append(item_consumacao)
                    
                except ItemCardapio.DoesNotExist:
                    return Response(
                        {'error': f'Item com id {item_id} não encontrado'}, 
                        status=status.HTTP_404_NOT_FOUND
                    )
            
            serializer = self.get_serializer(consumacao)
            return Response(serializer.data)
            
        else:
            # Single item processing (existing functionality)
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
            item_price=Case(
                When(
                    isBusinessWorker=True,
                    then=F('itemconsumacao__item__preco_custo')
                ),
                default=F('itemconsumacao__item__preco')
            )
        ).aggregate(
            total=Sum(F('itemconsumacao__quantidade') * F('item_price'))
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
    
@action(detail=False, methods=['POST'])
def authenticate(self, request):

    
    code = request.data.get('code')
    password = request.data.get('password')
    try:
        comanda = Consumacao.objects.get(
            quarto=code,
            status='aberto'
        )
        # Add your password validation logic here
        return Response(ConsumacaoDetailSerializer(comanda).data)
    except Consumacao.DoesNotExist:
        return Response(
            {'error': 'Invalid credentials'}, 
            status=status.HTTP_401_UNAUTHORIZED
        )
    
@action(detail=True, methods=['PATCH'])
def update(self, request, *args, **kwargs):
    instance = self.get_object()
    
    if 'imagem' in request.FILES:
        instance.imagem = request.FILES['imagem']
        instance.save()
        
    serializer = self.get_serializer(instance)
    return Response(serializer.data)