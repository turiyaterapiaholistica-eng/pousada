from datetime import datetime, timedelta
from decimal import Decimal, InvalidOperation

from django.contrib.auth import login, logout
from django.db import transaction
from django.db.models import Case, DecimalField, ExpressionWrapper, F, Sum, Value, When
from django.db.models.functions import Coalesce, ExtractHour, TruncDate
from django.shortcuts import get_object_or_404, render
from django.utils import timezone
from django.views.decorators.csrf import ensure_csrf_cookie
from rest_framework import status, viewsets
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from .models import Categoria, Consumacao, ItemCardapio, ItemConsumacao, Pagamento
from .serializers import (
    CategoriaSerializer,
    ConsumacaoDetailSerializer,
    ConsumacaoSerializer,
    ItemCardapioSerializer,
    LoginSerializer,
    PagamentoSerializer,
    UserSerializer,
)
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
        return Response({'user': UserSerializer(user).data, 'success': True})
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
def logout_view(request):
    logout(request)
    return Response({'success': True})


@api_view(['GET'])
def user_info(request):
    if request.user.is_authenticated:
        return Response(UserSerializer(request.user).data)
    return Response({'authenticated': False}, status=status.HTTP_403_FORBIDDEN)


class CategoriaViewSet(viewsets.ModelViewSet):
    queryset = Categoria.objects.all()
    serializer_class = CategoriaSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        main_only = self.request.query_params.get('main_only')
        if str(main_only).lower() in {'1', 'true', 'yes'}:
            queryset = queryset.filter(categoria_pai__isnull=True)
        return queryset


