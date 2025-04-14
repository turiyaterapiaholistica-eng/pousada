import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, TextField, Button, MenuItem,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Snackbar, Alert, Chip, IconButton, Card, CardContent,
  Dialog, DialogTitle, DialogContent, DialogActions, Tabs, Tab
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import EditIcon from '@mui/icons-material/Edit';
import HistoryIcon from '@mui/icons-material/History';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import api from '../services/api';
import { formatMoney } from '../utils/formatters';

const STATUS_COLORS = {
  normal: 'success',
  baixo: 'warning',
  critico: 'error',
  sem_estoque: 'error'
};

const STATUS_ICONS = {
  normal: <CheckCircleIcon />,
  baixo: <WarningIcon />,
  critico: <ErrorIcon />,
  sem_estoque: <ErrorIcon />
};

const EstoquePage = () => {
  const [items, setItems] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [movimentacoes, setMovimentacoes] = useState([]);
  const [openMovimentacoesDialog, setOpenMovimentacoesDialog] = useState(false);
  const [openAjusteDialog, setOpenAjusteDialog] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [filtroNome, setFiltroNome] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('');
  const [ajusteData, setAjusteData] = useState({
    quantidade: '',
    motivo: ''
  });
  
  // Estatísticas do dashboard
  const [dashboard, setDashboard] = useState({
    total_itens: 0,
    valor_total: 0,
    itens_sem_estoque: 0,
    itens_criticos: 0,
    itens_baixos: 0,
    itens_mais_valiosos: []
  });
  
  // Controle da aba ativa
  const [activeTab, setActiveTab] = useState(0);
  
  useEffect(() => {
    fetchCategorias();
    fetchDashboardData();
    fetchEstoque();
  }, []);
  
  useEffect(() => {
    fetchEstoque();
  }, [filtroCategoria, filtroNome, filtroStatus]);
  
  const fetchCategorias = async () => {
    try {
      const data = await api.get('/categorias/');
      setCategorias(data);
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
      showSnackbar('Erro ao carregar categorias', 'error');
    }
  };
  
  const fetchEstoque = async () => {
    setLoading(true);
    try {
      let url = '/estoque/';
      const params = [];
      
      if (filtroCategoria) {
        params.push(`categoria=${filtroCategoria}`);
      }
      
      if (filtroNome) {
        params.push(`nome=${filtroNome}`);
      }
      
      if (filtroStatus) {
        params.push(`status=${filtroStatus}`);
      }
      
      if (params.length > 0) {
        url += '?' + params.join('&');
      }
      
      const data = await api.get(url);
      setItems(data);
    } catch (error) {
      console.error('Erro ao carregar estoque:', error);
      showSnackbar('Erro ao carregar estoque', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  const fetchDashboardData = async () => {
    try {
      const data = await api.get('/estoque/dashboard_data/');
      setDashboard(data);
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
    }
  };
  
  const fetchMovimentacoes = async (itemId) => {
    try {
      const data = await api.get(`/movimentacoes/?item=${itemId}`);
      setMovimentacoes(data);
    } catch (error) {
      console.error('Erro ao carregar movimentações:', error);
      showSnackbar('Erro ao carregar movimentações', 'error');
    }
  };
  
  const handleOpenMovimentacoes = (item) => {
    setSelectedItem(item);
    fetchMovimentacoes(item.item);
    setOpenMovimentacoesDialog(true);
  };
  
  const handleOpenAjusteEstoque = (item) => {
    setSelectedItem(item);
    setAjusteData({
      quantidade: item.quantidade,
      motivo: ''
    });
    setOpenAjusteDialog(true);
  };
  
  const handleAjusteEstoque = async () => {
    if (!ajusteData.motivo) {
      showSnackbar('Informe o motivo do ajuste', 'error');
      return;
    }
    
    try {
      await api.post(`/estoque/${selectedItem.id}/ajustar/`, ajusteData);
      showSnackbar('Estoque ajustado com sucesso');
      setOpenAjusteDialog(false);
      fetchEstoque();
      fetchDashboardData();
    } catch (error) {
      console.error('Erro ao ajustar estoque:', error);
      showSnackbar('Erro ao ajustar estoque', 'error');
    }
  };
  
  const inicializarEstoque = async () => {
    try {
      await api.post('/estoque/inicializar/');
      showSnackbar('Estoque inicializado com sucesso');
      fetchEstoque();
      fetchDashboardData();
    } catch (error) {
      console.error('Erro ao inicializar estoque:', error);
      showSnackbar('Erro ao inicializar estoque', 'error');
    }
  };
  
  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleChangeTab = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Controle de Estoque
      </Typography>
      
      <Tabs value={activeTab} onChange={handleChangeTab} sx={{ mb: 3 }}>
        <Tab label="Dashboard" />
        <Tab label="Itens em Estoque" />
      </Tabs>
      
      {activeTab === 0 ? (
        // Dashboard View
        <Grid container spacing={3}>
          {/* Estatísticas */}
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Itens em Estoque
                </Typography>
                <Typography variant="h4">{dashboard.total_itens}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Valor Total
                </Typography>
                <Typography variant="h4">{formatMoney(dashboard.valor_total)}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={2}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Sem Estoque
                </Typography>
                <Typography variant="h4" color="error">{dashboard.itens_sem_estoque}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={2}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Estoque Crítico
                </Typography>
                <Typography variant="h4" color="warning.main">{dashboard.itens_criticos}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={2}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Estoque Baixo
                </Typography>
                <Typography variant="h4" color="info.main">{dashboard.itens_baixos}</Typography>
              </CardContent>
            </Card>
          </Grid>
          
          {/* Itens mais valiosos */}
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Itens mais valiosos em estoque
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
                    {dashboard.itens_mais_valiosos && dashboard.itens_mais_valiosos.length > 0 ? (
                      dashboard.itens_mais_valiosos.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.item__nome}</TableCell>
                          <TableCell align="right">
                            {item.quantidade} {item.unidade}
                          </TableCell>
                          <TableCell align="right">{formatMoney(item.valor_total)}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={3} align="center">
                          Nenhum item encontrado
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
        </Grid>
      ) : (
        // Estoque View
        <>
          {/* Filtros */}
          <Paper sx={{ p: 2, mb: 3 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={3}>
                <TextField
                  select
                  label="Categoria"
                  fullWidth
                  value={filtroCategoria}
                  onChange={(e) => setFiltroCategoria(e.target.value)}
                >
                  <MenuItem value="">Todas</MenuItem>
                  {categorias.map((categoria) => (
                    <MenuItem key={categoria.id} value={categoria.id}>
                      {categoria.nome}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  label="Nome do item"
                  fullWidth
                  value={filtroNome}
                  onChange={(e) => setFiltroNome(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  select
                  label="Status"
                  fullWidth
                  value={filtroStatus}
                  onChange={(e) => setFiltroStatus(e.target.value)}
                >
                  <MenuItem value="">Todos</MenuItem>
                  <MenuItem value="normal">Normal</MenuItem>
                  <MenuItem value="baixo">Baixo</MenuItem>
                  <MenuItem value="critico">Crítico</MenuItem>
                  <MenuItem value="sem_estoque">Sem estoque</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} md={3}>
                <Button 
                  variant="contained" 
                  onClick={inicializarEstoque}
                  fullWidth
                >
                  Inicializar Estoque
                </Button>
              </Grid>
            </Grid>
          </Paper>
          
          {/* Lista de Itens */}
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Item</TableCell>
                  <TableCell>Categoria</TableCell>
                  <TableCell align="right">Quantidade</TableCell>
                  <TableCell align="right">Mínimo</TableCell>
                  <TableCell align="center">Status</TableCell>
                  <TableCell align="right">Valor Unitário</TableCell>
                  <TableCell align="right">Valor Total</TableCell>
                  <TableCell align="center">Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      Carregando...
                    </TableCell>
                  </TableRow>
                ) : items.length > 0 ? (
                  items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.item_nome}</TableCell>
                      <TableCell>{item.categoria_nome}</TableCell>
                      <TableCell align="right">
                        {item.quantidade} {item.unidade}
                      </TableCell>
                      <TableCell align="right">
                        {item.quantidade_minima} {item.unidade}
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          icon={STATUS_ICONS[item.status.codigo]}
                          label={item.status.descricao}
                          color={STATUS_COLORS[item.status.codigo]}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">{formatMoney(item.ultimo_preco || 0)}</TableCell>
                      <TableCell align="right">{formatMoney(item.valor_total || 0)}</TableCell>
                      <TableCell align="center">
                        <IconButton 
                          size="small" 
                          onClick={() => handleOpenAjusteEstoque(item)}
                          title="Ajustar estoque"
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          onClick={() => handleOpenMovimentacoes(item)}
                          title="Ver movimentações"
                        >
                          <HistoryIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      Nenhum item encontrado
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}
      
      {/* Modal de Movimentações */}
      <Dialog 
        open={openMovimentacoesDialog} 
        onClose={() => setOpenMovimentacoesDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Movimentações de Estoque - {selectedItem?.item_nome}
        </DialogTitle>
        <DialogContent>
          <TableContainer sx={{ mt: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Data</TableCell>
                  <TableCell>Tipo</TableCell>
                  <TableCell align="right">Quantidade</TableCell>
                  <TableCell align="right">Valor Unit.</TableCell>
                  <TableCell>Origem</TableCell>
                  <TableCell>Observação</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {movimentacoes.length > 0 ? (
                  movimentacoes.map((movimentacao) => (
                    <TableRow key={movimentacao.id}>
                      <TableCell>
                        {new Date(movimentacao.data).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={movimentacao.tipo_display}
                          color={
                            movimentacao.tipo === 'entrada' ? 'success' :
                            movimentacao.tipo === 'saida' ? 'error' :
                            movimentacao.tipo === 'ajuste' ? 'warning' : 'default'
                          }
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        {movimentacao.quantidade} {movimentacao.unidade}
                      </TableCell>
                      <TableCell align="right">
                        {movimentacao.valor_unitario ? formatMoney(movimentacao.valor_unitario) : '-'}
                      </TableCell>
                      <TableCell>{movimentacao.origem || '-'}</TableCell>
                      <TableCell>{movimentacao.observacao || '-'}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      Nenhuma movimentação encontrada
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenMovimentacoesDialog(false)}>
            Fechar
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Modal de Ajuste de Estoque */}
      <Dialog 
        open={openAjusteDialog} 
        onClose={() => setOpenAjusteDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Ajustar Estoque - {selectedItem?.item_nome}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                label={`Quantidade (${selectedItem?.unidade})`}
                type="number"
                fullWidth
                value={ajusteData.quantidade}
                onChange={(e) => setAjusteData({ ...ajusteData, quantidade: e.target.value })}
                inputProps={{ step: 0.001 }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Motivo do ajuste"
                fullWidth
                multiline
                rows={3}
                value={ajusteData.motivo}
                onChange={(e) => setAjusteData({ ...ajusteData, motivo: e.target.value })}
                required
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAjusteDialog(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleAjusteEstoque} 
            variant="contained"
            color="primary"
          >
            Salvar
          </Button>
        </DialogActions>
      </Dialog>
      
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
export default EstoquePage;