// ============================================================================
// PAYMENT METHOD WRAPPER - PÁGINA COMPLETA DE SELECCIÓN DE MÉTODO DE PAGO
// ============================================================================

import React, { useEffect } from 'react'
import { ThemeProvider } from '@mui/material/styles'
import { Box } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'

// Layout y tema
import SideBarProvider from '../layout/SideBar'
import { dashboardThemeCore } from '../../styles/dashboardThemeCore'

// Hooks del carrito
import useCartStore from '../buyer/hooks/cartStore'

// Componentes del checkout
import PaymentMethodSelector from './PaymentMethodSelector'
import useCheckout from './hooks/useCheckout'

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

const PaymentMethod = () => {
  const navigate = useNavigate()
  
  // Estados del carrito
  const { items, getSubtotal, getTotal, getShippingCost } = useCartStore()
  
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
    const subtotal = getSubtotal()
    const tax = Math.round(subtotal * 0.19) // IVA 19%
    const serviceFee = Math.round(subtotal * 0.02) // Comisión por servicio 2%
    const shipping = getShippingCost() // Obtener costo de envío real
    const total = subtotal + tax + serviceFee + shipping
    
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
    
    // Limpiar checkout al desmontar (opcional)
    return () => {
      // No resetear automáticamente para permitir navegación back/forward
    }
  }, [items, getSubtotal, getTotal, getShippingCost, initializeCheckout, navigate])

  // ===== RENDERIZADO =====

  return (
    <ThemeProvider theme={dashboardThemeCore}>
      <SideBarProvider />
      
      <Box
        sx={{
          backgroundColor: 'background.default',
          minHeight: '100vh',
          pt: { xs: 1, md: 2 },
          pb: 10
        }}
      >
        <PaymentMethodSelector />
      </Box>
    </ThemeProvider>
  )
}

export default PaymentMethod
