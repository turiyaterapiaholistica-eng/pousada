// components/ComandasGrid.js
import React from 'react';
import { Grid, Card, CardContent, CardActions, Typography, Button, Box, Chip } from '@mui/material';

const STATUS_COLORS = {
  aberto: 'success',
  fechado: 'warning',
  pago: 'default'
};

const formatMoney = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(Number(value) || 0);
};

const ComandasGrid = ({ comandas, onSelectComanda, selectedComandaId, onOpenDetails }) => {
  return (
    <Grid container spacing={2}>
      {comandas.map((comanda) => (
        <Grid xs={12} sm={6} md={4} lg={3} key={comanda.id}>
          <Card 
            sx={{ 
              height: '100%',
              cursor: 'pointer',
              transition: 'transform 0.2s',
              '&:hover': {
                transform: 'scale(1.02)',
              },
              border: selectedComandaId === comanda.id ? '2px solid #1976d2' : 'none'
            }}
            onClick={() => onSelectComanda(comanda)}
          >
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quarto {comanda.quarto}
              </Typography>
              <Box display="flex" justifyContent="flex-end" gap={1} mb={2}>
                <Chip 
                  label={comanda.isBusinessWorker ? "Funcionário" : "Cliente"}
                  size="small"
                  color={comanda.isBusinessWorker ? "info" : "default"}
                />
                <Chip 
                  label={comanda.status.charAt(0).toUpperCase() + comanda.status.slice(1)}
                  color={STATUS_COLORS[comanda.status]}
                  size="small"
                />
              </Box>
              <Typography variant="body1" gutterBottom>
                Total: {formatMoney(comanda.total)}
              </Typography>
              <Typography variant="body1" gutterBottom>
                Pago: {formatMoney(comanda.total_pago)}
              </Typography>
              <Typography 
                variant="body1" 
                color={comanda.saldo > 0 ? "error" : "success"}
              >
                Saldo: {formatMoney(comanda.saldo)}
              </Typography>
            </CardContent>
            <CardActions>
              <Button
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenDetails(comanda);
                }}
              >
                Ver Detalhes
              </Button>
            </CardActions>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

export default ComandasGrid;