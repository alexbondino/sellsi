import React from 'react'
import { Paper, Typography, Box } from '@mui/material'
import { Calculate as CalculateIcon } from '@mui/icons-material'

/**
 * Componente para mostrar un resumen de ahorros del usuario
 * @param {Object} props
 * @param {number} props.subtotal - Subtotal del carrito
 * @param {number} props.discount - Descuento aplicado
 * @param {number} props.total - Total final
 * @param {function} props.formatPrice - Función para formatear precios
 */
const SavingsCalculator = ({ subtotal, discount, total, formatPrice }) => {
  return (
    <Paper sx={{ p: 2, borderRadius: 2 }}>
      <Typography
        variant="h6"
        sx={{ mb: 2, display: 'flex', alignItems: 'center' }}
      >
        <CalculateIcon sx={{ mr: 1, color: 'warning.main' }} />
        Resumen de Ahorros
      </Typography>

      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          mb: 1,
        }}
      >
        <Typography variant="body2">Precio original:</Typography>
        <Typography variant="body2">
          {formatPrice(subtotal + discount)}
        </Typography>
      </Box>

      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          mb: 1,
        }}
      >
        <Typography variant="body2" color="error.main">
          Ahorras:
        </Typography>
        <Typography variant="body2" color="error.main" fontWeight="bold">
          {formatPrice(discount)}
        </Typography>
      </Box>

      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <Typography variant="body2" fontWeight="bold">
          Precio final:
        </Typography>
        <Typography variant="body2" fontWeight="bold" color="success.main">
          {formatPrice(total)}
        </Typography>
      </Box>
    </Paper>
  )
}

export default SavingsCalculator
