import React, { useState } from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  Box, 
  Container,
  Menu,
  MenuItem,
  IconButton,
  Divider,
  Tooltip
} from '@mui/material';
import { Link as RouterLink, useNavigate, Outlet, useLocation } from 'react-router-dom';
import LogoutIcon from '@mui/icons-material/Logout';
import InventoryIcon from '@mui/icons-material/Inventory';
import ListAltIcon from '@mui/icons-material/ListAlt';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import ReceiptIcon from '@mui/icons-material/Receipt';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AssessmentIcon from '@mui/icons-material/Assessment';
import MenuIcon from '@mui/icons-material/Menu';
import StorefrontIcon from '@mui/icons-material/Storefront';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import HotelIcon from '@mui/icons-material/Hotel';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import ViewListIcon from '@mui/icons-material/ViewList';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import SettingsIcon from '@mui/icons-material/Settings';
import VolunteerActivismIcon from '@mui/icons-material/VolunteerActivism';
import AssignmentIcon from '@mui/icons-material/Assignment';
import authService from '../services/auth';

// Mapeamento dos ícones para cada rota
const menuIcons = {
  '/': <RestaurantIcon />,
  '/comandas': <ReceiptIcon />,
  '/compras': <ShoppingCartIcon />,
  '/estoque': <InventoryIcon />,
  '/itens': <ListAltIcon />,
  '/relatorios': <AssessmentIcon />
};

// Ícones do menu PMS
const pmsIcons = {
  '/reservas/nova': <AddCircleIcon />,
  '/reservas/lista': <ViewListIcon />,
  '/reservas/mapa': <CalendarMonthIcon />,
  '/reservas/checkin-checkout': <MeetingRoomIcon />
};

