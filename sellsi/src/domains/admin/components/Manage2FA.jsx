/**
 * 🔐 Componente de Gestión 2FA
 * 
 * Permite a los administradores ver el estado de su 2FA,
 * habilitarlo, deshabilitarlo y regenerar códigos de respaldo.
 * 
 * @author Panel Administrativo Sellsi
 * @date 17 de Julio de 2025
 */

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Box,
  Typography,
  Button,
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  Security,
  CheckCircle,
  Warning,
  Settings,
  Delete,
  PhoneAndroid,
  Shield
} from '@mui/icons-material';

import { PrimaryButton } from '../../../shared/components/forms';
// 🔍 Reemplazo de import desde barrel '../../../domains/admin' para reducir ciclos
import { disable2FA } from '../services/adminAuthService';
import Setup2FA from './Setup2FA';

// ✅ COMMON STYLES
const commonStyles = {
  statusCard: {
    mb: 3,
    borderRadius: 2,
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  },
  statusHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    mb: 2
  },
  statusIcon: {
    fontSize: 40,
    mr: 2
  },
  actionButton: {
    mr: 1,
    mb: 1
  }
};

// ✅ MANAGE 2FA COMPONENT
const Manage2FA = ({ adminData, onStatusChange }) => {
  const [showSetup, setShowSetup] = useState(false);
  const [showDisableDialog, setShowDisableDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const is2FAEnabled = adminData?.twofa_secret && adminData.twofa_secret.length > 0;

  // ========================================
  // 🔧 HANDLERS
  // ========================================

  const handleDisable2FA = async () => {
    setLoading(true);
    setError('');

    try {
      const result = await disable2FA(adminData.id);
      
      if (result.success) {
        onStatusChange && onStatusChange(false);
        setShowDisableDialog(false);
      } else {
        setError(result.error || 'Error deshabilitando 2FA');
      }
    } catch (error) {
      console.error('Error deshabilitando 2FA:', error);
      setError('Error interno del servidor');
    } finally {
      setLoading(false);
    }
  };

  const handleSetupComplete = () => {
    setShowSetup(false);
    onStatusChange && onStatusChange(true);
  };

  // ========================================
  // 🎨 RENDER FUNCTIONS
  // ========================================

  const renderEnabledStatus = () => (
    <Card sx={commonStyles.statusCard}>
      <CardContent>
        <Box sx={commonStyles.statusHeader}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <CheckCircle sx={{ ...commonStyles.statusIcon, color: '#4caf50' }} />
            <Box>
              <Typography variant="h6">
                2FA Habilitado
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Tu cuenta está protegida con autenticación de dos factores
              </Typography>
            </Box>
          </Box>
          <Chip
            label="ACTIVO"
            color="success"
            icon={<Shield />}
            variant="outlined"
          />
        </Box>

        <Alert severity="success" sx={{ mb: 2 }}>
          <strong>Seguridad mejorada:</strong> Se requiere un código de tu aplicación móvil para iniciar sesión.
        </Alert>

        <List dense>
          <ListItem>
            <ListItemIcon>
              <PhoneAndroid color="action" />
            </ListItemIcon>
            <ListItemText
              primary="Aplicación configurada"
              secondary="Google Authenticator o aplicación compatible"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <Security color="action" />
            </ListItemIcon>
            <ListItemText
              primary="Códigos de 6 dígitos"
              secondary="Se generan cada 30 segundos"
            />
          </ListItem>
        </List>
      </CardContent>

      <CardActions>
        <Button
          variant="outlined"
          color="error"
          startIcon={<Delete />}
          onClick={() => setShowDisableDialog(true)}
          sx={commonStyles.actionButton}
        >
          Deshabilitar 2FA
        </Button>
      </CardActions>
    </Card>
  );

  const renderDisabledStatus = () => (
    <Card sx={commonStyles.statusCard}>
      <CardContent>
        <Box sx={commonStyles.statusHeader}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Warning sx={{ ...commonStyles.statusIcon, color: '#ff9800' }} />
            <Box>
              <Typography variant="h6">
                2FA Deshabilitado
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Tu cuenta está protegida solo con contraseña
              </Typography>
            </Box>
          </Box>
          <Chip
            label="INACTIVO"
            color="warning"
            icon={<Warning />}
            variant="outlined"
          />
        </Box>

        <Alert severity="warning" sx={{ mb: 2 }}>
          <strong>Recomendación:</strong> Habilita 2FA para mayor seguridad en tu cuenta administrativa.
        </Alert>

        <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
          La autenticación de dos factores añade una capa extra de seguridad requiriendo un código de tu dispositivo móvil además de tu contraseña.
        </Typography>
      </CardContent>

      <CardActions>
        <PrimaryButton
          startIcon={<Settings />}
          onClick={() => setShowSetup(true)}
          sx={commonStyles.actionButton}
        >
          Configurar 2FA
        </PrimaryButton>
      </CardActions>
    </Card>
  );

  const renderDisableDialog = () => (
    <Dialog
      open={showDisableDialog}
      onClose={() => setShowDisableDialog(false)}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Warning color="warning" />
          <Typography variant="h6">
            Deshabilitar Autenticación de Dos Factores
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Alert severity="warning" sx={{ mb: 2 }}>
          <strong>¿Estás seguro?</strong> Esto reducirá la seguridad de tu cuenta administrativa.
        </Alert>

        <Typography variant="body2" color="textSecondary">
          Al deshabilitar 2FA, tu cuenta estará protegida únicamente con tu contraseña. 
          Solo podrás iniciar sesión con tu usuario y contraseña.
        </Typography>
      </DialogContent>

      <DialogActions>
        <PrimaryButton onClick={() => setShowDisableDialog(false)}>
          Cancelar
        </PrimaryButton>
        <Button
          variant="contained"
          color="error"
          onClick={handleDisable2FA}
          loading={loading}
          disabled={loading}
          startIcon={<Delete />}
        >
          {loading ? 'Deshabilitando...' : 'Deshabilitar 2FA'}
        </Button>
      </DialogActions>
    </Dialog>
  );

  // ========================================
  // 🎨 MAIN RENDER
  // ========================================

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        <Security sx={{ mr: 1, verticalAlign: 'middle' }} />
        Autenticación de Dos Factores
      </Typography>

      <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
        Gestiona la configuración de seguridad de tu cuenta administrativa.
      </Typography>

      {is2FAEnabled ? renderEnabledStatus() : renderDisabledStatus()}

      {/* Setup 2FA Dialog */}
      <Setup2FA
        open={showSetup}
        onClose={() => setShowSetup(false)}
        adminData={adminData}
        onSuccess={handleSetupComplete}
      />

      {/* Disable 2FA Dialog */}
      {renderDisableDialog()}
    </Box>
  );
};

export default Manage2FA;
