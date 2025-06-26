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

  // Functions
  formatPrice,
  formatDate,
  setCouponInput,
  onApplyCoupon,
  onRemoveCoupon,
  onCheckout,
}) => {
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
      />
      {/* Botones de acción */}
      <Stack spacing={2}>
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            variant="contained"
            fullWidth
            size="large"
            onClick={onCheckout}
            disabled={isCheckingOut}
            startIcon={
              isCheckingOut ? (
                <CircularProgress size={20} />
              ) : (
                <CreditCardIcon />
              )
            }
            sx={{
              py: 1.5,
              borderRadius: 3,
              background: 'linear-gradient(135deg,rgb(231, 254, 255) 0%,rgb(202, 223, 247) 100%)',
              boxShadow: '0 8px 16px rgba(102, 126, 234, 0.3)',
              color: '#000000', // Color negro para el texto
              '&:hover': {
                background: 'linear-gradient(135deg,rgb(209, 251, 254) 0%,rgb(189, 196, 247) 100%)',
                boxShadow: '0 12px 20px rgba(102, 126, 234, 0.4)',
                color: '#000000', // Mantener negro en hover
              },
              '&:disabled': {
                color: '#000000', // Mantener negro cuando está deshabilitado
              },
            }}
          >
            {isCheckingOut ? 'Procesando...' : 'Continuar al pago'}
          </Button>
        </motion.div>
      </Stack>
    </Paper>
  )
}

export default OrderSummary
