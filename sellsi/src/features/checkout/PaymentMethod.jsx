// ============================================================================
// PAYMENT METHOD WRAPPER - PÁGINA COMPLETA DE SELECCIÓN DE MÉTODO DE PAGO
// ============================================================================

import React, { useEffect } from 'react'
import { ThemeProvider } from '@mui/material/styles'
import { Box, Container } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'

// Layout y tema
import { dashboardThemeCore } from '../../styles/dashboardThemeCore'
import { SPACING_BOTTOM_MAIN } from '../../styles/layoutSpacing'

// Hooks del carrito
import useCartStore from '../../shared/stores/cart/cartStore'

// Componentes del checkout
import PaymentMethodSelector from './PaymentMethodSelector'
import useCheckout from './hooks/useCheckout'

// Utilidades de cálculo de envío
import { calculateRealShippingCost } from '../../utils/shippingCalculation'

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

const PaymentMethod = () => {
  const navigate = useNavigate()
  
  // Estados del carrito
  const { items, getSubtotal, getTotal } = useCartStore() // ✅ REMOVIDO: getShippingCost (no usar mock)
  
  // Estados del checkout
  const { initializeCheckout, resetCheckout } = useCheckout()

  // ===== EFECTOS =====
  
  useEffect(() => {
    // Verificar que haya productos en el carrito
    if (!items || items.length === 0) {
      // Silenciosamente redirigir al carrito sin mostrar toast
      navigate('/buyer/cart', { replace: true })
      return
    }

    // Inicializar checkout con datos del carrito
    const initializeCheckoutData = async () => {
      const subtotal = getSubtotal()
      const tax = Math.round(subtotal * 0.19) // IVA 19%
      const serviceFee = Math.round(subtotal * 0.02) // Comisión por servicio 2%
      
      // ✅ NUEVO: Calcular costo REAL de envío basado en regiones de despacho
      const shipping = await calculateRealShippingCost(items)
      const total = subtotal + tax + serviceFee + shipping
      
      console.log('[PaymentMethod] Datos de checkout inicializados:', {
        itemsCount: items.length,
        subtotal,
        tax,
        serviceFee,
        shipping,
        total,
        itemsDetail: items.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price
        }))
      })
      
      const cartData = {
        items: items,
        subtotal: subtotal,
        tax: tax,
        serviceFee: serviceFee,
        shipping: shipping,
        total: total,
        currency: 'CLP'
      }

      initializeCheckout(cartData)
    }

    initializeCheckoutData()
    
    // Limpiar checkout al desmontar (opcional)
    return () => {
      // No resetear automáticamente para permitir navegación back/forward
    }
  }, [items, getSubtotal, getTotal, initializeCheckout, navigate]) // ✅ REMOVIDO: getShippingCost

  // ===== RENDERIZADO =====

  return (
    <ThemeProvider theme={dashboardThemeCore}>
      <Box
        sx={{
          backgroundColor: 'background.default',
          minHeight: '100vh',
          pt: { xs: 4.5, md: 5 },
          px: 3,
          pb: SPACING_BOTTOM_MAIN,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          // Mismo margen que BuyerCart
          ml: { xs: 0, md: 8, lg: 24, xl: 34 },
          transition: 'margin-left 0.3s',
        }}
      >
        <Container maxWidth="xl" disableGutters sx={{ px: { xs: 0, md: 2 } }}>
          <PaymentMethodSelector />
        </Container>
      </Box>
    </ThemeProvider>
  )
}

export default PaymentMethod
