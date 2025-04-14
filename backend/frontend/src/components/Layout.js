import React from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  Box, 
  Container,
  Menu,
  MenuItem,
  IconButton
} from '@mui/material';
import { Link as RouterLink, useNavigate, Outlet } from 'react-router-dom';
import LogoutIcon from '@mui/icons-material/Logout';
import InventoryIcon from '@mui/icons-material/Inventory';
import ListAltIcon from '@mui/icons-material/ListAlt';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import ReceiptIcon from '@mui/icons-material/Receipt';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ImageIcon from '@mui/icons-material/Image';
import AssessmentIcon from '@mui/icons-material/Assessment';
import MenuIcon from '@mui/icons-material/Menu';
import authService from '../services/auth';

const Layout = () => {
  const navigate = useNavigate();
  const isAuthenticated = authService.isAuthenticated();
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);
  
  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
      navigate('/menu');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Villa Container Lodge
          </Typography>
          
          {isAuthenticated && (
            <>
              <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1 }}>
                <Button 
                  color="inherit" 
                  component={RouterLink} 
                  to="/"
                  startIcon={<RestaurantIcon />}
                >
                  Vendas
                </Button>
                <Button 
                  color="inherit" 
                  component={RouterLink} 
                  to="/comandas"
                  startIcon={<ReceiptIcon />}
                >
                  Comandas
                </Button>
                <Button 
                  color="inherit" 
                  component={RouterLink} 
                  to="/compras"
                  startIcon={<ShoppingCartIcon />}
                >
                  Compras
                </Button>
                <Button 
                  color="inherit" 
                  component={RouterLink} 
                  to="/estoque"
                  startIcon={<InventoryIcon />}
                >
                  Estoque
                </Button>

                <Button 
                  color="inherit" 
                  component={RouterLink} 
                  to="/itens"
                  startIcon={<ListAltIcon />}
                >
                  Itens
                </Button>

                {/* <Button
                  color="inherit"
                  component={RouterLink}
                  to="/relatorios"
                  startIcon={<AssessmentIcon />}
                >
                  Relatórios
                </Button>
                <Button 
                  color="inherit" 
                  component={RouterLink} 
                  to="/dashboard"
                  startIcon={<DashboardIcon />}
                >
                  Dashboard
                </Button>
                <Button 
                  color="inherit" 
                  component={RouterLink} 
                  to="/images"
                  startIcon={<ImageIcon />}
                >
                  Imagens
                </Button> */}

                
                <Button
                  color="inherit"
                  startIcon={<LogoutIcon />}
                  onClick={handleLogout}
                >
                  Sair
                </Button>
              </Box>
              
              {/* Menu Mobile */}
              <Box sx={{ display: { xs: 'block', md: 'none' } }}>
                <IconButton
                  color="inherit"
                  onClick={handleMenu}
                >
                  <MenuIcon />
                </IconButton>
                <Menu
                  anchorEl={anchorEl}
                  open={open}
                  onClose={handleClose}
                >
                  <MenuItem onClick={() => { navigate('/'); handleClose(); }}>
                    <RestaurantIcon sx={{ mr: 1 }} /> Vendas
                  </MenuItem>
                  <MenuItem onClick={() => { navigate('/comandas'); handleClose(); }}>
                    <ReceiptIcon sx={{ mr: 1 }} /> Comandas
                  </MenuItem>
                  <MenuItem onClick={() => { navigate('/compras'); handleClose(); }}>
                    <ShoppingCartIcon sx={{ mr: 1 }} /> Compras
                  </MenuItem>
                  <MenuItem onClick={() => { navigate('/estoque'); handleClose(); }}>
                    <InventoryIcon sx={{ mr: 1 }} /> Estoque
                  </MenuItem>
                  <MenuItem onClick={() => { navigate('/itens'); handleClose(); }}>
                    <ListAltIcon sx={{ mr: 1 }} /> Itens
                  </MenuItem>
                  {/* <MenuItem onClick={() => { navigate('/relatorios'); handleClose(); }}>
                    <AssessmentIcon sx={{ mr: 1 }} /> Relatórios
                  </MenuItem>
                  <MenuItem onClick={() => { navigate('/dashboard'); handleClose(); }}>
                    <DashboardIcon sx={{ mr: 1 }} /> Dashboard
                  </MenuItem>
                  <MenuItem onClick={() => { navigate('/images'); handleClose(); }}>
                    <ImageIcon sx={{ mr: 1 }} /> Imagens
                  </MenuItem> */}
                  <MenuItem onClick={handleLogout}>
                    <LogoutIcon sx={{ mr: 1 }} /> Sair
                  </MenuItem>
                </Menu>
              </Box>
            </>
          )}
        </Toolbar>
      </AppBar>
      
      <Container 
        maxWidth={false} 
        sx={{ 
          flexGrow: 1, 
          display: 'flex', 
          flexDirection: 'column',
          p: 3
        }}
      >
        <Outlet />
      </Container>
    </Box>
  );
};

export default Layout;