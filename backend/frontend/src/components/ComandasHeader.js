import React from 'react';
import {
  Paper, Button, Typography, TextField, MenuItem, Box,
  Chip, FormControlLabel, Checkbox, InputLabel, FormControl, 
  Select, IconButton, Divider
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';


const ROOM_OPTIONS = [
  'AML', 'AMS', 'AZL', 'AZS', 'VDL', 'VDS', 'RXL', 'RXS'
];

const PAYMENT_METHOD = [
  'Pix','Débito','Crédito','Crédito parcelado','Dinheiro'
]

const STATUS_OPTIONS = [
  { value: 'aberto', label: 'Aberto' },
  { value: 'pago', label: 'Pago' },
  { value: 'fechado', label: 'Fechado' }
];

const CUSTOMER_TYPE = [
  { value: 'funcionario', label: 'Funcionário' },
  { value: 'cliente', label: 'Cliente' },
  { value: 'hospede', label: 'Hóspede' }
];

// Helper function to generate code from name and room
const generateCode = (name, room) => {
  if (!name || !room) return room;
  const initials = name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase();
  return `${room}${initials}`;
};

const FilterBar = ({
  selectedStatuses,
  handleStatusFilter,
  selectedCustomerTypes,
  handleCustomerTypeFilter,
  searchQuarto,
  setSearchQuarto
}) => {
  return (
    <Paper sx={{ 
      p: 2, 
      mt: 2, 
      mb: 3,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {STATUS_OPTIONS.map(status => (
            <Chip
              key={status.value}
              label={status.label}
              onClick={() => handleStatusFilter(status.value)}
              color={selectedStatuses.includes(status.value) ? "primary" : "default"}
              variant={selectedStatuses.includes(status.value) ? "filled" : "outlined"}
              size="small"
            />
          ))}
        </Box>

        <Divider orientation="vertical" flexItem />

        <Box sx={{ display: 'flex', gap: 1 }}>
          {CUSTOMER_TYPE.map(type => (
            <Chip
              key={type.value}
              label={type.label}
              onClick={() => handleCustomerTypeFilter(type.value)}
              color={selectedCustomerTypes.includes(type.value) ? "primary" : "default"}
              variant={selectedCustomerTypes.includes(type.value) ? "filled" : "outlined"}
              size="small"
            />
          ))}
        </Box>
      </Box>

      <TextField
        placeholder="Buscar..."
        value={searchQuarto}
        onChange={(e) => setSearchQuarto(e.target.value)}
        size="small"
        sx={{ 
          width: '250px',
          bgcolor: 'grey.50',
          '& .MuiOutlinedInput-root': {
            '& fieldset': {
              borderColor: 'grey.200',
            },
          },
        }}
        InputProps={{
          endAdornment: <SearchIcon sx={{ color: 'action.active' }} />
        }}
      />
    </Paper>
  );
};

const ComandasHeader = ({
  selectedComanda,
  isEditing,
  editedData,
  setEditedData,
  handleStartEdit,
  handleSaveEdit,
  handleCancelEdit,
  paymentAmount,
  setPaymentAmount,
  paymentMethod,
  setPaymentMethod,
  handleRegisterPayment,
  formatMoney,
  novaComanda,
  setNovaComanda,
  handleCreateComanda,
  searchQuarto,
  setSearchQuarto,
  selectedStatuses,
  handleStatusFilter,
  selectedCustomerTypes,
  handleCustomerTypeFilter
}) => {
  return (
    <>
      <Grid container width={'100%'} spacing={3} sx={{ mb: 5, mt: 0, justifyContent:'space-between' }}>

        {/* Selected Comanda - 70% width */}
        <Grid width="65%">
          <Paper sx={{ height: '100%', opacity: selectedComanda ? 1 : 0.5, p: 2 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              {isEditing ? (
                
                <Box sx={{ width: '100%', display: 'flex', gap: 2, alignItems: 'center' }}>
                  <TextField
                    label="Nome do Cliente"
                    value={editedData.nome_cliente}
                    onChange={(e) => setEditedData({ ...editedData, nome_cliente: e.target.value })}
                    size="small"
                    sx={{ flex: 1 }}
                  />
                  <TextField
                    select
                    label="Quarto"
                    value={editedData.quarto}
                    onChange={(e) => setEditedData({ ...editedData, quarto: e.target.value })}
                    size="small"
                    sx={{ width: '100px' }}
                  >
                    {ROOM_OPTIONS.map(room => (
                      <MenuItem key={room} value={room}>{room}</MenuItem>
                    ))}
                  </TextField>
                  <FormControl size="small" sx={{ width: '120px' }}>
                    <InputLabel>Tipo</InputLabel>
                    <Select
                      value={editedData.tipo_cliente}
                      onChange={(e) => setEditedData(prev => ({
                        ...prev,
                        tipo_cliente: e.target.value
                      }))}
                      label="Tipo"
                    >
                      {CUSTOMER_TYPE.map(type => (
                        <MenuItem key={type.value} value={type.value}>{type.label}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <IconButton onClick={handleSaveEdit} size="small" color="primary">
                      <SaveIcon fontSize="small" />
                    </IconButton>
                    <IconButton onClick={handleCancelEdit} size="small" color="error">
                      <CancelIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
                
              ) : (

                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%', justifyContent:'space-between'}}>

                    {selectedComanda ? (
                      <>
                        <Box>
                        <Typography variant="h6">{selectedComanda?.quarto}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {selectedComanda?.nome_cliente || 'Sem nome'}
                        </Typography>
                        </Box>
                        <Chip 
                          label={selectedComanda?.tipo_cliente?.charAt(0).toUpperCase() + selectedComanda?.tipo_cliente?.slice(1)}
                          size="small"
                          color={selectedComanda?.tipo_cliente === 'funcionario' ? "info" : "default"}
                        />
                      </>
                    ) : (
                      <>
                        <Box>
                        <Typography variant="h6">Selecione uma comanda</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Sem nome
                        </Typography>
                        </Box>
                        {/* <Chip 
                          label={selectedComanda?.tipo_cliente?.charAt(0).toUpperCase() + selectedComanda?.tipo_cliente?.slice(1)}
                          size="small"
                          color={selectedComanda?.tipo_cliente === 'funcionario' ? "info" : "default"}
                        /> */}
                      </>
                    )}
                  </Box>
                  <IconButton onClick={() => {
                    if (selectedComanda) {
                      handleStartEdit();
                      setEditedData({
                        nome_cliente: selectedComanda.nome_cliente || '',
                        quarto: selectedComanda.quarto || '',
                        tipo_cliente: selectedComanda.tipo_cliente || 'cliente'
                      });
                    }
                  }} disabled={!selectedComanda}>
                    <EditIcon />
                  </IconButton>
                </Box>
              )}
            </Box>

              <Box sx={{ flex: 1 }} />

              <Box sx={{ borderTop: 1, borderColor: 'divider', pt: 2 }}>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                  <TextField
                    label="Valor do Pagamento"
                    type="number"
                    size="small"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    sx={{ width: '150px' }}
                    InputProps={{
                      startAdornment: <Box sx={{ mr: 1 }}>R$</Box>,
                    }}
                  />
                  <FormControl size="small" sx={{ width: '200px' }}>
                    <InputLabel>Forma de pagamento</InputLabel>
                    <Select
                      value={paymentMethod}
                      label="Forma de pagamento"
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    >
                      {PAYMENT_METHOD.map(method => (
                        <MenuItem key={method} value={method}>{method}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <Button
                    variant="contained"
                    onClick={handleRegisterPayment}
                    disabled={!paymentAmount || Number(paymentAmount) <= 0}
                  >
                    Registrar
                  </Button>
                  <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                    Total: {formatMoney(selectedComanda?.total || 0)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Pago: {formatMoney(selectedComanda?.total_pago || 0)}
                  </Typography>
                  <Typography variant="h6" color={selectedComanda?.saldo > 0 ? "error" : "success"} sx={{ ml: 'auto' }}>
                    Saldo: {formatMoney(selectedComanda?.saldo || 0)}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* New Comanda - 30% width */}
        <Grid width={'30%'}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ flex: 1 }}>
                Nova Comanda
              </Typography>
              <FormControl size="small" sx={{ width: '120px' }}>
                <InputLabel>Tipo</InputLabel>
                <Select
                  value={novaComanda.tipo_cliente || 'hospede'}
                  onChange={(e) => setNovaComanda(prev => ({
                    ...prev,
                    tipo_cliente: e.target.value,
                    isBusinessWorker: e.target.value === 'funcionario'
                  }))}
                  label="Tipo"
                  required
                >
                  {CUSTOMER_TYPE.map(type => (
                    <MenuItem key={type.value} value={type.value}>{type.label}</MenuItem>
                  ))}                
                </Select>
              </FormControl>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                fullWidth
                label="Nome do Cliente"
                value={novaComanda.nome || ''}
                onChange={(e) => {
                  const newNome = e.target.value;
                  setNovaComanda(prev => ({
                    ...prev,
                    nome: newNome,
                    code: generateCode(newNome, prev.quarto)
                  }));
                }}
                size="small"
              />

              <FormControl fullWidth size="small">
                <InputLabel>Quarto</InputLabel>
                <Select
                  value={novaComanda.quarto}
                  onChange={(e) => {
                    const newQuarto = e.target.value;
                    setNovaComanda(prev => ({
                      ...prev,
                      quarto: newQuarto,
                      code: generateCode(prev.nome, newQuarto)
                    }));
                  }}
                  label="Quarto"
                >
                  {ROOM_OPTIONS.map(room => (
                    <MenuItem key={room} value={room}>{room}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              {novaComanda.code && (
                <Typography variant="caption" color="text.secondary">
                  Código: {novaComanda.code}
                </Typography>
              )}

              <Button 
                variant="contained" 
                fullWidth 
                onClick={handleCreateComanda}
                sx={{ mt: 'auto' }}
              >
                Criar Nova Comanda
              </Button>
            </Box>
          </Paper>
        </Grid>

      </Grid>

      <FilterBar
        selectedStatuses={selectedStatuses}
        handleStatusFilter={handleStatusFilter}
        selectedCustomerTypes={selectedCustomerTypes}
        handleCustomerTypeFilter={handleCustomerTypeFilter}
        searchQuarto={searchQuarto}
        setSearchQuarto={setSearchQuarto}
      />
    </>
  );
};

export default ComandasHeader;