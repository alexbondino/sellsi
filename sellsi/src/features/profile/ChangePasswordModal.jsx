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
import PasswordRequirements from '../ui/PasswordRequirements';
import { supabase } from '../../services/supabase';

const ChangePasswordModal = ({ open, onClose, onPasswordChanged }) => {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

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

  const handleSubmit = async () => {
    if (!isFormValid()) return;

    setLoading(true);
    setError('');

    try {
      // Obtener el usuario actual
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setError('Usuario no autenticado');
        setLoading(false);
        return;
      }

      // Verificar la contraseña actual intentando hacer sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: formData.currentPassword,
      });

      if (signInError) {
        if (signInError.message.includes('Invalid login credentials')) {
          setError('La contraseña actual es incorrecta');
        } else {
          setError('Error al verificar la contraseña actual');
        }
        setLoading(false);
        return;
      }

      // Cambiar la contraseña
      const { error: updateError } = await supabase.auth.updateUser({
        password: formData.newPassword
      });

      if (updateError) {
        setError('Error al cambiar la contraseña: ' + updateError.message);
        setLoading(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        onPasswordChanged();
        onClose();
      }, 1500);

    } catch (err) {
      setError('Error inesperado al cambiar la contraseña');
      console.error('Password change error:', err);
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
      PaperProps={{
        sx: { 
          borderRadius: 2,
          minHeight: '30vh' // Aumenta la altura base en 5%
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        pb: 2,
        overflow: 'visible'
      }}>
        <Typography variant="h6" component="div">
          Cambiar Contraseña
        </Typography>
        <IconButton 
          onClick={handleClose} 
          size="small"
          disabled={loading}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 4, px: 3, overflow: 'visible' }}>
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

      <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
        <Button 
          onClick={handleClose}
          variant="outlined"
          color="inherit"
          disabled={loading}
          sx={{ 
            color: 'text.secondary',
            borderColor: 'text.secondary',
            '&:hover': {
              borderColor: 'text.primary',
              backgroundColor: 'rgba(0,0,0,0.04)'
            }
          }}
        >
          Cancelar
        </Button>
        
        <Button 
          onClick={handleSubmit}
          variant="contained"
          disabled={!isFormValid() || loading}
          sx={{
            bgcolor: 'success.main',
            '&:hover': { bgcolor: 'success.dark' },
            '&:disabled': { 
              bgcolor: 'grey.300',
              color: 'grey.500'
            }
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
