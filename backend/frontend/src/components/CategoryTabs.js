import React, { useState } from 'react';
import { Box, Tabs, Tab, Chip } from '@mui/material';

const CategoryTabs = ({ categorias, onCategoryChange }) => {
  const [mainCategory, setMainCategory] = useState(0);
  const [subCategory, setSubCategory] = useState(null);
  
  const handleMainCategoryChange = (event, newValue) => {
    setMainCategory(newValue);
    setSubCategory(null);
    onCategoryChange({
      mainCategoryId: categorias[newValue]?.id,
      subCategoryId: null
    });
  };

  const handleSubCategoryChange = (subCategoryId) => {
    setSubCategory(subCategoryId);
    onCategoryChange({
      mainCategoryId: categorias[mainCategory]?.id,
      subCategoryId
    });
  };

  const mainCategories = categorias.filter(cat => !cat.categoria_pai);

  return (
    <Box>
      <Tabs
        value={mainCategory}
        onChange={handleMainCategoryChange}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ borderBottom: 1, borderColor: 'divider' }}
      >
        {mainCategories.map((categoria) => (
          <Tab key={categoria.id} label={categoria.nome} />
        ))}
      </Tabs>
      
      {mainCategories[mainCategory]?.subcategorias?.length > 0 && (
        <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Chip
            label="Todos"
            onClick={() => handleSubCategoryChange(null)}
            color={subCategory === null ? "primary" : "default"}
            variant={subCategory === null ? "filled" : "outlined"}
          />
          {mainCategories[mainCategory].subcategorias.map((sub) => (
            <Chip
              key={sub.id}
              label={sub.nome}
              onClick={() => handleSubCategoryChange(sub.id)}
              color={subCategory === sub.id ? "primary" : "default"}
              variant={subCategory === sub.id ? "filled" : "outlined"}
            />
          ))}
        </Box>
      )}
    </Box>
  );
};

export default CategoryTabs;