import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, TextField, Button, MenuItem, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Snackbar, Alert, IconButton, Switch, FormControlLabel, Checkbox,
  Dialog, DialogTitle, DialogContent, DialogActions, Avatar, Chip
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import ImageIcon from '@mui/icons-material/Image';
import SearchIcon from '@mui/icons-material/Search';
import api from '../services/api';
import { formatMoney } from '../utils/formatters';

const ItemManagementPage = () => {
  // Estados
  const [items, setItems] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [subcategorias, setSubcategorias] = useState([]);
  const [fornecedores, setFornecedores] = useState([]);
  const [estoque, setEstoque] = useState({});
  const [openDialog, setOpenDialog] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [openImageDialog, setOpenImageDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [isLoading, setIsLoading] = useState(false);
  
  
  // Filtros
  const [filtros, setFiltros] = useState({
    categoria: '',
    fornecedor: '',
    disponivel: 'todos',
    venda: 'todos',
    searchTerm: ''
  });
  
  // Form data
  const [formData, setFormData] = useState({
    id: null,
    nome: '',
    descricao: '',
    preco: '',
    preco_custo: '',
    preco_compra: '',
    categoriaPai: '',
    categoria: '',
    disponivel: true,
    venda: true,
    imagem: null
  });

  // Effect hooks
  useEffect(() => {
    fetchItems();
    fetchCategorias();
    fetchFornecedores();
    fetchEstoque();
  }, []);
  
  // Funções para buscar dados da API
  const fetchItems = async () => {
    setIsLoading(true);
    try {
      const data = await api.get('/itens/');
      setItems(data);
    } catch (error) {
      console.error('Erro ao carregar itens:', error);
      showSnackbar('Erro ao carregar itens', 'error');
    } finally {
      setIsLoading(false);
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

  const fetchFornecedores = async () => {
    try {
      const data = await api.get('/fornecedores/');
      setFornecedores(data);
    } catch (error) {
      console.error('Erro ao carregar fornecedores:', error);
      showSnackbar('Erro ao carregar fornecedores', 'error');
    }
  };

  const fetchEstoque = async () => {
    try {
      const data = await api.get('/estoque/');
      const estoqueMap = {};
      data.forEach(item => {
        estoqueMap[item.item] = item;
      });
      setEstoque(estoqueMap);
    } catch (error) {
      console.error('Erro ao carregar estoque:', error);
      showSnackbar('Erro ao carregar estoque', 'error');
    }
  };

  // Funções de filtro
  const getFilteredItems = () => {
    return items.filter(item => {
      // Filtro por categoria
      if (filtros.categoria && item.categoria !== parseInt(filtros.categoria)) {
        return false;
      }
      
      // Filtro por disponibilidade
      if (filtros.disponivel === 'disponivel' && !item.disponivel) {
        return false;
      }
      if (filtros.disponivel === 'indisponivel' && item.disponivel) {
        return false;
      }
      
      // Filtro por tipo (venda/compra)
      if (filtros.venda === 'venda' && !item.venda) {
        return false;
      }
      if (filtros.venda === 'compra' && item.venda) {
        return false;
      }
      
      // Filtro por termo de busca
      if (filtros.searchTerm) {
        const searchLower = filtros.searchTerm.toLowerCase();
        return (
          item.nome.toLowerCase().includes(searchLower) ||
          item.descricao.toLowerCase().includes(searchLower)
        );
      }
      
      return true;
    });
  };

  // Funções do formulário
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const resetForm = () => {
    setFormData({
      id: null,
      nome: '',
      descricao: '',
      preco: '',
      preco_custo: '',
      preco_compra: '',
      categoria: '',
      disponivel: true,
      venda: true,
      imagem: null
    });
    setSelectedFile(null);
    setImagePreview('');
  };

  // Função para criar/editar item
  const handleSaveItem = async () => {
    // Validação
    if (!formData.nome || !formData.categoria) {
      showSnackbar('Preencha os campos obrigatórios: nome e categoria', 'error');
      return;
    }
    
    try {
      let response;
      
      // Preparar dados para envio
      const itemData = {
        ...formData,
        preco: formData.preco || null,
        preco_custo: formData.preco_custo || null,
        preco_compra: formData.preco_compra || null
      };
      
      if (editingItem) {
        // Atualizar item existente
        response = await api.patch(`/itens/${editingItem.id}/`, itemData);
      } else {
        // Criar novo item
        response = await api.post('/itens/', itemData);
      }
      
      // Atualizar imagem se selecionada
      if (selectedFile && response) {
        const formData = new FormData();
        formData.append('imagem', selectedFile);
        
        await api.post(`/itens/${response.id}/upload_image/`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
      }
      
      showSnackbar(
        editingItem ? 'Item atualizado com sucesso' : 'Item criado com sucesso',
        'success'
      );
      
      // Recarregar dados
      fetchItems();
      resetForm();
      setOpenDialog(false);
      
    } catch (error) {
      console.error('Erro ao salvar item:', error);
      showSnackbar('Erro ao salvar item', 'error');
    }
  };

  // Função para editar uma imagem
  const handleEditImage = async () => {
    if (!selectedFile || !editingItem) {
      showSnackbar('Selecione um arquivo e um item', 'error');
      return;
    }
    
    try {
      const formData = new FormData();
      formData.append('imagem', selectedFile);
      
      await api.post(`/itens/${editingItem.id}/upload_image/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      showSnackbar('Imagem atualizada com sucesso', 'success');
      fetchItems();
      setOpenImageDialog(false);
      setSelectedFile(null);
      setImagePreview('');
      
    } catch (error) {
      console.error('Erro ao atualizar imagem:', error);
      showSnackbar('Erro ao atualizar imagem', 'error');
    }
  };

  // Funções de diálogo
  const handleOpenNewItem = () => {
    resetForm();
    setEditingItem(null);
    setOpenDialog(true);
  };

  const handleOpenEditItem = (item) => {
    setEditingItem(item);
    
    // Encontrar a categoria pai
    let categoriaPai = '';
    if (item.categoria) {
      const categoriaItem = categorias.find(cat => cat.id === item.categoria);
      if (categoriaItem && categoriaItem.categoria_pai) {
        categoriaPai = categoriaItem.categoria_pai;
        
        // Atualizar subcategorias disponíveis
        const subs = categorias.filter(cat => cat.categoria_pai === categoriaPai);
        setSubcategorias(subs);
      }
    }
    
    setFormData({
      id: item.id,
      nome: item.nome,
      descricao: item.descricao || '',
      preco: item.preco || '',
      preco_custo: item.preco_custo || '',
      preco_compra: item.preco_compra || '',
      categoriaPai: categoriaPai,
      categoria: item.categoria,
      disponivel: item.disponivel,
      venda: item.venda !== undefined ? item.venda : true,
    });
    
    setOpenDialog(true);
  };

  const handleOpenImageDialog = (item) => {
    setEditingItem(item);
    setOpenImageDialog(true);
  };

  // Função auxiliar para exibir snackbar
  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Gerenciamento de Itens
      </Typography>
      
      {/* Filtros */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid xs={12} md={2}>
            <TextField
              select
              label="Categoria"
              value={filtros.categoria}
              onChange={(e) => setFiltros({ ...filtros, categoria: e.target.value })}
              fullWidth
            >
              <MenuItem value="">Todas</MenuItem>
              {categorias.map((categoria) => (
                <MenuItem key={categoria.id} value={categoria.id}>
                  {categoria.nome}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid xs={12} md={2}>
            <TextField
              select
              label="Disponibilidade"
              value={filtros.disponivel}
              onChange={(e) => setFiltros({ ...filtros, disponivel: e.target.value })}
              fullWidth
            >
              <MenuItem value="todos">Todos</MenuItem>
              <MenuItem value="disponivel">Disponíveis</MenuItem>
              <MenuItem value="indisponivel">Indisponíveis</MenuItem>
            </TextField>
          </Grid>
          <Grid xs={12} md={2}>
            <TextField
              select
              label="Tipo"
              value={filtros.venda}
              onChange={(e) => setFiltros({ ...filtros, venda: e.target.value })}
              fullWidth
            >
              <MenuItem value="todos">Todos</MenuItem>
              <MenuItem value="venda">Venda</MenuItem>
              <MenuItem value="compra">Apenas Compra</MenuItem>
            </TextField>
          </Grid>
          <Grid xs={12} md={4}>
            <TextField
              label="Buscar"
              value={filtros.searchTerm}
              onChange={(e) => setFiltros({ ...filtros, searchTerm: e.target.value })}
              fullWidth
              InputProps={{
                endAdornment: <SearchIcon color="action" />
              }}
            />
          </Grid>
          <Grid xs={12} md={2}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              fullWidth
              onClick={handleOpenNewItem}
            >
              Novo Item
            </Button>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Lista de Itens */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Imagem</TableCell>
              <TableCell>Nome</TableCell>
              <TableCell>Categoria</TableCell>
              <TableCell align="right">Preço de Venda</TableCell>
              <TableCell align="right">Preço Custo</TableCell>
              <TableCell align="right">Preço Compra</TableCell>
              <TableCell>Estoque</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Tipo</TableCell>
              <TableCell>Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={10} align="center">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : getFilteredItems().length > 0 ? (
              getFilteredItems().map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <Avatar
                      src={item.imagem}
                      alt={item.nome}
                      variant="rounded"
                      sx={{ width: 50, height: 50 }}
                    >
                      {!item.imagem && item.nome.charAt(0)}
                    </Avatar>
                  </TableCell>
                  <TableCell>{item.nome}</TableCell>
                  <TableCell>{item.categoria_nome}</TableCell>
                  <TableCell align="right">{item.preco ? formatMoney(item.preco) : '-'}</TableCell>
                  <TableCell align="right">{item.preco_custo ? formatMoney(item.preco_custo) : '-'}</TableCell>
                  <TableCell align="right">{item.preco_compra ? formatMoney(item.preco_compra) : '-'}</TableCell>
                  <TableCell>
                    {estoque[item.id] ? (
                      `${estoque[item.id].quantidade} ${estoque[item.id].unidade}`
                    ) : (
                      'Não informado'
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={item.disponivel ? 'Disponível' : 'Indisponível'}
                      color={item.disponivel ? 'success' : 'error'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={item.venda !== false ? 'Venda' : 'Apenas Compra'}
                      color={item.venda !== false ? 'primary' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton
                        color="primary"
                        onClick={() => handleOpenEditItem(item)}
                        title="Editar item"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        color="secondary"
                        onClick={() => handleOpenImageDialog(item)}
                        title="Editar imagem"
                      >
                        <ImageIcon />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={10} align="center">
                  Nenhum item encontrado
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      
      {/* Dialog de Adicionar/Editar Item */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingItem ? `Editar Item: ${editingItem.nome}` : 'Novo Item'}
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                label="Nome"
                name="nome"
                value={formData.nome}
                onChange={handleInputChange}
                fullWidth
                required
                margin="normal"
              />
            </Grid>
            
                <Grid item xs={12} md={6}>
                <TextField
                    select
                    label="Categoria Principal"
                    name="categoriaPai"
                    value={formData.categoriaPai || ''}
                    onChange={(e) => {
                    setFormData({ 
                        ...formData, 
                        categoriaPai: e.target.value,
                        categoria: '' // Limpar a subcategoria ao mudar a categoria principal
                    });
                    // Atualizar as subcategorias disponíveis
                    if (e.target.value) {
                        const subcategorias = categorias.filter(cat => 
                        cat.categoria_pai === parseInt(e.target.value)
                        );
                        setSubcategorias(subcategorias);
                    } else {
                        setSubcategorias([]);
                    }
                    }}
                    fullWidth
                    required
                    margin="normal"
                >
                    <MenuItem value="">Selecione uma categoria</MenuItem>
                    {categorias
                    .filter(categoria => !categoria.categoria_pai)
                    .map((categoria) => (
                        <MenuItem key={categoria.id} value={categoria.id}>
                        {categoria.nome}
                        </MenuItem>
                    ))}
                </TextField>
                </Grid>

                <Grid item xs={12} md={6}>
                <TextField
                    select
                    label="Subcategoria"
                    name="categoria"
                    value={formData.categoria || ''}
                    onChange={handleInputChange}
                    fullWidth
                    required
                    margin="normal"
                    disabled={!formData.categoriaPai}
                >
                    <MenuItem value="">Selecione uma subcategoria</MenuItem>
                    {subcategorias.map((categoria) => (
                    <MenuItem key={categoria.id} value={categoria.id}>
                        {categoria.nome}
                    </MenuItem>
                    ))}
                </TextField>
                </Grid>
            <Grid item xs={12}>
              <TextField
                label="Descrição"
                name="descricao"
                value={formData.descricao}
                onChange={handleInputChange}
                fullWidth
                multiline
                rows={2}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                label="Preço de Venda (R$)"
                name="preco"
                type="number"
                value={formData.preco}
                onChange={handleInputChange}
                fullWidth
                margin="normal"
                inputProps={{ step: 0.01 }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                label="Preço Custo (R$)"
                name="preco_custo"
                type="number"
                value={formData.preco_custo}
                onChange={handleInputChange}
                fullWidth
                margin="normal"
                inputProps={{ step: 0.01 }}
                helperText="Preço para funcionários"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                label="Preço Compra (R$)"
                name="preco_compra"
                type="number"
                value={formData.preco_compra}
                onChange={handleInputChange}
                fullWidth
                margin="normal"
                inputProps={{ step: 0.01 }}
                helperText="Última compra"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.disponivel}
                    onChange={handleInputChange}
                    name="disponivel"
                  />
                }
                label="Disponível para venda"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.venda}
                    onChange={handleInputChange}
                    name="venda"
                  />
                }
                label="Exibir no cardápio (venda)"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={handleSaveItem}
          >
            Salvar
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Dialog de Editar Imagem */}
      <Dialog
        open={openImageDialog}
        onClose={() => setOpenImageDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Alterar Imagem</DialogTitle>
        <DialogContent>
          <Box sx={{ textAlign: 'center', mb: 2 }}>
            {editingItem && editingItem.imagem && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Imagem Atual:
                </Typography>
                <img 
                  src={editingItem.imagem} 
                  alt={editingItem.nome}
                  style={{ maxWidth: '100%', maxHeight: '200px' }}
                />
              </Box>
            )}
            
            <Button
              variant="outlined"
              component="label"
              sx={{ mt: 2 }}
            >
              Selecionar Nova Imagem
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={handleFileChange}
              />
            </Button>
            
            {imagePreview && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Nova Imagem:
                </Typography>
                <img
                  src={imagePreview}
                  alt="Preview"
                  style={{ maxWidth: '100%', maxHeight: '200px' }}
                />
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenImageDialog(false)}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={handleEditImage}
            disabled={!selectedFile}
          >
            Salvar Imagem
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Snackbar de notificações */}
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
};

export default ItemManagementPage;