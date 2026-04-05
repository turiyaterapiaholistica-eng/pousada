import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, TextField, Button, MenuItem,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Snackbar, Alert, IconButton, Divider, List, ListItem, ListItemText,
  Dialog, DialogTitle, DialogContent, DialogActions, ListItemButton,
  DialogContentText, FormControlLabel, Checkbox
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import ptBR from 'date-fns/locale/pt-BR';
import Grid from '@mui/material/Grid2';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import EditIcon from '@mui/icons-material/Edit';
import api from '../services/api';
import { formatMoney } from '../utils/formatters';

const ComprasPage = () => {
  // Estados
  const [fornecedores, setFornecedores] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [categoriasPai, setCategoriasPai] = useState([]);
  const [categoriasFilho, setCategoriasFilho] = useState([]);
  const [itensCardapio, setItensCardapio] = useState([]);
  const [itensFiltrados, setItensFiltrados] = useState([]);
  const [compras, setCompras] = useState([]);
  const [compraAtual, setCompraAtual] = useState(null);
  const [carrinhoCompra, setCarrinhoCompra] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [novoFornecedor, setNovoFornecedor] = useState({
    nome: '',
    telefone: '',
    cidade: ''
  });
  const [openFornecedorDialog, setOpenFornecedorDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFornecedor, setSelectedFornecedor] = useState(null);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [compraParaExcluir, setCompraParaExcluir] = useState(null);
  const [modoEdicao, setModoEdicao] = useState(false);
  
  // Estados para controle de caixas
  const [isCaixa, setIsCaixa] = useState(false);
  const [unidadesPorCaixa, setUnidadesPorCaixa] = useState(24);
  
  // Dados do formulário
  const [formData, setFormData] = useState({
    fornecedor: '',
    data: new Date(),
    nota_fiscal: '',
    observacao: '',
    fornecedores: [] // Incluir fornecedores no formData
  });
  
  // Dados do item sendo adicionado
  const [itemAtual, setItemAtual] = useState({
    categoriaPai: '',
    categoria: '',
    item: '',
    quantidade: 1,
    unidade: 'un',
    valor_unitario: ''
  });
  
  // Effect hooks
  useEffect(() => {
    fetchFornecedores();
    fetchCategorias();
    fetchItensCardapio();
    fetchCompras();
  }, []);
  
  useEffect(() => {
    // Chamar fetchCompras quando o fornecedor selecionado mudar
    fetchCompras();
  }, [selectedFornecedor]);

  useEffect(() => {
    // Filtrar categorias pai e filhas
    if (categorias.length > 0) {
      const catPai = categorias.filter(cat => cat.categoria_pai === null);
      setCategoriasPai(catPai);
    }
  }, [categorias]);

  useEffect(() => {
    // Filtrar categorias filhas baseado na categoria pai selecionada
    if (itemAtual.categoriaPai && categorias.length > 0) {
      const catFilhas = categorias.filter(cat => 
        cat.categoria_pai === parseInt(itemAtual.categoriaPai)
      );
      setCategoriasFilho(catFilhas);
      
      // Limpar seleção de categoria filho quando muda o pai
      setItemAtual({
        ...itemAtual,
        categoria: '',
        item: ''
      });
      setItensFiltrados([]);
    } else {
      setCategoriasFilho([]);
    }
  }, [itemAtual.categoriaPai, categorias]);

  useEffect(() => {
    // Filtrar itens pela categoria selecionada
    if (itemAtual.categoria) {
      const itensDaCategoria = itensCardapio.filter(
        item => item.categoria === parseInt(itemAtual.categoria)
      );
      setItensFiltrados(itensDaCategoria);
      
      // Limpar seleção de item quando muda a categoria
      setItemAtual({
        ...itemAtual,
        item: ''
      });
    } else {
      setItensFiltrados([]);
    }
  }, [itemAtual.categoria, itensCardapio]);

  // Funções para buscar dados da API
  const fetchFornecedores = async () => {
    try {
      const data = await api.get('/fornecedores/');
      console.log('Fornecedores carregados:', data);
      setFornecedores(Array.isArray(data) ? data : []);
      
      // Atualizar também no formData
      setFormData(prev => ({...prev, fornecedores: Array.isArray(data) ? data : []}));
    } catch (error) {
      console.error('Erro ao carregar fornecedores:', error);
      setFornecedores([]);
      showSnackbar('Erro ao carregar fornecedores', 'error');
    }
  };

  const fetchCategorias = async () => {
    try {
      const data = await api.get('/categorias/');
      setCategorias(data);
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
      showSnackbar('Erro ao carregar categorias', 'error');
    }
  };

  const fetchItensCardapio = async () => {
    try {
      const data = await api.get('/itens/');
      setItensCardapio(data);
    } catch (error) {
      console.error('Erro ao carregar itens do cardápio:', error);
      showSnackbar('Erro ao carregar itens', 'error');
    }
  };

  const fetchCompras = async () => {
    setIsLoading(true);
    try {
      let url = '/compras/';
      const params = [];
      
      // Somente filtra por fornecedor se um estiver selecionado
      if (selectedFornecedor) {
        params.push(`fornecedor=${selectedFornecedor}`);
      }
      
      if (params.length > 0) {
        url += '?' + params.join('&');
      }
      
      console.log('Buscando compras na URL:', url);
      const data = await api.get(url);
      setCompras(data);
    } catch (error) {
      console.error('Erro ao carregar compras:', error);
      showSnackbar('Erro ao carregar compras', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Funções para gerenciar compras
  const handleOpenCompra = (compra) => {
    setCompraAtual(compra);
    setModoEdicao(false);
    setOpenDialog(true);
  };

  const handleEditarCompra = (compra) => {
    setCompraAtual(compra);
    setModoEdicao(true);
    
    // Carregar dados da compra para o formulário
    setFormData({
      fornecedor: compra.fornecedor,
      data: compra.data ? new Date(compra.data) : new Date(),
      nota_fiscal: compra.nota_fiscal || '',
      observacao: compra.observacao || '',
      fornecedores: fornecedores // Manter a referência aos fornecedores
    });
    
    // Preparar carrinho de compras com os itens existentes
    const itensCarrinho = compra.itens.map(item => ({
      id: item.id,
      item: item.item,
      item_nome: item.item_nome,
      categoria: item.categoria || '',
      categoria_nome: item.categoria_nome || '',
      quantidade: item.quantidade,
      unidade: item.unidade,
      valor_unitario: item.valor_unitario
    }));
    
    setCarrinhoCompra(itensCarrinho);
    setOpenDialog(true);
  };

  const handleNovaCompra = () => {
    setCompraAtual(null);
    setModoEdicao(false);
    setCarrinhoCompra([]);
    setFormData({
      fornecedor: '',
      data: new Date(),
      nota_fiscal: '',
      observacao: '',
      fornecedores: fornecedores // Incluir fornecedores no formData
    });
    setItemAtual({
      categoriaPai: '',
      categoria: '',
      item: '',
      quantidade: 1,
      unidade: 'un',
      valor_unitario: ''
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCompraAtual(null);
    setCarrinhoCompra([]);
    setModoEdicao(false);
  };

  const handleConfirmDeleteCompra = (compra) => {
    setCompraParaExcluir(compra);
    setOpenDeleteDialog(true);
  };

  const handleDeleteCompra = async () => {
    if (!compraParaExcluir) return;
    
    try {
      await api.delete(`/compras/${compraParaExcluir.id}/`);
      showSnackbar('Compra excluída com sucesso');
      fetchCompras();
      setOpenDeleteDialog(false);
      setCompraParaExcluir(null);
    } catch (error) {
      console.error('Erro ao excluir compra:', error);
      showSnackbar('Erro ao excluir compra', 'error');
    }
  };

  // Funções para gerenciar fornecedores
  const handleAdicionarFornecedor = async () => {
    console.log('Adicionando fornecedor:', novoFornecedor);
    if (!novoFornecedor.nome.trim()) {
      showSnackbar('Nome do fornecedor é obrigatório', 'error');
      return;
    }
    
    try {
      // Log para depuração
      console.log('Enviando dados para a API:', { nome: novoFornecedor.nome });
      
      const novoFornecedorObj = await api.post('/fornecedores/', { 
        nome: novoFornecedor.nome,
      });
      
      // Verifique se a resposta está correta
      console.log('Resposta da API:', novoFornecedorObj);
      
      // Atualize a lista de fornecedores e recarregue-a do servidor
      setFornecedores(prev => [...prev, novoFornecedorObj]);
      
      // Adicione esta linha para recarregar os fornecedores do servidor após adicionar um novo
      await fetchFornecedores();
      
      setFormData({ ...formData, fornecedor: novoFornecedorObj.id });
      setNovoFornecedor({
        nome: '',
        telefone: '',
        cidade: ''
      });
      setOpenFornecedorDialog(false);
      showSnackbar('Fornecedor adicionado com sucesso');
    } catch (error) {
      console.error('Erro ao adicionar fornecedor:', error);
      showSnackbar('Erro ao adicionar fornecedor', 'error');
    }
  };

  // Funções para gerenciar o formulário
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleNovoFornecedorChange = (e) => {
    const { name, value } = e.target;
    setNovoFornecedor({ ...novoFornecedor, [name]: value });
  };

  const handleItemChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'item' && value) {
      // Carregar preço padrão se disponível
      const itemSelecionado = itensCardapio.find(item => item.id === parseInt(value));
      if (itemSelecionado && itemSelecionado.preco_compra) {
        setItemAtual({ 
          ...itemAtual, 
          [name]: value,
          valor_unitario: itemSelecionado.preco_compra
        });
        return;
      }
    }
    
    setItemAtual({ ...itemAtual, [name]: value });
  };

  // Funções para gerenciar o carrinho de compras
  const adicionarItemAoCarrinho = () => {
    if (!itemAtual.item || !itemAtual.quantidade || !itemAtual.valor_unitario) {
      showSnackbar('Preencha todos os campos do item', 'error');
      return;
    }
    
    // Encontrar nome do item para exibição
    const itemId = parseInt(itemAtual.item);
    const itemInfo = itensCardapio.find(i => i.id === itemId);
    
    if (!itemInfo) {
      showSnackbar('Item não encontrado', 'error');
      return;
    }
    
    // Verifica se é uma caixa
    if (isCaixa) {
      // Adiciona o item como caixa
      const novoCaixaItem = {
        ...itemAtual,
        id: `caixa-${Date.now()}`, // ID temporário para gerenciar o carrinho
        item: itemId,
        item_nome: `${itemInfo.nome} (Caixa com ${unidadesPorCaixa} unidades)`,
        categoria_nome: itemInfo.categoria_nome,
        unidade: 'cx',
        isCaixa: true,
        unidadesPorCaixa: unidadesPorCaixa
      };
      
      setCarrinhoCompra([...carrinhoCompra, novoCaixaItem]);
      
      // Agora adiciona as unidades individuais automaticamente
      const valorUnitario = parseFloat(itemAtual.valor_unitario) / unidadesPorCaixa;
      
      const novoItemUnidade = {
        ...itemAtual,
        id: `unidade-${Date.now()}`, // ID temporário para gerenciar o carrinho
        item: itemId,
        item_nome: `${itemInfo.nome} (Unidade)`,
        categoria_nome: itemInfo.categoria_nome,
        quantidade: unidadesPorCaixa * itemAtual.quantidade, // Multiplica pela quantidade de caixas
        unidade: 'un',
        valor_unitario: valorUnitario
      };
      
      setCarrinhoCompra(prev => [...prev, novoItemUnidade]);
    } else {
      // Adiciona o item normalmente
      const novoItem = {
        ...itemAtual,
        id: Date.now(), // ID temporário para gerenciar o carrinho
        item: itemId,
        item_nome: itemInfo.nome,
        categoria_nome: itemInfo.categoria_nome
      };
      
      setCarrinhoCompra([...carrinhoCompra, novoItem]);
    }
    
    // Limpar formulário para novo item, mantendo as categorias
    setItemAtual({
      ...itemAtual,
      item: '',
      quantidade: 1,
      valor_unitario: ''
    });
  };

  const removerItemDoCarrinho = (id) => {
    setCarrinhoCompra(carrinhoCompra.filter(item => item.id !== id));
  };

  const calcularTotalCarrinho = () => {
    return carrinhoCompra.reduce((total, item) => {
      return total + (parseFloat(item.quantidade) * parseFloat(item.valor_unitario));
    }, 0);
  };

  // Função para criar ou atualizar compra
  const handleCriarCompra = async () => {
    if (!formData.fornecedor) {
      showSnackbar('Selecione um fornecedor', 'error');
      return;
    }
    
    if (carrinhoCompra.length === 0) {
      showSnackbar('Adicione pelo menos um item à compra', 'error');
      return;
    }
     
    try {
      if (modoEdicao && compraAtual) {
        // Atualização de compra existente

        const newDate = new Date(formData.data);
        newDate.setHours(0, 0, 0, 0); // Set time to midnight

        const dadosAtualizados = {
          fornecedor: formData.fornecedor,
          nota_fiscal: formData.nota_fiscal,
          observacao: formData.observacao,
          // Preserve a hora quando passamos uma nova data
          data: newDate.toISOString()
        };
        
        // Atualizar dados básicos da compra
        await api.patch(`/compras/${compraAtual.id}/`, dadosAtualizados);
        
        // Itens existentes na compra (antes da edição)
        const itensOriginais = compraAtual.itens || [];
        
        // Itens que foram removidos
        const itensRemovidos = itensOriginais.filter(
          itemOriginal => !carrinhoCompra.some(item => item.id === itemOriginal.id)
        );
        
        if (itensRemovidos.length > 0) {
          console.log('Itens removidos:', itensRemovidos);
          showSnackbar('A remoção de itens não está disponível. Os itens originais serão mantidos.', 'warning');
        }
        
        // Itens novos (estão no carrinho mas não estavam nos originais)
        const itensNovos = carrinhoCompra.filter(
          item => !itensOriginais.some(itemOriginal => itemOriginal.id === item.id) || 
                  !Number.isInteger(item.id) || 
                  item.id >= 1000000000 ||
                  typeof item.id === 'string'
        );
        
        // Se existem itens novos, adicionamos eles à compra
        if (itensNovos.length > 0) {
          const itensFormatados = itensNovos.map(item => ({
            item: parseInt(item.item),
            quantidade: item.quantidade,
            unidade: item.unidade,
            valor_unitario: item.valor_unitario
          }));
          
          await api.post(`/compras/${compraAtual.id}/adicionar_item/`, {
            itens: itensFormatados
          });
        }
        
        // Itens modificados
        const itensModificados = carrinhoCompra.filter(itemCarrinho => {
          if (Number.isInteger(itemCarrinho.id) && itemCarrinho.id < 1000000000) {
            const itemOriginal = itensOriginais.find(item => item.id === itemCarrinho.id);
            if (itemOriginal) {
              return (
                itemCarrinho.quantidade !== itemOriginal.quantidade ||
                itemCarrinho.valor_unitario !== itemOriginal.valor_unitario ||
                itemCarrinho.unidade !== itemOriginal.unidade
              );
            }
          }
          return false;
        });
        
        if (itensModificados.length > 0) {
          console.log('Itens modificados:', itensModificados);
          showSnackbar('A modificação de itens existentes não está disponível no momento.', 'warning');
        }
        
        showSnackbar('Compra atualizada com sucesso');
        handleCloseDialog();
        fetchCompras();
      } else {
        // Criar nova compra
        const newDate = new Date(formData.data);
        newDate.setHours(0, 0, 0, 0); // Set time to midnight
        
        const compraData = {
          ...formData,
          data: newDate.toISOString()
        };
        
        const response = await api.post('/compras/', compraData);
        console.log('Resposta da API após criar compra:', response);
        
        // Tratar o resultado de forma consistente
        const novaCompra = response.data || response;
        
        // Verificar se temos um ID válido
        if (!novaCompra || !novaCompra.id) {
          console.error('Erro: Compra criada sem ID válido', novaCompra);
          showSnackbar('Erro ao registrar compra: dados inválidos', 'error');
          return;
        }
  
        // Adicionar itens à compra
        const itensFormatados = carrinhoCompra.map(item => ({
          item: parseInt(item.item),
          quantidade: item.quantidade,
          unidade: item.unidade,
          valor_unitario: item.valor_unitario
        }));
        
        await api.post(`/compras/${novaCompra.id}/adicionar_item/`, {
          itens: itensFormatados
        });
        
        showSnackbar('Compra registrada com sucesso');
        handleCloseDialog();
        fetchCompras();
      }
    } catch (error) {
      console.error('Erro ao registrar compra:', error);
      showSnackbar('Erro ao registrar compra', 'error');
    }
  };

  const handleCaixaChange = (e) => {
    setIsCaixa(e.target.checked);
    
    // Se desmarcou a opção de caixa, voltar para unidade normal
    if (!e.target.checked) {
      setItemAtual(prev => ({
        ...prev,
        unidade: 'un'
      }));
    } else {
      setItemAtual(prev => ({
        ...prev,
        unidade: 'cx'
      }));
    }
  };

  const handleUnidadesPorCaixaChange = (e) => {
    setUnidadesPorCaixa(Number(e.target.value));
  };

  const handleSelectFornecedor = (id) => {
    if (selectedFornecedor === id) {
      setSelectedFornecedor(null);
    } else {
      setSelectedFornecedor(id);
    }
  };

  // Função auxiliar para exibir snackbar
  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
      <Box sx={{ display: 'flex', height: 'calc(100vh - 120px)' }}>
        {/* Sidebar de fornecedores */}
        <Paper sx={{ 
          width: '250px', 
          mr: 2, 
          display: 'flex', 
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Typography variant="h6">Fornecedores</Typography>
          </Box>
          
          <List sx={{ overflow: 'auto', flex: 1 }}>
              {Array.isArray(fornecedores) && fornecedores.length > 0 ? (
                  fornecedores.map((fornecedor) => (
                  <ListItemButton
                      key={fornecedor.id}
                      selected={selectedFornecedor === fornecedor.id}
                      onClick={() => handleSelectFornecedor(fornecedor.id)}
                  >
                      <ListItemText primary={fornecedor.nome || 'Sem nome'} />
                  </ListItemButton>
                  ))
              ) : (
                  <ListItem key="empty">
                  <ListItemText primary="Nenhum fornecedor cadastrado" />
                  </ListItem>
              )}
          </List>
          
          <Divider />
          <Box sx={{ p: 2 }}>
            <Button
              variant="contained"
              startIcon={<PersonAddIcon />}
              onClick={() => setOpenFornecedorDialog(true)}
              fullWidth
            >
              Novo Fornecedor
            </Button>
          </Box>
        </Paper>
        
        {/* Conteúdo principal */}
        <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            mb: 2
          }}>
            <Typography variant="h5">
              Gerenciamento de Compras
              {selectedFornecedor && (
                <Typography component="span" variant="subtitle1" sx={{ ml: 1, fontStyle: 'italic' }}>
                  (Filtrado por fornecedor)
                </Typography>
              )}
            </Typography>
            
            <Button 
              variant="contained" 
              startIcon={<AddIcon />}
              onClick={handleNovaCompra}
            >
              Nova Compra
            </Button>
          </Box>
          
          {/* Lista de Compras */}
          <TableContainer component={Paper} sx={{ flexGrow: 1, overflow: 'auto' }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Data</TableCell>
                  <TableCell>Fornecedor</TableCell>
                  <TableCell>Nota Fiscal</TableCell>
                  <TableCell align="right">Valor Total</TableCell>
                  <TableCell>Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      Carregando...
                    </TableCell>
                  </TableRow>
                ) : Array.isArray(compras) && compras.length > 0 ? (
                  compras.map((compra) => (
                    <TableRow key={compra.id}>
                      <TableCell>
                        {formatDate(compra.data)}
                      </TableCell>
                      <TableCell>{compra.fornecedor_nome}</TableCell>
                      <TableCell>{compra.nota_fiscal || '-'}</TableCell>
                      <TableCell align="right">{formatMoney(compra.valor_total)}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button 
                            size="small" 
                            variant="outlined"
                            onClick={() => handleOpenCompra(compra)}
                          >
                            Detalhes
                          </Button>
                          <IconButton 
                            color="primary"
                            onClick={() => handleEditarCompra(compra)}
                            title="Editar compra"
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton 
                            color="error"
                            onClick={() => handleConfirmDeleteCompra(compra)}
                            title="Excluir compra"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      Nenhuma compra encontrada
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
        
        {/* Modal de Nova Compra/Detalhes de Compra */}
        <Dialog 
          open={openDialog} 
          onClose={handleCloseDialog}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle sx={{ pb: 1 }}>
            {compraAtual 
              ? (modoEdicao ? 'Editar Compra' : 'Detalhes da Compra') 
              : 'Nova Compra'}
          </DialogTitle>
          <DialogContent dividers>
            {compraAtual && !modoEdicao ? (
              // Modo visualização
              <Box>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" color="text.secondary">
                      Fornecedor
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                      {compraAtual.fornecedor_nome}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" color="text.secondary">
                      Data
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                      {formatDate(compraAtual.data)}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" color="text.secondary">
                      Nota Fiscal
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                      {compraAtual.nota_fiscal || '-'}
                    </Typography>
                  </Grid>
                  {compraAtual.observacao && (
                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary">
                        Observação
                      </Typography>
                      <Typography variant="body1">
                        {compraAtual.observacao}
                      </Typography>
                    </Grid>
                  )}
                </Grid>
                
                <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>
                  Itens da Compra
                </Typography>
                <TableContainer sx={{ maxHeight: '400px' }}>
                  <Table stickyHeader size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Item</TableCell>
                        <TableCell>Categoria</TableCell>
                        <TableCell align="right">Quantidade</TableCell>
                        <TableCell align="right">Valor Unitário</TableCell>
                        <TableCell align="right">Subtotal</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {compraAtual.itens.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.item_nome}</TableCell>
                          <TableCell>{item.categoria_nome}</TableCell>
                          <TableCell align="right">
                            {item.quantidade} {item.unidade}
                          </TableCell>
                          <TableCell align="right">
                            {formatMoney(item.valor_unitario)}
                          </TableCell>
                          <TableCell align="right">
                            {formatMoney(item.quantidade * item.valor_unitario)}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow>
                        <TableCell colSpan={4} align="right" sx={{ fontWeight: 'bold' }}>
                          Total:
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                          {formatMoney(compraAtual.valor_total)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            ) : (
              // Modo criação ou edição
              <Box>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      select
                      label="Fornecedor"
                      name="fornecedor"
                      value={formData.fornecedor}
                      onChange={handleInputChange}
                      required
                      sx={{ 
                        mb: 2,
                        '& .MuiInputBase-root': {
                          minHeight: '56px'
                        },
                        width: '250px'
                      }}
                    >
                      <MenuItem value="">Selecione um fornecedor</MenuItem>
                      {Array.isArray(fornecedores) ? (
                          fornecedores.length > 0 ? (
                          fornecedores.map((fornecedor) => (
                              <MenuItem key={fornecedor.id} value={fornecedor.id}>
                              {fornecedor.nome || `Fornecedor ID: ${fornecedor.id}`}
                              </MenuItem>
                          ))
                          ) : (
                          <MenuItem value="" disabled>Nenhum fornecedor encontrado</MenuItem>
                          )
                      ) : (
                          <MenuItem value="" disabled>Erro ao carregar fornecedores</MenuItem>
                      )}
                    </TextField>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <DatePicker
                      label="Data da Compra"
                      value={formData.data}
                      onChange={(newDate) => setFormData({...formData, data: newDate})}
                      sx={{ width: '200px' }}
                      renderInput={(params) => <TextField {...params} />}
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField
                      label="Nota Fiscal"
                      name="nota_fiscal"
                      value={formData.nota_fiscal}
                      onChange={handleInputChange}
                      sx={{
                        width: '200px',
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} md={12}>
                    <TextField
                      label="Observação"
                      name="observacao"
                      value={formData.observacao}
                      onChange={handleInputChange}
                      multiline
                      rows={1}
                      sx={{
                        width: '100%',
                      }}
                    />
                  </Grid>
                </Grid>
                
                <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>
                  Adicionar Itens
                </Typography>
                
                <Grid container spacing={3} mb={2} width={'100%'}>
                  {/* Ajustei os tamanhos dos comboboxes para melhor distribuição do espaço */}
                  <Grid item xs={12} md={5}>
                    <TextField
                      select
                      label="Categoria Principal"
                      name="categoriaPai"
                      value={itemAtual.categoriaPai}
                      onChange={handleItemChange}
                      fullWidth
                      required
                      sx={{ 
                        '& .MuiInputBase-root': {
                          minHeight: '56px'
                        },
                        width: '200px'
                      }}
                    >
                      <MenuItem value="">Selecione uma categoria</MenuItem>
                      {categoriasPai.map((categoria) => (
                        <MenuItem key={categoria.id} value={categoria.id}>
                          {categoria.nome}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      select
                      label="Subcategoria"
                      name="categoria"
                      value={itemAtual.categoria}
                      onChange={handleItemChange}
                      required
                      disabled={!itemAtual.categoriaPai}
                      sx={{ 
                        '& .MuiInputBase-root': {
                          minHeight: '56px'
                        },
                        width: '200px'
                      }}
                    >
                      <MenuItem value="">Selecione uma subcategoria</MenuItem>
                      {categoriasFilho.map((categoria) => (
                        <MenuItem key={categoria.id} value={categoria.id}>
                          {categoria.nome}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField
                      select
                      label="Item"
                      name="item"
                      value={itemAtual.item}
                      onChange={handleItemChange}
                      required
                      fullWidth
                      disabled={!itemAtual.categoria}
                      sx={{ 
                        '& .MuiInputBase-root': {
                          minHeight: '56px'
                        },
                        width: '200px'
                      }}
                    >
                      <MenuItem value="">Selecione um item</MenuItem>
                      {itensFiltrados.map((item) => (
                        <MenuItem key={item.id} value={item.id}>
                          {item.nome}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                </Grid>

                <Grid container spacing={3}>
                  <Grid item xs={12} md={2}>
                    <TextField
                      label="Quantidade"
                      name="quantidade"
                      type="number"
                      value={itemAtual.quantidade}
                      onChange={handleItemChange}
                      fullWidth
                      required
                      inputProps={{ min: 0.001, step: 0.001 }}
                      sx={{ height: '100%' }}
                    />
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <TextField
                      select
                      label="Unidade"
                      name="unidade"
                      value={itemAtual.unidade}
                      onChange={handleItemChange}
                      fullWidth
                      required
                      sx={{ height: '100%' }}
                      SelectProps={{
                        MenuProps: {
                          style: { maxHeight: 300 },
                        },
                      }}
                    >
                      <MenuItem value="un">Un</MenuItem>
                      <MenuItem value="kg">Kg</MenuItem>
                      <MenuItem value="g">g</MenuItem>
                      <MenuItem value="l">L</MenuItem>
                      <MenuItem value="ml">mL</MenuItem>
                      <MenuItem value="cx">Cx</MenuItem>
                      <MenuItem value="pct">Pct</MenuItem>
                    </TextField>
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <TextField
                      label="Valor Unitário (R$)"
                      name="valor_unitario"
                      type="number"
                      value={itemAtual.valor_unitario}
                      onChange={handleItemChange}
                      fullWidth
                      required
                      inputProps={{ min: 0.01, step: 0.01 }}
                      sx={{ height: '100%' }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={3}>
                    <FormControlLabel 
                      control={
                        <Checkbox 
                          checked={isCaixa} 
                          onChange={handleCaixaChange} 
                        />
                      } 
                      label="É uma caixa?" 
                      sx={{ height: '100%' }}
                    />
                    
                    {isCaixa && (
                      <TextField
                        label="Unidades por caixa"
                        type="number"
                        value={unidadesPorCaixa}
                        onChange={handleUnidadesPorCaixaChange}
                        sx={{ ml: 2, width: '120px' }}
                        inputProps={{ min: 1, step: 1 }}
                      />
                    )}
                  </Grid>
                  
                  <Grid item xs={12} md={3}>
                    <Button
                      variant="contained"
                      onClick={adicionarItemAoCarrinho}
                      fullWidth
                      sx={{ height: '56px' }}
                      startIcon={<AddIcon />}
                    >
                      Adicionar
                    </Button>
                  </Grid>
                </Grid>
                
                <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>
                  Itens da Compra
                </Typography>
                
                {carrinhoCompra.length > 0 ? (
                  <TableContainer sx={{ maxHeight: '300px' }}>
                    <Table stickyHeader size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Item</TableCell>
                          <TableCell>Categoria</TableCell>
                          <TableCell align="right">Quantidade</TableCell>
                          <TableCell align="right">Valor Unitário</TableCell>
                          <TableCell align="right">Subtotal</TableCell>
                          <TableCell></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {carrinhoCompra.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>{item.item_nome}</TableCell>
                            <TableCell>{item.categoria_nome}</TableCell>
                            <TableCell align="right">
                              {item.quantidade} {item.unidade}
                            </TableCell>
                            <TableCell align="right">
                              {formatMoney(item.valor_unitario)}
                            </TableCell>
                            <TableCell align="right">
                              {formatMoney(item.quantidade * item.valor_unitario)}
                            </TableCell>
                            <TableCell align="right">
                              <IconButton 
                                size="small" 
                                onClick={() => removerItemDoCarrinho(item.id)}
                                color="error"
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                        <TableRow>
                          <TableCell colSpan={4} align="right" sx={{ fontWeight: 'bold' }}>
                            Total:
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 'bold' }} colSpan={2}>
                            {formatMoney(calcularTotalCarrinho())}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'rgba(0,0,0,0.03)' }}>
                    <Typography color="text.secondary">
                      Nenhum item adicionado
                    </Typography>
                  </Paper>
                )}
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>
              {compraAtual && !modoEdicao ? 'Fechar' : 'Cancelar'}
            </Button>
            {(!compraAtual || modoEdicao) && (
              <Button 
                onClick={handleCriarCompra} 
                variant="contained"
                startIcon={<SaveIcon />}
                disabled={carrinhoCompra.length === 0}
              >
                {modoEdicao ? 'Atualizar Compra' : 'Salvar Compra'}
              </Button>
            )}
          </DialogActions>
        </Dialog>
        
        {/* Dialog para adicionar fornecedor */}
        <Dialog 
          open={openFornecedorDialog}
          onClose={() => setOpenFornecedorDialog(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Novo Fornecedor</DialogTitle>
          <DialogContent dividers>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  autoFocus
                  label="Nome do Fornecedor"
                  name="nome"
                  fullWidth
                  value={novoFornecedor.nome}
                  onChange={handleNovoFornecedorChange}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Telefone"
                  name="telefone"
                  fullWidth
                  value={novoFornecedor.telefone}
                  onChange={handleNovoFornecedorChange}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Cidade"
                  name="cidade"
                  fullWidth
                  value={novoFornecedor.cidade}
                  onChange={handleNovoFornecedorChange}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenFornecedorDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleAdicionarFornecedor} 
              variant="contained"
              disabled={!novoFornecedor.nome}
            >
              Adicionar
            </Button>
          </DialogActions>
        </Dialog>
        
        {/* Dialog de confirmação de exclusão */}
        <Dialog
          open={openDeleteDialog}
          onClose={() => setOpenDeleteDialog(false)}
        >
          <DialogTitle>Confirmar Exclusão</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Tem certeza que deseja excluir esta compra? Esta ação não pode ser desfeita.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDeleteDialog(false)}>Cancelar</Button>
            <Button onClick={handleDeleteCompra} color="error" variant="contained">
              Excluir
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
    </LocalizationProvider>
  );
};

export default ComprasPage;