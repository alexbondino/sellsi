// ============================================================================
// CHECKOUT SUCCESS - PÁGINA DE ÉXITO DESPUÉS DEL PAGO
// ============================================================================

import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  Stack,
  CircularProgress,
  Chip,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  ShoppingCart as ShoppingCartIcon,
  Receipt as ReceiptIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';

// Servicios
import { checkoutService } from '../services';
import useCartStore from '../../../shared/stores/cart/cartStore.js';
import { useOfferStore } from '../../../stores/offerStore.js';

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

const CheckoutSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { clearLocal, clearCart } = useCartStore();
  const { forceCleanCartOffers } = useOfferStore();

  // Estados
  const [isVerifying, setIsVerifying] = useState(true);
  const [verificationError, setVerificationError] = useState(null);
  const [paymentData, setPaymentData] = useState(null);
  const [redirectTimeout, setRedirectTimeout] = useState(null);

  const completedStatuses = new Set(['done', 'paid', 'completed', 'success']);
  const pendingStatuses = new Set([
    'pending',
    'processing',
    'in_progress',
    'authorized',
    'warning',
    'continue',
    'unknown',
  ]);
  const failedStatuses = new Set(['failed', 'rejected', 'cancelled', 'canceled', 'error']);

  // Obtener parámetros de la URL de retorno de Khipu
  const paymentId = searchParams.get('payment_id');
  const transactionId = searchParams.get('transaction_id');

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        if (!paymentId) {
          throw new Error('ID de pago no encontrado');
        }

        console.log('[CheckoutSuccess] Verificando pago:', {
          paymentId,
          transactionId,
        });

        // Verificar estado del pago con Khipu
        const verification = await checkoutService.verifyKhipuPaymentStatus(
          paymentId
        );

        const normalizedStatus = String(verification.status || '').toLowerCase().trim() || 'unknown';

        if (completedStatuses.has(normalizedStatus)) {
          // Pago completado exitosamente
          setPaymentData({
            paymentId: verification.paymentId,
            transactionId: verification.transactionId,
            amount: verification.amount,
            currency: verification.currency,
            paidAt: verification.paidAt,
            status: 'completed',
          });

          // Limpiar el carrito correctamente (estado + persistencia)
          try {
            await clearCart(); // intenta limpiar (maneja backend si aplica)
          } catch (e) {
            // fallback local si falla backend
            clearLocal();
          }
          clearLocal(); // asegurar localStorage limpio
          
          // Limpiar ofertas finalizadas/pagadas del carrito (después de la limpieza general)
          try {
            forceCleanCartOffers();
          } catch (e) {
            console.warn('Error limpiando ofertas del carrito:', e);
          }

          toast.success('¡Pago completado exitosamente!');

          // Redirigir automáticamente a Mis Pedidos después de 3 segundos
          const timeout = setTimeout(() => {
            navigate('/buyer/orders');
          }, 3000);
          setRedirectTimeout(timeout);
        } else if (pendingStatuses.has(normalizedStatus) || !verification.success) {
          // Pago aún pendiente - TAMBIÉN limpiar carrito para prevenir compras duplicadas
          // El webhook ya habrá procesado el pago cuando cambie a 'paid'
          setPaymentData({
            paymentId: verification.paymentId,
            transactionId: verification.transactionId,
            status: 'pending',
          });

          // Limpiar el carrito incluso en pending para evitar que el usuario
          // vuelva a comprar los mismos productos mientras el pago se procesa
          try {
            await clearCart();
          } catch (e) {
            clearLocal();
          }
          clearLocal();
          
          // Limpiar ofertas también
          try {
            forceCleanCartOffers();
          } catch (e) {
            console.warn('Error limpiando ofertas del carrito:', e);
          }

          toast('Tu pago fue recibido y está siendo confirmado. Esto puede tardar unos minutos.', {
            icon: '⏳',
          });
        } else if (failedStatuses.has(normalizedStatus)) {
          throw new Error('El pago fue rechazado o cancelado');
        } else {
          // Cualquier estado inesperado se trata como pendiente para evitar falsos negativos.
          setPaymentData({
            paymentId: verification.paymentId,
            transactionId: verification.transactionId,
            status: 'pending',
          });
          toast('Estamos validando tu pago. Revisa Mis Pedidos en unos minutos.', {
            icon: '⏳',
          });
        }
      } catch (error) {
        console.error('[CheckoutSuccess] Error verificando pago:', error);
        setVerificationError(error.message);
        toast.error(error.message);
      } finally {
        setIsVerifying(false);
      }
    };

    verifyPayment();

    // Limpiar timeout si el componente se desmonta
    return () => {
      if (redirectTimeout) clearTimeout(redirectTimeout);
    };
  }, [paymentId, transactionId, clearCart, clearLocal, navigate]);

  const handleViewOrders = () => {
    navigate('/buyer/orders');
  };

  const handleContinueShopping = () => {
    navigate('/buyer/marketplace');
  };

  const handleGoHome = () => {
    navigate('/buyer/marketplace');
  };

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
            background: '#ffffff',
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
    );
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
            background: '#ffffff',
          }}
        >
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 1 }}>
            No pudimos confirmar el pago inmediatamente
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {verificationError || 'La confirmación puede tardar algunos minutos. Tu pago puede estar en proceso de validación.'}
          </Typography>

          <Stack spacing={2}>
            <Button
              variant="contained"
              onClick={handleViewOrders}
              sx={{ borderRadius: 2 }}
            >
              Ver Mis Pedidos
            </Button>

            <Button
              variant="outlined"
              onClick={() => window.location.reload()}
              sx={{ borderRadius: 2 }}
            >
              Reintentar verificación
            </Button>
          </Stack>
        </Paper>
      </Container>
    );
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
            background: '#ffffff',
          }}
        >
          {/* Icono de estado */}
          <Box sx={{ mb: 3 }}>
            {paymentData?.status === 'completed' ? (
              <CheckCircleIcon sx={{ fontSize: 80, color: 'success.main' }} />
            ) : (
              <CircularProgress size={60} sx={{ color: 'primary.main' }} />
            )}
          </Box>

          {/* Título */}
          <Typography variant="h4" fontWeight="bold" sx={{ mb: 2 }}>
            {paymentData?.status === 'completed'
              ? '¡Pago Completado!'
              : 'Pago en Validación'}
          </Typography>

          {/* Descripción */}
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            {paymentData?.status === 'completed'
              ? 'Tu pago ha sido procesado exitosamente. Recibirás un email de confirmación en breve.'
              : 'Tu transferencia fue recibida y está siendo validada por Khipu. Puedes revisar el estado en Mis Pedidos.'}
          </Typography>

          {/* Información del pago */}
          {paymentData && (
            <Box sx={{ mb: 3 }}>
              <Stack
                spacing={2}
                sx={{ textAlign: 'left', maxWidth: 400, mx: 'auto' }}
              >
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
                      {checkoutService.formatPrice(
                        paymentData.amount,
                        paymentData.currency
                      )}
                    </Typography>
                  </Box>
                )}

                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Estado
                  </Typography>
                  <Box sx={{ mt: 0.5 }}>
                    <Chip
                      label={
                        paymentData.status === 'completed'
                          ? 'Completado'
                          : 'En validación'
                      }
                      color={
                        paymentData.status === 'completed'
                          ? 'success'
                          : 'primary'
                      }
                      variant="filled"
                      sx={{
                        fontWeight: 700,
                        fontSize: '0.8rem',
                        letterSpacing: '0.03em',
                        px: 1.5,
                        height: 32,
                        minWidth: 120,
                        borderRadius: '8px',
                      }}
                    />
                  </Box>
                </Box>
              </Stack>
            </Box>
          )}

          {/* Botones de acción */}
          <Stack spacing={2}>
            <Button
              variant="contained"
              onClick={handleViewOrders}
              startIcon={<ReceiptIcon />}
              sx={{
                py: 1.5,
                borderRadius: 2,
                fontWeight: 'bold',
                textTransform: 'none',
              }}
            >
              Ver Mis Pedidos
            </Button>

            <Button
              variant="outlined"
              onClick={handleContinueShopping}
              startIcon={<ShoppingCartIcon />}
              sx={{
                py: 1.5,
                borderRadius: 2,
                textTransform: 'none',
              }}
            >
              Continuar Comprando
            </Button>
          </Stack>
        </Paper>
      </motion.div>
    </Container>
  );
};

export default CheckoutSuccess;
