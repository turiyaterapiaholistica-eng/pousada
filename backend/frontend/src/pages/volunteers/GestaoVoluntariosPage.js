import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Tabs, Tab, CircularProgress, Alert,
  Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, Select, MenuItem, Button,
  Card, CardContent, LinearProgress, IconButton, Tooltip,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, FormControl, InputLabel,
  useTheme, useMediaQuery,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import RefreshIcon from '@mui/icons-material/Refresh';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

import volunteerService from '../../services/volunteers/volunteerService';
import scheduleService from '../../services/volunteers/scheduleService';
import taskService from '../../services/volunteers/taskService';
import activityService from '../../services/volunteers/activityService';

const TURNOS_ESCALA = ['6-11h', '11-16h', '16-21h', 'folga', 'Flexível'];
const TURNO_COLORS = {
  '6-11h':    { bg: '#FFF8E1', color: '#F57F17', label: '6-11h' },
  '11-16h':   { bg: '#E3F2FD', color: '#1565C0', label: '11-16h' },
  '16-21h':   { bg: '#EDE7F6', color: '#4527A0', label: '16-21h' },
  'folga':    { bg: '#F5F5F5', color: '#9E9E9E', label: 'Folga' },
  'Flexível': { bg: '#E8F5E9', color: '#2e7d32', label: 'Flexível' },
};

const DIAS_PT = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
const AREA_COLORS = {
  Cozinha:        '#F57F17',
  Limpeza:        '#1565C0',
  Jardim:         '#2E7D32',
  'Manutenção':   '#BF360C',
  Administrativo: '#4527A0',
};

function isoDate(d) { return d.toISOString().split('T')[0]; }

function getWeekDays(weekStart) {
  const base = weekStart ? new Date(weekStart + 'T12:00:00') : (() => {
    const hoje = new Date();
    const dow = hoje.getDay();
    const seg = new Date(hoje);
    seg.setDate(hoje.getDate() - ((dow + 6) % 7));
    return seg;
  })();
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    return d;
  });
}

