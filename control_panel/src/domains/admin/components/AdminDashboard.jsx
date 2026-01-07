/**
 * 📊 Dashboard Principal del Panel Administrativo
 *
 * Componente principal que contiene pestañas para diferentes funcionalidades:
 * - Liberación de Pagos (Principal)
 * - Gestión de Usuarios (Ban/Unban)
 * - Gestión de Productos Marketplace
 * - Transferencias Manuales
 *
 * @author Panel Administrativo Sellsi
 * @date 29 de Octubre de 2025
 */

import React, { useState, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  Tabs,
  Tab,
  Typography,
  Divider,
  Badge,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Payment as PaymentIcon,
  People as PeopleIcon,
  Inventory as InventoryIcon,
  Security as SecurityIcon,
  ArrowBack as ArrowBackIcon,
  AttachMoney as AttachMoneyIcon,
} from '@mui/icons-material';

// Importar componentes de pestañas
import AdminPanelTable from './AdminPanelTable';
import UserManagementTable from './UserManagementTable';
import ProductMarketplaceTable from './ProductMarketplaceTable';
import PaymentReleasesTable from './PaymentReleasesTable';
import AdminBankTransferPayments from './AdminBankTransferPayments';
import ToggleOnIcon from '@mui/icons-material/ToggleOn';
import FeatureFlagTable from './FeatureFlagTable';

// ✅ CONSTANTS
const TAB_ICONS = {
  liberaciones: <AttachMoneyIcon />,
  usuarios: <PeopleIcon />,
  productos: <InventoryIcon />,
  solicitudes: <PaymentIcon />,
  feature_flags: <ToggleOnIcon />,
};

const TAB_LABELS = {
  liberaciones: 'Liberación de Pagos',
  usuarios: 'Gestión de Usuarios',
  productos: 'Productos Marketplace',
  solicitudes: 'Transferencias Manuales',
  feature_flags: 'Feature Flags',
};

// ✅ STYLES
const dashboardStyles = {
  container: {
    maxWidth: '80%',
    width: '100%',
    px: 3,
    py: 3,
  },
  header: {
    mb: 3,
    textAlign: 'center',
    position: 'relative',
  },
  backButtonContainer: {
    position: 'absolute',
    left: 0,
    top: 0,
    display: 'flex',
    alignItems: 'center',
    gap: 1,
  },
  backButton: {
    color: 'primary.main',
    '&:hover': {
      backgroundColor: 'primary.light',
      color: 'white',
    },
  },
  backButtonText: {
    color: 'primary.main',
    fontSize: '0.875rem',
    fontWeight: 'medium',
    cursor: 'pointer',
    '&:hover': {
      color: 'primary.dark',
    },
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
    mb: 2,
  },
  tabsContainer: {
    borderBottom: 1,
    borderColor: 'divider',
    mb: 3,
  },
  tabPanel: {
    minHeight: '60vh',
  },
  tab: {
    minHeight: 60,
    textTransform: 'none',
    fontSize: '0.95rem',
    fontWeight: 'medium',
  },
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
      {value === index && <Box sx={dashboardStyles.tabPanel}>{children}</Box>}
    </div>
  );
});

TabPanel.displayName = 'TabPanel';

// ✅ ADMIN DASHBOARD COMPONENT
const AdminDashboard = memo(() => {
  // ========================================
  // 🔧 ESTADO Y NAVEGACIÓN
  // ========================================

  const navigate = useNavigate();
  const [currentTab, setCurrentTab] = useState(0);

  // ========================================
  // 🔧 HANDLERS
  // ========================================

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  const handleGoBack = () => {
    navigate('/admin-panel');
  };

  const getTabProps = index => ({
    id: `admin-tab-${index}`,
    'aria-controls': `admin-tabpanel-${index}`,
  });

  // ========================================
  // 🎨 RENDER FUNCTIONS
  // ========================================

  const renderHeader = () => (
    <Box sx={dashboardStyles.header}>
      {/* Botón de Volver Atrás con Texto */}
      <Box sx={dashboardStyles.backButtonContainer}>
        <IconButton
          onClick={handleGoBack}
          sx={dashboardStyles.backButton}
          aria-label="Regresar a Menu Admin"
        >
          <ArrowBackIcon />
        </IconButton>
        <Typography onClick={handleGoBack} sx={dashboardStyles.backButtonText}>
          Regresar a Menu Admin
        </Typography>
      </Box>

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
        <Tooltip
          title="Liberar pagos a proveedores una vez confirmada la entrega de productos"
          placement="bottom"
          arrow
        >
          <Tab
            icon={TAB_ICONS.liberaciones}
            label={TAB_LABELS.liberaciones}
            sx={dashboardStyles.tab}
            {...getTabProps(0)}
          />
        </Tooltip>

        <Tooltip
          title="Confirmar pagos realizados por transferencia bancaria manual"
          placement="bottom"
          arrow
        >
          <Tab
            icon={TAB_ICONS.solicitudes}
            label={TAB_LABELS.solicitudes}
            sx={dashboardStyles.tab}
            {...getTabProps(1)}
          />
        </Tooltip>

        <Tooltip
          title="Gestionar usuarios: banear, desbanear, verificar y eliminar cuentas"
          placement="bottom"
          arrow
        >
          <Tab
            icon={TAB_ICONS.usuarios}
            label={TAB_LABELS.usuarios}
            sx={dashboardStyles.tab}
            {...getTabProps(2)}
          />
        </Tooltip>

        <Tooltip
          title="Administrar productos del marketplace: eliminar y editar listados"
          placement="bottom"
          arrow
        >
          <Tab
            icon={TAB_ICONS.productos}
            label={TAB_LABELS.productos}
            sx={dashboardStyles.tab}
            {...getTabProps(3)}
          />
        </Tooltip>
        <Tooltip
          title="Disponibilizar o deshabilitar funcionalidades en la plataforma"
          placement="bottom"
          arrow
        >
          <Tab
            icon={TAB_ICONS.feature_flags}
            label={TAB_LABELS.feature_flags}
            sx={dashboardStyles.tab}
            {...getTabProps(4)}
          />
        </Tooltip>
      </Tabs>
    </Paper>
  );

  const renderTabContent = () => (
    <>
      {/* Pestaña de Liberación de Pagos */}
      <TabPanel value={currentTab} index={0}>
        <PaymentReleasesTable />
      </TabPanel>

      {/* Pestaña de Transferencias Manuales */}
      <TabPanel value={currentTab} index={1}>
        <AdminBankTransferPayments />
      </TabPanel>

      {/* Pestaña de Gestión de Usuarios */}
      <TabPanel value={currentTab} index={2}>
        <UserManagementTable />
      </TabPanel>

      {/* Pestaña de Productos Marketplace */}
      <TabPanel value={currentTab} index={3}>
        <ProductMarketplaceTable />
      </TabPanel>
      {/* Pestaña de Feature Flags */}
      <TabPanel value={currentTab} index={4}>
        <FeatureFlagTable />
      </TabPanel>
    </>
  );

  // ========================================
  // 🎨 RENDER PRINCIPAL
  // ========================================

  return (
    <Container maxWidth={false} sx={dashboardStyles.container}>
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
