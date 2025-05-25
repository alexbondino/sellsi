import React, { useState, memo, useReducer, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Link,
  Paper,
  InputAdornment,
  IconButton,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import CloseIcon from '@mui/icons-material/Close';
import Recuperar from './Recuperar';
import Register from './Register.jsx';

// Extraer estilos comunes
const commonStyles = {
  button: {
    backgroundColor: '#41B6E6',
    color: '#fff',
    borderRadius: 2,
    textTransform: 'none',
    fontWeight: 400,
    boxShadow: 'none',
    '&:hover': { backgroundColor: '#2fa4d6' },
  },
  link: {
    color: '#41B6E6',
    cursor: 'pointer',
  },
};

// Constantes para tamaños
const LOGO_WIDTH = 300;
const FORM_WIDTH = 400;

// Reducer para manejar el estado
const reducer = (state, action) => {
  switch (action.type) {
    case 'SET_CORREO':
      return { ...state, correo: action.payload };
    case 'SET_CONTRASENA':
      return { ...state, contrasena: action.payload };
    case 'SET_ERROR_CORREO':
      return { ...state, errorCorreo: action.payload };
    case 'SET_ERROR_CONTRASENA':
      return { ...state, errorContrasena: action.payload };
    case 'TOGGLE_SHOW_PASSWORD':
      return { ...state, showPassword: !state.showPassword };
    case 'OPEN_RECUPERAR':
      return { ...state, openRecuperar: true };
    case 'CLOSE_RECUPERAR':
      return { ...state, openRecuperar: false };
    case 'SET_MOSTRAR_CODIGO':
      return { ...state, mostrarCodigo: action.payload };
    case 'OPEN_REGISTRO':
      return { ...state, openRegistro: true };
    case 'CLOSE_REGISTRO':
      return { ...state, openRegistro: false };
    default:
      return state;
  }
};

// Componentes de diálogo memorizados
const RecuperarDialog = memo(({ open, onClose, onVolverLogin }) => {
  const recuperarRef = React.useRef();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      onExited={() => {
        if (recuperarRef.current) {
          recuperarRef.current();
        }
      }}
    >
      <Recuperar
        ref={recuperarRef}
        open={open}
        onClose={onClose}
        onVolverLogin={onVolverLogin}
      />
    </Dialog>
  );
});

const RegistroDialog = memo(({ open, onClose }) => (
  <Dialog
    open={open}
    onClose={(event, reason) => {
      if (reason === 'backdropClick') return;
      onClose();
    }}
    maxWidth={false}
  >
    <Register onClose={onClose} />
  </Dialog>
));

