import React from 'react';
import { Navigate } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';

/**
 * Ruta protegida: solo actúa como guard visual.
 * Recibe el estado de sesión y onboarding ya validado desde App.jsx o AuthContext.
 * @param {React.ReactNode} children - Componentes a renderizar si está autenticado y con onboarding completo
 * @param {boolean} isAuthenticated - ¿El usuario está autenticado?
 * @param {boolean} needsOnboarding - ¿El usuario necesita completar onboarding?
 * @param {boolean} loading - ¿Está cargando la validación?
 * @param {string} redirectTo - Ruta a la que redirigir si no está autenticado (default: '/login')
 */
const PrivateRoute = ({
  children,
  isAuthenticated,
  needsOnboarding,
  loading,
  redirectTo = '/login',
}) => {
  // Loading visual centralizado
  if (loading) {
    return (
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.default',
          zIndex: 2000,
        }}
      >
        <CircularProgress size={40} sx={{ mb: 2 }} />
        <Typography variant="body2" color="text.secondary">
          Verificando sesión...
        </Typography>
      </Box>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  if (needsOnboarding) {
    return <Navigate to="/onboarding" replace />;
  }

  return children;
};

export default PrivateRoute;
