import React, { useState, useEffect, useRef } from 'react';
import {
  Drawer, Box, Typography, Chip, Button, TextField,
  Checkbox, FormControlLabel, Divider, IconButton, Alert,
  RadioGroup, Radio, FormLabel, FormControl,
  useTheme, useMediaQuery,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import FlagIcon from '@mui/icons-material/Flag';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import taskService from '../../services/volunteers/taskService';

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

// Fase 1 — execução da tarefa (checklist / texto)
function ExecucaoPhase({ task, checklist, onCheckStep, onIniciar, onAvancar, loading, error }) {
  const { template, status } = task;
  const isPending = status === 'pending';
  const isInProgress = status === 'in_progress';
  const steps = template?.checklist_steps || [];
  const stepsDone = checklist.filter(Boolean).length;
  const allDone = steps.length > 0 ? stepsDone === steps.length : true;

  return (
    <Box>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Resumo / descrição */}
      {template?.proc_text ? (
        <Box sx={{ mb: 2, p: 1.5, bgcolor: '#F9FBF9', borderRadius: 2, border: '1px solid #e0e0e0' }}>
          <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 0.5 }}>Resumo</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-line' }}>
            {template.proc_text}
          </Typography>
        </Box>
      ) : null}

      {/* Checklist de etapas */}
      {steps.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="subtitle2" fontWeight={600}>Etapas</Typography>
            <Typography variant="caption" color="text.secondary">
              {stepsDone}/{steps.length} concluídas
            </Typography>
          </Box>
          {steps.map((step, i) => (
            <FormControlLabel
              key={i}
              control={
                <Checkbox
                  checked={checklist[i] || false}
                  onChange={e => onCheckStep(i, e.target.checked)}
                  disabled={isPending || status === 'done'}
                  color="success"
                  size="small"
                />
              }
              label={
                <Typography variant="body2"
                  sx={{ textDecoration: checklist[i] ? 'line-through' : 'none', color: checklist[i] ? 'text.disabled' : 'text.primary' }}>
                  {step}
                </Typography>
              }
              sx={{ display: 'flex', alignItems: 'flex-start', mb: 0.5 }}
            />
          ))}
        </Box>
      )}

      <Divider sx={{ my: 2 }} />

      {isPending && (
        <Button
          fullWidth variant="contained" color="warning" size="large"
          startIcon={<PlayArrowIcon />}
          onClick={onIniciar}
          disabled={loading}
          sx={{ py: 1.5, fontWeight: 700 }}
        >
          {loading ? 'Iniciando...' : 'Iniciar tarefa'}
        </Button>
      )}

      {isInProgress && (
        <Button
          fullWidth variant="contained" color="success" size="large"
          startIcon={<FlagIcon />}
          onClick={onAvancar}
          disabled={loading}
          sx={{ py: 1.5, fontWeight: 700 }}
        >
          Finalizar tarefa
        </Button>
      )}

      {status === 'done' && (
        <Box sx={{ textAlign: 'center', py: 2 }}>
          <CheckCircleIcon sx={{ fontSize: 48, color: 'success.main' }} />
          <Typography variant="subtitle1" fontWeight={700} color="success.main">Tarefa concluída!</Typography>
          {task.horas_gastas != null && (
            <Typography variant="body2" color="text.secondary">{task.horas_gastas}h registradas</Typography>
          )}
        </Box>
      )}
    </Box>
  );
}

