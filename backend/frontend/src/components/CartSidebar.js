import React from 'react';
import { Box, Drawer, IconButton, Typography, List, ListItem, ListItemText, Divider, Badge, Avatar, Button } from '@mui/material';
import ShoppingCartCheckoutIcon from '@mui/icons-material/ShoppingCartCheckout';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';

const CartSidebar = ({ 
  drawerWidth,
  drawerOpen,
  setDrawerOpen,
  carrinho,
  atualizarQuantidadeCarrinho,
  removerDoCarrinho,
  formatMoney,
  totalCarrinho,
  handleCheckoutClick
}) => {
  return (
    <Drawer
      variant="permanent"
      anchor="right"
      sx={{
        width: drawerOpen ? drawerWidth : 80,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerOpen ? drawerWidth : 80,
          boxSizing: 'border-box',
          marginTop: '84px',
          height: 'calc(100% - 84px)',
          overflow: 'hidden'
        },
      }}
    >
      <Box sx={{ 
        display: 'flex',
        flexDirection: 'column',
        height: '100%'
      }}>
        <IconButton 
          onClick={() => setDrawerOpen(!drawerOpen)}
          sx={{ alignSelf: drawerOpen ? 'flex-start' : 'center', m: 1 }}
        >
          {drawerOpen ? <ChevronRightIcon /> : <ChevronLeftIcon />}
        </IconButton>

        {drawerOpen ? (
          // Expanded view with full list
          <>
            <Typography variant="h6" sx={{ p: 2, pb: 1 }}>
              Carrinho
            </Typography>
            <List sx={{ flexGrow: 1, overflow: 'auto', px: 2 }}>
              {carrinho.map((item) => (
                <React.Fragment key={item.id}>
                  <ListItem
                    secondaryAction={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <IconButton 
                          edge="end" 
                          size="small"
                          onClick={() => atualizarQuantidadeCarrinho(item.id, -1)}
                        >
                          <RemoveIcon />
                        </IconButton>
                        <Typography>{item.quantidade}</Typography>
                        <IconButton 
                          edge="end" 
                          size="small"
                          onClick={() => atualizarQuantidadeCarrinho(item.id, 1)}
                        >
                          <AddIcon />
                        </IconButton>
                        <IconButton 
                          edge="end"
                          onClick={() => removerDoCarrinho(item.id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    }
                  >
                    <ListItemText
                      primary={item.nome}
                      secondary={
                        <Box>
                          <Typography variant="body2">
                            {formatMoney(item.precoEfetivo)} x {item.quantidade}
                          </Typography>
                          <Typography variant="subtitle2" color="primary">
                            {formatMoney(item.precoEfetivo * item.quantidade)}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                  <Divider />
                </React.Fragment>
              ))}
            </List>
            <Box sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Total: {formatMoney(totalCarrinho)}
              </Typography>
              <Button
                variant="contained"
                fullWidth
                disabled={carrinho.length === 0}
                onClick={handleCheckoutClick}
                sx={{ mt: 2 }}
              >
                Finalizar Pedido
              </Button>
            </Box>
          </>
        ) : (
          // Collapsed view with avatars
          <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <List sx={{ flexGrow: 1, overflow: 'hidden', p: 1 }}>
              {carrinho.map((item) => (
                <Box 
                  key={item.id} 
                  sx={{ 
                    position: 'relative',
                    mb: 2,
                    display: 'flex',
                    justifyContent: 'center'
                  }}
                >
                  <Badge
                    badgeContent={`x${item.quantidade}`}
                    color="primary"
                    anchorOrigin={{
                      vertical: 'bottom',
                      horizontal: 'right',
                    }}
                    sx={{
                      '& .MuiBadge-badge': {
                        fontSize: '0.8rem',
                        height: '22px',
                        minWidth: '22px',
                        borderRadius: '11px'
                      }
                    }}
                  >
                    <Avatar
                      src={item.imagem ? `/media/${item.imagem}` : ''}
                      sx={{ 
                        width: 56, 
                        height: 56,
                        bgcolor: !item.imagem ? 'primary.main' : undefined
                      }}
                    >
                      {!item.imagem && item.nome.charAt(0)}
                    </Avatar>
                  </Badge>
                </Box>
              ))}
            </List>
            
            {/* Total and checkout button for collapsed view */}
            <Box 
              sx={{ 
                p: 1, 
                borderTop: 1, 
                borderColor: 'divider',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 1
              }}
            >
              <Typography 
                variant="caption" 
                sx={{ 
                  fontWeight: 'bold',
                  fontSize: '0.8rem',
                  textAlign: 'center'
                }}
              >
                Total:
                <br />
                {formatMoney(totalCarrinho)}
              </Typography>
              <IconButton
                color="primary"
                disabled={carrinho.length === 0}
                onClick={handleCheckoutClick}
                sx={{ 
                  backgroundColor: 'primary.main',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: 'primary.dark',
                  },
                  '&.Mui-disabled': {
                    backgroundColor: 'action.disabledBackground',
                    color: 'action.disabled'
                  }
                }}
              >
                <ShoppingCartCheckoutIcon />
              </IconButton>
            </Box>
          </Box>
        )}
      </Box>
    </Drawer>
  );
};

export default CartSidebar;