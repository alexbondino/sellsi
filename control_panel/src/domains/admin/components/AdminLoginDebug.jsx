import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, TextField, Paper } from '@mui/material';
import { PrimaryButton } from '../../../shared/components/forms';

const AdminLoginDebug = () => {
  console.log('✅ AdminLoginDebug component rendering');
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Login attempt:', { username, password });
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #1a237e 0%, #3949ab 100%)',
      }}
    >
      <Paper elevation={24} sx={{ p: 4, width: 400 }}>
        <Typography variant="h4" align="center" gutterBottom>
          🔐 Admin Login (Debug)
        </Typography>

        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Usuario"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            margin="normal"
          />
          
          <TextField
            fullWidth
            label="Contraseña"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            margin="normal"
          />
          
          <PrimaryButton
            fullWidth
            type="submit"
            sx={{ mt: 3 }}
          >
            Iniciar Sesión
          </PrimaryButton>
        </form>
      </Paper>
    </Box>
  );
};

export default AdminLoginDebug;
