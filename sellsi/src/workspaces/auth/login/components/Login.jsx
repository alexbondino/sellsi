// 📁 domains/auth/components/Login.jsx
// Migrado de features/login/Login.jsx
import React, { useEffect, memo } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  TextField,
  Link,
  InputAdornment,
  IconButton,
  Paper,
  Button,
  Divider,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import CloseIcon from '@mui/icons-material/Close';
import GoogleIcon from '@mui/icons-material/Google';

import { PrimaryButton } from '../../../../shared/components';
import { useLoginForm } from '../hooks/useLoginForm';
import Recuperar from '../../account-recovery/components/AccountRecovery';
import Register from '../../register/components/Register';
import { useBodyScrollLock } from '../../../../shared/hooks/useBodyScrollLock';

// ✅ CONSTANTS
const CONSTANTS = {
  FORM_WIDTH: 400,
};

// ✅ COMMON STYLES
const commonStyles = {
  link: {
    color: '#2E52B2',
    fontWeight: 600,
    textDecoration: 'none',
    cursor: 'pointer',
    '&:hover': {
      textDecoration: 'underline',
    },
  },
};

// ✅ LOGO COMPONENT
const Logo = memo(() => (
  <Box 
    sx={{ 
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      mb: 2,
      width: '100%'
    }}
  >
    <img
      src="/Logos/sellsi_logo_transparent.webp"
      alt="SELLSI Logo"
      style={{ width: 160, marginBottom: 8, display: 'block' }}
    />
    <Typography
      variant="h6"
      sx={{
        color: '#2E52B2', //Azul Logo Sellsi
        fontWeight: 700,
        fontSize: 18,
        fontStyle: 'italic',
        textAlign: 'center'
      }}
    >
      Conecta. Vende. Crece.
    </Typography>
  </Box>
));

