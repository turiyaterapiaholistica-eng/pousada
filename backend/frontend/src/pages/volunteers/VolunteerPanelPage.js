import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, LinearProgress, Chip, Card, CardActionArea,
  CardContent, CircularProgress, Alert, BottomNavigation,
  BottomNavigationAction, Avatar, AppBar, Toolbar, Button,
  Tabs, Tab, Divider, Paper,
  useTheme, useMediaQuery,
} from '@mui/material';
import TodayIcon from '@mui/icons-material/Today';
import CalendarViewWeekIcon from '@mui/icons-material/CalendarViewWeek';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PersonIcon from '@mui/icons-material/Person';
import LogoutIcon from '@mui/icons-material/Logout';
import AssignmentIcon from '@mui/icons-material/Assignment';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/auth';
import volunteerService from '../../services/volunteers/volunteerService';
import taskService from '../../services/volunteers/taskService';
import TaskBottomSheet from '../../components/volunteers/TaskBottomSheet';

// ---- Constantes ----
const AREA_COLORS = {
  Cozinha:        '#F57F17',
  Limpeza:        '#1565C0',
  Jardim:         '#2E7D32',
  'Manutenção':   '#BF360C',
  Administrativo: '#4527A0',
};

const STATUS_STYLE = {
  pending:     { label: 'Pendente',     color: 'default' },
  in_progress: { label: 'Em andamento', color: 'warning' },
  done:        { label: 'Concluída',    color: 'success' },
};

const DIFF_COLORS = { Baixa: 'success', Média: 'warning', Alta: 'error' };
const DIAS_SEMANA_ABREV = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

