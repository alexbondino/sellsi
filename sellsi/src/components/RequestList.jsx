import React from 'react';
import { Box, Paper, Typography } from '@mui/material';

const getTimeAgo = timestamp => {
  const now = new Date();
  const created = new Date(timestamp);

  console.log('🕓 now:', now.toISOString());
  console.log('🕓 createddt:', created.toISOString());

  if (isNaN(created)) return 'Fecha inválida';

  const diffMs = now - created;

  // Si la fecha es futura, mostrar mensaje genérico
  if (diffMs < 0) return 'Menos de 1 minuto';

  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / (3600000 * 24));

  if (diffMins < 1) return 'Menos de 1 minuto';
  if (diffMins < 60)
    return `Hace ${diffMins} minuto${diffMins !== 1 ? 's' : ''}`;
  if (diffHours < 24)
    return `Hace ${diffHours} hora${diffHours !== 1 ? 's' : ''}`;
  return `Hace ${diffDays} día${diffDays !== 1 ? 's' : ''}`;
};

const RequestList = ({ weeklyRequests }) => (
  <Paper sx={{ p: 2, height: '100%' }}>
    <Typography
      variant="h6"
      sx={{ mb: 2, fontWeight: 'bold', textAlign: 'center' }}
    >
      Solicitudes Recientes
    </Typography>
    <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
      {weeklyRequests.length === 0 ? (
        <Typography variant="body2" align="center" color="text.secondary">
          No hay solicitudes esta semana.
        </Typography>
      ) : (
        weeklyRequests.map((req, index) => (
          <Box
            key={index}
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderTop: index === 0 ? '1px solid #ddd' : 'none',
              borderBottom: '1px solid #ddd',
              py: 1,
              px: 1.5,
            }}
          >
            <Typography fontWeight="bold">
              {req.productqty ?? 'N/A'} ·{' '}
              {req.products?.productnm || 'Producto'}
            </Typography>
            <Box textAlign="right">
              <Typography fontWeight="bold">
                {req.sellers?.sellernm || 'Cliente'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {getTimeAgo(req.createddt)}
              </Typography>
            </Box>
          </Box>
        ))
      )}
    </Box>
  </Paper>
);

export default RequestList;
