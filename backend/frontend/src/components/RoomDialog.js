import React, { useState } from 'react';
import Grid from '@mui/material/Grid2';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Typography,
  Divider,
  FormControl,
  FormLabel,
  FormGroup,
  FormControlLabel,
  Checkbox,
  RadioGroup,
  Radio,
  IconButton,
  Box,
  Chip,
  Paper,
  Tooltip,
  CircularProgress
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import KingBedIcon from '@mui/icons-material/KingBed';
import SingleBedIcon from '@mui/icons-material/SingleBed';
import BathtubIcon from '@mui/icons-material/Bathtub';
import ShowerIcon from '@mui/icons-material/Shower';
import WcIcon from '@mui/icons-material/Wc';
import AcUnitIcon from '@mui/icons-material/AcUnit';
import BalconyIcon from '@mui/icons-material/Balcony';
import LandscapeIcon from '@mui/icons-material/Landscape';
import SquareFootIcon from '@mui/icons-material/SquareFoot';

const RoomDialog = ({ 
  open, 
  onClose, 
  selectedRoom, 
  onSave, 
  isLoading 
}) => {
  // Bed types
  const BED_TYPES = [
    { value: 'queen', label: 'Queen', icon: <KingBedIcon /> },
    { value: 'casal', label: 'Casal', icon: <KingBedIcon /> },
    { value: 'beliche', label: 'Beliche', icon: <SingleBedIcon /> },
    { value: 'solteiro', label: 'Solteiro', icon: <SingleBedIcon /> }
  ];

  // Room types
  const ROOM_TYPES = [
    { value: 'suite_casal', label: 'Suíte Casal' },
    { value: 'suite_duplo', label: 'Suíte Duplo ou Casal' },
    { value: 'suite_quadruplo', label: 'Suíte Quádruplo' }
  ];

  // Room classes
  const ROOM_CLASSES = [
    { value: 'luxo_terreo', label: 'Luxo Térreo' },
    { value: 'luxo_superior', label: 'Luxo Superior' },
    { value: 'padrao', label: 'Padrão' }
  ];

  // Bathroom types
  const BATHROOM_TYPES = [
    { value: 'privativo', label: 'Banheiro Privativo' },
    { value: 'compartilhado', label: 'Banheiro Compartilhado' },
    { value: 'privativo_externo', label: 'Privativo fora do quarto' }
  ];

  // Bathroom features
  const BATHROOM_FEATURES = [
    { value: 'apenas_chuveiro', label: 'Apenas chuveiro' },
    { value: 'chuveiro_banheira', label: 'Chuveiro e banheira' },
    { value: 'apenas_banheira', label: 'Apenas banheira' }
  ];

  // External space types
  const EXTERNAL_SPACE_TYPES = [
    { value: 'varanda_coberta', label: 'Varanda coberta' },
    { value: 'varanda_descoberta', label: 'Varanda sem cobertura' },
    { value: 'patio', label: 'Pátio' },
    { value: 'jardim', label: 'Jardim privativo' },
    { value: 'nenhum', label: 'Nenhum' }
  ];

  // Initialize form state
  const [roomData, setRoomData] = useState(
    selectedRoom ? {
      nome: selectedRoom.nome || '',
      tipo: selectedRoom.tipo || 'suite_casal',
      classe: selectedRoom.classe || 'padrao',
      quantidade: selectedRoom.quantidade || 1,
      valor_diaria_padrao: selectedRoom.valor_diaria_padrao || '',
      descricao: selectedRoom.descricao || '',
      status: selectedRoom.status || 'disponivel',
      capacidade_maxima: selectedRoom.capacidade_maxima || 2,
      tipo_banheiro: selectedRoom.tipo_banheiro || 'privativo',
      recursos_banheiro: selectedRoom.recursos_banheiro || 'apenas_chuveiro',
      tamanho: selectedRoom.tamanho || '',
      tem_vista: selectedRoom.tem_vista || false,
      espaco_externo: selectedRoom.espaco_externo || 'nenhum',
      // Amenities
      amenities: selectedRoom.amenities || {
        produtos_toalete: false,
        sabonete: false,
        xampu: false,
        papel_higienico: false,
        toalhas: false,
        secador_cabelo: false,
        ar_condicionado: false,
      },
      // Initialize beds or provide default
      camas: selectedRoom.camas || [{ tipo: 'casal', quantidade: 1 }]
    } : {
      nome: '',
      tipo: 'suite_casal',
      classe: 'padrao',
      quantidade: 1,
      valor_diaria_padrao: '',
      descricao: '',
      status: 'disponivel',
      capacidade_maxima: 2,
      tipo_banheiro: 'privativo',
      recursos_banheiro: 'apenas_chuveiro',
      tamanho: '',
      tem_vista: false,
      espaco_externo: 'nenhum',
      // Amenities
      amenities: {
        produtos_toalete: false,
        sabonete: false,
        xampu: false,
        papel_higienico: false,
        toalhas: false,
        secador_cabelo: false,
        ar_condicionado: false,
      },
      // Default bed configuration
      camas: [{ tipo: 'casal', quantidade: 1 }]
    }
  );

  // Form errors
  const [errors, setErrors] = useState({});

  // Handle input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Clear error when field is edited
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
    
    setRoomData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle checkbox change for amenities
  const handleAmenityChange = (e) => {
    const { name, checked } = e.target;
    setRoomData(prev => ({
      ...prev,
      amenities: {
        ...prev.amenities,
        [name]: checked
      }
    }));
  };

  // Handle bed changes
  const handleBedChange = (index, field, value) => {
    const updatedBeds = [...roomData.camas];
    updatedBeds[index] = {
      ...updatedBeds[index],
      [field]: value
    };
    setRoomData(prev => ({
      ...prev,
      camas: updatedBeds
    }));
  };

  // Add a new bed type
  const addBedType = () => {
    setRoomData(prev => ({
      ...prev,
      camas: [...prev.camas, { tipo: 'solteiro', quantidade: 1 }]
    }));
  };

  // Remove a bed type
  const removeBedType = (index) => {
    if (roomData.camas.length > 1) {
      const updatedBeds = roomData.camas.filter((_, i) => i !== index);
      setRoomData(prev => ({
        ...prev,
        camas: updatedBeds
      }));
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};
    
    if (!roomData.nome.trim()) {
      newErrors.nome = 'Nome do quarto é obrigatório';
    }
    
    if (!roomData.valor_diaria_padrao) {
      newErrors.valor_diaria_padrao = 'Valor da diária é obrigatório';
    } else if (parseFloat(roomData.valor_diaria_padrao) <= 0) {
      newErrors.valor_diaria_padrao = 'Valor da diária deve ser maior que zero';
    }
    
    if (parseInt(roomData.capacidade_maxima) < 1) {
      newErrors.capacidade_maxima = 'Capacidade máxima deve ser pelo menos 1';
    }
    
    if (!roomData.tamanho) {
      newErrors.tamanho = 'Tamanho do quarto é obrigatório';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle save
  const handleSave = () => {
    if (validateForm()) {
      onSave(roomData);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      scroll="paper"
    >
      <DialogTitle>
        {selectedRoom ? 'Editar Quarto' : 'Novo Quarto'}
      </DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={3}>
          {/* Basic Information */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Informações Básicas
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              label="Nome do quarto"
              name="nome"
              value={roomData.nome}
              onChange={handleInputChange}
              fullWidth
              required
              error={!!errors.nome}
              helperText={errors.nome}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              select
              label="Tipo de quarto"
              name="tipo"
              value={roomData.tipo}
              onChange={handleInputChange}
              fullWidth
              required
            >
              {ROOM_TYPES.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              select
              label="Classe do quarto"
              name="classe"
              value={roomData.classe}
              onChange={handleInputChange}
              fullWidth
              required
            >
              {ROOM_CLASSES.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              label="Quantos desses quartos você tem?"
              name="quantidade"
              type="number"
              value={roomData.quantidade}
              onChange={handleInputChange}
              fullWidth
              required
              InputProps={{
                inputProps: { min: 1 }
              }}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              label="Valor da Diária Padrão (R$)"
              name="valor_diaria_padrao"
              type="number"
              value={roomData.valor_diaria_padrao}
              onChange={handleInputChange}
              fullWidth
              required
              error={!!errors.valor_diaria_padrao}
              helperText={errors.valor_diaria_padrao}
              InputProps={{
                inputProps: { min: 0, step: '0.01' }
              }}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              label="Tamanho do quarto (m²)"
              name="tamanho"
              type="number"
              value={roomData.tamanho}
              onChange={handleInputChange}
              fullWidth
              required
              error={!!errors.tamanho}
              helperText={errors.tamanho}
              InputProps={{
                inputProps: { min: 1 },
                startAdornment: <SquareFootIcon color="action" sx={{ mr: 1 }} />
              }}
            />
          </Grid>
          
          {/* Bed Configuration */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Configuração de Camas
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </Grid>
          
          {roomData.camas.map((cama, index) => (
            <Grid item xs={12} key={index}>
              <Paper 
                variant="outlined" 
                sx={{ 
                  p: 2, 
                  display: 'flex', 
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <Box sx={{ display: 'flex', gap: 2, flexGrow: 1, alignItems: 'center' }}>
                  <TextField
                    select
                    label="Tipo de Cama"
                    value={cama.tipo}
                    onChange={(e) => handleBedChange(index, 'tipo', e.target.value)}
                    sx={{ minWidth: 200 }}
                  >
                    {BED_TYPES.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          {option.icon}
                          <Box sx={{ ml: 1 }}>{option.label}</Box>
                        </Box>
                      </MenuItem>
                    ))}
                  </TextField>
                  
                  <Typography variant="body1" sx={{ fontWeight: 'medium', mr: 1 }}>
                    Quantidade:
                  </Typography>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <IconButton 
                      size="small"
                      onClick={() => handleBedChange(
                        index, 
                        'quantidade', 
                        Math.max(1, parseInt(cama.quantidade) - 1)
                      )}
                    >
                      <RemoveIcon />
                    </IconButton>
                    <Typography sx={{ mx: 1, minWidth: '20px', textAlign: 'center' }}>
                      {cama.quantidade}
                    </Typography>
                    <IconButton 
                      size="small"
                      onClick={() => handleBedChange(
                        index, 
                        'quantidade', 
                        parseInt(cama.quantidade) + 1
                      )}
                    >
                      <AddIcon />
                    </IconButton>
                  </Box>
                </Box>
                
                <Tooltip title="Remover tipo de cama">
                  <span>
                    <IconButton 
                      color="error" 
                      onClick={() => removeBedType(index)}
                      disabled={roomData.camas.length <= 1}
                    >
                      <DeleteOutlineIcon />
                    </IconButton>
                  </span>
                </Tooltip>
              </Paper>
            </Grid>
          ))}
          
          <Grid item xs={12}>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={addBedType}
            >
              Adicionar outro tipo de cama
            </Button>
          </Grid>
          
          {/* Room Capacity and Bathroom */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Capacidade e Banheiro
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              label="Capacidade máxima de pessoas"
              name="capacidade_maxima"
              type="number"
              value={roomData.capacidade_maxima}
              onChange={handleInputChange}
              fullWidth
              required
              error={!!errors.capacidade_maxima}
              helperText={errors.capacidade_maxima}
              InputProps={{
                inputProps: { min: 1 }
              }}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              select
              label="Tipo de Banheiro"
              name="tipo_banheiro"
              value={roomData.tipo_banheiro}
              onChange={handleInputChange}
              fullWidth
              required
              InputProps={{
                startAdornment: <WcIcon color="action" sx={{ mr: 1 }} />
              }}
            >
              {BATHROOM_TYPES.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              select
              label="Este quarto tem banheira ou chuveiro?"
              name="recursos_banheiro"
              value={roomData.recursos_banheiro}
              onChange={handleInputChange}
              fullWidth
              required
              InputProps={{
                startAdornment: roomData.recursos_banheiro.includes('banheira') ? 
                  <BathtubIcon color="action" sx={{ mr: 1 }} /> : 
                  <ShowerIcon color="action" sx={{ mr: 1 }} />
              }}
            >
              {BATHROOM_FEATURES.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              select
              label="Espaço externo"
              name="espaco_externo"
              value={roomData.espaco_externo}
              onChange={handleInputChange}
              fullWidth
              InputProps={{
                startAdornment: <BalconyIcon color="action" sx={{ mr: 1 }} />
              }}
            >
              {EXTERNAL_SPACE_TYPES.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <FormControl component="fieldset">
              <FormLabel component="legend">Este quarto tem vista?</FormLabel>
              <RadioGroup
                row
                name="tem_vista"
                value={roomData.tem_vista.toString()}
                onChange={(e) => 
                  setRoomData(prev => ({
                    ...prev,
                    tem_vista: e.target.value === 'true'
                  }))
                }
              >
                <FormControlLabel 
                  value="true" 
                  control={<Radio />} 
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <LandscapeIcon color="primary" sx={{ mr: 0.5 }} />
                      Sim
                    </Box>
                  } 
                />
                <FormControlLabel value="false" control={<Radio />} label="Não" />
              </RadioGroup>
            </FormControl>
          </Grid>
          
          {/* Amenities */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Comodidades e Itens Essenciais
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <FormControl component="fieldset">
              <FormLabel component="legend">Este quarto tem estes itens essenciais?</FormLabel>
              <FormGroup>
                <FormControlLabel
                  control={
                    <Checkbox 
                      checked={roomData.amenities.produtos_toalete}
                      onChange={handleAmenityChange}
                      name="produtos_toalete"
                    />
                  }
                  label="Produtos de toalete grátis"
                />
                <FormControlLabel
                  control={
                    <Checkbox 
                      checked={roomData.amenities.sabonete}
                      onChange={handleAmenityChange}
                      name="sabonete"
                    />
                  }
                  label="Sabonete"
                />
                <FormControlLabel
                  control={
                    <Checkbox 
                      checked={roomData.amenities.xampu}
                      onChange={handleAmenityChange}
                      name="xampu"
                    />
                  }
                  label="Xampu"
                />
                <FormControlLabel
                  control={
                    <Checkbox 
                      checked={roomData.amenities.papel_higienico}
                      onChange={handleAmenityChange}
                      name="papel_higienico"
                    />
                  }
                  label="Papel higiênico"
                />
              </FormGroup>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <FormControl component="fieldset">
              <FormLabel component="legend">Comodidades adicionais</FormLabel>
              <FormGroup>
                <FormControlLabel
                  control={
                    <Checkbox 
                      checked={roomData.amenities.toalhas}
                      onChange={handleAmenityChange}
                      name="toalhas"
                    />
                  }
                  label="Este quarto dispõe de toalhas"
                />
                <FormControlLabel
                  control={
                    <Checkbox 
                      checked={roomData.amenities.secador_cabelo}
                      onChange={handleAmenityChange}
                      name="secador_cabelo"
                    />
                  }
                  label="Secador de cabelo"
                />
                <FormControlLabel
                  control={
                    <Checkbox 
                      checked={roomData.amenities.ar_condicionado}
                      onChange={handleAmenityChange}
                      name="ar_condicionado"
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <AcUnitIcon fontSize="small" sx={{ mr: 1 }} />
                      Ar condicionado
                    </Box>
                  }
                />
              </FormGroup>
            </FormControl>
          </Grid>
          
          {/* Additional Information */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Informações Adicionais
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              label="Descrição do quarto"
              name="descricao"
              value={roomData.descricao}
              onChange={handleInputChange}
              fullWidth
              multiline
              rows={3}
              placeholder="Descreva características adicionais do quarto..."
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={isLoading}
        >
          {isLoading ? <CircularProgress size={24} /> : 'Salvar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RoomDialog;