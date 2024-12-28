import React, { useState, useEffect } from 'react';
import { Box, Tabs, Tab, Chip } from '@mui/material';

const CategoryTabs = ({ categorias, onCategoryChange, selectedCategories }) => {
  const mainCategories = categorias.filter(cat => !cat.categoria_pai);
  
  // Find the index of the selected main category
  const selectedMainCategoryIndex = mainCategories.findIndex(
    cat => cat.id === selectedCategories.mainCategoryId
  );
  
  const handleMainCategoryChange = (event, newValue) => {
    onCategoryChange({
      mainCategoryId: mainCategories[newValue]?.id,
      subCategoryId: null
    });
  };

  const handleSubCategoryChange = (subCategoryId) => {
    onCategoryChange({
      mainCategoryId: selectedCategories.mainCategoryId,
      subCategoryId
    });
  };

  // Get current main category object
  const currentMainCategory = mainCategories[selectedMainCategoryIndex];

  return (
    <Box>
      <Tabs
        value={selectedMainCategoryIndex !== -1 ? selectedMainCategoryIndex : 0}
        onChange={handleMainCategoryChange}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ borderBottom: 1, borderColor: 'divider' }}
      >
        {mainCategories.map((categoria) => (
          <Tab key={categoria.id} label={categoria.nome} />
        ))}
      </Tabs>
      
      {currentMainCategory?.subcategorias?.length > 0 && (
        <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Chip
            label="Todos"
            onClick={() => handleSubCategoryChange(null)}
            color={selectedCategories.subCategoryId === null ? "primary" : "default"}
            variant={selectedCategories.subCategoryId === null ? "filled" : "outlined"}
          />
          {currentMainCategory.subcategorias.map((sub) => (
            <Chip
              key={sub.id}
              label={sub.nome}
              onClick={() => handleSubCategoryChange(sub.id)}
              color={selectedCategories.subCategoryId === sub.id ? "primary" : "default"}
              variant={selectedCategories.subCategoryId === sub.id ? "filled" : "outlined"}
            />
          ))}
        </Box>
      )}
    </Box>
  );
};

export default CategoryTabs;