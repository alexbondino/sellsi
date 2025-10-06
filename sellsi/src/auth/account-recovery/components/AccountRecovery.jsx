import React, { useImperativeHandle, forwardRef, useEffect } from 'react';
import { Box, Paper, Alert, Typography, TextField } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { PrimaryButton } from '../../../shared/components';
import { useRecuperarForm } from '../hooks/useRecuperarForm';

const AccountRecovery = forwardRef(function AccountRecovery(props, ref) {
  const theme = useTheme();
  const {
    correo,
    loading,
    mensaje,
    error,
    setCorreo,
    handleBuscar,
    resetAllStates,
  } = useRecuperarForm();

  useImperativeHandle(ref, () => resetAllStates);

  const handleCerrarTotal = () => {
    resetAllStates();
    // Prefer switching back to the Login view when parent provides the handler
    if (typeof props.onVolverLogin === 'function') {
      props.onVolverLogin();
    } else {
      props.onClose?.();
    }
  };

  const handleSubmit = e => {
    e.preventDefault();
    handleBuscar();
  };

  useEffect(() => {
    const onCloseAll = () => props.onClose?.();
    window.addEventListener('closeAllModals', onCloseAll);
    return () => window.removeEventListener('closeAllModals', onCloseAll);
  }, [props.onClose]);

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ maxWidth: '450px', mx: 'auto' }}>
        <Paper
          elevation={3}
          sx={{
            p: 4,
            width: '100%',
            position: 'relative',
            bgcolor: theme.palette.background.paper,
            borderRadius: 2,
            textAlign: 'center',
          }}
        >
          <PrimaryButton
            variant="text"
            onClick={handleCerrarTotal}
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              color: 'primary.main',
              fontSize: 14,
              fontWeight: 600,
              '&:hover': { backgroundColor: 'transparent', opacity: 0.8 },
            }}
          >
            CERRAR
          </PrimaryButton>

          {!mensaje ? (
            <form onSubmit={handleSubmit}>
              <Typography
                variant="h6"
                sx={{
                  color: 'primary.main',
                  fontWeight: 600,
                  mb: 1,
                }}
              >
                Recuperar Contraseña
              </Typography>

              <Typography
                variant="body1"
                sx={{
                  mb: 3,
                  color: 'text.secondary',
                }}
              >
                Ingresa tu correo y te enviaremos un enlace para restablecer tu
                contraseña.
              </Typography>

              <TextField
                fullWidth
                placeholder="Correo electrónico"
                type="email"
                value={correo}
                onChange={e => setCorreo(e.target.value)}
                disabled={loading}
                required
                sx={{
                  mb: 3,
                  '& .MuiOutlinedInput-root': {
                    bgcolor: 'background.paper',
                  },
                }}
              />

              {!!error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}

              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                <PrimaryButton
                  type="button"
                  variant="text"
                  onClick={handleCerrarTotal}
                  sx={{ color: 'primary.main' }}
                >
                  Volver
                </PrimaryButton>
                <PrimaryButton
                  type="submit"
                  variant="contained"
                  disabled={loading || !correo}
                >
                  Enviar Mail
                </PrimaryButton>
              </Box>
            </form>
          ) : (
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Puedes cerrar esta ventana. Cuando hagas clic en el enlace del
              correo, llegarás a la página para crear una nueva contraseña.
            </Typography>
          )}
        </Paper>
      </Box>
    </Box>
  );
});

export default AccountRecovery;
