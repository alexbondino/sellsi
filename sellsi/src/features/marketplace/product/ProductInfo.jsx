import React from 'react'
import { Box, Typography, Chip, Rating, Avatar, Stack } from '@mui/material'
import {
  Store as StoreIcon,
  Category as CategoryIcon,
} from '@mui/icons-material'

/**
 * Componente compartido para mostrar información básica de un producto
 * @param {Object} props
 * @param {string} props.name - Nombre del producto
 * @param {string} props.supplier - Proveedor del producto
 * @param {string} props.category - Categoría del producto
 * @param {number} props.rating - Rating del producto (0-5)
 * @param {number} props.reviews - Número de reseñas
 * @param {string} props.description - Descripción del producto
 * @param {boolean} props.compact - Versión compacta para espacios reducidos
 */
const ProductInfo = ({
  name,
  supplier,
  category,
  rating,
  reviews,
  description,
  compact = false,
}) => {
  if (compact) {
    return (
      <Box>
        <Typography
          variant="h6"
          sx={{
            fontWeight: 'bold',
            mb: 1,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {name}
        </Typography>

        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
          <Avatar sx={{ width: 20, height: 20, fontSize: '0.75rem' }}>
            {supplier?.charAt(0)}
          </Avatar>
          <Typography variant="caption" color="text.secondary">
            {supplier}
          </Typography>
        </Stack>

        {rating && (
          <Stack direction="row" spacing={1} alignItems="center">
            <Rating value={rating} readOnly size="small" precision={0.1} />
            <Typography variant="caption" color="text.secondary">
              ({reviews})
            </Typography>
          </Stack>
        )}
      </Box>
    )
  }

  return (
    <Box>
      <Typography
        variant="h5"
        component="h2"
        sx={{
          fontWeight: 'bold',
          mb: 2,
          color: 'text.primary',
        }}
      >
        {name}
      </Typography>

      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
        <Chip
          avatar={
            <Avatar>
              <StoreIcon />
            </Avatar>
          }
          label={supplier}
          variant="outlined"
          color="primary"
        />

        {category && (
          <Chip
            icon={<CategoryIcon />}
            label={category}
            variant="outlined"
            color="secondary"
          />
        )}
      </Stack>

      {rating && (
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
          <Rating value={rating} readOnly precision={0.1} />
          <Typography variant="body2" color="text.secondary">
            {rating} ({reviews} reseñas)
          </Typography>
        </Stack>
      )}

      {description && (
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ lineHeight: 1.6 }}
        >
          {description}
        </Typography>
      )}
    </Box>
  )
}

export default ProductInfo
