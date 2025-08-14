// ============================================================================
// PAYMENT METHOD SELECTOR - VERSIÓN FINAL
// ============================================================================

import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Stack,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
} from '@mui/material';
import { 
  ArrowBack as ArrowBackIcon,
  CreditCard as CreditCardIcon 
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

// Hooks y servicios
import { useCheckout, usePaymentMethods } from '../hooks';
import checkoutService from '../services/checkoutService'; // Corregido
import { trackUserAction } from '../../../services/security';
import { calculatePriceForQuantity } from '../../../utils/priceCalculation';

// Componentes UI
import CheckoutSummary from './CheckoutSummary';
import PaymentMethodCard from '../../../shared/components/modals/PaymentMethodCard';
import { CheckoutProgressStepper } from '../../../shared/components/navigation';

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

const PaymentMethodSelector = () => {
  const navigate = useNavigate();

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
    failPayment,
  } = useCheckout();

  // Estados de métodos de pago
  const {
    availableMethods,
    selectedMethod,
    selectMethod,
    validateMethod,
    isValidating,
    validationErrors,
    getMethodFees,
  } = usePaymentMethods();

  // Estado local
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedMethodId, setSelectedMethodId] = useState(null);
  const [isCompleted, setIsCompleted] = useState(false);

  // ===== EFECTOS =====

  useEffect(() => {
    if (!orderData.items || orderData.items.length === 0) {
      navigate('/buyer/cart', { replace: true });
      return;
    }
    clearError();
  }, [orderData, navigate, clearError]);

  // ===== HANDLERS =====

  const handleMethodSelect = async methodId => {
    try {
      setSelectedMethodId(methodId);
      selectMethod(methodId);
      const isValid = await validateMethod(methodId, orderData.total);
      if (isValid) {
        selectPaymentMethod(availableMethods.find(m => m.id === methodId));
        const currentSelectedMethod = availableMethods.find(
          m => m.id === methodId
        );
        await trackUserAction(
          `payment_method_selected_${currentSelectedMethod?.name || methodId}`
        );
        clearError();
      }
    } catch (error) {
      console.error('Error selecting payment method:', error);
      setError('Error al seleccionar método de pago');
    }
  };

  const handleBack = () => {
    previousStep();
    navigate('/buyer/cart');
  };

  const handleViewOrders = () => {
    navigate('/buyer/orders');
  };

  const handleContinueShopping = () => {
    navigate('/buyer/marketplace');
  };

  const handleContinue = async () => {
    if (!selectedMethod) {
      toast.error('Debe seleccionar un método de pago');
      return;
    }
    setIsProcessing(true);
    try {
      const userId = localStorage.getItem('user_id');
      const userEmail = localStorage.getItem('user_email');
      if (!userId) {
        throw new Error('Usuario no autenticado');
      }

      const validation = checkoutService.validateCheckoutData({
        ...orderData,
        paymentMethod: selectedMethod.id,
        userId: userId,
      });

      if (!validation.isValid) {
        const errorMessage = Object.values(validation.errors).join(', ');
        throw new Error(errorMessage);
      }

      startPaymentProcessing();

      // Calcular el total exactamente igual que en CheckoutSummary.jsx
      const getItemPrice = item => {
        if (item.price_tiers && item.price_tiers.length > 0) {
          const basePrice =
            item.originalPrice ||
            item.precioOriginal ||
            item.price ||
            item.precio ||
            0;
          return calculatePriceForQuantity(
            item.quantity,
            item.price_tiers,
            basePrice
          );
        }
        return item.price || 0;
      };
      const totalBruto = orderData.items.reduce((total, item) => {
        const unitPrice = getItemPrice(item);
        const quantity = item.quantity || 0;
        return total + quantity * unitPrice;
      }, 0);
      const calculatedIva = Math.trunc(totalBruto * 0.19);
      const calculatedSubtotal = Math.trunc(totalBruto) - calculatedIva;
      const shippingCost = orderData.shipping || 0;
      const orderTotal = Math.round(
        calculatedSubtotal + calculatedIva + shippingCost
      );

      const itemsWithDocType = (orderData.items || []).map(it => {
        const raw = it.document_type || it.documentType;
        const norm = raw ? ['boleta','factura'].includes(String(raw).toLowerCase()) ? String(raw).toLowerCase() : 'ninguno' : 'ninguno';
        return { ...it, document_type: norm, documentType: norm };
      });

      const order = await checkoutService.createOrder({
        userId: userId,
        items: itemsWithDocType,
        subtotal: orderData.subtotal,
        tax: orderData.tax,
        shipping: orderData.shipping,
        total: orderTotal, // Guardar el mismo total en la orden
        currency: orderData.currency || 'CLP',
        paymentMethod: selectedMethod.id,
        shippingAddress: orderData.shippingAddress,
        billingAddress: orderData.billingAddress,
      });

      console.log('[PaymentMethodSelector] Orden creada:', order);

      if (selectedMethod.id === 'khipu') {
        console.log('[PaymentMethodSelector] Procesando pago con Khipu...');
        const paymentResult = await checkoutService.processKhipuPayment({
          orderId: order.id,
          userId: userId,
          userEmail: userEmail || '',
          amount: orderTotal, // Usar el mismo valor mostrado
          currency: orderData.currency || 'CLP',
          items: itemsWithDocType,
        });

        if (paymentResult.success && paymentResult.paymentUrl) {
          console.log(
            '[PaymentMethodSelector] Redirigiendo a Khipu:',
            paymentResult.paymentUrl
          );
          toast.success('Redirigiendo a Khipu para completar el pago...');
          setTimeout(() => {
            window.location.href = paymentResult.paymentUrl;
          }, 1500);
        } else {
          throw new Error('Error al crear orden de pago en Khipu');
        }
      } else {
        throw new Error('Método de pago no implementado aún');
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      setError(error.message);
      toast.error(error.message);
      failPayment(error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // ===== ANIMACIONES =====

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.3 },
    },
  };

  // ===== RENDERIZADO (COMPLETO) =====

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      {/* Header */}
      <Box sx={{ mb: 4, px: 3 }}>
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
          <Tooltip title="Volver" arrow>
            <IconButton onClick={handleBack} sx={{ p: 1 }}>
              <ArrowBackIcon />
            </IconButton>
          </Tooltip>
          <CreditCardIcon sx={{ color: 'primary.main', fontSize: 32, mr: 1 }} />
          <Typography variant="h4" fontWeight="bold">
            <span style={{ color: '#1976d2' }}>Método de Pago</span>
          </Typography>
        </Stack>

        {/* Stepper de progreso */}
        <Box
          sx={{
            maxWidth: { xs: 340, sm: 480, md: 700, lg: 1360, xl: 1560 },
            width: '100%',
            display: 'flex',
            justifyContent: 'flex-start',
          }}
        >
          <CheckoutProgressStepper
            currentStep={currentStep}
            completedSteps={completedSteps}
            orientation="horizontal"
            showLabels={true}
          />
        </Box>
      </Box>

      {/* Contenido principal */}
      <Box sx={{ px: 3 }}>
        <Stack direction={{ xs: 'column', lg: 'row' }} spacing={4}>
          {/* Panel izquierdo - Métodos de pago */}
          <Box sx={{ width: { xs: '100%', md: '68%', lg: '65%', xl: '65%' } }}>
            <motion.div variants={itemVariants}>
              <Paper
                elevation={3}
                sx={{
                  p: 4,
                  borderRadius: 3,
                  background:
                    'linear-gradient(135deg, #ffffff 0%, #f8f9ff 100%)',
                  border: '1px solid rgba(102, 126, 234, 0.1)',
                }}
              >
                <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }}>
                  {isCompleted
                    ? '¡Pago Completado!'
                    : 'Selecciona tu método de pago'}
                </Typography>

                {isCompleted && (
                  <Alert severity="success" sx={{ mb: 3 }}>
                    <Typography variant="body1" fontWeight="bold">
                      ¡Tu pago ha sido procesado exitosamente!
                    </Typography>
                    <Typography variant="body2">
                      Puedes ver el estado de tu pedido en la sección "Mis
                      Pedidos" o continuar comprando.
                    </Typography>
                  </Alert>
                )}

                {/* Métodos de pago disponibles */}
                <Stack spacing={2}>
                  <AnimatePresence>
                    {availableMethods.map(method => {
                      const isSelected = selectedMethodId === method.id;
                      const fees = getMethodFees(method.id, orderData.total);
                      return (
                        <PaymentMethodCard
                          key={method.id}
                          method={method}
                          isSelected={isSelected}
                          onSelect={handleMethodSelect}
                          fees={fees}
                          formatPrice={checkoutService.formatPrice}
                        />
                      );
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
                canContinue={
                  !!selectedMethodId &&
                  !!selectedMethod &&
                  !isValidating &&
                  Object.keys(validationErrors).length === 0
                }
                isCompleted={isCompleted}
                onViewOrders={handleViewOrders}
                onContinueShopping={handleContinueShopping}
              />
            </motion.div>
          </Box>
        </Stack>
      </Box>
    </motion.div>
  );
};

export default PaymentMethodSelector;
