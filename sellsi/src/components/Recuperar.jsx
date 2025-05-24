import React, {
  useImperativeHandle,
  forwardRef,
  useRef,
  useState,
  useEffect,
} from 'react'
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  InputAdornment,
  IconButton,
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import { Visibility, VisibilityOff } from '@mui/icons-material'
import Fade from '@mui/material/Fade'

const Recuperar = forwardRef(function Recuperar(props, ref) {
  const theme = useTheme()
  const [correo, setCorreo] = useState('')
  const [error, setError] = useState('')
  const [codigo, setCodigo] = useState(['', '', '', '', ''])
  const [mensaje, setMensaje] = useState('')
  const [timer, setTimer] = useState(300)
  const timerRef = useRef()

  // Control de pasos: 'correo', 'codigo', 'restablecer', 'exito'
  const [paso, setPaso] = useState('correo')

  // Restablecer contraseña
  const [nuevaContrasena, setNuevaContrasena] = useState('')
  const [repiteContrasena, setRepiteContrasena] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showRepeatPassword, setShowRepeatPassword] = useState(false)
  const [cambioExitoso, setCambioExitoso] = useState(false)

  // Mensaje reenviado
  const [showCodigoEnviado, setShowCodigoEnviado] = useState(false)
  const [fadeIn, setFadeIn] = useState(false)
  const fadeTimeout = useRef()

  // Validaciones de contraseña
  const requisitos = [
    { label: 'Al menos 8 caracteres', valid: nuevaContrasena.length >= 8 },
    { label: 'Letras minúsculas (a-z)', valid: /[a-z]/.test(nuevaContrasena) },
    { label: 'Letras mayúsculas (A-Z)', valid: /[A-Z]/.test(nuevaContrasena) },
    { label: 'Números (0-9)', valid: /\d/.test(nuevaContrasena) },
  ]
  const requisitosValidos = requisitos.filter((r) => r.valid).length
  const cumpleMinimos = requisitosValidos >= 4
  const contrasenasCoinciden =
    nuevaContrasena === repiteContrasena && repiteContrasena.length > 0

  // Timer para código
  useEffect(() => {
    if (paso === 'codigo') {
      setTimer(300)
      setCodigo(['', '', '', '', ''])
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

  // Fade para mensaje reenviado
  useEffect(() => {
    if (showCodigoEnviado) {
      setFadeIn(true)
      fadeTimeout.current = setTimeout(() => {
        setFadeIn(false)
        setTimeout(() => setShowCodigoEnviado(false), 400)
      }, 15000)
    }
    return () => clearTimeout(fadeTimeout.current)
  }, [showCodigoEnviado])

  // Reset total de todos los estados
  const resetAllStates = () => {
    setCorreo('')
    setError('')
    setCodigo(['', '', '', '', ''])
    setMensaje('')
    setTimer(300)
    setPaso('correo')
    setNuevaContrasena('')
    setRepiteContrasena('')
    setShowPassword(false)
    setShowRepeatPassword(false)
    setCambioExitoso(false)
    setShowCodigoEnviado(false)
    setFadeIn(false)
    clearInterval(timerRef.current)
  }

  useImperativeHandle(ref, () => resetAllStates)

  // Validación simple de correo
  const correoValido = /^[^@]+@[^@]+\.[^@]+$/

  // Handlers de pasos
  const handleBuscar = (e) => {
    e.preventDefault()
    if (!correo) {
      setError('Por favor, rellena este campo.')
      return
    }
    if (!correoValido.test(correo)) {
      setError('Correo inválido. Ejemplo: usuario@dominio.com')
      return
    }
    setError('')
    setMensaje('Revisa el código que fue enviado a tu correo.')
    setPaso('codigo')
  }

  const handleCodigoChange = (idx, value) => {
    if (!/^[0-9]?$/.test(value)) return
    const nuevoCodigo = [...codigo]
    nuevoCodigo[idx] = value
    setCodigo(nuevoCodigo)
    if (value && idx < 4) {
      const next = document.getElementById(`codigo-input-${idx + 1}`)
      if (next) next.focus()
    }
  }

  const codigoCompleto = codigo.every((c) => c.length === 1)

  const handleVerificarCodigo = () => {
    // Aquí deberías verificar el código con backend
    setPaso('restablecer')
  }

  const handleCambiarContrasena = () => {
    setCambioExitoso(true)
    setPaso('exito')
  }

  const handleCerrarTotal = () => {
    props.onClose()
  }

  // Render según el paso
  return (
    <Box sx={{ overflow: 'hidden', display: 'flex', justifyContent: 'center' }}>
      <Paper
        elevation={3}
        sx={{
          p: 4,
          width: 400,
          maxWidth: '98%',
          position: 'relative',
          bgcolor: theme.palette.background.paper,
          overflow: 'hidden',
        }}
      >
        {/* Botón cerrar */}
        {paso !== 'exito' && (
          <Button
            onClick={handleCerrarTotal}
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
        )}

        {/* Paso 1: Correo */}
        {paso === 'correo' && (
          <>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
              Recupera tu cuenta
            </Typography>
            <Typography sx={{ mb: 2 }}>
              Ingresa tu correo electrónico y te enviaremos un código de
              recuperación.
            </Typography>
            {mensaje && (
              <Typography sx={{ mb: 2, color: '#41B6E6', fontWeight: 500 }}>
                {mensaje}
              </Typography>
            )}
            <form onSubmit={handleBuscar}>
              <TextField
                label="Correo electrónico"
                variant="outlined"
                fullWidth
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                sx={{ mb: 3 }}
                InputProps={{
                  sx: {
                    height: 48,
                    fontSize: 18,
                    px: 1.5,
                  },
                }}
                inputProps={{
                  lang: 'es',
                  style: { height: 30 },
                }}
                error={!!error}
                helperText={error}
              />
              <Box display="flex" justifyContent="space-between" gap={2} mt={2}>
                <Button
                  variant="contained"
                  onClick={handleCerrarTotal}
                  sx={{
                    backgroundColor: '#e4e6eb',
                    color: '#757575',
                    borderRadius: 8,
                    textTransform: 'none',
                    fontWeight: 700,
                    fontSize: 20,
                    width: 160,
                    height: 56,
                    boxShadow: 'none',
                    '&:hover': { backgroundColor: '#d8dadf' },
                  }}
                >
                  Volver atras
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  sx={{
                    backgroundColor: '#41B6E6',
                    color: '#fff',
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 400,
                    px: 2,
                    fontSize: 18,
                    boxShadow: 'none',
                    width: '50%',
                    height: 55,
                    '&:hover': { backgroundColor: '#2fa4d6' },
                  }}
                >
                  Enviar Código
                </Button>
              </Box>
            </form>
          </>
        )}

        {/* Paso 2: Código */}
        {paso === 'codigo' && (
          <Box display="flex" flexDirection="column" alignItems="center">
            <img
              src="/candado.png"
              alt="candado"
              style={{ width: 90, marginBottom: 16 }}
            />
            <Typography align="center" sx={{ mb: 2, mt: 1 }}>
              Hemos enviado un código de verificación al correo:{' '}
              <strong>{correo}</strong>.<br />
              Introduce el código en las casillas inferiores.
            </Typography>
            <Box display="flex" justifyContent="center" mb={2}>
              {codigo.map((valor, idx) => (
                <TextField
                  key={idx}
                  id={`codigo-input-${idx}`}
                  value={valor}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, '')
                    if (!val && valor === '') return
                    const nuevoCodigo = [...codigo]
                    nuevoCodigo[idx] = val
                    setCodigo(nuevoCodigo)
                    // Auto-focus al siguiente input si se ingresó un número
                    if (val && idx < 4) {
                      const next = document.getElementById(
                        `codigo-input-${idx + 1}`
                      )
                      if (next) next.focus()
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Backspace') {
                      if (codigo[idx] === '') {
                        if (idx > 0) {
                          const nuevoCodigo = [...codigo]
                          nuevoCodigo[idx - 1] = ''
                          setCodigo(nuevoCodigo)
                          const prev = document.getElementById(
                            `codigo-input-${idx - 1}`
                          )
                          if (prev) prev.focus()
                          e.preventDefault()
                        }
                      }
                    } else if (e.key === 'Delete') {
                      if (codigo[idx] !== '') {
                        const nuevoCodigo = [...codigo]
                        nuevoCodigo[idx] = ''
                        setCodigo(nuevoCodigo)
                        e.preventDefault()
                      } else if (idx < 4) {
                        const nuevoCodigo = [...codigo]
                        nuevoCodigo[idx + 1] = ''
                        setCodigo(nuevoCodigo)
                        const next = document.getElementById(
                          `codigo-input-${idx + 1}`
                        )
                        if (next) next.focus()
                        e.preventDefault()
                      }
                    } else if (e.key === 'ArrowLeft' && idx > 0) {
                      const prev = document.getElementById(
                        `codigo-input-${idx - 1}`
                      )
                      if (prev) prev.focus()
                      e.preventDefault()
                    } else if (e.key === 'ArrowRight' && idx < 4) {
                      const next = document.getElementById(
                        `codigo-input-${idx + 1}`
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
                      const nuevoCodigo = [...codigo]
                      for (let i = 0; i < 5; i++) {
                        nuevoCodigo[i] = paste[i] || ''
                      }
                      setCodigo(nuevoCodigo)
                      // Foco al último dígito pegado
                      const lastIdx = Math.min(paste.length - 1, 4)
                      setTimeout(() => {
                        const last = document.getElementById(
                          `codigo-input-${lastIdx}`
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
                      padding: 0,
                      color: theme.palette.text.primary,
                      background: 'transparent',
                    },
                  }}
                  sx={{
                    width: 56,
                    height: 56,
                    mx: 1,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '28px',
                      bgcolor: theme.palette.background.default,
                      borderColor:
                        theme.palette.mode === 'dark' ? '#aaa' : '#888',
                    },
                  }}
                  variant="outlined"
                />
              ))}
            </Box>
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
                  <>
                    Tiempo restante:&nbsp;
                    <span
                      style={{
                        fontVariantNumeric: 'tabular-nums',
                        letterSpacing: 1,
                      }}
                    >
                      {Math.floor(timer / 60)
                        .toString()
                        .padStart(2, '0')}
                      :{(timer % 60).toString().padStart(2, '0')}
                    </span>
                  </>
                ) : (
                  <>El código ha expirado</>
                )}
              </Box>
            </Box>
            <Button
              variant="contained"
              disabled={!codigoCompleto}
              sx={{
                backgroundColor: codigoCompleto ? '#41B6E6' : '#b0c4cc',
                color: '#fff',
                borderRadius: 8,
                textTransform: 'none',
                fontWeight: 700,
                fontSize: 20,
                width: 260,
                height: 56,
                mb: 2,
                boxShadow: 'none',
                '&:hover': {
                  backgroundColor: codigoCompleto ? '#2fa4d6' : '#b0c4cc',
                },
              }}
              onClick={handleVerificarCodigo}
            >
              Verificar Código
            </Button>
            <Typography variant="body2" sx={{ mb: 1 }}>
              ¿No has recibido el codigo?
            </Typography>
            <Button
              variant="text"
              sx={{ color: '#1976d2', fontWeight: 700, mb: 2, fontSize: 16 }}
              onClick={() => {
                setShowCodigoEnviado(false)
                setTimeout(() => setShowCodigoEnviado(true), 10)
                setTimer(300)
                setMensaje('El código fue reenviado a tu correo.')
              }}
            >
              Reenviar Código
            </Button>
            <Button
              variant="contained"
              onClick={() => setPaso('correo')}
              sx={{
                backgroundColor: '#e4e6eb',
                color: '#757575',
                borderRadius: 8,
                textTransform: 'none',
                fontWeight: 700,
                fontSize: 20,
                width: 160,
                height: 56,
                boxShadow: 'none',
                '&:hover': { backgroundColor: '#d8dadf' },
              }}
            >
              Volver atras
            </Button>
            {showCodigoEnviado && (
              <Fade in={fadeIn} timeout={800} unmountOnExit>
                <Typography
                  sx={{
                    color: '#41B6E6',
                    fontWeight: 500,
                    mb: 2,
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

        {/* Paso 3: Restablecer */}
        {paso === 'restablecer' && (
          <Box display="flex" flexDirection="column" alignItems="center">
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
              Restablecer contraseña
            </Typography>
            <Typography sx={{ mb: 2 }}>
              Ingrese su nueva contraseña y confírmela.
            </Typography>
            <TextField
              label="Ingrese su nueva contraseña"
              type={showPassword ? 'text' : 'password'}
              variant="outlined"
              fullWidth
              value={nuevaContrasena}
              onChange={(e) => setNuevaContrasena(e.target.value)}
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
              }}
            />
            <TextField
              label="Confirme su contraseña nueva"
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
                      {showRepeatPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
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
            <Button
              variant="contained"
              fullWidth
              sx={{
                backgroundColor:
                  cumpleMinimos && contrasenasCoinciden ? '#41B6E6' : '#b0c4cc',
                color: '#fff',
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 700,
                fontSize: 18,
                height: 48,
                mb: 2,
                '&:hover': {
                  backgroundColor:
                    cumpleMinimos && contrasenasCoinciden
                      ? '#2fa4d6'
                      : '#b0c4cc',
                },
              }}
              disabled={!cumpleMinimos || !contrasenasCoinciden}
              onClick={handleCambiarContrasena}
            >
              Cambiar contraseña
            </Button>
          </Box>
        )}

        {/* Paso 4: Éxito */}
        {paso === 'exito' && (
          <Box display="flex" flexDirection="column" alignItems="center">
            <Typography
              variant="h5"
              sx={{ mt: 2, fontWeight: 700, textAlign: 'center' }}
            >
              ¡Su contraseña ha sido cambiada con éxito!
            </Typography>
            <Button
              variant="contained"
              onClick={props.onVolverLogin}
              sx={{
                backgroundColor: '#41B6E6',
                color: '#fff',
                fontWeight: 700,
                fontSize: 20,
                px: 4,
                py: 1,
                width: 300,
                mb: 4,
                mt: 5,
                '&:hover': { backgroundColor: '#2fa4d6' },
              }}
            >
              Iniciar Sesión
            </Button>
          </Box>
        )}
      </Paper>
    </Box>
  )
})

export default Recuperar
