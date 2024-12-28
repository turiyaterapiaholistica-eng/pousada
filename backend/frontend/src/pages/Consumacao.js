import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardMedia, CardContent, CardActions, Typography, Button, 
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, IconButton, 
  Drawer, List, ListItem, ListItemText, Divider, Badge, Snackbar, Alert,
  FormControlLabel, Checkbox, MenuItem
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import DeleteIcon from '@mui/icons-material/Delete';
import CategoryTabs from '../components/CategoryTabs';
import api from '../services/api';

export default function Consumacao() {
  const [categorias, setCategorias] = useState([]);
  const [itens, setItens] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState({
    mainCategoryId: 5, // ID for "Bebidas"
    subCategoryId: null
  });
  const [carrinho, setCarrinho] = useState([]);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [quarto, setQuarto] = useState('');
  const [observacao, setObservacao] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [quantidades, setQuantidades] = useState({});
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(true);
  const [isBusinessWorker, setIsBusinessWorker] = useState(false);
  const drawerWidth = 400;

  // Busca informações sobre as comandas
  const [comandasAbertas, setComandasAbertas] = useState([]);
  const [selectedComanda, setSelectedComanda] = useState('');

  const [isLoading, setIsLoading] = useState(true);


  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch categorias
        let categoriasData = [];
        try {
          const categoriasRes = await api.get('/categorias/');
          console.log('Raw categorias response:', categoriasRes);
          // Check if we have data and it's an array
          if (Array.isArray(categoriasRes)) {
            categoriasData = categoriasRes;  // Remove .data
            setCategorias(categoriasData);
            
            // Find and set the first main category
            const firstMainCategory = categoriasData.find(cat => !cat.categoria_pai);
            if (firstMainCategory) {
              console.log('Setting first main category:', firstMainCategory);
              setSelectedCategories({
                mainCategoryId: firstMainCategory.id,
                subCategoryId: null
              });
            }
          } else {
            console.error('Unexpected categorias response format:', categoriasRes);
          }
        } catch (error) {
          console.error('Error fetching categorias:', error);
          showSnackbar('Erro ao carregar categorias', 'error');
        }
  
        // Fetch itens
        try {
          const itensRes = await api.get('/itens/');
          console.log('Raw items response:', itensRes);
          // Check if we have data and it's an array
          if (Array.isArray(itensRes)) {
            const itensData = itensRes;  // Remove .data
            console.log('Setting items:', itensData.length);
            setItens(itensData);
            
            // Initialize quantities for each item
            const initQuantidades = {};
            itensData.forEach(item => {
              initQuantidades[item.id] = 1;
            });
            setQuantidades(initQuantidades);
          } else {
            console.error('Unexpected itens response format:', itensRes);
          }
        } catch (error) {
          console.error('Error fetching itens:', error);
          showSnackbar('Erro ao carregar itens', 'error');
        }
  
        // Fetch comandas
        try {
          const comandasRes = await api.get('/consumacoes/?status=aberto');
          console.log('Raw comandas response:', comandasRes);
          if (Array.isArray(comandasRes)) {
            setComandasAbertas(comandasRes);  // Remove .data
            
            // If there's a selected comanda, update worker status
            if (selectedComanda) {
              const selectedComandaData = comandasRes.find(
                c => c.id === selectedComanda
              );
              if (selectedComandaData) {
                setIsBusinessWorker(selectedComandaData.isBusinessWorker);
              }
            }
          } else {
            console.error('Unexpected comandas response format:', comandasRes);
          }
        } catch (error) {
          console.error('Error fetching comandas:', error);
          showSnackbar('Erro ao carregar comandas', 'error');
        }
  
      } catch (error) {
        console.error('Error in fetchData:', error);
        showSnackbar('Erro ao carregar dados', 'error');
      } finally {
        setIsLoading(false);
      }
    };
  
    fetchData();
  }, [selectedComanda]);

  // Function to get the effective price based on worker status
  const getEffectivePrice = (item) => {
    if (!item) return '-';
    
    // If it's a business worker and there's a cost price
    if (isBusinessWorker && item.preco_custo != null) {
      return item.preco_custo;
    }
    
    // If regular price exists, use it
    if (item.preco != null) {
      return item.preco;
    }
    
    // If no valid price exists
    return '-';
  };

  const handleComandaChange = (e) => {
    const comandaId = e.target.value;
    setSelectedComanda(comandaId);
    
    if (comandaId && Array.isArray(comandasAbertas)) {
      const comanda = comandasAbertas.find(c => c.id === comandaId);
      if (comanda) {
        setQuarto(comanda.quarto);
        setIsBusinessWorker(comanda.isBusinessWorker);
        
        // Update cart prices
        setCarrinho(prevCarrinho => prevCarrinho.map(item => {
          const newPreco = comanda.isBusinessWorker && item.preco_custo != null 
            ? item.preco_custo 
            : item.preco;
          
          return {
            ...item,
            precoEfetivo: newPreco ?? '-'
          };
        }));
      }
    } else {
      setQuarto('');
    }
  };

  const adicionarAoCarrinho = (item) => {
    const quantidade = quantidades[item.id];
    const precoEfetivo = getEffectivePrice(item);
    
    // Don't add items without a valid price
    if (precoEfetivo === '-') {
      showSnackbar('Item sem preço definido', 'error');
      return;
    }
  
    const itemExistente = carrinho.find(i => i.id === item.id);
  
    if (itemExistente) {
      setCarrinho(carrinho.map(i => 
        i.id === item.id 
          ? { ...i, quantidade: i.quantidade + quantidade }
          : i
      ));
    } else {
      setCarrinho([...carrinho, { 
        ...item, 
        quantidade,
        precoEfetivo
      }]);
    }
  
    setQuantidades(prev => ({
      ...prev,
      [item.id]: 1
    }));
  
    showSnackbar(`${quantidade}x ${item.nome} adicionado ao carrinho`);
  };

  const handleCategoryChange = (categories) => {
    setSelectedCategories(categories);
  };

  const getFilteredItems = () => {
    console.log('getFilteredItems called with:', {
      totalItems: itens.length,
      selectedCategories,
      showOnlyAvailable
    });
      
    return itens.filter(item => {
      console.log('Filtering item:', item);
      
      // First filter by availability if checkbox is checked
      if (showOnlyAvailable && !item.disponivel) {
        console.log('Item filtered out due to availability:', item.nome);
        return false;
      }
  
      // If no main category is selected, show all items
      if (!selectedCategories.mainCategoryId) {
        console.log('No main category selected, showing all items');
        return true;
      }
  
      // If a subcategory is selected, show only items from that subcategory
      if (selectedCategories.subCategoryId) {
        console.log('Filtering by subcategory:', selectedCategories.subCategoryId);
        return item.categoria === selectedCategories.subCategoryId;
      }
  
      // Show items that either belong to main category or its subcategories
      const itemCategory = categorias.find(cat => cat.id === item.categoria);
      const result = (
        item.categoria === selectedCategories.mainCategoryId || 
        itemCategory?.categoria_pai === selectedCategories.mainCategoryId
      );
      console.log('Item category check:', {
        item: item.nome,
        result,
        itemCategory: itemCategory?.nome
      });
      return result;
    });
  };

  useEffect(() => {
    const filtered = getFilteredItems();
    console.log('Selected Categories:', selectedCategories);
    console.log('Filtered Items:', filtered);
    console.log('Show Only Available:', showOnlyAvailable);
    filtered.forEach(item => {
      console.log('Item:', item.nome);
      console.log('  Regular Price:', item.preco);
      console.log('  Cost Price:', item.preco_custo);
      console.log('  Effective Price:', getEffectivePrice(item));
      console.log('  Is Available:', item.disponivel);
    });
  }, [selectedCategories, itens, showOnlyAvailable, isBusinessWorker]);
  

  const handleQuantidadeChange = (itemId, delta) => {
    setQuantidades(prev => ({
      ...prev,
      [itemId]: Math.max(1, prev[itemId] + delta)
    }));
  };

  // const adicionarAoCarrinho = (item) => {
  //   const quantidade = quantidades[item.id];
  //   const precoAtual = isBusinessWorker && item.preco_funcionario 
  //     ? item.preco_funcionario 
  //     : item.preco;
  
  //   const itemExistente = carrinho.find(i => i.id === item.id);
  
  //   if (itemExistente) {
  //     setCarrinho(carrinho.map(i => 
  //       i.id === item.id 
  //         ? { ...i, quantidade: i.quantidade + quantidade }
  //         : i
  //     ));
  //   } else {
  //     setCarrinho([...carrinho, { 
  //       ...item, 
  //       quantidade,
  //       precoEfetivo: precoAtual // Store the effective price when adding to cart
  //     }]);
  //   }
  
  //   setQuantidades(prev => ({
  //     ...prev,
  //     [item.id]: 1
  //   }));
  
  //   showSnackbar(`${quantidade}x ${item.nome} adicionado ao carrinho`);
  // };

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
  
      if (comandasRes.length > 0 && comandasRes[0].status === 'aberto') {
        consumacaoId = comandasRes[0].id;
      } else {
        const novaComandaRes = await api.post('/consumacoes/', {
          quarto,
          status: 'aberto',
          isBusinessWorker
        });
        consumacaoId = novaComandaRes.id;  // Remove .data
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
      console.error('Checkout error:', error);
      showSnackbar(
        error.response?.data?.detail || 'Erro ao realizar pedido',
        'error'
      );
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

  const totalCarrinho = carrinho.reduce((total, item) => {
    const preco = item.precoEfetivo;
    if (preco === '-' || preco == null) return total;
    return total + (preco * item.quantidade);
  }, 0);

  const renderPreco = (item) => {
    const precoEfetivo = getEffectivePrice(item);
    
    return (
      <Typography variant="h6" color="primary" sx={{ mt: 2 }}>
        {precoEfetivo === '-' ? (
          <span>-</span>
        ) : (
          <>
            {formatMoney(precoEfetivo)}
            {isBusinessWorker && item.preco_custo != null && (
              <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                (Preço funcionário)
              </Typography>
            )}
          </>
        )}
      </Typography>
    );
  };


  const renderCartItem = (item) => (
    <ListItemText
      primary={item.nome}
      secondary={
        <Box>
          <Typography variant="body2">
            {formatMoney(item.precoEfetivo)} x {item.quantidade}
          </Typography>
          <Typography variant="subtitle2" color="primary">
            {formatMoney(item.precoEfetivo * item.quantidade)}
          </Typography>
        </Box>
      }
    />
  );


  console.log('Rendering items...');
  const filteredItems = getFilteredItems();
  console.log('Number of filtered items:', filteredItems.length);

  if (filteredItems.length === 0) {
    return (
      <Typography>
        No items found. Debug info:
        Main Category: {selectedCategories.mainCategoryId},
        Sub Category: {selectedCategories.subCategoryId},
        Total Items: {itens.length},
        Show Only Available: {showOnlyAvailable.toString()}
      </Typography>
    );
  }

  return (
    <Box sx={{ display: 'flex' }}>
      <Box 
        sx={{ 
          flexGrow: 1, 
          width: `calc(100% - ${drawerOpen ? drawerWidth : '50'}px)`,
          ml: 2
        }}
      >
        <Box 
          sx={{ 
            mb: 2,
            display: 'flex',
            justifyContent: 'space-between' 
          }}
        >
          <Box>
            <FormControlLabel
              control={
                <Checkbox
                  checked={isBusinessWorker}
                  onChange={(e) => {
                    setIsBusinessWorker(e.target.checked);
                    // Clear selected comanda when changing worker status manually
                    if (!e.target.checked) {
                      setSelectedComanda('');
                    }
                  }}
                />
              }
              label="Funcionário"
              sx={{ ml: 2 }}
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={showOnlyAvailable}
                  onChange={(e) => setShowOnlyAvailable(e.target.checked)}
                />
              }
              label="Somente itens disponíveis"
            />
          </Box>
          <TextField
            select
            label="Comandas Abertas"
            value={selectedComanda}
            onChange={handleComandaChange}
            sx={{ minWidth: 200 }}
          >
            <MenuItem value="">
              <em>Nova comanda</em>
            </MenuItem>
            {Array.isArray(comandasAbertas) && comandasAbertas.map((comanda) => (
              <MenuItem key={comanda?.id || 'default'} value={comanda?.id || ''}>
                Quarto {comanda?.quarto || ''} - {formatMoney(comanda?.total || 0)}
              </MenuItem>
            ))}
          </TextField>
        </Box>
        
        <CategoryTabs 
          categorias={categorias} 
          onCategoryChange={handleCategoryChange}
          selectedCategories={selectedCategories}
        />
        
        <Grid container spacing={3} sx={{ mt: 2 }}>
          {getFilteredItems().map(item => (
            <Grid xs={12} sm={6} md={4} key={item.id}>
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
                  {renderPreco(item)}
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
                              {formatMoney(isBusinessWorker && item.preco_custo ? item.preco_custo : item.preco)} x {item.quantidade}
                            </Typography>
                            <Typography variant="subtitle2" color="primary">
                              {formatMoney((isBusinessWorker && item.preco_custo ? item.preco_custo : item.preco) * item.quantidade)}
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