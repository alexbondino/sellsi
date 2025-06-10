import React from 'react'
import { Box, Typography } from '@mui/material'

const PriceDisplay = ({
  price,
  minPrice = null,
  originalPrice = null,
  showRange = false,
  currency = 'CLP',
  variant = 'h2',
  color = '#000000',
  sx = {},
}) => {
  // Formato de precio chileno
  const formatPrice = (amount) => {
    return `$${Math.round(amount).toLocaleString('es-CL')}`
  }

  // Calcular precio mínimo si no se proporciona
  const calculatedMinPrice =
    minPrice || (showRange ? Math.round(price * 0.6) : null)

  // Determinar si hay descuento
  const hasDiscount = originalPrice && originalPrice > price

  return (
    <Box sx={sx}>
      {showRange && calculatedMinPrice ? (
        // Mostrar rango de precios
        <Typography
          variant={variant}
          sx={{
            fontWeight: 700,
            color: color,
            mb: 1,
          }}
        >
          {formatPrice(calculatedMinPrice)} - {formatPrice(price)}
        </Typography>
      ) : (
        // Mostrar precio único
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            flexWrap: 'wrap',
          }}
        >
          <Typography
            variant={variant}
            sx={{
              fontWeight: 700,
              color: hasDiscount ? 'success.main' : color,
            }}
          >
            {formatPrice(price)}
          </Typography>

          {hasDiscount && (
            <Typography
              variant="body2"
              sx={{
                textDecoration: 'line-through',
                color: 'text.disabled',
                fontWeight: 500,
              }}
            >
              {formatPrice(originalPrice)}
            </Typography>
          )}
        </Box>
      )}
    </Box>
  )
}

export default PriceDisplay
