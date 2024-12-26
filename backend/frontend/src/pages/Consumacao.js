import React, { useState, useEffect } from 'react';
import Grid from '@mui/material/Grid2';
import {
  Box, Card, CardMedia, CardContent, CardActions, Typography, Button, 
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, IconButton, 
  Drawer, List, ListItem, ListItemText, Divider, Badge, Snackbar, Alert
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import DeleteIcon from '@mui/icons-material/Delete';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import CategoryTabs from '../components/CategoryTabs';
import api from '../services/api';

export default function Consumacao() {
  const [categorias, setCategorias] = useState([]);
  const [itens, setItens] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState({
    mainCategoryId: null,
    subCategoryId: null
  });
  const [carrinho, setCarrinho] = useState([]);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [quarto, setQuarto] = useState('');
  const [observacao, setObservacao] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [quantidades, setQuantidades] = useState({});
  const [drawerOpen, setDrawerOpen] = useState(true);
  const drawerWidth = 400;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [categoriasRes, itensRes] = await Promise.all([
          api.get('/categorias/'),
          api.get('/itens/'),
        ]);
        setCategorias(categoriasRes.data);
        setItens(itensRes.data);
        
        const initQuantidades = {};
        itensRes.data.forEach(item => {
          initQuantidades[item.id] = 1;
        });
        setQuantidades(initQuantidades);
      } catch (error) {
        showSnackbar('Erro ao carregar dados', 'error');
      }
    };
    fetchData();
  }, []);

  const handleCategoryChange = (categories) => {
    setSelectedCategories(categories);
  };

  const getFilteredItems = () => {
    return itens.filter(item => {
      const categoria = categorias.find(cat => cat.id === item.categoria);
      
      if (!selectedCategories.mainCategoryId) return true;
      
      if (selectedCategories.subCategoryId) {
        return item.categoria === selectedCategories.subCategoryId;
      }
      
      return categoria?.categoria_pai === selectedCategories.mainCategoryId || 
             item.categoria === selectedCategories.mainCategoryId;
    }).filter(item => item.disponivel);
  };

  const handleQuantidadeChange = (itemId, delta) => {
    setQuantidades(prev => ({
      ...prev,
      [itemId]: Math.max(1, prev[itemId] + delta)
    }));
  };

  const adicionarAoCarrinho = (item) => {
    const quantidade = quantidades[item.id];
    const itemExistente = carrinho.find(i => i.id === item.id);

    if (itemExistente) {
      setCarrinho(carrinho.map(i => 
        i.id === item.id 
          ? { ...i, quantidade: i.quantidade + quantidade }
          : i
      ));
    } else {
      setCarrinho([...carrinho, { ...item, quantidade }]);
    }

    setQuantidades(prev => ({
      ...prev,
      [item.id]: 1
    }));

    showSnackbar(`${quantidade}x ${item.nome} adicionado ao carrinho`);
  };

  const removerDoCarrinho = (itemId) => {
    setCarrinho(carrinho.filter(item => item.id !== itemId));
  };

  const atualizarQuantidadeCarrinho = (itemId, delta) => {
    setCarrinho(carrinho.map(item => {
      if (item.id === itemId) {
        const novaQuantidade = Math.max(1, item.quantidade + delta);
        return { ...item, quantidade: novaQuantidade };
      }
      return item;
    }));
  };

  const handleCheckout = async () => {
    try {
      const comandasRes = await api.get(`/consumacoes/?quarto=${quarto}`);
      let consumacaoId;

      if (comandasRes.data.length > 0 && comandasRes.data[0].status === 'aberto') {
        consumacaoId = comandasRes.data[0].id;
      } else {
        const novaComandaRes = await api.post('/consumacoes/', {
          quarto,
          status: 'aberto'
        });
        consumacaoId = novaComandaRes.data.id;
      }

      for (const item of carrinho) {
        await api.post(`/consumacoes/${consumacaoId}/adicionar_item/`, {
          item_id: item.id,
          quantidade: item.quantidade,
          observacao
        });
      }

      setCarrinho([]);
      setCheckoutOpen(false);
      showSnackbar('Pedido realizado com sucesso!');
    } catch (error) {
      showSnackbar('Erro ao realizar pedido', 'error');
    }
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const formatMoney = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(Number(value) || 0);
  };

  const totalCarrinho = carrinho.reduce(
    (total, item) => total + (item.preco * item.quantidade), 
    0
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <Box 
        sx={{ 
          flexGrow: 1, 
          width: `calc(100% - ${drawerOpen ? drawerWidth : '50'}px)`,
          ml: 2
        }}
      >
        <CategoryTabs 
          categorias={categorias} 
          onCategoryChange={handleCategoryChange}
        />
        
        <Grid container spacing={3} sx={{ mt: 2 }}>
          {getFilteredItems().map(item => (
            <Grid item xs={12} sm={6} md={4} key={item.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardMedia
                  component="div"
                  sx={{
                    height: 140,
                    bgcolor: 'grey.300',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {item.imagem ? (
                    <img
                    src={item.imagem && !item.imagem.startsWith('http') ? `/media/${item.imagem}` : item.imagem}
                    alt={item.nome}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <Typography color="text.secondary">
                      Imagem não disponível
                    </Typography>
                  )}
                </CardMedia>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography gutterBottom variant="h6" component="h2">
                    {item.nome}
                  </Typography>
                  <Typography color="text.secondary">
                    {item.descricao}
                  </Typography>
                  <Typography variant="h6" color="primary" sx={{ mt: 2 }}>
                    {formatMoney(item.preco)}
                  </Typography>
                </CardContent>
                <CardActions sx={{ p: 2, pt: 0 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                    <IconButton 
                      size="small"
                      onClick={() => handleQuantidadeChange(item.id, -1)}
                    >
                      <RemoveIcon />
                    </IconButton>
                    <Typography>{quantidades[item.id] || 1}</Typography>
                    <IconButton 
                      size="small"
                      onClick={() => handleQuantidadeChange(item.id, 1)}
                    >
                      <AddIcon />
                    </IconButton>
                    <Button 
                      variant="contained" 
                      sx={{ ml: 'auto' }}
                      onClick={() => adicionarAoCarrinho(item)}
                    >
                      Adicionar
                    </Button>
                  </Box>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      <Drawer
        variant="permanent"
        anchor="right"
        sx={{
          width: drawerOpen ? drawerWidth : 50,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerOpen ? drawerWidth : 50,
            boxSizing: 'border-box',
            marginTop: '64px', // Height of AppBar
            height: 'calc(100% - 64px)',
            overflow: 'hidden'
          },
        }}
      >
        <Box sx={{ 
          display: 'flex',
          flexDirection: 'column',
          height: '100%'
        }}>
          <IconButton 
            onClick={() => setDrawerOpen(!drawerOpen)}
            sx={{ alignSelf: drawerOpen ? 'flex-start' : 'center', m: 1 }}
          >
            {drawerOpen ? <ChevronRightIcon /> : <ChevronLeftIcon />}
          </IconButton>

          {drawerOpen && (
            <>
              <Typography variant="h6" sx={{ p: 2, pb: 1 }}>
                Carrinho
              </Typography>
              <List sx={{ flexGrow: 1, overflow: 'auto', px: 2 }}>
                {carrinho.map((item) => (
                  <React.Fragment key={item.id}>
                    <ListItem
                      secondaryAction={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <IconButton 
                            edge="end" 
                            size="small"
                            onClick={() => atualizarQuantidadeCarrinho(item.id, -1)}
                          >
                            <RemoveIcon />
                          </IconButton>
                          <Typography>{item.quantidade}</Typography>
                          <IconButton 
                            edge="end" 
                            size="small"
                            onClick={() => atualizarQuantidadeCarrinho(item.id, 1)}
                          >
                            <AddIcon />
                          </IconButton>
                          <IconButton 
                            edge="end"
                            onClick={() => removerDoCarrinho(item.id)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      }
                    >
                      <ListItemText
                        primary={item.nome}
                        secondary={
                          <Box>
                            <Typography variant="body2">
                              {formatMoney(item.preco)} x {item.quantidade}
                            </Typography>
                            <Typography variant="subtitle2" color="primary">
                              {formatMoney(item.preco * item.quantidade)}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                    <Divider />
                  </React.Fragment>
                ))}
              </List>
              <Box sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Total: {formatMoney(totalCarrinho)}
                </Typography>
                <Button
                  variant="contained"
                  fullWidth
                  disabled={carrinho.length === 0}
                  onClick={() => setCheckoutOpen(true)}
                  sx={{ mt: 2 }}
                >
                  Finalizar Pedido
                </Button>
              </Box>
            </>
          )}
        </Box>
      </Drawer>

      {/* Checkout dialog */}
      <Dialog 
        open={checkoutOpen} 
        onClose={() => setCheckoutOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Finalizar Pedido</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Número do Quarto"
            value={quarto}
            onChange={(e) => setQuarto(e.target.value)}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Observações"
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
            multiline
            rows={3}
            margin="normal"
          />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Total: {formatMoney(totalCarrinho)}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCheckoutOpen(false)}>Cancelar</Button>
          <Button onClick={handleCheckout} variant="contained">
            Confirmar Pedido
          </Button>
        </DialogActions>
      </Dialog>

      {/* Feedback snackbar */}
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