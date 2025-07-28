import React, { memo } from 'react'
import {
  Box,
} from '@mui/material'
import { AddToCart } from '../../../shared/components'

const PurchaseActions = ({
  stock,
  product,
  tiers = [],
  isLoggedIn = false,
}) => {
  // No necesitamos manejar estado de cantidad local ya que AddToCart se encarga de todo

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
      <AddToCart
        product={product}
        variant="button"
        size="large"
        disabled={!isLoggedIn || stock === 0}
        sx={{
          py: 1.5,
          fontSize: '1.1rem',
          fontWeight: 700,
          boxShadow: (isLoggedIn && stock > 0) 
            ? '0 3px 10px rgba(25, 118, 210, 0.3)'
            : 'none',
          '&:hover': {
            boxShadow: (isLoggedIn && stock > 0)
              ? '0 6px 20px rgba(25, 118, 210, 0.6)'
              : 'none',
            transform: (isLoggedIn && stock > 0) ? 'translateY(-2px)' : 'none',
          },
        }}
      >
        {!isLoggedIn
          ? 'Inicia sesión para agregar'
          : stock === 0
          ? 'Sin stock'
          : 'Agregar al Carrito'}
      </AddToCart>
    </Box>
  )
}

export default memo(PurchaseActions)
