/**
 * ============================================================================
 * SUPPLIER MY FINANCING - Página de Financiamientos para Proveedores
 * ============================================================================
 * 
 * Página principal del módulo de financiamiento para proveedores.
 * Muestra las solicitudes de financiamiento recibidas de los compradores.
 * 
 * Estructura similar a SupplierOffers para mantener consistencia visual.
 */

import React from 'react';
import { Box, Typography, Container, ThemeProvider } from '@mui/material';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import useMediaQuery from '@mui/material/useMediaQuery';
import { dashboardThemeCore } from '../../../../styles/dashboardThemeCore';
import { SPACING_BOTTOM_MAIN } from '../../../../styles/layoutSpacing';
import SupplierFinancingsList from '../components/SupplierFinancingsList';
import { useSupplierFinancings } from '../hooks/useSupplierFinancings';

const MyFinancing = () => {
  const isMobile = useMediaQuery(dashboardThemeCore.breakpoints.down('md'));
  const {
    financings,
    setFinancings,
    loading,
    initializing,
    approveFinancing,
    rejectFinancing,
    signFinancing,
    cancelFinancing,
  } = useSupplierFinancings();

  return (
    <ThemeProvider theme={dashboardThemeCore}>
      <Box
        sx={{
          backgroundColor: 'background.default',
          minHeight: '100vh',
          pt: { xs: 4.5, md: 5 },
          ml: { xs: 0, md: 10, lg: 14, xl: 24 },
          px: { xs: 0, md: 3 },
          pb: SPACING_BOTTOM_MAIN,
        }}
      >
        <Container
          maxWidth={false}
          disableGutters={isMobile}
          sx={{ width: '100%' }}
        >
          {/* Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 4, px: { xs: 2, md: 0 } }}>
            <AccountBalanceIcon
              sx={{ color: 'primary.main', mr: 1, fontSize: 36 }}
            />
            <Typography
              variant="h4"
              fontWeight={600}
              color="primary.main"
              gutterBottom
            >
              Mis Financiamientos
            </Typography>
          </Box>

          {/* Lista de Financiamientos */}
          <SupplierFinancingsList
            financings={financings}
            loading={loading}
            initializing={initializing}
            onApprove={approveFinancing}
            onReject={rejectFinancing}
            onSign={signFinancing}
            onCancel={cancelFinancing}
          />
        </Container>
      </Box>
    </ThemeProvider>
  );
};

export default MyFinancing;
