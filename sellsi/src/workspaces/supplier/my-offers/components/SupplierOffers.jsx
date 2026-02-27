import React from 'react';
import { Box, Typography, Container, ThemeProvider } from '@mui/material';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import useMediaQuery from '@mui/material/useMediaQuery';
import { dashboardThemeCore } from '../../../../styles/dashboardThemeCore';
import { SPACING_BOTTOM_MAIN } from '../../../../styles/layoutSpacing';
import SupplierOffersList from './SupplierOffersList';
import { useSupplierOffers } from '../hooks/useSupplierOffers';

// Vista: /supplier/offers
// Muy similar a BuyerOffers pero adaptada al proveedor y columnas solicitadas.
const SupplierOffers = () => {
  const isMobile = useMediaQuery(dashboardThemeCore.breakpoints.down('md'));
  const {
    offers,
    setOffers,
    acceptOffer,
    rejectOffer,
    deleteOffer,
    submitCounterOffer,
    loading,
    initializing,
  } = useSupplierOffers();

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
          disableGutters={isMobile ? true : false}
          sx={{ width: '100%' }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
            <LocalOfferIcon
              sx={{ color: 'primary.main', mr: 1, fontSize: '1.75rem' }}
            />
            <Typography
              variant="h4"
              fontWeight={600}
              color="primary.main"
            >
              Ofertas Recibidas
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 4, fontSize: { md: '0.95rem' } }}>
            Aquí aparecen las ofertas de precio que tus compradores te han enviado. Puedes aceptarlas, rechazarlas o enviar una contraoferta.
          </Typography>

          <SupplierOffersList
            offers={offers}
            setOffers={setOffers}
            acceptOffer={acceptOffer}
            rejectOffer={rejectOffer}
            deleteOffer={deleteOffer}
            submitCounterOffer={submitCounterOffer}
            loading={loading}
            initializing={initializing}
          />
        </Container>
      </Box>
    </ThemeProvider>
  );
};

export default SupplierOffers;
