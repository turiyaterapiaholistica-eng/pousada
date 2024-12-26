// import React from 'react';
// import {createRoot} from 'react-dom/client';

// export default function App() {
//   return (
//     <div>App</div>
//   );
// }


// const appDiv = document.getElementById("app");
// const root = createRoot(appDiv);
// root.render(<App />);

// App.js
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import {createRoot} from 'react-dom/client';

import Consumacao from './pages/Consumacao';
import Layout from './components/Layout';
import GestaoComandas from './pages/GestaoComandas';
import Dashboard from './pages/Dashboard';

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
            <Route path="/" element={<Layout />}>
              <Route index element={<Consumacao />} />
              <Route path="comandas" element={<GestaoComandas />} />
              <Route path="dashboard" element={<Dashboard />} />

            </Route>
          </Routes>
        </BrowserRouter>
      </LocalizationProvider>
    </ThemeProvider>
  );
}

export default App;

const appDiv = document.getElementById("app");
const root = createRoot(appDiv);
root.render(<App />);