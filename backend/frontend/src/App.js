import React, { StrictMode } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { createRoot } from 'react-dom/client';

import Consumacao from './pages/Consumacao';
import Layout from './components/Layout';
import GestaoComandas from './pages/GestaoComandas';
import Dashboard from './pages/Dashboard';
import LoginPage from './pages/LoginPage';
import PublicMenu from './pages/PublicMenu';
import ProtectedRoute from './components/ProtectedRoute';

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
            
            {/* Protected routes wrapped in Layout */}
            <Route element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }>
              <Route index element={<Consumacao />} />
              <Route path="comandas" element={<GestaoComandas />} />
              <Route path="dashboard" element={<Dashboard />} />
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
