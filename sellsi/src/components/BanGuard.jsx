import React, { Suspense } from 'react';
import { useBanStatus } from '../hooks/useBanStatus';
import Loader from './Loader';
import { Box, CircularProgress } from '@mui/material';

// Lazy import para evitar conflicto con App.jsx
const BanPageView = React.lazy(() => import('../features/ban/BanPageView'));

/**
 * Componente guardian que verifica el estado de ban antes de renderizar el contenido
 * Si el usuario o IP está baneado, muestra la página de ban
 * Si no está baneado, renderiza el contenido normal
 */
const BanGuard = ({ children, userId = null }) => {
  const { banStatus, isLoading, error } = useBanStatus(userId, true);

  // Mostrar loader mientras se verifica el estado de ban
  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          backgroundColor: '#ffffff',
        }}
      >
        <Loader size={80} logoSize={48} />
      </Box>
    );
  }

  // Si hay error verificando el ban, permitir acceso (fail-safe)
  if (error) {
    console.error('Error en BanGuard:', error);
    return children;
  }

  // Si el usuario está baneado, mostrar la página de ban
  if (banStatus.isBanned) {
    return (
      <Suspense fallback={<CircularProgress />}>
        <BanPageView />
      </Suspense>
    );
  }

  // Si no está baneado, renderizar el contenido normal
  return children;
};

export default BanGuard;
