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
import { PasswordRequirements, CustomButton } from '../../hooks/shared'

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
      {' '}
      <Box
        component="img"
        src="/logo.svg"
        alt="SELLSI Logo"
        sx={{
          // xs: 20% más pequeño = 128px, sm: 5% más pequeño = 152px
          width: { xs: 100, sm: 140, md: 110, lg: 160 },
          // xs: 50% menos mb = 4px, sm: 20% menos mb = 6.4px
          mb: { xs: 0, sm: 0, md: 0, lg: 1.2 },
        }}
      />
      <Typography
        variant="h6"
        align="center"
        sx={{
          mb: { xs: 1, sm: 2, md: 2, lg: 4 },
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
          sx={{ mb: { xs: 1, sm: 1, md: 1, lg: 1.5 } }}
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
          sx={{ mb: { xs: 1, sm: 1, md: 1, lg: 1.5 } }}
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
          sx={{ mb: { xs: 1, sm: 1, md: 1, lg: 1.5 } }}
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
            <Box
              component="span"
              sx={{ fontSize: { xs: 12, sm: 12, md: 12, lg: 15 } }}
            >
              Acepto los{' '}
              <Link href="#" sx={{ color: '#1976d2', fontWeight: 700 }}>
                Términos y Condiciones
              </Link>{' '}
              y la{' '}
              <Link href="#" sx={{ color: '#1976d2', fontWeight: 700 }}>
                Política de Privacidad
              </Link>
            </Box>
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
            <Box
              component="span"
              sx={{ fontSize: { xs: 12, sm: 12, md: 12, lg: 15 } }}
            >
              {' '}
              {/* ✅ CAMBIAR de 13 a 15 */}
              Acepto recibir avisos de ofertas y novedades de Sellsi.
            </Box>
          }
          sx={{
            mb: { xs: 1, sm: 5.3, md: 1, lg: 1.5 },
            alignItems: 'flex-start', // ✅ ALINEAR checkbox al inicio
            '& .MuiFormControlLabel-label': {
              lineHeight: 1.4,
            },
          }}
        />{' '}
        <CustomButton
          type="submit"
          disabled={!canSubmit}
          fullWidth
          sx={{
            mb: 0.5,
            height: { md: '32px', lg: '44px' }, // 5% menos altura para md (40px -> 38px)
          }}
        >
          Crear cuenta
        </CustomButton>
        <CustomButton
          variant="text"
          onClick={onCancel}
          fullWidth
          sx={{
            mt: 0.5,
            height: { md: '32px', lg: '44px' }, // 5% menos altura para md (40px -> 38px)
          }}
        >
          Volver atrás
        </CustomButton>
      </form>
    </Box>
  )
}

export default Step1Account
