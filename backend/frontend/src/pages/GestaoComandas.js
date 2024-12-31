import React, { useState, useEffect } from 'react';
import {
  Paper, Button, Typography, TextField, MenuItem, Snackbar, Alert, Box,
  Chip, FormControlLabel, Checkbox, InputLabel, IconButton, FormControl, Select
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import api from '../services/api';
import ComandaDetails from '../components/ComandaDetails';
import ComandasGrid from '../components/ComandasGrid';
import ComandasHeader from '../components/ComandasHeader';


export default function GestaoComandas() {
  const [comandas, setComandas] = useState([]);
  const [filteredComandas, setFilteredComandas] = useState([]);
  const [openDetails, setOpenDetails] = useState(false);
  const [selectedComanda, setSelectedComanda] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [novaComanda, setNovaComanda] = useState({
    quarto: '',
    nome:'',
    status: 'aberto',
    isBusinessWorker: false,
    tipo_cliente:'hospede'
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState({
    nome: '',
    quarto: '',
    isBusinessWorker: false
  });
  const [detailsComanda, setDetailsComanda] = useState(null);  // New state for details
  const [searchQuarto, setSearchQuarto] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [selectedStatuses, setSelectedStatuses] = useState(['aberto', 'pago']);

  
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');


  // Tipos de cliente
  const [selectedCustomerTypes, setSelectedCustomerTypes] = useState(['funcionario', 'cliente', 'hospede']);




  useEffect(() => {
    fetchComandas();
  }, []);

  useEffect(() => {
    filterComandas();
  }, [comandas, searchQuarto, selectedStatuses, selectedCustomerTypes]);

  useEffect(() => {
    if (selectedComanda && isEditing) {
      handleCancelEdit();
    }
  }, [selectedComanda?.id]);

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
    
    // Filter by search text
    if (searchQuarto) {
      filtered = filtered.filter(comanda => 
        comanda.quarto?.toLowerCase().includes(searchQuarto.toLowerCase())
      );
    }
    
    // Filter by status
    if (selectedStatuses.length) {
      filtered = filtered.filter(comanda => selectedStatuses.includes(comanda.status));
    }
  
    // Filter by customer type
    if (selectedCustomerTypes.length) {
      filtered = filtered.filter(comanda => 
        selectedCustomerTypes.includes(comanda.tipo_cliente)
      );
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
      
      if (!novaComanda.nome) {
        showSnackbar('O nome do cliente é obrigatório', 'error');
        return;
      }
  
      const comandaData = {
        quarto: novaComanda.quarto,
        nome_cliente: novaComanda.nome,
        status: 'aberto',
        tipo_cliente: novaComanda.tipo_cliente,
        codigo: novaComanda.code, // Changed from code to codigo to match backend
        checkin_date: new Date(), // Required for guest type
        checkout_date: new Date(new Date().setDate(new Date().getDate() + 1)) // Set checkout to tomorrow
      };
  
      const response = await api.post('/consumacoes/', comandaData);
      showSnackbar('Comanda criada com sucesso!');
      await fetchComandas();
      
      // Reset form
      setNovaComanda({
        quarto: '',
        nome: '',
        status: 'aberto',
        tipo_cliente: 'hospede',
        code: ''
      });
      
    } catch (error) {
      console.error('Error creating comanda:', error);
      const errorMessage = error.response?.data?.detail || error.message || 'Erro ao criar comanda';
      showSnackbar(errorMessage, 'error');
    }
  };

  // const handleUpdateStatus = async (comandaId, newStatus) => {
  //   try {
  //     await api.patch(`/consumacoes/${comandaId}/`, { status: newStatus });
  //     showSnackbar('Status atualizado com sucesso!');
  //     fetchComandas();
  //   } catch (error) {
  //     showSnackbar('Erro ao atualizar status', 'error');
  //   }
  // };

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

  const handleStartEdit = () => {
    setIsEditing(true);
    setEditedData({
      nome: selectedComanda.nome,
      quarto: selectedComanda.quarto,
      isBusinessWorker: selectedComanda.isBusinessWorker
    });
  };

  const handleSaveEdit = async () => {
    try {
      await handleUpdateComanda({
        nome_cliente: editedData.nome_cliente,
        quarto: editedData.quarto,
        tipo_cliente: editedData.tipo_cliente
      });
      setIsEditing(false);
    } catch (error) {
      showSnackbar('Error updating comanda', 'error');
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedData({
      nome: selectedComanda.nome,
      quarto: selectedComanda.quarto,
      isBusinessWorker: selectedComanda.isBusinessWorker
    });
  };

  const handleStatusFilter = (status) => {
    setSelectedStatuses(prev => 
      prev.includes(status) 
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
  };

  const handleCustomerTypeFilter = (type) => {
    console.log("Filtering by type:", type);
    setSelectedCustomerTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h5" sx={{ mb: 3 }}>
        Gestão de Comandas
      </Typography>

      <Box sx={{ mb: 4 }}>
        <ComandasHeader
          selectedComanda={selectedComanda}
          isEditing={isEditing}
          editedData={editedData}
          setEditedData={setEditedData}
          handleStartEdit={handleStartEdit}
          handleSaveEdit={handleSaveEdit}
          handleCancelEdit={handleCancelEdit}
          paymentAmount={paymentAmount}
          setPaymentAmount={setPaymentAmount}
          paymentMethod={paymentMethod}
          setPaymentMethod={setPaymentMethod}
          handleRegisterPayment={handleRegisterPayment}
          formatMoney={formatMoney}
          novaComanda={novaComanda}
          setNovaComanda={setNovaComanda}
          handleCreateComanda={handleCreateComanda}
          searchQuarto={searchQuarto}
          setSearchQuarto={setSearchQuarto}
          selectedStatuses={selectedStatuses}
          handleStatusFilter={handleStatusFilter}
          selectedCustomerTypes={selectedCustomerTypes}
          handleCustomerTypeFilter={handleCustomerTypeFilter}
        />
      </Box>

      <Box sx={{ flex: 1 }}>
        <ComandasGrid
          comandas={filteredComandas}
          onSelectComanda={setSelectedComanda}
          selectedComandaId={selectedComanda?.id}
          onOpenDetails={handleOpenDetails}
        />
      </Box>

      <ComandaDetails
        comanda={detailsComanda}
        open={openDetails}
        onClose={handleCloseDetails}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}