// ---- Aba Escala ----
function TabEscala() {
  const [weekStart, setWeekStart] = useState(() => {
    const hoje = new Date();
    const dow = hoje.getDay();
    const seg = new Date(hoje);
    seg.setDate(hoje.getDate() - ((dow + 6) % 7));
    return isoDate(seg);
  });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState({});

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await scheduleService.getWeekly(weekStart);
      setData(res);
    } catch {
      setError('Erro ao carregar escala.');
    } finally {
      setLoading(false);
    }
  }, [weekStart]);

  useEffect(() => { load(); }, [load]);

  const handleTurno = async (volunteerId, dateStr, turno) => {
    const key = `${volunteerId}-${dateStr}`;
    setSaving(prev => ({ ...prev, [key]: true }));
    try {
      await scheduleService.setTurno(volunteerId, dateStr, turno || 'remover');
      await load();
    } catch {
      setError('Erro ao salvar turno.');
    } finally {
      setSaving(prev => ({ ...prev, [key]: false }));
    }
  };

  const weekDays = getWeekDays(weekStart);
  const hoje = isoDate(new Date());

  const prevWeek = () => {
    const d = new Date(weekStart + 'T12:00:00');
    d.setDate(d.getDate() - 7);
    setWeekStart(isoDate(d));
  };

  const nextWeek = () => {
    const d = new Date(weekStart + 'T12:00:00');
    d.setDate(d.getDate() + 7);
    setWeekStart(isoDate(d));
  };

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress color="success" /></Box>;

  return (
    <Box>
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      {/* Navegação de semana */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <Button size="small" onClick={prevWeek} variant="outlined">‹ Anterior</Button>
        <Typography variant="subtitle2" fontWeight={600}>
          Semana de {new Date(weekStart + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
        </Typography>
        <Button size="small" onClick={nextWeek} variant="outlined">Próxima ›</Button>
        <IconButton size="small" onClick={load}><RefreshIcon fontSize="small" /></IconButton>
      </Box>

      {isMobile ? (
        // Mobile: lista compacta
        <Box>
          {(data?.volunteers || []).map(v => (
            <Card key={v.id} variant="outlined" sx={{ mb: 1.5 }}>
              <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>{v.nome}</Typography>
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                  {weekDays.map((d, i) => {
                    const iso = isoDate(d);
                    const turno = data?.schedule?.[v.id]?.[iso]?.turno;
                    const key = `${v.id}-${iso}`;
                    return (
                      <Box key={iso} sx={{ textAlign: 'center', minWidth: 44 }}>
                        <Typography variant="caption" color={iso === hoje ? 'success.main' : 'text.disabled'}
                          fontWeight={iso === hoje ? 700 : 400}>
                          {DIAS_PT[i]}
                        </Typography>
                        <Select
                          size="small"
                          displayEmpty
                          value={turno || ''}
                          onChange={e => handleTurno(v.id, iso, e.target.value)}
                          disabled={saving[key]}
                          sx={{ width: 70, fontSize: 10, '.MuiSelect-select': { py: 0.5, px: 1 } }}
                        >
                          <MenuItem value=""><em>—</em></MenuItem>
                          {TURNOS_ESCALA.map(t => (
                            <MenuItem key={t} value={t} sx={{ fontSize: 12 }}>
                              {TURNO_COLORS[t]?.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </Box>
                    );
                  })}
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      ) : (
        // Desktop: tabela
        <TableContainer component={Paper} variant="outlined" sx={{ maxWidth: '100%', overflowX: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#F5F5F5' }}>
                <TableCell sx={{ fontWeight: 700, minWidth: 140 }}>Voluntário</TableCell>
                {weekDays.map((d, i) => (
                  <TableCell key={isoDate(d)} align="center" sx={{
                    fontWeight: 700, minWidth: 100,
                    bgcolor: isoDate(d) === hoje ? '#E8F5E9' : 'transparent',
                    color: isoDate(d) === hoje ? '#2e7d32' : 'inherit',
                  }}>
                    {DIAS_PT[i]}<br />
                    <Typography variant="caption" fontWeight={400}>
                      {d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                    </Typography>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {(data?.volunteers || []).map(v => (
                <TableRow key={v.id} hover>
                  <TableCell sx={{ fontWeight: 600 }}>{v.nome}</TableCell>
                  {weekDays.map((d) => {
                    const iso = isoDate(d);
                    const cell = data?.schedule?.[v.id]?.[iso];
                    const turno = cell?.turno;
                    const key = `${v.id}-${iso}`;
                    const tc = TURNO_COLORS[turno];
                    return (
                      <TableCell key={iso} align="center" sx={{ bgcolor: isoDate(d) === hoje ? '#F1F8E9' : 'transparent' }}>
                        <Select
                          size="small"
                          displayEmpty
                          value={turno || ''}
                          onChange={e => handleTurno(v.id, iso, e.target.value)}
                          disabled={saving[key]}
                          sx={{
                            width: 90, fontSize: 12,
                            bgcolor: tc?.bg || 'transparent',
                            color: tc?.color || 'inherit',
                            '.MuiSelect-select': { py: 0.5 },
                            '.MuiOutlinedInput-notchedOutline': { border: turno ? `1.5px solid ${tc?.color}` : '' },
                          }}
                        >
                          <MenuItem value=""><em>— Livre —</em></MenuItem>
                          {TURNOS_ESCALA.map(t => (
                            <MenuItem key={t} value={t} sx={{ fontSize: 13, color: TURNO_COLORS[t]?.color }}>
                              {TURNO_COLORS[t]?.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
              {(!data?.volunteers?.length) && (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ color: 'text.disabled', py: 4 }}>
                    Nenhum voluntário ativo cadastrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}

// ---- Aba Tarefas ----
function TabTarefas() {
  const [selectedDate, setSelectedDate] = useState(isoDate(new Date()));
  const [dashboard, setDashboard] = useState(null);
  const [volunteers, setVolunteers] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [assignOpen, setAssignOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [dash, vols, acts] = await Promise.all([
        taskService.getDashboard(selectedDate),
        volunteerService.getAll({ status: 'ativo' }),
        activityService.getAll({ ativa: true }),
      ]);
      setDashboard(dash);
      setVolunteers(Array.isArray(vols) ? vols : []);
      setActivities(Array.isArray(acts) ? acts : []);
    } catch {
      setError('Erro ao carregar dados.');
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress color="success" /></Box>;

  const resumo = dashboard?.resumo || {};
  const pct = resumo.total ? Math.round((resumo.concluidas / resumo.total) * 100) : 0;

  return (
    <Box>
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      {/* Seletor de data + botão */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, flexWrap: 'wrap' }}>
        <TextField
          type="date"
          size="small"
          label="Data"
          value={selectedDate}
          onChange={e => setSelectedDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
          sx={{ width: 160 }}
        />
        <IconButton size="small" onClick={load}><RefreshIcon fontSize="small" /></IconButton>
        <Button
          variant="contained"
          color="success"
          size="small"
          startIcon={<AddIcon />}
          onClick={() => setAssignOpen(true)}
          sx={{ ml: 'auto' }}
        >
          Atribuir tarefa
        </Button>
      </Box>

      {/* Resumo do dia */}
      {dashboard && (
        <>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 1.5, mb: 2 }}>
            {[
              { label: 'Total', value: resumo.total, color: '#1976d2' },
              { label: 'Concluídas', value: resumo.concluidas, color: '#2e7d32' },
              { label: 'Em andamento', value: resumo.em_andamento, color: '#ed6c02' },
              { label: 'Pendentes', value: resumo.pendentes, color: '#9e9e9e' },
              { label: 'Horas totais', value: `${resumo.horas_totais}h`, color: '#1a3a2a' },
            ].map(item => (
              <Paper key={item.label} variant="outlined" sx={{ p: 1.5, textAlign: 'center' }}>
                <Typography variant="h5" fontWeight={800} sx={{ color: item.color }}>{item.value}</Typography>
                <Typography variant="caption" color="text.secondary">{item.label}</Typography>
              </Paper>
            ))}
          </Box>

          {resumo.total > 0 && (
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="caption" color="text.secondary" fontWeight={600}>Progresso do dia</Typography>
                <Typography variant="caption" fontWeight={700} color="success.main">{pct}%</Typography>
              </Box>
              <LinearProgress variant="determinate" value={pct} color="success" sx={{ height: 8, borderRadius: 4 }} />
            </Box>
          )}

          {/* Por área */}
          {dashboard.por_area?.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>Por área</Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {dashboard.por_area.map(a => (
                  <Chip
                    key={a.template__area}
                    label={`${a.template__area}: ${a.concluidas}/${a.total}`}
                    size="small"
                    sx={{
                      bgcolor: `${AREA_COLORS[a.template__area] || '#666'}22`,
                      color: AREA_COLORS[a.template__area] || '#666',
                      fontWeight: 600,
                    }}
                  />
                ))}
              </Box>
            </Box>
          )}

          {/* Problemas reportados */}
          {dashboard.problemas?.length > 0 && (
            <Paper variant="outlined" sx={{ p: 2, bgcolor: '#FFF8E1', borderColor: '#FFB300' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <WarningAmberIcon sx={{ color: '#F57F17' }} />
                <Typography variant="subtitle2" fontWeight={700} color="#BF360C">
                  {dashboard.problemas.length} problema{dashboard.problemas.length > 1 ? 's' : ''} reportado{dashboard.problemas.length > 1 ? 's' : ''}
                </Typography>
              </Box>
              {dashboard.problemas.map(t => (
                <Box key={t.id} sx={{ mb: 1, pl: 1, borderLeft: '3px solid #FFB300' }}>
                  <Typography variant="body2" fontWeight={600}>{t.template?.nome} — {t.volunteer_nome}</Typography>
                  <Typography variant="caption" color="text.secondary">{t.problema_reportado}</Typography>
                </Box>
              ))}
            </Paper>
          )}

          {resumo.total === 0 && (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <CheckCircleOutlineIcon sx={{ fontSize: 48, color: 'text.disabled' }} />
              <Typography color="text.secondary">Nenhuma tarefa para esta data.</Typography>
            </Box>
          )}
        </>
      )}

      {/* Dialog de atribuição */}
      <AssignTaskDialog
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        volunteers={volunteers}
        activities={activities}
        defaultDate={selectedDate}
        onSaved={() => { setAssignOpen(false); load(); }}
      />
    </Box>
  );
}

const AREAS = ['Cozinha', 'Limpeza', 'Jardim', 'Manutenção', 'Administrativo'];

// ---- Dialog: Atribuir tarefa ----
function AssignTaskDialog({ open, onClose, volunteers, activities, defaultDate, onSaved }) {
  const [form, setForm] = useState({ volunteer: '', area: '', template_id: '', data: defaultDate, turno: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) setForm({ volunteer: '', area: '', template_id: '', data: defaultDate, turno: '' });
    setError('');
  }, [open, defaultDate]);

  const atividadesFiltradas = form.area
    ? activities.filter(a => a.area === form.area)
    : activities;

  const handleSubmit = async () => {
    if (!form.volunteer || !form.template_id || !form.data) {
      setError('Voluntário, atividade e data são obrigatórios.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await taskService.create({
        volunteer: form.volunteer,
        template_id: form.template_id,
        data: form.data,
        turno: form.turno,
      });
      onSaved();
    } catch {
      setError('Erro ao atribuir tarefa.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Atribuir tarefa</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <FormControl fullWidth sx={{ mt: 1, mb: 2 }}>
          <InputLabel>Voluntário</InputLabel>
          <Select value={form.volunteer} label="Voluntário" onChange={e => setForm(f => ({ ...f, volunteer: e.target.value }))}>
            {volunteers.map(v => <MenuItem key={v.id} value={v.id}>{v.nome}</MenuItem>)}
          </Select>
        </FormControl>

        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Área (opcional)</InputLabel>
          <Select
            value={form.area}
            label="Área (opcional)"
            onChange={e => setForm(f => ({ ...f, area: e.target.value, template_id: '' }))}
          >
            <MenuItem value=""><em>Todas as áreas</em></MenuItem>
            {AREAS.map(a => <MenuItem key={a} value={a}>{a}</MenuItem>)}
          </Select>
        </FormControl>

        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Atividade</InputLabel>
          <Select value={form.template_id} label="Atividade" onChange={e => setForm(f => ({ ...f, template_id: e.target.value }))}>
            {atividadesFiltradas.map(a => <MenuItem key={a.id} value={a.id}>{a.nome} ({a.area})</MenuItem>)}
          </Select>
        </FormControl>

        <TextField
          fullWidth type="date" label="Data"
          value={form.data}
          onChange={e => setForm(f => ({ ...f, data: e.target.value }))}
          InputLabelProps={{ shrink: true }}
          sx={{ mb: 2 }}
        />

        <FormControl fullWidth>
          <InputLabel>Turno (opcional)</InputLabel>
          <Select
            value={form.turno}
            label="Turno (opcional)"
            onChange={e => setForm(f => ({ ...f, turno: e.target.value }))}
          >
            <MenuItem value=""><em>Não definido</em></MenuItem>
            {TURNOS_ESCALA.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
          </Select>
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>Cancelar</Button>
        <Button variant="contained" color="success" onClick={handleSubmit} disabled={loading}>
          {loading ? 'Salvando...' : 'Atribuir'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ---- Aba Voluntários ----
function TabVoluntarios() {
  const [volunteers, setVolunteers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('ativo');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await volunteerService.getAll({ status: statusFilter });
      setVolunteers(Array.isArray(data) ? data : []);
    } catch {
      setError('Erro ao carregar voluntários.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  const handleStatusChange = async (id, newStatus) => {
    try {
      await volunteerService.patch(id, { status: newStatus });
      load();
    } catch {
      setError('Erro ao atualizar status.');
    }
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress color="success" /></Box>;

  return (
    <Box>
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        {['ativo', 'aguardando', 'saiu'].map(s => (
          <Chip
            key={s}
            label={s.charAt(0).toUpperCase() + s.slice(1)}
            onClick={() => setStatusFilter(s)}
            variant={statusFilter === s ? 'filled' : 'outlined'}
            color={statusFilter === s ? 'success' : 'default'}
            sx={{ fontWeight: 600 }}
          />
        ))}
        <IconButton size="small" onClick={load}><RefreshIcon fontSize="small" /></IconButton>
      </Box>

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: '#F5F5F5' }}>
              <TableCell sx={{ fontWeight: 700 }}>Nome</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>País</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Chegada</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Turno hoje</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Horas/sem</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {volunteers.map(v => (
              <TableRow key={v.id} hover>
                <TableCell>
                  <Typography variant="body2" fontWeight={600}>{v.nome}</Typography>
                  {v.idiomas && <Typography variant="caption" color="text.secondary">{v.idiomas}</Typography>}
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{v.pais_origem || '—'}</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {v.data_chegada ? new Date(v.data_chegada + 'T12:00:00').toLocaleDateString('pt-BR') : '—'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {v.semanas_na_pousada} sem.
                  </Typography>
                </TableCell>
                <TableCell>
                  {v.turno_hoje ? (
                    <Chip label={v.turno_hoje} size="small" sx={{ bgcolor: '#E8F5E9', color: '#1a3a2a', fontWeight: 600 }} />
                  ) : (
                    <Typography variant="caption" color="text.disabled">—</Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Typography variant="body2" fontWeight={700}>{v.horas_semana || 0}h</Typography>
                </TableCell>
                <TableCell>
                  <Select
                    size="small"
                    value={v.status}
                    onChange={e => handleStatusChange(v.id, e.target.value)}
                    sx={{ fontSize: 12, '.MuiSelect-select': { py: 0.5, px: 1 } }}
                  >
                    <MenuItem value="ativo">Ativo</MenuItem>
                    <MenuItem value="aguardando">Aguardando</MenuItem>
                    <MenuItem value="saiu">Saiu</MenuItem>
                  </Select>
                </TableCell>
              </TableRow>
            ))}
            {!volunteers.length && (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ color: 'text.disabled', py: 4 }}>
                  Nenhum voluntário encontrado.
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
export default function GestaoVoluntariosPage() {
  const [tab, setTab] = useState(0);

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>Gestão de Voluntários</Typography>
        <Typography variant="body2" color="text.secondary">
          Escala semanal, tarefas e acompanhamento dos voluntários.
        </Typography>
      </Box>

      <Paper variant="outlined" sx={{ mb: 3 }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          TabIndicatorProps={{ style: { backgroundColor: '#1a3a2a' } }}
          sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}
        >
          <Tab label="Escala semanal" sx={{ fontWeight: 600, '&.Mui-selected': { color: '#1a3a2a' } }} />
          <Tab label="Tarefas do dia" sx={{ fontWeight: 600, '&.Mui-selected': { color: '#1a3a2a' } }} />
          <Tab label="Voluntários" sx={{ fontWeight: 600, '&.Mui-selected': { color: '#1a3a2a' } }} />
        </Tabs>

        <Box sx={{ p: { xs: 2, md: 3 } }}>
          {tab === 0 && <TabEscala />}
          {tab === 1 && <TabTarefas />}
          {tab === 2 && <TabVoluntarios />}
        </Box>
      </Paper>
    </Box>
  );
}
