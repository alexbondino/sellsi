import React from 'react'
import { Box, Typography } from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CancelIcon from '@mui/icons-material/Cancel'

const PasswordRequirements = ({ password, size = 'normal' }) => {
  const isSmall = size === 'small'

  const requisitos = [
    { label: 'Al menos 8 caracteres', valid: password.length >= 8 },
    { label: 'Letras minúsculas (a-z)', valid: /[a-z]/.test(password) },
    { label: 'Letras mayúsculas (A-Z)', valid: /[A-Z]/.test(password) },
    { label: 'Números (0-9)', valid: /\d/.test(password) },
  ]

  return (
    <Box sx={{ mb: isSmall ? 1 : 2 }}>
      <Typography
        variant={isSmall ? 'caption' : 'body2'}
        sx={{
          mb: 0.5,
          color: '#666',
          fontSize: isSmall ? 11 : 13,
        }}
      >
        La contraseña debe cumplir:
      </Typography>

      {requisitos.map((req, index) => (
        <Box key={index} display="flex" alignItems="center" sx={{ mb: 0.2 }}>
          {req.valid ? (
            <CheckCircleIcon
              sx={{
                fontSize: isSmall ? 14 : 16,
                color: '#4caf50',
                mr: 0.5,
              }}
            />
          ) : (
            <CancelIcon
              sx={{
                fontSize: isSmall ? 14 : 16,
                color: '#f44336',
                mr: 0.5,
              }}
            />
          )}
          <Typography
            variant={isSmall ? 'caption' : 'body2'}
            sx={{
              color: req.valid ? '#4caf50' : '#f44336',
              fontSize: isSmall ? 10 : 12,
            }}
          >
            {req.label}
          </Typography>
        </Box>
      ))}
    </Box>
  )
}

export default PasswordRequirements
