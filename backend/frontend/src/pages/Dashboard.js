import React, { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  TextField,
  FormControl,
  Alert,
  CircularProgress,
  Box
} from '@mui/material';
import Grid from '@mui/material/Grid2';
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
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { startOfMonth, endOfMonth, format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import api from '../services/api';

const formatMoney = (value) => {
  if (!value) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

const MetricCard = ({ title, value, isLoading }) => (
  <Paper className="p-4 h-32">
    <Typography variant="h6" className="mb-4">
      {title}
    </Typography>
    {isLoading ? (
      <Box className="flex justify-center items-center h-12">
        <CircularProgress size={24} />
      </Box>
    ) : (
      <Typography variant="h4">
        {value}
      </Typography>
    )}
  </Paper>
);

const ChartCard = ({ title, children, isLoading }) => (
  <Paper className="p-4 h-96">
    <Typography variant="h6" className="mb-4">
      {title}
    </Typography>
    {isLoading ? (
      <Box className="flex justify-center items-center h-64">
        <CircularProgress />
      </Box>
    ) : (
      <Box className="h-80">
        {children}
      </Box>
    )}
  </Paper>
);

const Dashboard = () => {
  const [startDate, setStartDate] = useState(startOfMonth(new Date()));
  const [endDate, setEndDate] = useState(endOfMonth(new Date()));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState({
    comandasAtivas: 0,
    vendasPeriodo: 0,
    itensMaisVendidos: [],
    vendasPorCategoria: [],
    vendasPorHora: []
  });

  useEffect(() => {
    fetchDashboardData();
  }, [startDate, endDate]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get('/consumacoes/dashboard_data/', {
        params: {
          start_date: format(startDate, 'yyyy-MM-dd'),
          end_date: format(endDate, 'yyyy-MM-dd')
        }
      });

      // Process sales by hour data
      const vendasPorHora = response.vendas_por_hora?.map(item => ({
        ...item,
        hora: `${String(item.hora).padStart(2, '0')}:00`
      })) || [];

      setData({
        comandasAtivas: response.comandas_ativas || 0,
        vendasPeriodo: response.vendas_periodo || 0,
        itensMaisVendidos: response.itens_mais_vendidos || [],
        vendasPorCategoria: response.vendas_por_categoria || [],
        vendasPorHora
      });
    } catch (err) {
      setError('Erro ao carregar dados do dashboard');
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box className="p-6">
      {error && (
        <Alert severity="error" className="mb-4">
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Date filters */}
        <Grid xs={12}>
          <Paper className="p-4 flex gap-4">
            <DatePicker
              label="Data Inicial"
              value={startDate}
              onChange={setStartDate}
              format="dd/MM/yyyy"
            />
            <DatePicker
              label="Data Final"
              value={endDate}
              onChange={setEndDate}
              format="dd/MM/yyyy"
            />
          </Paper>
        </Grid>

        {/* Metric cards */}
        <Grid xs={12} md={6}>
          <MetricCard
            title="Comandas Ativas"
            value={data.comandasAtivas}
            isLoading={loading}
          />
        </Grid>

        <Grid xs={12} md={6}>
          <MetricCard
            title="Total de Vendas no Período"
            value={formatMoney(data.vendasPeriodo)}
            isLoading={loading}
          />
        </Grid>

        {/* Charts */}
        <Grid xs={12} md={6}>
          <ChartCard title="Vendas por Categoria" isLoading={loading}>
            <ResponsiveContainer>
              <BarChart data={data.vendasPorCategoria}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="item__categoria__nome" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis tickFormatter={formatMoney} />
                <Tooltip 
                  formatter={(value) => formatMoney(value)}
                  labelStyle={{ color: 'black' }}
                />
                <Legend />
                <Bar 
                  dataKey="total_vendas" 
                  fill="#1976d2" 
                  name="Total de Vendas"
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </Grid>

        <Grid xs={12} md={6}>
          <ChartCard title="Vendas por Hora" isLoading={loading}>
            <ResponsiveContainer>
              <LineChart data={data.vendasPorHora}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hora" />
                <YAxis tickFormatter={formatMoney} />
                <Tooltip 
                  formatter={(value) => formatMoney(value)}
                  labelStyle={{ color: 'black' }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="#1976d2"
                  name="Total de Vendas"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </Grid>

        {/* Top selling items */}
        <Grid xs={12}>
          <Paper className="p-4">
            <Typography variant="h6" className="mb-4">
              Itens Mais Vendidos
            </Typography>
            {loading ? (
              <Box className="flex justify-center p-4">
                <CircularProgress />
              </Box>
            ) : (
              <Grid container spacing={2}>
                <Grid xs={4}>
                  <Typography variant="subtitle2">Item</Typography>
                </Grid>
                <Grid xs={4}>
                  <Typography variant="subtitle2">Quantidade</Typography>
                </Grid>
                <Grid xs={4}>
                  <Typography variant="subtitle2">Receita</Typography>
                </Grid>
                {data.itensMaisVendidos.map((item, index) => (
                  <React.Fragment key={index}>
                    <Grid xs={4}>
                      <Typography>{item.item__nome}</Typography>
                    </Grid>
                    <Grid xs={4}>
                      <Typography>{item.total_vendido}</Typography>
                    </Grid>
                    <Grid xs={4}>
                      <Typography>{formatMoney(item.receita_total)}</Typography>
                    </Grid>
                  </React.Fragment>
                ))}
              </Grid>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;