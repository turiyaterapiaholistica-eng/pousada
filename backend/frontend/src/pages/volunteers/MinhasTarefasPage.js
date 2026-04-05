import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Card, CardContent, Chip, Button,
  Collapse, Checkbox, FormControlLabel, Divider,
  CircularProgress, Alert, LinearProgress,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import FlagIcon from '@mui/icons-material/Flag';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import taskService from '../../services/volunteers/taskService';
import TaskBottomSheet from '../../components/volunteers/TaskBottomSheet';

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

function isoDate(d) { return d.toISOString().split('T')[0]; }

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

// ---- Tira de dias da semana ----
function WeekStrip({ selectedDate, onDayChange }) {
  const weekDays = getWeekDays();
  const hoje = isoDate(new Date());

  return (
    <Box sx={{ display: 'flex', gap: 0.75, overflowX: 'auto', pb: 0.5 }}>
      {weekDays.map((d, i) => {
        const iso = isoDate(d);
        const isHoje = iso === hoje;
        const isSel = iso === selectedDate;
        return (
          <Box key={iso} onClick={() => onDayChange(iso)}
            sx={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              minWidth: 44, py: 0.75, px: 0.5, borderRadius: 2, cursor: 'pointer',
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

// ---- Card de tarefa com expand inline ----
function TaskActivityCard({ task, expandedId, onToggleExpand, onIniciar, onFinalizar, loadingId }) {
  const { template, status } = task;
  const areaColor = AREA_COLORS[template?.area] || '#666';
  const isDone = status === 'done';
  const isInProgress = status === 'in_progress';
  const isPending = status === 'pending';
  const isExpanded = expandedId === task.id;
  const isLoading = loadingId === task.id;

  const steps = template?.checklist_steps || [];
  const progress = task.checklist_progress || [];
  const stepsDone = progress.filter(Boolean).length;

  const resumo = template?.proc_text || '';
  const resumoCurto = resumo.length > 100 ? resumo.slice(0, 100) + '…' : resumo;

  // Borda lateral baseada no status
  const cardBorder = isDone
    ? '1px dashed #ccc'
    : isInProgress
    ? `2px solid ${areaColor}`
    : '1px solid rgba(0,0,0,0.12)';

  return (
    <Card
      variant="outlined"
      sx={{
        opacity: isDone ? 0.55 : 1,
        border: cardBorder,
        gridColumn: isExpanded ? '1 / -1' : 'auto',
        transition: 'opacity 0.2s, border 0.2s',
      }}
    >
      {/* Barra de cor da área (top) */}
      <Box sx={{ height: 4, bgcolor: areaColor, borderRadius: '4px 4px 0 0' }} />

      <CardContent sx={{ p: 1.75, '&:last-child': { pb: 1.75 } }}>
        {/* Chips de área, turno, status */}
        <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', mb: 1 }}>
          <Chip label={template?.area} size="small"
            sx={{ bgcolor: `${areaColor}22`, color: areaColor, fontWeight: 700, fontSize: 10, height: 20 }} />
          {task.turno && (
            <Chip label={task.turno} size="small" variant="outlined" sx={{ fontSize: 10, height: 20 }} />
          )}
          <Chip
            label={STATUS_STYLE[status]?.label || status}
            size="small"
            color={STATUS_STYLE[status]?.color || 'default'}
            sx={{ fontSize: 10, height: 20, ml: 'auto' }}
          />
        </Box>

        {/* Nome da atividade */}
        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 0.5 }}>
          {template?.nome}
        </Typography>

        {/* Resumo curto */}
        {resumoCurto && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontSize: 13 }}>
            {resumoCurto}
          </Typography>
        )}

        {/* Barra de progresso do checklist (se em andamento) */}
        {isInProgress && steps.length > 0 && (
          <Box sx={{ mb: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.25 }}>
              <Typography variant="caption" color="text.secondary">Progresso</Typography>
              <Typography variant="caption" fontWeight={600}>{stepsDone}/{steps.length}</Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={steps.length > 0 ? (stepsDone / steps.length) * 100 : 0}
              color="warning"
              sx={{ height: 5, borderRadius: 3 }}
            />
          </Box>
        )}

        {/* Botões da face do card */}
        <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
          {!isDone && (
            <Button
              size="small"
              variant="outlined"
              color="inherit"
              endIcon={isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              onClick={() => onToggleExpand(task.id)}
              sx={{ fontSize: 12 }}
            >
              {isExpanded ? 'Fechar' : 'Ver procedimento'}
            </Button>
          )}

          {isPending && (
            <Button
              size="small"
              variant="contained"
              color="warning"
              startIcon={isLoading ? <CircularProgress size={14} color="inherit" /> : <PlayArrowIcon />}
              disabled={isLoading}
              onClick={() => onIniciar(task.id)}
              sx={{ fontSize: 12 }}
            >
              Iniciar
            </Button>
          )}

          {isInProgress && (
            <Button
              size="small"
              variant="contained"
              color="success"
              startIcon={<FlagIcon />}
              onClick={() => onFinalizar(task)}
              sx={{ fontSize: 12 }}
            >
              Finalizar
            </Button>
          )}

          {isDone && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <CheckCircleIcon sx={{ color: 'success.main', fontSize: 18 }} />
              <Typography variant="caption" color="success.main" fontWeight={600}>Concluída</Typography>
              {task.horas_gastas != null && (
                <Typography variant="caption" color="text.secondary">· {task.horas_gastas}h</Typography>
              )}
            </Box>
          )}
        </Box>

        {/* Seção expandida */}
        <Collapse in={isExpanded} timeout="auto" unmountOnExit>
          <Divider sx={{ my: 2 }} />

          {/* Resumo completo */}
          {resumo && (
            <Box sx={{ mb: 2, p: 1.5, bgcolor: '#F9FBF9', borderRadius: 2, border: '1px solid #e0e0e0' }}>
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 0.5 }}>Resumo</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-line' }}>
                {resumo}
              </Typography>
            </Box>
          )}

          {/* Checklist */}
          {steps.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.75 }}>
                <Typography variant="subtitle2" fontWeight={600}>Etapas</Typography>
                <Typography variant="caption" color="text.secondary">{stepsDone}/{steps.length}</Typography>
              </Box>
              {steps.map((step, i) => (
                <FormControlLabel
                  key={i}
                  control={
                    <Checkbox
                      checked={progress[i] || false}
                      disabled
                      color="success"
                      size="small"
                    />
                  }
                  label={
                    <Typography variant="body2"
                      sx={{ textDecoration: progress[i] ? 'line-through' : 'none', color: progress[i] ? 'text.disabled' : 'text.primary', fontSize: 13 }}>
                      {step}
                    </Typography>
                  }
                  sx={{ display: 'flex', alignItems: 'flex-start', mb: 0.25, ml: 0 }}
                />
              ))}
            </Box>
          )}

          {/* Detalhes */}
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
            <Chip label={`${template?.tempo_estimado}h estimado`} size="small" variant="outlined" />
            <Chip label={template?.dificuldade} size="small" color={DIFF_COLORS[template?.dificuldade] || 'default'} />
          </Box>

          {/* Botões na seção expandida */}
          <Box sx={{ display: 'flex', gap: 1 }}>
            {isPending && (
              <Button
                size="small"
                variant="contained"
                color="warning"
                startIcon={isLoading ? <CircularProgress size={14} color="inherit" /> : <PlayArrowIcon />}
                disabled={isLoading}
                onClick={() => onIniciar(task.id)}
              >
                Iniciar tarefa
              </Button>
            )}
            {isInProgress && (
              <Button
                size="small"
                variant="contained"
                color="success"
                startIcon={<FlagIcon />}
                onClick={() => onFinalizar(task)}
              >
                Finalizar tarefa
              </Button>
            )}
            <Button size="small" variant="text" onClick={() => onToggleExpand(task.id)}>
              Fechar
            </Button>
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
}

