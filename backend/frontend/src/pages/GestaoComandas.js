import React, { useState, useEffect } from 'react';
import {
  Paper, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Typography, MenuItem, Snackbar, Alert, Box,
  Chip, Card, CardContent, CardActions, FormControlLabel, Checkbox,
  InputLabel, OutlinedInput, FormControl, Select
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import MoneyIcon from '@mui/icons-material/Money';
import api from '../services/api';
import ComandaDetails from '../components/ComandaDetails';
import ComandasGrid from '../components/ComandasGrid';


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
  const [openDetails, setOpenDetails] = useState(false);
  const [selectedComanda, setSelectedComanda] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [novaComanda, setNovaComanda] = useState({
    quarto: '',
    status: 'aberto',
    isBusinessWorker: false
  });
  const [detailsComanda, setDetailsComanda] = useState(null);  // New state for details
  const [searchQuarto, setSearchQuarto] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const STATUS_OPTIONS = [
      { value: '', label: 'Todos' },
      { value: 'aberto', label: 'Aberto' },
      { value: 'fechado', label: 'Fechado' },
      { value: 'pago', label: 'Pago' }
  ];  const [paymentAmount, setPaymentAmount] = useState('');

  useEffect(() => {
    fetchComandas();
  }, []);

  useEffect(() => {
    filterComandas();
  }, [comandas, searchQuarto, statusFilter]);

  const fetchComandas = async () => {
    try {
      const data = await api.get('/consumacoes/');
      setComandas(data);
    } catch (error) {
      console.error('Error loading comandas:', error);
      showSnackbar('Erro ao carregar comandas: ' + 
        (error.response?.data?.detail || error.message), 'error');
    }
  };
  

  const filterComandas = () => {
    if (!comandas) return;
    
    let filtered = [...comandas];
    if (searchQuarto) {
      filtered = filtered.filter(comanda => 
        comanda.quarto?.toLowerCase().includes(searchQuarto.toLowerCase())
      );
    }
    if (statusFilter) {
      filtered = filtered.filter(comanda => comanda.status === statusFilter);
    }
    setFilteredComandas(filtered);
  };

  const handleCreateComanda = async () => {
    try {

      // Validate comanda data
      if (!novaComanda.quarto) {
        showSnackbar('O número do quarto é obrigatório', 'error');
        return;
      }
      const response = await api.post('/consumacoes/', novaComanda);
      showSnackbar('Comanda criada com sucesso!');
      await fetchComandas(); // Add await here
      setNovaComanda({ quarto: '', status: 'aberto', isBusinessWorker: false });
    } catch (error) {
      console.error('Error creating comanda:', error);
      // More detailed error message
      const errorMessage = error.response?.data?.detail || error.message || 'Erro ao criar comanda';
      showSnackbar(errorMessage, 'error');
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

  const handleRegisterPayment = async () => {
    if (!selectedComanda || !paymentAmount) return;
    
    try {
      await api.post(`/consumacoes/${selectedComanda.id}/registrar_pagamento/`, {
        valor: paymentAmount,
        forma_pagamento: 'dinheiro'
      });

      // Refresh the comandas data
      await fetchComandas();
      
      // Find the updated comanda
      const updatedComandas = await api.get('/consumacoes/');
      const updatedComanda = updatedComandas.find(c => c.id === selectedComanda.id);
      
      // Update selected comanda with new data
      setSelectedComanda(updatedComanda);
      
      // Clear payment amount
      setPaymentAmount('');
      
      // Show success message
      showSnackbar('Pagamento registrado com sucesso!');
      
      // Check if saldo is zero and update status if needed
      if (updatedComanda && updatedComanda.saldo <= 0) {
        await api.patch(`/consumacoes/${selectedComanda.id}/`, {
          status: 'pago'
        });
        await fetchComandas();  // Refresh again to get the updated status
      }
      
    } catch (error) {
      console.error('Error registering payment:', error);
      showSnackbar(
        error.response?.data?.valor?.[0] || 
        error.response?.data?.detail || 
        'Erro ao registrar pagamento', 
        'error'
      );
    }
  };

  const handleUpdateComanda = async (updates) => {
    if (!selectedComanda) return;
    
    try {
      await api.patch(`/consumacoes/${selectedComanda.id}/`, updates);
      showSnackbar('Comanda atualizada com sucesso!');
      fetchComandas();
    } catch (error) {
      showSnackbar('Erro ao atualizar comanda', 'error');
    }
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
 
  const handleOpenDetails = (comanda) => {
    setDetailsComanda(comanda);
    setOpenDetails(true);
  };

  const handleCloseDetails = () => {
    setOpenDetails(false);
    setDetailsComanda(null);
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3}}>
        Gestão de Comandas
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>

        {/* Left Column - Selected Comanda */}
        <Grid size={8}>
          <Paper 
            sx={{ 
              height: '100%',
              opacity: selectedComanda ? 1 : 0.5,
              transition: 'opacity 0.3s ease',
              '& > *': {
                marginLeft: '24px',
                marginRight: '24px',
              },             
            }}
          >
            <Typography variant="h6" gutterBottom>
              Comanda Selecionada
            </Typography>
            <Box sx={{ mt: 2 }}>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Número do Quarto</InputLabel>
                <OutlinedInput
                  label="Número do Quarto"
                  value={selectedComanda?.quarto || ''}
                  onChange={(e) => handleUpdateComanda({ quarto: e.target.value })}
                  disabled={!selectedComanda}
                />
              </FormControl>
              
              <FormControlLabel
                control={
                  <Checkbox
                    checked={selectedComanda?.isBusinessWorker || false}
                    onChange={(e) => handleUpdateComanda({ isBusinessWorker: e.target.checked })}
                    disabled={!selectedComanda}
                  />
                }
                label="Funcionário"
              />

              {selectedComanda && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="body1" gutterBottom>
                    Total: {formatMoney(selectedComanda.total)}
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    Pago: {formatMoney(selectedComanda.total_pago)}
                  </Typography>
                  <Typography 
                    variant="body1" 
                    gutterBottom 
                    color={selectedComanda.saldo > 0 ? "error" : "success"}
                  >
                    Saldo: {formatMoney(selectedComanda.saldo)}
                  </Typography>

                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Valor do Pagamento</InputLabel>
                    <OutlinedInput
                      type="number"
                      label="Valor do Pagamento"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      startAdornment={<Box sx={{ mr: 1 }}>R$</Box>}
                    />
                  </FormControl>
                  
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<MoneyIcon />}
                    onClick={handleRegisterPayment}
                    disabled={!paymentAmount || Number(paymentAmount) <= 0}
                  >
                    Registrar Pagamento
                  </Button>
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Right Column - New Comanda and Filters */}
        <Grid size={4}>
          <Grid container direction="column" spacing={3} sx={{ height: '100%' }}>
            {/* New Comanda Section */}
            <Grid >
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Nova Comanda
                </Typography>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Número do Quarto</InputLabel>
                  <OutlinedInput
                    label="Número do Quarto"
                    value={novaComanda.quarto}
                    onChange={(e) => setNovaComanda({ ...novaComanda, quarto: e.target.value })}
                  />
                </FormControl>
                
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={novaComanda.isBusinessWorker}
                      onChange={(e) => setNovaComanda({ 
                        ...novaComanda, 
                        isBusinessWorker: e.target.checked 
                      })}
                    />
                  }
                  label="Funcionário"
                />

                <Button 
                  variant="contained" 
                  fullWidth 
                  onClick={handleCreateComanda}
                  sx={{ mt: 2 }}
                >
                  Criar Nova Comanda
                </Button>
              </Paper>
            </Grid>

            {/* Search and Filters Section */}
            <Grid sx={{ flexGrow: 1 }}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Filtros
                </Typography>
                <Grid container spacing={2}>
                  <Grid xs={12}>
                    <FormControl fullWidth>
                      <InputLabel>Buscar por quarto</InputLabel>
                      <OutlinedInput
                        label="Buscar por quarto"
                        value={searchQuarto}
                        onChange={(e) => setSearchQuarto(e.target.value)}
                        startAdornment={<SearchIcon sx={{ mr: 1, color: 'action.active' }} />}
                      />
                    </FormControl>
                  </Grid>
                  <Grid xs={12}>
                    <FormControl fullWidth>
                    <InputLabel>Filtrar por status</InputLabel>
                      <Select
                          value={statusFilter}
                          onChange={(e) => setStatusFilter(e.target.value)}
                          label="Filtrar por status"
                          startAdornment={<FilterListIcon sx={{ mr: 1, color: 'action.active' }} />}
                      >
                          {STATUS_OPTIONS.map((option) => (
                              <MenuItem key={option.value} value={option.value}>
                                  {option.label}
                              </MenuItem>
                          ))}
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
          </Grid>
        </Grid>

      </Grid>

      {/* Comandas Grid */}
      <ComandasGrid 
        comandas={filteredComandas}
        onSelectComanda={setSelectedComanda}
        selectedComandaId={selectedComanda?.id}
        onOpenDetails={handleOpenDetails}
      />

      {/* Update the ComandaDetails component usage */}
      <ComandaDetails
        comanda={detailsComanda}
        open={openDetails}
        onClose={handleCloseDetails}
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
    </Box>
  );
}
