import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Tabs, Tab, Grid, Card, CardActionArea, CardContent,
  Chip, LinearProgress, Avatar, AppBar, Toolbar, Button, CircularProgress,
  Alert, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, IconButton, useTheme, useMediaQuery,
} from '@mui/material';
import LoginIcon from '@mui/icons-material/Login';
import HomeIcon from '@mui/icons-material/Home';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/auth';
import volunteerService from '../../services/volunteers/volunteerService';
import scheduleService from '../../services/volunteers/scheduleService';
import VolunteerLoginModal from '../../components/volunteers/VolunteerLoginModal';

const TURNO_STYLE = {
  '6-11h':    { bg: '#FFF8E1', color: '#F57F17', label: '6-11h' },
  '11-16h':   { bg: '#E3F2FD', color: '#1565C0', label: '11-16h' },
  '16-21h':   { bg: '#EDE7F6', color: '#4527A0', label: '16-21h' },
  'folga':    { bg: '#F5F5F5', color: '#757575', label: 'Folga' },
  'Flexível': { bg: '#E8F5E9', color: '#2e7d32', label: 'Flexível' },
};

const DIAS_SEMANA = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

// ---- Utilitários ----
function RelogioTopbar() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <Typography variant="body2" sx={{ opacity: 0.85, letterSpacing: 1, fontVariantNumeric: 'tabular-nums' }}>
      {time.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
    </Typography>
  );
}

function AvatarColorido({ nome, size = 48 }) {
  const cores = ['#1a3a2a', '#2e7d32', '#1565c0', '#6a1b9a', '#bf360c', '#e65100', '#37474f'];
  const idx = nome ? nome.charCodeAt(0) % cores.length : 0;
  const iniciais = nome
    ? nome.trim().split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase()
    : '?';
  return (
    <Avatar sx={{ width: size, height: size, bgcolor: cores[idx], fontSize: size * 0.38, fontWeight: 700 }}>
      {iniciais}
    </Avatar>
  );
}

function BadgeChip({ badge, tipo }) {
  const sx = tipo === 'habilidade'
    ? { bgcolor: '#EAF3DE', color: '#27500A' }
    : { bgcolor: '#FAEEDA', color: '#633806' };
  return (
    <Chip label={badge.nome} size="small"
      sx={{ ...sx, fontWeight: 600, fontSize: 10, height: 20, mr: 0.5, mb: 0.5 }} />
  );
}

function BarraHoras({ horas, meta = 25 }) {
  const pct = Math.min((horas / meta) * 100, 100);
  const cor = pct >= 100 ? 'success' : pct >= 70 ? 'warning' : 'error';
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.25 }}>
        <Typography variant="caption" color="text.secondary">Horas semana</Typography>
        <Typography variant="caption" fontWeight={600}>{horas}h / {meta}h</Typography>
      </Box>
      <LinearProgress variant="determinate" value={pct} color={cor} sx={{ height: 6, borderRadius: 3 }} />
    </Box>
  );
}

// ---- Voluntário da semana ----
function VoluntarioSemana({ v, isMobile }) {
  if (!v) return null;
  return (
    <Paper elevation={0} sx={{
      mb: 3, p: isMobile ? 2 : 2.5, borderRadius: 3,
      background: 'linear-gradient(135deg, #1a3a2a 0%, #2e7d32 100%)', color: 'white',
    }}>
      <Typography variant="overline" sx={{ opacity: 0.7, letterSpacing: 2, fontSize: isMobile ? 9 : 10 }}>
        Voluntário da Semana
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: isMobile ? 1.5 : 2, mt: 1 }}>
        <AvatarColorido nome={v.nome} size={isMobile ? 48 : 64} />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant={isMobile ? 'subtitle1' : 'h6'} fontWeight={700} noWrap>{v.nome}</Typography>
          <Typography variant="body2" sx={{ opacity: 0.8 }} noWrap>
            {v.pais_origem} · {v.idiomas} · {v.semanas_na_pousada} sem.
          </Typography>
          <Box sx={{ mt: 0.75, display: 'flex', flexWrap: 'wrap' }}>
            {v.habilidades?.slice(0, isMobile ? 2 : 4).map(b => (
              <Chip key={b.id} label={b.nome} size="small"
                sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', mr: 0.5, mb: 0.5, fontSize: 10, height: 20 }} />
            ))}
          </Box>
          <Box sx={{ mt: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.25 }}>
              <Typography variant="caption" sx={{ opacity: 0.7 }}>Horas esta semana</Typography>
              <Typography variant="caption" fontWeight={700}>{v.horas_semana}h / 25h</Typography>
            </Box>
            <LinearProgress variant="determinate"
              value={Math.min((v.horas_semana / 25) * 100, 100)}
              sx={{ height: 6, borderRadius: 3, bgcolor: 'rgba(255,255,255,0.2)', '& .MuiLinearProgress-bar': { bgcolor: '#A5D6A7' } }} />
          </Box>
        </Box>
      </Box>
    </Paper>
  );
}

