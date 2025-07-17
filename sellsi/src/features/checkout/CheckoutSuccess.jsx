// ============================================================================
// CHECKOUT SUCCESS - PÁGINA DE ÉXITO DESPUÉS DEL PAGO
// ============================================================================

import React, { useEffect, useState } from 'react'
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  Stack,
  Alert,
  CircularProgress,
  Chip
} from '@mui/material'
import {
  CheckCircle as CheckCircleIcon,
  ShoppingCart as ShoppingCartIcon,
  Receipt as ReceiptIcon
} from '@mui/icons-material'
import { motion } from 'framer-motion'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'react-hot-toast'

// Servicios
import checkoutService from './services/checkoutService.js'
import useCartStore from '../buyer/hooks/cartStore.js'

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

const CheckoutSuccess = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { clearCart } = useCartStore()
  
  // Estados
  const [isVerifying, setIsVerifying] = useState(true)
  const [verificationError, setVerificationError] = useState(null)
  const [paymentData, setPaymentData] = useState(null)

  // Obtener parámetros de la URL de retorno de Khipu
  const paymentId = searchParams.get('payment_id')
  const transactionId = searchParams.get('transaction_id')

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        if (!paymentId) {
          throw new Error('ID de pago no encontrado')
        }

        console.log('[CheckoutSuccess] Verificando pago:', { paymentId, transactionId })

        // Verificar estado del pago con Khipu
        const verification = await checkoutService.verifyKhipuPaymentStatus(paymentId)

        if (!verification.success) {
          throw new Error('Error al verificar el pago')
        }

        if (verification.status === 'done') {
          // Pago completado exitosamente
          setPaymentData({
            paymentId: verification.paymentId,
            transactionId: verification.transactionId,
            amount: verification.amount,
            currency: verification.currency,
            paidAt: verification.paidAt,
            status: 'completed'
          })

          // Limpiar carrito ya que el pago fue exitoso
          clearCart()
          
          toast.success('¡Pago completado exitosamente!')
          
        } else if (verification.status === 'pending') {
          // Pago aún pendiente
          setPaymentData({
            paymentId: verification.paymentId,
            transactionId: verification.transactionId,
            status: 'pending'
          })
          
          toast.info('Tu pago está siendo procesado...')
          
        } else {
          throw new Error('El pago no fue completado')
        }

      } catch (error) {
        console.error('[CheckoutSuccess] Error verificando pago:', error)
        setVerificationError(error.message)
        toast.error(error.message)
      } finally {
        setIsVerifying(false)
      }
    }

    verifyPayment()
  }, [paymentId, transactionId, clearCart])

  const handleViewOrders = () => {
    navigate('/buyer/orders')
  }

  const handleContinueShopping = () => {
    navigate('/buyer/marketplace')
  }

  const handleGoHome = () => {
    navigate('/buyer/marketplace')
  }

  // ===== RENDERIZADO =====

  if (isVerifying) {
    return (
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Paper
          elevation={3}
          sx={{
            p: 4,
            borderRadius: 3,
            textAlign: 'center',
            background: 'linear-gradient(135deg, #ffffff 0%, #f8f9ff 100%)'
          }}
        >
          <CircularProgress size={60} sx={{ mb: 3, color: 'primary.main' }} />
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
            Verificando tu pago...
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Por favor espera mientras confirmamos tu transacción
          </Typography>
        </Paper>
      </Container>
    )
  }

  if (verificationError) {
    return (
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Paper
          elevation={3}
          sx={{
            p: 4,
            borderRadius: 3,
            textAlign: 'center',
            background: 'linear-gradient(135deg, #ffffff 0%, #ffebee 100%)'
          }}
        >
          <Alert severity="error" sx={{ mb: 3 }}>
            <Typography variant="body1" fontWeight="bold">
              Error al verificar el pago
            </Typography>
            <Typography variant="body2">
              {verificationError}
            </Typography>
          </Alert>
          
          <Stack spacing={2}>
            <Button
              variant="contained"
              onClick={handleGoHome}
              sx={{ borderRadius: 2 }}
            >
              Volver al Inicio
            </Button>
            
            <Button
              variant="outlined"
              onClick={() => navigate('/buyer/cart')}
              sx={{ borderRadius: 2 }}
            >
              Volver al Carrito
            </Button>
          </Stack>
        </Paper>
      </Container>
    )
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
            background: paymentData?.status === 'completed' 
              ? 'linear-gradient(135deg, #ffffff 0%, #e8f5e8 100%)'
              : 'linear-gradient(135deg, #ffffff 0%, #fff3e0 100%)'
          }}
        >
          {/* Icono de estado */}
          <Box sx={{ mb: 3 }}>
            {paymentData?.status === 'completed' ? (
              <CheckCircleIcon 
                sx={{ fontSize: 80, color: 'success.main' }} 
              />
            ) : (
              <CircularProgress size={60} sx={{ color: 'warning.main' }} />
            )}
          </Box>

          {/* Título */}
          <Typography variant="h4" fontWeight="bold" sx={{ mb: 2 }}>
            {paymentData?.status === 'completed' 
              ? '¡Pago Completado!' 
              : 'Pago en Proceso'
            }
          </Typography>

          {/* Descripción */}
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            {paymentData?.status === 'completed' 
              ? 'Tu pago ha sido procesado exitosamente. Recibirás un email de confirmación en breve.'
              : 'Tu pago está siendo procesado. Te notificaremos cuando se complete.'
            }
          </Typography>

          {/* Información del pago */}
          {paymentData && (
            <Box sx={{ mb: 3 }}>
              <Stack spacing={2} sx={{ textAlign: 'left', maxWidth: 400, mx: 'auto' }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    ID de Pago
                  </Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {paymentData.paymentId}
                  </Typography>
                </Box>
                
                {paymentData.transactionId && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      ID de Transacción
                    </Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {paymentData.transactionId}
                    </Typography>
                  </Box>
                )}
                
                {paymentData.amount && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Monto Pagado
                    </Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {checkoutService.formatPrice(paymentData.amount, paymentData.currency)}
                    </Typography>
                  </Box>
                )}

                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Estado
                  </Typography>
                  <Box sx={{ mt: 0.5 }}>
                    <Chip
                      label={paymentData.status === 'completed' ? 'Completado' : 'Pendiente'}
                      color={paymentData.status === 'completed' ? 'success' : 'warning'}
                      size="small"
                    />
                  </Box>
                </Box>
              </Stack>
            </Box>
          )}

          {/* Botones de acción */}
          <Stack spacing={2}>
            {paymentData?.status === 'completed' && (
              <Button
                variant="contained"
                onClick={handleViewOrders}
                startIcon={<ReceiptIcon />}
                sx={{
                  py: 1.5,
                  borderRadius: 2,
                  fontWeight: 'bold',
                  textTransform: 'none'
                }}
              >
                Ver Mis Pedidos
              </Button>
            )}
            
            <Button
              variant="outlined"
              onClick={handleContinueShopping}
              startIcon={<ShoppingCartIcon />}
              sx={{
                py: 1.5,
                borderRadius: 2,
                textTransform: 'none'
              }}
            >
              Continuar Comprando
            </Button>
          </Stack>
        </Paper>
      </motion.div>
    </Container>
  )
}

export default CheckoutSuccess
