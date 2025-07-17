import React, { useState, useEffect } from 'react'
import { Box, TextField, Typography, Button } from '@mui/material'

const Step1Email = ({
  correo,
  setCorreo,
  error,
  mensaje,
  onSubmit,
  onCancel,
}) => {
  const [localError, setLocalError] = useState('')
  const [touched, setTouched] = useState(false)

  // Validación mejorada de correo electrónico (misma que en el hook)
  const validarCorreo = (email) => {
    const regexCompleto =
      /^[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+)*@[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?)*$/

    if (!email) return false
    if (email.length > 254) return false
    if (email.includes('..')) return false
    if (email.startsWith('.') || email.endsWith('.')) return false
    if (email.includes('@.') || email.includes('.@')) return false

    const parts = email.split('@')
    if (parts.length !== 2) return false

    const [localPart, domain] = parts

    if (localPart.length === 0 || localPart.length > 64) return false
    if (domain.length === 0 || domain.length > 253) return false
    if (domain.includes('..')) return false
    if (!domain.includes('.')) return false

    const domainParts = domain.split('.')
    if (domainParts.length < 2) return false
    const lastPart = domainParts[domainParts.length - 1]
    if (lastPart.length < 2) return false

    return regexCompleto.test(email)
  } // Validación en tiempo real
  useEffect(() => {
    if (touched && correo) {
      if (!validarCorreo(correo)) {
        setLocalError('') // No mostrar mensaje de correo inválido
      } else {
        setLocalError('')
      }
    } else if (touched && !correo) {
      setLocalError('Por favor, rellena este campo.')
    } else {
      setLocalError('')
    }
  }, [correo, touched])

  const handleEmailChange = (e) => {
    setCorreo(e.target.value)
    if (!touched) setTouched(true)
  }

  const handleBlur = () => {
    setTouched(true)
  }

  // Usar el error del hook si existe, sino usar el error local
  const displayError = error || localError
  return (
    <Box sx={{ textAlign: 'center', pt: 2 }}>
      <Typography variant="h6" sx={{ mb: 3, fontWeight: 700, fontSize: 20 }}>
        Recuperar Contraseña
      </Typography>

      <Typography variant="body2" sx={{ mb: 3, color: '#666', fontSize: 14 }}>
        Ingresa tu correo electrónico y te enviaremos un código de verificación.
      </Typography>

      <form onSubmit={onSubmit}>
        {' '}
        <TextField
          fullWidth
          size="small"
          label="Correo electrónico"
          variant="outlined"
          value={correo}
          onChange={handleEmailChange}
          onBlur={handleBlur}
          error={!!displayError}
          helperText={displayError}
          sx={{ mb: 2 }}
        />
        {/* ✅ QUITAR mensaje de confirmación verde */}
        {/* ✅ BOTONES ESTILO STEP1ACCOUNT */}{' '}
        <Button
          type="submit"
          variant="contained"
          color="primary"
          disabled={!correo || !validarCorreo(correo)}
          sx={{
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 700,
            fontSize: 16,
            width: '100%',
            height: 42,
            boxShadow: 'none',
            mb: 0.5,
          }}
        >
          Enviar Código
        </Button>
        <Button
          variant="text"
          color="primary"
          onClick={onCancel}
          sx={{
            fontWeight: 700,
            fontSize: 14,
            width: '100%',
            mt: 0.5,
          }}
        >
          Volver
        </Button>
      </form>
    </Box>
  )
}

export default Step1Email
