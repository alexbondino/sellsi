// ============================================================================
// PAYMENT METHOD SELECTOR - SELECCIÓN DE MÉTODO DE PAGO
// ============================================================================

import React, { useState, useEffect } from 'react'
import {
  Box,
  Paper,
  Typography,
  Button,
  Stack,
  Alert,
  CircularProgress,
  Divider,
  IconButton
} from '@mui/material'
import {
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'

// Hooks y servicios
import useCheckout from './hooks/useCheckout'
import usePaymentMethods from './hooks/usePaymentMethods'
import checkoutService from './services/checkoutService'

// Componentes UI
import CheckoutSummary from './CheckoutSummary'
import PaymentMethodCard from '../ui/PaymentMethodCard'
import CheckoutProgressStepper from '../ui/CheckoutProgressStepper'

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

const PaymentMethodSelector = () => {
  const navigate = useNavigate()
  
  // Estados del checkout
  const {
    orderData,
    paymentMethod,
    selectPaymentMethod,
    nextStep,
    previousStep,
    setError,
    clearError,
    error,
    currentStep,
    completedSteps,
    startPaymentProcessing,
    completePayment,
    failPayment
  } = useCheckout()

  // Estados de métodos de pago
  const {
    availableMethods,
    selectedMethod,
    selectMethod,
    validateMethod,
    isValidating,
    validationErrors,
    getMethodFees
  } = usePaymentMethods()

  // Estado local
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedMethodId, setSelectedMethodId] = useState(null) // NO preseleccionar
  const [isCompleted, setIsCompleted] = useState(false)

  // ===== EFECTOS =====
  
  useEffect(() => {
    // Validar que tengamos datos del pedido
    if (!orderData.items || orderData.items.length === 0) {
      // Silenciosamente redirigir al carrito sin mostrar toast
      navigate('/buyer/cart', { replace: true })
      return
    }

    // Limpiar errores al cargar
    clearError()
  }, [orderData, navigate, clearError])

  // ===== HANDLERS =====
  
  const handleMethodSelect = async (methodId) => {
    try {
      setSelectedMethodId(methodId)
      selectMethod(methodId)
      
      // Validar método con el monto total
      const isValid = await validateMethod(methodId, orderData.total)
      
      if (isValid) {
        selectPaymentMethod(availableMethods.find(m => m.id === methodId))
        clearError()
      }
    } catch (error) {
      console.error('Error selecting payment method:', error)
      setError('Error al seleccionar método de pago')
    }
  }

  const handleBack = () => {
    previousStep()
    navigate('/buyer/cart')
  }

  const handleViewOrders = () => {
    navigate('/buyer/orders')
  }

  const handleContinueShopping = () => {
    navigate('/buyer/marketplace')
  }

  const handleContinue = async () => {
    if (!selectedMethod) {
      toast.error('Debe seleccionar un método de pago')
      return
    }

    setIsProcessing(true)
    
    try {
      // Validar datos del checkout
      const validation = checkoutService.validateCheckoutData({
        ...orderData,
        paymentMethod: selectedMethod.id,
        userId: localStorage.getItem('user_id')
      })

      if (!validation.isValid) {
        const errorMessage = Object.values(validation.errors).join(', ')
        throw new Error(errorMessage)
      }

      // TODO: En el futuro, aquí se redirigirá a Khipu
      // window.location.href = khipuPaymentUrl
      
      // Por ahora, simular el proceso
      toast.success('Redirigiendo a Khipu...')
      
      // Marcar como procesando en el stepper
      startPaymentProcessing()
      
      // Simular el proceso de Khipu (esto se eliminará cuando esté la integración real)
      setTimeout(() => {
        // Simular respuesta exitosa de Khipu
        const transactionData = {
          transactionId: `TXN_${Date.now()}`,
          paymentReference: `REF_${Math.random().toString(36).substr(2, 9)}`
        }
        
        completePayment(transactionData)
        toast.success('¡Pago completado exitosamente!')
        setIsCompleted(true)
      }, 3000) // 3 segundos para simular el proceso
      
    } catch (error) {
      console.error('Error processing payment:', error)
      setError(error.message)
      toast.error(error.message)
      failPayment(error.message)
    } finally {
      setIsProcessing(false)
    }
  }

  // ===== ANIMACIONES =====
  
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.3 }
    }
  }

  // ===== RENDERIZADO =====

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', py: 4 }}>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header */}
        <Box sx={{ mb: 4, px: 3 }}>
          <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
            <IconButton onClick={handleBack} sx={{ p: 1 }}>
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h4" fontWeight="bold">
              <span style={{ color: '#1976d2' }}>Método de Pago</span>
            </Typography>
          </Stack>
          
          {/* Stepper de progreso */}
          <CheckoutProgressStepper 
            currentStep={currentStep}
            completedSteps={completedSteps}
            orientation="horizontal"
            showLabels={true}
          />
        </Box>

        {/* Contenido principal */}
        <Box sx={{ px: 3 }}>
          <Stack direction={{ xs: 'column', lg: 'row' }} spacing={4}>
            
            {/* Panel izquierdo - Métodos de pago */}
            <Box sx={{ flex: 1 }}>
              <motion.div variants={itemVariants}>
                <Paper
                  elevation={3}
                  sx={{
                    p: 4,
                    borderRadius: 3,
                    background: 'linear-gradient(135deg, #ffffff 0%, #f8f9ff 100%)',
                    border: '1px solid rgba(102, 126, 234, 0.1)'
                  }}
                >
                  <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }}>
                    {isCompleted ? '¡Pago Completado!' : 'Selecciona tu método de pago'}
                  </Typography>

                  {isCompleted && (
                    <Alert severity="success" sx={{ mb: 3 }}>
                      <Typography variant="body1" fontWeight="bold">
                        ¡Tu pago ha sido procesado exitosamente!
                      </Typography>
                      <Typography variant="body2">
                        Puedes ver el estado de tu pedido en la sección "Mis Pedidos" o continuar comprando.
                      </Typography>
                    </Alert>
                  )}

                  {/* Métodos de pago disponibles */}
                  <Stack spacing={2}>
                    <AnimatePresence>
                      {availableMethods.map((method) => {
                        const isSelected = selectedMethodId === method.id
                        const fees = getMethodFees(method.id, orderData.total)

                        return (
                          <PaymentMethodCard
                            key={method.id}
                            method={method}
                            isSelected={isSelected}
                            onSelect={handleMethodSelect}
                            fees={fees}
                            formatPrice={checkoutService.formatPrice}
                          />
                        )
                      })}
                    </AnimatePresence>
                  </Stack>

                  {/* Errores de validación */}
                  {Object.keys(validationErrors).length > 0 && (
                    <Alert severity="error" sx={{ mt: 3 }}>
                      {Object.values(validationErrors).join('. ')}
                    </Alert>
                  )}

                  {/* Error general */}
                  {error && (
                    <Alert severity="error" sx={{ mt: 3 }}>
                      {error}
                    </Alert>
                  )}
                </Paper>
              </motion.div>
            </Box>

            {/* Panel derecho - Resumen */}
            <Box sx={{ width: { xs: '100%', lg: '400px' } }}>
              <motion.div variants={itemVariants}>
                <CheckoutSummary
                  orderData={orderData}
                  selectedMethod={selectedMethod}
                  onContinue={handleContinue}
                  onBack={handleBack}
                  isProcessing={isProcessing}
                  canContinue={!!selectedMethodId && !!selectedMethod && !isValidating && Object.keys(validationErrors).length === 0}
                  isCompleted={isCompleted}
                  onViewOrders={handleViewOrders}
                  onContinueShopping={handleContinueShopping}
                />
              </motion.div>
            </Box>
          </Stack>
        </Box>
      </motion.div>
    </Box>
  )
}

export default PaymentMethodSelector
