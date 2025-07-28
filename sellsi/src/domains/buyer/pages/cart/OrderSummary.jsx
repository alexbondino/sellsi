import React from 'react'
import {
  Paper,
  Typography,
  Stack,
  Button,
  Alert,
  CircularProgress,
} from '@mui/material'
import { CreditCard as CreditCardIcon } from '@mui/icons-material'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import DiscountSection from './DiscountSection'
import PriceBreakdown from './PriceBreakdown'

const OrderSummary = ({
  // Data props
  subtotal,
  discount,
  shippingCost,
  total,
  cartStats,
  deliveryDate,
  appliedCoupons,
  couponInput,
  isCheckingOut,

  // Available discount codes
  availableCodes,

  // Shipping validation props
  shippingValidation,
  isAdvancedShippingMode,
  onShippingCompatibilityError,

  // Shipping loading state
  isCalculatingShipping,

  // ✅ NUEVAS PROPS para lógica de envío avanzada
  cartItems = [],
  userRegion,

  // Functions
  formatPrice,
  formatDate,
  setCouponInput,
  onApplyCoupon,
  onRemoveCoupon,
  onCheckout,
}) => {
  const navigate = useNavigate()

  // Handler para navegar al checkout
  const handleCheckout = () => {
    // Validar que haya productos
    if (!cartStats || cartStats.isEmpty) {
      return
    }
    // Validar compatibilidad de envío si está en modo avanzado
    if (isAdvancedShippingMode && shippingValidation && !shippingValidation.isCartCompatible) {
      // Notificar al componente padre para mostrar el modal
      if (onShippingCompatibilityError) {
        onShippingCompatibilityError()
      }
      return
    }
    // Si hay función de checkout personalizada, usar esa
    if (onCheckout) {
      onCheckout()
      return
    }
    // Navegar al método de pago
    navigate('/buyer/paymentmethod')
  }

  // Determinar si el botón debe estar deshabilitado
  const isButtonDisabled = () => {
    const disabled = (
      isCheckingOut ||
      !cartStats ||
      cartStats.isEmpty ||
      (isAdvancedShippingMode && shippingValidation && shippingValidation.isLoading) || // ✅ NUEVO: deshabilitar si está validando
      (isAdvancedShippingMode && shippingValidation && !shippingValidation.userRegion) || // ✅ NUEVO: deshabilitar si no hay userRegion
      (isAdvancedShippingMode && shippingValidation && !shippingValidation.isCartCompatible)
    )
    
    return disabled
  }
  return (
    <Paper
      sx={{
        p: 3,
        borderRadius: 3,
        background: 'linear-gradient(135deg, #ffffff 0%, #f0f4ff 100%)',
        boxShadow: '0 12px 24px rgba(0,0,0,0.1)',
        border: '1px solid rgba(102, 126, 234, 0.2)',
        position: 'sticky',
        top: 100,
      }}
    >
      <Typography
        variant="h5"
        sx={{
          fontWeight: 'bold',
          mb: 3,
          background: '#1565c0',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
      >
        Resumen del Pedido
      </Typography>{' '}
      {/* Códigos de descuento */}
      <DiscountSection
        couponInput={couponInput}
        setCouponInput={setCouponInput}
        onApplyCoupon={onApplyCoupon}
        appliedCoupons={appliedCoupons}
        onRemoveCoupon={onRemoveCoupon}
        availableCodes={availableCodes}
      />
      {/* Desglose de precios */}
      <PriceBreakdown
        subtotal={subtotal}
        discount={discount}
        shippingCost={shippingCost}
        total={total}
        formatPrice={formatPrice}
        cartStats={cartStats}
        isCalculatingShipping={isCalculatingShipping}
        // ✅ NUEVAS PROPS para lógica de envío avanzada
        cartItems={cartItems}
        isAdvancedShippingMode={isAdvancedShippingMode}
        userRegion={userRegion}
      />
      {/* Botones de acción */}
      <Stack spacing={2}>
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            variant="contained"
            fullWidth
            size="large"
            onClick={e => {
              if (isButtonDisabled()) {
                return;
              }
              handleCheckout();
            }}
            disabled={isButtonDisabled()}
            startIcon={
              isCheckingOut ? (
                <CircularProgress size={20} sx={{ color: 'white' }} />
              ) : (isAdvancedShippingMode && shippingValidation && shippingValidation.isLoading) ? (
                <CircularProgress size={20} sx={{ color: 'white' }} />
              ) : (
                <CreditCardIcon sx={{ color: 'white' }} />
              )
            }
            sx={{
              py: 1.5,
              borderRadius: 1,
              backgroundColor: isButtonDisabled() ? 'rgba(128,128,128,0.18)' : 'primary.main',
              color: isButtonDisabled() ? 'rgba(0,0,0,0.32)' : 'white',
              boxShadow: isButtonDisabled() ? 'none' : '0 8px 16px rgba(102, 126, 234, 0.3)',
              cursor: isButtonDisabled() ? 'not-allowed' : 'pointer',
              border: '1px solid rgba(128,128,128,0.18)',
              '&:hover': {
                backgroundColor: isButtonDisabled() ? 'rgba(128,128,128,0.18)' : 'primary.dark',
                color: isButtonDisabled() ? 'rgba(0,0,0,0.32)' : 'white',
              },
              '&:disabled': {
                opacity: 0.7,
                backgroundColor: 'rgba(128,128,128,0.18)',
                color: 'rgba(0,0,0,0.32)',
                boxShadow: 'none',
                cursor: 'not-allowed',
                border: '1px solid rgba(128,128,128,0.18)',
              },
            }}
          >
            {isCheckingOut ? 'Procesando...' : 
             (isAdvancedShippingMode && shippingValidation && shippingValidation.isLoading) ? 'Validando envíos...' :
             (isAdvancedShippingMode && shippingValidation && !shippingValidation.userRegion) ? 'Cargando perfil...' :
             'Continuar al pago'}
          </Button>
        </motion.div>
      </Stack>
    </Paper>
  )
}

export default OrderSummary
