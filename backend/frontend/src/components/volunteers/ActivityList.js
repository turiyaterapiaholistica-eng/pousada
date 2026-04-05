// frontend/src/components/volunteers/ActivityList.js
import React, { useState } from 'react';
import {
  Box, Typography, TextField, Chip, Card, CardActionArea,
  CardContent, Switch, Tooltip, InputAdornment, Divider,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import activityService from '../../services/volunteers/activityService';

const AREAS = ['Cozinha', 'Limpeza', 'Jardim', 'Manutenção', 'Administrativo'];

const AREA_COLORS = {
  Cozinha:        { bg: '#FFF8E1', color: '#F57F17' },
  Limpeza:        { bg: '#E3F2FD', color: '#1565C0' },
  Jardim:         { bg: '#E8F5E9', color: '#2E7D32' },
  Manutenção:     { bg: '#FBE9E7', color: '#BF360C' },
  Administrativo: { bg: '#EDE7F6', color: '#4527A0' },
};

const DIFF_COLORS = {
  Baixa: 'success',
  Média: 'warning',
  Alta:  'error',
};

export default function ActivityList({ activities, selectedId, onSelect, onToggle }) {
  const [search, setSearch] = useState('');
  const [areaFilter, setAreaFilter] = useState('Todas');

  const filtered = activities.filter(a => {
    const matchArea = areaFilter === 'Todas' || a.area === areaFilter;
    const matchSearch = a.nome.toLowerCase().includes(search.toLowerCase());
    return matchArea && matchSearch;
  });

  const handleToggle = async (e, activity) => {
    // Impede que o clique no switch selecione o card
    e.stopPropagation();
    try {
      await activityService.toggleActive(activity.id, !activity.ativa);
      onToggle(); // avisa a página pai para recarregar a lista
    } catch (err) {
      console.error('Erro ao alterar status:', err);
    }
  };

  return (
    <Box>

      {/* Busca */}
      <TextField
        fullWidth
        size="small"
        placeholder="Buscar atividade..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        sx={{ mb: 2 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon fontSize="small" color="action" />
            </InputAdornment>
          ),
        }}
      />

      {/* Filtros por área */}
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
        {['Todas', ...AREAS].map(area => (
          <Chip
            key={area}
            label={area}
            size="small"
            onClick={() => setAreaFilter(area)}
            variant={areaFilter === area ? 'filled' : 'outlined'}
            color={areaFilter === area ? 'success' : 'default'}
            sx={{ cursor: 'pointer' }}
          />
        ))}
      </Box>

      {/* Contador */}
      <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
        {filtered.length} atividade{filtered.length !== 1 ? 's' : ''}
        {areaFilter !== 'Todas' ? ` em ${areaFilter}` : ''}
        {search ? ` · "${search}"` : ''}
      </Typography>

      <Divider sx={{ mb: 2 }} />

      {/* Lista */}
      {filtered.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <Typography color="text.secondary">Nenhuma atividade encontrada.</Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {filtered.map(activity => {
            const areaStyle = AREA_COLORS[activity.area] || { bg: '#F5F5F5', color: '#333' };
            const isSelected = activity.id === selectedId;

            return (
              <Card
                key={activity.id}
                variant="outlined"
                sx={{
                  border: isSelected ? '1.5px solid' : '1px solid',
                  borderColor: isSelected ? 'success.main' : 'divider',
                  opacity: activity.ativa ? 1 : 0.55,
                  transition: 'border-color 0.15s, opacity 0.2s',
                }}
              >
                <CardActionArea onClick={() => onSelect(activity)}>
                  <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>

                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>

                      {/* Ícone de área */}
                      <Box sx={{
                        width: 36, height: 36, borderRadius: 2, flexShrink: 0,
                        bgcolor: areaStyle.bg,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <Typography fontSize={16}>
                          {activity.area === 'Cozinha' ? '☕' :
                           activity.area === 'Limpeza' ? '🧹' :
                           activity.area === 'Jardim' ? '🌱' :
                           activity.area === 'Manutenção' ? '🔧' : '💬'}
                        </Typography>
                      </Box>

                      {/* Info */}
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography
                          variant="body2"
                          fontWeight={600}
                          noWrap
                          sx={{ color: isSelected ? 'success.dark' : 'text.primary' }}
                        >
                          {activity.nome}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 0.75, mt: 0.5, flexWrap: 'wrap', alignItems: 'center' }}>
                          <Chip
                            label={activity.area}
                            size="small"
                            sx={{
                              height: 18, fontSize: 10, fontWeight: 600,
                              bgcolor: areaStyle.bg, color: areaStyle.color,
                            }}
                          />
                          <Chip
                            label={activity.turno_sugerido}
                            size="small"
                            variant="outlined"
                            sx={{ height: 18, fontSize: 10 }}
                          />
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                            <AccessTimeIcon sx={{ fontSize: 11, color: 'text.disabled' }} />
                            <Typography variant="caption" color="text.disabled">
                              {activity.tempo_estimado}h
                            </Typography>
                          </Box>
                          <Chip
                            label={activity.dificuldade}
                            size="small"
                            color={DIFF_COLORS[activity.dificuldade] || 'default'}
                            sx={{ height: 18, fontSize: 10 }}
                          />
                        </Box>
                      </Box>

                      {/* Toggle ativo/inativo */}
                      <Tooltip title={activity.ativa ? 'Desativar' : 'Ativar'}>
                        <Switch
                          size="small"
                          checked={activity.ativa}
                          onChange={e => handleToggle(e, activity)}
                          color="success"
                          onClick={e => e.stopPropagation()}
                        />
                      </Tooltip>

                    </Box>
                  </CardContent>
                </CardActionArea>
              </Card>
            );
          })}
        </Box>
      )}
    </Box>
  );
}