// ---- Utilitários ----
function getWeekDays() {
  const hoje = new Date();
  const dow = hoje.getDay();
  const seg = new Date(hoje);
  seg.setDate(hoje.getDate() - ((dow + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(seg);
    d.setDate(seg.getDate() + i);
    return d;
  });
}

function isoDate(d) { return d.toISOString().split('T')[0]; }

function saudacao() {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

// ---- Componentes compartilhados ----
function TaskCard({ task, onClick, compact = false }) {
  const { template, status } = task;
  const areaColor = AREA_COLORS[template?.area] || '#666';
  const steps = template?.checklist_steps || [];
  const progress = task.checklist_progress || [];
  const stepsDone = progress.filter(Boolean).length;

  return (
    <Card variant="outlined" sx={{ mb: 1.5, overflow: 'visible', opacity: status === 'done' ? 0.65 : 1 }}>
      <CardActionArea onClick={onClick}>
        <Box sx={{ height: 4, bgcolor: areaColor, borderRadius: '4px 4px 0 0' }} />
        <CardContent sx={{ p: compact ? 1.25 : 1.5, '&:last-child': { pb: compact ? 1.25 : 1.5 } }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.75 }}>
            <Typography variant="subtitle2" fontWeight={700} sx={{ flex: 1, mr: 1 }}>
              {template?.nome}
            </Typography>
            <Chip label={STATUS_STYLE[status]?.label || status} size="small"
              color={STATUS_STYLE[status]?.color || 'default'}
              sx={{ fontSize: 10, height: 20 }} />
          </Box>

          <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', mb: compact ? 0.5 : 1 }}>
            <Chip label={template?.area} size="small"
              sx={{ fontSize: 10, height: 18, bgcolor: `${areaColor}22`, color: areaColor, fontWeight: 600 }} />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
              <AccessTimeIcon sx={{ fontSize: 11, color: 'text.disabled' }} />
              <Typography variant="caption" color="text.disabled">{template?.tempo_estimado}h</Typography>
            </Box>
            <Chip label={template?.dificuldade} size="small"
              color={DIFF_COLORS[template?.dificuldade] || 'default'} sx={{ fontSize: 10, height: 18 }} />
          </Box>

          {!compact && template?.proc_type === 'checklist' && steps.length > 0 && (
            <Box>
              {steps.slice(0, 2).map((step, i) => (
                <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Box sx={{
                    width: 12, height: 12, border: '1.5px solid',
                    borderColor: progress[i] ? 'success.main' : 'grey.400',
                    borderRadius: '2px', flexShrink: 0,
                    bgcolor: progress[i] ? 'success.main' : 'transparent',
                  }} />
                  <Typography variant="caption" color="text.secondary"
                    sx={{ textDecoration: progress[i] ? 'line-through' : 'none' }}>{step}</Typography>
                </Box>
              ))}
              {steps.length > 2 && (
                <Typography variant="caption" color="text.disabled">
                  +{steps.length - 2} etapas ({stepsDone}/{steps.length} concluídas)
                </Typography>
              )}
            </Box>
          )}
        </CardContent>
      </CardActionArea>
    </Card>
  );
}

function WeekStrip({ selectedDate, tasks, onDayChange, compact = false }) {
  const weekDays = getWeekDays();
  const hoje = isoDate(new Date());

  return (
    <Box sx={{ display: 'flex', gap: compact ? 0.5 : 0.75, overflowX: 'auto', pb: 0.5 }}>
      {weekDays.map((d, i) => {
        const iso = isoDate(d);
        const isHoje = iso === hoje;
        const isSel = iso === selectedDate;
        return (
          <Box key={iso} onClick={() => onDayChange(iso)}
            sx={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              minWidth: compact ? 38 : 44, py: 0.75, px: 0.5, borderRadius: 2, cursor: 'pointer',
              bgcolor: isSel ? '#1a3a2a' : isHoje ? '#E8F5E9' : 'transparent',
              border: isHoje && !isSel ? '1px solid #2e7d32' : '1px solid transparent',
              '&:hover': { bgcolor: isSel ? '#1a3a2a' : '#F0F4F0' },
            }}>
            <Typography variant="caption" fontWeight={600}
              sx={{ color: isSel ? 'white' : 'text.secondary', fontSize: 10 }}>
              {DIAS_SEMANA_ABREV[i]}
            </Typography>
            <Typography variant="body2" fontWeight={700}
              sx={{ color: isSel ? 'white' : isHoje ? '#2e7d32' : 'text.primary' }}>
              {d.getDate()}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
}

function HorasProgress({ horasSemana, circular = false }) {
  const meta = 25;
  const pct = Math.min((horasSemana / meta) * 100, 100);
  const cor = pct >= 100 ? '#2e7d32' : pct >= 70 ? '#f57f17' : '#c62828';
  const corMui = pct >= 100 ? 'success' : pct >= 70 ? 'warning' : 'error';

  if (circular) {
    return (
      <Box sx={{ textAlign: 'center', py: 2 }}>
        <Box sx={{ position: 'relative', display: 'inline-flex', mb: 1 }}>
          <CircularProgress variant="determinate" value={pct} size={96} thickness={6} sx={{ color: cor }} />
          <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
            <Typography variant="h6" fontWeight={800}>{horasSemana}</Typography>
            <Typography variant="caption" color="text.secondary">horas</Typography>
          </Box>
        </Box>
        <Typography variant="body2" fontWeight={600} color="text.secondary">
          Meta: {meta}h / semana
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {pct >= 100 ? 'Meta atingida!' : `Faltam ${Math.max(0, meta - horasSemana).toFixed(1)}h`}
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
        <Typography variant="caption" color="text.secondary" fontWeight={600}>
          Horas desta semana
        </Typography>
        <Typography variant="caption" fontWeight={700} color={corMui + '.main'}>
          {horasSemana}h / {meta}h
        </Typography>
      </Box>
      <LinearProgress variant="determinate" value={pct} color={corMui} sx={{ height: 8, borderRadius: 4 }} />
    </Box>
  );
}

function VolunteerSidebar({ volunteer, horasSemana }) {
  if (!volunteer) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
      <CircularProgress sx={{ color: '#1a3a2a' }} />
    </Box>
  );

  const iniciais = volunteer.nome?.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase() || '?';

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
        <Avatar sx={{ width: 72, height: 72, bgcolor: '#1a3a2a', fontSize: 28, fontWeight: 700, mb: 1.5 }}>
          {iniciais}
        </Avatar>
        <Typography variant="h6" fontWeight={700} align="center">{volunteer.nome}</Typography>
        <Typography variant="body2" color="text.secondary" align="center">
          {volunteer.pais_origem}{volunteer.idiomas ? ` · ${volunteer.idiomas}` : ''}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {volunteer.semanas_na_pousada} semana{volunteer.semanas_na_pousada !== 1 ? 's' : ''} na pousada
        </Typography>
        {volunteer.turno_hoje && (
          <Chip label={`Turno: ${volunteer.turno_hoje}`} size="small"
            sx={{ mt: 1, bgcolor: '#E8F5E9', color: '#1a3a2a', fontWeight: 600 }} />
        )}
      </Box>

      <Divider sx={{ mb: 2 }} />

      <HorasProgress horasSemana={horasSemana} circular />

      {volunteer.bio && (
        <>
          <Divider sx={{ my: 2 }} />
          <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', fontSize: 13 }}>
            "{volunteer.bio}"
          </Typography>
        </>
      )}

      {volunteer.habilidades?.length > 0 && (
        <>
          <Divider sx={{ my: 2 }} />
          <Typography variant="caption" fontWeight={700} color="text.secondary" display="block" sx={{ mb: 0.75 }}>
            Habilidades
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {volunteer.habilidades.map(b => (
              <Chip key={b.id} label={b.nome} size="small"
                sx={{ bgcolor: '#EAF3DE', color: '#27500A', fontWeight: 600, fontSize: 10 }} />
            ))}
          </Box>
        </>
      )}

      {volunteer.conquistas?.length > 0 && (
        <>
          <Divider sx={{ my: 2 }} />
          <Typography variant="caption" fontWeight={700} color="text.secondary" display="block" sx={{ mb: 0.75 }}>
            Conquistas
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {volunteer.conquistas.map(c => (
              <Chip key={c.id} label={c.badge.nome} size="small"
                sx={{ bgcolor: '#FAEEDA', color: '#633806', fontWeight: 600, fontSize: 10 }} />
            ))}
          </Box>
        </>
      )}
    </Box>
  );
}

// ---- Vista semanal (compartilhada) ----
function WeekView({ weekTasks }) {
  const weekDays = getWeekDays();
  const hoje = isoDate(new Date());

  const tasksByDate = weekTasks.reduce((acc, t) => {
    const d = t.data;
    if (!acc[d]) acc[d] = [];
    acc[d].push(t);
    return acc;
  }, {});

  return (
    <Box>
      {weekDays.map((d, i) => {
        const iso = isoDate(d);
        const dayTasks = tasksByDate[iso] || [];
        const isHoje = iso === hoje;
        return (
          <Box key={iso} sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Box sx={{
                width: 32, height: 32, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                bgcolor: isHoje ? '#1a3a2a' : '#F5F5F5',
              }}>
                <Typography variant="caption" fontWeight={700} color={isHoje ? 'white' : 'text.primary'}>
                  {d.getDate()}
                </Typography>
              </Box>
              <Typography variant="body2" fontWeight={600} color={isHoje ? 'success.main' : 'text.primary'}>
                {DIAS_SEMANA_ABREV[i]}{isHoje ? ' · Hoje' : ''}
              </Typography>
              {dayTasks.length > 0 && <Chip label={dayTasks.length} size="small" sx={{ height: 18, fontSize: 10 }} />}
            </Box>
            {dayTasks.length === 0 ? (
              <Typography variant="caption" color="text.disabled" sx={{ pl: 5 }}>Sem tarefas</Typography>
            ) : (
              <Box sx={{ pl: 5 }}>
                {dayTasks.map(t => (
                  <Box key={t.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: AREA_COLORS[t.template?.area] || '#ccc', flexShrink: 0 }} />
                    <Typography variant="caption"
                      sx={{ textDecoration: t.status === 'done' ? 'line-through' : 'none', color: t.status === 'done' ? 'text.disabled' : 'text.primary' }}>
                      {t.template?.nome}
                    </Typography>
                    <Chip label={STATUS_STYLE[t.status]?.label} size="small" color={STATUS_STYLE[t.status]?.color}
                      sx={{ fontSize: 9, height: 16, ml: 'auto' }} />
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        );
      })}
    </Box>
  );
}

// ---- Layout Mobile ----
function MobileLayout({ volunteer, tasks, weekTasks, horasSemana, selectedDate, onDayChange, onTaskUpdated, onLogout, loading, error, onErrorClose }) {
  const [tab, setTab] = useState(0);
  const [selectedTask, setSelectedTask] = useState(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const user = authService.getCurrentUser();

  const pendentes = tasks.filter(t => t.status !== 'done').length;
  const hoje = isoDate(new Date());

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#F5F5F5', display: 'flex', flexDirection: 'column', maxWidth: 480, mx: 'auto' }}>
      {/* Header verde */}
      <Box sx={{ bgcolor: '#1a3a2a', color: 'white', px: 2, pt: 3, pb: 2.5 }}>
        <Typography variant="caption" sx={{ opacity: 0.7, textTransform: 'capitalize' }}>
          {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </Typography>
        <Typography variant="h6" fontWeight={700} sx={{ mt: 0.25 }}>
          {saudacao()}, {user?.first_name || volunteer?.nome?.split(' ')[0] || 'Voluntário'}!
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1, flexWrap: 'wrap' }}>
          {volunteer?.turno_hoje && (
            <Chip label={`Turno: ${volunteer.turno_hoje}`} size="small"
              sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: 'white', fontWeight: 600 }} />
          )}
          <Chip
            label="Ver atividades"
            size="small"
            icon={<AssignmentIcon sx={{ color: 'white !important', fontSize: 14 }} />}
            onClick={() => navigate('/voluntarios/minhas-tarefas')}
            sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 600, cursor: 'pointer' }}
          />
        </Box>
      </Box>

      {/* Conteúdo */}
      <Box sx={{ flex: 1, px: 2, pt: 2, pb: 9, overflow: 'auto' }}>
        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={onErrorClose}>{error}</Alert>}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress sx={{ color: '#1a3a2a' }} />
          </Box>
        ) : (
          <>
            {tab === 0 && (
              <>
                {/* Tira de dias */}
                <Box sx={{ mb: 2 }}>
                  <WeekStrip selectedDate={selectedDate} tasks={tasks} onDayChange={onDayChange} />
                </Box>

                {/* Progresso horas */}
                <Box sx={{ mb: 2, p: 1.5, bgcolor: '#F9FBF9', borderRadius: 2 }}>
                  <HorasProgress horasSemana={horasSemana} />
                </Box>

                {/* Título do dia */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                  <Typography variant="subtitle2" fontWeight={700}>
                    {selectedDate === hoje ? 'Suas tarefas de hoje' :
                      `Tarefas de ${new Date(selectedDate + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}`}
                  </Typography>
                  {pendentes > 0 && <Chip label={`${pendentes} pendente${pendentes > 1 ? 's' : ''}`} size="small" color="warning" />}
                </Box>

                {tasks.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 6 }}>
                    <Typography color="text.secondary">Nenhuma tarefa para este dia.</Typography>
                  </Box>
                ) : (
                  tasks.map(task => (
                    <TaskCard key={task.id} task={task} onClick={() => { setSelectedTask(task); setSheetOpen(true); }} />
                  ))
                )}
              </>
            )}
            {tab === 1 && <WeekView weekTasks={weekTasks} />}
            {tab === 2 && <HorasProgress horasSemana={horasSemana} circular />}
            {tab === 3 && (
              <Box sx={{ py: 2 }}>
                {volunteer && <VolunteerSidebar volunteer={volunteer} horasSemana={horasSemana} />}
                <Box sx={{ px: 2, pt: 2 }}>
                  <Button fullWidth variant="outlined" color="error" startIcon={<LogoutIcon />} onClick={onLogout}>
                    Sair
                  </Button>
                </Box>
              </Box>
            )}
          </>
        )}
      </Box>

      <TaskBottomSheet
        task={selectedTask}
        open={sheetOpen}
        onClose={() => { setSheetOpen(false); setSelectedTask(null); }}
        onUpdated={() => { setSheetOpen(false); setSelectedTask(null); onTaskUpdated(); }}
      />

      {/* Bottom Navigation */}
      <BottomNavigation value={tab} onChange={(_, v) => setTab(v)}
        sx={{
          position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
          width: '100%', maxWidth: 480, bgcolor: 'white',
          borderTop: '1px solid', borderColor: 'divider',
          '& .Mui-selected': { color: '#1a3a2a' },
        }}>
        <BottomNavigationAction label="Hoje" icon={<TodayIcon />} />
        <BottomNavigationAction label="Semana" icon={<CalendarViewWeekIcon />} />
        <BottomNavigationAction label="Horas" icon={<AccessTimeIcon />} />
        <BottomNavigationAction label="Perfil" icon={<PersonIcon />} />
      </BottomNavigation>
    </Box>
  );
}

