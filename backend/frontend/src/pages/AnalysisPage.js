import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, TextField, MenuItem, Card, CardContent,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tabs, Tab
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import api from '../services/api';
import { formatMoney } from '../utils/formatters';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const AnalysisPage = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [period, setPeriod] = useState({
    start_date: new Date(new Date().setDate(new Date().getDate() - 30)),
    end_date: new Date()
  });
  
  // Dashboard data
  const [vendasData, setVendasData] = useState({
    comandas_ativas: 0,
    vendas_periodo: 0,
    itens_mais_vendidos: [],
    vendas_por_categoria: [],
    vendas_por_hora: []
  });
  
  const [comprasData, setComprasData] = useState({
    total_compras: 0,
    compras_por_fornecedor: [],
    itens_mais_comprados: [],
    compras_por_dia: []
  });
  
  const [movimentacoesData, setMovimentacoesData] = useState({
    movimentacao_por_tipo: [],
    movimentacao_por_dia: [],
    itens_mais_movimentados: []
  });
  
  const [estoqueData, setEstoqueData] = useState({
    total_itens: 0,
    valor_total: 0,
    itens_sem_estoque: 0,
    itens_criticos: 0,
    itens_baixos: 0,
    itens_mais_valiosos: []
  });
  
  const [lucroData, setLucroData] = useState({
    receita_total: 0,
    custo_total: 0,
    lucro_total: 0,
    margem_lucro: 0,
    lucro_por_dia: []
  });
  
  useEffect(() => {
    fetchData();
  }, [period, activeTab]);
  
  const fetchData = async () => {
    const formatDate = (date) => {
      if (!date) return '';
      return date.toISOString().split('T')[0];
    };
    
    const params = {
      start_date: formatDate(period.start_date),
      end_date: formatDate(period.end_date)
    };
    
    const paramsString = `?start_date=${params.start_date}&end_date=${params.end_date}`;
    
    try {
      // Tab 0: Vendas
      if (activeTab === 0 || activeTab === 4) {
        const vendasResponse = await api.get(`/consumacoes/dashboard_data/${paramsString}`);
        setVendasData(vendasResponse);
      }
      
      // Tab 1: Compras
      if (activeTab === 1 || activeTab === 4) {
        const comprasResponse = await api.get(`/compras/dashboard_data/${paramsString}`);
        setComprasData(comprasResponse);
      }
      
      // Tab 2: Estoque
      if (activeTab === 2) {
        const estoqueResponse = await api.get('/estoque/dashboard_data/');
        setEstoqueData(estoqueResponse);
      }
      
      // Tab 3: Movimentações
      if (activeTab === 3) {
        const movimentacoesResponse = await api.get(`/movimentacoes/dashboard_data/${paramsString}`);
        setMovimentacoesData(movimentacoesResponse);
      }
      
      // Tab 4: Calculando lucro (quando estiver na aba de lucro)
      if (activeTab === 4) {
        // Calcular dados de lucro baseado em vendas e compras
        const receita = vendasData.vendas_periodo || 0;
        const custo = comprasData.total_compras || 0;
        const lucro = receita - custo;
        const margem = receita > 0 ? (lucro / receita) * 100 : 0;
        
        // Criar dataset combinado de vendas e compras por dia
        const vendasPorDia = {};
        (vendasData.vendas_por_dia || []).forEach(item => {
          vendasPorDia[item.dia] = item.total;
        });
        
        const comprasPorDia = {};
        (comprasData.compras_por_dia || []).forEach(item => {
          comprasPorDia[item.dia] = item.total;
        });
        
        // Combinar os dados
        const diasCombinados = new Set([
          ...Object.keys(vendasPorDia),
          ...Object.keys(comprasPorDia)
        ]);
        
        const lucroPorDia = Array.from(diasCombinados).map(dia => ({
          dia,
          receita: vendasPorDia[dia] || 0,
          custo: comprasPorDia[dia] || 0,
          lucro: (vendasPorDia[dia] || 0) - (comprasPorDia[dia] || 0)
        })).sort((a, b) => new Date(a.dia) - new Date(b.dia));
        
        setLucroData({
          receita_total: receita,
          custo_total: custo,
          lucro_total: lucro,
          margem_lucro: margem,
          lucro_por_dia: lucroPorDia
        });
      }
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
    }
  };
  
  const handleChangeTab = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  const renderVendasDashboard = () => (
    <Grid container spacing={3}>
      {/* Estatísticas de vendas */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Comandas Ativas
            </Typography>
            <Typography variant="h4">{vendasData.comandas_ativas}</Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Vendas no Período
            </Typography>
            <Typography variant="h4">{formatMoney(vendasData.vendas_periodo)}</Typography>
          </CardContent>
        </Card>
      </Grid>
      
      {/* Gráfico - Vendas por Categoria */}
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 2, height: '400px' }}>
          <Typography variant="h6" gutterBottom>
            Vendas por Categoria
          </Typography>
          <ResponsiveContainer width="100%" height="85%">
            <PieChart>
              <Pie
                data={vendasData.vendas_por_categoria || []}
                dataKey="total_vendas"
                nameKey="item__categoria__nome"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={(entry) => entry.item__categoria__nome}
              >
                {(vendasData.vendas_por_categoria || []).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatMoney(value)} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Paper>
      </Grid>
      
      {/* Gráfico - Vendas por Hora */}
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 2, height: '400px' }}>
          <Typography variant="h6" gutterBottom>
            Vendas por Hora
          </Typography>
          <ResponsiveContainer width="100%" height="85%">
            <BarChart data={vendasData.vendas_por_hora || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hora" />
              <YAxis />
              <Tooltip formatter={(value) => formatMoney(value)} />
              <Bar dataKey="total" fill="#8884d8" name="Vendas" />
            </BarChart>
          </ResponsiveContainer>
        </Paper>
      </Grid>
      
      {/* Tabela - Itens Mais Vendidos */}
      <Grid item xs={12}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Itens Mais Vendidos
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Item</TableCell>
                  <TableCell align="right">Quantidade</TableCell>
                  <TableCell align="right">Receita</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(vendasData.itens_mais_vendidos || []).map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{item.item__nome}</TableCell>
                    <TableCell align="right">{item.total_vendido}</TableCell>
                    <TableCell align="right">{formatMoney(item.receita_total)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Grid>
    </Grid>
  );
  
  const renderComprasDashboard = () => (
    <Grid container spacing={3}>
      {/* Total de compras */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Total de Compras no Período
            </Typography>
            <Typography variant="h4">{formatMoney(comprasData.total_compras)}</Typography>
          </CardContent>
        </Card>
      </Grid>
      
      {/* Gráfico - Compras por Fornecedor */}
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 2, height: '400px' }}>
          <Typography variant="h6" gutterBottom>
            Compras por Fornecedor
          </Typography>
          <ResponsiveContainer width="100%" height="85%">
            <PieChart>
              <Pie
                data={comprasData.compras_por_fornecedor || []}
                dataKey="total"
                nameKey="fornecedor__nome"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={(entry) => entry.fornecedor__nome || 'Sem fornecedor'}
              >
                {(comprasData.compras_por_fornecedor || []).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatMoney(value)} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Paper>
      </Grid>
      
      {/* Gráfico - Compras por Dia */}
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 2, height: '400px' }}>
          <Typography variant="h6" gutterBottom>
            Compras por Dia
          </Typography>
          <ResponsiveContainer width="100%" height="85%">
            <LineChart data={comprasData.compras_por_dia || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="dia" />
              <YAxis />
              <Tooltip formatter={(value) => formatMoney(value)} />
              <Line type="monotone" dataKey="total" stroke="#8884d8" name="Compras" />
            </LineChart>
          </ResponsiveContainer>
        </Paper>
      </Grid>
      
      {/* Tabela - Itens Mais Comprados */}
      <Grid item xs={12}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Itens Mais Comprados
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Item</TableCell>
                  <TableCell align="right">Quantidade</TableCell>
                  <TableCell align="right">Valor Total</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(comprasData.itens_mais_comprados || []).map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{item.item__nome}</TableCell>
                    <TableCell align="right">{item.total_quantidade}</TableCell>
                    <TableCell align="right">{formatMoney(item.total_valor)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Grid>
    </Grid>
  );
  
  const renderEstoqueDashboard = () => (
    <Grid container spacing={3}>
      {/* Estatísticas */}
      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Itens em Estoque
            </Typography>
            <Typography variant="h4">{estoqueData.total_itens}</Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Valor Total
            </Typography>
            <Typography variant="h4">{formatMoney(estoqueData.valor_total)}</Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Itens com Estoque Crítico
            </Typography>
            <Typography variant="h4" color="error.main">
              {estoqueData.itens_sem_estoque + estoqueData.itens_criticos}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      
      {/* Gráfico - Distribuição de Status de Estoque */}
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 2, height: '400px' }}>
          <Typography variant="h6" gutterBottom>
            Distribuição de Status de Estoque
          </Typography>
          <ResponsiveContainer width="100%" height="85%">
            <PieChart>
              <Pie
                data={[
                  { name: 'Normal', value: estoqueData.total_itens - estoqueData.itens_baixos - estoqueData.itens_criticos - estoqueData.itens_sem_estoque },
                  { name: 'Baixo', value: estoqueData.itens_baixos },
                  { name: 'Crítico', value: estoqueData.itens_criticos },
                  { name: 'Sem Estoque', value: estoqueData.itens_sem_estoque }
                ]}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label
              >
                <Cell fill="#4caf50" />
                <Cell fill="#ff9800" />
                <Cell fill="#f44336" />
                <Cell fill="#9e9e9e" />
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Paper>
      </Grid>
      
      {/* Tabela - Itens Mais Valiosos */}
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 2, height: '400px', overflow: 'auto' }}>
          <Typography variant="h6" gutterBottom>
            Itens Mais Valiosos em Estoque
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Item</TableCell>
                  <TableCell align="right">Quantidade</TableCell>
                  <TableCell align="right">Valor Total</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(estoqueData.itens_mais_valiosos || []).map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{item.item__nome}</TableCell>
                    <TableCell align="right">
                      {item.quantidade} {item.unidade}
                    </TableCell>
                    <TableCell align="right">{formatMoney(item.valor_total)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Grid>
    </Grid>
  );
  
  const renderMovimentacoesDashboard = () => (
    <Grid container spacing={3}>
      {/* Gráfico - Movimentação por Tipo */}
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 2, height: '400px' }}>
          <Typography variant="h6" gutterBottom>
            Movimentação por Tipo
          </Typography>
          <ResponsiveContainer width="100%" height="85%">
            <BarChart data={movimentacoesData.movimentacao_por_tipo || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="tipo" />
              <YAxis />
              <Tooltip formatter={(value, name) => [
                name === 'total_valor' ? formatMoney(value) : value,
                name === 'total_valor' ? 'Valor Total' : 'Quantidade'
              ]} />
              <Bar dataKey="total_quantidade" fill="#8884d8" name="Quantidade" />
              <Bar dataKey="total_valor" fill="#82ca9d" name="Valor Total" />
            </BarChart>
          </ResponsiveContainer>
        </Paper>
      </Grid>
      
      {/* Gráfico - Movimentação por Dia */}
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 2, height: '400px' }}>
          <Typography variant="h6" gutterBottom>
            Movimentação por Dia
          </Typography>
          <ResponsiveContainer width="100%" height="85%">
            <LineChart data={movimentacoesData.movimentacao_por_dia || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="dia" />
              <YAxis />
              <Tooltip formatter={(value) => formatMoney(value)} />
              <Line type="monotone" dataKey="total_valor" stroke="#8884d8" name="Valor Total" />
            </LineChart>
          </ResponsiveContainer>
        </Paper>
      </Grid>
      
      {/* Tabela - Itens Mais Movimentados */}
      <Grid item xs={12}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Itens Mais Movimentados
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Item</TableCell>
                  <TableCell align="right">Entradas</TableCell>
                  <TableCell align="right">Saídas</TableCell>
                  <TableCell align="right">Valor Total</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(movimentacoesData.itens_mais_movimentados || []).map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{item.item__nome}</TableCell>
                    <TableCell align="right">{item.total_entradas || 0}</TableCell>
                    <TableCell align="right">{item.total_saidas || 0}</TableCell>
                    <TableCell align="right">{formatMoney(item.total_valor)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Grid>
    </Grid>
  );
  
  const renderLucroDashboard = () => (
    <Grid container spacing={3}>
      {/* Estatísticas */}
      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Receita Total
            </Typography>
            <Typography variant="h4">{formatMoney(lucroData.receita_total)}</Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Custo Total
            </Typography>
            <Typography variant="h4">{formatMoney(lucroData.custo_total)}</Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Lucro Total
            </Typography>
            <Typography variant="h4" color={lucroData.lucro_total >= 0 ? 'success.main' : 'error.main'}>
              {formatMoney(lucroData.lucro_total)}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Margem de Lucro
            </Typography>
            <Typography variant="h4" color={lucroData.margem_lucro >= 0 ? 'success.main' : 'error.main'}>
              {lucroData.margem_lucro.toFixed(2)}%
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      
      {/* Gráfico - Lucro por Dia */}
      <Grid item xs={12}>
        <Paper sx={{ p: 2, height: '400px' }}>
          <Typography variant="h6" gutterBottom>
            Lucro por Dia
          </Typography>
          <ResponsiveContainer width="100%" height="85%">
            <BarChart data={lucroData.lucro_por_dia || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="dia" />
              <YAxis />
              <Tooltip formatter={(value) => formatMoney(value)} />
              <Bar dataKey="receita" fill="#4caf50" name="Receita" />
              <Bar dataKey="custo" fill="#f44336" name="Custo" />
              <Line type="monotone" dataKey="lucro" stroke="#2196f3" name="Lucro" />
              <Legend />
            </BarChart>
          </ResponsiveContainer>
        </Paper>
      </Grid>
    </Grid>
  );
  
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Análise e Relatórios
      </Typography>
      
      {/* Filtros */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={5}>
            <DatePicker
              label="Data Inicial"
              value={period.start_date}
              onChange={(date) => setPeriod({ ...period, start_date: date })}
              renderInput={(params) => <TextField {...params} fullWidth />}
            />
          </Grid>
          <Grid item xs={12} md={5}>
            <DatePicker
              label="Data Final"
              value={period.end_date}
              onChange={(date) => setPeriod({ ...period, end_date: date })}
              renderInput={(params) => <TextField {...params} fullWidth />}
            />
          </Grid>
        </Grid>
      </Paper>
      
      {/* Tabs */}
      <Tabs value={activeTab} onChange={handleChangeTab} sx={{ mb: 3 }}>
        <Tab label="Vendas" />
        <Tab label="Compras" />
        <Tab label="Estoque" />
        <Tab label="Movimentações" />
        <Tab label="Resultado" />
      </Tabs>
      
      {/* Dashboard Content */}
      {activeTab === 0 && renderVendasDashboard()}
      {activeTab === 1 && renderComprasDashboard()}
      {activeTab === 2 && renderEstoqueDashboard()}
      {activeTab === 3 && renderMovimentacoesDashboard()}
      {activeTab === 4 && renderLucroDashboard()}
    </Box>
  );
} 
export default AnalysisPage;