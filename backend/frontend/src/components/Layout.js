// components/Layout.js
import React from 'react';
import { AppBar, Toolbar, Typography, Button, Container } from '@mui/material';
import { Link as RouterLink, Outlet } from 'react-router-dom';

export default function Layout() {
  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Villa Container Lodge
          </Typography>
          <Button color="inherit" component={RouterLink} to="/">
            Consumação
          </Button>
          <Button color="inherit" component={RouterLink} to="/comandas">
            Gestão de Comandas
          </Button>
        </Toolbar>
      </AppBar>
      <Container sx={{ mt: 4 }}>
        <Outlet />
      </Container>
    </>
  );
}