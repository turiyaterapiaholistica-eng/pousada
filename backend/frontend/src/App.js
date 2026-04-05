import React, { StrictMode } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { createRoot } from 'react-dom/client';

import Consumacao from './pages/Consumacao';
import Layout from './components/Layout';
import GestaoComandas from './pages/GestaoComandas';
import LoginPage from './pages/LoginPage';
import PublicMenu from './pages/PublicMenu';
import ProtectedRoute from './components/ProtectedRoute';
import ImageUpload from './pages/ImageUpload';
import RestaurantDashboard from './pages/Dashboard';
import ComprasPage from './pages/ComprasPage';
import EstoquePage from './pages/EstoquePage';
import AnalysisPage from './pages/AnalysisPage';
import ItemManagementPage from './pages/ItemManagementPage';

// PMS Pages
import NovaReservaPage from './pages/pms/NovaReservaPage'; 
import ListaReservasPage from './pages/pms/ListaReservasPage';
import MapaReservasPage from './pages/pms/MapaReservasPage';
import CheckinCheckoutPage from './pages/pms/CheckinCheckoutPage';
import SettingsPage from './pages/pms/SettingsPage';

// Voluntários pages
import ActivityLibrary from './pages/volunteers/ActivityLibrary';
import PublicVolunteersPage from './pages/volunteers/PublicVolunteersPage';
import VolunteerPanelPage from './pages/volunteers/VolunteerPanelPage';
import GestaoVoluntariosPage from './pages/volunteers/GestaoVoluntariosPage';
import MinhasTarefasPage from './pages/volunteers/MinhasTarefasPage';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/menu" element={<PublicMenu />} />
            <Route path="/voluntarios" element={<PublicVolunteersPage />} />

            {/* Volunteer panel — protected but without main Layout */}
            <Route path="/voluntarios/painel" element={
              <ProtectedRoute>
                <VolunteerPanelPage />
              </ProtectedRoute>
            } />

            {/* Protected routes wrapped in Layout */}
            <Route element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }>
              {/* Restaurant routes */}
              <Route index element={<Consumacao />} />
              <Route path="comandas" element={<GestaoComandas />} />
              <Route path="/dashboard" element={<RestaurantDashboard />} />
              <Route path="images" element={<ImageUpload />} />
              <Route path="compras" element={<ComprasPage />} />
              <Route path="estoque" element={<EstoquePage />} />
              <Route path="relatorios" element={<AnalysisPage />} />
              <Route path="itens" element={<ItemManagementPage />} />
              
              {/* PMS routes */}
              <Route path="reservas/nova" element={<NovaReservaPage />} />
              <Route path="reservas/lista" element={<ListaReservasPage />} />
              <Route path="reservas/mapa" element={<MapaReservasPage />} />
              <Route path="reservas/checkin-checkout" element={<CheckinCheckoutPage />} />
              <Route path="configuracoes" element={<SettingsPage />} />
              
              {/* Voluntários routes */}
              <Route path="voluntarios/atividades" element={<ActivityLibrary />} />
              <Route path="voluntarios/gestao" element={<GestaoVoluntariosPage />} />
              <Route path="voluntarios/minhas-tarefas" element={<MinhasTarefasPage />} />
              
            </Route>
            
            {/* Redirect unmatched routes to public menu */}
            <Route path="*" element={<Navigate to="/menu" replace />} />
          </Routes>
        </BrowserRouter>
      </LocalizationProvider>
    </ThemeProvider>
  );
}

export default App;

const appDiv = document.getElementById("app");
const root = createRoot(appDiv);
root.render(
  <StrictMode>
    <App />
  </StrictMode>
);