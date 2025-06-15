import React from 'react'
import { Box, Typography, Paper, CircularProgress } from '@mui/material'

/**
 * Componente reutilizable de overlay de carga para Sellsi
 * Props:
 * - message: string (opcional)
 * - height: string|number (opcional, default: '100%')
 * - paperProps: object (opcional, para customizar el Paper)
 */
const LoadingOverlay = ({
  message = 'Cargando...',
  height = '100%',
  paperProps = {},
}) => (
  <Paper
    sx={{
      p: 6,
      textAlign: 'center',
      bgcolor: '#fff',
      borderRadius: 3,
      border: '1px solid #e2e8f0',
      minHeight: height,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}
    {...paperProps}
  >
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
      }}
    >
      <CircularProgress color="primary" size={48} />
      <Typography variant="h6" color="text.secondary" sx={{ mt: 2 }}>
        {message}
      </Typography>
    </Box>
  </Paper>
)

export default LoadingOverlay
