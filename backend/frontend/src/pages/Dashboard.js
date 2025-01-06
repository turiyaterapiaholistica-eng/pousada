import React, { useState, useEffect } from 'react';
import Grid from '@mui/material/Grid2';
import { Card, CardContent, Typography, Stack } from '@mui/material';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import ptBR from 'date-fns/locale/pt-BR';

const StatCard = ({ title, value, trend, percent }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Typography variant="subtitle2" gutterBottom>
        {title}
      </Typography>
      <Typography variant="h4" component="div">
        {value}
      </Typography>
      <Typography 
        variant="body2" 
        sx={{ 
          color: trend === 'up' ? 'success.main' : 'error.main',
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}
      >
        {trend === 'up' ? '↑' : '↓'} {percent}% vs last period
      </Typography>
    </CardContent>
  </Card>
);

const RestaurantDashboard = () => {
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());

  // Sample data
  const salesData = [
    { date: '01/01', sales: 4500 },
    { date: '02/01', sales: 5200 },
    { date: '03/01', sales: 4800 },
    { date: '04/01', sales: 6000 },
    { date: '05/01', sales: 5700 },
    { date: '06/01', sales: 6300 },
    { date: '07/01', sales: 7000 },
  ];

  const categoryData = [
    { name: 'Pratos Principais', value: 35000 },
    { name: 'Bebidas', value: 25000 },
    { name: 'Sobremesas', value: 15000 },
    { name: 'Aperitivos', value: 12000 },
    { name: 'Outros', value: 8000 },
  ];

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
      <Stack spacing={3} sx={{ p: 3 }}>
        {/* Date Filters */}
        <Card sx={{ mb: 2 }}>
          <CardContent sx={{ display: 'flex', gap: 2 }}>
            <DatePicker
              label="Data Inicial"
              value={startDate}
              onChange={setStartDate}
            />
            <DatePicker
              label="Data Final"
              value={endDate}
              onChange={setEndDate}
            />
          </CardContent>
        </Card>

        {/* Stats Overview */}
        <Grid container spacing={2}>
          <Grid xs={12} md={3}>
            <StatCard 
              title="Vendas Totais" 
              value="R$ 95.000" 
              trend="up" 
              percent={12}
            />
          </Grid>
          <Grid xs={12} md={3}>
            <StatCard 
              title="Comandas Ativas" 
              value="23" 
              trend="up" 
              percent={8}
            />
          </Grid>
          <Grid xs={12} md={3}>
            <StatCard 
              title="Ticket Médio" 
              value="R$ 180" 
              trend="up" 
              percent={5}
            />
          </Grid>
          <Grid xs={12} md={3}>
            <StatCard 
              title="Total de Pedidos" 
              value="528" 
              trend="down" 
              percent={3}
            />
          </Grid>
        </Grid>

        {/* Charts */}
        <Grid container spacing={2}>
          <Grid xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Vendas por Período
                </Typography>
                <div style={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={salesData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Line 
                        type="monotone" 
                        dataKey="sales" 
                        stroke="#1976d2" 
                        name="Vendas (R$)"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </Grid>
          <Grid xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Vendas por Categoria
                </Typography>
                <div style={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="#1976d2" name="Vendas (R$)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Top Items Table */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Itens Mais Vendidos
            </Typography>
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
            </Grid>
            {[
              { name: 'Picanha', qty: 145, revenue: 'R$ 8.700' },
              { name: 'Cerveja', qty: 320, revenue: 'R$ 4.800' },
              { name: 'Camarão', qty: 98, revenue: 'R$ 4.410' },
              { name: 'Vinho', qty: 56, revenue: 'R$ 3.920' },
              { name: 'Sobremesas', qty: 167, revenue: 'R$ 2.505' }
            ].map((item, index) => (
              <Grid container spacing={2} key={index} sx={{ mt: 1 }}>
                <Grid xs={4}>
                  <Typography>{item.name}</Typography>
                </Grid>
                <Grid xs={4}>
                  <Typography>{item.qty}</Typography>
                </Grid>
                <Grid xs={4}>
                  <Typography>{item.revenue}</Typography>
                </Grid>
              </Grid>
            ))}
          </CardContent>
        </Card>
      </Stack>
    </LocalizationProvider>
  );
};

export default RestaurantDashboard;