// ---- Layout Desktop ----
function DesktopLayout({ volunteer, tasks, weekTasks, horasSemana, selectedDate, onDayChange, onTaskUpdated, onLogout, loading, error, onErrorClose }) {
  const [tab, setTab] = useState(0);
  const [selectedTask, setSelectedTask] = useState(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const user = authService.getCurrentUser();
  const pendentes = tasks.filter(t => t.status !== 'done').length;
  const hoje = isoDate(new Date());

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', bgcolor: '#F5F7F5' }}>
      {/* Top AppBar */}
      <AppBar position="static" sx={{ bgcolor: '#1a3a2a', zIndex: 10 }}>
        <Toolbar>
          <Typography variant="h6" fontWeight={700} sx={{ flexGrow: 1 }}>
            {saudacao()}, {user?.first_name || volunteer?.nome?.split(' ')[0] || 'Voluntário'}!
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.75, mr: 2 }}>
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </Typography>
          {volunteer?.turno_hoje && (
            <Chip label={`Turno: ${volunteer.turno_hoje}`} size="small"
              sx={{ mr: 2, bgcolor: 'rgba(255,255,255,0.15)', color: 'white', fontWeight: 600 }} />
          )}
          <Button color="inherit" startIcon={<LogoutIcon />} onClick={onLogout}
            sx={{ border: '1px solid rgba(255,255,255,0.4)', borderRadius: 2 }}>
            Sair
          </Button>
        </Toolbar>
      </AppBar>

      {/* Corpo principal */}
      <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* Sidebar esquerda */}
        <Paper elevation={0} square sx={{
          width: 300, flexShrink: 0,
          borderRight: '1px solid', borderColor: 'divider',
          overflow: 'auto', bgcolor: 'white',
        }}>
          <VolunteerSidebar volunteer={volunteer} horasSemana={horasSemana} />
        </Paper>

        {/* Área principal */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Sub-tabs */}
          <Box sx={{ bgcolor: 'white', borderBottom: '1px solid', borderColor: 'divider', px: 3, display: 'flex', alignItems: 'center' }}>
            <Tabs value={tab} onChange={(_, v) => setTab(v)}
              TabIndicatorProps={{ style: { backgroundColor: '#1a3a2a' } }}
              sx={{ flex: 1 }}>
              <Tab label="Hoje" icon={<TodayIcon />} iconPosition="start" sx={{ fontWeight: 600, '&.Mui-selected': { color: '#1a3a2a' } }} />
              <Tab label="Semana" icon={<CalendarViewWeekIcon />} iconPosition="start" sx={{ fontWeight: 600, '&.Mui-selected': { color: '#1a3a2a' } }} />
            </Tabs>
            <Button
              size="small"
              variant="outlined"
              startIcon={<AssignmentIcon />}
              onClick={() => navigate('/voluntarios/minhas-tarefas')}
              sx={{ color: '#1a3a2a', borderColor: '#1a3a2a', mr: 1, fontSize: 12 }}
            >
              Ver atividades
            </Button>
          </Box>

          <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
            {error && <Alert severity="error" sx={{ mb: 2 }} onClose={onErrorClose}>{error}</Alert>}

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress sx={{ color: '#1a3a2a' }} />
              </Box>
            ) : tab === 0 ? (
              <>
                {/* Strip de dias */}
                <Box sx={{ mb: 2.5 }}>
                  <WeekStrip selectedDate={selectedDate} tasks={tasks} onDayChange={onDayChange} compact />
                </Box>

                {/* Título + contador */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="subtitle1" fontWeight={700}>
                    {selectedDate === hoje ? 'Tarefas de hoje' :
                      `Tarefas de ${new Date(selectedDate + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}`}
                  </Typography>
                  {pendentes > 0 && <Chip label={`${pendentes} pendente${pendentes > 1 ? 's' : ''}`} size="small" color="warning" />}
                </Box>

                {/* Grid de tarefas — 2 colunas no desktop */}
                {tasks.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 8 }}>
                    <Typography color="text.secondary">Nenhuma tarefa para este dia.</Typography>
                  </Box>
                ) : (
                  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 2 }}>
                    {tasks.map(task => (
                      <TaskCard key={task.id} task={task} compact
                        onClick={() => { setSelectedTask(task); setSheetOpen(true); }} />
                    ))}
                  </Box>
                )}
              </>
            ) : (
              <WeekView weekTasks={weekTasks} />
            )}
          </Box>
        </Box>
      </Box>

      {/* Task detail — drawer lateral (direita) no desktop */}
      <TaskBottomSheet
        task={selectedTask}
        open={sheetOpen}
        onClose={() => { setSheetOpen(false); setSelectedTask(null); }}
        onUpdated={() => { setSheetOpen(false); setSelectedTask(null); onTaskUpdated(); }}
      />
    </Box>
  );
}

