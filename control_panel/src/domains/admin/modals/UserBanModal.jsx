/**
 * 🚫 Modal de Confirmación de Ban/Unban de Usuario
 * 
 * Modal profesional para confirmar acciones de baneo y desbaneo de usuarios.
 * Incluye campos para justificación y muestra información relevante del usuario.
 * 
 * @author Panel Administrativo Sellsi
 * @date 10 de Julio de 2025
 */

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  TextField,
  Box,
  Avatar,
  Chip,
  Divider,
  Alert,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  Block as BlockIcon,
  CheckCircle as UnblockIcon,
  Warning as WarningIcon,
  Person as PersonIcon,
  Store as StoreIcon,
  Close as CloseIcon,
  Router as IpIcon
} from '@mui/icons-material';

// ✅ CONSTANTS
const BAN_REASONS = [
  { value: 'contenido_no_deseado', label: 'Spam o contenido no deseado' },
  { value: 'actividad_fraudulenta', label: 'Actividad fraudulenta' },
  { value: 'acoso_conducta_inapropiada', label: 'Acoso o comportamiento inapropiado' },
  { value: 'productos_falsos', label: 'Productos falsos o engañosos' },
  { value: 'violacion_terminos', label: 'Violación de términos de servicio' },
  { value: 'riesgo_seguridad', label: 'Compromiso de seguridad' },
  { value: 'other', label: 'Otra razón' }
];

const UNBAN_REASONS = [
  { value: 'appeal_approved', label: 'Apelación aprobada' },
  { value: 'false_positive', label: 'Falso positivo' },
  { value: 'policy_change', label: 'Cambio en políticas' },
  { value: 'resolved_issue', label: 'Problema resuelto' },
  { value: 'other', label: 'Otra razón' }
];

// ✅ STYLES
const modalStyles = {
  paper: {
    borderRadius: 2,
    maxWidth: 600,
    width: '100%'
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 2,
    pb: 1
  },
  userInfo: {
    p: 2,
    backgroundColor: '#f8f9fa',
    borderRadius: 1,
    mb: 2
  },
  userAvatar: {
    width: 50,
    height: 50
  },
  warningBox: {
    p: 2,
    backgroundColor: '#fff3cd',
    border: '1px solid #ffeaa7',
    borderRadius: 1,
    mb: 2
  },
  actionButtons: {
    gap: 1,
    pt: 2
  }
};

