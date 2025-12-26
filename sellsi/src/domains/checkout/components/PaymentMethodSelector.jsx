// ============================================================================
// PAYMENT METHOD SELECTOR - VERSIÓN FINAL
// ============================================================================

import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  CreditCard as CreditCardIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

// Hooks y servicios
import { useCheckout, usePaymentMethods } from '../hooks';
import checkoutService from '../services/checkoutService'; // Corregido
import { trackUserAction } from '../../../services/security';
import { calculatePriceForQuantity } from '../../../utils/priceCalculation';
import useCartStore from '../../../shared/stores/cart/cartStore';
import { useAuth } from '../../../infrastructure/providers/UnifiedAuthProvider';

// Componentes UI
import CheckoutSummary from './CheckoutSummary';
import PaymentMethodCard from '../../../shared/components/modals/PaymentMethodCard';
import { CheckoutProgressStepper } from '../../../shared/components/navigation';
import MobilePaymentLayout from './MobilePaymentLayout';

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

const PaymentMethodSelector = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { session } = useAuth();

  // ===== DETECCIÓN DE MOBILE =====
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

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
    currentStepId,
    currentStepOrder,
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

  // Refs para bloqueo inmediato anti-doble-click
  const isProcessingRef = useRef(false);
  const paymentSuccessRef = useRef(false);

  // ===== CÁLCULO BASE TOTAL (igual que CheckoutSummary) =====
  const baseTotal = useMemo(() => {
    if (!orderData.items || orderData.items.length === 0) return 0;

    const getItemPrice = item => {
      if (item.price_tiers && item.price_tiers.length > 0) {
        // ⚠️ CRÍTICO: Convertir a Number para evitar bypass con valores falsy
        const basePrice =
          Number(
            item.originalPrice ||
              item.precioOriginal ||
              item.price ||
              item.precio
          ) || 0;
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

    const shippingCost = orderData.shipping || 0;
    return Math.trunc(totalBruto) + shippingCost;
  }, [orderData.items, orderData.shipping]);

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
      // ✅ FIX: Validar con baseTotal (sin fee de pago) ya que el fee se agrega después
      // baseTotal es el total que se usa para calcular el fee del método de pago
      const isValid = await validateMethod(methodId, baseTotal);
      if (isValid) {
        selectPaymentMethod(availableMethods.find(m => m.id === methodId));
        const currentSelectedMethod = availableMethods.find(
          m => m.id === methodId
        );
        // Solo trackear si hay usuario autenticado
        if (session?.user?.id) {
          await trackUserAction(
            session.user.id,
            `payment_method_selected_${currentSelectedMethod?.name || methodId}`
          );
        }
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
    // Bloqueo inmediato con ref (no espera re-render de useState)
    if (isProcessingRef.current || paymentSuccessRef.current) {
      console.log(
        '[PaymentMethodSelector] Click ignorado - ya procesando o redirigiendo'
      );
      return;
    }
    isProcessingRef.current = true;

    if (!selectedMethod) {
      isProcessingRef.current = false;
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
      // Total BASE (sin fee Khipu). La comisión se aplicará en finalize_order_pricing (payment_fee + grand_total)
      const orderTotal = Math.round(
        calculatedSubtotal + calculatedIva + shippingCost
      );

      // Normalizar a un único campo document_type (alias legacy documentType eliminado en nuevos flujos)
      const itemsWithDocType = (orderData.items || []).map(it => {
        const raw = it.document_type || it.documentType;
        const norm =
          raw && ['boleta', 'factura'].includes(String(raw).toLowerCase())
            ? String(raw).toLowerCase()
            : 'ninguno';
        return { ...it, document_type: norm };
      });

      // Obtener cartId del store para vincular orden con carrito
      const cartId = useCartStore.getState().cartId;

      const order = await checkoutService.createOrder({
        userId: userId,
        items: itemsWithDocType,
        subtotal: orderData.subtotal,
        tax: orderData.tax,
        shipping: orderData.shipping,
        total: orderTotal, // Guardar el total base (server añadirá payment_fee y grand_total)
        currency: orderData.currency || 'CLP',
        paymentMethod: selectedMethod.id,
        shippingAddress: orderData.shippingAddress,
        billingAddress: orderData.billingAddress,
        cartId: cartId, // ✅ Vincular orden con carrito para limpieza server-side
      });

      console.log('[PaymentMethodSelector] Orden creada:', order);

      if (selectedMethod.id === 'khipu') {
        console.log('[PaymentMethodSelector] Procesando pago con Khipu...');
        // Usar el total que quedó persistido en la fila (server authoritative) si existe
        const authoritativeTotal =
          order && typeof order.total === 'number'
            ? Math.round(order.total)
            : orderTotal; // sigue siendo base total
        if (authoritativeTotal !== orderTotal) {
          console.log(
            '[PaymentMethodSelector] Diferencia entre order.total y orderTotal calculado front:',
            { authoritativeTotal, frontComputed: orderTotal }
          );
        }
        const paymentResult = await checkoutService.processKhipuPayment({
          orderId: order.id,
          userId: userId,
          userEmail: userEmail || '',
          amount: authoritativeTotal, // monto base; Edge usará grand_total (incluye fee) para cobrar
          currency: orderData.currency || 'CLP',
          items: itemsWithDocType,
          // ✔ Propagar direcciones para que no se pierdan en el pipeline de pago
          shippingAddress: orderData.shippingAddress || null,
          billingAddress: orderData.billingAddress || null,
        });

        if (paymentResult.success && paymentResult.paymentUrl) {
          // Marcar éxito ANTES del redirect para evitar reset en finally
          paymentSuccessRef.current = true;
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
      } else if (selectedMethod.id === 'flow') {
        console.log('[PaymentMethodSelector] Procesando pago con Flow...');
        const authoritativeTotal =
          order && typeof order.total === 'number'
            ? Math.round(order.total)
            : orderTotal;

        const paymentResult = await checkoutService.processFlowPayment({
          orderId: order.id,
          userId: userId,
          userEmail: userEmail || '',
          amount: authoritativeTotal,
          currency: orderData.currency || 'CLP',
          items: itemsWithDocType,
          shippingAddress: orderData.shippingAddress || null,
          billingAddress: orderData.billingAddress || null,
        });

        if (paymentResult.success && paymentResult.paymentUrl) {
          paymentSuccessRef.current = true;
          console.log(
            '[PaymentMethodSelector] Redirigiendo a Flow:',
            paymentResult.paymentUrl
          );
          toast.success('Redirigiendo a Flow para completar el pago...');
          setTimeout(() => {
            window.location.href = paymentResult.paymentUrl;
          }, 1500);
        } else {
          throw new Error('Error al crear orden de pago en Flow');
        }
      } else {
        throw new Error('Método de pago no implementado aún');
      }
    } catch (error) {
      console.error('Error processing payment:', error);

      // ⭐ MANEJO COMPLETO DE ERRORES DE VALIDACIÓN SQL
      const errorMessages = {
        MINIMUM_PURCHASE_VIOLATION:
          'No se cumple la compra mínima de uno o más proveedores.',
        MINIMUM_PURCHASE_NOT_MET:
          'No se cumple la compra mínima requerida por el proveedor.',
        INSUFFICIENT_STOCK: 'Stock insuficiente para uno o más productos.',
        PRODUCT_NOT_FOUND: 'Uno o más productos ya no están disponibles.',
        INVALID_ITEM: 'Hay items inválidos en el carrito.',
        INVALID_QUANTITY: 'La cantidad de uno o más productos es inválida.',
        INVALID_PRODUCT: 'Uno o más productos no tienen proveedor asignado.',
        INVALID_SUPPLIER: 'El proveedor de uno o más productos no existe.',
        INVALID_ORDER: 'La orden está vacía o es inválida.',
      };

      // Buscar mensaje de error conocido
      const knownError = Object.keys(errorMessages).find(key =>
        error.message?.includes(key)
      );

      if (knownError) {
        const userMessage = errorMessages[knownError];
        console.log(
          `[PaymentMethodSelector] Error de validación: ${knownError}`
        );

        // Todos los errores de validación redirigen al carrito para corrección
        toast.error(userMessage + ' Revisa tu carrito.');
        navigate('/buyer/cart');
        return;
      }

      // Detectar error de constraint duplicada por mensaje
      const isDuplicateOrder =
        error.message?.includes('uniq_orders_cart_pending') ||
        error.message?.includes('duplicate key');

      if (isDuplicateOrder) {
        console.log(
          '[PaymentMethodSelector] Orden duplicada detectada, redirigiendo a pedidos'
        );
        toast.info(
          'Ya tienes un pago en proceso para este carrito. Revisa tus pedidos.'
        );
        navigate('/buyer/orders');
        return;
      }

      // Error desconocido
      setError(error.message);
      toast.error(error.message);
      failPayment(error.message);
    } finally {
      setIsProcessing(false);
      // Solo resetear ref si NO hubo éxito (evita race condition con setTimeout del redirect)
      if (!paymentSuccessRef.current) {
        isProcessingRef.current = false;
      }
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

  // Derivar total para barra inferior (replicado del summary calculado allí) - simple fallback
  const totalForBar = orderData.total || 0;

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      {/* Layout condicional: móvil vs desktop */}
      {isMobile ? (
        <Box sx={{ width: '100%', maxWidth: '100%', px: 0, mx: 'auto' }}>
          <MobilePaymentLayout
            orderData={orderData}
            availableMethods={availableMethods}
            selectedMethodId={selectedMethodId}
            onMethodSelect={handleMethodSelect}
            onBack={handleBack}
            onContinue={handleContinue}
            isProcessing={isProcessing}
            formatPrice={checkoutService.formatPrice}
            // Pasar número de orden seguro al layout móvil
            currentStep={
              currentStepOrder ? currentStepOrder() : currentStep?.order || 2
            }
            totalSteps={3}
          />
        </Box>
      ) : (
        /* Layout desktop existente */
        <>
          {/* Header */}
          <Box sx={{ mb: { xs: 2.5, md: 4 }, px: { xs: 2, md: 3 } }}>
            <Stack
              direction="row"
              alignItems="center"
              spacing={2}
              sx={{ mb: 3 }}
            >
              <Tooltip title="Volver" arrow>
                <IconButton onClick={handleBack} sx={{ p: 1 }}>
                  <ArrowBackIcon />
                </IconButton>
              </Tooltip>
              <CreditCardIcon
                sx={{
                  color: 'primary.main',
                  fontSize: { xs: 26, md: 32 },
                  mr: 1,
                }}
              />
              <Typography
                variant={'h4'}
                fontWeight="bold"
                sx={{
                  fontSize: { xs: '1.45rem', sm: '1.55rem', md: '2.125rem' },
                }}
              >
                <span style={{ color: '#2E52B2' }}>Método de Pago</span>
              </Typography>
            </Stack>

            {/* Stepper de progreso */}
            <Box
              sx={{
                maxWidth: {
                  xs: 340,
                  sm: 480,
                  md: '100%',
                  lg: '100%',
                  xl: '100%',
                },
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
          <Box sx={{ px: { xs: 2, md: 3 }, pb: { xs: 10, md: 0 } }}>
            <Stack
              direction={{ xs: 'column', md: 'row', lg: 'row' }}
              spacing={{ xs: 3, md: 2, lg: 4 }}
            >
              {/* Panel izquierdo - Métodos de pago */}
              <Box
                sx={{
                  width: { xs: '100%' },
                  flexBasis: { xs: '100%', md: '65%', lg: '65%', xl: '65%' },
                  maxWidth: { xs: '100%', md: '65%', lg: '65%', xl: '65%' },
                }}
              >
                <motion.div variants={itemVariants}>
                  <Paper
                    elevation={3}
                    sx={{
                      p: { xs: 2, sm: 3, md: 4 },
                      borderRadius: { xs: 2, md: 3 },
                      background:
                        'linear-gradient(135deg, #ffffff 0%, #f8f9ff 100%)',
                      border: '1px solid rgba(102, 126, 234, 0.1)',
                    }}
                  >
                    <Typography
                      variant="h5"
                      fontWeight="bold"
                      sx={{
                        mb: 3,
                        fontSize: {
                          xs: '1.15rem',
                          sm: '1.25rem',
                          md: '1.5rem',
                        },
                      }}
                    >
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
                          const fees = getMethodFees(method.id, baseTotal);
                          return (
                            <PaymentMethodCard
                              key={method.id}
                              method={method}
                              isSelected={isSelected}
                              onSelect={handleMethodSelect}
                              fees={fees}
                              formatPrice={checkoutService.formatPrice}
                              baseTotal={baseTotal}
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
              <Box
                sx={{
                  width: { xs: '100%' },
                  flexBasis: { xs: '100%', md: '35%', lg: '35%', xl: '35%' },
                  maxWidth: { xs: '100%', md: '35%', lg: '35%', xl: '35%' },
                }}
              >
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
                    variant="default"
                  />
                </motion.div>
              </Box>
            </Stack>
          </Box>
        </>
      )}
    </motion.div>
  );
};

export default PaymentMethodSelector;
