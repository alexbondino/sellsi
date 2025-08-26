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
import PriceBreakdown from './PriceBreakdown'

const OrderSummary = ({
  // Data props
  subtotal,
  discount,
  shippingCost,
  total,
  cartStats,
  deliveryDate,
  isCheckingOut,

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
      elevation={3}
      sx={{
        p: { xs: 2, sm: 2.25, md: 3 },
        borderRadius: 3,
        background: 'linear-gradient(135deg, #ffffff 0%, #f8f9ff 100%)',
        border: '1px solid rgba(102, 126, 234, 0.1)',
        position: { xs: 'static', md: 'sticky' },
        top: { md: 100 },
        width: {
          xs: '100%',
          sm: '100%',
          md: '300px',
          lg: '360px',
          xl: '400px',
        },
        boxShadow: { xs: 2, md: 3 },
      }}
    >
      <Stack spacing={3}>
        <Typography
          variant="h6"
          sx={{
            fontWeight: 'bold',
            fontSize: { xs: '1rem', sm: '1.05rem', md: '1.15rem' }
          }}
        >
          Resumen del Pedido
        </Typography>
      
      {/* Desglose de precios */}
      <PriceBreakdown
        subtotal={subtotal}
        discount={0}
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
  <Stack spacing={{ xs: 1.5, md: 2 }}>
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
              borderRadius: 2,
              fontWeight: 'bold',
              textTransform: 'none',
              '&:disabled': {
                opacity: 0.6,
                cursor: 'not-allowed'
              }
            }}
          >
            {isCheckingOut ? 'Procesando...' : 
             (isAdvancedShippingMode && shippingValidation && shippingValidation.isLoading) ? 'Validando envíos...' :
             (isAdvancedShippingMode && shippingValidation && !shippingValidation.userRegion) ? 'Cargando perfil...' :
             'Continuar al pago'}
          </Button>
        </motion.div>
      </Stack>
      </Stack>
    </Paper>
  )
}

export default OrderSummary
