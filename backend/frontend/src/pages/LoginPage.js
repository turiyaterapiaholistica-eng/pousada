import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Container,
  Link
} from '@mui/material';
import authService from '../services/auth';

const LoginPage = () => {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await authService.login(credentials.username, credentials.password);
      navigate('/');
    } catch (error) {
      setError(
        error.response?.data?.detail || 
        'Failed to login. Please check your credentials.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ 
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      bgcolor: 'grey.50'
    }}>
      <AppBar position="static">
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Typography variant="h6">
            Villa Container Lodge
          </Typography>
          <Button 
            color="inherit"
            onClick={() => navigate('/menu')}
          >
            MENU
          </Button>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Container 
        maxWidth="sm" 
        sx={{ 
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          py: 4
        }}
      >
        <Card sx={{ width: '100%', boxShadow: 4 }}>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Typography variant="h5" component="h1" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                Acesso para funcionário
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Favor logar para acesso ao sistema de gerenciamento
              </Typography>
            </Box>
            
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}
            
            <form onSubmit={handleLogin}>
              <TextField
                fullWidth
                label="Username"
                variant="outlined"
                value={credentials.username}
                onChange={(e) => setCredentials({
                  ...credentials,
                  username: e.target.value
                })}
                required
                disabled={loading}
                sx={{ mb: 2 }}
              />
              
              <TextField
                fullWidth
                type="password"
                label="Password"
                variant="outlined"
                value={credentials.password}
                onChange={(e) => setCredentials({
                  ...credentials,
                  password: e.target.value
                })}
                required
                disabled={loading}
                sx={{ mb: 3 }}
              />
              
              <Button 
                type="submit"
                variant="contained" 
                fullWidth
                disabled={loading}
                size="large"
                sx={{ py: 1.5 }}
              >
                {loading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  'Acessar'
                )}
              </Button>
              
              <Box sx={{ textAlign: 'center', mt: 2 }}>
                <Link
                  component="button"
                  variant="body2"
                  onClick={() => navigate('/menu')}
                  sx={{ 
                    color: 'text.secondary',
                    '&:hover': { color: 'text.primary' }
                  }}
                >
                  Retornar ao menu
                </Link>
              </Box>
            </form>
          </CardContent>
        </Card>
      </Container>
      
      {/* Footer */}
      <Box sx={{ 
        py: 2, 
        textAlign: 'center', 
        bgcolor: 'white', 
        borderTop: 1, 
        borderColor: 'divider'
      }}>
        <Typography variant="body2" color="text.secondary">
          © {new Date().getFullYear()} Villa Container Lodge. All rights reserved.
        </Typography>
      </Box>
    </Box>
  );
};

export default LoginPage;