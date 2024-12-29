// components/ComandaDetails.js
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

  const getEffectivePrice = (item) => {
    if (comanda?.isBusinessWorker && item.preco_custo != null) {
      return item.preco_custo;
    }
    return item.preco;
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
          {comanda?.isBusinessWorker && (
            <Typography variant="body1" color="info.main" gutterBottom>
              Comanda de Funcionário
            </Typography>
          )}
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
            {comanda?.itens.map((item) => {
              const effectivePrice = getEffectivePrice(item.item);
              return (
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
                  <TableCell align="right">
                    {formatMoney(effectivePrice)}
                    {comanda?.isBusinessWorker && item.item.preco_custo && (
                      <Typography variant="caption" color="text.secondary" display="block">
                        Preço Funcionário
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="right">
                    {formatMoney(effectivePrice * item.quantidade)}
                  </TableCell>
                </TableRow>
              );
            })}
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
            {comanda?.total_pago > 0 && (
              <>
                <TableRow>
                  <TableCell colSpan={3} align="right">
                    <Typography variant="subtitle1">Total Pago:</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="subtitle1">
                      {formatMoney(comanda?.total_pago)}
                    </Typography>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell colSpan={3} align="right">
                    <Typography variant="subtitle1">Saldo:</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="subtitle1" color={comanda?.saldo > 0 ? "error.main" : "success.main"}>
                      {formatMoney(comanda?.saldo)}
                    </Typography>
                  </TableCell>
                </TableRow>
              </>
            )}
          </TableBody>
        </Table>
      </DialogContent>
    </Dialog>
  );
}