// ---- Card de voluntário ----
function VolunteerCard({ v, onClick, isMobile }) {
  const turnoStyle = v.turno_hoje ? (TURNO_STYLE[v.turno_hoje] || { bg: '#F5F5F5', color: '#333', label: v.turno_hoje }) : null;
  const plantaoHoje = !!v.turno_hoje && v.turno_hoje !== 'folga';

  return (
    <Card variant="outlined" sx={{
      borderLeft: plantaoHoje ? '4px solid #2e7d32' : '1px solid',
      borderColor: plantaoHoje ? '#2e7d32' : 'divider',
      height: '100%',
      '&:hover': { boxShadow: 3 },
    }}>
      <CardActionArea onClick={onClick} sx={{ height: '100%' }}>
        <CardContent sx={{ p: isMobile ? 1.25 : 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.25 }}>
            <AvatarColorido nome={v.nome} size={isMobile ? 36 : 44} />
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="subtitle2" fontWeight={700} noWrap>{v.nome}</Typography>
              <Typography variant="caption" color="text.secondary" noWrap>
                {v.pais_origem}{v.idiomas ? ` · ${v.idiomas}` : ''}
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                {v.semanas_na_pousada} sem. na pousada
              </Typography>
            </Box>
          </Box>

          {turnoStyle && (
            <Chip label={turnoStyle.label} size="small"
              sx={{ bgcolor: turnoStyle.bg, color: turnoStyle.color, fontWeight: 600, mb: 1, fontSize: 11 }} />
          )}

          <Box sx={{ mb: 1 }}>
            <BarraHoras horas={v.horas_semana || 0} />
          </Box>

          {!isMobile && v.bio && (
            <Typography variant="caption" color="text.secondary"
              sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', mb: 1 }}>
              "{v.bio}"
            </Typography>
          )}

          <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
            {v.habilidades?.slice(0, isMobile ? 2 : 3).map(b => <BadgeChip key={b.id} badge={b} tipo="habilidade" />)}
            {!isMobile && v.conquistas?.slice(0, 2).map(c => <BadgeChip key={c.id} badge={c.badge} tipo="conquista" />)}
            {(v.total_insignias || 0) > (isMobile ? 2 : 5) && (
              <Chip label={`+${v.total_insignias - (isMobile ? 2 : 5)}`} size="small"
                sx={{ height: 20, fontSize: 10, bgcolor: '#F5F5F5' }} />
            )}
          </Box>

          <Typography variant="caption" color="success.main" fontWeight={600} sx={{ mt: 0.75, display: 'block' }}>
            Clique para acessar
          </Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}

// ---- Aba Equipe ----
function TabEquipe({ volunteers, voluntarioSemana, onSelectVolunteer, isMobile }) {
  return (
    <Box>
      <VoluntarioSemana v={voluntarioSemana} isMobile={isMobile} />
      <Grid container spacing={isMobile ? 1.5 : 2}>
        {volunteers.map(v => (
          <Grid item xs={6} sm={6} md={4} lg={3} key={v.id}>
            <VolunteerCard v={v} onClick={() => onSelectVolunteer(v)} isMobile={isMobile} />
          </Grid>
        ))}
        {volunteers.length === 0 && (
          <Grid item xs={12}>
            <Typography color="text.secondary" align="center" sx={{ py: 6 }}>
              Nenhum voluntário ativo.
            </Typography>
          </Grid>
        )}
      </Grid>
    </Box>
  );
}

// ---- Aba Escala ----
function TabEscala({ weeklyData, isMobile }) {
  const hoje = new Date().toISOString().split('T')[0];

  if (!weeklyData) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>;
  }

  const { days, volunteers, schedule } = weeklyData;

  return (
    <Box sx={{ overflowX: 'auto' }}>
      <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, minWidth: isMobile ? 520 : 'auto' }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: '#F5F5F5' }}>
              <TableCell sx={{ fontWeight: 700, minWidth: 120, position: 'sticky', left: 0, bgcolor: '#F5F5F5', zIndex: 1 }}>
                Voluntário
              </TableCell>
              {days.map((d, i) => {
                const isHoje = d === hoje;
                const dt = new Date(d + 'T12:00:00');
                return (
                  <TableCell key={d} align="center"
                    sx={{ fontWeight: isHoje ? 800 : 600, bgcolor: isHoje ? '#E8F5E9' : 'inherit', minWidth: 70 }}>
                    <Typography variant="caption" display="block">{DIAS_SEMANA[i]}</Typography>
                    <Typography variant="caption" color={isHoje ? 'success.main' : 'text.secondary'}>
                      {dt.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                    </Typography>
                  </TableCell>
                );
              })}
            </TableRow>
          </TableHead>
          <TableBody>
            {volunteers.map(v => (
              <TableRow key={v.id} hover>
                <TableCell sx={{ position: 'sticky', left: 0, bgcolor: 'white', zIndex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                    <AvatarColorido nome={v.nome} size={24} />
                    <Typography variant="body2" fontWeight={500} noWrap sx={{ maxWidth: 90 }}>{v.nome}</Typography>
                  </Box>
                </TableCell>
                {days.map(d => {
                  const cell = schedule[v.id]?.[d];
                  const turno = cell?.turno ?? cell;
                  const style = TURNO_STYLE[turno];
                  const isHoje = d === hoje;
                  return (
                    <TableCell key={d} align="center" sx={{ bgcolor: isHoje ? '#F1F8E9' : 'inherit' }}>
                      {turno ? (
                        <Chip label={style?.label || turno} size="small"
                          sx={{ bgcolor: style?.bg || '#F5F5F5', color: style?.color || '#333', fontWeight: 600, fontSize: 10, height: 20 }} />
                      ) : (
                        <Typography variant="caption" color="text.disabled">—</Typography>
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
            {volunteers.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">Nenhuma escala para esta semana.</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

// ---- Página principal ----
export default function PublicVolunteersPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const isAdmin = authService.isAuthenticated();

  const [tab, setTab] = useState(0);
  const [volunteers, setVolunteers] = useState([]);
  const [voluntarioSemana, setVoluntarioSemana] = useState(null);
  const [weeklyData, setWeeklyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [loginModal, setLoginModal] = useState({ open: false, volunteer: null });

  const loadData = useCallback(async () => {
    setError('');
    try {
      const [vols, vSemana] = await Promise.all([
        volunteerService.getAll({ status: 'ativo' }),
        volunteerService.getVolunteerOfWeek(),
      ]);
      setVolunteers(Array.isArray(vols) ? vols : []);
      setVoluntarioSemana(vSemana);
    } catch {
      setError('Erro ao carregar dados. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadEscala = useCallback(async () => {
    if (weeklyData) return;
    try {
      const data = await scheduleService.getWeekly();
      setWeeklyData(data);
    } catch {
      setWeeklyData({ days: [], volunteers: [], schedule: {} });
    }
  }, [weeklyData]);

  useEffect(() => { loadData(); }, [loadData]);
  useEffect(() => { if (tab === 1) loadEscala(); }, [tab, loadEscala]);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#FAFAFA' }}>
      {/* Topbar */}
      <AppBar position="static" sx={{ bgcolor: '#1a3a2a' }}>
        <Toolbar sx={{ minHeight: isMobile ? 56 : 64 }}>
          <Typography variant={isMobile ? 'subtitle1' : 'h6'} fontWeight={700} sx={{ flexGrow: 1 }} noWrap>
            {isMobile ? 'Voluntários' : 'Villa Container Lodge — Voluntários'}
          </Typography>
          {!isMobile && <RelogioTopbar />}
          {isAdmin && (
            isMobile ? (
              <IconButton color="inherit" onClick={() => navigate('/')} sx={{ ml: 1 }}>
                <HomeIcon />
              </IconButton>
            ) : (
              <Button color="inherit" startIcon={<HomeIcon />} onClick={() => navigate('/')}
                sx={{ mr: 1, border: '1px solid rgba(255,255,255,0.3)', borderRadius: 2 }}>
                Sistema
              </Button>
            )
          )}
          {isMobile ? (
            <IconButton color="inherit" onClick={() => setLoginModal({ open: true, volunteer: null })} sx={{ ml: 1 }}>
              <LoginIcon />
            </IconButton>
          ) : (
            <Button color="inherit" startIcon={<LoginIcon />}
              onClick={() => setLoginModal({ open: true, volunteer: null })}
              sx={{ ml: 2, border: '1px solid rgba(255,255,255,0.4)', borderRadius: 2 }}>
              Acessar minha conta
            </Button>
          )}
        </Toolbar>
      </AppBar>

      <Box sx={{ maxWidth: isMobile ? '100%' : 1200, mx: 'auto', px: isMobile ? 1.5 : 3, py: isMobile ? 2 : 3 }}>
        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

        <Tabs value={tab} onChange={(_, v) => setTab(v)}
          TabIndicatorProps={{ style: { backgroundColor: '#1a3a2a' } }}
          sx={{ mb: 2.5, borderBottom: 1, borderColor: 'divider' }}>
          <Tab label="Equipe" sx={{ fontWeight: 600, minWidth: isMobile ? 80 : 120 }} />
          <Tab label="Escala da semana" sx={{ fontWeight: 600, minWidth: isMobile ? 80 : 120 }} />
        </Tabs>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress sx={{ color: '#1a3a2a' }} />
          </Box>
        ) : (
          <>
            {tab === 0 && (
              <TabEquipe volunteers={volunteers} voluntarioSemana={voluntarioSemana}
                onSelectVolunteer={v => setLoginModal({ open: true, volunteer: v })}
                isMobile={isMobile} />
            )}
            {tab === 1 && <TabEscala weeklyData={weeklyData} isMobile={isMobile} />}
          </>
        )}
      </Box>

      <VolunteerLoginModal
        open={loginModal.open}
        volunteer={loginModal.volunteer}
        onClose={() => setLoginModal({ open: false, volunteer: null })}
      />
    </Box>
  );
}
