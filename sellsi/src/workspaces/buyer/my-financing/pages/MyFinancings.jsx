/**
 * ============================================================================
 * BUYER MY-FINANCINGS PAGE - Página para solicitar financiamiento
 * ============================================================================
 * 
 * Página simple con botón para abrir modal de solicitud de financiamiento.
 */

import React, { useState } from 'react';
import { Box, Container, Typography, Button, ThemeProvider } from '@mui/material';
import RequestQuoteIcon from '@mui/icons-material/RequestQuote';
import useMediaQuery from '@mui/material/useMediaQuery';
import { dashboardThemeCore } from '../../../../styles/dashboardThemeCore';
import { SPACING_BOTTOM_MAIN } from '../../../../styles/layoutSpacing';
import FinancingModals from '../components/FinancingModals';

const MyFinancings = () => {
  const isMobile = useMediaQuery(dashboardThemeCore.breakpoints.down('md'));
  const [modalOpen, setModalOpen] = useState(false);

  const handleFinancingSubmit = async (data) => {
    // Use dynamic import to avoid runtime `require` errors in the browser
    const module = await import('../services/financingService');
    const svc = module?.default || module;
    const { createExpressRequest, createExtendedRequest } = svc;

    try {
      if (data.type === 'express') {
        await createExpressRequest({ formData: data });
      } else if (data.type === 'extended') {
        await createExtendedRequest({ formData: data });
      } else {
        throw new Error('Tipo de solicitud desconocido');
      }
      // Éxito
      const toastModule = await import('react-hot-toast');
      const toast = toastModule?.default || toastModule;
      toast.success('Solicitud de financiamiento enviada exitosamente', { icon: '✅', duration: 3000 });
    } catch (error) {
      const toastModule = await import('react-hot-toast');
      const toast = toastModule?.default || toastModule;
      console.error('Error al enviar solicitud de financiamiento:', error);
      toast.error('Error al enviar la solicitud. Intenta nuevamente o contacta soporte', { duration: 5000 });
      throw error; // re-throw para que el modal permanezca abierto
    }
  };

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
            <RequestQuoteIcon
              sx={{ color: 'primary.main', mr: 1, fontSize: 36 }}
            />
            <Typography
              variant="h4"
              fontWeight={600}
              color="primary.main"
              gutterBottom
            >
              Solicitar Financiamiento
            </Typography>
          </Box>

          {/* Botón principal */}
          <Box sx={{ px: { xs: 2, md: 0 } }}>
            <Button
              variant="contained"
              size="large"
              startIcon={<RequestQuoteIcon />}
              onClick={() => setModalOpen(true)}
              sx={{
                backgroundColor: '#2E52B2',
                '&:hover': {
                  backgroundColor: '#1e3a7a',
                },
                py: 1.5,
                px: 4,
              }}
            >
              Solicitar Financiamiento
            </Button>
          </Box>
        </Container>
      </Box>

      {/* Sistema de Modales de Financiamiento */}
      <FinancingModals
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleFinancingSubmit}
      />
    </ThemeProvider>
  );
};

export default MyFinancings;
