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
    console.log('Solicitud de financiamiento:', data);
    // TODO: Enviar a backend
    setModalOpen(false);
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
