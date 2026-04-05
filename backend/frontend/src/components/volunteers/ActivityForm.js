// frontend/src/components/volunteers/ActivityForm.js
import React, { useState, useEffect } from 'react';
import {
  Box, Button, TextField, Select, MenuItem,
  FormControl, InputLabel, FormControlLabel, Switch,
  Typography, Divider, IconButton, Paper, Alert,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import activityService from '../../services/volunteers/activityService';

const AREAS = ['Cozinha', 'Limpeza', 'Jardim', 'Manutenção', 'Administrativo'];
const TURNOS = ['6-11h', '11-16h', '16-21h', 'Flexível'];
const DIFICULDADES = ['Baixa', 'Média', 'Alta'];
const FREQUENCIAS = ['Diária', '2x semana', '3x semana', 'Semanal', 'Quinzenal', 'Mensal', 'Conforme demanda'];

const TIPOS_PERGUNTA = [
  { value: 'sim_nao', label: 'Sim / Não' },
  { value: 'texto',   label: 'Texto livre' },
  { value: 'numero',  label: 'Número' },
];

const EMPTY_FORM = {
  nome: '',
  area: '',
  turno_sugerido: '',
  tempo_estimado: '',
  dificuldade: 'Baixa',
  frequencia: 'Diária',
  proc_type: 'checklist',
  proc_text: '',
  checklist_steps: [''],
  perguntas_finalizacao: [],
  ativa: true,
};

// Converte decimal de horas → { h, m } para exibição
function horasParaHM(decimal) {
  const h = Math.floor(decimal);
  const m = Math.round((decimal - h) * 60);
  return { h: String(h), m: String(m) };
}
// Converte { h, m } → decimal
function hmParaHoras(h, m) {
  return (parseInt(h, 10) || 0) + (parseInt(m, 10) || 0) / 60;
}

export default function ActivityForm({ activity, onSave, onCancel }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [tempoH, setTempoH] = useState('');
  const [tempoM, setTempoM] = useState('0');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const isEditing = Boolean(activity);

  // Preenche o formulário quando recebe uma atividade para editar
  useEffect(() => {
    if (activity) {
      setForm({
        nome: activity.nome || '',
        area: activity.area || '',
        turno_sugerido: activity.turno_sugerido || '',
        tempo_estimado: activity.tempo_estimado || '',
        dificuldade: activity.dificuldade || 'Baixa',
        frequencia: activity.frequencia || 'Diária',
        proc_type: 'checklist',
        proc_text: activity.proc_text || '',
        checklist_steps: activity.checklist_steps?.length ? activity.checklist_steps : [''],
        perguntas_finalizacao: activity.perguntas_finalizacao || [],
        ativa: activity.ativa ?? true,
      });
      if (activity.tempo_estimado) {
        const { h, m } = horasParaHM(parseFloat(activity.tempo_estimado));
        setTempoH(h); setTempoM(m);
      } else { setTempoH(''); setTempoM('0'); }
    } else {
      setForm(EMPTY_FORM);
      setTempoH(''); setTempoM('0');
    }
  }, [activity]);

  const set = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  // Funções do checklist
  const addStep = () => set('checklist_steps', [...form.checklist_steps, '']);

  const updateStep = (index, value) => {
    const steps = [...form.checklist_steps];
    steps[index] = value;
    set('checklist_steps', steps);
  };

  const removeStep = (index) => {
    const steps = form.checklist_steps.filter((_, i) => i !== index);
    set('checklist_steps', steps.length ? steps : ['']);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validação básica
    if (!form.nome.trim()) return setError('Nome da atividade é obrigatório.');
    if (!form.area) return setError('Selecione uma área.');
    if (!form.turno_sugerido) return setError('Selecione um turno.');
    const totalTempo = hmParaHoras(tempoH, tempoM);
    if (totalTempo <= 0) return setError('Informe o tempo estimado.');

    // Monta o payload — remove campos vazios do checklist e perguntas sem texto
    const payload = {
      ...form,
      tempo_estimado: Math.round(totalTempo * 100) / 100,
      proc_type: 'checklist',
      checklist_steps: form.checklist_steps.filter(s => s.trim()),
      perguntas_finalizacao: form.perguntas_finalizacao.filter(q => q.texto.trim()),
    };

    setLoading(true);
    try {
      if (isEditing) {
        await activityService.update(activity.id, payload);
      } else {
        await activityService.create(payload);
      }
      onSave(); // avisa a página pai que salvou
    } catch (err) {
      setError('Erro ao salvar. Verifique os dados e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>

      {/* Cabeçalho */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" fontWeight={600}>
          {isEditing ? `Editar — ${activity.nome}` : 'Nova atividade'}
        </Typography>
        <FormControlLabel
          control={
            <Switch
              checked={form.ativa}
              onChange={e => set('ativa', e.target.checked)}
              color="success"
            />
          }
          label={form.ativa ? 'Ativa' : 'Inativa'}
        />
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Nome */}
      <TextField
        fullWidth
        label="Nome da atividade"
        value={form.nome}
        onChange={e => set('nome', e.target.value)}
        sx={{ mb: 2 }}
        required
      />

      {/* Área e Turno */}
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
        <FormControl fullWidth required>
          <InputLabel>Área</InputLabel>
          <Select value={form.area} label="Área" onChange={e => set('area', e.target.value)}>
            {AREAS.map(a => <MenuItem key={a} value={a}>{a}</MenuItem>)}
          </Select>
        </FormControl>

        <FormControl fullWidth required>
          <InputLabel>Turno sugerido</InputLabel>
          <Select value={form.turno_sugerido} label="Turno sugerido" onChange={e => set('turno_sugerido', e.target.value)}>
            {TURNOS.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
          </Select>
        </FormControl>
      </Box>

      {/* Tempo, Dificuldade e Frequência */}
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
            Tempo estimado *
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <TextField
              type="number"
              label="Horas"
              inputProps={{ min: 0, max: 12, step: 1 }}
              value={tempoH}
              onChange={e => setTempoH(e.target.value)}
              size="small"
              sx={{ flex: 1 }}
            />
            <Typography variant="body2" color="text.secondary">h</Typography>
            <TextField
              type="number"
              label="Min"
              inputProps={{ min: 0, max: 55, step: 5 }}
              value={tempoM}
              onChange={e => setTempoM(e.target.value)}
              size="small"
              sx={{ flex: 1 }}
            />
            <Typography variant="body2" color="text.secondary">min</Typography>
          </Box>
        </Box>

        <FormControl fullWidth>
          <InputLabel>Dificuldade</InputLabel>
          <Select value={form.dificuldade} label="Dificuldade" onChange={e => set('dificuldade', e.target.value)}>
            {DIFICULDADES.map(d => <MenuItem key={d} value={d}>{d}</MenuItem>)}
          </Select>
        </FormControl>

        <FormControl fullWidth>
          <InputLabel>Frequência</InputLabel>
          <Select value={form.frequencia} label="Frequência" onChange={e => set('frequencia', e.target.value)}>
            {FREQUENCIAS.map(f => <MenuItem key={f} value={f}>{f}</MenuItem>)}
          </Select>
        </FormControl>
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* Resumo / descrição */}
      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
        Resumo da tarefa
      </Typography>
      <TextField
        fullWidth
        multiline
        rows={3}
        label="Descrição / resumo"
        placeholder="Explique brevemente o objetivo e contexto da atividade..."
        value={form.proc_text}
        onChange={e => set('proc_text', e.target.value)}
        sx={{ mb: 2 }}
      />

      {/* Checklist de etapas */}
      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
        Checklist de etapas
      </Typography>
      <Box sx={{ mb: 2 }}>
        {form.checklist_steps.map((step, index) => (
          <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <DragIndicatorIcon sx={{ color: 'text.disabled', fontSize: 20 }} />
            <Typography variant="body2" color="text.disabled" sx={{ minWidth: 20 }}>
              {index + 1}
            </Typography>
            <TextField
              fullWidth
              size="small"
              placeholder="Descreva a etapa..."
              value={step}
              onChange={e => updateStep(index, e.target.value)}
            />
            <IconButton
              size="small"
              onClick={() => removeStep(index)}
              disabled={form.checklist_steps.length === 1}
              color="error"
            >
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          </Box>
        ))}
        <Button
          startIcon={<AddIcon />}
          onClick={addStep}
          size="small"
          variant="outlined"
          color="success"
          sx={{ mt: 1 }}
        >
          Adicionar etapa
        </Button>
      </Box>

      {/* Pré-visualização do checklist */}
      {form.checklist_steps.some(s => s.trim()) && (
        <Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}>
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
            Pré-visualização — como o voluntário verá
          </Typography>
          <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
            {form.nome || 'Nome da atividade'}
          </Typography>
          {form.checklist_steps.filter(s => s.trim()).map((step, i) => (
            <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <Box sx={{ width: 14, height: 14, border: '1.5px solid', borderColor: 'grey.400', borderRadius: '3px', flexShrink: 0 }} />
              <Typography variant="body2" color="text.secondary">{step}</Typography>
            </Box>
          ))}
        </Paper>
      )}

      {/* Perguntas de finalização */}
      <Divider sx={{ my: 2 }} />
      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
        Perguntas ao finalizar
      </Typography>
      <Typography variant="caption" color="text.disabled" display="block" sx={{ mb: 1.5 }}>
        Exibidas para o voluntário após clicar em "Finalizar".
      </Typography>

      {form.perguntas_finalizacao.map((q, idx) => (
        <Box key={idx} sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'center' }}>
          <TextField
            size="small"
            placeholder="Ex.: A área ficou organizada?"
            value={q.texto}
            onChange={e => {
              const next = [...form.perguntas_finalizacao];
              next[idx] = { ...next[idx], texto: e.target.value };
              set('perguntas_finalizacao', next);
            }}
            sx={{ flex: 1 }}
          />
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <Select
              value={q.tipo}
              onChange={e => {
                const next = [...form.perguntas_finalizacao];
                next[idx] = { ...next[idx], tipo: e.target.value };
                set('perguntas_finalizacao', next);
              }}
            >
              {TIPOS_PERGUNTA.map(t => (
                <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <IconButton size="small" color="error"
            onClick={() => set('perguntas_finalizacao', form.perguntas_finalizacao.filter((_, i) => i !== idx))}>
            <DeleteOutlineIcon fontSize="small" />
          </IconButton>
        </Box>
      ))}

      <Button
        size="small"
        startIcon={<AddIcon />}
        variant="outlined"
        color="success"
        onClick={() => set('perguntas_finalizacao', [
          ...form.perguntas_finalizacao,
          { id: `q${Date.now()}`, texto: '', tipo: 'sim_nao' }
        ])}
        sx={{ mb: 2 }}
      >
        Adicionar pergunta
      </Button>

      {/* Botões */}
      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
        <Button onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>
        <Button
          type="submit"
          variant="contained"
          color="success"
          disabled={loading}
        >
          {loading ? 'Salvando...' : isEditing ? 'Salvar alterações' : 'Criar atividade'}
        </Button>
      </Box>

    </Box>
  );
}