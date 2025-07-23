/**
 * 📊 Dashboard Principal del Panel Administrativo
 * 
 * Componente principal que contiene pestañas para diferentes funcionalidades:
 * - Gestión de Solicitudes de Pago
 * - Gestión de Usuarios (Ban/Unban)
 * - Gestión de Productos Marketplace
 * 
 * @author Panel Administrativo Sellsi
 * @date 10 de Julio de 2025
 */

import React, { useState, memo } from 'react';
import {
  Box,
  Container,
  Paper,
  Tabs,
  Tab,
  Typography,
  Divider,
  Badge
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Payment as PaymentIcon,
  People as PeopleIcon,
  Inventory as InventoryIcon,
  Security as SecurityIcon
} from '@mui/icons-material';

// Importar componentes de pestañas
import AdminPanelTable from './AdminPanelTable';
import UserManagementTable from './UserManagementTable';
import ProductMarketplaceTable from './ProductMarketplaceTable';

// ✅ CONSTANTS
const TAB_ICONS = {
  solicitudes: <PaymentIcon />,
  usuarios: <PeopleIcon />,
  productos: <InventoryIcon />
};

const TAB_LABELS = {
  solicitudes: 'Solicitudes de Pago',
  usuarios: 'Gestión de Usuarios',
  productos: 'Productos Marketplace'
};

// ✅ STYLES
const dashboardStyles = {
  container: {
    maxWidth: 'none',
    px: 2,
    py: 3
  },
  header: {
    mb: 3,
    textAlign: 'center'
  },
  securityBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 1,
    px: 2,
    py: 0.5,
    backgroundColor: 'error.main',
    color: 'white',
    borderRadius: 2,
    fontSize: '0.875rem',
    fontWeight: 'bold',
    mb: 2
  },
  tabsContainer: {
    borderBottom: 1,
    borderColor: 'divider',
    mb: 3
  },
  tabPanel: {
    minHeight: '60vh'
  },
  tab: {
    minHeight: 60,
    textTransform: 'none',
    fontSize: '0.95rem',
    fontWeight: 'medium'
  }
};

// ✅ TAB PANEL COMPONENT
const TabPanel = memo(({ children, value, index, ...other }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`admin-tabpanel-${index}`}
      aria-labelledby={`admin-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={dashboardStyles.tabPanel}>
          {children}
        </Box>
      )}
    </div>
  );
});

TabPanel.displayName = 'TabPanel';

// ✅ ADMIN DASHBOARD COMPONENT
const AdminDashboard = memo(() => {
  // ========================================
  // 🔧 ESTADO
  // ========================================
  
  const [currentTab, setCurrentTab] = useState(0);

  // ========================================
  // 🔧 HANDLERS
  // ========================================

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  const getTabProps = (index) => ({
    id: `admin-tab-${index}`,
    'aria-controls': `admin-tabpanel-${index}`,
  });

  // ========================================
  // 🎨 RENDER FUNCTIONS
  // ========================================

  const renderHeader = () => (
    <Box sx={dashboardStyles.header}>
      <Box sx={dashboardStyles.securityBadge}>
        <SecurityIcon fontSize="small" />
        PANEL DE CONTROL ADMINISTRATIVO
      </Box>
      
      <Typography variant="h4" component="h1" gutterBottom>
        Dashboard Administrativo
      </Typography>
      
      <Typography variant="body1" color="text.secondary">
        Gestión centralizada de solicitudes, usuarios y sistema
      </Typography>
      
      <Divider sx={{ mt: 2 }} />
    </Box>
  );

  const renderTabs = () => (
    <Paper sx={dashboardStyles.tabsContainer}>
      <Tabs
        value={currentTab}
        onChange={handleTabChange}
        variant="fullWidth"
        textColor="primary"
        indicatorColor="primary"
      >
        <Tab
          icon={TAB_ICONS.solicitudes}
          label={TAB_LABELS.solicitudes}
          sx={dashboardStyles.tab}
          {...getTabProps(0)}
        />
        <Tab
          icon={TAB_ICONS.usuarios}
          label={TAB_LABELS.usuarios}
          sx={dashboardStyles.tab}
          {...getTabProps(1)}
        />
        <Tab
          icon={TAB_ICONS.productos}
          label={TAB_LABELS.productos}
          sx={dashboardStyles.tab}
          {...getTabProps(2)}
        />
      </Tabs>
    </Paper>
  );

  const renderTabContent = () => (
    <>
      {/* Pestaña de Solicitudes de Pago */}
      <TabPanel value={currentTab} index={0}>
        <AdminPanelTable />
      </TabPanel>

      {/* Pestaña de Gestión de Usuarios */}
      <TabPanel value={currentTab} index={1}>
        <UserManagementTable />
      </TabPanel>

      {/* Pestaña de Productos Marketplace */}
      <TabPanel value={currentTab} index={2}>
        <ProductMarketplaceTable />
      </TabPanel>
    </>
  );

  // ========================================
  // 🎨 RENDER PRINCIPAL
  // ========================================

  return (
    <Container sx={dashboardStyles.container}>
      {/* Header del Dashboard */}
      {renderHeader()}

      {/* Pestañas de Navegación */}
      {renderTabs()}

      {/* Contenido de las Pestañas */}
      {renderTabContent()}
    </Container>
  );
});

AdminDashboard.displayName = 'AdminDashboard';

export default AdminDashboard;