// Fase 2 — finalização (perguntas, horas, problemas, foto)
function FinalizacaoPhase({ task, checklist, onConfirm, onVoltar, loading, error }) {
  const { template } = task;
  const perguntas = template?.perguntas_finalizacao || [];

  const horasIniciais = task.horas_gastas != null
    ? { h: String(Math.floor(task.horas_gastas)), m: String(Math.round((task.horas_gastas % 1) * 60)) }
    : { h: '', m: '0' };
  const [horasH, setHorasH] = useState(horasIniciais.h);
  const [horasM, setHorasM] = useState(horasIniciais.m);
  const [respostas, setRespostas] = useState(() =>
    perguntas.reduce((acc, q) => ({ ...acc, [q.id]: '' }), {})
  );
  const [problema, setProblema] = useState('');
  const [notes, setNotes] = useState('');
  const [foto, setFoto] = useState(null);
  const fileRef = useRef();

  const handleSetResposta = (id, val) => setRespostas(prev => ({ ...prev, [id]: val }));

  const totalHoras = (parseInt(horasH, 10) || 0) + (parseInt(horasM, 10) || 0) / 60;
  const podeConfirmar = (parseInt(horasH, 10) > 0) || (parseInt(horasH, 10) === 0 && parseInt(horasM, 10) > 0);

  const handleConfirm = () => {
    if (!podeConfirmar) return;
    const payload = {
      horas_gastas: Math.round(totalHoras * 100) / 100,
      checklist_progress: checklist,
      respostas_finalizacao: respostas,
      problema_reportado: problema,
      notes,
    };
    if (foto) payload.foto = foto;
    onConfirm(payload);
  };

  return (
    <Box>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Horas gastas */}
      <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>Tempo gasto *</Typography>
      <Box sx={{ display: 'flex', gap: 1.5, mb: 2, alignItems: 'center' }}>
        <TextField
          type="number"
          label="Horas"
          inputProps={{ min: 0, max: 12, step: 1 }}
          value={horasH}
          onChange={e => setHorasH(e.target.value)}
          size="small"
          sx={{ flex: 1 }}
        />
        <Typography variant="body2" color="text.secondary">h</Typography>
        <TextField
          type="number"
          label="Minutos"
          inputProps={{ min: 0, max: 55, step: 5 }}
          value={horasM}
          onChange={e => setHorasM(e.target.value)}
          size="small"
          sx={{ flex: 1 }}
        />
        <Typography variant="body2" color="text.secondary">min</Typography>
      </Box>

      {/* Perguntas de finalização */}
      {perguntas.length > 0 && (
        <>
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5 }}>Perguntas de finalização</Typography>
          {perguntas.map(q => (
            <Box key={q.id} sx={{ mb: 2 }}>
              {q.tipo === 'sim_nao' ? (
                <FormControl>
                  <FormLabel sx={{ fontSize: 14, fontWeight: 500, color: 'text.primary' }}>{q.texto}</FormLabel>
                  <RadioGroup
                    row
                    value={respostas[q.id] || ''}
                    onChange={e => handleSetResposta(q.id, e.target.value)}
                  >
                    <FormControlLabel value="sim" control={<Radio size="small" color="success" />} label="Sim" />
                    <FormControlLabel value="nao" control={<Radio size="small" color="error" />} label="Não" />
                  </RadioGroup>
                </FormControl>
              ) : q.tipo === 'numero' ? (
                <TextField
                  fullWidth type="number"
                  label={q.texto}
                  value={respostas[q.id] || ''}
                  onChange={e => handleSetResposta(q.id, e.target.value)}
                  size="small"
                />
              ) : (
                <TextField
                  fullWidth multiline rows={2}
                  label={q.texto}
                  value={respostas[q.id] || ''}
                  onChange={e => handleSetResposta(q.id, e.target.value)}
                  size="small"
                />
              )}
            </Box>
          ))}
        </>
      )}

      <Divider sx={{ my: 2 }} />

      {/* Problema reportado */}
      <TextField
        fullWidth multiline rows={2}
        label="Problema reportado (opcional)"
        placeholder="Descreva qualquer problema encontrado..."
        value={problema}
        onChange={e => setProblema(e.target.value)}
        size="small"
        sx={{ mb: 2 }}
      />

      {/* Observações */}
      <TextField
        fullWidth multiline rows={2}
        label="Observações (opcional)"
        value={notes}
        onChange={e => setNotes(e.target.value)}
        size="small"
        sx={{ mb: 2 }}
      />

      {/* Foto */}
      <Box sx={{ mb: 2 }}>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={e => setFoto(e.target.files[0] || null)}
        />
        <Button
          variant="outlined"
          size="small"
          startIcon={<PhotoCameraIcon />}
          onClick={() => fileRef.current?.click()}
          color="inherit"
        >
          {foto ? foto.name : 'Anexar foto (opcional)'}
        </Button>
      </Box>

      {/* Botões */}
      <Box sx={{ display: 'flex', gap: 1 }}>
        <Button variant="outlined" onClick={onVoltar} disabled={loading} sx={{ flex: 1 }}>
          Voltar
        </Button>
        <Button
          variant="contained" color="success" size="large"
          startIcon={<CheckCircleIcon />}
          disabled={!podeConfirmar || loading}
          onClick={handleConfirm}
          sx={{ flex: 2, fontWeight: 700 }}
        >
          {loading ? 'Salvando...' : 'Confirmar conclusão'}
        </Button>
      </Box>
    </Box>
  );
}

