// 📁 domains/auth/components/AccountRecovery.jsx
import React, { useImperativeHandle, forwardRef, useEffect } from 'react';
import { Box, Paper, Alert, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { PrimaryButton } from '../../../shared/components';

import { useRecuperarForm } from '../hooks/useRecuperarForm'; // 👈 el nuevo hook
const Step1Email = React.lazy(() => import('../wizard/Step1Email'));

const AccountRecovery = forwardRef(function AccountRecovery(props, ref) {
  const theme = useTheme();
  const {
    paso,
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

  useEffect(() => {
    const onCloseAll = () => props.onClose?.();
    window.addEventListener('closeAllModals', onCloseAll);
    return () => window.removeEventListener('closeAllModals', onCloseAll);
  }, [props.onClose]);

  return (
    <Box
      sx={{
        overflow: 'hidden',
        display: 'flex',
        justifyContent: 'center',
        p: 2,
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 4,
          width: 420,
          maxWidth: '100%',
          position: 'relative',
          bgcolor: theme.palette.background.paper,
          borderRadius: 2,
        }}
      >
        {/* Botón cerrar */}
        <PrimaryButton
          variant="text"
          onClick={handleCerrarTotal}
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            fontSize: 16,
            textTransform: 'uppercase',
            minWidth: 'auto',
            padding: '4px 8px',
            '&:hover': { backgroundColor: 'rgba(65, 182, 230, 0.08)' },
          }}
        >
          CERRAR
        </PrimaryButton>

        <React.Suspense fallback={null}>
          {paso === 'correo' && (
            <>
              {!!error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}
              {!!mensaje && (
                <Alert severity="success" sx={{ mb: 2 }}>
                  {mensaje}
                </Alert>
              )}

              <Step1Email
                correo={correo}
                setCorreo={setCorreo}
                error={error}
                mensaje={mensaje}
                onSubmit={handleBuscar} // 👈 envía el mail
                onCancel={handleCerrarTotal}
                loading={loading}
              />
            </>
          )}

          {paso === 'enviado' && (
            <>
              {!!error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}
              {!!mensaje && (
                <Alert severity="success" sx={{ mb: 2 }}>
                  {mensaje}
                </Alert>
              )}
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Puedes cerrar esta ventana. Cuando hagas clic en el enlace del
                correo, llegarás a la página para crear una nueva contraseña.
              </Typography>
            </>
          )}
        </React.Suspense>
      </Paper>
    </Box>
  );
});

export default AccountRecovery;
