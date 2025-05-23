import React, { useState, useRef, useEffect } from 'react'
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Checkbox,
  FormControlLabel,
  Link,
  InputAdornment,
  IconButton,
} from '@mui/material'
import { Visibility, VisibilityOff } from '@mui/icons-material'
import { useTheme } from '@mui/material/styles'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import Fade from '@mui/material/Fade' // Asegúrate de importar Fade

// Barra de progreso superior
function BarraProgreso({ paso }) {
  const theme = useTheme()
  const gris = '#b0b0b0'
  const celeste = '#41B6E6'
  const textoColor = theme.palette.mode === 'dark' ? '#fff' : '#222'

  const getCirculoEstilo = (index) => {
    const circuloPaso = index + 1
    if (circuloPaso < paso) {
      return { background: celeste }
    } else if (circuloPaso === paso) {
      // Mitad celeste, mitad gris para el paso actual (excepto paso 5, que es todo celeste)
      if (paso === 5) {
        return { background: celeste }
      }
      return {
        background: `linear-gradient(to right, ${celeste} 50%, ${gris} 50%)`,
      }
    } else {
      return { background: gris }
    }
  }

  const barra1Color = paso > 1 ? celeste : gris
  const barra2Color = paso > 2 ? celeste : gris
  const barra3Color = paso > 3 ? celeste : gris

  return (
    <Box
      sx={{
        width: '100%',
        position: 'relative',
        mt: 4,
        mb: 10,
        px: { xs: '5%', md: '8%' },
        height: 130, // <--- Aumenta la altura aquí
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      {/* Barra de progreso */}
      <Box
        sx={{
          position: 'absolute',
          top: 34,
          left: { xs: 'calc(5% + 32px)', md: 'calc(8% + 32px)' },
          right: { xs: 'calc(5% + 32px)', md: 'calc(8% + 32px)' },
          height: 8,
          zIndex: 0,
          display: 'flex',
        }}
      >
        <Box
          sx={{
            width: '33.3%',
            height: '100%',
            background: barra1Color,
            borderRadius: 4,
            transition: 'background 0.3s',
            mr: '2px',
          }}
        />
        <Box
          sx={{
            width: '33.3%',
            height: '100%',
            background: barra2Color,
            borderRadius: 4,
            transition: 'background 0.3s',
            mx: '2px',
          }}
        />
        <Box
          sx={{
            width: '33.3%',
            height: '100%',
            background: barra3Color,
            borderRadius: 4,
            transition: 'background 0.3s',
            ml: '2px',
          }}
        />
      </Box>
      {/* Círculos y textos */}
      <Box
        sx={{
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          position: 'relative',
          zIndex: 1,
          px: 0,
        }}
      >
        {[
          { text: 'Creación\nde Cuenta' },
          { text: 'Tipo de\nCuenta' },
          { text: 'Completar\nInformación' },
          { text: 'Cuenta\nCreada' },
        ].map((item, index) => (
          <Box
            key={index}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                ...getCirculoEstilo(index),
                mb: 1,
                zIndex: 2,
                fontWeight: 700,
                fontSize: 22,
                color: '#222',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background 0.3s',
              }}
            />
            <Typography
              sx={{
                fontSize: 16,
                fontWeight: 500,
                color: textoColor,
                textAlign: 'center',
                whiteSpace: 'pre-line',
                position: 'relative',
                zIndex: 5,
                mt: 2,
                backgroundColor:
                  theme.palette.mode === 'dark' ? '#121212' : '#ffffff',
                px: 1,
                borderRadius: 1,
              }}
            >
              {item.text}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  )
}

export default function CrearAcc({ open, onClose }) {
  const theme = useTheme()
  const [paso, setPaso] = useState(1)
  const [codigoVerificacion, setCodigoVerificacion] = useState([
    '',
    '',
    '',
    '',
    '',
  ])
  const [codigoEnviado, setCodigoEnviado] = useState(false) // para mostrar mensaje de reenvío si quieres
  const [showCodigoEnviado, setShowCodigoEnviado] = useState(false)
  const [fadeIn, setFadeIn] = useState(false)
  const fadeTimeout = useRef()

  // Estado para crearcuen1
  const [correo, setCorreo] = useState('')
  const [contrasena, setContrasena] = useState('')
  const [repiteContrasena, setRepiteContrasena] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showRepeatPassword, setShowRepeatPassword] = useState(false)
  const [aceptaTerminos, setAceptaTerminos] = useState(false)
  const [aceptaComunicaciones, setAceptaComunicaciones] = useState(false)
  const [tipoCuenta, setTipoCuenta] = useState('')
  const [logoEmpresa, setLogoEmpresa] = useState(null)
  const [logoError, setLogoError] = useState('')

  // Key para forzar desmontaje/remontaje
  const [dialogKey, setDialogKey] = useState(0)

  // Timer para el código de verificación
  const [timer, setTimer] = useState(300) // 5 minutos en segundos
  const timerRef = useRef()

  useEffect(() => {
    if (paso === 4) {
      setTimer(300)
      timerRef.current = setInterval(() => {
        setTimer((prev) => prev - 1)
      }, 1000)
    }
    return () => clearInterval(timerRef.current)
  }, [paso])

  useEffect(() => {
    if (timer === 0) {
      clearInterval(timerRef.current)
    }
  }, [timer])

  useEffect(() => {
    if (showCodigoEnviado) {
      setFadeIn(true)
      // Oculta después de 15 segundos con fade out
      fadeTimeout.current = setTimeout(() => {
        setFadeIn(false)
        setTimeout(() => setShowCodigoEnviado(false), 400) // 400ms para el fade
      }, 15000)
    }
    return () => clearTimeout(fadeTimeout.current)
  }, [showCodigoEnviado])

  const handleLogoChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 300 * 1024) {
        setLogoError('El tamaño del archivo excede los 300 KB.')
        setLogoEmpresa(null)
        return
      }
      setLogoError('')
      const reader = new FileReader()
      reader.onload = (ev) => setLogoEmpresa(ev.target.result)
      reader.readAsDataURL(file)
    }
  }

  // Validaciones de contraseña
  const requisitos = [
    { label: 'Al menos 8 caracteres', valid: contrasena.length >= 8 },
    { label: 'Letras minúsculas (a-z)', valid: /[a-z]/.test(contrasena) },
    { label: 'Letras mayúsculas (A-Z)', valid: /[A-Z]/.test(contrasena) },
    { label: 'Números (0-9)', valid: /\d/.test(contrasena) },
  ]
  // Debe cumplir al menos 4 de 4
  const requisitosValidos = requisitos.filter((r) => r.valid).length
  const cumpleMinimos = requisitosValidos >= 4

  // Validación de correo electrónico
  const correoValido = /^[^@]+@[^@]+\.[^@]+$/
  const correoEsValido = correoValido.test(correo)

  // Validación de repetición de contraseña
  const contrasenasCoinciden =
    contrasena === repiteContrasena && repiteContrasena.length > 0

  const resetForm = () => {
    setPaso(1)
    setCorreo('')
    setContrasena('')
    setRepiteContrasena('')
    setShowPassword(false)
    setShowRepeatPassword(false)
    setAceptaTerminos(false)
    setAceptaComunicaciones(false)
    setTipoCuenta('')
    setLogoEmpresa(null)
    setLogoError('')
  }

  // Cuando el modal termina de cerrarse, resetea el form y cambia la key
  const handleExited = () => {
    resetForm()
    setDialogKey((k) => k + 1)
  }

  // Cambia el handler de cierre para controlar el backdropClick:
  const handleDialogClose = (event, reason) => {
    // Solo permitir cerrar con backdropClick en paso 1
    if (
      (paso === 2 || paso === 3 || paso === 4 || paso === 5) &&
      reason === 'backdropClick'
    ) {
      return
    }
    onClose(event, reason)
  }

  return (
    <Dialog
      key={dialogKey}
      open={open}
      onClose={handleDialogClose} // <-- usa el nuevo handler
      onExited={handleExited}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          width: '90vw',
          maxWidth: 1050,
          height: '90vh',
          overflowX: 'hidden',
        },
      }}
    >
      <DialogTitle sx={{ p: 0 }}>
        <Button
          onClick={onClose}
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            color: '#41B6E6',
            fontWeight: 700,
            fontSize: 16,
            textTransform: 'uppercase',
          }}
        >
          CERRAR
        </Button>
      </DialogTitle>
      <DialogContent sx={{ overflowX: 'hidden', px: { xs: 2, sm: 3 } }}>
        {/* Barra de progreso */}
        <BarraProgreso paso={paso} />

        {/* Paso 1: Registro */}
        {paso === 1 && (
          <Box
            sx={{
              maxWidth: 520,
              width: '100%',
              mx: 'auto',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              mb: 2,
              mt: 0,
            }}
          >
            <img
              src="/LOGO-removebg-preview.png"
              alt="SELLSI Logo"
              style={{ width: 200, marginBottom: 10, margintop: 1 }}
            />
            <Typography
              variant="h6"
              align="center"
              sx={{
                mb: 10,
                color: theme.palette.mode === 'dark' ? '#fff' : '#222',
                fontWeight: 700,
                fontSize: 20,
                fontStyle: 'italic',
              }}
            >
              Conecta. Vende. Crece.
            </Typography>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                setPaso(2)
              }}
              style={{ width: '100%' }}
            >
              <TextField
                label="Correo electrónico"
                variant="outlined"
                fullWidth
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                sx={{ mb: 2 }}
                error={correo.length > 0 && !correoEsValido}
                helperText={
                  correo.length > 0 && !correoEsValido
                    ? 'Correo inválido. Ejemplo: usuario@dominio.com'
                    : ''
                }
              />
              <TextField
                label="Contraseña"
                type={showPassword ? 'text' : 'password'}
                variant="outlined"
                fullWidth
                value={contrasena}
                onChange={(e) => setContrasena(e.target.value)}
                sx={{ mb: 2 }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={() => setShowPassword((show) => !show)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                  sx: {
                    height: 44,
                    fontSize: 16,
                    px: 1.2,
                  },
                }}
                inputProps={{
                  lang: 'es',
                  style: { height: 28 },
                }}
              />
              <TextField
                label="Repita su Contraseña"
                type={showRepeatPassword ? 'text' : 'password'}
                variant="outlined"
                fullWidth
                value={repiteContrasena}
                onChange={(e) => setRepiteContrasena(e.target.value)}
                sx={{ mb: 2 }}
                error={repiteContrasena.length > 0 && !contrasenasCoinciden}
                helperText={
                  repiteContrasena.length > 0 && !contrasenasCoinciden
                    ? 'Las contraseñas no coinciden'
                    : ''
                }
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle repeat password visibility"
                        onClick={() => setShowRepeatPassword((show) => !show)}
                        edge="end"
                      >
                        {showRepeatPassword ? (
                          <VisibilityOff />
                        ) : (
                          <Visibility />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                  sx: {
                    height: 44,
                    fontSize: 16,
                    px: 1.2,
                  },
                }}
                inputProps={{
                  lang: 'es',
                  style: { height: 28 },
                }}
              />
              {/* Requisitos de contraseña */}
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  mb: 2,
                  background: theme.palette.background.default,
                  fontSize: 14,
                  width: '100%',
                  boxSizing: 'border-box',
                }}
              >
                <Typography sx={{ fontWeight: 700, mb: 1 }}>
                  Tu contraseña debe reunir las siguientes condiciones:
                </Typography>
                <ul style={{ margin: 0, paddingLeft: 20 }}>
                  {requisitos.map((req, idx) => (
                    <li
                      key={idx}
                      style={{ color: req.valid ? 'green' : undefined }}
                    >
                      {req.valid ? '✓' : '•'} {req.label}
                    </li>
                  ))}
                </ul>
              </Paper>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={aceptaTerminos}
                    onChange={(e) => setAceptaTerminos(e.target.checked)}
                    sx={{ color: '#41B6E6' }}
                  />
                }
                label={
                  <span>
                    Acepto los{' '}
                    <Link href="#" sx={{ color: '#1976d2', fontWeight: 700 }}>
                      Términos y Condiciones
                    </Link>{' '}
                    y la{' '}
                    <Link href="#" sx={{ color: '#1976d2', fontWeight: 700 }}>
                      Política de Privacidad
                    </Link>
                  </span>
                }
                sx={{ mb: 1 }}
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={aceptaComunicaciones}
                    onChange={(e) => setAceptaComunicaciones(e.target.checked)}
                    sx={{ color: '#41B6E6' }}
                  />
                }
                label="Acepto recibir avisos de ofertas y novedades de Sellsi."
                sx={{ mb: 2 }}
              />
              <Button
                type="submit"
                variant="contained"
                disabled={
                  !cumpleMinimos ||
                  !aceptaTerminos ||
                  !correoEsValido ||
                  !contrasenasCoinciden
                }
                sx={{
                  backgroundColor:
                    cumpleMinimos &&
                    aceptaTerminos &&
                    correoEsValido &&
                    contrasenasCoinciden
                      ? '#41B6E6'
                      : '#b0c4cc',
                  color: '#fff',
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 700,
                  fontSize: 18,
                  width: '100%',
                  height: 48,
                  boxShadow: 'none',
                  mb: 1,
                  '&:hover': {
                    backgroundColor:
                      cumpleMinimos &&
                      aceptaTerminos &&
                      correoEsValido &&
                      contrasenasCoinciden
                        ? '#2fa4d6'
                        : '#b0c4cc',
                  },
                }}
              >
                Crear cuenta
              </Button>
              <Button
                variant="text"
                onClick={onClose} // Solo onClose
                sx={{
                  color: '#1976d2',
                  fontWeight: 700,
                  fontSize: 15,
                  width: '100%',
                  mt: 1,
                }}
              >
                Volver atrás
              </Button>
            </form>
          </Box>
        )}

        {/* Paso 2: Selección de tipo de cuenta */}
        {paso === 2 && (
          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            minHeight={350}
          >
            <Typography
              variant="h5"
              sx={{ mb: 10, mt: 4, fontWeight: 700, textAlign: 'center' }}
            >
              Elige el tipo de cuenta predeterminado
            </Typography>
            <Box
              display="flex"
              gap={{ xs: 2, sm: 3, md: 4 }}
              width="100%"
              justifyContent="center"
              flexWrap="wrap"
              sx={{ px: { xs: 1, sm: 2 } }}
            >
              {/* Cuenta Proveedor */}
              <Paper
                elevation={3}
                sx={{
                  p: { xs: 2, sm: 3 },
                  minWidth: { xs: 280, sm: 300 },
                  maxWidth: 350,
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  height: 352,
                  border:
                    tipoCuenta === 'proveedor'
                      ? `2px solid #41B6E6`
                      : `2px solid #eee`,
                  background:
                    tipoCuenta === 'proveedor' ? '#f0fbff' : '#fafbfc',
                  transition: 'border 0.2s, background 0.2s',
                }}
              >
                <Box flexGrow={1} width="100%">
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: 700, mb: 1, color: '#222' }}
                  >
                    Cuenta Proveedor
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#888', mb: 2 }}>
                    Regístrate como proveedor para:
                  </Typography>
                  <ul
                    style={{
                      margin: 0,
                      paddingLeft: 18,
                      color: '#444',
                      fontSize: 15,
                    }}
                  >
                    <li>
                      Crear el perfil de tu empresa y promocionar tus productos
                    </li>
                    <li>Recibir solicitudes de compradores</li>
                    <li>Acceder a una base de datos de compradores</li>
                    <li>Ofrecer productos a leads de compradores</li>
                    <li>Comerciar carga no reclamada</li>
                  </ul>
                </Box>
                <Button
                  sx={{
                    width: '100%',
                    backgroundColor:
                      tipoCuenta === 'proveedor' ? '#41B6E6' : '#b0c4cc',
                    color: '#fff',
                    fontWeight: 700,
                    textTransform: 'none',
                    mt: 2,
                    '&:hover': { backgroundColor: '#2fa4d6' },
                  }}
                  onClick={() => setTipoCuenta('proveedor')}
                >
                  Elegir
                </Button>
              </Paper>
              {/* Cuenta Comprador */}
              <Paper
                elevation={3}
                sx={{
                  p: { xs: 2, sm: 3 },
                  minWidth: { xs: 280, sm: 300 },
                  maxWidth: 350,
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  height: 352,
                  border:
                    tipoCuenta === 'comprador'
                      ? `2px solid #41B6E6`
                      : `2px solid #eee`,
                  background:
                    tipoCuenta === 'comprador' ? '#f0fbff' : '#fafbfc',
                  transition: 'border 0.2s, background 0.2s',
                }}
              >
                <Box flexGrow={1} width="100%">
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: 700, mb: 1, color: '#222' }}
                  >
                    Cuenta Comprador
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#888', mb: 2 }}>
                    Regístrate como comprador para:
                  </Typography>
                  <ul
                    style={{
                      margin: 0,
                      paddingLeft: 18,
                      color: '#444',
                      fontSize: 15,
                    }}
                  >
                    <li>
                      Buscar productos y solicitar cotizaciones a proveedores
                    </li>
                    <li>Crear solicitudes para que proveedores te contacten</li>
                    <li>Acceder a carga no reclamada</li>
                  </ul>
                </Box>
                <Button
                  variant="contained"
                  sx={{
                    width: '100%',
                    backgroundColor:
                      tipoCuenta === 'comprador' ? '#41B6E6' : '#b0c4cc',
                    color: '#fff',
                    fontWeight: 700,
                    textTransform: 'none',
                    mt: 2,
                    '&:hover': { backgroundColor: '#2fa4d6' },
                  }}
                  onClick={() => setTipoCuenta('comprador')}
                >
                  Elegir
                </Button>
              </Paper>
            </Box>
            {/* SEPARADOR GRANDE */}
            <Box
              mt={10}
              display="flex"
              flexDirection="column"
              alignItems="center"
              width="100%"
            >
              <Typography
                sx={{ color: '#888', fontSize: 14, mb: 3, textAlign: 'center' }}
              >
                *Podrás cambiar el tipo de cuenta más adelante desde la
                configuración de tu perfil.
              </Typography>
              <Box
                display="flex"
                flexDirection="row"
                justifyContent="center"
                alignItems="center"
                gap={8}
                width="100%"
                maxWidth={400}
                mb={2}
              >
                {/* Botón Volver Atrás igual al del paso 3 */}
                <Button
                  variant="outlined"
                  onClick={() => setPaso(1)}
                  sx={{
                    fontWeight: 700,
                    fontSize: 20,
                    px: 4,
                    py: 1.5,
                    minWidth: 180,
                    borderColor: '#1976d2',
                    color: '#1976d2',
                    whiteSpace: 'nowrap',
                    '&:hover': { borderColor: '#41B6E6', color: '#41B6E6' },
                  }}
                >
                  Volver Atrás
                </Button>
                <Button
                  variant="contained"
                  disabled={!tipoCuenta}
                  onClick={() => setPaso(3)}
                  sx={{
                    width: 200,
                    backgroundColor: tipoCuenta ? '#41B6E6' : '#b0c4cc',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: 22,
                    textTransform: 'none',
                    boxShadow: '0 4px 10px 0 rgba(0,0,0,0.10)',
                    height: 56,
                    '&:hover': {
                      backgroundColor: tipoCuenta ? '#2fa4d6' : '#b0c4cc',
                    },
                  }}
                >
                  Continuar
                </Button>
              </Box>
              <Button
                variant="text"
                onClick={() => setPaso(3)}
                sx={{
                  color: '#1976d2',
                  fontWeight: 700,
                  fontSize: 18,
                  mt: 1,
                  letterSpacing: 1,
                }}
              >
                SALTAR ESTE PASO
              </Button>
            </Box>
          </Box>
        )}

        {/* Paso 3: Formulario de datos */}
        {paso === 3 && (
          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            minHeight={350}
          >
            <Typography
              variant="h5"
              sx={{ mb: 10, mt: 4, fontWeight: 700, textAlign: 'center' }}
            >
              {tipoCuenta === 'proveedor'
                ? 'Completa los datos de tu empresa'
                : 'Completa tus datos personales'}
            </Typography>
            <Box
              component="form"
              sx={{
                width: '100%',
                maxWidth: tipoCuenta === 'proveedor' ? 850 : 380,
                display: 'flex',
                flexDirection:
                  tipoCuenta === 'proveedor'
                    ? { xs: 'column', md: 'row' }
                    : 'column',
                gap: { xs: 2, md: 4 },
                justifyContent: 'center',
                alignItems: 'flex-start',
                mb: 4,
              }}
              noValidate
              autoComplete="off"
            >
              {tipoCuenta === 'proveedor' ? (
                <>
                  {/* Formulario empresa */}
                  <Box sx={{ flex: 1, minWidth: 320 }}>
                    {/* <TextField
                      label="Razón Social"
                      variant="outlined"
                      fullWidth
                      sx={{ mb: 2 }}
                      required
                    /> */}
                    <TextField
                      label="Nombre de Empresa"
                      variant="outlined"
                      fullWidth
                      sx={{ mb: 2 }}
                      required
                    />
                    <TextField
                      label="RUT Empresa o Personal"
                      variant="outlined"
                      fullWidth
                      sx={{ mb: 2 }}
                      required
                    />
                    <TextField
                      label="Teléfono de contacto (opcional)"
                      variant="outlined"
                      fullWidth
                      sx={{ mb: 2 }}
                    />
                  </Box>
                  {/* Logo empresa */}
                  <Box
                    sx={{
                      flex: 1,
                      minWidth: 260,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'flex-start',
                      gap: 2,
                    }}
                  >
                    <Typography
                      sx={{ mb: 1, fontWeight: 500, textAlign: 'center' }}
                    >
                      Sube la imagen con el logo de tu empresa
                    </Typography>
                    {/* Contenedor de la imagen */}
                    <Box
                      sx={{
                        width: 180,
                        height: 180,
                        border: '2px dashed #41B6E6',
                        borderRadius: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mb: 1,
                        bgcolor: (theme) =>
                          theme.palette.mode === 'dark' ? '#23272f' : '#f5f5f5',
                        overflow: 'hidden',
                        padding: 2, // Agregamos padding para imágenes pequeñas como imageicon.png
                      }}
                    >
                      <img
                        src={logoEmpresa || '/imageicon.png'}
                        alt="Logo empresa"
                        style={{
                          maxWidth: '100%',
                          maxHeight: '100%',
                          width: 'auto',
                          height: 'auto',
                          objectFit: 'contain',
                        }}
                      />
                    </Box>
                    <Button
                      variant="outlined"
                      component="label"
                      sx={{
                        fontWeight: 700,
                        fontSize: 18,
                        borderColor: '#41B6E6',
                        color: '#1976d2',
                        mb: 1,
                        px: 3,
                        py: 1,
                        '&:hover': { borderColor: '#1976d2', color: '#1976d2' },
                      }}
                    >
                      Cargar Imagen
                      <input
                        type="file"
                        hidden
                        accept="image/*"
                        onChange={handleLogoChange}
                      />
                    </Button>
                    {logoError && (
                      <Typography
                        sx={{
                          color: 'red',
                          fontSize: 14,
                          mb: 1,
                          textAlign: 'center',
                        }}
                      >
                        {logoError}
                      </Typography>
                    )}
                    <Typography
                      sx={{ fontSize: 13, color: '#888', textAlign: 'center' }}
                    >
                      Tamaño máximo del archivo: 300 KB.
                    </Typography>
                  </Box>
                </>
              ) : (
                <>
                  {/* Formulario comprador */}
                  <TextField
                    label="Nombre y Apellido"
                    variant="outlined"
                    fullWidth
                    sx={{ mb: 2 }}
                    required
                  />
                  <TextField
                    label="RUT"
                    variant="outlined"
                    fullWidth
                    sx={{ mb: 2 }}
                    required
                  />
                  <TextField
                    label="Teléfono de contacto (opcional)"
                    variant="outlined"
                    fullWidth
                    sx={{ mb: 2 }}
                  />
                </>
              )}
            </Box>
            {/* Botones centrados */}
            <Box
              display="flex"
              width="100%"
              maxWidth={tipoCuenta === 'proveedor' ? 900 : 400}
              justifyContent="center"
              gap={8}
              mt={8}
            >
              <Button
                variant="outlined"
                onClick={() => setPaso(2)}
                sx={{
                  fontWeight: 700,
                  fontSize: tipoCuenta === 'comprador' ? 18 : 20,
                  px: tipoCuenta === 'comprador' ? 3 : 4,
                  py: tipoCuenta === 'comprador' ? 1.2 : 1.5,
                  borderColor: '#1976d2',
                  color: '#1976d2',
                  '&:hover': { borderColor: '#41B6E6', color: '#41B6E6' },
                }}
              >
                Volver Atrás
              </Button>
              <Button
                variant="contained"
                onClick={() => setPaso(4)}
                sx={{
                  fontWeight: 700,
                  fontSize: tipoCuenta === 'comprador' ? 18 : 20,
                  px: tipoCuenta === 'comprador' ? 3 : 4,
                  py: tipoCuenta === 'comprador' ? 1.2 : 1.5,
                  backgroundColor: '#41B6E6',
                  color: '#fff',
                  '&:hover': { backgroundColor: '#2fa4d6' },
                }}
              >
                Continuar
              </Button>
            </Box>
          </Box>
        )}

        {/* Paso 4: Confirmación de cuenta creada */}
        {paso === 4 && (
          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            minHeight={350}
          >
            <Typography
              variant="h5"
              sx={{ mb: 3, mt: 4, fontWeight: 700, textAlign: 'center' }}
            >
              Hemos enviado un código de verificación al correo:
            </Typography>
            <Typography
              sx={{
                mb: 3,
                textAlign: 'center',
                fontSize: 22,
                fontWeight: 700,
                color: '#0',
              }}
            >
              <strong>{correo}</strong>
            </Typography>
            <Typography sx={{ mb: 3, textAlign: 'center' }}>
              Ingresa el código de verificación que recibiste para activar tu
              cuenta.
            </Typography>
            {/* Timer aquí */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 2,
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  background: timer > 0 ? '#e3f4fd' : '#fde3e3',
                  color: timer > 0 ? '#1976d2' : '#d32f2f',
                  borderRadius: '24px',
                  px: 2,
                  py: 1,
                  fontWeight: 700,
                  fontSize: 18,
                  margin: '0 auto',
                  boxShadow:
                    timer > 0 ? '0 2px 8px #b6e0fa55' : '0 2px 8px #fbbbbb55',
                  gap: 1,
                  minWidth: 170,
                  justifyContent: 'center',
                }}
              >
                <AccessTimeIcon
                  sx={{ fontSize: 22, mr: 1, color: 'inherit' }}
                />
                {timer > 0 ? (
                  <span
                    style={{
                      fontVariantNumeric: 'tabular-nums',
                      letterSpacing: 1,
                    }}
                  >
                    Tiempo restante:&nbsp;
                    {Math.floor(timer / 60)
                      .toString()
                      .padStart(2, '0')}
                    :{(timer % 60).toString().padStart(2, '0')}
                  </span>
                ) : (
                  <>El código ha expirado</>
                )}
              </Box>
            </Box>
            {/* Inputs de código */}
            <Box display="flex" justifyContent="center" mb={2} mt={3}>
              {codigoVerificacion.map((valor, idx) => (
                <TextField
                  key={idx}
                  value={valor}
                  id={`codigo-verif-input-${idx}`}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, '')
                    if (!val && valor === '') return
                    const nuevoCodigo = [...codigoVerificacion]
                    nuevoCodigo[idx] = val
                    setCodigoVerificacion(nuevoCodigo)
                    // Auto-focus al siguiente input si se ingresó un número
                    if (val && idx < 4) {
                      const next = document.getElementById(
                        `codigo-verif-input-${idx + 1}`
                      )
                      if (next) next.focus()
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Backspace') {
                      if (codigoVerificacion[idx] === '') {
                        if (idx > 0) {
                          const nuevoCodigo = [...codigoVerificacion]
                          nuevoCodigo[idx - 1] = ''
                          setCodigoVerificacion(nuevoCodigo)
                          const prev = document.getElementById(
                            `codigo-verif-input-${idx - 1}`
                          )
                          if (prev) prev.focus()
                          e.preventDefault()
                        }
                      }
                    } else if (e.key === 'Delete') {
                      if (codigoVerificacion[idx] !== '') {
                        const nuevoCodigo = [...codigoVerificacion]
                        nuevoCodigo[idx] = ''
                        setCodigoVerificacion(nuevoCodigo)
                        e.preventDefault()
                      } else if (idx < 4) {
                        const nuevoCodigo = [...codigoVerificacion]
                        nuevoCodigo[idx + 1] = ''
                        setCodigoVerificacion(nuevoCodigo)
                        const next = document.getElementById(
                          `codigo-verif-input-${idx + 1}`
                        )
                        if (next) next.focus()
                        e.preventDefault()
                      }
                    } else if (e.key === 'ArrowLeft' && idx > 0) {
                      const prev = document.getElementById(
                        `codigo-verif-input-${idx - 1}`
                      )
                      if (prev) prev.focus()
                      e.preventDefault()
                    } else if (e.key === 'ArrowRight' && idx < 4) {
                      const next = document.getElementById(
                        `codigo-verif-input-${idx + 1}`
                      )
                      if (next) next.focus()
                      e.preventDefault()
                    }
                  }}
                  onPaste={(e) => {
                    const paste = e.clipboardData
                      .getData('Text')
                      .replace(/[^0-9]/g, '')
                    if (paste.length > 0) {
                      const nuevoCodigo = [...codigoVerificacion]
                      for (let i = 0; i < 5; i++) {
                        nuevoCodigo[i] = paste[i] || ''
                      }
                      setCodigoVerificacion(nuevoCodigo)
                      // Foco al último dígito pegado
                      const lastIdx = Math.min(paste.length - 1, 4)
                      setTimeout(() => {
                        const last = document.getElementById(
                          `codigo-verif-input-${lastIdx}`
                        )
                        if (last) last.focus()
                      }, 0)
                      e.preventDefault()
                    }
                  }}
                  inputProps={{
                    maxLength: 1,
                    inputMode: 'numeric',
                    pattern: '[0-9]*',
                    style: {
                      textAlign: 'center',
                      fontSize: 32,
                      color: theme.palette.text.primary,
                      background: 'transparent',
                      height: 56,
                      lineHeight: '56px',
                      padding: 0,
                      margin: 0,
                    },
                  }}
                  sx={{
                    width: 56,
                    height: 56,
                    mx: 1,
                    mt: 2,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '28px',
                      bgcolor: theme.palette.background.default,
                      borderColor:
                        theme.palette.mode === 'dark' ? '#aaa' : '#888',
                      height: 56,
                      padding: 0,
                    },
                    '& input': {
                      textAlign: 'center',
                      fontSize: 32,
                      height: 56,
                      lineHeight: '56px',
                      padding: 0,
                      margin: 0,
                      boxSizing: 'border-box',
                      verticalAlign: 'middle',
                      background: 'transparent',
                    },
                  }}
                  variant="outlined"
                />
              ))}
            </Box>
            <Button
              variant="contained"
              sx={{
                backgroundColor: codigoVerificacion.every((c) => c.length === 1)
                  ? '#41B6E6'
                  : '#b0c4cc',
                color: '#fff',
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 700,
                fontSize: 18,
                width: 260,
                height: 56,
                mb: 6,
                mt: 6,
                boxShadow: 'none',
                '&:hover': {
                  backgroundColor: codigoVerificacion.every(
                    (c) => c.length === 1
                  )
                    ? '#2fa4d6'
                    : '#b0c4cc',
                },
              }}
              disabled={!codigoVerificacion.every((c) => c.length === 1)}
              onClick={() => setPaso(5)}
            >
              Verificar Código
            </Button>
            <Button
              variant="text"
              sx={{ color: '#1976d2', fontWeight: 700, mb: 3, fontSize: 16 }}
              onClick={() => {
                setShowCodigoEnviado(false)
                setTimeout(() => setShowCodigoEnviado(true), 10)
                setCodigoEnviado(true)
                setTimer(300)
                clearInterval(timerRef.current)
                timerRef.current = setInterval(() => {
                  setTimer((prev) => prev - 1)
                }, 1000)
              }}
            >
              Reenviar Código
            </Button>
            {/* Botón Volver atrás */}
            <Button
              variant="text"
              onClick={() => setPaso(3)}
              sx={{
                color: '#888',
                fontWeight: 600,
                fontSize: 16,
                textTransform: 'none',
                '&:hover': { color: '#1976d2', background: 'transparent' },
              }}
            >
              Volver atrás
            </Button>
            {showCodigoEnviado && (
              <Fade in={fadeIn} timeout={800} unmountOnExit>
                <Typography
                  sx={{
                    color: '#41B6E6',
                    fontWeight: 500,
                    mt: 2,
                    transition: 'opacity 0.8s',
                    opacity: fadeIn ? 1 : 0,
                  }}
                >
                  El código ha sido reenviado a tu correo.
                </Typography>
              </Fade>
            )}
          </Box>
        )}

        {/* Paso 5: Cuenta creada con éxito */}
        {paso === 5 && (
          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            minHeight={350}
          >
            <Typography
              variant="h5"
              sx={{ mt: 15, fontWeight: 700, textAlign: 'center' }}
            >
              ¡Tu cuenta ha sido creada con éxito!
            </Typography>
            <Typography
              sx={{ mt: 2, textAlign: 'center', fontSize: 18, color: '#555' }}
            >
              Ahora puedes disfrutar de todos los beneficios de ser parte de
              SELLSI.
            </Typography>
            <Button
              variant="contained"
              onClick={onClose}
              sx={{
                backgroundColor: '#41B6E6',
                color: '#fff',
                fontWeight: 700,
                fontSize: 20,
                px: 4,
                py: 1.5,
                width: 300,
                mb: 24,
                mt: 10,
                '&:hover': { backgroundColor: '#2fa4d6' },
              }}
            >
              Regresar al marketplace
            </Button>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  )
}
