import React, { useState, useEffect } from 'react';
import {
  Box, 
  TextField, 
  Button, 
  MenuItem, 
  FormControl, 
  InputLabel, 
  Select,
  FormControlLabel,
  Checkbox,
  Typography,
  Grid,
  Radio,
  RadioGroup,
  FormLabel
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import ptBR from 'date-fns/locale/pt-BR';
import AddIcon from '@mui/icons-material/Add';

const CompraForm = ({ 
  formData, 
  setFormData, 
  itemAtual, 
  setItemAtual,
  categoriasPai,
  categoriasFilho,
  itensFiltrados,
  adicionarItemAoCarrinho,
  modoEdicao,
  compraAtual
}) => {
  // Estado para controlar se o item é uma caixa
  const [isCaixa, setIsCaixa] = useState(false);
  // Estado para definir quantidade de unidades na caixa
  const [unidadesPorCaixa, setUnidadesPorCaixa] = useState(24);
  // Memorizar último produto selecionado para cada categoria/subcategoria
  const [itemMemoria, setItemMemoria] = useState({});
  // Modo de adição da caixa (como caixa apenas, como unidades apenas, ambos)
  const [caixaAddMode, setCaixaAddMode] = useState('unidades');

  // Carregar informações do item selecionado
  useEffect(() => {
    if (itemAtual.item) {
      const itemId = parseInt(itemAtual.item);
      const itemSelecionado = itensFiltrados.find(item => item.id === itemId);
      
      if (itemSelecionado) {
        // Verificar o preço de compra mais recente (prioritário)
        let precoParaUsar = itemSelecionado.preco_compra;
        
        // Memorizar este item para a categoria atual
        setItemMemoria(prev => ({
          ...prev,
          [`${itemAtual.categoriaPai}-${itemAtual.categoria}`]: {
            itemId,
            unidade: itemAtual.unidade || 'un',
            isCaixa: isCaixa,
            unidadesPorCaixa: unidadesPorCaixa
          }
        }));
        
        // Definir unidade e preço
        setItemAtual(prev => ({
          ...prev,
          unidade: itemSelecionado.unidade || prev.unidade || 'un',
          valor_unitario: precoParaUsar || ''
        }));
      }
    }
  }, [itemAtual.item]);

  // Quando categoria ou subcategoria mudar, tentar recuperar as informações memorizadas
  useEffect(() => {
    if (itemAtual.categoria && !itemAtual.item) {
      const memoriaKey = `${itemAtual.categoriaPai}-${itemAtual.categoria}`;
      const itemLembrado = itemMemoria[memoriaKey];
      
      if (itemLembrado) {
        // Restaurar configurações do item anterior da mesma categoria
        setIsCaixa(itemLembrado.isCaixa);
        setUnidadesPorCaixa(itemLembrado.unidadesPorCaixa);
      }
    }
  }, [itemAtual.categoria]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleItemChange = (e) => {
    const { name, value } = e.target;
    setItemAtual({ ...itemAtual, [name]: value });
  };

  const handleCaixaChange = (e) => {
    setIsCaixa(e.target.checked);
    
    // If unchecked, switch to unit mode
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

  const handleCaixaAddModeChange = (e) => {
    setCaixaAddMode(e.target.value);
  };

  const handleAdicionarItem = () => {
    if (isCaixa) {
      // Calculate unit price from the box price
      const valorUnitario = parseFloat(itemAtual.valor_unitario);
      const valorPorUnidade = valorUnitario / unidadesPorCaixa;
      
      // Only add as units, not as a box
      const unidadesItem = {
        ...itemAtual,
        quantidade: unidadesPorCaixa * itemAtual.quantidade,
        unidade: 'un',
        valor_unitario: valorPorUnidade.toFixed(2)
      };
      adicionarItemAoCarrinho(unidadesItem);
    } else {
      // If not a box, add normally
      adicionarItemAoCarrinho(itemAtual);
    }
    
    // Limpar formulário para novo item, mantendo as categorias
    setItemAtual({
      ...itemAtual,
      item: '',
      quantidade: 1,
      valor_unitario: ''
    });
  };

  return (
    <Box>
      <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
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
              {Array.isArray(formData.fornecedores) ? (
                formData.fornecedores.length > 0 ? (
                  formData.fornecedores.map((fornecedor) => (
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
              value={formData.data ? new Date(formData.data) : new Date()}
              onChange={(newDate) => {
                // Preservar a data e hora original se estiver em modo de edição
                if (modoEdicao && compraAtual && compraAtual.data) {
                  const originalDate = new Date(compraAtual.data);
                  const hours = originalDate.getHours();
                  const minutes = originalDate.getMinutes();
                  const seconds = originalDate.getSeconds();
                  
                  newDate.setHours(hours);
                  newDate.setMinutes(minutes);
                  newDate.setSeconds(seconds);
                }
                setFormData({...formData, data: newDate});
              }}
              sx={{ width: '200px' }}
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
      </LocalizationProvider>
              
      <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>
        Adicionar Itens
      </Typography>
      
      <Grid container spacing={3} mb={2} width={'100%'}>
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
          <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <FormControlLabel 
              control={
                <Checkbox 
                  checked={isCaixa} 
                  onChange={handleCaixaChange} 
                />
              } 
              label="É uma caixa?" 
            />
            
            {isCaixa && (
              <>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <TextField
                    label="Unidades por caixa"
                    type="number"
                    value={unidadesPorCaixa}
                    onChange={handleUnidadesPorCaixaChange}
                    sx={{ width: '120px' }}
                    inputProps={{ min: 1, step: 1 }}
                    size="small"
                  />
                </Box>
                
                <FormControl component="fieldset" size="small" sx={{ mt: 1 }}>
                  <FormLabel component="legend" sx={{ fontSize: '0.75rem' }}>Adicionar como:</FormLabel>
                  <RadioGroup
                    value={caixaAddMode}
                    onChange={handleCaixaAddModeChange}
                    row
                  >
                    <FormControlLabel value="unidades" control={<Radio size="small" />} label="Unidades" />
                    <FormControlLabel value="caixa" control={<Radio size="small" />} label="Caixa" />
                    <FormControlLabel value="ambos" control={<Radio size="small" />} label="Ambos" />
                  </RadioGroup>
                </FormControl>
              </>
            )}
          </Box>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Button
            variant="contained"
            onClick={handleAdicionarItem}
            fullWidth
            sx={{ height: '56px' }}
            startIcon={<AddIcon />}
          >
            Adicionar
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
};

export default CompraForm;