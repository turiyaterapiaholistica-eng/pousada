import React, { useState, useEffect } from 'react';
import {
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Typography,
  MenuItem,
  Snackbar,
  Alert,
  Box,
  InputAdornment,
  IconButton,
  Chip,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import api from '../services/api';
import ComandaDetails from '../components/ComandaDetails';

const STATUS_OPTIONS = [
  { value: 'aberto', label: 'Aberto' },
  { value: 'fechado', label: 'Fechado' },
  { value: 'pago', label: 'Pago' }
];

const STATUS_COLORS = {
  aberto: 'success',
  fechado: 'warning',
  pago: 'default'
};

export default function GestaoComandas() {
  const [comandas, setComandas] = useState([]);
  const [filteredComandas, setFilteredComandas] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [openDetails, setOpenDetails] = useState(false);
  const [selectedComanda, setSelectedComanda] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [novaComanda, setNovaComanda] = useState({
    quarto: '',
    status: 'aberto'
  });
  
  // Filtros
  const [searchQuarto, setSearchQuarto] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchComandas();
  }, []);

  useEffect(() => {
    filterComandas();
  }, [comandas, searchQuarto, statusFilter]);

  const fetchComandas = async () => {
    try {
      const response = await api.get('/consumacoes/');
      setComandas(response.data);
    } catch (error) {
      showSnackbar('Erro ao carregar comandas', 'error');
    }
  };

  const filterComandas = () => {
    let filtered = [...comandas];
    
    // Filtro por quarto
    if (searchQuarto) {
      filtered = filtered.filter(comanda => 
        comanda.quarto.toLowerCase().includes(searchQuarto.toLowerCase())
      );
    }
    
    // Filtro por status
    if (statusFilter) {
      filtered = filtered.filter(comanda => comanda.status === statusFilter);
    }
    
    setFilteredComandas(filtered);
  };

  const handleCreateComanda = async () => {
    try {
      await api.post('/consumacoes/', novaComanda);
      setOpenDialog(false);
      showSnackbar('Comanda criada com sucesso!');
      fetchComandas();
      setNovaComanda({ quarto: '', status: 'aberto' });
    } catch (error) {
      showSnackbar('Erro ao criar comanda', 'error');
    }
  };

  const handleUpdateStatus = async (comandaId, newStatus) => {
    try {
      await api.patch(`/consumacoes/${comandaId}/`, { status: newStatus });
      showSnackbar('Status atualizado com sucesso!');
      fetchComandas();
    } catch (error) {
      showSnackbar('Erro ao atualizar status', 'error');
    }
  };

  const handleViewDetails = (comanda) => {
    setSelectedComanda(comanda);
    setOpenDetails(true);
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const formatMoney = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(Number(value) || 0);
  };

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Paper sx={{ p: 2 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h6">Gestão de Comandas</Typography>
            <Button variant="contained" onClick={() => setOpenDialog(true)}>
              Nova Comanda
            </Button>
          </Box>
          
          <Grid container spacing={2} mb={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Buscar por quarto"
                value={searchQuarto}
                onChange={(e) => setSearchQuarto(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Filtrar por status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <FilterListIcon />
                    </InputAdornment>
                  ),
                }}
              >
                <MenuItem value="">Todos</MenuItem>
                {STATUS_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>
        </Paper>
      </Grid>

      {filteredComandas.map((comanda) => (
        <Grid item xs={12} key={comanda.id}>
          <Paper sx={{ p: 2 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={3}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography variant="subtitle1">
                    Quarto: {comanda.quarto}
                  </Typography>
                  <Chip 
                    label={comanda.status.charAt(0).toUpperCase() + comanda.status.slice(1)}
                    color={STATUS_COLORS[comanda.status]}
                    size="small"
                  />
                </Box>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Typography variant="subtitle1">
                  Total: {formatMoney(comanda.total)}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  select
                  fullWidth
                  value={comanda.status}
                  onChange={(e) => handleUpdateStatus(comanda.id, e.target.value)}
                  label="Status"
                >
                  {STATUS_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={() => handleViewDetails(comanda)}
                >
                  Ver Detalhes
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      ))}

      {/* Dialog para criar nova comanda */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Nova Comanda</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Número do Quarto"
            fullWidth
            value={novaComanda.quarto}
            onChange={(e) => setNovaComanda({ ...novaComanda, quarto: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancelar</Button>
          <Button onClick={handleCreateComanda} variant="contained">
            Criar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de detalhes da comanda */}
      <ComandaDetails
        comanda={selectedComanda}
        open={openDetails}
        onClose={() => setOpenDetails(false)}
      />

      {/* Snackbar para feedback */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Grid>
  );
}