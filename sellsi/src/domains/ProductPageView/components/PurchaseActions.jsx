import React, { memo } from 'react'
import {
  Box,
  Button,
} from '@mui/material'
import { Gavel as GavelIcon } from '@mui/icons-material'
import { AddToCart } from '../../../shared/components'

const PurchaseActions = ({
  stock,
  product,
  tiers = [],
  isLoggedIn = false,
  userRegion = null,
  isLoadingUserProfile = false,
}) => {
  // No necesitamos manejar estado de cantidad local ya que AddToCart se encarga de todo

  return (
  <Box sx={{ display: 'flex', width: '100%', alignItems: 'center', columnGap: { xs: 2, md: 3 } }}>
      {isLoggedIn && (
        <Box sx={{ flex: 1, display: 'flex', justifyContent: 'flex-start' }}>
            <Button
              variant="contained"
              startIcon={<GavelIcon />}
              size="large"
              disabled={stock === 0}
              onClick={() => { /* placeholder: oferta action */ }}
              sx={(theme) => ({
                minWidth: { xs: 140, sm: 160, md: 180 },
                whiteSpace: 'nowrap',
                py: 1.5,
                fontSize: '1.1rem',
                fontWeight: 700,
                boxShadow: (isLoggedIn && stock > 0)
                  ? '0 3px 10px rgba(25, 118, 210, 0.3)'
                  : 'none',
                textTransform: 'none',
                backgroundColor: '#fff',
                color: 'primary.main',
                border: `1px solid ${theme.palette.primary.main}`,
                '& .MuiButton-startIcon': {
                  color: 'primary.main',
                },
                '&:hover': {
                  boxShadow: (isLoggedIn && stock > 0)
                    ? '0 6px 20px rgba(25, 118, 210, 0.6)'
                    : 'none',
                  transform: (isLoggedIn && stock > 0) ? 'translateY(-2px)' : 'none',
                  backgroundColor: '#fff',
                },
                '&.Mui-disabled': {
                  boxShadow: 'none',
                  color: theme.palette.action.disabled,
                  borderColor: theme.palette.action.disabledBackground || 'rgba(0,0,0,0.12)'
                }
              })}
            >
              Ofertar
            </Button>
        </Box>
      )}

      <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
    <AddToCart
          product={product}
          variant="button"
          size="large"
          disabled={!isLoggedIn || stock === 0}
          userRegion={userRegion}
          isLoadingUserProfile={isLoadingUserProfile}
          sx={{
      minWidth: { xs: 120, sm: 160, md: 180 },
      whiteSpace: 'nowrap',
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

      <Box sx={{ flex: 1 }} />
    </Box>
  )
}

export default memo(PurchaseActions)
