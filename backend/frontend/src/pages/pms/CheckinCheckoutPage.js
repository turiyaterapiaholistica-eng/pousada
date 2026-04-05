import React, { useState, useEffect } from 'react';
import Grid from '@mui/material/Grid2';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Card,
  CardContent,
  CardActions,
  TextField,
  Button,
  Chip,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  IconButton,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import LoginIcon from '@mui/icons-material/Login';
import LogoutIcon from '@mui/icons-material/Logout';
import SearchIcon from '@mui/icons-material/Search';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LocalAtmIcon from '@mui/icons-material/LocalAtm';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import TodayIcon from '@mui/icons-material/Today';
import { format, isToday } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import api from '../../services/api';

// Status colors and icons
const STATUS_COLORS = {
  confirmada: 'success',
  pendente: 'warning',
  cancelada: 'error',
  concluida: 'info',
  no_show: 'error'
};

const CheckinCheckoutPage = () => {
  const [tabValue, setTabValue] = useState(0);
  const [date, setDate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [chegadas, setChegadas] = useState([]);
  const [partidas, setPartidas] = useState([]);
  const [selectedReserva, setSelectedReserva] = useState(null);
  const [openCheckinDialog, setOpenCheckinDialog] = useState(false);
  const [openCheckoutDialog, setOpenCheckoutDialog] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [checkinObs, setCheckinObs] = useState('');
  const [checkoutData, setCheckoutData] = useState({
    valorConsumo: 0,
    observacoes: ''
  });

  useEffect(() => {
    fetchData();
  }, [date, tabValue]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const dataFormatada = format(date, 'yyyy-MM-dd');
      
      if (tabValue === 0) {
        // Chegadas do dia
        const response = await api.get(`/api/reservas/chegadas_hoje/?data=${dataFormatada}`);
        setChegadas(response);
      } else {
        // Partidas do dia
        const response = await api.get(`/api/reservas/partidas_hoje/?data=${dataFormatada}`);
        setPartidas(response);
      }
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      showSnackbar('Erro ao carregar dados', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangeTab = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleDateChange = (newDate) => {
    setDate(newDate);
  };

  const handleCheckinClick = (reserva) => {
    setSelectedReserva(reserva);
    setCheckinObs('');
    setOpenCheckinDialog(true);
  };

  const handleCheckoutClick = (reserva) => {
    setSelectedReserva(reserva);
    setCheckoutData({
      valorConsumo: 0,
      observacoes: ''
    });
    setOpenCheckoutDialog(true);
  };

  const handleConfirmCheckin = async () => {
    if (!selectedReserva) return;
    
    try {
      setIsLoading(true);
      
      const checkinData = {
        reserva_id: selectedReserva.id,
        observacoes: checkinObs
      };
      
      await api.post('/api/checkins/', checkinData);
      showSnackbar('Check-in realizado com sucesso', 'success');
      setOpenCheckinDialog(false);
      fetchData();
    } catch (error) {
      console.error('Erro ao realizar check-in:', error);
      showSnackbar(error.response?.data?.detail || 'Erro ao realizar check-in', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmCheckout = async () => {
    if (!selectedReserva) return;
    
    try {
      setIsLoading(true);
      
      const checkoutDataFormatado = {
        reserva_id: selectedReserva.id,
        valor_consumo: parseFloat(checkoutData.valorConsumo) || 0,
        observacoes: checkoutData.observacoes
      };
      
      await api.post('/api/checkouts/', checkoutDataFormatado);
      showSnackbar('Check-out realizado com sucesso', 'success');
      setOpenCheckoutDialog(false);
      fetchData();
    } catch (error) {
      console.error('Erro ao realizar check-out:', error);
      showSnackbar(error.response?.data?.detail || 'Erro ao realizar check-out', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCheckoutData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      return format(new Date(dateString), 'dd/MM/yyyy', { locale: ptBR });
    } catch (error) {
      return dateString;
    }
  };

  const renderChegadas = () => {
    if (isLoading) {
      return (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 6 }}>
          <CircularProgress size={48} color="primary" />
          <Typography variant="h6" color="text.secondary" sx={{ mt: 2 }}>
            Carregando chegadas...
          </Typography>
        </Box>
      );
    }
    
    if (chegadas.length === 0) {
      return (
        <Box sx={{ 
          p: 4, 
          textAlign: 'center', 
          backgroundColor: 'grey.50', 
          borderRadius: 2,
          mt: 3
        }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Nenhuma chegada prevista para {isToday(date) ? 'hoje' : formatDate(date)}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Não há reservas com check-in programado para esta data.
          </Typography>
        </Box>
      );
    }

    return (
      <Grid container spacing={3}>
        {Array.isArray(chegadas) ? chegadas.map((reserva) => (
          <Grid item xs={12} md={6} lg={4} key={reserva.id}>
            <Card 
              variant="outlined" 
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: 3
                }
              }}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="h6" fontWeight="medium">
                    {reserva.hospede_nome}
                  </Typography>
                  <Chip 
                    label={reserva.status_display} 
                    color={STATUS_COLORS[reserva.status]}
                    size="small"
                  />
                </Box>
                <Divider sx={{ my: 1 }} />
                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Quarto
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {reserva.quarto_nome}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Hóspedes
                    </Typography>
                    <Typography variant="body1">
                      {reserva.num_adultos} {reserva.num_adultos > 1 ? 'adultos' : 'adulto'}
                      {reserva.num_criancas > 0 ? `, ${reserva.num_criancas} ${reserva.num_criancas > 1 ? 'crianças' : 'criança'}` : ''}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Check-in
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {formatDate(reserva.data_chegada)}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Check-out
                    </Typography>
                    <Typography variant="body1">
                      {formatDate(reserva.data_saida)}
                    </Typography>
                  </Grid>
                </Grid>
                <Box sx={{ 
                  bgcolor: 'primary.light', 
                  p: 1.5, 
                  borderRadius: 1,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <Box>
                    <Typography variant="caption" color="primary.contrastText">
                      Valor Total
                    </Typography>
                    <Typography variant="h6" color="primary.contrastText">
                      {formatCurrency(reserva.valor_total)}
                    </Typography>
                  </Box>
                  <LocalAtmIcon color="primary.contrastText" />
                </Box>
              </CardContent>
              <CardActions sx={{ p: 2, pt: 0 }}>
                <Button
                  fullWidth
                  variant="contained"
                  color="success"
                  onClick={() => handleCheckinClick(reserva)}
                  startIcon={<LoginIcon />}
                  disabled={reserva.status !== 'confirmada'}
                >
                  Realizar Check-in
                </Button>
              </CardActions>
            </Card>
          </Grid>
        )) : null}
      </Grid>
    );
  };

  const renderPartidas = () => {
    if (isLoading) {
      return (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 6 }}>
          <CircularProgress size={48} color="primary" />
          <Typography variant="h6" color="text.secondary" sx={{ mt: 2 }}>
            Carregando saídas...
          </Typography>
        </Box>
      );
    }
    
    if (partidas.length === 0) {
      return (
        <Box sx={{ 
          p: 4, 
          textAlign: 'center', 
          backgroundColor: 'grey.50', 
          borderRadius: 2,
          mt: 3
        }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Nenhuma saída prevista para {isToday(date) ? 'hoje' : formatDate(date)}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Não há reservas com check-out programado para esta data.
          </Typography>
        </Box>
      );
    }

    return (
      <Grid container spacing={3}>
        {Array.isArray(partidas) ? partidas.map((reserva) => (
          <Grid item xs={12} md={6} key={reserva.id}>
            <Card variant="outlined">
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography variant="h6" fontWeight="medium">
                      {reserva.hospede_nome}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Quarto {reserva.quarto_nome}
                    </Typography>
                  </Box>
                  <Chip 
                    label={reserva.status_display} 
                    color={STATUS_COLORS[reserva.status]}
                    size="small"
                  />
                </Box>
                
                <Divider sx={{ my: 2 }} />
                
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Check-in
                    </Typography>
                    <Typography variant="body1">
                      {formatDate(reserva.data_chegada)}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Check-out
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {formatDate(reserva.data_saida)}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Valor Total
                    </Typography>
                    <Typography variant="body1" fontWeight="medium" color="primary.main">
                      {formatCurrency(reserva.valor_total)}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Status do Pagamento
                    </Typography>
                    <Chip 
                      label={reserva.saldo <= 0 ? "Pago" : "Pendente"} 
                      color={reserva.saldo <= 0 ? "success" : "warning"}
                      size="small"
                    />
                  </Grid>
                </Grid>
              </CardContent>
              <CardActions sx={{ p: 2, pt: 0 }}>
                <Button
                  fullWidth
                  variant="contained"
                  color="primary"
                  onClick={() => handleCheckoutClick(reserva)}
                  startIcon={<LogoutIcon />}
                  disabled={reserva.status !== 'concluida'}
                >
                  Realizar Check-out
                </Button>
              </CardActions>
            </Card>
          </Grid>
        )) : null}
      </Grid>
    );
  };

  return (
    <Box>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 3 
      }}>
        <Typography variant="h5">
          <MeetingRoomIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Chegadas e Saídas
        </Typography>
        
        {isToday(date) ? (
          <Chip 
            icon={<TodayIcon />} 
            label="Hoje" 
            color="primary" 
            variant="outlined" 
          />
        ) : (
          <Typography variant="subtitle1" color="text.secondary">
            {formatDate(date)}
          </Typography>
        )}
      </Box>

      <Paper sx={{ mb: 3 }}>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' }, 
          alignItems: { xs: 'stretch', sm: 'center' },
          p: 2 
        }}>
          <Box sx={{ flex: 1, mb: { xs: 2, sm: 0 } }}>
            <DatePicker
              label="Data"
              value={date}
              onChange={handleDateChange}
              slotProps={{
                textField: {
                  fullWidth: true,
                  variant: "outlined"
                }
              }}
            />
          </Box>
          <Box sx={{ ml: { sm: 2 } }}>
            <Button
              variant="outlined"
              onClick={() => setDate(new Date())}
              sx={{ mr: 1 }}
            >
              Hoje
            </Button>
            <Button
              variant="contained"
              onClick={fetchData}
              startIcon={<SearchIcon />}
            >
              Buscar
            </Button>
          </Box>
        </Box>

        <Tabs
          value={tabValue}
          onChange={handleChangeTab}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab 
            icon={<LoginIcon />} 
            label="CHEGADAS" 
            iconPosition="start"
          />
          <Tab 
            icon={<LogoutIcon />} 
            label="SAÍDAS" 
            iconPosition="start"
          />
        </Tabs>
      </Paper>

      <Box sx={{ py: 2 }}>
        {tabValue === 0 ? renderChegadas() : renderPartidas()}
      </Box>

      {/* Dialog de Check-in */}
      <Dialog
        open={openCheckinDialog}
        onClose={() => !isLoading && setOpenCheckinDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <LoginIcon sx={{ mr: 1 }} />
            Realizar Check-in
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {selectedReserva && (
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Hóspede
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {selectedReserva.hospede_nome}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Quarto
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {selectedReserva.quarto_nome}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Check-in
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {formatDate(selectedReserva.data_chegada)}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Check-out
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {formatDate(selectedReserva.data_saida)}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Box 
                  sx={{ 
                    backgroundColor: 'primary.light', 
                    p: 2, 
                    borderRadius: 1,
                    mt: 1, 
                    mb: 2,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <Box>
                    <Typography variant="body2" color="primary.contrastText">
                      Valor da Estadia:
                    </Typography>
                    <Typography variant="h6" color="primary.contrastText" fontWeight="bold">
                      {formatCurrency(selectedReserva.valor_total)}
                    </Typography>
                  </Box>
                  <LocalAtmIcon fontSize="large" color="primary.contrastText" />
                </Box>
              </Grid>
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <TextField
                  label="Observações"
                  multiline
                  rows={3}
                  fullWidth
                  value={checkinObs}
                  onChange={(e) => setCheckinObs(e.target.value)}
                  placeholder="Informações adicionais sobre o check-in"
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setOpenCheckinDialog(false)}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="success"
            onClick={handleConfirmCheckin}
            startIcon={isLoading ? <CircularProgress size={20} /> : <CheckCircleIcon />}
            disabled={isLoading}
          >
            Confirmar Check-in
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de Check-out */}
      <Dialog
        open={openCheckoutDialog}
        onClose={() => !isLoading && setOpenCheckoutDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <LogoutIcon sx={{ mr: 1 }} />
            Realizar Check-out
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {selectedReserva && (
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Hóspede
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {selectedReserva.hospede_nome}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Quarto
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {selectedReserva.quarto_nome}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Check-in
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {formatDate(selectedReserva.data_chegada)}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Check-out
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {formatDate(selectedReserva.data_saida)}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Box 
                  sx={{ 
                    backgroundColor: 'primary.light', 
                    p: 2, 
                    borderRadius: 1,
                    mt: 1, 
                    mb: 2,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <Box>
                    <Typography variant="body2" color="primary.contrastText">
                      Valor da Estadia:
                    </Typography>
                    <Typography variant="h6" color="primary.contrastText" fontWeight="bold">
                      {formatCurrency(selectedReserva.valor_total)}
                    </Typography>
                  </Box>
                  <LocalAtmIcon fontSize="large" color="primary.contrastText" />
                </Box>
              </Grid>
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
                <TextField
                  label="Consumo Extra (R$)"
                  name="valorConsumo"
                  type="number"
                  fullWidth
                  value={checkoutData.valorConsumo}
                  onChange={handleInputChange}
                  InputProps={{
                    inputProps: { 
                      min: 0, 
                      step: '0.01' 
                    }
                  }}
                  sx={{ mb: 2 }}
                />
                <TextField
                  label="Observações"
                  name="observacoes"
                  multiline
                  rows={3}
                  fullWidth
                  value={checkoutData.observacoes}
                  onChange={handleInputChange}
                  placeholder="Informações adicionais sobre o check-out"
                />
              </Grid>
              {parseFloat(checkoutData.valorConsumo) > 0 && (
                <Grid item xs={12}>
                  <Box 
                    sx={{ 
                      backgroundColor: 'success.light', 
                      p: 2, 
                      borderRadius: 1,
                      mt: 1,
                      display: 'flex',
                      justifyContent: 'space-between'
                    }}
                  >
                    <Box>
                      <Typography variant="body2" color="success.contrastText">
                        Total a Pagar:
                      </Typography>
                      <Typography variant="h6" color="success.contrastText" fontWeight="bold">
                        {formatCurrency(selectedReserva.valor_total + parseFloat(checkoutData.valorConsumo))}
                      </Typography>
                    </Box>
                    <ReceiptLongIcon fontSize="large" color="success.contrastText" />
                  </Box>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setOpenCheckoutDialog(false)}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleConfirmCheckout}
            startIcon={isLoading ? <CircularProgress size={20} /> : <DoneAllIcon />}
            disabled={isLoading}
          >
            Confirmar Check-out
          </Button>
        </DialogActions>
      </Dialog>

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
};

export default CheckinCheckoutPage;