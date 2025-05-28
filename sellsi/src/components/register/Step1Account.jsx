import React from 'react'
import {
  Box,
  TextField,
  Typography,
  Checkbox,
  FormControlLabel,
  Link,
  InputAdornment,
  IconButton,
} from '@mui/material'
import { Visibility, VisibilityOff } from '@mui/icons-material'
import { useTheme } from '@mui/material/styles'
import { PasswordRequirements, CustomButton } from '../shared'

const Step1Account = ({
  formData,
  onFieldChange,
  onNext,
  onCancel,
  showPassword,
  showRepeatPassword,
  onTogglePasswordVisibility,
  onToggleRepeatPasswordVisibility,
}) => {
  const theme = useTheme()
  const {
    correo,
    contrasena,
    confirmarContrasena,
    aceptaTerminos,
    aceptaComunicaciones,
  } = formData

  // Validaciones
  const correoValido = /^[^@]+@[^@]+\.[^@]+$/.test(correo)
  const contrasenasCoinciden =
    contrasena === confirmarContrasena && confirmarContrasena.length > 0

  const requisitos = [
    { label: 'Al menos 8 caracteres', valid: contrasena.length >= 8 },
    { label: 'Letras minúsculas (a-z)', valid: /[a-z]/.test(contrasena) },
    { label: 'Letras mayúsculas (A-Z)', valid: /[A-Z]/.test(contrasena) },
    { label: 'Números (0-9)', valid: /\d/.test(contrasena) },
  ]
  const cumpleMinimos = requisitos.filter((r) => r.valid).length >= 4

  const canSubmit =
    cumpleMinimos && aceptaTerminos && correoValido && contrasenasCoinciden

  const handleSubmit = (e) => {
    e.preventDefault()
    if (canSubmit) onNext()
  }

  return (
    <Box
      sx={{
        maxWidth: 520,
        width: '100%',
        mx: 'auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        mb: 1,
        mt: 0,
      }}
    >
      <img
        src="/logo.svg"
        alt="SELLSI Logo"
        style={{ width: 160, marginBottom: 8 }}
      />
      <Typography
        variant="h6"
        align="center"
        sx={{
          mb: 4,
          color: theme.palette.mode === 'dark' ? '#fff' : '#222',
          fontWeight: 700,
          fontSize: 18,
          fontStyle: 'italic',
        }}
      >
        Conecta. Vende. Crece.
      </Typography>

      <form onSubmit={handleSubmit} style={{ width: '100%' }}>
        <TextField
          label="Correo electrónico"
          variant="outlined"
          fullWidth
          value={correo}
          onChange={(e) => onFieldChange('correo', e.target.value)}
          sx={{ mb: 1.5 }}
          size="small"
          error={correo.length > 0 && !correoValido}
          helperText={
            correo.length > 0 && !correoValido
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
          onChange={(e) => onFieldChange('contrasena', e.target.value)}
          sx={{ mb: 1.5 }}
          size="small"
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  onClick={onTogglePasswordVisibility}
                  edge="end"
                  size="small"
                  tabIndex={-1}
                >
                  {showPassword ? <Visibility /> : <VisibilityOff />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        <TextField
          label="Repita su Contraseña"
          type={showRepeatPassword ? 'text' : 'password'}
          variant="outlined"
          fullWidth
          value={confirmarContrasena}
          onChange={(e) => onFieldChange('confirmarContrasena', e.target.value)}
          sx={{ mb: 1.5 }}
          size="small"
          error={confirmarContrasena.length > 0 && !contrasenasCoinciden}
          helperText={
            confirmarContrasena.length > 0 && !contrasenasCoinciden
              ? 'Las contraseñas no coinciden'
              : ''
          }
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  onClick={onToggleRepeatPasswordVisibility}
                  edge="end"
                  size="small"
                  tabIndex={-1}
                >
                  {showRepeatPassword ? <Visibility /> : <VisibilityOff />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        <PasswordRequirements password={contrasena} size="normal" />

        <FormControlLabel
          control={
            <Checkbox
              checked={aceptaTerminos}
              onChange={(e) =>
                onFieldChange('aceptaTerminos', e.target.checked)
              }
              sx={{ color: '#41B6E6' }}
              size="normal"
            />
          }
          label={
            <span style={{ fontSize: 15 }}>
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
          sx={{
            mb: 0.5,
            alignItems: 'flex-start', // ✅ ALINEAR checkbox al inicio
            '& .MuiFormControlLabel-label': {
              lineHeight: 1.4,
            },
          }}
        />

        <FormControlLabel
          control={
            <Checkbox
              checked={aceptaComunicaciones}
              onChange={(e) =>
                onFieldChange('aceptaComunicaciones', e.target.checked)
              }
              sx={{ color: '#41B6E6' }}
              size="normal"
            />
          }
          label={
            <span style={{ fontSize: 15 }}>
              {' '}
              {/* ✅ CAMBIAR de 13 a 15 */}
              Acepto recibir avisos de ofertas y novedades de Sellsi.
            </span>
          }
          sx={{
            mb: 1.5,
            alignItems: 'flex-start', // ✅ ALINEAR checkbox al inicio
            '& .MuiFormControlLabel-label': {
              lineHeight: 1.4,
            },
          }}
        />

        <CustomButton
          type="submit"
          disabled={!canSubmit}
          fullWidth
          sx={{ mb: 0.5 }}
        >
          Crear cuenta
        </CustomButton>

        <CustomButton
          variant="text"
          onClick={onCancel}
          fullWidth
          sx={{ mt: 0.5 }}
        >
          Volver atrás
        </CustomButton>
      </form>
    </Box>
  )
}

export default Step1Account
