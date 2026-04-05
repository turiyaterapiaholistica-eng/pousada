import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  IconButton,
  Tooltip,
  Chip,
  Card,
  CardHeader,
  CardContent,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  CircularProgress,
  useTheme
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import { format, addDays, isSameDay, isWithinInterval, differenceInDays } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import TodayIcon from '@mui/icons-material/Today';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AddIcon from '@mui/icons-material/Add';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

// Status colors
const STATUS_COLORS = {
  confirmada: 'success',
  pendente: 'warning',
  cancelada: 'error',
  concluida: 'info',
  no_show: 'error',
  disponivel: 'default',
  ocupado: 'primary',
  manutencao: 'error',
  bloqueado: 'error'
};

const MapaReservasPage = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [quartos, setQuartos] = useState([]);
  const [reservas, setReservas] = useState([]);
  const [startDate, setStartDate] = useState(new Date());
  const [dateRange, setDateRange] = useState([]);
  const [selectedReserva, setSelectedReserva] = useState(null);
  const [openReservaDialog, setOpenReservaDialog] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  
  // Number of days to display
  const displayDays = 14;

  useEffect(() => {
    generateDateRange();
    fetchData();
  }, [startDate]);

  const generateDateRange = () => {
    const range = [];
    for (let i = 0; i < displayDays; i++) {
      range.push(addDays(startDate, i));
    }
    setDateRange(range);
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Format dates for API
      const dataInicio = format(startDate, 'yyyy-MM-dd');
      const dataFim = format(addDays(startDate, displayDays), 'yyyy-MM-dd');
      
      // Get rooms and occupancy data
      const mapaData = await api.get(`/quartos/mapa/?inicio=${dataInicio}&fim=${dataFim}`);
      
      // Sort rooms by number
      const sortedQuartos = [...mapaData].sort((a, b) => {
        return a.nome.localeCompare(b.nome, undefined, { numeric: true });
      });
      
      setQuartos(sortedQuartos);
      
      // Extract all reservations for reservation dialog
      const todasReservas = [];
      mapaData.forEach(quarto => {
        quarto.reservas.forEach(reserva => {
          todasReservas.push({
            ...reserva,
            quarto_nome: quarto.nome,
            quarto_tipo: quarto.tipo_display
          });
        });
      });
      setReservas(todasReservas);
      
    } catch (error) {
      console.error('Erro ao buscar dados do mapa:', error);
      showSnackbar('Erro ao carregar mapa de reservas', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreviousWeek = () => {
    setStartDate(prev => addDays(prev, -7));
  };

  const handleNextWeek = () => {
    setStartDate(prev => addDays(prev, 7));
  };

  const handleToday = () => {
    setStartDate(new Date());
  };

  const handleDateChange = (date) => {
    setStartDate(date);
  };

  const handleReservaClick = (reserva) => {
    // Find the full reservation data
    const reservaCompleta = reservas.find(r => r.id === reserva.id);
    setSelectedReserva(reservaCompleta);
    setOpenReservaDialog(true);
  };

  const handleNovaReserva = (quarto, data) => {
    navigate('/reservas/nova', { 
      state: { 
        quartoPreSelecionado: quarto.id,
        dataChegada: format(data, 'yyyy-MM-dd') 
      }
    });
  };

  const isDateOccupied = (quarto, date) => {
    return quarto.reservas.some(reserva => {
      const chegada = new Date(reserva.chegada);
      const saida = new Date(reserva.saida);
      return isWithinInterval(date, { start: chegada, end: addDays(saida, -1) });
    });
  };

  const getReservaForDate = (quarto, date) => {
    return quarto.reservas.find(reserva => {
      const chegada = new Date(reserva.chegada);
      const saida = new Date(reserva.saida);
      return isWithinInterval(date, { start: chegada, end: addDays(saida, -1) });
    });
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const formatDate = (date) => {
    return format(date, 'dd/MM/yyyy', { locale: ptBR });
  };

  const formatDayOfWeek = (date) => {
    return format(date, 'EEE', { locale: ptBR });
  };

  const isToday = (date) => {
    return isSameDay(date, new Date());
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3 }}>
        <CalendarMonthIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
        Mapa de Reservas
      </Typography>

      {/* Controls */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item>
            <Button
              variant="outlined"
              onClick={handlePreviousWeek}
              startIcon={<ArrowBackIcon />}
            >
              Anterior
            </Button>
          </Grid>
          <Grid item>
            <Button
              variant="outlined"
              onClick={handleNextWeek}
              endIcon={<ArrowForwardIcon />}
            >
              Próximo
            </Button>
          </Grid>
          <Grid item>
            <Button
              variant="outlined"
              onClick={handleToday}
              startIcon={<TodayIcon />}
            >
              Hoje
            </Button>
          </Grid>
          <Grid item xs>
            <DatePicker
              label="Ir para data"
              value={startDate}
              onChange={handleDateChange}
              slotProps={{
                textField: {
                  size: "small",
                  fullWidth: true
                }
              }}
            />
          </Grid>
          <Grid item>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate('/reservas/nova')}
            >
              Nova Reserva
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
          <CircularProgress size={60} />
          <Typography variant="h6" sx={{ ml: 2 }}>Carregando mapa de reservas...</Typography>
        </Box>
      ) : (
        <Paper sx={{ overflowX: 'auto' }}>
          <Box sx={{ minWidth: 900, p: 2 }}>
            {/* Calendar Header */}
            <Box sx={{ display: 'flex', mb: 2 }}>
              {/* Room column */}
              <Box sx={{ width: 150, flexShrink: 0, mr: 1 }}>
                <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
                  Quarto
                </Typography>
              </Box>

              {/* Date Columns */}
              {dateRange.map((date, index) => (
                <Box 
                  key={index} 
                  sx={{ 
                    width: 120,
                    textAlign: 'center',
                    borderRight: index < dateRange.length - 1 ? '1px solid' : 'none',
                    borderColor: 'divider',
                    bgcolor: isToday(date) ? 'primary.light' : 'transparent',
                    color: isToday(date) ? 'primary.contrastText' : 'inherit',
                    p: 1,
                    borderRadius: isToday(date) ? 1 : 0
                  }}
                >
                  <Typography 
                    variant="subtitle2" 
                    sx={{ 
                      textTransform: 'capitalize',
                      fontWeight: isToday(date) ? 'bold' : 'normal'
                    }}
                  >
                    {formatDayOfWeek(date)}
                  </Typography>
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      fontWeight: isToday(date) ? 'bold' : 'normal'
                    }}
                  >
                    {format(date, 'dd/MM')}
                  </Typography>
                </Box>
              ))}
            </Box>

            <Divider sx={{ mb: 2 }} />

            {/* Room Rows */}
            {quartos.map((quarto) => (
              <Box key={quarto.id} sx={{ display: 'flex', mb: 2 }}>
                {/* Room Info */}
                <Box 
                  sx={{ 
                    width: 150, 
                    mr: 1, 
                    p: 1,
                    backgroundColor: 'grey.100',
                    borderRadius: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center'
                  }}
                >
                  <Typography variant="subtitle1" fontWeight="bold">
                    {quarto.nome}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {quarto.tipo_display}
                  </Typography>
                  <Chip 
                    label={quarto.status_display} 
                    color={STATUS_COLORS[quarto.status]}
                    size="small"
                    sx={{ mt: 1, maxWidth: '100%' }}
                  />
                </Box>

                {/* Reservation Cells */}
                {dateRange.map((date, index) => {
                  const reserva = getReservaForDate(quarto, date);
                  const isOccupied = !!reserva;

                  let backgroundColor = 'background.paper';
                  let textColor = 'text.primary';
                  
                  // Determine cell appearance based on reservation status
                  if (isOccupied) {
                    switch (reserva.status) {
                      case 'confirmada':
                        backgroundColor = theme.palette.success.light;
                        textColor = theme.palette.success.contrastText;
                        break;
                      case 'pendente':
                        backgroundColor = theme.palette.warning.light;
                        textColor = theme.palette.warning.contrastText;
                        break;
                      case 'concluida':
                        backgroundColor = theme.palette.info.light;
                        textColor = theme.palette.info.contrastText;
                        break;
                      case 'cancelada':
                      case 'no_show':
                        backgroundColor = theme.palette.error.light;
                        textColor = theme.palette.error.contrastText;
                        break;
                    }
                  }

                  return (
                    <Box 
                      key={index}
                      sx={{ 
                        width: 120,
                        height: '100%',
                        p: 1,
                        backgroundColor: backgroundColor,
                        borderRight: index < dateRange.length - 1 ? '1px solid' : 'none',
                        borderColor: 'divider',
                        position: 'relative',
                        cursor: isOccupied ? 'pointer' : 'default',
                        '&:hover': {
                          backgroundColor: isOccupied 
                            ? `${backgroundColor}90` 
                            : theme.palette.action.hover
                        }
                      }}
                      onClick={() => {
                        if (isOccupied) {
                          handleReservaClick(reserva);
                        } else if (quarto.status === 'disponivel') {
                          handleNovaReserva(quarto, date);
                        }
                      }}
                    >
                      {isOccupied ? (
                        <Box>
                          <Typography 
                            variant="body2" 
                            fontWeight="medium" 
                            color={textColor}
                            noWrap
                          >
                            {reserva.hospede}
                          </Typography>
                          <Typography 
                            variant="caption" 
                            display="block" 
                            color={textColor}
                          >
                            {new Date(reserva.chegada).toLocaleDateString('pt-BR')} - {new Date(reserva.saida).toLocaleDateString('pt-BR')}
                          </Typography>
                        </Box>
                      ) : (
                        <Box 
                          sx={{ 
                            display: 'flex', 
                            justifyContent: 'center', 
                            alignItems: 'center',
                            height: '100%',
                            minHeight: 48 
                          }}
                        >
                          {quarto.status === 'disponivel' && (
                            <IconButton 
                              size="small" 
                              color="primary"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleNovaReserva(quarto, date);
                              }}
                              sx={{ opacity: 0.6, '&:hover': { opacity: 1 } }}
                            >
                              <AddIcon fontSize="small" />
                            </IconButton>
                          )}
                        </Box>
                      )}
                    </Box>
                  );
                })}
              </Box>
            ))}
          </Box>
        </Paper>
      )}

      {/* Reservation Detail Dialog */}
      <Dialog
        open={openReservaDialog}
        onClose={() => setOpenReservaDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Detalhes da Reserva
          {selectedReserva && (
            <Chip
              label={selectedReserva.status}
              color={STATUS_COLORS[selectedReserva.status] || 'default'}
              size="small"
              sx={{ ml: 2 }}
            />
          )}
        </DialogTitle>
        <DialogContent dividers>
          {selectedReserva && (
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Hóspede
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {selectedReserva.hospede}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Quarto
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {selectedReserva.quarto_nome} ({selectedReserva.quarto_tipo})
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Check-in
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {format(new Date(selectedReserva.chegada), 'dd/MM/yyyy', { locale: ptBR })}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Check-out
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {format(new Date(selectedReserva.saida), 'dd/MM/yyyy', { locale: ptBR })}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Estadia
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {differenceInDays(new Date(selectedReserva.saida), new Date(selectedReserva.chegada))} dias
                </Typography>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenReservaDialog(false)}>
            Fechar
          </Button>
          <Button 
            variant="contained"
            color="primary"
            startIcon={<VisibilityIcon />}
            onClick={() => {
              setOpenReservaDialog(false);
              navigate(`/reservas/visualizar/${selectedReserva.id}`);
            }}
          >
            Ver Detalhes Completos
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

export default MapaReservasPage;