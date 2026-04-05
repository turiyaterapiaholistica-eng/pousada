import React, { useState, useEffect } from 'react';
import Grid from '@mui/material/Grid2';
import { 
  Box, 
  Paper, 
  Typography, 
  TextField, 
  Button, 
  MenuItem, 
  Divider,
  Alert,
  Snackbar,
  FormHelperText,
  Card,
  CardContent,
  Stepper,
  Step,
  StepLabel,
  CircularProgress
} from '@mui/material';
import { 
  DatePicker
} from '@mui/x-date-pickers';
import { useNavigate, useLocation } from 'react-router-dom';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import HotelIcon from '@mui/icons-material/Hotel';
import PersonIcon from '@mui/icons-material/Person';
import ReceiptIcon from '@mui/icons-material/Receipt';
import { format, addDays, differenceInDays } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import api from '../../services/api';

// Tipos de documento
const DOCUMENTO_TYPES = [
  { value: 'cpf', label: 'CPF' },
  { value: 'rg', label: 'RG' },
  { value: 'passaporte', label: 'Passaporte' }
];

const NovaReservaPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeStep, setActiveStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [quartos, setQuartos] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  
  // Form data
  const [reservaData, setReservaData] = useState({
    dataChegada: new Date(),
    dataSaida: addDays(new Date(), 1),
    quarto: '',
    valorDiaria: '',
    numAdultos: 1,
    numCriancas: 0,
    observacoes: ''
  });
  
  const [hospede, setHospede] = useState({
    nome: '',
    sobrenome: '',
    email: '',
    telefone: '',
    dataNascimento: null,
    tipoDocumento: 'cpf',
    numeroDocumento: ''
  });
  
  // Form validation
  const [errors, setErrors] = useState({});
  
  // Calculated fields
  const [quartoSelecionado, setQuartoSelecionado] = useState(null);
  const [numDias, setNumDias] = useState(1);
  const [valorTotal, setValorTotal] = useState(0);
  
  // Check for pre-selected data from location state (when coming from mapa de reservas)
  useEffect(() => {
    if (location.state) {
      const { quartoPreSelecionado, dataChegada } = location.state;
      
      if (dataChegada) {
        const parsedDate = new Date(dataChegada);
        if (!isNaN(parsedDate.getTime())) {
          setReservaData(prev => ({
            ...prev,
            dataChegada: parsedDate,
            dataSaida: addDays(parsedDate, 1)
          }));
        }
      }
      
      if (quartoPreSelecionado) {
        setReservaData(prev => ({
          ...prev,
          quarto: quartoPreSelecionado
        }));
      }
    }
  }, [location.state]);
  
  useEffect(() => {
    fetchQuartosDisponiveis();
  }, [reservaData.dataChegada, reservaData.dataSaida]);
  
  useEffect(() => {
    if (reservaData.dataChegada && reservaData.dataSaida) {
      const dias = differenceInDays(reservaData.dataSaida, reservaData.dataChegada);
      setNumDias(dias > 0 ? dias : 1);
    }
  }, [reservaData.dataChegada, reservaData.dataSaida]);
  
  useEffect(() => {
    if (reservaData.quarto && quartos.length > 0) {
      const quarto = quartos.find(q => q.id === parseInt(reservaData.quarto));
      setQuartoSelecionado(quarto);
      
      if (quarto && !reservaData.valorDiaria) {
        setReservaData({
          ...reservaData,
          valorDiaria: quarto.valor_diaria_padrao
        });
      }
    }
  }, [reservaData.quarto, quartos]);
  
  useEffect(() => {
    if (reservaData.valorDiaria && numDias) {
      setValorTotal(parseFloat(reservaData.valorDiaria) * numDias);
    } else {
      setValorTotal(0);
    }
  }, [reservaData.valorDiaria, numDias]);
  
  const fetchQuartosDisponiveis = async () => {
    setIsLoading(true);
    try {
      const dataChegada = format(reservaData.dataChegada, 'yyyy-MM-dd');
      const dataSaida = format(reservaData.dataSaida, 'yyyy-MM-dd');
      
      const response = await api.get(`/quartos/disponibilidade/?chegada=${dataChegada}&saida=${dataSaida}`);
      
      setQuartos(response);
      
      if (reservaData.quarto && !response.find(q => q.id === parseInt(reservaData.quarto))) {
        // O quarto selecionado não está mais disponível
        setReservaData({ ...reservaData, quarto: '' });
        setQuartoSelecionado(null);
      }
    } catch (error) {
      console.error('Erro ao buscar quartos disponíveis:', error);
      showSnackbar('Erro ao buscar quartos disponíveis', 'error');
    } finally {
      setIsLoading(false);
    }
  };
  
  const validateReservaForm = () => {
    const newErrors = {};
    
    if (!reservaData.quarto) {
      newErrors.quarto = 'Selecione um quarto';
    }
    
    if (!reservaData.valorDiaria) {
      newErrors.valorDiaria = 'Insira o valor da diária';
    } else if (parseFloat(reservaData.valorDiaria) <= 0) {
      newErrors.valorDiaria = 'O valor da diária deve ser maior que zero';
    }
    
    if (reservaData.dataChegada >= reservaData.dataSaida) {
      newErrors.dataSaida = 'A data de saída deve ser posterior à data de chegada';
    }
    
    if (reservaData.numAdultos < 1) {
      newErrors.numAdultos = 'Deve haver pelo menos 1 adulto';
    }
    
    if (quartoSelecionado) {
      if (reservaData.numAdultos > quartoSelecionado.capacidade_adultos) {
        newErrors.numAdultos = `Este quarto comporta no máximo ${quartoSelecionado.capacidade_adultos} adultos`;
      }
      
      if (reservaData.numCriancas > quartoSelecionado.capacidade_criancas) {
        newErrors.numCriancas = `Este quarto comporta no máximo ${quartoSelecionado.capacidade_criancas} crianças`;
      }
    }
    
    setErrors(prevErrors => ({ ...prevErrors, ...newErrors }));
    return Object.keys(newErrors).length === 0;
  };
  
  const validateHospedeForm = () => {
    const newErrors = {};
    
    if (!hospede.nome.trim()) {
      newErrors.nome = 'Nome é obrigatório';
    }
    
    if (!hospede.sobrenome.trim()) {
      newErrors.sobrenome = 'Sobrenome é obrigatório';
    }
    
    if (hospede.email && !/\S+@\S+\.\S+/.test(hospede.email)) {
      newErrors.email = 'Email inválido';
    }
    
    if (!hospede.numeroDocumento.trim()) {
      newErrors.numeroDocumento = 'Número do documento é obrigatório';
    } else if (hospede.tipoDocumento === 'cpf' && !/^\d{11}$/.test(hospede.numeroDocumento)) {
      newErrors.numeroDocumento = 'CPF deve conter 11 dígitos numéricos';
    }
    
    setErrors(prevErrors => ({ ...prevErrors, ...newErrors }));
    return Object.keys(newErrors).length === 0;
  };
  
  const handleNext = () => {
    if (activeStep === 0) {
      if (validateReservaForm()) {
        setActiveStep(1);
      }
    } else if (activeStep === 1) {
      if (validateHospedeForm()) {
        setActiveStep(2);
      }
    }
  };
  
  const handleBack = () => {
    setActiveStep(prevStep => prevStep - 1);
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Clear the specific error when the field is edited
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
    
    setReservaData({
      ...reservaData,
      [name]: value
    });
  };
  
  const handleHospedeChange = (e) => {
    const { name, value } = e.target;
    
    // Clear the specific error when the field is edited
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
    
    setHospede({
      ...hospede,
      [name]: value
    });
  };
  
  const handleDateChange = (date, fieldName) => {
    setReservaData({
      ...reservaData,
      [fieldName]: date
    });
    
    // Atualizar lista de quartos disponíveis
    if (fieldName === 'dataChegada' || fieldName === 'dataSaida') {
      fetchQuartosDisponiveis();
    }
  };
  
  const handleDateNascimentoChange = (date) => {
    setHospede({
      ...hospede,
      dataNascimento: date
    });
  };
  
  const handleSubmit = async () => {
    try {
      setIsLoading(true);
      
      // Prepare reservation data
      const reservaSubmitData = {
        quarto: parseInt(reservaData.quarto),
        hospede: {
          nome: hospede.nome,
          sobrenome: hospede.sobrenome,
          email: hospede.email || null,
          telefone: hospede.telefone || null,
          data_nascimento: hospede.dataNascimento ? format(hospede.dataNascimento, 'yyyy-MM-dd') : null,
          tipo_documento: hospede.tipoDocumento,
          numero_documento: hospede.numeroDocumento
        },
        data_chegada: format(reservaData.dataChegada, 'yyyy-MM-dd'),
        data_saida: format(reservaData.dataSaida, 'yyyy-MM-dd'),
        num_adultos: parseInt(reservaData.numAdultos),
        num_criancas: parseInt(reservaData.numCriancas),
        valor_diaria: parseFloat(reservaData.valorDiaria),
        observacoes: reservaData.observacoes || ''
      };
      
      const response = await api.post('/reservas/', reservaSubmitData);
      
      showSnackbar('Reserva criada com sucesso!', 'success');
      
      // Reset form data
      setReservaData({
        dataChegada: new Date(),
        dataSaida: addDays(new Date(), 1),
        quarto: '',
        valorDiaria: '',
        numAdultos: 1,
        numCriancas: 0,
        observacoes: ''
      });
      
      setHospede({
        nome: '',
        sobrenome: '',
        email: '',
        telefone: '',
        dataNascimento: null,
        tipoDocumento: 'cpf',
        numeroDocumento: ''
      });
      
      // Navegar para a lista de reservas
      setTimeout(() => {
        navigate('/reservas/lista');
      }, 2000);
      
    } catch (error) {
      console.error('Erro ao criar reserva:', error);
      showSnackbar(
        error.response?.data?.detail || 'Erro ao criar a reserva. Verifique os dados e tente novamente.',
        'error'
      );
    } finally {
      setIsLoading(false);
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
  
  // Componente de resumo da reserva
  const ReservaSummary = () => (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Resumo da Reserva
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" color="text.secondary">
              Check-in
            </Typography>
            <Typography variant="body1">
              {format(reservaData.dataChegada, 'dd/MM/yyyy', { locale: ptBR })}
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" color="text.secondary">
              Check-out
            </Typography>
            <Typography variant="body1">
              {format(reservaData.dataSaida, 'dd/MM/yyyy', { locale: ptBR })}
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" color="text.secondary">
              Quarto
            </Typography>
            <Typography variant="body1">
              {quartoSelecionado?.nome} - {quartoSelecionado?.tipo_display}
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" color="text.secondary">
              Hóspedes
            </Typography>
            <Typography variant="body1">
              {reservaData.numAdultos} {reservaData.numAdultos > 1 ? 'adultos' : 'adulto'}
              {reservaData.numCriancas > 0 ? `, ${reservaData.numCriancas} ${reservaData.numCriancas > 1 ? 'crianças' : 'criança'}` : ''}
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" color="text.secondary">
              Valor da diária
            </Typography>
            <Typography variant="body1">
              {formatCurrency(reservaData.valorDiaria)}
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" color="text.secondary">
              Estadia
            </Typography>
            <Typography variant="body1">
              {numDias} {numDias > 1 ? 'diárias' : 'diária'}
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="body2" color="text.secondary">
              Observações
            </Typography>
            <Typography variant="body1">
              {reservaData.observacoes || 'Nenhuma observação'}
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <Divider sx={{ my: 1 }}/>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
              <Typography variant="h6">Total</Typography>
              <Typography variant="h6" color="primary">
                {formatCurrency(valorTotal)}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
  
  // Componente de resumo do hóspede
  const HospedeSummary = () => (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Dados do Hóspede
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={12}>
            <Typography variant="body2" color="text.secondary">
              Nome Completo
            </Typography>
            <Typography variant="body1">
              {hospede.nome} {hospede.sobrenome}
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" color="text.secondary">
              E-mail
            </Typography>
            <Typography variant="body1">
              {hospede.email || 'Não informado'}
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" color="text.secondary">
              Telefone
            </Typography>
            <Typography variant="body1">
              {hospede.telefone || 'Não informado'}
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" color="text.secondary">
              Data de Nascimento
            </Typography>
            <Typography variant="body1">
              {hospede.dataNascimento 
                ? format(hospede.dataNascimento, 'dd/MM/yyyy', { locale: ptBR }) 
                : 'Não informado'}
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" color="text.secondary">
              Documento
            </Typography>
            <Typography variant="body1">
              {DOCUMENTO_TYPES.find(d => d.value === hospede.tipoDocumento)?.label}: {hospede.numeroDocumento}
            </Typography>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
  
  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3 }}>
        <HotelIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
        Nova Reserva
      </Typography>
      
      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        <Step>
          <StepLabel>Dados da Reserva</StepLabel>
        </Step>
        <Step>
          <StepLabel>Dados do Hóspede</StepLabel>
        </Step>
        <Step>
          <StepLabel>Confirmação</StepLabel>
        </Step>
      </Stepper>
      
      <Paper sx={{ p: 3 }}>
        {activeStep === 0 && (
          // Dados da Reserva
          <>
            <Typography variant="h6" gutterBottom>
              <ReceiptIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Dados da Reserva
            </Typography>
            <Divider sx={{ mb: 3 }} />
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <DatePicker
                  label="Data de Chegada"
                  value={reservaData.dataChegada}
                  onChange={(date) => handleDateChange(date, 'dataChegada')}
                  disablePast
                  format="dd/MM/yyyy"
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      error: !!errors.dataChegada,
                      helperText: errors.dataChegada
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <DatePicker
                  label="Data de Saída"
                  value={reservaData.dataSaida}
                  onChange={(date) => handleDateChange(date, 'dataSaida')}
                  disablePast
                  format="dd/MM/yyyy"
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      error: !!errors.dataSaida,
                      helperText: errors.dataSaida
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  select
                  label="Quarto"
                  name="quarto"
                  value={reservaData.quarto}
                  onChange={handleInputChange}
                  fullWidth
                  required
                  error={!!errors.quarto}
                  helperText={errors.quarto}
                  disabled={isLoading}
                >
                 <MenuItem value="">Selecione um quarto</MenuItem>
                {Array.isArray(quartos) ? quartos.map((quarto) => (
                <MenuItem key={quarto.id} value={quarto.id}>
                    {quarto.nome} - {quarto.tipo_display} (Capacidade: {quarto.capacidade_adultos} adultos, {quarto.capacidade_criancas} crianças)
                </MenuItem>
                )) : null}
                </TextField>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Valor da Diária (R$)"
                  name="valorDiaria"
                  type="number"
                  value={reservaData.valorDiaria}
                  onChange={handleInputChange}
                  fullWidth
                  required
                  error={!!errors.valorDiaria}
                  helperText={errors.valorDiaria}
                  InputProps={{
                    inputProps: { min: 0, step: '0.01' }
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Número de Adultos"
                  name="numAdultos"
                  type="number"
                  value={reservaData.numAdultos}
                  onChange={handleInputChange}
                  fullWidth
                  required
                  error={!!errors.numAdultos}
                  helperText={errors.numAdultos}
                  InputProps={{
                    inputProps: { min: 1 }
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Número de Crianças"
                  name="numCriancas"
                  type="number"
                  value={reservaData.numCriancas}
                  onChange={handleInputChange}
                  fullWidth
                  error={!!errors.numCriancas}
                  helperText={errors.numCriancas}
                  InputProps={{
                    inputProps: { min: 0 }
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Observações"
                  name="observacoes"
                  multiline
                  rows={3}
                  value={reservaData.observacoes}
                  onChange={handleInputChange}
                  fullWidth
                />
              </Grid>
            </Grid>
            
            {quartoSelecionado && (
              <Box sx={{ mt: 3, bgcolor: 'grey.50', p: 2, borderRadius: 1 }}>
                <Typography variant="subtitle1" fontWeight="bold">
                  Resumo:
                </Typography>
                <Typography variant="body2">
                  {numDias} {numDias > 1 ? 'diárias' : 'diária'} x {formatCurrency(reservaData.valorDiaria)} = {formatCurrency(valorTotal)}
                </Typography>
              </Box>
            )}
          </>
        )}
        
        {activeStep === 1 && (
          // Dados do Hóspede
          <>
            <Typography variant="h6" gutterBottom>
              <PersonIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Dados do Hóspede
            </Typography>
            <Divider sx={{ mb: 3 }} />
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Nome"
                  name="nome"
                  value={hospede.nome}
                  onChange={handleHospedeChange}
                  fullWidth
                  required
                  error={!!errors.nome}
                  helperText={errors.nome}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Sobrenome"
                  name="sobrenome"
                  value={hospede.sobrenome}
                  onChange={handleHospedeChange}
                  fullWidth
                  required
                  error={!!errors.sobrenome}
                  helperText={errors.sobrenome}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="E-mail"
                  name="email"
                  type="email"
                  value={hospede.email}
                  onChange={handleHospedeChange}
                  fullWidth
                  error={!!errors.email}
                  helperText={errors.email}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Telefone"
                  name="telefone"
                  value={hospede.telefone}
                  onChange={handleHospedeChange}
                  fullWidth
                  error={!!errors.telefone}
                  helperText={errors.telefone}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <DatePicker
                  label="Data de Nascimento"
                  value={hospede.dataNascimento}
                  onChange={handleDateNascimentoChange}
                  disableFuture
                  format="dd/MM/yyyy"
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      error: !!errors.dataNascimento,
                      helperText: errors.dataNascimento
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  select
                  label="Tipo de Documento"
                  name="tipoDocumento"
                  value={hospede.tipoDocumento}
                  onChange={handleHospedeChange}
                  fullWidth
                  required
                >
                  {DOCUMENTO_TYPES.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  label="Número do Documento"
                  name="numeroDocumento"
                  value={hospede.numeroDocumento}
                  onChange={handleHospedeChange}
                  fullWidth
                  required
                  error={!!errors.numeroDocumento}
                  helperText={errors.numeroDocumento}
                />
              </Grid>
            </Grid>
          </>
        )}
        
        {activeStep === 2 && (
          // Confirmação
          <>
            <Typography variant="h6" gutterBottom>
              Confirmação da Reserva
            </Typography>
            <Divider sx={{ mb: 3 }} />
            
            <ReservaSummary />
            <HospedeSummary />
            
            <Alert severity="info" sx={{ mb: 3 }}>
              Verifique todos os dados da reserva antes de confirmar.
            </Alert>
          </>
        )}
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
          <Button
            onClick={activeStep === 0 ? () => navigate('/reservas/lista') : handleBack}
            disabled={isLoading}
          >
            {activeStep === 0 ? 'Cancelar' : 'Voltar'}
          </Button>
          
          <Button
            variant="contained"
            onClick={activeStep === 2 ? handleSubmit : handleNext}
            disabled={isLoading}
            startIcon={activeStep === 2 ? <SaveIcon /> : null}
          >
            {isLoading ? (
              <CircularProgress size={24} color="inherit" />
            ) : activeStep === 2 ? (
              'Confirmar Reserva'
            ) : (
              'Avançar'
            )}
          </Button>
        </Box>
      </Paper>
      
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

export default NovaReservaPage;