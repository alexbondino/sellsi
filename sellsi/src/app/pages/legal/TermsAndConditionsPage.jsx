// 📁 app/pages/legal/TermsAndConditionsPage.jsx
import React from 'react';
import { Box, Typography, useTheme, useMediaQuery, Container, Paper } from '@mui/material';
import { Gavel as GavelIcon } from '@mui/icons-material';
import { termsContent } from '../../../shared/constants/content/termsContent';
import { TextFormatter } from '../../../shared/components/formatters';
import { SPACING_BOTTOM_MAIN } from '../../../styles/layoutSpacing';

const TermsAndConditionsPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <Container maxWidth="lg" sx={{ py: 4, pb: SPACING_BOTTOM_MAIN }}>
      <Paper
        elevation={3}
        sx={{
          borderRadius: 3,
          overflow: 'hidden',
          minHeight: '80vh',
          width: { xs: '100%', md: '85%' },
          mx: 'auto',
        }}
      >
        {/* Header */}
        <Box
          sx={{
            bgcolor: '#f8f9fa',
            borderBottom: '2px solid #41B6E6',
            p: { xs: 2, md: 3 },
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <GavelIcon sx={{ color: '#41B6E6', fontSize: '2rem' }} />
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                color: '#2E52B2',
                fontSize: { xs: '1.5rem', md: '2rem' },
              }}
            >
              Términos y Condiciones
            </Typography>
          </Box>
        </Box>

        {/* Content */}
        <Box
          sx={{
            p: { xs: 2, md: 4 },
            bgcolor: '#fff',
            minHeight: '60vh',
          }}
        >
          <TextFormatter text={termsContent} />
        </Box>
      </Paper>
    </Container>
  );
};

export default TermsAndConditionsPage;
