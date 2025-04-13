import React, { useState, useEffect } from 'react';
import {
  Box, Snackbar, Alert, FormControlLabel, Checkbox, MenuItem, TextField, Typography
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import api from '../services/api';
import CartSidebar from '../components/CartSidebar';  
import ItemGrid from '../components/ItemGrid';  
import CategoryTabs from '../components/CategoryTabs';
import CheckoutDialog from '../components/CheckoutDialog'; // Import the new component

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
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(true);
  const [isBusinessWorker, setIsBusinessWorker] = useState(false);
  const drawerWidth = 400;

  // Busca informações sobre as comandas
  const [comandasAbertas, setComandasAbertas] = useState([]);
  const [selectedComanda, setSelectedComanda] = useState(null);

  const [isLoading, setIsLoading] = useState(true);

  // Function to fetch open commands
  const fetchComandas = async () => {
    try {
      const comandasRes = await api.get('/consumacoes/?status=aberto');
      if (Array.isArray(comandasRes)) {
        setComandasAbertas(comandasRes);
      } else {
        console.error('Unexpected comandas response format:', comandasRes);
      }
    } catch (error) {
      console.error('Error fetching comandas:', error);
      showSnackbar('Erro ao carregar comandas', 'error');
    }
  };

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
            categoriasData = categoriasRes;
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
            const itensData = itensRes;
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
        await fetchComandas();
  
      } catch (error) {
        console.error('Error in fetchData:', error);
        showSnackbar('Erro ao carregar dados', 'error');
      } finally {
        setIsLoading(false);
      }
    };
  
    fetchData();
  }, []);

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

  const handleComandaChange = (comandaId) => {
    setSelectedComanda(comandaId);
    
    if (comandaId && Array.isArray(comandasAbertas)) {
      const comanda = comandasAbertas.find(c => c.id === comandaId);
      if (comanda) {
        setQuarto(comanda.quarto);
        setIsBusinessWorker(comanda.tipo_cliente === 'funcionario');
        
        // Update cart prices
        setCarrinho(prevCarrinho => prevCarrinho.map(item => {
          const newPreco = comanda.tipo_cliente === 'funcionario' && item.preco_custo != null 
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
      // First filter by availability if checkbox is checked
      if (showOnlyAvailable && !item.disponivel) {
        return false;
      }
  
      // If no main category is selected, show all items
      if (!selectedCategories.mainCategoryId) {
        return true;
      }
  
      // If a subcategory is selected, show only items from that subcategory
      if (selectedCategories.subCategoryId) {
        return item.categoria === selectedCategories.subCategoryId;
      }
  
      // Show items that either belong to main category or its subcategories
      const itemCategory = categorias.find(cat => cat.id === item.categoria);
      const result = (
        item.categoria === selectedCategories.mainCategoryId || 
        itemCategory?.categoria_pai === selectedCategories.mainCategoryId
      );
      return result;
    });
  };

  const handleQuantidadeChange = (itemId, delta) => {
    setQuantidades(prev => ({
      ...prev,
      [itemId]: Math.max(1, prev[itemId] + delta)
    }));
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

  const handleCheckout = async (checkoutData) => {
    try {
      let consumacaoId = checkoutData.comandaId;
      
      // If no existing comanda is selected, create a new one
      if (!consumacaoId) {
        if (!checkoutData.quarto) {
          showSnackbar('Por favor informe o quarto', 'error');
          return;
        }
        
        // Create new comanda
        const novaComandaRes = await api.post('/consumacoes/', {
          quarto: checkoutData.quarto,
          nome_cliente: checkoutData.nomeCliente || '',
          status: 'aberto',
          tipo_cliente: checkoutData.isBusinessWorker ? 'funcionario' : 'hospede'
        });
        
        // Extract ID from the response
        consumacaoId = novaComandaRes.id;
      }
  
      // Add items one by one instead of batch
      for (const item of carrinho) {
        await api.post(`/consumacoes/${consumacaoId}/adicionar_item/`, {
          item_id: item.id,
          quantidade: item.quantidade,
          observacao: item.observacao || checkoutData.observacao || ''
        });
      }
  
      setCarrinho([]);
      setCheckoutOpen(false);
      showSnackbar('Pedido realizado com sucesso!');
      
      // Refresh comandas list
      fetchComandas();
    } catch (error) {
      console.error('Checkout error:', error);
      showSnackbar(error.response?.data?.detail || 'Erro ao realizar pedido', 'error');
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
      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
        <Typography variant="h6" color="primary">
          {precoEfetivo === '-' ? (
            <span>-</span>
          ) : (
            formatMoney(precoEfetivo)
          )}
        </Typography>
        {isBusinessWorker && item.preco_custo != null && (
          <Typography 
            variant="caption" 
            color="text.secondary" 
            sx={{ 
              mt: -0.5,
              lineHeight: 1,
              textWrap:'nowrap',
              overflow:'visible',
              fontSize:'9px'
            }}
          >
            (Preço funcionário)
          </Typography>
        )}
      </Box>
    );
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <Box 
        sx={{ 
          flexGrow: 1, 
          width: '90%',
          ml: 2,
        }}
      >
        {/* Settings and order selection */}
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
                      setSelectedComanda(null);
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
            value={selectedComanda ? selectedComanda.id : ''}
            onChange={(e) => {
              const comandaId = e.target.value;
              if (comandaId) {
                const comanda = comandasAbertas.find(c => c.id === comandaId);
                setSelectedComanda(comanda || null);
              } else {
                setSelectedComanda(null);
              }
            }}
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
        
        {/* Cards with products */}
        <ItemGrid 
          items={getFilteredItems()}
          handleQuantidadeChange={handleQuantidadeChange}
          quantidades={quantidades}
          adicionarAoCarrinho={adicionarAoCarrinho}
          renderPreco={renderPreco}
          isLoading={isLoading}
        />
      </Box>

      {/* Sidebar with itens list and total */}
      <CartSidebar 
        drawerWidth={drawerWidth}
        drawerOpen={drawerOpen}
        setDrawerOpen={setDrawerOpen}
        carrinho={carrinho}
        atualizarQuantidadeCarrinho={atualizarQuantidadeCarrinho}
        removerDoCarrinho={removerDoCarrinho}
        formatMoney={formatMoney}
        totalCarrinho={totalCarrinho}
        handleCheckoutClick={() => setCheckoutOpen(true)}
      />

      {/* Checkout dialog */}
      <CheckoutDialog
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        selectedComanda={selectedComanda}
        comandasAbertas={comandasAbertas}
        totalCarrinho={totalCarrinho}
        formatMoney={formatMoney}
        onCheckout={handleCheckout}
        isBusinessWorker={isBusinessWorker}
      />

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