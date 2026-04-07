# reservas/views.py
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from django.utils import timezone
from datetime import datetime, timedelta
from .models import Quarto, Hospede, Reserva, CheckIn, CheckOut
from .serializers import (
    QuartoSerializer, 
    HospedeSerializer, 
    ReservaListSerializer, 
    ReservaDetailSerializer,
    ReservaCreateSerializer,
    CheckInSerializer,
    CheckOutSerializer
)

class QuartoViewSet(viewsets.ModelViewSet):
    queryset = Quarto.objects.all()
    serializer_class = QuartoSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by status
        status = self.request.query_params.get('status')
        if status:
            queryset = queryset.filter(status=status)
        
        # Filter by type
        tipo = self.request.query_params.get('tipo')
        if tipo:
            queryset = queryset.filter(tipo=tipo)
        
        # Filter by capacity
        capacidade_adultos = self.request.query_params.get('adultos')
        if capacidade_adultos:
            queryset = queryset.filter(capacidade_adultos__gte=int(capacidade_adultos))
        
        capacidade_criancas = self.request.query_params.get('criancas')
        if capacidade_criancas:
            queryset = queryset.filter(capacidade_criancas__gte=int(capacidade_criancas))
            
        return queryset
        
    @action(detail=False, methods=['get'])
    def disponibilidade(self, request):
        """Check room availability for specific dates"""
        data_chegada = request.query_params.get('chegada')
        data_saida = request.query_params.get('saida')
        
        if not data_chegada or not data_saida:
            return Response(
                {'error': 'É necessário fornecer as datas de chegada e saída'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            data_chegada = datetime.strptime(data_chegada, '%Y-%m-%d').date()
            data_saida = datetime.strptime(data_saida, '%Y-%m-%d').date()
        except ValueError:
            return Response(
                {'error': 'Formato de data inválido. Use o formato YYYY-MM-DD'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Find booked rooms in the date range
        reservas = Reserva.objects.filter(
            Q(status__in=['confirmada', 'pendente']),
            Q(data_chegada__lt=data_saida) & Q(data_saida__gt=data_chegada)
        ).values_list('quarto_id', flat=True)
        
        # Find available rooms
        quartos_disponiveis = Quarto.objects.exclude(
            Q(id__in=reservas) | Q(status__in=['manutencao', 'bloqueado'])
        )
        
        # Apply additional filters
        capacidade_adultos = request.query_params.get('adultos')
        if capacidade_adultos:
            quartos_disponiveis = quartos_disponiveis.filter(
                capacidade_adultos__gte=int(capacidade_adultos)
            )
        
        capacidade_criancas = request.query_params.get('criancas')
        if capacidade_criancas:
            quartos_disponiveis = quartos_disponiveis.filter(
                capacidade_criancas__gte=int(capacidade_criancas)
            )
        
        serializer = QuartoSerializer(quartos_disponiveis, many=True)
        #quartos_data = list(quartos_disponiveis.values())
    
        # Convert to Response directly, avoiding the serializer that's causing issues
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def mapa(self, request):
        """Get occupancy map for a specific date range"""
        data_inicio = request.query_params.get('inicio')
        data_fim = request.query_params.get('fim')
        
        if not data_inicio:
            data_inicio = timezone.now().date().isoformat()
        if not data_fim:
            data_fim = (timezone.now().date() + timedelta(days=30)).isoformat()
        
        try:
            data_inicio = datetime.strptime(data_inicio, '%Y-%m-%d').date()
            data_fim = datetime.strptime(data_fim, '%Y-%m-%d').date()
        except ValueError:
            return Response(
                {'error': 'Formato de data inválido. Use o formato YYYY-MM-DD'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get all reservations in the date range
        reservas = Reserva.objects.filter(
            Q(data_chegada__lte=data_fim) & Q(data_saida__gte=data_inicio),
            Q(status__in=['confirmada', 'pendente', 'concluida'])
        ).select_related('quarto', 'hospede')
        
        # Get all rooms
        quartos = Quarto.objects.all()
        
        # Construct the occupancy map
        mapa_ocupacao = []
        
        for quarto in quartos:
            # Get reservations for this room
            reservas_quarto = [r for r in reservas if r.quarto_id == quarto.id]
            
            quarto_data = {
                'id': quarto.id,
                'nome': quarto.nome,
                'tipo': quarto.tipo,
                'tipo_display': quarto.get_tipo_display(),
                'status': quarto.status,
                'status_display': quarto.get_status_display(),
                'reservas': []
            }
            
            for reserva in reservas_quarto:
                quarto_data['reservas'].append({
                    'id': reserva.id,
                    'hospede': reserva.hospede.nome_completo(),
                    'chegada': reserva.data_chegada,
                    'saida': reserva.data_saida,
                    'status': reserva.status
                })
            
            mapa_ocupacao.append(quarto_data)
        
        return Response(mapa_ocupacao)

class HospedeViewSet(viewsets.ModelViewSet):
    queryset = Hospede.objects.all()
    serializer_class = HospedeSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Search by name
        nome = self.request.query_params.get('nome')
        if nome:
            queryset = queryset.filter(
                Q(nome__icontains=nome) | Q(sobrenome__icontains=nome)
            )
        
        # Search by document
        documento = self.request.query_params.get('documento')
        if documento:
            queryset = queryset.filter(numero_documento__icontains=documento)
        
        # Search by email
        email = self.request.query_params.get('email')
        if email:
            queryset = queryset.filter(email__icontains=email)
            
        return queryset
    
    @action(detail=True, methods=['get'])
    def reservas(self, request, pk=None):
        """Get all reservations for a specific guest"""
        hospede = self.get_object()
        reservas = hospede.reservas.all()
        serializer = ReservaListSerializer(reservas, many=True)
        return Response(serializer.data)

class ReservaViewSet(viewsets.ModelViewSet):
    queryset = Reserva.objects.select_related('quarto', 'hospede').all()
    
    def get_serializer_class(self):
        if self.action == 'create':
            return ReservaCreateSerializer
        elif self.action in ['retrieve', 'update', 'partial_update']:
            return ReservaDetailSerializer
        return ReservaListSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by date range
        data_chegada = self.request.query_params.get('chegada')
        if data_chegada:
            try:
                data_chegada = datetime.strptime(data_chegada, '%Y-%m-%d').date()
                queryset = queryset.filter(data_chegada__gte=data_chegada)
            except ValueError:
                pass
        
        data_saida = self.request.query_params.get('saida')
        if data_saida:
            try:
                data_saida = datetime.strptime(data_saida, '%Y-%m-%d').date()
                queryset = queryset.filter(data_saida__lte=data_saida)
            except ValueError:
                pass
        
        # Filter by status
        status = self.request.query_params.get('status')
        if status:
            queryset = queryset.filter(status=status)
        
        # Filter by room
        quarto = self.request.query_params.get('quarto')
        if quarto:
            queryset = queryset.filter(quarto_id=quarto)
        
        # Filter by guest
        hospede = self.request.query_params.get('hospede')
        if hospede:
            queryset = queryset.filter(
                Q(hospede__nome__icontains=hospede) | 
                Q(hospede__sobrenome__icontains=hospede)
            )
            
        return queryset
    
    @action(detail=False, methods=['get'])
    def chegadas_hoje(self, request):
        """Get today's arrivals"""
        hoje = timezone.now().date()
        chegadas = Reserva.objects.filter(
            data_chegada=hoje,
            status='confirmada'
        ).select_related('quarto', 'hospede')
        
        serializer = ReservaListSerializer(chegadas, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def partidas_hoje(self, request):
        """Get today's departures"""
        hoje = timezone.now().date()
        partidas = Reserva.objects.filter(
            data_saida=hoje,
            status='concluida'
        ).select_related('quarto', 'hospede')
        
        serializer = ReservaListSerializer(partidas, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def dashboard_data(self, request):
        """Get reservation statistics for dashboard"""
        hoje = timezone.now().date()
        
        # Upcoming arrivals (next 7 days)
        proximas_chegadas = Reserva.objects.filter(
            data_chegada__range=[hoje, hoje + timedelta(days=7)],
            status='confirmada'
        ).count()
        
        # Current occupancy
        ocupacao_atual = Reserva.objects.filter(
            data_chegada__lte=hoje,
            data_saida__gt=hoje,
            status__in=['confirmada', 'concluida']
        ).count()
        
        # Total rooms
        total_quartos = Quarto.objects.count()
        
        # Occupancy rate
        taxa_ocupacao = round((ocupacao_atual / total_quartos * 100) if total_quartos else 0, 2)
        
        # Monthly statistics
        inicio_mes = hoje.replace(day=1)
        fim_mes = (inicio_mes + timedelta(days=32)).replace(day=1) - timedelta(days=1)
        
        reservas_mes = Reserva.objects.filter(
            data_chegada__range=[inicio_mes, fim_mes],
            status__in=['confirmada', 'concluida', 'pendente']
        )
        
        # Daily occupancy for the next 30 days
        ocupacao_diaria = []
        for i in range(30):
            data = hoje + timedelta(days=i)
            ocupados = Reserva.objects.filter(
                data_chegada__lte=data,
                data_saida__gt=data,
                status__in=['confirmada', 'concluida', 'pendente']
            ).count()
            
            ocupacao_diaria.append({
                'data': data.isoformat(),
                'ocupados': ocupados,
                'total': total_quartos,
                'taxa': round((ocupados / total_quartos * 100) if total_quartos else 0, 2)
            })
        
        return Response({
            'ocupacao_atual': ocupacao_atual,
            'total_quartos': total_quartos,
            'taxa_ocupacao': taxa_ocupacao,
            'proximas_chegadas': proximas_chegadas,
            'reservas_mes': reservas_mes.count(),
            'ocupacao_diaria': ocupacao_diaria
        })
    
    @action(detail=True, methods=['post'])
    def cancelar(self, request, pk=None):
        """Cancel a reservation"""
        reserva = self.get_object()
        
        if reserva.status in ['concluida', 'cancelada', 'no_show']:
            return Response(
                {'error': f'Não é possível cancelar uma reserva com status {reserva.get_status_display()}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        reserva.status = 'cancelada'
        reserva.save()
        
        serializer = self.get_serializer(reserva)
        return Response(serializer.data)

class CheckInViewSet(viewsets.ModelViewSet):
    queryset = CheckIn.objects.select_related('reserva', 'reserva__quarto', 'reserva__hospede').all()
    serializer_class = CheckInSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by date
        data = self.request.query_params.get('data')
        if data:
            try:
                data = datetime.strptime(data, '%Y-%m-%d').date()
                queryset = queryset.filter(data_hora__date=data)
            except ValueError:
                pass
            
        return queryset

class CheckOutViewSet(viewsets.ModelViewSet):
    queryset = CheckOut.objects.select_related('reserva', 'reserva__quarto', 'reserva__hospede').all()
    serializer_class = CheckOutSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by date
        data = self.request.query_params.get('data')
        if data:
            try:
                data = datetime.strptime(data, '%Y-%m-%d').date()
                queryset = queryset.filter(data_hora__date=data)
            except ValueError:
                pass
            
        return queryset
