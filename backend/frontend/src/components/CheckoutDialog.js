import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Typography, 
  Button, 
  TextField, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Box
} from '@mui/material';

const CheckoutDialog = ({ 
  open, 
  onClose, 
  selectedComanda, 
  comandasAbertas, 
  totalCarrinho, 
  formatMoney,
  onCheckout, 
  isBusinessWorker
}) => {
  const [comanda, setComanda] = useState(null);
  const [quarto, setQuarto] = useState('');
  const [nomeCliente, setNomeCliente] = useState('');
  const [observacao, setObservacao] = useState('');
  const [selectedComandaId, setSelectedComandaId] = useState('');
  
  useEffect(() => {
    // Update state when selectedComanda changes or when dialog opens
    if (selectedComanda) {
      setComanda(selectedComanda);
      setQuarto(selectedComanda.quarto || '');
      setNomeCliente(selectedComanda.nome_cliente || '');
      setSelectedComandaId(selectedComanda.id || '');
    } else {
      setComanda(null);
      setSelectedComandaId('');
      // Don't reset quarto if we're creating a new comanda
      if (!open) {
        setQuarto('');
        setNomeCliente('');
      }
    }
  }, [selectedComanda, open]);

  const handleComandaChange = (e) => {
    const comandaId = e.target.value;
    setSelectedComandaId(comandaId);
    
    if (comandaId) {
      const selectedCmd = comandasAbertas.find(c => c.id === comandaId);
      if (selectedCmd) {
        setQuarto(selectedCmd.quarto || '');
        setNomeCliente(selectedCmd.nome_cliente || '');
        setComanda(selectedCmd);
      }
    } else {
      setComanda(null);
      // Keep the quarto value for new comanda
    }
  };

  const handleSubmit = () => {
    onCheckout({
      comandaId: selectedComandaId || null,
      quarto: quarto,
      nomeCliente: nomeCliente,
      observacao: observacao,
      isBusinessWorker: isBusinessWorker
    });
    
    // Reset fields after submission
    if (!selectedComandaId) {
      setQuarto('');
      setNomeCliente('');
    }
    setObservacao('');
  };

  const isValid = selectedComandaId || quarto;

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>Finalizar Pedido</DialogTitle>
      <DialogContent>
        {/* Comanda Selection */}
        <FormControl fullWidth margin="normal">
          <InputLabel>Comanda</InputLabel>
          <Select
            value={selectedComandaId}
            onChange={handleComandaChange}
            label="Comanda"
          >
            <MenuItem value="">
              <em>Nova comanda</em>
            </MenuItem>
            {Array.isArray(comandasAbertas) && comandasAbertas.map((cmd) => (
              <MenuItem key={cmd?.id || 'default'} value={cmd?.id || ''}>
                Quarto {cmd?.quarto || ''} - {cmd?.nome_cliente || 'Sem nome'}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        
        {/* Show fields to create new comanda if none selected */}
        {!selectedComandaId && (
          <>
            <TextField
              fullWidth
              label="Número do Quarto"
              value={quarto}
              onChange={(e) => setQuarto(e.target.value)}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Nome do Cliente"
              value={nomeCliente}
              onChange={(e) => setNomeCliente(e.target.value)}
              margin="normal"
            />
          </>
        )}
        
        {/* Always show observação field */}
        <TextField
          fullWidth
          label="Observações"
          value={observacao}
          onChange={(e) => setObservacao(e.target.value)}
          multiline
          rows={3}
          margin="normal"
        />

        {/* Display selected comanda info */}
        {selectedComandaId && comanda && (
          <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
            <Typography variant="subtitle1" gutterBottom>
              Comanda selecionada:
            </Typography>
            <Typography variant="body1">
              Quarto: {comanda.quarto}
            </Typography>
            <Typography variant="body1">
              Cliente: {comanda.nome_cliente || 'Sem nome'}
            </Typography>
            {comanda.total > 0 && (
              <Typography variant="body1">
                Total atual: {formatMoney(comanda.total)}
              </Typography>
            )}
          </Box>
        )}

        <Typography variant="h6" sx={{ mt: 3 }}>
          Total do pedido: {formatMoney(totalCarrinho)}
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained"
          disabled={!isValid}
        >
          Confirmar Pedido
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CheckoutDialog;