import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Button,
  TextField,
  MenuItem,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Snackbar,
  Alert,
  CircularProgress,
  Divider,
  Tooltip,
  Card,
  CardContent,
  Grid
} from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import HotelIcon from '@mui/icons-material/Hotel';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import KingBedIcon from '@mui/icons-material/KingBed';
import AcUnitIcon from '@mui/icons-material/AcUnit';
import SquareFootIcon from '@mui/icons-material/SquareFoot';
import RoomDialog from '../../components/RoomDialog';
import api from '../../services/api';

const SettingsPage = () => {
  const [tabValue, setTabValue] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [openRoomDialog, setOpenRoomDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  
  // Room type/class display maps
  const ROOM_TYPES = {
    'suite_casal': 'Suíte Casal',
    'suite_duplo': 'Suíte Duplo ou Casal',
    'suite_quadruplo': 'Suíte Quádruplo'
  };
  
  const ROOM_CLASSES = {
    'luxo_terreo': 'Luxo Térreo',
    'luxo_superior': 'Luxo Superior',
    'padrao': 'Padrão'
  };
  
  useEffect(() => {
    fetchRooms();
  }, []);
  
  const fetchRooms = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/quartos/');
      setRooms(response);
    } catch (error) {
      console.error('Erro ao buscar quartos:', error);
      showSnackbar('Erro ao carregar quartos', 'error');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  const handleOpenRoomDialog = (room = null) => {
    setSelectedRoom(room);
    setOpenRoomDialog(true);
  };
  
  const handleCloseRoomDialog = () => {
    setOpenRoomDialog(false);
  };
  
  const handleOpenDeleteDialog = (room) => {
    setSelectedRoom(room);
    setOpenDeleteDialog(true);
  };
  
  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
  };
  
  const handleSaveRoom = async (roomData) => {
    setIsLoading(true);
    try {
      // Log the data being sent to help with debugging
      console.log('Sending room data:', roomData);
      
      // Convert data to API format - simplify this structure
      const formattedRoomData = {
        nome: roomData.nome, 
        tipo: roomData.tipo || 'padrao',
        capacidade_adultos: parseInt(roomData.capacidade_maxima) || 2,
        capacidade_criancas: parseInt(roomData.num_criancas) || 0,
        valor_diaria_padrao: parseFloat(roomData.valor_diaria_padrao) || 0,
        descricao: JSON.stringify({
          classe_quarto: roomData.classe,
          tamanho: roomData.tamanho,
          camas: roomData.camas,
          tem_vista: roomData.tem_vista,
          tipo_banheiro: roomData.tipo_banheiro,
          amenities: roomData.amenities
        }),
        status: 'disponivel'
      };
      
      // Also log the formatted data
      console.log('Formatted room data for API:', formattedRoomData);
      
      if (selectedRoom) {
        // Update existing room
        const response = await api.put(`/quartos/${selectedRoom.id}/`, formattedRoomData);
        console.log('Update response:', response);
        showSnackbar('Quarto atualizado com sucesso', 'success');
      } else {
        // Create new room
        const response = await api.post('/quartos/', formattedRoomData);
        console.log('Create response:', response);
        showSnackbar('Quarto criado com sucesso', 'success');
      }
      
      handleCloseRoomDialog();
      fetchRooms();
    } catch (error) {
      console.error('Erro ao salvar quarto:', error);
      console.error('Response data:', error.response?.data);
      
      if (error.response?.status === 400) {
        showSnackbar(`Erro de validação: ${JSON.stringify(error.response.data)}`, 'error');
      } else {
        showSnackbar(`Erro ao salvar quarto: ${error.message}`, 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDeleteRoom = async () => {
    if (!selectedRoom) return;
    
    setIsLoading(true);
    try {
      await api.delete(`/quartos/${selectedRoom.id}/`);
      showSnackbar('Quarto excluído com sucesso', 'success');
      handleCloseDeleteDialog();
      fetchRooms();
    } catch (error) {
      console.error('Erro ao excluir quarto:', error);
      
      if (error.response?.status === 400) {
        showSnackbar(error.response.data.detail || 'Não é possível excluir este quarto', 'error');
      } else {
        showSnackbar('Erro ao excluir quarto', 'error');
      }
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
  
  // Parse metadata from room description if available
  const parseRoomMetadata = (room) => {
    try {
      if (room.descricao && room.descricao.includes('{')) {
        return JSON.parse(room.descricao);
      }
    } catch (e) {
      console.error('Error parsing room metadata:', e);
    }
    return null;
  };
  
  // Extract room type and class for display
  const getRoomTypeDisplay = (room) => {
    const metadata = parseRoomMetadata(room);
    
    if (metadata && metadata.tipo_quarto) {
      return ROOM_TYPES[metadata.tipo_quarto] || room.tipo_display;
    }
    
    return room.tipo_display;
  };
  
  const getRoomClassDisplay = (room) => {
    const metadata = parseRoomMetadata(room);
    
    if (metadata && metadata.classe_quarto) {
      return ROOM_CLASSES[metadata.classe_quarto] || '';
    }
    
    return '';
  };
  
  // Get room size from metadata
  const getRoomSize = (room) => {
    const metadata = parseRoomMetadata(room);
    
    if (metadata && metadata.tamanho) {
      return `${metadata.tamanho} m²`;
    }
    
    return 'N/D';
  };
  
  // Get room amenities
  const hasAirConditioning = (room) => {
    const metadata = parseRoomMetadata(room);
    
    if (metadata && metadata.amenities && metadata.amenities.ar_condicionado) {
      return true;
    }
    
    return false;
  };
  
  // Get bed information
  const getBedInfo = (room) => {
    const metadata = parseRoomMetadata(room);
    
    if (metadata && metadata.camas && metadata.camas.length > 0) {
      return metadata.camas.map(cama => 
        `${cama.quantidade}× ${cama.tipo === 'queen' ? 'Queen' : 
          cama.tipo === 'casal' ? 'Casal' :
          cama.tipo === 'beliche' ? 'Beliche' : 'Solteiro'}`
      ).join(', ');
    }
    
    return 'N/D';
  };
  
  // Prepare room data for edit dialog
  const prepareRoomForEdit = (room) => {
    const metadata = parseRoomMetadata(room);
    
    if (metadata) {
      return {
        ...room,
        ...metadata
      };
    }
    
    // Default values if metadata not available
    return {
      id: room.id,
      nome: room.nome,
      tipo: 'suite_casal',
      classe: room.tipo === 'padrao' ? 'padrao' : (room.tipo === 'luxo' ? 'luxo_terreo' : 'luxo_superior'),
      quantidade: 1,
      valor_diaria_padrao: room.valor_diaria_padrao,
      descricao: room.descricao?.replace(/{.*}/, '').trim() || '',
      status: room.status,
      capacidade_maxima: room.capacidade_adultos,
      tipo_banheiro: 'privativo',
      recursos_banheiro: 'apenas_chuveiro',
      tamanho: '',
      tem_vista: false,
      espaco_externo: 'nenhum',
      amenities: {
        produtos_toalete: false,
        sabonete: false,
        xampu: false,
        papel_higienico: false,
        toalhas: false,
        secador_cabelo: false,
        ar_condicionado: false,
      },
      camas: [{ tipo: 'casal', quantidade: 1 }]
    };
  };
  
  // Render the room management tab
  const renderRoomsTab = () => {
    if (isLoading && rooms.length === 0) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
          <CircularProgress size={48} />
          <Typography variant="h6" sx={{ ml: 2 }}>
            Carregando quartos...
          </Typography>
        </Box>
      );
    }
    
    return (
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h6">
            <HotelIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Gerenciar Quartos
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenRoomDialog()}
          >
            Novo Quarto
          </Button>
        </Box>
        
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: 'grey.100' }}>
                <TableCell>Nome do Quarto</TableCell>
                <TableCell>Tipo / Classe</TableCell>
                <TableCell>Camas</TableCell>
                <TableCell>Capacidade</TableCell>
                <TableCell>Tamanho</TableCell>
                <TableCell>Diária Padrão</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="center">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {Array.isArray(rooms) && rooms.length > 0 ? (
                rooms.map((room) => (
                  <TableRow key={room.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {room.nome}
                        {hasAirConditioning(room) && (
                          <Tooltip title="Ar Condicionado">
                            <AcUnitIcon fontSize="small" color="primary" sx={{ ml: 1 }} />
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{getRoomTypeDisplay(room)}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {getRoomClassDisplay(room)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <KingBedIcon fontSize="small" sx={{ mr: 1, opacity: 0.6 }} />
                        {getBedInfo(room)}
                      </Box>
                    </TableCell>
                    <TableCell>
                      {room.capacidade_adultos} {room.capacidade_adultos > 1 ? 'adultos' : 'adulto'}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <SquareFootIcon fontSize="small" sx={{ mr: 1, opacity: 0.6 }} />
                        {getRoomSize(room)}
                      </Box>
                    </TableCell>
                    <TableCell>{formatCurrency(room.valor_diaria_padrao)}</TableCell>
                    <TableCell>
                      <Tooltip title={room.status_display}>
                        <span
                          style={{
                            height: 12,
                            width: 12,
                            borderRadius: '50%',
                            backgroundColor: 
                              room.status === 'disponivel' 
                                ? '#4caf50' 
                                : room.status === 'ocupado' 
                                  ? '#2196f3' 
                                  : room.status === 'manutencao' 
                                    ? '#ff9800' 
                                    : '#f44336',
                            display: 'inline-block',
                            marginRight: 8
                          }}
                        />
                      </Tooltip>
                      {room.status_display}
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                        <Tooltip title="Editar">
                          <IconButton
                            color="primary"
                            onClick={() => handleOpenRoomDialog(prepareRoomForEdit(room))}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Excluir">
                          <IconButton
                            color="error"
                            onClick={() => handleOpenDeleteDialog(room)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                    <Typography variant="body1" color="text.secondary">
                      Nenhum quarto cadastrado
                    </Typography>
                    <Button
                      variant="outlined"
                      startIcon={<AddIcon />}
                      onClick={() => handleOpenRoomDialog()}
                      sx={{ mt: 2 }}
                    >
                      Adicionar Quarto
                    </Button>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    );
  };
  
  // Render the pricing management tab
  const renderPricingTab = () => {
    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          <AttachMoneyIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Configurações de Preços
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Preços por Tipo de Quarto
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <Box sx={{ mb: 2 }}>
                  <TextField
                    label="Diária Padrão - Suíte Casal"
                    type="number"
                    fullWidth
                    InputProps={{
                      startAdornment: <Box sx={{ mr: 1 }}>R$</Box>,
                      inputProps: { min: 0, step: '0.01' }
                    }}
                    sx={{ mb: 2 }}
                  />
                  
                  <TextField
                    label="Diária Padrão - Suíte Duplo ou Casal"
                    type="number"
                    fullWidth
                    InputProps={{
                      startAdornment: <Box sx={{ mr: 1 }}>R$</Box>,
                      inputProps: { min: 0, step: '0.01' }
                    }}
                    sx={{ mb: 2 }}
                  />
                  
                  <TextField
                    label="Diária Padrão - Suíte Quádruplo"
                    type="number"
                    fullWidth
                    InputProps={{
                      startAdornment: <Box sx={{ mr: 1 }}>R$</Box>,
                      inputProps: { min: 0, step: '0.01' }
                    }}
                  />
                </Box>
                
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  fullWidth
                >
                  Salvar Preços
                </Button>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Configurações de Preço Mínimo
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <Alert severity="info" sx={{ mb: 2 }}>
                  Defina o preço mínimo aceitável para quartos. Reservas abaixo deste valor necessitarão de aprovação.
                </Alert>
                
                <Box sx={{ mb: 2 }}>
                  <TextField
                    label="Preço Mínimo - Luxo Térreo"
                    type="number"
                    fullWidth
                    InputProps={{
                      startAdornment: <Box sx={{ mr: 1 }}>R$</Box>,
                      inputProps: { min: 0, step: '0.01' }
                    }}
                    sx={{ mb: 2 }}
                  />
                  
                  <TextField
                    label="Preço Mínimo - Luxo Superior"
                    type="number"
                    fullWidth
                    InputProps={{
                      startAdornment: <Box sx={{ mr: 1 }}>R$</Box>,
                      inputProps: { min: 0, step: '0.01' }
                    }}
                    sx={{ mb: 2 }}
                  />
                  
                  <TextField
                    label="Preço Mínimo - Padrão"
                    type="number"
                    fullWidth
                    InputProps={{
                      startAdornment: <Box sx={{ mr: 1 }}>R$</Box>,
                      inputProps: { min: 0, step: '0.01' }
                    }}
                  />
                </Box>
                
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  fullWidth
                >
                  Salvar Configurações
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    );
  };
  
  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3 }}>
        <SettingsIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
        Configurações do Sistema
      </Typography>
      
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab icon={<HotelIcon />} label="Quartos" iconPosition="start" />
          <Tab icon={<AttachMoneyIcon />} label="Preços" iconPosition="start" />
        </Tabs>
      </Paper>
      
      <Box sx={{ py: 2 }}>
        {tabValue === 0 && renderRoomsTab()}
        {tabValue === 1 && renderPricingTab()}
      </Box>
      
      {/* New Room Dialog */}
      <RoomDialog
        open={openRoomDialog}
        onClose={handleCloseRoomDialog}
        selectedRoom={selectedRoom}
        onSave={handleSaveRoom}
        isLoading={isLoading}
      />
      
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={openDeleteDialog}
        onClose={handleCloseDeleteDialog}
      >
        <DialogTitle>
          Confirmar Exclusão
        </DialogTitle>
        <DialogContent>
          <Typography>
            Tem certeza que deseja excluir o quarto {selectedRoom?.nome}?
          </Typography>
          <Alert severity="warning" sx={{ mt: 2 }}>
            Esta ação não poderá ser desfeita. Quarto com reservas associadas não podem ser excluídos.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteRoom}
            disabled={isLoading}
          >
            {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Excluir'}
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

export default SettingsPage;