import React, { memo, useState, useEffect, useCallback } from 'react'
import {
  Box,
  Button,
  Tooltip,
} from '@mui/material'
import { Gavel as GavelIcon } from '@mui/icons-material'
import { AddToCart } from '../../../shared/components'
import OfferModal from './OfferModal'
import { useOfferStore } from '../../../stores/offerStore'

const PurchaseActions = ({
  stock,
  product,
  tiers = [],
  isLoggedIn = false,
  userRegion = null,
  isLoadingUserProfile = false,
}) => {
  const [isOfferOpen, setIsOfferOpen] = React.useState(false)
  const [limitsValidation, setLimitsValidation] = useState(null)
  const [checkingLimits, setCheckingLimits] = useState(false)
  
  const { validateOfferLimits } = useOfferStore()
  // Prefetched limits for passing into OfferModal (avoid double RPC)
  const prefetchedLimitsRef = React.useRef(null)
  const userId = localStorage.getItem('user_id')
  const userNm = localStorage.getItem('user_nm') || localStorage.getItem('user_email')
  const userEmail = localStorage.getItem('user_email')

  // Verificar límites cuando el componente se monta y el usuario está logueado
  const checkOfferLimits = useCallback(async () => {
    if (!userId || !product?.id) return
    
    setCheckingLimits(true)
    try {
  const limits = await validateOfferLimits({
        buyerId: userId,
        productId: product.id,
        supplierId: product.supplier_id || product.supplierId
      })
      setLimitsValidation(limits)
  prefetchedLimitsRef.current = limits
    } catch (error) {
      console.error('Error checking offer limits:', error)
      setLimitsValidation(null)
    } finally {
      setCheckingLimits(false)
    }
  }, [userId, product?.id, product?.supplier_id, product?.supplierId, validateOfferLimits])

  useEffect(() => {
    if (isLoggedIn && userId && product?.id) {
      checkOfferLimits()
    }
  }, [isLoggedIn, userId, product?.id, checkOfferLimits])

  const openOffer = () => setIsOfferOpen(true)
  const closeOffer = () => setIsOfferOpen(false)

  const handleOffer = ({ price, quantity }) => {
    // TODO: conectar con la API para crear la oferta
    // por ahora solo console.log
    // eslint-disable-next-line no-console
    console.log('Oferta enviada', { price, quantity, product })
  }

  // Determinar si el botón debe estar deshabilitado
  const isOfferDisabled = stock === 0 || 
    checkingLimits || 
    (limitsValidation && !limitsValidation.allowed)
  
  // Mensaje para el tooltip cuando está deshabilitado
  const getOfferTooltip = () => {
    if (stock === 0) return 'Producto sin stock'
    if (checkingLimits) return 'Verificando límites...'
    if (limitsValidation && !limitsValidation.allowed) {
      return limitsValidation.reason
    }
    return 'Hacer una oferta por este producto'
  }

  return (
    <>
      <Box sx={{ display: 'flex', width: '100%', alignItems: 'center', columnGap: { xs: 2, md: 3 } }}>
      {isLoggedIn && (
        <Box sx={{ flex: 1, display: 'flex', justifyContent: 'flex-start' }}>
          <Tooltip title={getOfferTooltip()} arrow>
            <span> {/* Necesario para que el tooltip funcione con botón deshabilitado */}
              <Button
                variant="contained"
                startIcon={<GavelIcon />}
                size="large"
                disabled={!isLoggedIn || isOfferDisabled}
                onClick={openOffer}
                sx={(theme) => ({
                  minWidth: { xs: 140, sm: 160, md: 180 },
                  whiteSpace: 'nowrap',
                  py: 1.5,
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  boxShadow: (isLoggedIn && !isOfferDisabled)
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
                    boxShadow: (isLoggedIn && !isOfferDisabled)
                      ? '0 6px 20px rgba(25, 118, 210, 0.6)'
                      : 'none',
                    transform: (isLoggedIn && !isOfferDisabled) ? 'translateY(-2px)' : 'none',
                    backgroundColor: '#fff',
                  },
                  '&.Mui-disabled': {
                    boxShadow: 'none',
                    color: theme.palette.action.disabled,
                    borderColor: theme.palette.action.disabledBackground || 'rgba(0,0,0,0.12)'
                  }
                })}
              >
                {checkingLimits ? 'Verificando...' : 'Ofertar'}
              </Button>
            </span>
          </Tooltip>
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
      <OfferModal 
        open={isOfferOpen}
        onClose={closeOffer}
        onOffer={handleOffer}
        stock={stock}
        product={product}
        initialLimits={prefetchedLimitsRef.current}
      />
    </>
  )
}

export default memo(PurchaseActions)
