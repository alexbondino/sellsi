/**
 * 🔒 Modal de Verificación de Usuario
 * 
 * Modal que permite a los administradores verificar o desverificar usuarios.
 * Incluye confirmación y razón de la acción.
 * 
 * @author Panel Administrativo Sellsi
 * @date 16 de Julio de 2025
 */

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  TextField,
  Alert,
  Avatar,
  Chip,
  Divider,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  VerifiedUser as VerifiedIcon,
  RemoveCircle as UnverifyIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  Info as InfoIcon
} from '@mui/icons-material';

// Estilos del modal
const modalStyles = {
  dialog: {
    '& .MuiDialog-paper': {
      borderRadius: 3,
      maxWidth: 500,
      width: '90%'
    }
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 2,
    p: 3,
    pb: 2
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: 2,
    p: 2,
    backgroundColor: '#f8f9fa',
    borderRadius: 2,
    mb: 2
  },
  actionSection: {
    p: 2,
    backgroundColor: '#fff3e0',
    borderRadius: 2,
    border: '1px solid #ffb74d',
    mb: 2
  },
  buttons: {
    display: 'flex',
    gap: 1,
    justifyContent: 'flex-end'
  }
};

// Razones predefinidas para verificación
const VERIFICATION_REASONS = [
  'Documentos válidos verificados',
  'Proveedor confiable con historial',
  'Validación manual completada',
  'Recomendación del equipo',
  'Otra razón'
];

const UNVERIFICATION_REASONS = [
  'Documentos inválidos o falsos',
  'Actividad sospechosa detectada',
  'Incumplimiento de políticas',
  'Solicitud del usuario',
  'Otra razón'
];

/**
 * Modal de Verificación de Usuario
 * @param {boolean} open - Estado del modal
 * @param {object} user - Usuario a verificar/desverificar
 * @param {string} action - Acción: 'verify' o 'unverify'
 * @param {function} onClose - Callback para cerrar modal
 * @param {function} onConfirm - Callback para confirmar acción
 */
const UserVerificationModal = ({ open, user, action, onClose, onConfirm }) => {
  const [reason, setReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isVerify = action === 'verify';
  const reasons = isVerify ? VERIFICATION_REASONS : UNVERIFICATION_REASONS;

  const handleConfirm = async () => {
    const finalReason = reason === 'Otra razón' ? customReason : reason;
    
    if (!finalReason.trim()) {
      setError('Debe especificar una razón para la acción');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await onConfirm(finalReason);
      // El modal se cierra desde el componente padre
    } catch (error) {
      setError('Error al procesar la acción');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setReason('');
      setCustomReason('');
      setError('');
      onClose();
    }
  };

  if (!user) return null;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      sx={modalStyles.dialog}
    >
      <DialogTitle>
        <Box sx={modalStyles.header}>
          {isVerify ? (
            <VerifiedIcon color="primary" sx={{ fontSize: 28 }} />
          ) : (
            <UnverifyIcon color="error" sx={{ fontSize: 28 }} />
          )}
          <Typography variant="h6" fontWeight="600">
            {isVerify ? 'Verificar Usuario' : 'Desverificar Usuario'}
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Información del usuario */}
        <Box sx={modalStyles.userInfo}>
          <Avatar src={user.logo_url} sx={{ width: 50, height: 50 }}>
            {user.user_nm?.charAt(0)?.toUpperCase()}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" fontWeight="500">
              {user.user_nm || 'Usuario sin nombre'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {user.email}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
              <Chip
                size="small"
                label={user.main_supplier ? 'Proveedor' : 'Comprador'}
                color={user.main_supplier ? 'primary' : 'secondary'}
              />
              <Chip
                size="small"
                label={user.verified ? 'Verificado' : 'No Verificado'}
                color={user.verified ? 'success' : 'warning'}
                icon={user.verified ? <CheckIcon /> : <WarningIcon />}
              />
            </Box>
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Sección de acción */}
        <Box sx={modalStyles.actionSection}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <InfoIcon color="warning" />
            <Typography variant="subtitle2" fontWeight="600">
              {isVerify ? 'Confirmación de Verificación' : 'Confirmación de Desverificación'}
            </Typography>
          </Box>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {isVerify 
              ? 'Está a punto de verificar este usuario como proveedor de confianza. Esta acción indicará que el usuario ha sido validado por el equipo de Sellsi.'
              : 'Está a punto de remover la verificación de este usuario. Esta acción indicará que el usuario ya no es considerado como proveedor de confianza.'
            }
          </Typography>

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Razón de la {isVerify ? 'verificación' : 'desverificación'}</InputLabel>
            <Select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              label={`Razón de la ${isVerify ? 'verificación' : 'desverificación'}`}
            >
              {reasons.map((reasonOption) => (
                <MenuItem key={reasonOption} value={reasonOption}>
                  {reasonOption}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {reason === 'Otra razón' && (
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Especifique la razón"
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              placeholder={`Escriba la razón específica para ${isVerify ? 'verificar' : 'desverificar'} este usuario...`}
              sx={{ mb: 2 }}
            />
          )}
        </Box>

        {/* Advertencia */}
        <Alert 
          severity={isVerify ? "info" : "warning"} 
          sx={{ mt: 2 }}
          icon={isVerify ? <InfoIcon /> : <WarningIcon />}
        >
          <Typography variant="body2">
            {isVerify 
              ? 'La verificación mejorará la confianza de los compradores en este proveedor.'
              : 'La desverificación afectará la confianza de los compradores en este proveedor.'
            }
          </Typography>
        </Alert>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 2 }}>
        <Box sx={modalStyles.buttons}>
          <Button
            onClick={handleClose}
            disabled={loading}
            color="inherit"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={loading || !reason || (reason === 'Otra razón' && !customReason.trim())}
            variant="contained"
            color={isVerify ? "success" : "error"}
            startIcon={loading ? <CircularProgress size={16} /> : (isVerify ? <VerifiedIcon /> : <UnverifyIcon />)}
          >
            {loading ? 'Procesando...' : (isVerify ? 'Verificar Usuario' : 'Desverificar Usuario')}
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default UserVerificationModal;