export default function Login({ open, handleClose, handleOpenRegister }) {
  const theme = useTheme();
  const initialState = {
    correo: '',
    contrasena: '',
    errorCorreo: '',
    errorContrasena: '',
    showPassword: false,
    openRecuperar: false,
    mostrarCodigo: false,
    openRegistro: false,
  };
  const [state, dispatch] = useReducer(reducer, initialState);

  const {
    correo,
    contrasena,
    errorCorreo,
    errorContrasena,
    showPassword,
    openRecuperar,
    mostrarCodigo,
    openRegistro,
  } = state;

  // Reiniciar campos y errores al cerrar el modal o abrir otro modal
  useEffect(() => {
    if (!open) {
      dispatch({ type: 'SET_CORREO', payload: '' });
      dispatch({ type: 'SET_CONTRASENA', payload: '' });
      dispatch({ type: 'SET_ERROR_CORREO', payload: '' });
      dispatch({ type: 'SET_ERROR_CONTRASENA', payload: '' });
      dispatch({ type: 'TOGGLE_SHOW_PASSWORD' }); // Asegura que showPassword vuelva a false si estaba true
    }
  }, [open]);

  // También reinicia al abrir Recuperar o Registro
  useEffect(() => {
    if (openRecuperar || openRegistro) {
      dispatch({ type: 'SET_CORREO', payload: '' });
      dispatch({ type: 'SET_CONTRASENA', payload: '' });
      dispatch({ type: 'SET_ERROR_CORREO', payload: '' });
      dispatch({ type: 'SET_ERROR_CONTRASENA', payload: '' });
      dispatch({ type: 'TOGGLE_SHOW_PASSWORD' });
    }
  }, [openRecuperar, openRegistro]);

  const validarFormulario = () => {
    const errores = {
      correo: '',
      contrasena: '',
    };

    if (!correo) {
      errores.correo = 'Por favor, rellena este campo.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
      errores.correo = 'Por favor, ingresa un correo válido.';
    }

    if (!contrasena) {
      errores.contrasena = 'Por favor, rellena este campo.';
    }

    dispatch({ type: 'SET_ERROR_CORREO', payload: errores.correo });
    dispatch({ type: 'SET_ERROR_CONTRASENA', payload: errores.contrasena });

    return !errores.correo && !errores.contrasena;
  };

  const handleLogin = e => {
    e.preventDefault();
    if (validarFormulario()) {
      // Lógica de autenticación aquí
    }
  };

  const handleVolverLogin = () => {
    dispatch({ type: 'CLOSE_RECUPERAR' }); // Cierra Recuperar
    // El modal de login ya está abierto porque nunca se cierra realmente,
    // solo se superpone el de recuperar.
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth={false}
      PaperProps={{
        sx: {
          mt: '-5vh',
          height: '620x', // <-- Reduce la altura aquí (prueba 580px o ajusta a tu gusto)
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-start',
        },
      }}
    >
      <DialogTitle sx={{ p: 0 }}>
        <Button
          onClick={handleClose}
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            color: '#41B6E6',
            fontWeight: 700,
            fontSize: 16,
            mb: 4,
            textTransform: 'uppercase',
          }}
        >
          CERRAR
        </Button>
      </DialogTitle>
      <DialogContent>
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
        >
          {/* Logo dinámico */}
          <img
            src="/logo.svg"
            alt="SELLSI Logo"
            style={{
              width: LOGO_WIDTH,
              marginBottom: 10,
              marginTop: 60,
            }}
          />
          {/* Texto debajo del logo */}
          <Typography
            variant="h6"
            align="center"
            sx={{
              mb: 2,
              color: theme.palette.mode === 'dark' ? '#fff' : '#222',
              fontWeight: 700,
              fontSize: 24,
              fontStyle: 'italic',
              textShadow:
                theme.palette.mode === 'dark'
                  ? '0 1px 4px rgba(0,0,0,0.7)'
                  : '0 1px 2px rgba(255,255,255,0.2)',
            }}
          >
            Conecta. Vende. Crece.
          </Typography>
          <Paper
            elevation={3}
            sx={{
              p: 4,
              width: FORM_WIDTH,
              maxWidth: '90%',
              mt: 4,
              mb: 4, // margen inferior reducido
            }}
          >
            <form onSubmit={handleLogin}>
              <Box display="flex" flexDirection="column" gap={2}>
                <TextField
                  size="small"
                  variant="outlined"
                  fullWidth
                  label="Correo"
                  placeholder="Ingrese su correo electrónico"
                  value={correo}
                  onChange={e =>
                    dispatch({ type: 'SET_CORREO', payload: e.target.value })
                  }
                  inputProps={{
                    lang: 'es',
                  }}
                  error={!!errorCorreo}
                  helperText={errorCorreo}
                />
                <TextField
                  size="small"
                  type={showPassword ? 'text' : 'password'}
                  variant="outlined"
                  fullWidth
                  label="Contraseña"
                  placeholder="Ingrese su contraseña"
                  value={contrasena}
                  onChange={e =>
                    dispatch({
                      type: 'SET_CONTRASENA',
                      payload: e.target.value,
                    })
                  }
                  inputProps={{
                    lang: 'es',
                  }}
                  error={!!errorContrasena}
                  helperText={errorContrasena}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={() =>
                            dispatch({ type: 'TOGGLE_SHOW_PASSWORD' })
                          }
                          edge="end"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
                <Box display="flex" justifyContent="center" mb={2}>
                  <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    sx={{
                      ...commonStyles.button,
                      width: '30%', // Ancho del botón manteniendo el centro
                      margin: '0 auto', // Esto ayuda a centrarlo
                    }}
                  >
                    Aceptar
                  </Button>
                </Box>
              </Box>
            </form>
            <Box
              display="flex"
              flexDirection="column"
              alignItems="center"
              mt={2}
              gap={1}
            >
              <Typography variant="body2" sx={{ textAlign: 'center' }}>
                ¿Olvidaste tu contraseña?{' '}
                <Link
                  component="button"
                  sx={commonStyles.link}
                  onClick={() => dispatch({ type: 'OPEN_RECUPERAR' })}
                >
                  Recuperar Contraseña
                </Link>
              </Typography>
              <Typography variant="body2" sx={{ textAlign: 'center' }}>
                ¿Eres nuevo?{' '}
                <Link
                  component="button"
                  sx={commonStyles.link}
                  onClick={() => {
                    handleClose();
                    handleOpenRegister();
                  }}
                >
                  Regístrate
                </Link>
              </Typography>
            </Box>
          </Paper>
        </Box>
      </DialogContent>
      <DialogActions>
        {/* Puedes dejar vacío o agregar acciones si lo necesitas */}
      </DialogActions>
      {/* Dialogo para recuperar contraseña */}
      <RecuperarDialog
        open={openRecuperar}
        onClose={() => dispatch({ type: 'CLOSE_RECUPERAR' })}
        mostrarCodigo={mostrarCodigo}
        setMostrarCodigo={valor =>
          dispatch({ type: 'SET_MOSTRAR_CODIGO', payload: valor })
        }
        onVolverLogin={handleVolverLogin} // <-- AGREGA ESTA PROP
      />
      {/* Dialogo para registro */}
      <RegistroDialog
        open={openRegistro}
        onClose={() => dispatch({ type: 'CLOSE_REGISTRO' })}
      />
    </Dialog>
  );
}
