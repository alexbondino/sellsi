// 📁 domains/auth/components/PrivateRoute.jsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';

const PrivateRoute = ({
  children,
  isAuthenticated,
  needsOnboarding,
  loading,
  redirectTo = '/login',
}) => {
  const location = useLocation();
  const isOnboardingRoute = location.pathname === '/onboarding';

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

  // 1) Si no está autenticado -> a login
  if (!isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  // 2) Si está autenticado y YA completó el onboarding:
  //    - Si intenta entrar a /onboarding -> mándalo al home
  if (!needsOnboarding && isOnboardingRoute) {
    return <Navigate to="/" replace />;
  }

  // 3) Si está autenticado y AÚN NO completa el onboarding:
  //    - Si NO está en /onboarding -> forzar a /onboarding
  if (needsOnboarding && !isOnboardingRoute) {
    return <Navigate to="/onboarding" replace />;
  }

  // 4) En cualquier otro caso, renderiza el children
  return children;
};

export default PrivateRoute;
