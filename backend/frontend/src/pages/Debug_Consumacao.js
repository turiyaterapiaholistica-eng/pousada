import React, { useState, useEffect } from 'react';
import { Box, Typography, Card, CardContent } from '@mui/material';

const DebugConsumacao = () => {
  const [categorias, setCategorias] = useState([]);
  const [itens, setItens] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState({
    mainCategoryId: null,
    subCategoryId: null
  });
  const [debug, setDebug] = useState({
    apiResponses: {},
    filteredItems: []
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch categorias
        const categoriasRes = await window.fetch('/api/categorias/');
        const categoriasData = await categoriasRes.json();
        console.log('Categories Response:', categoriasData);
        setCategorias(categoriasData);

        // Fetch itens
        const itensRes = await window.fetch('/api/itens/');
        const itensData = await itensRes.json();
        console.log('Items Response:', itensData);
        setItens(itensData);

        setDebug(prev => ({
          ...prev,
          apiResponses: {
            categorias: categoriasData,
            itens: itensData
          }
        }));
      } catch (error) {
        console.error('Error fetching data:', error);
        setDebug(prev => ({
          ...prev,
          error: error.message
        }));
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const filtered = itens.filter(item => {
      // If no main category is selected, show nothing
      if (!selectedCategories.mainCategoryId) {
        return false;
      }

      // If a subcategory is selected, show only items from that subcategory
      if (selectedCategories.subCategoryId) {
        return item.categoria === selectedCategories.subCategoryId;
      }

      // Show items that either belong to main category directly or to its subcategories
      const itemCategory = categorias.find(cat => cat.id === item.categoria);
      return (
        item.categoria === selectedCategories.mainCategoryId || 
        itemCategory?.categoria_pai === selectedCategories.mainCategoryId
      );
    });

    setDebug(prev => ({
      ...prev,
      filteredItems: filtered
    }));
  }, [itens, categorias, selectedCategories]);

  return (
    <Box className="p-4">
      <Typography variant="h4" className="mb-4">Debug Information</Typography>
      
      <Card className="mb-4">
        <CardContent>
          <Typography variant="h5" className="mb-2">Categories ({categorias.length})</Typography>
          <pre className="bg-gray-100 p-2 rounded">
            {JSON.stringify(categorias, null, 2)}
          </pre>
        </CardContent>
      </Card>

      <Card className="mb-4">
        <CardContent>
          <Typography variant="h5" className="mb-2">Items ({itens.length})</Typography>
          <pre className="bg-gray-100 p-2 rounded">
            {JSON.stringify(itens, null, 2)}
          </pre>
        </CardContent>
      </Card>

      <Card className="mb-4">
        <CardContent>
          <Typography variant="h5" className="mb-2">Selected Categories</Typography>
          <pre className="bg-gray-100 p-2 rounded">
            {JSON.stringify(selectedCategories, null, 2)}
          </pre>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h5" className="mb-2">Filtered Items ({debug.filteredItems.length})</Typography>
          <pre className="bg-gray-100 p-2 rounded">
            {JSON.stringify(debug.filteredItems, null, 2)}
          </pre>
        </CardContent>
      </Card>
    </Box>
  );
};

export default DebugConsumacao;