// ---- Componente principal ----
export default function TaskBottomSheet({ task, open, onClose, onUpdated }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // 'exec' | 'finalizar'
  const [phase, setPhase] = useState('exec');
  const [checklist, setChecklist] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (task) {
      setPhase('exec');
      setChecklist(
        task.checklist_progress?.length > 0
          ? [...task.checklist_progress]
          : (task.template?.checklist_steps || []).map(() => false)
      );
      setError('');
    }
  }, [task]);

  if (!task) return null;

  const { template, status } = task;
  const areaColor = AREA_COLORS[template?.area] || '#666';

  const handleCheckStep = (i, checked) => {
    const next = [...checklist];
    next[i] = checked;
    setChecklist(next);
  };

  const handleIniciar = async () => {
    setLoading(true);
    setError('');
    try {
      await taskService.iniciar(task.id);
      onUpdated();
    } catch {
      setError('Erro ao iniciar tarefa.');
    } finally {
      setLoading(false);
    }
  };

  const handleFinalizar = async (payload) => {
    setLoading(true);
    setError('');
    try {
      await taskService.finalizar(task.id, payload);
      onUpdated();
      onClose();
    } catch {
      setError('Erro ao finalizar. Tente novamente.');
      setLoading(false);
    }
  };

  const paperSx = isMobile
    ? { borderTopLeftRadius: 16, borderTopRightRadius: 16, maxHeight: '90vh', px: 2, pt: 1, pb: 3 }
    : { width: 500, p: 0 };

  return (
    <Drawer
      anchor={isMobile ? 'bottom' : 'right'}
      open={open}
      onClose={onClose}
      PaperProps={{ sx: paperSx }}
    >
      {/* Handle mobile */}
      {isMobile && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
          <Box sx={{ width: 36, height: 4, bgcolor: 'grey.300', borderRadius: 2 }} />
        </Box>
      )}

      {/* Header colorido */}
      <Box sx={{
        bgcolor: areaColor,
        mx: isMobile ? -2 : 0,
        px: 2.5, py: 2,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <Box>
          <Typography variant="h6" fontWeight={700} color="white">{template?.nome}</Typography>
          <Typography variant="caption" color="rgba(255,255,255,0.8)">
            {template?.area} · Turno {task.turno}
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small" sx={{ color: 'white' }}>
          <CloseIcon />
        </IconButton>
      </Box>

      <Box sx={{ overflow: 'auto', px: isMobile ? 0 : 2.5, pt: 2 }}>
        {/* Chips de info */}
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
          <Chip label={`${template?.tempo_estimado}h estimado`} size="small" variant="outlined" />
          <Chip label={template?.dificuldade} size="small" color={DIFF_COLORS[template?.dificuldade] || 'default'} />
          <Chip label={STATUS_STYLE[status]?.label || status} size="small" color={STATUS_STYLE[status]?.color || 'default'} />
          {phase === 'finalizar' && (
            <Chip label="Finalização" size="small" color="info" variant="outlined" />
          )}
        </Box>

        {phase === 'exec' ? (
          <ExecucaoPhase
            task={task}
            checklist={checklist}
            onCheckStep={handleCheckStep}
            onIniciar={handleIniciar}
            onAvancar={() => { setError(''); setPhase('finalizar'); }}
            loading={loading}
            error={error}
          />
        ) : (
          <FinalizacaoPhase
            task={task}
            checklist={checklist}
            onConfirm={handleFinalizar}
            onVoltar={() => { setError(''); setPhase('exec'); }}
            loading={loading}
            error={error}
          />
        )}
      </Box>
    </Drawer>
  );
}
