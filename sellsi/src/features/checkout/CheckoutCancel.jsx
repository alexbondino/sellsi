// ============================================================================
// CHECKOUT CANCEL - PÁGINA DE CANCELACIÓN DE PAGO
// ============================================================================

import React from 'react'
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  Stack,
  Alert
} from '@mui/material'
import {
  Cancel as CancelIcon,
  ShoppingCart as ShoppingCartIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material'
import { motion } from 'framer-motion'
import { useNavigate, useSearchParams } from 'react-router-dom'

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

const CheckoutCancel = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  
  // Obtener parámetros de la URL de cancelación de Khipu
  const paymentId = searchParams.get('payment_id')
  const reason = searchParams.get('reason') || 'El usuario canceló el pago'

  const handleBackToCart = () => {
    navigate('/buyer/cart')
  }

  const handleBackToPayment = () => {
    navigate('/checkout/payment')
  }

  const handleContinueShopping = () => {
    navigate('/buyer/marketplace')
  }

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 4,
            borderRadius: 3,
            textAlign: 'center',
            background: 'linear-gradient(135deg, #ffffff 0%, #fff8e1 100%)'
          }}
        >
          {/* Icono de cancelación */}
          <Box sx={{ mb: 3 }}>
            <CancelIcon 
              sx={{ fontSize: 80, color: 'warning.main' }} 
            />
          </Box>

          {/* Título */}
          <Typography variant="h4" fontWeight="bold" sx={{ mb: 2 }}>
            Pago Cancelado
          </Typography>

          {/* Descripción */}
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            No se ha realizado ningún cargo. Puedes intentar nuevamente o elegir otro método de pago.
          </Typography>

          {/* Información adicional */}
          <Alert severity="info" sx={{ mb: 3, textAlign: 'left' }}>
            <Typography variant="body2">
              <strong>¿Qué pasó?</strong><br />
              {reason === 'user_cancelled' && 'Cancelaste el pago en Khipu'}
              {reason === 'timeout' && 'El tiempo para completar el pago se agotó'}
              {reason === 'error' && 'Ocurrió un error durante el proceso de pago'}
              {!['user_cancelled', 'timeout', 'error'].includes(reason) && reason}
            </Typography>
          </Alert>

          {/* Información del pago */}
          {paymentId && (
            <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
              <Typography variant="caption" color="text.secondary">
                Referencia de pago
              </Typography>
              <Typography variant="body2" fontWeight="bold">
                {paymentId}
              </Typography>
            </Box>
          )}

          {/* Botones de acción */}
          <Stack spacing={2}>
            <Button
              variant="contained"
              onClick={handleBackToPayment}
              startIcon={<ArrowBackIcon />}
              sx={{
                py: 1.5,
                borderRadius: 2,
                fontWeight: 'bold',
                textTransform: 'none'
              }}
            >
              Intentar Nuevamente
            </Button>
            
            <Button
              variant="outlined"
              onClick={handleBackToCart}
              sx={{
                py: 1.5,
                borderRadius: 2,
                textTransform: 'none'
              }}
            >
              Volver al Carrito
            </Button>

            <Button
              variant="text"
              onClick={handleContinueShopping}
              startIcon={<ShoppingCartIcon />}
              sx={{
                py: 1.5,
                borderRadius: 2,
                textTransform: 'none',
                color: 'text.secondary'
              }}
            >
              Continuar Comprando
            </Button>
          </Stack>

          {/* Ayuda adicional */}
          <Box sx={{ mt: 4, pt: 3, borderTop: '1px solid', borderColor: 'divider' }}>
            <Typography variant="body2" color="text.secondary">
              ¿Necesitas ayuda? Contáctanos a{' '}
              <Typography component="span" variant="body2" fontWeight="bold" color="primary">
                soporte@sellsi.cl
              </Typography>
            </Typography>
          </Box>
        </Paper>
      </motion.div>
    </Container>
  )
}

export default CheckoutCancel
