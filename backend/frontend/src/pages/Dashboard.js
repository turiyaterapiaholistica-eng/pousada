import React, { useEffect, useMemo, useState } from 'react';
import {
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import RestaurantRoundedIcon from '@mui/icons-material/RestaurantRounded';
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded';
import Inventory2RoundedIcon from '@mui/icons-material/Inventory2Rounded';
import ShoppingCartRoundedIcon from '@mui/icons-material/ShoppingCartRounded';
import HotelRoundedIcon from '@mui/icons-material/HotelRounded';
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import AssessmentRoundedIcon from '@mui/icons-material/AssessmentRounded';
import VolunteerActivismRoundedIcon from '@mui/icons-material/VolunteerActivismRounded';
import AddCircleRoundedIcon from '@mui/icons-material/AddCircleRounded';
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import MeetingRoomRoundedIcon from '@mui/icons-material/MeetingRoomRounded';
import api from '../services/api';
import { formatMoney } from '../utils/formatters';
import { useNavigate } from 'react-router-dom';

const glassPanelSx = {
  background: 'linear-gradient(180deg, rgba(23, 36, 39, 0.5) 0%, rgba(11, 18, 22, 0.62) 100%)',
  border: '1px solid rgba(255,255,255,0.14)',
  boxShadow: '0 24px 60px rgba(4, 12, 14, 0.28)',
  backdropFilter: 'blur(18px)',
  color: '#fff',
};

const useClock = () => {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return now;
};

export default function RestaurantDashboard() {
  const now = useClock();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [snapshot, setSnapshot] = useState({
    vendas: {
      comandas_ativas: 0,
      vendas_periodo: 0,
      itens_mais_vendidos: [],
    },
    reservas: {
      taxa_ocupacao: 0,
      ocupacao_atual: 0,
      total_quartos: 0,
      proximas_chegadas: 0,
      reservas_mes: 0,
    },
  });

  useEffect(() => {
    const fetchSnapshot = async () => {
      try {
        const [vendas, reservas] = await Promise.all([
          api.get('/consumacoes/dashboard_data/'),
          api.get('/reservas/dashboard_data/'),
        ]);

        setSnapshot({
          vendas: vendas || {},
          reservas: reservas || {},
        });
      } catch (error) {
        console.error('Erro ao carregar dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSnapshot();
  }, []);

  const formattedTime = useMemo(
    () =>
      now.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    [now]
  );

  const formattedDate = useMemo(
    () =>
      now.toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
      }),
    [now]
  );

  const metrics = [
    {
      label: 'Comandas abertas',
      value: snapshot.vendas.comandas_ativas || 0,
      icon: <ReceiptLongRoundedIcon sx={{ fontSize: 18 }} />,
    },
    {
      label: 'Receita do período',
      value: formatMoney(snapshot.vendas.vendas_periodo || 0),
      icon: <TrendingUpRoundedIcon sx={{ fontSize: 18 }} />,
    },
    {
      label: 'Próximas chegadas',
      value: snapshot.reservas.proximas_chegadas || 0,
      icon: <CalendarMonthRoundedIcon sx={{ fontSize: 18 }} />,
    },
  ];

  const moduleCards = [
    {
      title: 'Vendas',
      subtitle: 'Lançar consumo e atendimento',
      path: '/vendas',
      icon: <RestaurantRoundedIcon sx={{ fontSize: 20 }} />,
      accent: 'linear-gradient(135deg, rgba(30,119,86,0.95), rgba(19,73,54,0.76))',
    },
    {
      title: 'Comandas',
      subtitle: 'Gestão, pagamento e edição',
      path: '/comandas',
      icon: <ReceiptLongRoundedIcon sx={{ fontSize: 20 }} />,
      accent: 'linear-gradient(135deg, rgba(227,145,70,0.95), rgba(118,64,27,0.76))',
    },
    {
      title: 'Compras',
      subtitle: 'Entrada e acompanhamento',
      path: '/compras',
      icon: <ShoppingCartRoundedIcon sx={{ fontSize: 20 }} />,
      accent: 'linear-gradient(135deg, rgba(90,118,181,0.95), rgba(40,55,98,0.76))',
    },
    {
      title: 'Estoque',
      subtitle: 'Saldo, movimentação e alertas',
      path: '/estoque',
      icon: <Inventory2RoundedIcon sx={{ fontSize: 20 }} />,
      accent: 'linear-gradient(135deg, rgba(85,152,143,0.95), rgba(28,71,70,0.76))',
    },
    {
      title: 'Reservas',
      subtitle: 'Mapa, check-in e lista',
      path: '/reservas/lista',
      icon: <HotelRoundedIcon sx={{ fontSize: 20 }} />,
      accent: 'linear-gradient(135deg, rgba(109,129,210,0.95), rgba(52,62,125,0.76))',
    },
    {
      title: 'Relatórios',
      subtitle: 'Leitura operacional e financeira',
      path: '/relatorios',
      icon: <AssessmentRoundedIcon sx={{ fontSize: 20 }} />,
      accent: 'linear-gradient(135deg, rgba(170,116,193,0.95), rgba(88,52,106,0.76))',
    },
  ];

  const supportActions = [
    {
      label: 'Nova reserva',
      path: '/reservas/nova',
      icon: <AddCircleRoundedIcon sx={{ fontSize: 18 }} />,
    },
    {
      label: 'Chegadas e saídas',
      path: '/reservas/checkin-checkout',
      icon: <MeetingRoomRoundedIcon sx={{ fontSize: 18 }} />,
    },
    {
      label: 'Configurações',
      path: '/configuracoes',
      icon: <SettingsRoundedIcon sx={{ fontSize: 18 }} />,
    },
    {
      label: 'Voluntários',
      path: '/voluntarios/gestao',
      icon: <VolunteerActivismRoundedIcon sx={{ fontSize: 18 }} />,
    },
  ];

  return (
    <Box
      sx={{
        minHeight: '100%',
        position: 'relative',
        px: { xs: 2, md: 4 },
        py: { xs: 3, md: 4 },
        color: '#fff',
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          background: `
            radial-gradient(circle at 18% 24%, rgba(99, 148, 153, 0.46), transparent 22%),
            radial-gradient(circle at 82% 18%, rgba(255, 173, 83, 0.55), transparent 26%),
            radial-gradient(circle at 50% 100%, rgba(15, 76, 95, 0.72), transparent 36%),
            linear-gradient(180deg, rgba(83,110,132,0.6) 0%, rgba(177,132,93,0.42) 38%, rgba(18,49,56,0.9) 100%)
          `,
          borderRadius: { xs: 6, md: 10 },
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0) 28%, rgba(5,12,16,0.28) 100%)',
          }}
        />
      </Box>

      <Stack spacing={3} sx={{ position: 'relative', zIndex: 1 }}>
        <Stack
          direction={{ xs: 'column', xl: 'row' }}
          spacing={3}
          alignItems={{ xs: 'stretch', xl: 'flex-start' }}
        >
          <Paper
            sx={{
              ...glassPanelSx,
              p: 3,
              borderRadius: 7,
              width: { xs: '100%', xl: 300 },
            }}
          >
            <Typography sx={{ fontSize: 14, opacity: 0.78 }}>Ocupação atual</Typography>
            <Typography sx={{ fontSize: 54, lineHeight: 1, fontWeight: 300, mt: 0.5 }}>
              {snapshot.reservas.taxa_ocupacao || 0}%
            </Typography>
            <Typography sx={{ mt: 0.8, opacity: 0.82 }}>
              {snapshot.reservas.ocupacao_atual || 0} de {snapshot.reservas.total_quartos || 0} quartos ocupados
            </Typography>
            <Divider sx={{ borderColor: 'rgba(255,255,255,0.14)', my: 2 }} />
            <Stack spacing={1.25}>
              <Chip
                label={`${snapshot.reservas.reservas_mes || 0} reservas no mês`}
                sx={{ alignSelf: 'flex-start', bgcolor: 'rgba(255,255,255,0.08)', color: '#fff' }}
              />
              <Button
                variant="contained"
                onClick={() => navigate('/reservas/nova')}
                sx={{
                  mt: 1,
                  borderRadius: 999,
                  py: 1.35,
                  textTransform: 'none',
                  fontWeight: 700,
                  background: 'linear-gradient(180deg, #f3a75a 0%, #d97731 100%)',
                }}
              >
                Nova reserva
              </Button>
              <Button
                variant="outlined"
                onClick={() => navigate('/reservas/mapa')}
                sx={{
                  borderRadius: 999,
                  py: 1.2,
                  textTransform: 'none',
                  color: '#fff',
                  borderColor: 'rgba(255,255,255,0.24)',
                }}
              >
                Ver mapa de reservas
              </Button>
            </Stack>
          </Paper>

          <Stack sx={{ flex: 1, minWidth: 0 }} spacing={3}>
            <Stack spacing={1.2} alignItems="center" sx={{ textAlign: 'center', pt: { xs: 1, md: 2 } }}>
              <Chip
                label="Painel Operacional"
                sx={{
                  color: '#fdf5eb',
                  bgcolor: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.14)',
                  backdropFilter: 'blur(12px)',
                }}
              />
              <Typography
                sx={{
                  fontSize: { xs: 62, md: 88 },
                  lineHeight: 0.95,
                  fontWeight: 300,
                  letterSpacing: '-0.04em',
                  textShadow: '0 14px 42px rgba(0,0,0,0.24)',
                }}
              >
                {formattedTime}
              </Typography>
              <Typography sx={{ textTransform: 'capitalize', fontSize: { xs: 20, md: 28 }, opacity: 0.92 }}>
                {formattedDate}
              </Typography>
              <Typography sx={{ maxWidth: 680, opacity: 0.78 }}>
                Atalhos centrais para vendas, reservas, compras, estoque e configurações do sistema.
              </Typography>
            </Stack>

            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              {metrics.map((item) => (
                <Paper
                  key={item.label}
                  sx={{
                    ...glassPanelSx,
                    p: 2,
                    borderRadius: 5,
                    flex: 1,
                  }}
                >
                  <Stack direction="row" spacing={1.2} alignItems="center">
                    <Avatar sx={{ width: 38, height: 38, bgcolor: 'rgba(255,255,255,0.12)' }}>
                      {item.icon}
                    </Avatar>
                    <Box>
                      <Typography sx={{ fontSize: 13, opacity: 0.74 }}>{item.label}</Typography>
                      <Typography sx={{ fontSize: 24, fontWeight: 700 }}>{item.value}</Typography>
                    </Box>
                  </Stack>
                </Paper>
              ))}
            </Stack>
          </Stack>

          <Paper
            sx={{
              ...glassPanelSx,
              p: 2.5,
              borderRadius: 6,
              width: { xs: '100%', xl: 320 },
            }}
          >
            <Stack direction="row" alignItems="center" spacing={1.2}>
              <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.1)' }}>
                <SettingsRoundedIcon />
              </Avatar>
              <Box>
                <Typography sx={{ fontWeight: 700 }}>Centro de controle</Typography>
                <Typography sx={{ opacity: 0.76, fontSize: 14 }}>
                  Acessos rápidos para operação diária
                </Typography>
              </Box>
            </Stack>
            <Divider sx={{ borderColor: 'rgba(255,255,255,0.14)', my: 2 }} />
            <Stack spacing={1.1}>
              {supportActions.map((action) => (
                <Button
                  key={action.label}
                  onClick={() => navigate(action.path)}
                  startIcon={action.icon}
                  sx={{
                    justifyContent: 'flex-start',
                    borderRadius: 3,
                    px: 1.4,
                    py: 1.25,
                    textTransform: 'none',
                    color: '#fff',
                    background: 'rgba(255,255,255,0.06)',
                  }}
                >
                  {action.label}
                </Button>
              ))}
            </Stack>
          </Paper>
        </Stack>

        <Paper sx={{ ...glassPanelSx, p: 2.25, borderRadius: 6 }}>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            alignItems={{ xs: 'flex-start', md: 'center' }}
            justifyContent="space-between"
            sx={{ mb: 1.5 }}
            spacing={1.5}
          >
            <Box>
              <Typography sx={{ fontSize: 26, fontWeight: 700 }}>Módulos do sistema</Typography>
              <Typography sx={{ fontSize: 14, opacity: 0.76 }}>
                Use os botões abaixo para navegar pelas áreas já existentes do backend.
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<SettingsRoundedIcon />}
              onClick={() => navigate('/configuracoes')}
              sx={{
                borderRadius: 999,
                textTransform: 'none',
                fontWeight: 700,
                background: 'linear-gradient(90deg, #1f6f53 0%, #2f885f 100%)',
              }}
            >
              Configurações
            </Button>
          </Stack>

          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} flexWrap="wrap" useFlexGap>
            {moduleCards.map((card) => (
              <Paper
                key={card.title}
                onClick={() => navigate(card.path)}
                sx={{
                  flex: '1 1 280px',
                  minHeight: 154,
                  borderRadius: 4,
                  p: 2,
                  color: '#fff',
                  cursor: 'pointer',
                  position: 'relative',
                  overflow: 'hidden',
                  background: `${card.accent}, linear-gradient(180deg, rgba(255,255,255,0.12), rgba(0,0,0,0.24))`,
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.14)',
                }}
              >
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Avatar sx={{ width: 38, height: 38, bgcolor: 'rgba(255,255,255,0.16)' }}>
                    {card.icon}
                  </Avatar>
                </Stack>
                <Box sx={{ position: 'absolute', left: 16, right: 16, bottom: 16 }}>
                  <Typography sx={{ fontSize: 21, fontWeight: 700 }}>{card.title}</Typography>
                  <Typography sx={{ fontSize: 13.5, opacity: 0.82 }}>{card.subtitle}</Typography>
                </Box>
              </Paper>
            ))}
          </Stack>
        </Paper>

        <Stack direction={{ xs: 'column', xl: 'row' }} spacing={3}>
          <Paper sx={{ ...glassPanelSx, p: 2.5, borderRadius: 6, flex: 1 }}>
            <Typography sx={{ fontSize: 22, fontWeight: 700, mb: 1.5 }}>Itens mais vendidos</Typography>
            {loading ? (
              <Stack alignItems="center" justifyContent="center" sx={{ minHeight: 140 }}>
                <CircularProgress sx={{ color: '#fff' }} />
              </Stack>
            ) : (snapshot.vendas.itens_mais_vendidos || []).length ? (
              <Stack spacing={1}>
                {snapshot.vendas.itens_mais_vendidos.slice(0, 5).map((item, index) => (
                  <Stack
                    key={`${item.item__nome}-${index}`}
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    sx={{
                      px: 1.4,
                      py: 1.25,
                      borderRadius: 3,
                      background: 'rgba(255,255,255,0.06)',
                    }}
                  >
                    <Stack direction="row" spacing={1.2} alignItems="center">
                      <Avatar sx={{ width: 32, height: 32, bgcolor: 'rgba(255,255,255,0.12)', fontSize: 14 }}>
                        {index + 1}
                      </Avatar>
                      <Box>
                        <Typography sx={{ fontWeight: 600 }}>{item.item__nome}</Typography>
                        <Typography sx={{ fontSize: 12.5, opacity: 0.72 }}>
                          {item.total_vendido} unidades
                        </Typography>
                      </Box>
                    </Stack>
                    <Typography sx={{ fontWeight: 700 }}>
                      {formatMoney(item.receita_total)}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            ) : (
              <Typography sx={{ opacity: 0.76 }}>
                Ainda não há dados de venda suficientes para montar o ranking.
              </Typography>
            )}
          </Paper>

          <Paper sx={{ ...glassPanelSx, p: 2.5, borderRadius: 6, width: { xs: '100%', xl: 340 } }}>
            <Typography sx={{ fontSize: 22, fontWeight: 700, mb: 1.5 }}>Resumo do PMS</Typography>
            <Stack spacing={1.1}>
              <Stack
                direction="row"
                justifyContent="space-between"
                sx={{ px: 1.4, py: 1.2, borderRadius: 3, background: 'rgba(255,255,255,0.06)' }}
              >
                <Typography>Quartos cadastrados</Typography>
                <Typography sx={{ fontWeight: 700 }}>{snapshot.reservas.total_quartos || 0}</Typography>
              </Stack>
              <Stack
                direction="row"
                justifyContent="space-between"
                sx={{ px: 1.4, py: 1.2, borderRadius: 3, background: 'rgba(255,255,255,0.06)' }}
              >
                <Typography>Ocupação atual</Typography>
                <Typography sx={{ fontWeight: 700 }}>{snapshot.reservas.ocupacao_atual || 0}</Typography>
              </Stack>
              <Stack
                direction="row"
                justifyContent="space-between"
                sx={{ px: 1.4, py: 1.2, borderRadius: 3, background: 'rgba(255,255,255,0.06)' }}
              >
                <Typography>Chegadas em 7 dias</Typography>
                <Typography sx={{ fontWeight: 700 }}>{snapshot.reservas.proximas_chegadas || 0}</Typography>
              </Stack>
              <Stack
                direction="row"
                justifyContent="space-between"
                sx={{ px: 1.4, py: 1.2, borderRadius: 3, background: 'rgba(255,255,255,0.06)' }}
              >
                <Typography>Reservas no mês</Typography>
                <Typography sx={{ fontWeight: 700 }}>{snapshot.reservas.reservas_mes || 0}</Typography>
              </Stack>
            </Stack>
          </Paper>
        </Stack>
      </Stack>
    </Box>
  );
}
