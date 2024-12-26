import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  Box,
  IconButton
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

export default function ComandaDetails({ comanda, open, onClose }) {
  const formatMoney = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(Number(value) || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">
            Detalhes da Comanda - Quarto {comanda?.quarto}
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box mb={3}>
          <Typography variant="body1" color="text.secondary" gutterBottom>
            Data/Hora: {formatDate(comanda?.data_hora)}
          </Typography>
          <Typography variant="body1" color="text.secondary" gutterBottom>
            Status: {comanda?.status.charAt(0).toUpperCase() + comanda?.status.slice(1)}
          </Typography>
        </Box>
        
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Item</TableCell>
              <TableCell align="center">Quantidade</TableCell>
              <TableCell align="right">Valor Unit.</TableCell>
              <TableCell align="right">Subtotal</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {comanda?.itens.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <Typography variant="body1">{item.item.nome}</Typography>
                  {item.observacao && (
                    <Typography variant="caption" color="text.secondary">
                      Obs: {item.observacao}
                    </Typography>
                  )}
                </TableCell>
                <TableCell align="center">{item.quantidade}</TableCell>
                <TableCell align="right">{formatMoney(item.item.preco)}</TableCell>
                <TableCell align="right">
                  {formatMoney(item.item.preco * item.quantidade)}
                </TableCell>
              </TableRow>
            ))}
            <TableRow>
              <TableCell colSpan={3} align="right">
                <Typography variant="subtitle1">Total:</Typography>
              </TableCell>
              <TableCell align="right">
                <Typography variant="subtitle1">
                  {formatMoney(comanda?.total)}
                </Typography>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </DialogContent>
    </Dialog>
  );
}