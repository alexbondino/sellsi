import React from 'react';
import { Box, Typography, Container, ThemeProvider } from '@mui/material';
import { LocalOffer as OffersIcon } from '@mui/icons-material'
import useMediaQuery from '@mui/material/useMediaQuery';
import { dashboardThemeCore } from '../../../../styles/dashboardThemeCore';
import { SPACING_BOTTOM_MAIN } from '../../../../styles/layoutSpacing';
import OffersList from './components/OffersList';
import { useBuyerOffers } from './hooks/useBuyerOffers';

const BuyerOffers = () => {
  const isMobile = useMediaQuery(dashboardThemeCore.breakpoints.down('md'));
  const { offers, loading, error, cancelOffer, deleteOffer } = useBuyerOffers();

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
        <Container maxWidth={isMobile ? false : 'xl'} disableGutters={isMobile ? true : false}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
            <OffersIcon sx={{ color: 'primary.main', mr: 1, fontSize: '1.75rem' }} />
            <Typography variant="h4" fontWeight={600} color="primary.main" gutterBottom>
              Mis Ofertas
            </Typography>
          </Box>

          <OffersList 
            offers={offers} 
            loading={loading} 
            error={error} 
            cancelOffer={cancelOffer}
            deleteOffer={deleteOffer}
          />
        </Container>
      </Box>
    </ThemeProvider>
  );
};

export default BuyerOffers;