const Layout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = authService.isAuthenticated();
  
  // Estado para o menu de Ponto de Venda
  const [pontoVendaAnchorEl, setPontoVendaAnchorEl] = useState(null);
  const pontoVendaMenuOpen = Boolean(pontoVendaAnchorEl);

  // Estado para o menu de PMS
  const [pmsAnchorEl, setPmsAnchorEl] = useState(null);
  const pmsMenuOpen = Boolean(pmsAnchorEl);

  // Estado para o menu de Voluntários
  const [voluntariosAnchorEl, setVoluntariosAnchorEl] = useState(null);
  const voluntariosMenuOpen = Boolean(voluntariosAnchorEl);

  // Estado para o menu mobile
  const [mobileMenuAnchorEl, setMobileMenuAnchorEl] = useState(null);
  const mobileMenuOpen = Boolean(mobileMenuAnchorEl);
  
  // Sistema ativo derivado da rota atual (sem estado, reage ao browser back/forward)
  const activeSystem = location.pathname.startsWith('/reservas') || location.pathname.startsWith('/configuracoes')
    ? 'pms'
    : location.pathname.startsWith('/voluntarios')
    ? 'voluntarios'
    : 'ponto-venda';

  const appBarColor = activeSystem === 'voluntarios' ? '#1a3a2a'
    : activeSystem === 'pms' ? '#0D47A1'
    : '#E65100';
  
  // Determinar qual rota está ativa no submenu PdV
  const getActivePdVRoute = () => {
    const path = location.pathname;
    if (path === '/') return '/';
    if (path.includes('/comandas')) return '/comandas';
    if (path.includes('/compras')) return '/compras';
    if (path.includes('/estoque')) return '/estoque';
    if (path.includes('/itens')) return '/itens';
    if (path.includes('/relatorios')) return '/relatorios';
    return '/';
  };
  
  // Determinar qual rota está ativa no submenu Voluntários
  const getActiveVoluntariosRoute = () => {
    const path = location.pathname;
    if (path === '/voluntarios') return '/voluntarios';
    if (path.includes('/voluntarios/gestao')) return '/voluntarios/gestao';
    if (path.includes('/voluntarios/atividades')) return '/voluntarios/atividades';
    if (path.includes('/voluntarios/minhas-tarefas')) return '/voluntarios/minhas-tarefas';
    if (path.includes('/voluntarios/painel')) return '/voluntarios/painel';
    return '';
  };

  // Determinar qual rota está ativa no submenu PMS
  const getActivePMSRoute = () => {
    const path = location.pathname;
    if (path.includes('/reservas/nova')) return '/reservas/nova';
    if (path.includes('/reservas/lista')) return '/reservas/lista';
    if (path.includes('/reservas/mapa')) return '/reservas/mapa';
    if (path.includes('/reservas/checkin-checkout')) return '/reservas/checkin-checkout';
    return '/reservas/nova';
  };
  
  const activePdVRoute = getActivePdVRoute();
  const activePMSRoute = getActivePMSRoute();
  const activeVoluntariosRoute = getActiveVoluntariosRoute();

  const handlePontoVendaMenuOpen = (event) => {
    setPontoVendaAnchorEl(event.currentTarget);
  };

  const handlePontoVendaMenuClose = () => {
    setPontoVendaAnchorEl(null);
  };

  const handlePmsMenuOpen = (event) => {
    setPmsAnchorEl(event.currentTarget);
  };

  const handlePmsMenuClose = () => {
    setPmsAnchorEl(null);
  };

  const handleVoluntariosMenuOpen = (event) => {
    setVoluntariosAnchorEl(event.currentTarget);
  };

  const handleVoluntariosMenuClose = () => {
    setVoluntariosAnchorEl(null);
  };

  const handleMobileMenuOpen = (event) => {
    setMobileMenuAnchorEl(event.currentTarget);
  };

  const handleMobileMenuClose = () => {
    setMobileMenuAnchorEl(null);
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
      navigate('/menu');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleNavigation = (path) => {
    navigate(path);
    handlePontoVendaMenuClose();
    handlePmsMenuClose();
    handleVoluntariosMenuClose();
    handleMobileMenuClose();
  };

  // Menu do Ponto de Venda
  const pontoVendaMenu = [
    { name: 'Vendas', icon: <RestaurantIcon />, path: '/' },
    { name: 'Comandas', icon: <ReceiptIcon />, path: '/comandas' },
    { name: 'Compras', icon: <ShoppingCartIcon />, path: '/compras' },
    { name: 'Estoque', icon: <InventoryIcon />, path: '/estoque' },
    { name: 'Itens', icon: <ListAltIcon />, path: '/itens' },
    { name: 'Relatórios', icon: <AssessmentIcon />, path: '/relatorios' }
  ];

  // Menu do PMS
  const pmsMenu = [
    { name: 'Nova Reserva', icon: <AddCircleIcon />, path: '/reservas/nova' },
    { name: 'Lista de Reservas', icon: <ViewListIcon />, path: '/reservas/lista' },
    { name: 'Mapa de Reservas', icon: <CalendarMonthIcon />, path: '/reservas/mapa' },
    { name: 'Chegadas e Saídas', icon: <MeetingRoomIcon />, path: '/reservas/checkin-checkout' }
  ];

  // Menu de Voluntários
  const voluntariosMenu = [
    { name: 'Tela pública', icon: <VolunteerActivismIcon />, path: '/voluntarios' },
    { name: 'Gestão', icon: <DashboardIcon />, path: '/voluntarios/gestao' },
    { name: 'Biblioteca de Atividades', icon: <ListAltIcon />, path: '/voluntarios/atividades' },
    { name: 'Minhas Tarefas', icon: <AssignmentIcon />, path: '/voluntarios/minhas-tarefas' },
    { name: 'Painel do Voluntário', icon: <DashboardIcon />, path: '/voluntarios/painel' },
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <AppBar position="static" sx={{ bgcolor: appBarColor, transition: 'background-color 0.3s ease' }}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 0, mr: 3 }}>
            Villa Container Lodge
          </Typography>
          
          {isAuthenticated && (
            <>
              {/* Desktop Menu */}
              <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 2 }}>
                <Button 
                  color="inherit"
                  onClick={handlePontoVendaMenuOpen}
                  aria-controls={pontoVendaMenuOpen ? 'ponto-venda-menu' : undefined}
                  aria-haspopup="true"
                  aria-expanded={pontoVendaMenuOpen ? 'true' : undefined}
                  endIcon={<KeyboardArrowDownIcon />}
                  sx={{ 
                    borderBottom: activeSystem === 'ponto-venda' ? '2px solid white' : 'none',
                    borderRadius: 0,
                    pb: 0.5
                  }}
                  startIcon={<StorefrontIcon />}
                >
                  Ponto de Venda
                </Button>
                
                <Menu
                  id="ponto-venda-menu"
                  anchorEl={pontoVendaAnchorEl}
                  open={pontoVendaMenuOpen}
                  onClose={handlePontoVendaMenuClose}
                  MenuListProps={{
                    'aria-labelledby': 'ponto-venda-button',
                  }}
                >
                  {pontoVendaMenu.map((item) => (
                    <MenuItem 
                      key={item.name} 
                      onClick={() => handleNavigation(item.path)}
                      selected={activePdVRoute === item.path}
                      sx={{
                        minWidth: 180,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        color: activePdVRoute === item.path ? '#E65100' : 'inherit'
                      }}
                    >
                      {item.icon}
                      <Typography>{item.name}</Typography>
                    </MenuItem>
                  ))}
                </Menu>
                
                {/* PMS Menu */}
                <Button 
                  color="inherit"
                  onClick={handlePmsMenuOpen}
                  aria-controls={pmsMenuOpen ? 'pms-menu' : undefined}
                  aria-haspopup="true"
                  aria-expanded={pmsMenuOpen ? 'true' : undefined}
                  endIcon={<KeyboardArrowDownIcon />}
                  sx={{ 
                    borderBottom: activeSystem === 'pms' ? '2px solid white' : 'none',
                    borderRadius: 0,
                    pb: 0.5
                  }}
                  startIcon={<HotelIcon />}
                >
                  PMS
                </Button>
                
                <Menu
                  id="pms-menu"
                  anchorEl={pmsAnchorEl}
                  open={pmsMenuOpen}
                  onClose={handlePmsMenuClose}
                  MenuListProps={{
                    'aria-labelledby': 'pms-button',
                  }}
                >
                  {pmsMenu.map((item) => (
                    <MenuItem 
                      key={item.name} 
                      onClick={() => handleNavigation(item.path)}
                      selected={activePMSRoute === item.path}
                      sx={{
                        minWidth: 180,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        color: activePMSRoute === item.path ? '#0D47A1' : 'inherit'
                      }}
                    >
                      {item.icon}
                      <Typography>{item.name}</Typography>
                    </MenuItem>
                  ))}
                </Menu>
                
                {/* Voluntários Menu */}
                <Button
                  color="inherit"
                  onClick={handleVoluntariosMenuOpen}
                  aria-controls={voluntariosMenuOpen ? 'voluntarios-menu' : undefined}
                  aria-haspopup="true"
                  aria-expanded={voluntariosMenuOpen ? 'true' : undefined}
                  endIcon={<KeyboardArrowDownIcon />}
                  sx={{
                    borderBottom: activeSystem === 'voluntarios' ? '2px solid white' : 'none',
                    borderRadius: 0,
                    pb: 0.5
                  }}
                  startIcon={<VolunteerActivismIcon />}
                >
                  Voluntários
                </Button>

                <Menu
                  id="voluntarios-menu"
                  anchorEl={voluntariosAnchorEl}
                  open={voluntariosMenuOpen}
                  onClose={handleVoluntariosMenuClose}
                  MenuListProps={{ 'aria-labelledby': 'voluntarios-button' }}
                >
                  {voluntariosMenu.map((item) => (
                    <MenuItem
                      key={item.name}
                      onClick={() => handleNavigation(item.path)}
                      selected={activeVoluntariosRoute === item.path}
                      sx={{
                        minWidth: 200,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        color: activeVoluntariosRoute === item.path ? '#1a3a2a' : 'inherit'
                      }}
                    >
                      {item.icon}
                      <Typography>{item.name}</Typography>
                    </MenuItem>
                  ))}
                </Menu>

                <Box sx={{ flexGrow: 1 }} />

                <Button
                  color="inherit"
                  startIcon={<SettingsIcon />}
                  onClick={() => navigate('/configuracoes')}
                  sx={{ mr: 2 }}
                >
                  Configurações
                </Button>
                
                <Button
                  color="inherit"
                  startIcon={<LogoutIcon />}
                  onClick={handleLogout}
                >
                  Sair
                </Button>
              </Box>
              
              {/* Mobile Menu */}
              <Box sx={{ display: { xs: 'flex', md: 'none' }, flexGrow: 1, justifyContent: 'flex-end' }}>
                <IconButton
                  color="inherit"
                  onClick={handleMobileMenuOpen}
                >
                  <MenuIcon />
                </IconButton>
                <Menu
                  anchorEl={mobileMenuAnchorEl}
                  open={mobileMenuOpen}
                  onClose={handleMobileMenuClose}
                >
                  <MenuItem>
                    <Typography variant="subtitle1" fontWeight="bold">Ponto de Venda</Typography>
                  </MenuItem>
                  {pontoVendaMenu.map((item) => (
                    <MenuItem 
                      key={item.name}
                      onClick={() => handleNavigation(item.path)}
                      selected={activePdVRoute === item.path}
                    >
                      <Box sx={{ mr: 1 }}>{item.icon}</Box>
                      <Typography>{item.name}</Typography>
                    </MenuItem>
                  ))}
                  
                  <Divider />
                  
                  <MenuItem>
                    <Typography variant="subtitle1" fontWeight="bold">PMS</Typography>
                  </MenuItem>
                  {pmsMenu.map((item) => (
                    <MenuItem 
                      key={item.name}
                      onClick={() => handleNavigation(item.path)}
                      selected={activePMSRoute === item.path}
                    >
                      <Box sx={{ mr: 1 }}>{item.icon}</Box>
                      <Typography>{item.name}</Typography>
                    </MenuItem>
                  ))}
                  
                  <Divider />

                  <MenuItem>
                    <Typography variant="subtitle1" fontWeight="bold">Voluntários</Typography>
                  </MenuItem>
                  {voluntariosMenu.map((item) => (
                    <MenuItem
                      key={item.name}
                      onClick={() => handleNavigation(item.path)}
                      selected={activeVoluntariosRoute === item.path}
                    >
                      <Box sx={{ mr: 1 }}>{item.icon}</Box>
                      <Typography>{item.name}</Typography>
                    </MenuItem>
                  ))}

                  <Divider />

                  <MenuItem onClick={() => navigate('/configuracoes')}>
                    <Box sx={{ mr: 1 }}><SettingsIcon fontSize="small" /></Box>
                    <Typography>Configurações</Typography>
                  </MenuItem>
                  
                  <MenuItem onClick={handleLogout}>
                    <Box sx={{ mr: 1 }}><LogoutIcon fontSize="small" /></Box>
                    <Typography>Sair</Typography>
                  </MenuItem>
                </Menu>
              </Box>
            </>
          )}
        </Toolbar>
      </AppBar>
      
      {/* Conteúdo principal */}
      <Box
        component="main" 
        sx={{ 
          flexGrow: 1, 
          p: 3, 
          overflow: 'auto',
          height: 'calc(100vh - 64px)',
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};

export default Layout;