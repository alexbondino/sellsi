import React, { useState, memo, useReducer } from 'react';
import { Box, Button, TextField, Typography, Link, Paper, InputAdornment, IconButton } from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import Dialog from '@mui/material/Dialog';
import Recuperar from './Recuperar';
import CrearAcc from './crearacc';

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
const RecuperarDialog = memo(({ open, onClose, mostrarCodigo, setMostrarCodigo }) => (
  <Dialog
    open={open}
    onClose={(event, reason) => {
      if (mostrarCodigo && reason === 'backdropClick') return;
      onClose();
    }}
    maxWidth={false}
  >
    <Recuperar
      onClose={onClose}
      mostrarCodigo={mostrarCodigo}
      setMostrarCodigo={setMostrarCodigo}
    />
  </Dialog>
));

const RegistroDialog = memo(({ open, onClose }) => (
  <Dialog
    open={open}
    onClose={(event, reason) => {
      if (reason === 'backdropClick') return;
      onClose();
    }}
    maxWidth={false}
  >
    <CrearAcc
      onClose={onClose}
    />
  </Dialog>
));

export default function Login() {
  const theme = useTheme();
  const [state, dispatch] = useReducer(reducer, {
    correo: '',
    contrasena: '',
    errorCorreo: '',
    errorContrasena: '',
    showPassword: false,
    openRecuperar: false,
    mostrarCodigo: false,
    openRegistro: false,
  });

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

  const validarFormulario = () => {
    const errores = {
      correo: '',
      contrasena: ''
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

  const handleLogin = (e) => {
    e.preventDefault();
    if (validarFormulario()) {
      // Lógica de autenticación aquí
    }
  };

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minHeight="100vh"
      bgcolor={theme.palette.background.default}
    >
      {/* Logo dinámico */}
      <img
        src={theme.palette.mode === 'dark' ? '/logodarkmode.jpeg' : '/LOGO-removebg-preview.png'}
        alt="SELLSI Logo"
        style={{ width: LOGO_WIDTH, marginBottom: 10 }}
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
          fontStyle: 'italic', // <-- agrega esto
          textShadow: theme.palette.mode === 'dark'
            ? '0 1px 4px rgba(0,0,0,0.7)'
            : '0 1px 2px rgba(255,255,255,0.2)',
        }}
      >
        Conecta. Vende. Crece

      </Typography>
      <Paper elevation={3} sx={{ p: 4, width: FORM_WIDTH, maxWidth: '90%' }}>
        <form onSubmit={handleLogin}>
          <Box display="flex" flexDirection="column" gap={2}>
            <TextField
              size="small"
              variant="outlined"
              fullWidth
              label="Correo"
              placeholder="Ingrese su correo electrónico"
              value={correo}
              onChange={(e) => dispatch({ type: 'SET_CORREO', payload: e.target.value })}
              inputProps={{
                lang: "es",
              }}
              error={!!errorCorreo}
              helperText={errorCorreo}
            />
            <TextField
              size="small"
              type={showPassword ? "text" : "password"}
              variant="outlined"
              fullWidth
              label="Contraseña"
              placeholder="Ingrese su contraseña"
              value={contrasena}
              onChange={(e) => dispatch({ type: 'SET_CONTRASENA', payload: e.target.value })}
              inputProps={{
                lang: "es",
              }}
              error={!!errorContrasena}
              helperText={errorContrasena}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={() => dispatch({ type: 'TOGGLE_SHOW_PASSWORD' })}
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
        <Box display="flex" flexDirection="column" alignItems="center" mt={1}>
          <Typography variant="body2">
            ¿Olvidaste tu contraseña?{' '}
            <Link
              component="button"
              sx={commonStyles.link}
              onClick={() => dispatch({ type: 'OPEN_RECUPERAR' })}
            >
              Recuperar Contraseña
            </Link>
          </Typography>
          <Typography variant="body2">
            ¿Eres nuevo?{' '}
            <Link
              component="button"
              sx={commonStyles.link}
              onClick={() => dispatch({ type: 'OPEN_REGISTRO' })}
            >
              Regístrate
            </Link>
          </Typography>
        </Box>
      </Paper>
      {/* Dialogo para recuperar contraseña */}
      <RecuperarDialog
        open={openRecuperar}
        onClose={() => dispatch({ type: 'CLOSE_RECUPERAR' })}
        mostrarCodigo={mostrarCodigo}
        setMostrarCodigo={(valor) => dispatch({ type: 'SET_MOSTRAR_CODIGO', payload: valor })}
      />
      {/* Dialogo para registro */}
      <RegistroDialog
        open={openRegistro}
        onClose={() => dispatch({ type: 'CLOSE_REGISTRO' })}
      />
    </Box>
  );
}