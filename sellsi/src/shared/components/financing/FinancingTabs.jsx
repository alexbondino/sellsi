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
import { Paper, Tabs, Tab } from '@mui/material';

const FinancingTabs = ({ activeTab, onTabChange, isMobile = false }) => {
  return (
    <Paper sx={{ mb: isMobile ? 2 : 3, width: isMobile ? 'fit-content' : 'fit-content', mx: isMobile ? 'auto' : 0 }}>
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
  );
};

export default FinancingTabs;
