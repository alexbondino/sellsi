import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  IconButton,
  Alert,
  CircularProgress,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { MODAL_DIALOG_ACTIONS_STYLES, MODAL_DIALOG_CONTENT_STYLES, MODAL_DIALOG_HEADER_STYLES, MODAL_CANCEL_BUTTON_STYLES, MODAL_SUBMIT_BUTTON_STYLES } from '../../../shared/components/feedback/Modal/Modal';
import { PasswordRequirements } from '../../../shared/components/feedback';
import { supabase } from '../../../services/supabase';
import { trackUserAction } from '../../../services/security';
import { useBodyScrollLock } from '../../../shared/hooks/useBodyScrollLock';

const ChangePasswordModal = ({ open, onClose, onPasswordChanged, showBanner }) => {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // ✅ Bloquear scroll del body cuando el modal está abierto
  useBodyScrollLock(open);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!open) {
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setError('');
      setSuccess(false);
    }
  }, [open]);

  const handleInputChange = (field) => (event) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
    // Clear error when user starts typing
    if (error) setError('');
  };

  const validatePassword = (password) => {
    const requirements = {
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      number: /\d/.test(password),
    };
    
    return Object.values(requirements).every(req => req);
  };

  const isFormValid = () => {
    const { currentPassword, newPassword, confirmPassword } = formData;
    
    return (
      currentPassword.trim() !== '' &&
      validatePassword(newPassword) &&
      newPassword === confirmPassword &&
      newPassword !== currentPassword
    );
  };

  const getValidationMessage = () => {
    const { currentPassword, newPassword, confirmPassword } = formData;
    
    if (!currentPassword.trim()) {
      return 'Ingresa tu contraseña actual';
    }
    if (!validatePassword(newPassword)) {
      return 'La nueva contraseña no cumple los requisitos de seguridad';
    }
    if (newPassword !== confirmPassword) {
      return 'Las contraseñas no coinciden';
    }
    if (newPassword === currentPassword) {
      return 'La nueva contraseña debe ser diferente a la actual';
    }
    return '';
  };

  const handleSubmit = async () => {
    if (!isFormValid()) return;

    setLoading(true);
    setError('');

    try {
      // Obtener el usuario actual
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        const errorMessage = 'Usuario no autenticado';
        setError(errorMessage);
        if (showBanner) {
          showBanner({
            message: '❌ ' + errorMessage,
            severity: 'error',
            duration: 5000
          });
        }
        setLoading(false);
        return;
      }

      // Cambiar la contraseña directamente
      // Supabase internamente valida la contraseña actual
      const { error: updateError } = await supabase.auth.updateUser({
        password: formData.newPassword
      });

      if (updateError) {
        // Manejar diferentes tipos de errores
        let errorMessage = 'Error al cambiar la contraseña';
        
        if (updateError.message.includes('Invalid') || updateError.message.includes('weak')) {
          errorMessage = 'La nueva contraseña no cumple los requisitos de seguridad';
        } else if (updateError.message.includes('same')) {
          errorMessage = 'La nueva contraseña debe ser diferente a la actual';
        } else if (updateError.message.includes('unauthorized') || updateError.message.includes('credentials')) {
          errorMessage = 'La contraseña actual es incorrecta';
        } else {
          errorMessage = updateError.message;
        }
        
        setError(errorMessage);
        
        // Mostrar banner de error si está disponible
        if (showBanner) {
          showBanner({
            message: '❌ ' + errorMessage,
            severity: 'error',
            duration: 5000
          });
        }
        
        setLoading(false);
        return;
      }

      // Éxito - mostrar mensaje temporal en el modal antes de cerrar
      setSuccess(true);
      
      // Registrar IP del usuario al cambiar contraseña
      await trackUserAction('password_changed')
      
      // Cerrar el modal después de un breve delay y notificar al padre
      setTimeout(() => {
        onPasswordChanged(); // Esto activará el banner en el componente padre
      }, 1200); // Aumentar el delay para que se vea mejor el mensaje de éxito

    } catch (err) {
      const errorMessage = 'Error inesperado al cambiar la contraseña';
      setError(errorMessage);
      
      // Mostrar banner de error si está disponible
      if (showBanner) {
        showBanner({
          message: '❌ ' + errorMessage,
          severity: 'error',
          duration: 5000
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  const passwordMismatch = formData.confirmPassword && formData.newPassword !== formData.confirmPassword;
  const sameAsOld = formData.newPassword && formData.currentPassword && formData.newPassword === formData.currentPassword;

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      disableScrollLock={true}
      sx={{ zIndex: 1500 }}
      PaperProps={{
        sx: { 
          borderRadius: 2,
          minHeight: '30vh' // Aumenta la altura base en 5%
        }
      }}
    >
      <DialogTitle sx={{ ...MODAL_DIALOG_HEADER_STYLES, position: 'relative', backgroundColor: '#2E52B2', color: '#fff' }}>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexDirection: 'column' }}>
          <Typography
            variant="h6"
            component="div"
            fontWeight={700}
            sx={{ flexGrow: 1, fontSize: { xs: '1.1rem', sm: '1.25rem' }, color: '#fff' }}
          >
            Cambiar Contraseña
          </Typography>
        </Box>

        {!loading && (
          <IconButton
            onClick={handleClose}
            sx={{
              position: 'absolute',
              top: '50%',
              transform: 'translateY(-50%)',
              right: { xs: 8, sm: 16 },
              p: { xs: 0.75, sm: 1 },
              color: '#fff',
              backgroundColor: 'rgba(255,255,255,0.1)',
              '&:hover': { backgroundColor: 'rgba(255,255,255,0.2)' },
            }}
          >
            <CloseIcon sx={{ fontSize: { xs: '1.5rem', sm: '1.5rem' } }} />
          </IconButton>
        )}
      </DialogTitle>

      <DialogContent dividers sx={{ ...MODAL_DIALOG_CONTENT_STYLES, overflow: 'visible' }}>
        {success ? (
          <Alert severity="success" sx={{ mb: 2 }}>
            ¡Contraseña cambiada exitosamente!
          </Alert>
        ) : (
          <>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }} autoComplete="off">
              <TextField
                label="Contraseña Actual"
                type="password"
                value={formData.currentPassword}
                onChange={handleInputChange('currentPassword')}
                fullWidth
                variant="outlined"
                size="small"
                disabled={loading}
                error={error.includes('incorrecta')}
                autoComplete="new-password"
              />

              <TextField
                label="Nueva Contraseña"
                type="password"
                value={formData.newPassword}
                onChange={handleInputChange('newPassword')}
                fullWidth
                variant="outlined"
                size="small"
                disabled={loading}
                error={sameAsOld}
                helperText={sameAsOld ? 'La nueva contraseña debe ser diferente a la actual' : ''}
                autoComplete="new-password"
              />

              <TextField
                label="Repetir nueva contraseña"
                type="password"
                value={formData.confirmPassword}
                onChange={handleInputChange('confirmPassword')}
                fullWidth
                variant="outlined"
                size="small"
                disabled={loading}
                error={passwordMismatch}
                helperText={passwordMismatch ? 'Las contraseñas no coinciden' : ''}
                autoComplete="new-password"
              />

              {/* Requisitos de contraseña */}
              <PasswordRequirements 
                password={formData.newPassword} 
                size="small"
              />
            </Box>
          </>
        )}
      </DialogContent>

      <DialogActions sx={MODAL_DIALOG_ACTIONS_STYLES}>
        <Button
          onClick={handleClose}
          variant="outlined"
          disabled={loading}
          sx={MODAL_CANCEL_BUTTON_STYLES}
        >
          Cancelar
        </Button>

        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={!isFormValid() || loading}
          title={!isFormValid() ? getValidationMessage() : ''}
          sx={{
            ...MODAL_SUBMIT_BUTTON_STYLES,
            bgcolor: 'success.main',
            '&:hover': { bgcolor: 'success.dark' },
            '&:disabled': {
              bgcolor: 'grey.300',
              color: 'grey.500',
            },
          }}
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}
        >
          {loading ? 'Confirmando...' : 'Confirmar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ChangePasswordModal;
