// components/ComandasGrid.js
import React from 'react';
import { Card, CardContent, CardActions, Typography, Button, Box, Chip } from '@mui/material';
import Grid from '@mui/material/Grid2';

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
              height: '280px',
              cursor: 'pointer',
              transition: 'transform 0.2s',
              '&:hover': {
                transform: 'scale(1.02)',
              },
              border: selectedComandaId === comanda.id ? '2px solid #1976d2' : 'none',
              display: 'flex',
              flexDirection: 'column'
            }}
            onClick={() => onSelectComanda(comanda)}
          >
            <CardContent sx={{ flex: 1, pb: 1 }}>

              {/* Header Section */}
              <Box sx={{ mb: 7 }}>
                <Box display="flex" gap={1} alignItems="center">
                  <Typography variant="h6">
                    {comanda.quarto}
                  </Typography>
                  <Box>
                    <Chip 
                      label={comanda.tipo_cliente.charAt(0).toUpperCase() + comanda.tipo_cliente.slice(1)}
                      size="small"
                      color={comanda.tipo_cliente === 'funcionario' ? "info" : "default"}
                    />
                  </Box>
                  <Chip 
                    label={comanda.status.charAt(0).toUpperCase() + comanda.status.slice(1)}
                    color={STATUS_COLORS[comanda.status]}
                    size="small"
                  />
                </Box>

                <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1 }}>
                  {comanda.nome_cliente || 'Sem nome'}
                </Typography>
              </Box>

              {/* Financial Info Section */}
              <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  <Typography variant="body2" color="text.secondary">
                    Total: {formatMoney(comanda.total)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Pago: {formatMoney(comanda.total_pago)}
                  </Typography>
                </Box>

                <Box sx={{ mt:2 }}>
                  <Typography 
                    variant="h6" 
                    color={comanda.saldo > 0 ? "error" : "success"}
                    // sx={{ textAlign: 'right', mb: 2 }}
                  >
                    Saldo: {formatMoney(comanda.saldo)}
                  </Typography>
                </Box>
              </Box>

            </CardContent>

            <CardActions sx={{ 
              justifyContent: 'center',
              borderTop: '1px solid',
              borderColor: 'divider',
              pb: 2
            }}>
              <Button
                variant="contained"
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenDetails(comanda);
                }}
                sx={{
                  minWidth: '150px',
                  backgroundColor: 'primary.main',
                  '&:hover': {
                    backgroundColor: 'primary.dark',
                  }
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