// ✅ USER BAN MODAL COMPONENT
const UserBanModal = ({ open, user, action, onConfirm, onClose }) => {
  // ========================================
  // 🔧 ESTADO
  // ========================================
  
  const [reason, setReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Debug: Verificar props
  console.log('UserBanModal props:', { open, user: !!user, action, onConfirm: typeof onConfirm, onClose: typeof onClose });

  // ========================================
  // 🔧 HELPER FUNCTIONS
  // ========================================

  const isFormValid = () => {
    if (!reason) return false;
    if (reason === 'other' && !customReason.trim()) return false;
    return true;
  };

  const getActionConfig = () => {
    if (action === 'ban') {
      return {
        title: 'Confirmar Baneo de Usuario',
        icon: <BlockIcon sx={{ color: 'error.main' }} />,
        color: 'error',
        buttonText: 'Banear Usuario',
        warningText: 'Esta acción restringirá el acceso del usuario a la plataforma.',
        reasons: BAN_REASONS
      };
    } else {
      return {
        title: 'Confirmar Desbaneo de Usuario',
        icon: <UnblockIcon sx={{ color: 'success.main' }} />,
        color: 'success',
        buttonText: 'Desbanear Usuario',
        warningText: 'Esta acción restaurará el acceso del usuario a la plataforma.',
        reasons: UNBAN_REASONS
      };
    }
  };

  const getUserActiveProducts = () => {
    return user?.active_products_count || 0;
  };

  const formatUserId = (userId) => {
    return userId ? `${userId.slice(0, 8)}...${userId.slice(-4)}` : 'N/A';
  };

  // ========================================
  // 🔧 HANDLERS
  // ========================================

  const handleConfirm = async () => {
    if (!isFormValid()) {
      setError('Por favor complete todos los campos requeridos');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const finalReason = reason === 'other' ? customReason : reason;
      await onConfirm({ user, action, reason: finalReason });
      handleClose();
    } catch (error) {
      console.error('Error en confirmación:', error);
      setError('Error al procesar la acción');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    // Reset form
    setReason('');
    setCustomReason('');
    setError('');
    setLoading(false);
    onClose();
  };

  // ========================================
  // 🎨 RENDER COMPONENTS
  // ========================================

  if (!user) return null;

  const config = getActionConfig();

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: modalStyles.paper
      }}
    >
      <DialogTitle>
        <Box sx={modalStyles.header}>
          {config.icon}
          <Typography variant="h6" component="div">
            {config.title}
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        {/* Información del usuario */}
        <Box sx={modalStyles.userInfo}>
          <Grid container spacing={2} alignItems="center">
            <Grid item>
              <Avatar 
                src={user.logo_url} 
                sx={modalStyles.userAvatar}
              >
                {user.user_nm?.charAt(0)?.toUpperCase()}
              </Avatar>
            </Grid>
            <Grid item xs>
              <Typography variant="h6" gutterBottom>
                {user.user_nm || 'Usuario sin nombre'}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {user.email}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                <Chip
                  size="small"
                  label={`ID: ${formatUserId(user.user_id)}`}
                  variant="outlined"
                />
                <Chip
                  size="small"
                  label={user.main_supplier ? 'Proveedor' : 'Comprador'}
                  color={user.main_supplier ? 'primary' : 'secondary'}
                  variant="outlined"
                />
                <Chip
                  size="small"
                  label={user.verified ? 'Verificado' : 'No Verificado'}
                  color={user.verified ? 'success' : 'default'}
                  variant="outlined"
                />
                {user.main_supplier && (
                  <Chip
                    size="small"
                    label={`${getUserActiveProducts()} productos`}
                    color="info"
                    variant="outlined"
                  />
                )}
              </Box>
              
              {/* Información de IP */}
              {user.last_ip && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                  <IpIcon sx={{ color: 'primary.main', fontSize: 16 }} />
                  <Typography variant="body2" color="text.secondary">
                    Última IP: <span style={{ fontFamily: 'monospace', fontWeight: 500 }}>{user.last_ip}</span>
                  </Typography>
                </Box>
              )}
            </Grid>
          </Grid>
        </Box>

        {/* Advertencia */}
        <Alert 
          severity={config.color} 
          icon={<WarningIcon />}
          sx={{ mb: 2 }}
        >
          <Typography variant="body2">
            <strong>Advertencia:</strong> {config.warningText}
            {action === 'ban' && user.main_supplier && getUserActiveProducts() > 0 && (
              <> Este usuario tiene {getUserActiveProducts()} productos activos que podrían verse afectados.</>
            )}
          </Typography>
        </Alert>

        {/* Error */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Razón del ban/unban */}
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Razón *</InputLabel>
          <Select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            label="Razón *"
          >
            {config.reasons.map((reasonOption) => (
              <MenuItem key={reasonOption.value} value={reasonOption.value}>
                {reasonOption.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Razón personalizada */}
        {reason === 'other' && (
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Especificar razón *"
            value={customReason}
            onChange={(e) => setCustomReason(e.target.value)}
            placeholder="Describa detalladamente la razón..."
            sx={{ mb: 2 }}
          />
        )}

        {/* Información adicional para bans */}
        {action === 'ban' && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary">
              <strong>Nota:</strong> El usuario recibirá una notificación por email sobre esta acción.
              Podrá apelar a través del sistema de soporte.
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={modalStyles.actionButtons}>
        <Button 
          onClick={handleClose}
          disabled={loading}
        >
          Cancelar
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          color={config.color}
          disabled={!isFormValid() || loading}
          startIcon={loading ? null : config.icon}
        >
          {loading ? 'Procesando...' : config.buttonText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

UserBanModal.displayName = 'UserBanModal';

export default UserBanModal;
