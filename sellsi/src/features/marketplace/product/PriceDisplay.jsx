import React from 'react'
import { Box, Typography, Chip, Stack } from '@mui/material'
import {
  LocalOffer as OfferIcon,
  TrendingDown as DiscountIcon,
} from '@mui/icons-material'

/**
 * Componente compartido para mostrar precios con descuentos
 * @param {Object} props
 * @param {number} props.price - Precio actual
 * @param {number} props.originalPrice - Precio original (opcional)
 * @param {number} props.discount - Porcentaje de descuento (opcional)
 * @param {function} props.formatPrice - Función para formatear precios
 * @param {string} props.size - Tamaño del display ('small', 'medium', 'large')
 * @param {boolean} props.showDiscount - Mostrar información de descuento
 */
const PriceDisplay = ({
  price,
  originalPrice,
  discount,
  formatPrice,
  size = 'medium',
  showDiscount = true,
}) => {
  const sizeVariants = {
    small: {
      price: 'h6',
      original: 'body2',
      discount: 'caption',
    },
    medium: {
      price: 'h5',
      original: 'body1',
      discount: 'body2',
    },
    large: {
      price: 'h4',
      original: 'h6',
      discount: 'body1',
    },
  }

  const variant = sizeVariants[size]

  return (
    <Box>
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1 }}>
        <Typography
          variant={variant.price}
          sx={{
            fontWeight: 'bold',
            color: 'primary.main',
          }}
        >
          {formatPrice(price)}
        </Typography>

        {originalPrice && originalPrice > price && (
          <Typography
            variant={variant.original}
            sx={{
              textDecoration: 'line-through',
              color: 'text.secondary',
            }}
          >
            {formatPrice(originalPrice)}
          </Typography>
        )}
      </Stack>

      {showDiscount && discount > 0 && (
        <Stack direction="row" spacing={1} alignItems="center">
          <Chip
            icon={<DiscountIcon />}
            label={`${discount}% OFF`}
            color="error"
            size="small"
            variant="filled"
          />

          {originalPrice && (
            <Chip
              icon={<OfferIcon />}
              label={`Ahorras ${formatPrice(originalPrice - price)}`}
              color="success"
              size="small"
              variant="outlined"
            />
          )}
        </Stack>
      )}
    </Box>
  )
}

export default PriceDisplay
