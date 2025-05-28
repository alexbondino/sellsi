import React from 'react'
import { Box, TextField, Typography, Button } from '@mui/material'

const Step1Email = ({
  correo,
  setCorreo,
  error,
  mensaje,
  onSubmit,
  onCancel,
}) => {
  return (
    <Box sx={{ textAlign: 'center', pt: 2 }}>
      <Typography variant="h6" sx={{ mb: 3, fontWeight: 700, fontSize: 20 }}>
        Recuperar Contraseña
      </Typography>

      <Typography variant="body2" sx={{ mb: 3, color: '#666', fontSize: 14 }}>
        Ingresa tu correo electrónico y te enviaremos un código de verificación.
      </Typography>

      <form onSubmit={onSubmit}>
        <TextField
          fullWidth
          size="small"
          label="Correo electrónico"
          variant="outlined"
          value={correo}
          onChange={(e) => setCorreo(e.target.value)}
          error={!!error}
          helperText={error}
          sx={{ mb: 2 }}
        />

        {mensaje && (
          <Typography
            variant="body2"
            sx={{ mb: 2, color: 'green', fontSize: 13 }}
          >
            {mensaje}
          </Typography>
        )}

        {/* ✅ BOTONES ESTILO STEP1ACCOUNT */}
        <Button
          type="submit"
          variant="contained"
          disabled={!correo || !!error}
          sx={{
            backgroundColor: !correo || !!error ? '#b0c4cc' : '#41B6E6',
            color: '#fff',
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 700,
            fontSize: 16,
            width: '100%',
            height: 42,
            boxShadow: 'none',
            mb: 0.5,
            '&:hover': {
              backgroundColor: !correo || !!error ? '#b0c4cc' : '#2fa4d6',
            },
          }}
        >
          Enviar Código
        </Button>

        <Button
          variant="text"
          onClick={onCancel}
          sx={{
            color: '#1976d2',
            fontWeight: 700,
            fontSize: 14,
            width: '100%',
            mt: 0.5,
          }}
        >
          Volver atrás
        </Button>
      </form>
    </Box>
  )
}

export default Step1Email
