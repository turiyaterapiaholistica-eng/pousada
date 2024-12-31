import React, { useState, useEffect } from 'react';
import { 
  AppBar, 
  Box, 
  Typography, 
  TextField, 
  Paper, 
  Button, 
  Alert, 
  Snackbar,
  Toolbar,
  IconButton
} from '@mui/material';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import LoginIcon from '@mui/icons-material/Login';
import LogoutIcon from '@mui/icons-material/Logout';
import ItemGrid from '../components/ItemGrid';
import CartSidebar from '../components/CartSidebar';
import CategoryTabs from '../components/CategoryTabs';
import api from '../services/api';
import authService from '../services/auth';

const PublicMenu = () => {
  const navigate = useNavigate();
  const isAuthenticated = authService.isAuthenticated();
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState({
    mainCategoryId: null,
    subCategoryId: null
  });

  // Cart state
  const [cart, setCart] = useState([]);
  const [quantities, setQuantities] = useState({});
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Authentication state
  const [comandaCode, setComandaCode] = useState('');
  const [currentComanda, setCurrentComanda] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const handleLogout = async () => {
    try {
      await authService.logout();
      navigate('/menu');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };


  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch categories
        const categoriesData = await api.get('/categorias/');
        setCategories(categoriesData);
        
        // Find the first main category that has subcategories
        const firstMainCategory = categoriesData.find(cat => 
          !cat.categoria_pai && cat.subcategorias?.length > 0
        );
        
        if (firstMainCategory) {
          setSelectedCategories({
            mainCategoryId: firstMainCategory.id,
            subCategoryId: null
          });
        }
        
        // Fetch menu items
        const itemsData = await api.get('/itens/');
        setItems(itemsData.filter(item => item.disponivel));
        
        // Initialize quantities
        const initQuantities = {};
        itemsData.forEach(item => {
          initQuantities[item.id] = 1;
        });
        setQuantities(initQuantities);
      } catch (error) {
        showSnackbar('Error loading menu data', 'error');
      }
    };
    
    fetchData();
  }, []);

  const handleAuthenticate = async () => {
    if (!comandaCode.trim()) {
      showSnackbar('Por favor, insira o número do quarto', 'warning');
      return;
    }

    try {
      // This would need to be implemented in the backend
      const response = await api.post('/consumacoes/authenticate/', {
        code: comandaCode
      });
      
      setCurrentComanda(response.data);
      
      if (response.data.itens?.length > 0) {
        setCart(response.data.itens.map(item => ({
          ...item.item,
          quantidade: item.quantidade,
          precoEfetivo: item.item.preco
        })));
      }
      
      showSnackbar('Quarto identificado com sucesso', 'success');
    } catch (error) {
      showSnackbar('Quarto não encontrado', 'error');
    }
  };

  const handleQuantityChange = (itemId, delta) => {
    setQuantities(prev => ({
      ...prev,
      [itemId]: Math.max(1, prev[itemId] + delta)
    }));
  };

  const addToCart = (item) => {
    if (!currentComanda) {
      showSnackbar('Por favor, identifique o quarto primeiro', 'warning');
      return;
    }

    const quantity = quantities[item.id];
    const existingItem = cart.find(i => i.id === item.id);
    
    if (existingItem) {
      setCart(cart.map(i => 
        i.id === item.id 
          ? { ...i, quantidade: i.quantidade + quantity }
          : i
      ));
    } else {
      setCart([...cart, { 
        ...item, 
        quantidade: quantity,
        precoEfetivo: item.preco
      }]);
    }
    
    setQuantities(prev => ({
      ...prev,
      [item.id]: 1
    }));
    
    showSnackbar(`${quantity}x ${item.nome} adicionado ao carrinho`);
  };

  const updateCartQuantity = (itemId, delta) => {
    setCart(cart.map(item => {
      if (item.id === itemId) {
        const newQuantity = Math.max(1, item.quantidade + delta);
        return { ...item, quantidade: newQuantity };
      }
      return item;
    }));
  };

  const removeFromCart = (itemId) => {
    setCart(cart.filter(item => item.id !== itemId));
  };

  const handleCheckout = async () => {
    try {
      if (!currentComanda) {
        showSnackbar('Por favor, identifique o quarto primeiro', 'warning');
        return;
      }
      
      // Add items to comanda
      await api.post(`/consumacoes/${currentComanda.id}/adicionar_item/`, {
        items: cart.map(item => ({
          item_id: item.id,
          quantidade: item.quantidade
        }))
      });
      
      setCart([]);
      showSnackbar('Pedido realizado com sucesso!');
    } catch (error) {
      showSnackbar('Erro ao realizar pedido', 'error');
    }
  };

  const formatMoney = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const cartTotal = cart.reduce((total, item) => 
    total + (item.precoEfetivo * item.quantidade), 0);

  return (
    <Box>
      {/* Navbar */}
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Villa Container Lodge
          </Typography>
          
          {isAuthenticated ? (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button 
                color="inherit" 
                component={RouterLink} 
                to="/"
              >
                Consumação
              </Button>
              <Button 
                color="inherit" 
                component={RouterLink} 
                to="/comandas"
              >
                Gestão de Comandas
              </Button>
              <Button
                color="inherit"
                startIcon={<LogoutIcon />}
                onClick={handleLogout}
              >
                Sair
              </Button>
            </Box>
          ) : (
            <Button
              color="inherit"
              startIcon={<LoginIcon />}
              onClick={() => navigate('/login')}
            >
              Área Restrita
            </Button>
          )}
        </Toolbar>
      </AppBar>

      {/* Header with room identification */}
      <Paper sx={{ 
        p: 3, 
        mb: 3, 
        mt: 3, 
        mx: 3,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        width:'85%'
      }}>
        <Typography variant="h5" sx={{ fontWeight: 500 }}>
          {currentComanda ? `Comanda: Quarto ${currentComanda.quarto}` : 'Identifique o quarto'}
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            label="Número do Quarto"
            value={comandaCode}
            onChange={(e) => setComandaCode(e.target.value)}
            size="small"
            sx={{ width: '150px' }}
          />
          <Button 
            variant="contained"
            onClick={handleAuthenticate}
            disabled={!comandaCode}
          >
            Identificar
          </Button>
        </Box>
      </Paper>

      <Box sx={{ display: 'flex' }}>
        <Box sx={{ flexGrow: 1, width: '90%', ml: 2 }}>
          <CategoryTabs
            categorias={categories}
            onCategoryChange={setSelectedCategories}
            selectedCategories={selectedCategories}
          />
          
          <ItemGrid
            items={items.filter(item => {
              if (!selectedCategories.mainCategoryId) return true;
              if (selectedCategories.subCategoryId) {
                return item.categoria === selectedCategories.subCategoryId;
              }
              const itemCategory = categories.find(cat => cat.id === item.categoria);
              return item.categoria === selectedCategories.mainCategoryId || 
                     itemCategory?.categoria_pai === selectedCategories.mainCategoryId;
            })}
            handleQuantidadeChange={handleQuantityChange}
            quantidades={quantities}
            adicionarAoCarrinho={addToCart}
            renderPreco={(item) => (
              <Typography variant="h6" color="primary">
                {formatMoney(item.preco)}
              </Typography>
            )}
          />
        </Box>

        <CartSidebar
          drawerWidth={400}
          drawerOpen={drawerOpen}
          setDrawerOpen={setDrawerOpen}
          carrinho={cart}
          atualizarQuantidadeCarrinho={updateCartQuantity}
          removerDoCarrinho={removeFromCart}
          formatMoney={formatMoney}
          totalCarrinho={cartTotal}
          handleCheckoutClick={handleCheckout}
        />
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default PublicMenu;