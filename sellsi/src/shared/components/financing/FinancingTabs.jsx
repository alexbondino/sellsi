/**
 * ============================================================================
 * FINANCING TABS (SHARED)
 * ============================================================================
 * 
 * Sistema de tabs para vista de Financiamientos.
 * Reutilizable entre Supplier y Buyer.
 * 
 * Tabs:
 * 1. Solicitudes de financiamiento
 * 2. Financiamientos aprobados
 */

import React from 'react';
import { Paper, Tabs, Tab, Button, Box } from '@mui/material';

const FinancingTabs = ({ activeTab, onTabChange, isMobile = false, onHowItWorks = () => {} }) => {
  return (
    <Box sx={{ mb: isMobile ? 2 : 3, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexDirection: { xs: 'column', sm: 'row' }, px: { xs: 1, sm: 0 }, gap: { xs: 2, sm: 0 } }}>
      <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Paper sx={{ width: isMobile ? '100%' : 'fit-content', display: 'inline-block' }}>
          <Tabs
            value={activeTab}
            onChange={(e, newValue) => onTabChange(newValue)}
            variant={isMobile ? 'scrollable' : 'standard'}
            scrollButtons={isMobile ? 'auto' : false}
            sx={{
              borderBottom: 1,
              borderColor: 'divider',
              '& .MuiTab-root': {
                fontSize: isMobile ? '0.875rem' : '1rem',
                fontWeight: 600,
                textTransform: 'none',
                minHeight: isMobile ? 48 : 56,
                color: 'text.primary',
                '&.Mui-selected': {
                  backgroundColor: '#2E52B2',
                  color: 'white',
                },
              },
            }}
          >
            <Tab label="Solicitudes de financiamiento" />
            <Tab label="Financiamientos aprobados" />
          </Tabs>
        </Paper>

        {isMobile && (
          <Button
            variant="contained"
            color="warning"
            size="large"
            onClick={() => {
              console.log('🚀 ¿Cómo Funciona? button clicked (MOBILE)');
              onHowItWorks();
            }}
            fullWidth
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              borderRadius: 2,
              px: 3,
              py: 1.25,
              fontSize: '1rem',
              backgroundColor: '#2E52B2',
              color: '#fff',
              '&:hover': {
                backgroundColor: '#1e3a8a',
              },
            }}
          >
            ¿Cómo Funciona?
          </Button>
        )}
      </Box>

      {!isMobile && (
        <Box sx={{ ml: 2, display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            color="warning"
            size="large"
            onClick={() => {
              console.log('🚀 ¿Cómo Funciona? button clicked (DESKTOP)');
              onHowItWorks();
            }}
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              borderRadius: 2,
              px: 4,
              py: 1,
              fontSize: '0.95rem',
              minWidth: 160,
              whiteSpace: 'nowrap',
              backgroundColor: '#2E52B2',
              color: '#fff',
              '&:hover': {
                backgroundColor: '#1e3a8a',
              },
            }}
          >
            ¿Cómo Funciona?
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default FinancingTabs;
