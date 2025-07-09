import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
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
  const location = useLocation();
  // console.log('[PrivateRoute]', { isAuthenticated, needsOnboarding, loading, redirectTo, pathname: location.pathname });
  // Loading visual centralizado
  if (loading) {
    // console.log('[PrivateRoute] loading...');
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
    // console.log('[PrivateRoute] not authenticated, redirecting');
    return <Navigate to={redirectTo} replace />;
  }

  if (needsOnboarding) {
    if (location.pathname === '/onboarding') {
      // console.log('[PrivateRoute] needs onboarding, already in /onboarding, rendering children');
      return children;
    }
    // console.log('[PrivateRoute] needs onboarding, redirecting');
    return <Navigate to="/onboarding" replace />;
  }

  // console.log('[PrivateRoute] rendering children');
  return children;
};

export default PrivateRoute;
