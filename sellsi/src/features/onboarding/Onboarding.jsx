// RUTA: src/features/onboarding/Onboarding.jsx

import React from 'react';
import { Box, Typography, Container, Paper } from '@mui/material';

// 1. Define un componente funcional de React.
const Onboarding = () => {
  return (
    <Container component="main" maxWidth="sm" sx={{ mt: 8 }}>
      <Paper
        elevation={3}
        sx={{
          p: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Typography component="h1" variant="h4" gutterBottom>
          ¡Bienvenido a Sellsi!
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
          Vamos a configurar tu cuenta.
        </Typography>
        <Box sx={{ width: '100%' }}>
          {/*
            AQUÍ ES DONDE CONSTRUIREMOS EL FORMULARIO DE ONBOARDING
            Por ahora, solo con este texto es suficiente para que React lo renderice.
          */}
          <Typography>Página de Onboarding en construcción...</Typography>
        </Box>
      </Paper>
    </Container>
  );
};

// 2. ¡La línea más importante! Exporta el componente por defecto.
export default Onboarding;
