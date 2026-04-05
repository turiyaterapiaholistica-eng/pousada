import React, { useState } from 'react';
import {
  Dialog, DialogContent, Box, Typography, TextField, Button,
  Alert, Divider, Chip, Avatar, LinearProgress,
} from '@mui/material';
import LoginIcon from '@mui/icons-material/Login';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/auth';

const BADGE_HABILIDADE_STYLE = { bgcolor: '#EAF3DE', color: '#27500A' };
const BADGE_CONQUISTA_STYLE  = { bgcolor: '#FAEEDA', color: '#633806' };

function AvatarColorido({ nome, size = 56 }) {
  const cores = ['#1a3a2a', '#2e7d32', '#1565c0', '#6a1b9a', '#bf360c'];
  const idx = nome ? nome.charCodeAt(0) % cores.length : 0;
  const iniciais = nome
    ? nome.trim().split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase()
    : '?';
  return (
    <Avatar sx={{ width: size, height: size, bgcolor: cores[idx], fontSize: size * 0.38, fontWeight: 700 }}>
      {iniciais}
    </Avatar>
  );
}

export default function VolunteerLoginModal({ open, volunteer, onClose }) {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authService.login(username.trim(), password);
      onClose();
      // Redireciona por tipo de dispositivo
      const isMobile = window.innerWidth < 768;
      navigate(isMobile ? '/voluntarios/painel' : '/voluntarios/painel');
    } catch {
      setError('Usuário ou senha incorretos.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setUsername('');
    setPassword('');
    setError('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogContent sx={{ p: 3 }}>

        {/* Perfil do voluntário (quando clicado de um card) */}
        {volunteer && (
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5 }}>
              <AvatarColorido nome={volunteer.nome} size={56} />
              <Box>
                <Typography variant="h6" fontWeight={700}>{volunteer.nome}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {volunteer.pais_origem}{volunteer.idiomas ? ` · ${volunteer.idiomas}` : ''}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {volunteer.semanas_na_pousada} semana{volunteer.semanas_na_pousada !== 1 ? 's' : ''} na pousada
                </Typography>
              </Box>
            </Box>

            {volunteer.bio && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, fontStyle: 'italic' }}>
                "{volunteer.bio}"
              </Typography>
            )}

            {/* Habilidades */}
            {volunteer.habilidades?.length > 0 && (
              <Box sx={{ mb: 1 }}>
                <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" sx={{ mb: 0.5 }}>
                  Habilidades
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {volunteer.habilidades.map(b => (
                    <Chip key={b.id} label={b.nome} size="small"
                      sx={{ ...BADGE_HABILIDADE_STYLE, fontWeight: 600, fontSize: 10, height: 20 }} />
                  ))}
                </Box>
              </Box>
            )}

            {/* Conquistas */}
            {volunteer.conquistas?.length > 0 && (
              <Box sx={{ mb: 1.5 }}>
                <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" sx={{ mb: 0.5 }}>
                  Conquistas
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {volunteer.conquistas.map(c => (
                    <Chip key={c.id} label={c.badge.nome} size="small"
                      sx={{ ...BADGE_CONQUISTA_STYLE, fontWeight: 600, fontSize: 10, height: 20 }} />
                  ))}
                </Box>
              </Box>
            )}

            {/* Horas */}
            <Box sx={{ mb: 1.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.25 }}>
                <Typography variant="caption" color="text.secondary">Horas esta semana</Typography>
                <Typography variant="caption" fontWeight={700}>{volunteer.horas_semana || 0}h / 25h</Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={Math.min(((volunteer.horas_semana || 0) / 25) * 100, 100)}
                color={((volunteer.horas_semana || 0) / 25) >= 1 ? 'success' : ((volunteer.horas_semana || 0) / 25) >= 0.7 ? 'warning' : 'error'}
                sx={{ height: 6, borderRadius: 3 }}
              />
            </Box>

            <Divider sx={{ my: 2 }} />
          </Box>
        )}

        {/* Formulário de login */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <LoginIcon sx={{ color: '#1a3a2a' }} />
          <Typography variant="subtitle1" fontWeight={700}>
            {volunteer ? 'Acessar sua conta' : 'Entrar'}
          </Typography>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Box component="form" onSubmit={handleLogin}>
          <TextField
            fullWidth
            label="Usuário"
            value={username}
            onChange={e => setUsername(e.target.value)}
            autoComplete="username"
            sx={{ mb: 2 }}
            size="small"
            required
          />
          <TextField
            fullWidth
            label="Senha"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoComplete="current-password"
            sx={{ mb: 2 }}
            size="small"
            required
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={loading}
            sx={{ bgcolor: '#1a3a2a', '&:hover': { bgcolor: '#2e7d32' }, py: 1.2 }}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </Button>
        </Box>

        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1.5, textAlign: 'center' }}>
          Usuário e senha fornecidos pelo gestor
        </Typography>
      </DialogContent>
    </Dialog>
  );
}
