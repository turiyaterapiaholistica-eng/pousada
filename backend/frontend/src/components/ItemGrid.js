import React from 'react';
import { Card, CardMedia, CardContent, CardActions, Typography, Button, IconButton, Box } from '@mui/material';
import Grid from '@mui/material/Grid2';
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';

const ItemGrid = ({ items, handleQuantidadeChange, quantidades, adicionarAoCarrinho, renderPreco }) => {
  return (
    <Grid container spacing={3} sx={{ mt: 2, justifyContent:'center' }}>
      {items.map(item => (
        <Grid xs={12} sm={6} md={4} key={item.id}>
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
                bgcolor: 'grey.300',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {item.imagem ? (
                <img
                  src={item.imagem && !item.imagem.startsWith('http') ? `/media/${item.imagem}` : item.imagem}
                  alt={item.nome}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <Typography color="text.secondary">
                  Imagem não disponível
                </Typography>
              )}
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
                  {/* <Button 
                    variant="contained"
                    fontSize={2}
                    size="small"
                    onClick={() => adicionarAoCarrinho(item)}
                  >
                    Adicionar
                  </Button> */}
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

export default ItemGrid;