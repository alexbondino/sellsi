import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Tabs,
  Tab,
  ThemeProvider,
  Paper,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import DescriptionIcon from '@mui/icons-material/Description';
import ReceiptIcon from '@mui/icons-material/Receipt';
import RequestQuoteIcon from '@mui/icons-material/RequestQuote';
import { dashboardThemeCore } from '../../../styles/dashboardThemeCore';
import { SPACING_BOTTOM_MAIN } from '../../../styles/layoutSpacing';
import { useAuth } from '../../../infrastructure/providers';

import FinancingDocuments from '../components/FinancingDocuments';
import InvoiceDocuments from '../components/InvoiceDocuments';
import QuotationDocuments from '../components/QuotationDocuments';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`documents-tabpanel-${index}`}
      aria-labelledby={`documents-tab-${index}`}
      {...other}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
}

function a11yProps(index) {
  return {
    id: `documents-tab-${index}`,
    'aria-controls': `documents-tabpanel-${index}`,
  };
}

export default function MyDocuments() {
  const [tabValue, setTabValue] = useState(0);
  const { currentAppRole } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
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
        <Container maxWidth={false} disableGutters={isMobile} sx={{ width: '100%' }}>
          {/* Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 4, px: { xs: 2, md: 0 } }}>
            <DescriptionIcon sx={{ color: 'primary.main', mr: 1, fontSize: 36 }} />
            <Box>
              <Typography variant="h4" fontWeight={600} color="primary.main">
                Mis Documentos
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Gestiona tus documentos de financiamiento, facturas y cotizaciones en un solo lugar.
              </Typography>
            </Box>
          </Box>

          {/* Tabs Container */}
          <Paper
            elevation={0}
            sx={{
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
              overflow: 'hidden',
              bgcolor: 'background.paper',
            }}
          >
            {/* Tab Headers */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs
                value={tabValue}
                onChange={handleTabChange}
                aria-label="secciones de documentos"
                variant={isMobile ? 'scrollable' : 'standard'}
                scrollButtons={isMobile ? 'auto' : false}
                sx={{
                  px: { xs: 1, md: 2 },
                  '& .MuiTab-root': {
                    py: 2,
                    px: { xs: 1.5, md: 2.5 },
                    fontWeight: 600,
                    fontSize: { xs: '0.82rem', md: '0.92rem' },
                    textTransform: 'none',
                    color: 'text.secondary',
                    minHeight: 56,
                    gap: 0.75,
                  },
                  '& .Mui-selected': {
                    color: 'primary.main',
                  },
                  '& .MuiTabs-indicator': {
                    backgroundColor: 'primary.main',
                    height: 3,
                    borderTopLeftRadius: 3,
                    borderTopRightRadius: 3,
                  },
                }}
              >
                <Tab
                  icon={<DescriptionIcon fontSize="small" />}
                  iconPosition="start"
                  label="Financiamiento"
                  {...a11yProps(0)}
                />
                <Tab
                  icon={<ReceiptIcon fontSize="small" />}
                  iconPosition="start"
                  label="Facturas"
                  {...a11yProps(1)}
                />
                <Tab
                  icon={<RequestQuoteIcon fontSize="small" />}
                  iconPosition="start"
                  label="Cotizaciones"
                  {...a11yProps(2)}
                />
              </Tabs>
            </Box>

            {/* Tab Panels */}
            <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: 'background.default' }}>
              <TabPanel value={tabValue} index={0}>
                <FinancingDocuments role={currentAppRole} />
              </TabPanel>
              <TabPanel value={tabValue} index={1}>
                <InvoiceDocuments role={currentAppRole} />
              </TabPanel>
              <TabPanel value={tabValue} index={2}>
                <QuotationDocuments role={currentAppRole} />
              </TabPanel>
            </Box>
          </Paper>
        </Container>
      </Box>
    </ThemeProvider>
  );
}