// ---- Página principal ----
export default function VolunteerPanelPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();

  const [volunteer, setVolunteer] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [weekTasks, setWeekTasks] = useState([]);
  const [horasSemana, setHorasSemana] = useState(0);
  const [selectedDate, setSelectedDate] = useState(isoDate(new Date()));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadVolunteer = useCallback(async () => {
    try {
      const data = await volunteerService.getMe();
      setVolunteer(data);
    } catch { /* sem perfil de voluntário */ }
  }, []);

  const loadTasks = useCallback(async (date) => {
    try {
      const data = await taskService.getMyTasks(date);
      setTasks(Array.isArray(data) ? data : []);
    } catch { setTasks([]); }
  }, []);

  const loadWeekTasks = useCallback(async () => {
    try {
      const weekDays = getWeekDays();
      const results = await Promise.all(weekDays.map(d => taskService.getMyTasks(isoDate(d))));
      setWeekTasks(results.flat().filter(Boolean));
    } catch { setWeekTasks([]); }
  }, []);

  const loadHoras = useCallback(async () => {
    try {
      const data = await taskService.getMyWeekHours();
      setHorasSemana(data.horas_semana || 0);
    } catch { setHorasSemana(0); }
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      await Promise.all([loadVolunteer(), loadTasks(selectedDate), loadWeekTasks(), loadHoras()]);
    } catch { setError('Erro ao carregar dados.'); }
    finally { setLoading(false); }
  }, [selectedDate, loadVolunteer, loadTasks, loadWeekTasks, loadHoras]);

  useEffect(() => { loadAll(); }, []);

  const handleDayChange = async (date) => {
    setSelectedDate(date);
    await loadTasks(date);
  };

  const handleTaskUpdated = () => {
    loadTasks(selectedDate);
    loadHoras();
    loadWeekTasks();
  };

  const handleLogout = async () => {
    await authService.logout();
    navigate('/voluntarios');
  };

  const sharedProps = {
    volunteer, tasks, weekTasks, horasSemana, selectedDate,
    onDayChange: handleDayChange,
    onTaskUpdated: handleTaskUpdated,
    onLogout: handleLogout,
    loading, error,
    onErrorClose: () => setError(''),
  };

  return isMobile
    ? <MobileLayout {...sharedProps} />
    : <DesktopLayout {...sharedProps} />;
}
