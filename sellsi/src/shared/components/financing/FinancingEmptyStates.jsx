/**
 * ============================================================================
 * FINANCING EMPTY STATES (SHARED)
 * ============================================================================
 * 
 * Estados vacíos parametrizados para vistas de financiamiento.
 * Reutilizable entre Supplier y Buyer.
 */

import React from 'react';
import { Paper, Box, Typography, Button } from '@mui/material';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import { useNavigate } from 'react-router-dom';

/**
 * Estado vacío global - No hay financiamientos
 */
export const EmptyStateGlobal = ({ role = 'supplier' }) => {
  const navigate = useNavigate();

  const config = {
    supplier: {
      title: 'Aún no tienes solicitudes de financiamiento',
      description: 'Aquí verás las solicitudes de financiamiento que recibas de compradores.',
      buttonText: 'Ver mis productos publicados',
      buttonAction: () => navigate('/supplier/myproducts'),
    },
    buyer: {
      title: 'Aún no has solicitado financiamiento',
      description: 'Solicita financiamiento para tus compras y gestiona tus solicitudes desde aquí.',
      buttonText: null,
      buttonAction: null,
    },
  };

  const content = config[role];

  return (
    <Paper sx={{ p: { xs: 3, md: 4 }, textAlign: 'center' }}>
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
        <AccountBalanceIcon sx={{ fontSize: 48, color: 'primary.main' }} />
      </Box>
      <Typography variant="h6" color="text.secondary" sx={{ fontSize: { md: '1.5rem' }, mb: 1 }}>
        {content.title}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ fontSize: { md: '1.05rem' } }}>
        {content.description}
      </Typography>
      {content.buttonText && (
        <Box sx={{ mt: 3 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={content.buttonAction}
          >
            {content.buttonText}
          </Button>
        </Box>
      )}
    </Paper>
  );
};

/**
 * Estado vacío por filtro - No hay con ese filtro
 */
export const EmptyStateFiltered = () => (
  <Paper sx={{ p: { xs: 3, md: 4 }, textAlign: 'center' }}>
    <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
      <AccountBalanceIcon sx={{ fontSize: 40,  color: 'primary.main' }} />
    </Box>
    <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
      No hay financiamientos con este estado
    </Typography>
    <Typography variant="body2" color="text.secondary">
      Intenta seleccionar otro filtro o cambia a "Todos" para ver el listado completo.
    </Typography>
  </Paper>
);

/**
 * Estado vacío para aprobados
 */
export const EmptyStateApproved = () => (
  <Paper sx={{ p: { xs: 3, md: 4 }, textAlign: 'center' }}>
    <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
      <AccountBalanceIcon sx={{ fontSize: 48, color: 'primary.main' }} />
    </Box>
    <Typography variant="h6" color="text.secondary" sx={{ fontSize: { md: '1.5rem' } }}>
      No tienes financiamientos aprobados aún
    </Typography>
    <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 2, fontSize: { md: '1.05rem' } }}>
      Aquí verás los financiamientos que han sido aprobados por Sellsi.
    </Typography>
  </Paper>
);
