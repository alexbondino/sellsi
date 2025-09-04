// 📁 app/pages/legal/PrivacyPolicyPage.jsx
import React from 'react';
import { Box, Typography, useTheme, useMediaQuery, Container, Paper } from '@mui/material';
import { Security as SecurityIcon } from '@mui/icons-material';
import { privacyContent } from '../../../shared/constants/content/privacyContent';
import { TextFormatter } from '../../../shared/components/formatters';
import { SPACING_BOTTOM_MAIN } from '../../../styles/layoutSpacing';

const PrivacyPolicyPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
  <Container maxWidth="lg" sx={{ py: 4, pb: SPACING_BOTTOM_MAIN, px: { xs: 0, md: 3 } }}>
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
            // avoid adding extra lateral padding on mobile — AppShell/Container provide gutter
            p: { xs: 0.5, md: 3 },
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <SecurityIcon sx={{ color: '#41B6E6', fontSize: '2rem' }} />
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                color: '#2E52B2',
                fontSize: { xs: '1.5rem', md: '2rem' },
              }}
            >
              Política de Privacidad
            </Typography>
          </Box>
        </Box>

        {/* Content */}
        <Box
          sx={{
            // content should not add mobile padding so gutter stays at 0.75
            p: { xs: 0.5, md: 4 },
            bgcolor: '#fff',
            minHeight: '60vh',
          }}
        >
          <TextFormatter text={privacyContent} />
        </Box>
      </Paper>
    </Container>
  );
};

export default PrivacyPolicyPage;
