import React, { useState } from 'react';
import { Card, CardMedia, CardContent, CardActions, Typography, Button, IconButton, Box, Skeleton } from '@mui/material';
import Grid from '@mui/material/Grid2';
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';

const ItemImage = ({ item }) => {
  const [imageError, setImageError] = useState(false);
  
  if (!item.imagem || imageError) {
    return (
      <Box sx={{ 
        height: '100%', 
        display: 'flex', 
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'grey.100'
      }}>
        <Typography color="text.secondary">Imagem não disponível</Typography>
      </Box>
    );
  }

  // The problem might be that we're getting the full URL back from the API
  // Let's handle both relative paths and full URLs
  const imgSrc = item.imagem.startsWith('http') 
    ? item.imagem // Keep full URLs as is
    : `/static/images/${item.imagem.split('/').pop()}`; // Use last part of path for relative URLs
  
  return (
    <img
      src={imgSrc}
      alt={item.nome}
      style={{
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        ...(imgSrc.toLowerCase().endsWith('.png') && {
          objectFit: 'contain',
          padding: '8px',
          backgroundColor: 'white'
        })
      }}
      onError={(e) => {
        console.error('Image load error:', imgSrc);
        setImageError(true);
      }}
    />
  );
};

const ItemGrid = ({ items, handleQuantidadeChange, quantidades, adicionarAoCarrinho, renderPreco, isLoading = false }) => {
  return (
    <Grid container spacing={3} sx={{ mt: 2, justifyContent: 'center' }}>
      {items.map(item => (

        <Grid xs={12} sm={6} md={4} key={item.id}>
          
          {isLoading ? (
            <Box sx={{ width:'230px' }}>
              <Skeleton variant="rectangular" height={200} />
              <Skeleton variant="text" sx={{ mt: 1 }} />
              <Skeleton variant="text" width="60%" />
            </Box>
          ) : (
            <Card sx={{ 
              height: { xs: 'auto', sm: '300px' },
              display: 'flex', 
              flexDirection: 'column',
              width: { sm: '230px' },
              mx: 'auto'
            }}>
              <CardMedia
                component="div"
                sx={{
                  height: 140,
                  bgcolor: 'grey.100',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <ItemImage item={item} />
              </CardMedia>
              
              <CardContent sx={{ flexGrow: 1, pb: 1 }}>
                <Typography gutterBottom fontSize={20} ariant="h6" component="h2" sx={{ mb: 1, textWrap:'nowrap', overflow:'hidden' }}>
                  {item.nome}
                </Typography>
                <Typography 
                  color="text.secondary" 
                  variant="body2" 
                  sx={{ 
                    mb: 2,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    lineHeight: 1.3
                  }}
                >
                  {item.descricao}
                </Typography>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  gap: 2
                }}>
                  <Box sx={{ flexGrow: 1 }}>
                    {renderPreco(item)}
                  </Box>
                  <Box sx={{ 
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5
                  }}>
                  <Typography align="center" sx={{ lineHeight: 1 }}>
                      {quantidades[item.id] || 1}
                  </Typography>
  
                    <Box sx={{ 
                      display: 'flex', 
                      flexDirection: 'column',
                      mr: 1
                    }}>       
  
                      <IconButton 
                        size="small" 
                        sx={{ p: 0 }}
                        onClick={() => handleQuantidadeChange(item.id, 1)}
                      >
                        <ArrowDropUpIcon />
                      </IconButton>
                      
                      <IconButton 
                        size="small"
                        sx={{ p: 0 }}
                        onClick={() => handleQuantidadeChange(item.id, -1)}
                      >
                        <ArrowDropDownIcon />
                      </IconButton>
  
                    </Box>
  
                    <IconButton
                      color="primary"
                      onClick={() => adicionarAoCarrinho(item)}
                      sx={{ 
                          backgroundColor: 'primary.main',
                          color: 'white',
                          '&:hover': {
                            backgroundColor: 'primary.dark',
                          }
                      }}
                    >
                      <ShoppingCartIcon />
                    </IconButton>
        
                  </Box>
                </Box>
              </CardContent>
            </Card>
          )}     


        </Grid>
      ))}
    </Grid>
  );
};

export default ItemGrid;