class ItemCardapioViewSet(viewsets.ModelViewSet):
    queryset = ItemCardapio.objects.select_related('categoria', 'categoria__categoria_pai').all()
    serializer_class = ItemCardapioSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        categoria = self.request.query_params.get('categoria')
        if categoria:
            queryset = queryset.filter(categoria_id=categoria)
        return queryset

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.ativo = False
        instance.save(update_fields=['ativo'])
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=['post'])
    def upload_image(self, request, pk=None):
        instance = self.get_object()
        if 'imagem' not in request.FILES:
            return Response({'error': 'No image file provided'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            instance.imagem = request.FILES['imagem']
            instance.save(update_fields=['imagem'])
            return Response(
                {'status': 'success', 'url': instance.imagem.url if instance.imagem else None},
                status=status.HTTP_201_CREATED,
            )
        except Exception as exc:
            return Response({'error': str(exc)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def upload_params(self, request):
        try:
            return Response(generate_signature())
        except Exception as exc:
            return Response({'error': str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ConsumacaoViewSet(viewsets.ModelViewSet):
    queryset = Consumacao.objects.prefetch_related(
        'itemconsumacao_set',
        'itemconsumacao_set__item',
        'pagamentos',
    ).all()
    serializer_class = ConsumacaoSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        quarto = self.request.query_params.get('quarto')
        status_param = self.request.query_params.get('status')

        if quarto:
            queryset = queryset.filter(quarto=quarto)
        if status_param:
            queryset = queryset.filter(status=status_param)
        return queryset

    def get_serializer_class(self):
        if self.action in {'retrieve', 'registrar_pagamento', 'authenticate'}:
            return ConsumacaoDetailSerializer
        return ConsumacaoSerializer

    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def authenticate(self, request):
        code = (request.data.get('code') or '').strip()
        if not code:
            return Response({'error': 'code é obrigatório'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            comanda = Consumacao.objects.prefetch_related(
                'itemconsumacao_set',
                'itemconsumacao_set__item',
                'pagamentos',
            ).get(quarto=code, status='aberto')
        except Consumacao.DoesNotExist:
            return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)

        return Response(ConsumacaoDetailSerializer(comanda).data)

    @action(detail=True, methods=['post'])
    def adicionar_item(self, request, pk=None):
        consumacao = self.get_object()
        items_data = request.data.get('items')

        if items_data:
            payload = items_data
        else:
            payload = [{
                'item_id': request.data.get('item_id'),
                'quantidade': request.data.get('quantidade', 1),
                'observacao': request.data.get('observacao', ''),
            }]

        created = []
        for item_data in payload:
            item_id = item_data.get('item_id')
            quantidade = item_data.get('quantidade', 1)
            observacao = item_data.get('observacao', '')

            if not item_id:
                return Response({'error': 'item_id é obrigatório'}, status=status.HTTP_400_BAD_REQUEST)

            item = get_object_or_404(ItemCardapio, id=item_id)
            if not item.disponivel:
                return Response(
                    {'error': f'Item {item.nome} não está disponível'},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            created.append(
                ItemConsumacao.objects.create(
                    consumacao=consumacao,
                    item=item,
                    quantidade=quantidade,
                    observacao=observacao,
                )
            )

        serializer = self.get_serializer(consumacao)
        return Response(serializer.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)

    @action(detail=False, methods=['get'])
    def dashboard_data(self, request):
        start_date_str = request.query_params.get('start_date')
        end_date_str = request.query_params.get('end_date')

        start_date = datetime.strptime(start_date_str, '%Y-%m-%d') if start_date_str else timezone.now().replace(hour=0, minute=0, second=0, microsecond=0)
        end_date = datetime.strptime(end_date_str, '%Y-%m-%d') if end_date_str else timezone.now()

        decimal_zero = Value(Decimal('0.00'), output_field=DecimalField(max_digits=12, decimal_places=2))

        valor_unitario_expr = Case(
            When(
                consumacao__tipo_cliente='funcionario',
                item__preco_custo__isnull=False,
                then=F('item__preco_custo'),
            ),
            default=Coalesce(F('item__preco'), decimal_zero),
            output_field=DecimalField(max_digits=10, decimal_places=2),
        )
        receita_expr = ExpressionWrapper(
            F('quantidade') * valor_unitario_expr,
            output_field=DecimalField(max_digits=12, decimal_places=2),
        )

        itens_queryset = ItemConsumacao.objects.filter(consumacao__data_hora__range=(start_date, end_date))

        comandas_ativas = Consumacao.objects.filter(status='aberto').count()
        vendas_periodo = (
            itens_queryset.filter(consumacao__status='pago')
            .aggregate(total=Coalesce(Sum(receita_expr), decimal_zero))['total']
        )

        itens_mais_vendidos = list(
            itens_queryset.values('item__nome')
            .annotate(
                total_vendido=Coalesce(Sum('quantidade'), Value(0)),
                receita_total=Coalesce(Sum(receita_expr), decimal_zero),
            )
            .order_by('-total_vendido')[:5]
        )

        vendas_por_categoria = list(
            itens_queryset.values('item__categoria__nome')
            .annotate(total_vendas=Coalesce(Sum(receita_expr), decimal_zero))
            .order_by('-total_vendas')
        )

        vendas_por_hora = list(
            ItemConsumacao.objects.filter(consumacao__data_hora__gte=timezone.now() - timedelta(days=1))
            .annotate(
                hora=ExtractHour('consumacao__data_hora'),
                receita=receita_expr,
            )
            .values('hora')
            .annotate(total=Coalesce(Sum('receita'), decimal_zero))
            .order_by('hora')
        )

        vendas_por_dia = list(
            itens_queryset.annotate(
                dia=TruncDate('consumacao__data_hora'),
                receita=receita_expr,
            )
            .values('dia')
            .annotate(total=Coalesce(Sum('receita'), decimal_zero))
            .order_by('dia')
        )

        return Response({
            'comandas_ativas': comandas_ativas,
            'vendas_periodo': vendas_periodo,
            'itens_mais_vendidos': itens_mais_vendidos,
            'vendas_por_categoria': vendas_por_categoria,
            'vendas_por_hora': vendas_por_hora,
            'vendas_por_dia': [
                {'dia': item['dia'].isoformat() if item['dia'] else None, 'total': item['total']}
                for item in vendas_por_dia
            ],
        })

    @action(detail=True, methods=['post'])
    def registrar_pagamento(self, request, pk=None):
        consumacao = self.get_object()

        valor = request.data.get('valor')
        if valor is None:
            raise ValidationError({'valor': 'Este campo é obrigatório.'})

        try:
            valor = Decimal(str(valor))
        except InvalidOperation:
            raise ValidationError({'valor': 'Valor inválido.'})

        if valor <= 0:
            raise ValidationError({'valor': 'O valor deve ser maior que zero.'})

        saldo_atual = consumacao.saldo()
        if valor > saldo_atual:
            raise ValidationError({'valor': f'O valor excede o saldo pendente de {saldo_atual}.'})

        with transaction.atomic():
            Pagamento.objects.create(
                consumacao=consumacao,
                valor=valor,
                forma_pagamento=request.data.get('forma_pagamento', 'dinheiro'),
                observacao=request.data.get('observacao', ''),
            )

            if consumacao.saldo() <= 0:
                consumacao.status = 'pago'
                consumacao.save(update_fields=['status'])

        return Response(ConsumacaoDetailSerializer(consumacao).data)

    @action(detail=True, methods=['get'])
    def pagamentos(self, request, pk=None):
        consumacao = self.get_object()
        return Response(PagamentoSerializer(consumacao.pagamentos.all(), many=True).data)


class PagamentoViewSet(viewsets.ModelViewSet):
    queryset = Pagamento.objects.all()
    serializer_class = PagamentoSerializer

    def get_queryset(self):
        consumacao_pk = self.kwargs.get('consumacao_pk')
        if consumacao_pk:
            return self.queryset.filter(consumacao_id=consumacao_pk)
        return self.queryset
