import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import authService from '../services/auth';

const ProtectedRoute = ({ children }) => {
  const [status, setStatus] = useState('checking');

  useEffect(() => {
    let mounted = true;

    const verifySession = async () => {
      if (!authService.isAuthenticated()) {
        if (mounted) setStatus('unauthenticated');
        return;
      }

      const user = await authService.validateSession();
      if (mounted) {
        setStatus(user ? 'authenticated' : 'unauthenticated');
      }
    };

    verifySession();
    return () => {
      mounted = false;
    };
  }, []);

  if (status === 'checking') {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (status !== 'authenticated') {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
