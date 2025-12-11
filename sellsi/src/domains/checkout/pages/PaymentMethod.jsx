// ============================================================================
// PAYMENT METHOD WRAPPER - PÁGINA COMPLETA DE SELECCIÓN DE MÉTODO DE PAGO
// ============================================================================

import React, { useEffect } from 'react'
import { ThemeProvider } from '@mui/material/styles'
import { Box, Container, useMediaQuery, useTheme } from '@mui/material'
import { useNavigate } from 'react-router-dom'

// Layout y tema
import { dashboardThemeCore } from '../../../styles/dashboardThemeCore'
import { SPACING_BOTTOM_MAIN } from '../../../styles/layoutSpacing'

// Hooks del carrito
import useCartStore from '../../../shared/stores/cart/cartStore'

// Hook de validación de shipping para evitar race condition
import useShippingValidation from '../../buyer/pages/cart/hooks/useShippingValidation'

// Componentes del checkout
import PaymentMethodSelector from '../components/PaymentMethodSelector'
import { useCheckout } from '../hooks'

// Utilidades de cálculo de envío
import { calculateRealShippingCost } from '../../../utils/shippingCalculation'

// Servicios
import { getUserProfileData } from '../../../services/user/profileService'

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

const PaymentMethod = () => {
  const navigate = useNavigate()
  const theme = useTheme()
  
  // ===== DETECCIÓN DE MOBILE =====
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  
  // Estados del carrito
  const { items, getSubtotal, getTotal } = useCartStore() // ✅ REMOVIDO: getShippingCost (no usar mock)
  
  // ✅ NUEVO: Hook de validación de shipping para evitar race condition
  const shippingValidation = useShippingValidation(items, true)
  
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

    // ✅ NUEVO: Verificar que la validación de shipping esté completa
    // Si el shipping validation está cargando, esperar
    if (shippingValidation.isLoading) {
      return
    }

    // ✅ NUEVO: Si no hay userRegion pero tampoco está cargando, esperar un momento más
    if (!shippingValidation.userRegion && !shippingValidation.isLoading) {
      return
    }

    // Si hay productos incompatibles, redirigir al carrito
    if (!shippingValidation.isCartCompatible) {
      navigate('/buyer/cart', { replace: true })
      return
    }

    // Inicializar checkout con datos del carrito
    const initializeCheckoutData = async () => {
      // Forzar validación fresca antes de inicializar el checkout
      try {
        if (shippingValidation && typeof shippingValidation.clearGlobalShippingCache === 'function') {
          // limpiar cache global para evitar staleness
          shippingValidation.clearGlobalShippingCache();
        }

        if (shippingValidation && typeof shippingValidation.validateProductsBatch === 'function') {
          const fresh = shippingValidation.validateProductsBatch(items, { forceRefresh: true });
          // Si alguna validación indica no poder despachar, redirigir al carrito
          const anyIncompatible = fresh.some(r => r.validation && !r.validation.canShip && r.validation.state !== shippingValidation.SHIPPING_STATES.NO_SHIPPING_INFO);
          if (anyIncompatible) {
            navigate('/buyer/cart', { replace: true });
            return;
          }
        }
      } catch (err) {
        console.error('[PaymentMethod] Error forcing fresh shipping validation:', err);
        // En caso de error, dejamos que el flujo continue y la validación server-side la confirme
      }

      const subtotal = getSubtotal()
      const tax = Math.round(subtotal * 0.19) // IVA 19%
      const serviceFee = Math.round(subtotal * 0.03) // Comisión por servicio 3%
      
      // ✅ NUEVO: Calcular costo REAL de envío basado en regiones de despacho
      const shipping = await calculateRealShippingCost(items)
      const total = subtotal + tax + serviceFee + shipping
      
      // ✅ CRÍTICO: Obtener datos del perfil para direcciones
      const userId = localStorage.getItem('user_id')
      let shippingAddress = null
      let billingAddress = null
      
      if (userId) {
        try {
          const profile = await getUserProfileData(userId)

          // Construcción parcial: si hay al menos UN campo de shipping rellenado, generamos objeto.
          const hasAnyShipping = [
            profile.shipping_region,
            profile.shipping_commune,
            profile.shipping_address,
            profile.shipping_number,
            profile.shipping_dept
          ].some(v => v && String(v).trim() !== '')

          if (hasAnyShipping) {
            const addr = {
              region: profile.shipping_region || '',
              commune: profile.shipping_commune || '',
              address: profile.shipping_address || '',
              number: profile.shipping_number || '',
              department: profile.shipping_dept || ''
            }
            // Flag incomplete si falta address principal (o comuna / region)
            const requiredFilled = addr.address.trim() !== '' && addr.region.trim() !== '' && addr.commune.trim() !== ''
            if (!requiredFilled) addr.incomplete = true
            shippingAddress = addr
          }

          // Facturación parcial: considerar cualquier campo de facturación relevante
          const hasAnyBilling = [
            profile.business_name,
            profile.billing_address,
            profile.billing_rut,
            profile.business_line,
            profile.billing_region,
            profile.billing_commune
          ].some(v => v && String(v).trim() !== '')

          if (hasAnyBilling) {
            const baddr = {
              // Campos principales
              business_name: profile.business_name || '',
              billing_rut: profile.billing_rut || '',
              business_line: profile.business_line || '', // Giro
              giro: profile.business_line || '', // alias para retrocompatibilidad potencial
              billing_address: profile.billing_address || '',
              // Localización de facturación
              billing_region: profile.billing_region || '',
              billing_commune: profile.billing_commune || '',
              // Aliases normalizados usados por normalizadores de UI
              address: profile.billing_address || '',
              region: profile.billing_region || '',
              commune: profile.billing_commune || ''
            }
            // Reglas mínimas de "completitud" conservan criterio previo (nombre + dirección)
            const requiredBilling = baddr.business_name.trim() !== '' && baddr.billing_address.trim() !== ''
            if (!requiredBilling) baddr.incomplete = true
            billingAddress = baddr
          }
        } catch (error) {
          console.error('[PaymentMethod] Error obteniendo perfil del usuario:', error)
        }
      }
      
      const cartData = {
        items: items,
        subtotal: subtotal,
        tax: tax,
        serviceFee: serviceFee,
        shipping: shipping,
        total: total,
        currency: 'CLP',
        // ✅ NUEVO: Incluir direcciones capturadas del perfil
        shippingAddress: shippingAddress,
        billingAddress: billingAddress
      }

      initializeCheckout(cartData)
    }

    initializeCheckoutData()
    
    // Limpiar checkout al desmontar (opcional)
    return () => {
      // No resetear automáticamente para permitir navegación back/forward
    }
  }, [items, getSubtotal, getTotal, initializeCheckout, navigate, shippingValidation.isLoading, shippingValidation.isCartCompatible, shippingValidation.userRegion]) // ✅ NUEVO: incluir userRegion

  // ===== RENDERIZADO =====

  return (
    <ThemeProvider theme={dashboardThemeCore}>
      <Box
        sx={{
          backgroundColor: 'background.default',
          minHeight: '100vh',
          pt: { xs: 4.5, md: 5 },
          // Eliminar padding horizontal en mobile para layout full-bleed
          px: { xs: 0, md: 3 },
          pb: isMobile ? 0 : SPACING_BOTTOM_MAIN,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          // Mismo margen que BuyerOrders solo en desktop
          ml: { xs: 0, md: 10, lg: 14, xl: 24 },
          transition: 'margin-left 0.3s',
        }}
      >
        <Container 
          maxWidth={isMobile ? false : "xl"} 
          disableGutters 
          sx={{ 
            // Quitar límite de 480px y gutters en mobile para aprovechar toda la pantalla
            px: { xs: 0, md: 2, lg: 3, xl: 3 },
            width: '100%',
            maxWidth: '100%'
          }}
        >
          <PaymentMethodSelector />
        </Container>
      </Box>
    </ThemeProvider>
  )
}

export default PaymentMethod
