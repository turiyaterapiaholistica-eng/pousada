import React, { useState, useEffect } from 'react';
import { 
  Box, Card, CardContent, TextField, Button, 
  FormControl, InputLabel, Select, MenuItem, 
  Typography, CircularProgress 
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import api from '../services/api';

const ImageUpload = () => {
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedItem, setSelectedItem] = useState('');
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      fetchItems(selectedCategory);
    }
  }, [selectedCategory]);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categorias/');
      setCategories(response);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchItems = async (categoryId) => {
    try {
      const response = await api.get(`/itens/?categoria=${categoryId}`);
      setItems(response);
    } catch (error) {
      console.error('Error fetching items:', error);
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    setFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleUpload = async () => {
    if (!file || !selectedItem) return;
    setLoading(true);
  
    try {
      const formData = new FormData();
      formData.append('imagem', file);
  
      // Direct upload to the backend
      const response = await api.post(`/itens/${selectedItem}/upload_image/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (response.status === 'success') {
        // Clear form after successful upload
        setFile(null);
        setPreview('');
        setSelectedItem('');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 3 }}>
        Upload de Imagens
      </Typography>

      <Grid container spacing={3}>
        <Grid xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <FormControl fullWidth>
                  <InputLabel>Categoria</InputLabel>
                  <Select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    label="Categoria"
                  >
                    {categories.map((category) => (
                      <MenuItem key={category.id} value={category.id}>
                        {category.nome}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl fullWidth>
                  <InputLabel>Item</InputLabel>
                  <Select
                    value={selectedItem}
                    onChange={(e) => setSelectedItem(e.target.value)}
                    label="Item"
                    disabled={!selectedCategory}
                  >
                    {items.map((item) => (
                      <MenuItem key={item.id} value={item.id}>
                        {item.nome}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <Button
                  variant="contained"
                  component="label"
                  disabled={!selectedItem}
                >
                  Selecionar Imagem
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                </Button>

                {preview && (
                  <Box sx={{ mt: 2 }}>
                    <img
                      src={preview}
                      alt="Preview"
                      style={{ maxWidth: '100%', maxHeight: '200px' }}
                    />
                  </Box>
                )}

                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleUpload}
                  disabled={!file || !selectedItem || loading}
                >
                  {loading ? <CircularProgress size={24} /> : 'Upload'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ImageUpload;