// ---- Página principal ----
export default function MinhasTarefasPage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState(isoDate(new Date()));
  const [expandedId, setExpandedId] = useState(null);
  const [loadingId, setLoadingId] = useState(null);
  const [sheetTask, setSheetTask] = useState(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const loadTasks = useCallback(async (date) => {
    setLoading(true);
    setError('');
    try {
      const data = await taskService.getMyTasks(date);
      setTasks(Array.isArray(data) ? data : []);
    } catch {
      setError('Erro ao carregar tarefas.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadTasks(selectedDate); }, [selectedDate, loadTasks]);

  const handleDayChange = (date) => {
    setSelectedDate(date);
    setExpandedId(null);
  };

  const handleToggleExpand = (id) => {
    setExpandedId(prev => prev === id ? null : id);
  };

  const handleIniciar = async (taskId) => {
    setLoadingId(taskId);
    setError('');
    try {
      await taskService.iniciar(taskId);
      await loadTasks(selectedDate);
    } catch {
      setError('Erro ao iniciar tarefa.');
    } finally {
      setLoadingId(null);
    }
  };

  const handleFinalizar = (task) => {
    setSheetTask(task);
    setSheetOpen(true);
  };

  const handleSheetUpdated = () => {
    setSheetOpen(false);
    setSheetTask(null);
    setExpandedId(null);
    loadTasks(selectedDate);
  };

  // Contadores por status
  const pendentes = tasks.filter(t => t.status === 'pending').length;
  const emAndamento = tasks.filter(t => t.status === 'in_progress').length;
  const concluidas = tasks.filter(t => t.status === 'done').length;
  const hoje = isoDate(new Date());

  return (
    <Box>
      {/* Cabeçalho */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>Minhas Tarefas</Typography>
        <Typography variant="body2" color="text.secondary">
          {selectedDate === hoje
            ? 'Tarefas atribuídas para hoje'
            : `Tarefas de ${new Date(selectedDate + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}`
          }
        </Typography>
      </Box>

      {/* Tira de dias */}
      <Box sx={{ mb: 2.5 }}>
        <WeekStrip selectedDate={selectedDate} onDayChange={handleDayChange} />
      </Box>

      {/* Chips de resumo */}
      {!loading && tasks.length > 0 && (
        <Box sx={{ display: 'flex', gap: 1, mb: 2.5, flexWrap: 'wrap' }}>
          {pendentes > 0 && (
            <Chip label={`${pendentes} pendente${pendentes > 1 ? 's' : ''}`} size="small" color="default" variant="outlined" />
          )}
          {emAndamento > 0 && (
            <Chip label={`${emAndamento} em andamento`} size="small" color="warning" />
          )}
          {concluidas > 0 && (
            <Chip label={`${concluidas} concluída${concluidas > 1 ? 's' : ''}`} size="small" color="success" />
          )}
        </Box>
      )}

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress color="success" />
        </Box>
      ) : tasks.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography color="text.secondary">Nenhuma tarefa atribuída para este dia.</Typography>
        </Box>
      ) : (
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(auto-fill, minmax(320px, 1fr))' },
          gap: 2,
        }}>
          {tasks.map(task => (
            <TaskActivityCard
              key={task.id}
              task={task}
              expandedId={expandedId}
              onToggleExpand={handleToggleExpand}
              onIniciar={handleIniciar}
              onFinalizar={handleFinalizar}
              loadingId={loadingId}
            />
          ))}
        </Box>
      )}

      <TaskBottomSheet
        task={sheetTask}
        open={sheetOpen}
        onClose={() => { setSheetOpen(false); setSheetTask(null); }}
        onUpdated={handleSheetUpdated}
      />
    </Box>
  );
}
