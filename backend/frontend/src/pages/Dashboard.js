import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Card,
  CardContent,
  TextField,
  MenuItem,
} from '@mui/material';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ResponsiveContainer 
} from 'recharts';
import Grid from '@mui/material/Grid2';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import ptBR from 'date-fns/locale/pt-BR';
import api from '../services/api';

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [startDate, endDate]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/consumacoes/dashboard_data/', {
        params: {
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0],
        },
      });
      setDashboardData(response.data);
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (loading || !dashboardData) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Carregando...</Typography>
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
      <Box sx={{ p: 3 }}>
        <Grid container spacing={3}>
          {/* Filtros de data */}
          <Grid item xs={12}>
            <Paper sx={{ p: 2, display: 'flex', gap: 2 }}>
              <DatePicker
                label="Data Inicial"
                value={startDate}
                onChange={setStartDate}
                renderInput={(params) => <TextField {...params} />}
              />
              <DatePicker
                label="Data Final"
                value={endDate}
                onChange={setEndDate}
                renderInput={(params) => <TextField {...params} />}
              />
            </Paper>
          </Grid>

          {/* Cards de métricas */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Comandas Ativas
                </Typography>
                <Typography variant="h4">
                  {dashboardData.comandas_ativas}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Total de Vendas no Período
                </Typography>
                <Typography variant="h4">
                  {formatCurrency(dashboardData.vendas_periodo)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Gráfico de vendas por categoria */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Vendas por Categoria
              </Typography>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer>
                  <BarChart data={dashboardData.vendas_por_categoria}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="item__categoria__nome" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Legend />
                    <Bar dataKey="total_vendas" fill="#1976d2" name="Total de Vendas" />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </Paper>
          </Grid>

          {/* Gráfico de vendas por hora */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Vendas por Hora (Últimas 24h)
              </Typography>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer>
                  <LineChart data={dashboardData.vendas_por_hora}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hora" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="total" 
                      stroke="#1976d2" 
                      name="Total de Vendas" 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </Paper>
          </Grid>

          {/* Tabela de itens mais vendidos */}
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Itens Mais Vendidos
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={4}>
                    <Typography variant="subtitle2">Item</Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="subtitle2">Quantidade</Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="subtitle2">Receita</Typography>
                  </Grid>
                </Grid>
                {dashboardData.itens_mais_vendidos.map((item, index) => (
                  <Grid container spacing={2} key={index} sx={{ mt: 1 }}>
                    <Grid item xs={4}>
                      <Typography>{item.item__nome}</Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography>{item.total_vendido}</Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography>{formatCurrency(item.receita_total)}</Typography>
                    </Grid>
                  </Grid>
                ))}
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </LocalizationProvider>
  );
};

export default Dashboard;