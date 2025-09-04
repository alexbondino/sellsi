// 📁 src/app/pages/landing/components/ContactSection.jsx
import React, { useState, useMemo } from 'react';
import { Box, Typography, TextField, Button, Alert } from '@mui/material';

export default function ContactSection({ contactRef, onSubmit }) {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [status, setStatus] = useState(null); // 'ok' | 'error' | null
  const [loading, setLoading] = useState(false);

  const isValidEmail = useMemo(
    () => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
    [email]
  );
  const isFormValid =
    nombre.trim().length > 1 && isValidEmail && mensaje.trim().length > 1;

  const handleSubmit = async e => {
    e.preventDefault();
    if (!isFormValid) return;

    setLoading(true);
    setStatus(null);
    try {
      if (onSubmit) {
        await onSubmit({ nombre, email, mensaje });
      } else {
        await new Promise(r => setTimeout(r, 600)); // simulación
      }
      setStatus('ok');
      setNombre('');
      setEmail('');
      setMensaje('');
    } catch {
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      ref={contactRef}
      sx={{
        px: {
          xs: 'max(25px, env(safe-area-inset-left))', // Telefonos Chicos
          sm: 'max(30px, env(safe-area-inset-left))', // Telefonos grandes
          mac: '180px', //  Mac M1
          lg: '250px', // 1080p
          xl: '250px', // 2K
        },
        width: '100%',
        boxSizing: 'border-box',
        py: { xs: 6, sm: 7, md: 8, mac: 6, lg: 9, xl: 9 },
        backgroundColor: '#fff',
      }}
    >
      {/* Título */}
      <Typography
        variant="h3"
        sx={{
          fontFamily: 'Inter, sans-serif',
          fontWeight: 800,
          color: 'primary.main',
          fontSize: { xs: '1.8rem', sm: '2rem', md: '2.6rem' },
          textAlign: { xs: 'center', md: 'left' },
        }}
      >
        Contáctanos
      </Typography>

      {/* 👇 Mensaje humano (nuevo) */}
      <Typography
        variant="body1"
        sx={{
          mt: { xs: 1.5, md: 2 },
          mb: { xs: 3, md: 4 },
          color: 'text.secondary',
          lineHeight: 1.7,
          fontSize: { xs: '1rem', md: '1.1rem' },
        }}
      >
        Estamos aquí para ayudarte. Cuéntanos brevemente qué necesitas (y si
        eres{' '}
        <Box component="span" sx={{ fontWeight: 700 }}>
          comprador
        </Box>{' '}
        o{' '}
        <Box component="span" sx={{ fontWeight: 700 }}>
          proveedor
        </Box>
        ); solemos responder en menos de{' '}
        <Box component="span" sx={{ fontWeight: 700 }}>
          24&nbsp;horas hábiles
        </Box>
        .
      </Typography>

      {/* Mensajes de estado */}
      {status === 'ok' && (
        <Alert severity="success" sx={{ mb: 3 }}>
          ¡Gracias! Te contactaremos pronto.
        </Alert>
      )}
      {status === 'error' && (
        <Alert severity="error" sx={{ mb: 3 }}>
          Hubo un problema al enviar tu mensaje. Inténtalo nuevamente.
        </Alert>
      )}

      {/* Formulario */}
      <Box component="form" noValidate onSubmit={handleSubmit}>
        {/* Nombre */}
        <Typography variant="subtitle1" sx={{ mb: 1 }}>
          Nombre
        </Typography>
        <TextField
          fullWidth
          variant="outlined"
          value={nombre}
          onChange={e => setNombre(e.target.value)}
          autoComplete="name"
          InputProps={{ sx: { borderRadius: 2 } }}
          sx={{ mb: 3 }}
        />

        {/* Correo Electronico */}
        <Typography variant="subtitle1" sx={{ mb: 1 }}>
          Correo Electronico
        </Typography>
        <TextField
          fullWidth
          variant="outlined"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          autoComplete="email"
          InputProps={{ sx: { borderRadius: 2 } }}
          error={email.length > 0 && !isValidEmail}
          helperText={
            email.length > 0 && !isValidEmail ? 'Ingresa un correo válido' : ' '
          }
          sx={{ mb: 3 }}
        />

        {/* Mensaje */}
        <Typography variant="subtitle1" sx={{ mb: 1 }}>
          Mensaje
        </Typography>
        <TextField
          fullWidth
          variant="outlined"
          multiline
          minRows={6}
          value={mensaje}
          onChange={e => setMensaje(e.target.value)}
          InputProps={{ sx: { borderRadius: 2 } }}
          sx={{ mb: 4 }}
        />

        <Button
          type="submit"
          variant="contained"
          color="primary"
          disabled={!isFormValid || loading}
          sx={{
            minWidth: 160,
            fontWeight: 700,
            width: '100%',
            height: '50px',
          }}
        >
          {loading ? 'Enviando...' : 'Enviar'}
        </Button>
      </Box>
    </Box>
  );
}
