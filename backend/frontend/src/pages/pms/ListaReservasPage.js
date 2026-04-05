import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  Button,
  IconButton,
  Tooltip,
  TextField,
  MenuItem,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  CircularProgress,
  Grid,
  Card,
  CardContent
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import CancelIcon from '@mui/icons-material/Cancel';
import ListAltIcon from '@mui/icons-material/ListAlt';
import AddIcon from '@mui/icons-material/Add';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import ClearIcon from '@mui/icons-material/Clear';
import { useNavigate } from 'react-router-dom';
import { format, isValid, differenceInDays } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import api from '../../services/api';

// Status colors
const STATUS_COLORS = {
  confirmada: 'success',
  pendente: 'warning',
  cancelada: 'error',
  concluida: 'info',
  no_show: 'error'
};

const ListaReservasPage = () => {
  const navigate = useNavigate();
  const [reservas, setReservas] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [selectedReserva, setSelectedReserva] = useState(null);
  const [openDetailDialog, setOpenDetailDialog] = useState(false);
  const [openCancelDialog, setOpenCancelDialog] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [showFilters, setShowFilters] = useState(false);

  // Filters
  const [filters, setFilters] = useState({
    dataChegada: null,
    dataSaida: null,
    status: '',
    quarto: '',
    hospede: ''
  });

  useEffect(() => {
    fetchReservas();
  }, [page, rowsPerPage]);

  const fetchReservas = async () => {
    setIsLoading(true);
    try {
      // Build query params
      const params = new URLSearchParams();
      
      if (filters.dataChegada && isValid(filters.dataChegada)) {
        params.append('chegada', format(filters.dataChegada, 'yyyy-MM-dd'));
      }
      
      if (filters.dataSaida && isValid(filters.dataSaida)) {
        params.append('saida', format(filters.dataSaida, 'yyyy-MM-dd'));
      }
      
      if (filters.status) {
        params.append('status', filters.status);
      }
      
      if (filters.quarto) {
        params.append('quarto', filters.quarto);
      }
      
      if (filters.hospede) {
        params.append('hospede', filters.hospede);
      }
      
      const url = `/reservas/${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await api.get(url);
      
      setReservas(response);
      setTotal(response.length);
    } catch (error) {
      console.error('Erro ao buscar reservas:', error);
      showSnackbar('Erro ao carregar reservas', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleDateFilterChange = (date, field) => {
    setFilters(prev => ({
      ...prev,
      [field]: date
    }));
  };

  const handleClearFilters = () => {
    setFilters({
      dataChegada: null,
      dataSaida: null,
      status: '',
      quarto: '',
      hospede: ''
    });
  };

  const handleApplyFilters = () => {
    setPage(0);
    fetchReservas();
  };

  const handleViewReserva = (reserva) => {
    setSelectedReserva(reserva);
    setOpenDetailDialog(true);
  };

  const handleEditReserva = (reservaId) => {
    navigate(`/reservas/editar/${reservaId}`);
  };

  const handleCancelReserva = (reserva) => {
    setSelectedReserva(reserva);
    setOpenCancelDialog(true);
  };

  const confirmCancelReserva = async () => {
    if (!selectedReserva) return;
    
    try {
      await api.post(`/reservas/${selectedReserva.id}/cancelar/`);
      showSnackbar('Reserva cancelada com sucesso', 'success');
      setOpenCancelDialog(false);
      fetchReservas();
    } catch (error) {
      console.error('Erro ao cancelar reserva:', error);
      showSnackbar(
        error.response?.data?.error || 'Erro ao cancelar reserva',
        'error'
      );
    }
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

  const calcularEstadia = (dataChegada, dataSaida) => {
    try {
      const dias = differenceInDays(new Date(dataSaida), new Date(dataChegada));
      return dias === 1 ? '1 diária' : `${dias} diárias`;
    } catch (error) {
      return '-';
    }
  };

  // Pagination setup
  const paginatedReservas = reservas.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Box>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 3 
      }}>
        <Typography variant="h5">
          <ListAltIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Lista de Reservas
        </Typography>

        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant={showFilters ? "contained" : "outlined"}
            startIcon={<FilterAltIcon />}
            onClick={() => setShowFilters(!showFilters)}
          >
            Filtros
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => navigate('/reservas/nova')}
          >
            Nova Reserva
          </Button>
        </Box>
      </Box>

      {/* Filtros */}
      {showFilters && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={2.4}>
                <DatePicker
                  label="Check-in a partir de"
                  value={filters.dataChegada}
                  onChange={(date) => handleDateFilterChange(date, 'dataChegada')}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      size: "small",
                      variant: "outlined"
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} md={2.4}>
                <DatePicker
                  label="Check-out até"
                  value={filters.dataSaida}
                  onChange={(date) => handleDateFilterChange(date, 'dataSaida')}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      size: "small",
                      variant: "outlined"
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} md={2.4}>
                <TextField
                  select
                  label="Status"
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  fullWidth
                  size="small"
                >
                  <MenuItem value="">Todos</MenuItem>
                  <MenuItem value="confirmada">Confirmada</MenuItem>
                  <MenuItem value="pendente">Pendente</MenuItem>
                  <MenuItem value="concluida">Concluída</MenuItem>
                  <MenuItem value="cancelada">Cancelada</MenuItem>
                  <MenuItem value="no_show">No Show</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} md={2.4}>
                <TextField
                  label="Hóspede"
                  value={filters.hospede}
                  onChange={(e) => handleFilterChange('hospede', e.target.value)}
                  fullWidth
                  size="small"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} md={2.4} sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleApplyFilters}
                  fullWidth
                >
                  Aplicar
                </Button>
                <Button
                  variant="outlined"
                  onClick={handleClearFilters}
                  startIcon={<ClearIcon />}
                >
                  Limpar
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Tabela de Reservas */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: 'grey.100' }}>
                <TableCell>ID</TableCell>
                <TableCell>Quarto</TableCell>
                <TableCell>Hóspede</TableCell>
                <TableCell>Check-in</TableCell>
                <TableCell>Check-out</TableCell>
                <TableCell>Estadia</TableCell>
                <TableCell>Valor</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="center">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                    <CircularProgress size={40} />
                    <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
                      Carregando reservas...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (Array.isArray(paginatedReservas) && paginatedReservas.length > 0 ? (
                paginatedReservas.map((reserva) => (
                  <TableRow 
                    key={reserva.id}
                    sx={{ 
                      '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.04)' },
                      cursor: 'pointer'
                    }}
                    onClick={() => handleViewReserva(reserva)}
                  >
                    <TableCell>#{reserva.id}</TableCell>
                    <TableCell>{reserva.quarto_nome}</TableCell>
                    <TableCell>{reserva.hospede_nome}</TableCell>
                    <TableCell>{formatDate(reserva.data_chegada)}</TableCell>
                    <TableCell>{formatDate(reserva.data_saida)}</TableCell>
                    <TableCell>
                      {calcularEstadia(reserva.data_chegada, reserva.data_saida)}
                    </TableCell>
                    <TableCell>
                      <Typography fontWeight="medium">
                        {formatCurrency(reserva.valor_total)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={reserva.status_display}
                        color={STATUS_COLORS[reserva.status] || 'default'}
                        size="small"
                        sx={{ minWidth: '90px' }}
                      />
                    </TableCell>
                    <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                        <Tooltip title="Ver detalhes">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewReserva(reserva);
                            }}
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        {reserva.status !== 'cancelada' && reserva.status !== 'concluida' && (
                          <>
                            <Tooltip title="Editar">
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditReserva(reserva.id);
                                }}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Cancelar">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCancelReserva(reserva);
                                }}
                              >
                                <CancelIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                    <Typography variant="body1" color="text.secondary">
                      Nenhuma reserva encontrada
                    </Typography>
                    <Button 
                      variant="outlined" 
                      startIcon={<AddIcon />}
                      onClick={() => navigate('/reservas/nova')}
                      sx={{ mt: 2 }}
                    >
                      Criar Nova Reserva
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[10, 25, 50]}
          component="div"
          count={total}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Linhas por página:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
        />
      </Paper>

      {/* Dialog de Detalhes */}
      <Dialog
        open={openDetailDialog}
        onClose={() => setOpenDetailDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid',
          borderColor: 'divider' 
        }}>
          <Box>
            Detalhes da Reserva #{selectedReserva?.id}
            {selectedReserva && (
              <Chip
                label={selectedReserva.status_display}
                color={STATUS_COLORS[selectedReserva.status] || 'default'}
                size="small"
                sx={{ ml: 2 }}
              />
            )}
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {selectedReserva && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Informações da Reserva
                </Typography>
              </Grid>
              
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
              
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Estadia
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {calcularEstadia(selectedReserva.data_chegada, selectedReserva.data_saida)}
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Valor da Diária
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {formatCurrency(selectedReserva.valor_diaria)}
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Hóspedes
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {selectedReserva.num_adultos} {selectedReserva.num_adultos > 1 ? 'adultos' : 'adulto'}
                  {selectedReserva.num_criancas > 0 ? `, ${selectedReserva.num_criancas} ${selectedReserva.num_criancas > 1 ? 'crianças' : 'criança'}` : ''}
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Valor Total
                </Typography>
                <Typography variant="body1" fontWeight="medium" color="primary.main">
                  {formatCurrency(selectedReserva.valor_total)}
                </Typography>
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">
                  Observações
                </Typography>
                <Typography variant="body1">
                  {selectedReserva.observacoes || 'Nenhuma observação'}
                </Typography>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setOpenDetailDialog(false)}>
            Fechar
          </Button>
          {selectedReserva && selectedReserva.status !== 'cancelada' && selectedReserva.status !== 'concluida' && (
            <>
              <Button 
                color="primary" 
                variant="outlined" 
                onClick={() => {
                  setOpenDetailDialog(false);
                  handleEditReserva(selectedReserva.id);
                }}
              >
                Editar
              </Button>
              <Button 
                color="error" 
                variant="contained" 
                onClick={() => {
                  setOpenDetailDialog(false);
                  handleCancelReserva(selectedReserva);
                }}
              >
                Cancelar Reserva
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      {/* Dialog de Cancelamento */}
      <Dialog
        open={openCancelDialog}
        onClose={() => setOpenCancelDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Confirmar Cancelamento
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Esta ação não pode ser desfeita.
          </Alert>
          <Typography variant="body1">
            Você está prestes a cancelar a reserva #{selectedReserva?.id} de {selectedReserva?.hospede_nome}.
          </Typography>
          <Typography variant="body1" sx={{ mt: 1 }}>
            Check-in: {selectedReserva && formatDate(selectedReserva.data_chegada)}
            <br />
            Check-out: {selectedReserva && formatDate(selectedReserva.data_saida)}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCancelDialog(false)}>
            Voltar
          </Button>
          <Button 
            color="error" 
            variant="contained" 
            onClick={confirmCancelReserva}
          >
            Confirmar Cancelamento
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

export default ListaReservasPage;