/**
 * 🏠 Página Principal del Admin Panel
 * 
 * Página inicial para administradores con acceso rápido
 * a todas las funcionalidades administrativas.
 * 
 * @author Panel Administrativo Sellsi
 * @date 16 de Julio de 2025
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Alert,
  Chip,
  Divider
} from '@mui/material';
import {
  PersonAdd,
  AdminPanelSettings,
  Dashboard,
  People,
  Security,
  Settings,
  Build,
  Insights
} from '@mui/icons-material';

import { PrimaryButton } from '../../../shared/components';
import AdminAccountCreator from '../components/AdminAccountCreator';
import AdminAccountManager from '../components/AdminAccountManager';
import { isDevelopment, DEV_CONFIG } from '../config/devConfig';

const AdminPanelHome = () => {
  const navigate = useNavigate();
  const [showCreateAdmin, setShowCreateAdmin] = useState(false);
  const [showManageAdmins, setShowManageAdmins] = useState(false);
  const [currentView, setCurrentView] = useState('dashboard');

  const handleCreateSuccess = () => {
    setShowCreateAdmin(false);
    // Actualizar cualquier estado necesario
  };

  const renderDashboard = () => (
    <Grid container spacing={3}>
      {/* Advertencia de desarrollo */}
      {isDevelopment() && (
        <Grid size={12}>
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Build />
              <Typography variant="body2">
                <strong>MODO DESARROLLO:</strong> Se permite crear administradores sin autenticación previa.
                Deshabilitar en producción.
              </Typography>
            </Box>
          </Alert>
        </Grid>
      )}

      {/* Tarjeta de Crear Admin */}
      <Grid size={{ xs: 12, md: 6 }}>
        <Card sx={{ height: '100%' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <PersonAdd color="primary" />
              <Typography variant="h6">
                Crear Administrador
              </Typography>
              {isDevelopment() && (
                <Chip 
                  label="DEV" 
                  color="warning" 
                  size="small" 
                />
              )}
            </Box>
            
            <Typography variant="body2" color="textSecondary" paragraph>
              Crea nuevas cuentas administrativas con acceso completo al sistema.
            </Typography>
            
            <Typography variant="body2" color="textSecondary">
              {isDevelopment() 
                ? '🚧 Modo desarrollo: Se permite crear el primer administrador'
                : 'Requiere autenticación administrativa'
              }
            </Typography>
          </CardContent>
          
          <CardActions>
            <PrimaryButton
              onClick={() => setShowCreateAdmin(true)}
              startIcon={<PersonAdd />}
              fullWidth
            >
              Crear Administrador
            </PrimaryButton>
          </CardActions>
        </Card>
      </Grid>

      {/* Tarjeta de Gestionar Admins */}
      <Grid size={{ xs: 12, md: 6 }}>
        <Card sx={{ height: '100%' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <People color="primary" />
              <Typography variant="h6">
                Gestionar Administradores
              </Typography>
            </Box>
            
            <Typography variant="body2" color="textSecondary" paragraph>
              Ve, edita y gestiona las cuentas administrativas existentes.
            </Typography>
            
            <Typography variant="body2" color="textSecondary">
              Ver lista completa de administradores
            </Typography>
          </CardContent>
          
          <CardActions>
            <Button
              onClick={() => setCurrentView('manage')}
              startIcon={<People />}
              variant="outlined"
              fullWidth
            >
              Ver Administradores
            </Button>
          </CardActions>
        </Card>
      </Grid>

      {/* Tarjeta de Dashboard */}
      <Grid size={{ xs: 12, md: 6 }}>
        <Card sx={{ height: '100%' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Dashboard color="primary" />
              <Typography variant="h6">
                Dashboard Principal
              </Typography>
            </Box>
            
            <Typography variant="body2" color="textSecondary" paragraph>
              Accede al dashboard principal del sistema administrativo.
            </Typography>
            
            <Typography variant="body2" color="textSecondary">
              Panel de control y estadísticas
            </Typography>
          </CardContent>
          
          <CardActions>
            <Button
              onClick={() => navigate('/admin-panel/dashboard')}
              startIcon={<Dashboard />}
              variant="outlined"
              fullWidth
            >
              Ir al Dashboard
            </Button>
          </CardActions>
        </Card>
      </Grid>

      {/* Tarjeta de Configuración */}
      <Grid size={{ xs: 12, md: 6 }}>
        <Card sx={{ height: '100%' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Settings color="primary" />
              <Typography variant="h6">
                Configuración
              </Typography>
            </Box>
            
            <Typography variant="body2" color="textSecondary" paragraph>
              Ajustes del sistema y configuración de seguridad.
            </Typography>
            
            <Typography variant="body2" color="textSecondary">
              Próximamente disponible
            </Typography>
          </CardContent>
          
          <CardActions>
            <Button
              disabled
              startIcon={<Settings />}
              variant="outlined"
              fullWidth
            >
              Configuración (Próximamente)
            </Button>
          </CardActions>
        </Card>
      </Grid>

      {/* Tarjeta Métricas DEV */}
      {isDevelopment() && (
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: '100%', border: theme => `1px solid ${theme.palette.info.light}` }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Insights color="info" />
                <Typography variant="h6">
                  Métricas DEV
                </Typography>
                <Chip label="Experimental" size="small" color="info" />
              </Box>
              <Typography variant="body2" color="textSecondary" paragraph>
                Visualiza métricas y salud de Edge Functions y sistemas internos. Solo visible en entorno de desarrollo.
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Incluye invocaciones, errores y tiempos promedio.
              </Typography>
            </CardContent>
            <CardActions>
              <Button
                onClick={() => navigate('/admin-panel/metrics')}
                startIcon={<Insights />}
                variant="contained"
                color="info"
                fullWidth
              >
                Ir a Métricas
              </Button>
            </CardActions>
          </Card>
        </Grid>
      )}
    </Grid>
  );

  const renderContent = () => {
    switch (currentView) {
      case 'manage':
        return <AdminAccountManager />;
      case 'dashboard':
      default:
        return renderDashboard();
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          <AdminPanelSettings sx={{ mr: 1, verticalAlign: 'middle' }} />
          Panel de Administración
        </Typography>
        
        <Typography variant="body1" color="textSecondary">
          Gestiona usuarios, cuentas administrativas y configuración del sistema.
        </Typography>
        
        {isDevelopment() && (
          <Chip 
            label="MODO DESARROLLO" 
            color="warning" 
            sx={{ mt: 1 }}
            icon={<Build />}
          />
        )}
      </Box>

      <Divider sx={{ mb: 3 }} />

      {/* Navegación */}
      {currentView !== 'dashboard' && (
        <Box sx={{ mb: 3 }}>
          <Button
            onClick={() => setCurrentView('dashboard')}
            startIcon={<Dashboard />}
            variant="outlined"
            size="small"
          >
            ← Volver al Dashboard
          </Button>
        </Box>
      )}

      {/* Contenido */}
      {renderContent()}

      {/* Modales */}
      <AdminAccountCreator
        open={showCreateAdmin}
        onClose={() => setShowCreateAdmin(false)}
        onSuccess={handleCreateSuccess}
      />
    </Box>
  );
};

export default AdminPanelHome;