// ✅ LOGIN FORM COMPONENT
const LoginForm = memo(({ state, dispatch, onSubmit, onGoogleLogin }) => (
  <Box
    sx={{
      p: 3,
      width: CONSTANTS.FORM_WIDTH,
      maxWidth: '100%',
      border: 'none',
      boxShadow: 'none',
    }}
  >
    <form onSubmit={onSubmit}>
      <Box display="flex" flexDirection="column" gap={1.5}>
        <TextField
          size="small"
          variant="outlined"
          fullWidth
          label="Correo"
          placeholder="Ingrese su correo electrónico"
          value={state.correo}
          onChange={e =>
            dispatch({ type: 'SET_CORREO', payload: e.target.value })
          }
          inputProps={{ lang: 'es' }}
          error={!!state.errorCorreo}
          helperText={state.errorCorreo}
          sx={{ mb: 0.5 }}
        />
        <TextField
          size="small"
          type={state.showPassword ? 'text' : 'password'}
          variant="outlined"
          fullWidth
          label="Contraseña"
          placeholder="Ingrese su contraseña"
          value={state.contrasena}
          onChange={e =>
            dispatch({ type: 'SET_CONTRASENA', payload: e.target.value })
          }
          inputProps={{ lang: 'es' }}
          error={!!state.errorContrasena}
          helperText={state.errorContrasena}
          sx={{ mb: 1.5 }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  aria-label="toggle password visibility"
                  onClick={() => dispatch({ type: 'TOGGLE_SHOW_PASSWORD' })}
                  edge="end"
                  size="small"
                  tabIndex={-1}
                >
                  {state.showPassword ? <Visibility /> : <VisibilityOff />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
        <Box display="flex" justifyContent="center" mt={1}>
          <PrimaryButton
            type="submit"
            sx={{
              width: '60%',
              minWidth: 180,
              height: 40,
              fontSize: 16,
              fontWeight: 700,
            }}
          >
            Iniciar Sesión
          </PrimaryButton>
        </Box>
      </Box>
    </form>

    <Divider sx={{ my: 2 }}>
      <Typography variant="body2" color="text.secondary">
        o
      </Typography>
    </Divider>

    {/* Botón de Google */}
    <Button
      fullWidth
      variant="outlined"
      startIcon={<GoogleIcon />}
      onClick={onGoogleLogin}
      sx={{
        mb: 2,
        py: 1.2,
        borderColor: '#dadce0',
        color: '#3c4043',
        textTransform: 'none',
        fontSize: 14,
        fontWeight: 500,
        '&:hover': {
          borderColor: '#d2d3d4',
          backgroundColor: '#f8f9fa',
        },
      }}
    >
      Continuar con Google
    </Button>
  </Box>
));

// ✅ FOOTER LINKS COMPONENT
const FooterLinks = memo(({ dispatch, onClose, onOpenRegister }) => (
  <Box display="flex" flexDirection="column" alignItems="center" mt={2} gap={1}>
    {' '}
    <Typography variant="body2" sx={{ textAlign: 'center' }}>
      ¿Olvidaste tu contraseña?
      <br />
      <Link
        component="button"
        type="button"
        sx={commonStyles.link}
        onClick={() => {
          dispatch({ type: 'RESET_FORM' });
          dispatch({ type: 'OPEN_RECUPERAR' });
        }}
      >
        Recuperar Contraseña
      </Link>
      <br />
      ¿Eres nuevo?{' '}
      <Link
        component="button"
        type="button"
        sx={commonStyles.link}
        onClick={() => {
          onClose();
          onOpenRegister();
        }}
      >
        Regístrate
      </Link>
    </Typography>
  </Box>
));

// ✅ MAIN COMPONENT
export default function Login({ open, onClose, onOpenRegister }) {
  const {
    state,
    dispatch,
    handleLogin,
    handleGoogleLogin,
    resetForm,
    reenviarCorreo,
  } = useLoginForm();
  const location = useLocation();

  // ✅ Bloquear scroll del body cuando el modal está abierto
  useBodyScrollLock(open);

  useEffect(() => {
    if (!open) {
      resetForm();
    }
  }, [open]);

  useEffect(() => {
    const handleCloseAllModals = () => {
      if (open) {
        onClose();
      }
    };

    window.addEventListener('closeAllModals', handleCloseAllModals);

    return () => {
      window.removeEventListener('closeAllModals', handleCloseAllModals);
    };
  }, [open, onClose]);

  // ✅ CERRAR al cambiar de ruta
  // useEffect(() => {
  //   if (open) {
  //     onClose()
  //   }
  // }, [location.pathname, open, onClose])
  const handleSubmit = e => {
    handleLogin(e, onClose);
  };

  const handleRecuperarClose = () => {
    // Al cerrar el modal de recuperar, también cerramos el modal principal
    dispatch({ type: 'CLOSE_RECUPERAR' });
    onClose(); // ✅ CERRAR COMPLETAMENTE EL MODAL PRINCIPAL
  };

  const handleVolverLogin = () => {
    // ✅ AL VOLVER DESDE STEP4SUCCESS, CERRAR RECUPERAR Y ABRIR LOGIN
    dispatch({ type: 'CLOSE_RECUPERAR' });
    // No cerrar el modal principal, mantenerlo abierto para mostrar el login
  };

  const handleRegistroClose = () => {
    dispatch({ type: 'CLOSE_REGISTRO' });
  };

  return (
    <>
      {/* ✅ DIALOG PRINCIPAL */}
      <Dialog
        open={open && !state.openRecuperar}
        onClose={onClose}
        maxWidth={false}
        disableScrollLock={true}
        disableRestoreFocus={true}
        PaperProps={{
          sx: {
            borderRadius: 2,
            maxHeight: '90vh',
            overflow: 'hidden',
            position: 'fixed',
            width: { xs: '95%', sm: 'auto' },
          },
        }}
      >
        <DialogContent sx={{ p: 0, overflow: 'hidden', position: 'relative' }}>
          <IconButton
            onClick={onClose}
            sx={{
              position: 'absolute',
              right: 16,
              top: 16,
              color: '#666',
              zIndex: 1,
              backgroundColor: 'rgba(0,0,0,0.05)',
              '&:hover': { backgroundColor: 'rgba(0,0,0,0.1)' },
            }}
          >
            <CloseIcon />
          </IconButton>
          {state.cuentaNoVerificada ? (
            <Box
              display="flex"
              flexDirection="column"
              alignItems="center"
              p={4}
            >
              <Typography
                variant="h6"
                color="error"
                gutterBottom
                textAlign="center"
              >
                📧 Verificación de email pendiente
              </Typography>
              <Typography variant="body2" sx={{ mb: 2, textAlign: 'center' }}>
                Por favor, revisa tu correo electrónico
                {state.correo && (
                  <>
                    {' '}
                    (<strong>{state.correo}</strong>)
                  </>
                )}{' '}
                y haz clic en el enlace de confirmación que te enviamos.
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mb: 2, textAlign: 'center', fontSize: '0.875rem' }}
              >
                💡 Revisa también tu carpeta de spam o correo no deseado.
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mb: 3, textAlign: 'center' }}
              >
                Hemos reenviado el correo de verificación automáticamente.
              </Typography>
              <PrimaryButton
                variant="outlined"
                onClick={() => dispatch({ type: 'VOLVER_A_LOGIN' })}
              >
                Volver al inicio de sesión
              </PrimaryButton>
            </Box>
          ) : (
            <Box
              display="flex"
              flexDirection="column"
              alignItems="center"
              sx={{ p: 0, py: 4 }}
            >
              <Logo />
              <LoginForm
                state={state}
                dispatch={dispatch}
                onSubmit={handleSubmit}
                onGoogleLogin={handleGoogleLogin}
              />
              <FooterLinks
                dispatch={dispatch}
                onClose={onClose}
                onOpenRegister={onOpenRegister}
              />
            </Box>
          )}
        </DialogContent>
      </Dialog>
      {/* ✅ DIALOG RECUPERAR */}
      <Dialog
        open={state.openRecuperar}
        onClose={handleVolverLogin}
        maxWidth={false}
        disableScrollLock={true}
        disableRestoreFocus={true}
        PaperProps={{
          sx: {
            borderRadius: 2,
            maxHeight: '90vh',
            overflow: 'hidden',
            position: 'fixed',
            width: { xs: '95%', sm: 'auto' },
          },
        }}
      >
        <Recuperar
          onClose={handleRecuperarClose}
          onVolverLogin={handleVolverLogin}
        />
      </Dialog>{' '}
      {/* ✅ DIALOG REGISTRO - LAZY LOADING */}
      {state.openRegistro && (
        <Dialog
          open={state.openRegistro}
          onClose={handleRegistroClose}
          maxWidth="md"
          fullWidth
          disableScrollLock={true}
          disableRestoreFocus={true}
          PaperProps={{
            sx: {
              position: 'fixed',
            },
          }}
        >
          <Register open={state.openRegistro} onClose={handleRegistroClose} />
        </Dialog>
      )}
    </>
  );
}
