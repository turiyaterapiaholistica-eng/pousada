import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Button, Typography, Drawer, CircularProgress,
  Alert, Divider, Tooltip, IconButton, Fab,
  useTheme, useMediaQuery,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import activityService from '../../services/volunteers/activityService';
import ActivityList from '../../components/volunteers/ActivityList';
import ActivityForm from '../../components/volunteers/ActivityForm';

export default function ActivityLibrary() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [activities, setActivities] = useState([]);
  const [selected, setSelected] = useState(null);
  const [isNew, setIsNew] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchActivities = useCallback(async () => {
    setError('');
    try {
      const data = await activityService.getAll();
      setActivities(data);
    } catch {
      setError('Erro ao carregar atividades. Verifique sua conexão.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchActivities(); }, [fetchActivities]);

  const handleNew = () => {
    setSelected(null);
    setIsNew(true);
    setDrawerOpen(true);
  };

  const handleSelect = (activity) => {
    setSelected(activity);
    setIsNew(false);
    setDrawerOpen(true);
  };

  const handleClose = () => {
    setDrawerOpen(false);
    setSelected(null);
    setIsNew(false);
  };

  const handleSave = () => {
    handleClose();
    fetchActivities();
  };

  const handleDelete = async () => {
    if (!selected) return;
    if (!window.confirm(`Deseja excluir "${selected.nome}"? Esta ação não pode ser desfeita.`)) return;
    setDeleteLoading(true);
    try {
      await activityService.remove(selected.id);
      handleClose();
      fetchActivities();
    } catch {
      setError('Erro ao excluir atividade.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const totalAtivas = activities.filter(a => a.ativa).length;

  const drawerWidth = isMobile ? '100%' : 520;

  return (
    <Box sx={{ display: 'flex', height: '100%', flexDirection: 'column', position: 'relative' }}>
      {/* Cabeçalho */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant={isMobile ? 'h6' : 'h5'} fontWeight={600}>
            Biblioteca de atividades
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {activities.length} cadastradas · {totalAtivas} ativas
          </Typography>
        </Box>
        {/* Botão só aparece em desktop; no mobile há FAB */}
        {!isMobile && (
          <Button variant="contained" color="success" startIcon={<AddIcon />} onClick={handleNew}>
            Nova atividade
          </Button>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>
      )}

      {/* Lista */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress color="success" />
        </Box>
      ) : (
        <ActivityList
          activities={activities}
          selectedId={selected?.id}
          onSelect={handleSelect}
          onToggle={fetchActivities}
        />
      )}

      {/* FAB mobile */}
      {isMobile && (
        <Fab
          color="success"
          onClick={handleNew}
          sx={{ position: 'fixed', bottom: 24, right: 24, zIndex: 1200 }}
        >
          <AddIcon />
        </Fab>
      )}

      {/* Drawer de criação/edição */}
      <Drawer
        anchor={isMobile ? 'bottom' : 'right'}
        open={drawerOpen}
        onClose={handleClose}
        PaperProps={{
          sx: isMobile
            ? { borderTopLeftRadius: 16, borderTopRightRadius: 16, maxHeight: '92vh', width: '100%', p: 2.5 }
            : { width: drawerWidth, p: 3 },
        }}
      >
        {/* Handle mobile */}
        {isMobile && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1.5 }}>
            <Box sx={{ width: 36, height: 4, bgcolor: 'grey.300', borderRadius: 2 }} />
          </Box>
        )}

        {/* Cabeçalho do drawer */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="caption" color="text.secondary" textTransform="uppercase" letterSpacing={1}>
            {isNew ? 'Nova atividade' : 'Editar atividade'}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {!isNew && selected && (
              <Tooltip title="Excluir atividade">
                <IconButton size="small" color="error" onClick={handleDelete} disabled={deleteLoading}>
                  <DeleteOutlineIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            <IconButton size="small" onClick={handleClose}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>

        <Divider sx={{ mb: 2 }} />

        <Box sx={{ overflow: 'auto' }}>
          <ActivityForm
            activity={isNew ? null : selected}
            onSave={handleSave}
            onCancel={handleClose}
          />
        </Box>
      </Drawer>
    </Box>
  );
}
