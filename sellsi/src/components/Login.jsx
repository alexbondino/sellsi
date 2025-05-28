import React, { useEffect, memo, useState } from 'react'
import { useLocation } from 'react-router-dom' // ✅ AGREGAR
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
} from '@mui/material'
import { Visibility, VisibilityOff } from '@mui/icons-material'

import { CustomButton } from '../hooks/shared'
import { useLoginForm } from '../hooks/shared/useLoginForm'
import Recuperar from './Recuperar'
import Register from './Register'

// ✅ CONSTANTS
const CONSTANTS = {
  FORM_WIDTH: 400,
}

// ✅ COMMON STYLES
const commonStyles = {
  link: {
    color: '#1976d2',
    fontWeight: 600,
    textDecoration: 'none',
    cursor: 'pointer',
    '&:hover': {
      textDecoration: 'underline',
    },
  },
}

// ✅ LOGO COMPONENT
const Logo = memo(() => (
  <Box sx={{ textAlign: 'center', mb: 2 }}>
    <img
      src="/logo.svg"
      alt="SELLSI Logo"
      style={{ width: 160, marginBottom: 8 }}
    />
    <Typography
      variant="h6"
      sx={{
        color: '#222',
        fontWeight: 700,
        fontSize: 18,
        fontStyle: 'italic',
      }}
    >
      Conecta. Vende. Crece.
    </Typography>
  </Box>
))

// ✅ LOGIN FORM COMPONENT
const LoginForm = memo(({ state, dispatch, onSubmit }) => (
  <Paper
    elevation={3}
    sx={{
      p: 3,
      width: CONSTANTS.FORM_WIDTH,
      maxWidth: '90%',
      mt: 3,
      mb: 3,
      borderRadius: 2,
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
          onChange={(e) =>
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
          onChange={(e) =>
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
                >
                  {state.showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
        <Box display="flex" justifyContent="center" mt={1}>
          <CustomButton
            type="submit"
            sx={{
              width: '40%',
              minWidth: 120,
              height: 40,
              fontSize: 16,
              fontWeight: 700,
            }}
          >
            Aceptar
          </CustomButton>
        </Box>
      </Box>
    </form>
  </Paper>
))

// ✅ FOOTER LINKS COMPONENT
const FooterLinks = memo(({ dispatch, onClose, onOpenRegister }) => (
  <Box display="flex" flexDirection="column" alignItems="center" mt={2} gap={1}>
    <Typography variant="body2" sx={{ textAlign: 'center' }}>
      ¿Olvidaste tu contraseña?
      <br />
      <Link
        component="button"
        type="button"
        sx={commonStyles.link}
        onClick={() => dispatch({ type: 'OPEN_RECUPERAR' })}
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
          onClose()
          onOpenRegister()
        }}
      >
        Regístrate
      </Link>
    </Typography>
  </Box>
))

// ✅ MAIN COMPONENT
export default function Login({ open, onClose, onOpenRegister }) {
  const { state, dispatch, handleLogin, resetForm } = useLoginForm()
  const location = useLocation() // ✅ AGREGAR

  useEffect(() => {
    if (!open) {
      resetForm()
    }
  }, [open])

  // ✅ CERRAR MODAL EN NAVEGACIÓN
  useEffect(() => {
    const handleCloseAllModals = () => {
      if (open) {
        onClose()
      }
    }

    window.addEventListener('closeAllModals', handleCloseAllModals)

    return () => {
      window.removeEventListener('closeAllModals', handleCloseAllModals)
    }
  }, [open, onClose])

  // ✅ CERRAR al cambiar de ruta
  // useEffect(() => {
  //   if (open) {
  //     onClose()
  //   }
  // }, [location.pathname, open, onClose])

  const handleSubmit = (e) => {
    handleLogin(e, onClose)
  }

  const handleRecuperarClose = () => {
    dispatch({ type: 'CLOSE_RECUPERAR' })
  }

  const handleVolverLogin = () => {
    dispatch({ type: 'CLOSE_RECUPERAR' })
  }

  const handleRegistroClose = () => {
    dispatch({ type: 'CLOSE_REGISTRO' })
  }

  return (
    <>
      {/* ✅ DIALOG PRINCIPAL */}
      <Dialog
        open={open && !state.openRecuperar}
        onClose={onClose}
        maxWidth={false}
        PaperProps={{
          sx: {
            borderRadius: 2,
            maxHeight: '90vh',
            overflow: 'hidden',
          },
        }}
      >
        <DialogContent sx={{ p: 0, overflow: 'hidden' }}>
          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            sx={{ p: 3 }}
          >
            <Logo />
            <LoginForm
              state={state}
              dispatch={dispatch}
              onSubmit={handleSubmit}
            />
            <FooterLinks
              dispatch={dispatch}
              onClose={onClose}
              onOpenRegister={onOpenRegister}
            />
          </Box>
        </DialogContent>
      </Dialog>

      {/* ✅ DIALOG RECUPERAR */}
      <Dialog
        open={state.openRecuperar}
        onClose={handleRecuperarClose}
        maxWidth={false}
        PaperProps={{
          sx: {
            borderRadius: 2,
            maxHeight: '90vh',
            overflow: 'hidden',
          },
        }}
      >
        <Recuperar
          onClose={handleRecuperarClose}
          onVolverLogin={handleVolverLogin}
        />
      </Dialog>

      {/* ✅ DIALOG REGISTRO */}
      <Dialog
        open={state.openRegistro}
        onClose={handleRegistroClose}
        maxWidth="md"
        fullWidth
      >
        <Register open={state.openRegistro} onClose={handleRegistroClose} />
      </Dialog>
    </>
  )
}
