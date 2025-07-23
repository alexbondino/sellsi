import React from 'react'
import { Box, Typography, Divider, CircularProgress } from '@mui/material'

const PriceBreakdown = ({
  subtotal,
  discount,
  shippingCost,
  total,
  formatPrice,
  cartStats,
  isCalculatingShipping = false,
}) => {
  return (
    <>
      {/* Desglose de precios */}
      <Box sx={{ mb: 3 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            mb: 1,
          }}
        >
          <Typography variant="body2">
            Subtotal ({cartStats.totalQuantity} productos):
          </Typography>
          <Typography variant="body2" fontWeight="medium">
            {formatPrice(subtotal)}
          </Typography>
        </Box>

        {discount > 0 && (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              mb: 1,
            }}
          >
            <Typography variant="body2" color="success.main">
              Descuentos aplicados:
            </Typography>
            <Typography variant="body2" color="success.main" fontWeight="bold">
              -{formatPrice(discount)}
            </Typography>
          </Box>
        )}

        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            mb: 1,
          }}
        >
          <Typography variant="body2">Envío:</Typography>
          {isCalculatingShipping ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={16} />
              <Typography variant="body2" color="text.secondary">
                Calculando envío...
              </Typography>
            </Box>
          ) : (
            <Typography
              variant="body2"
              fontWeight="medium"
              color={shippingCost === 0 ? 'success.main' : 'text.primary'}
            >
              {shippingCost === 0 ? '¡GRATIS!' : formatPrice(shippingCost)}
            </Typography>
          )}
        </Box>
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* Total */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          mb: 3,
        }}
      >
        <Typography variant="h5" fontWeight="bold" sx={{ mr: 2 }}>
          Total:
        </Typography>
        <Typography
          variant="h5"
          fontWeight="bold"
          sx={{
            background: '#1565c0',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          {formatPrice(total)}
        </Typography>
      </Box>
    </>
  )
}

export default PriceBreakdown
