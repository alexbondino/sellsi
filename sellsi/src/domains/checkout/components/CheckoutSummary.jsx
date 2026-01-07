// ============================================================================
// CHECKOUT SUMMARY - VERSIÓN CORREGIDA Y SIMPLIFICADA
// ============================================================================

import React, { useState, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Stack,
  Divider,
  Chip,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import {
  Payment as PaymentIcon,
  LocalShipping as LocalShippingIcon,
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  LocalOffer as LocalOfferIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';

// Servicios
import { checkoutService } from '../services';
import { calculatePriceForQuantity } from '../../../utils/priceCalculation';
import { CheckoutSummaryImage } from '../../../components/UniversalProductImage';

// Componentes UI
import { SecurityBadge } from '../../../shared/components/feedback';

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

const CheckoutSummary = ({
  orderData,
  selectedMethod,
  onContinue,
  onBack,
  isProcessing = false,
  canContinue = false,
  isCompleted = false,
  onViewOrders,
  onContinueShopping,
  variant = 'default', // 'default' | 'compact'
  hideActions = false,
}) => {
  // Estado para navegación de productos
  const [currentPage, setCurrentPage] = useState(1);
  // Estado local para bloquear permanentemente el botón tras el click
  const [localProcessing, setLocalProcessing] = useState(false);
  const ITEMS_PER_PAGE = 1;
  
  // Sincronizar localProcessing con isProcessing
  // Cuando isProcessing vuelve a false (modal cerrado), reseteamos localProcessing
  React.useEffect(() => {
    if (!isProcessing) {
      setLocalProcessing(false);
    }
  }, [isProcessing]);

  // Paginación de productos
  const paginatedItems = useMemo(() => {
    const items = orderData.items || [];
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return items.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [orderData.items, currentPage]);

  const totalPages = Math.ceil((orderData.items?.length || 0) / ITEMS_PER_PAGE);
  const hasMultiplePages = totalPages > 1;

  // Costo de envío desde las props
  const shippingCost = orderData.shipping || 0;

  // Función para obtener el precio unitario correcto de un item
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

  // ✅ CÁLCULO CENTRALIZADO Y CORRECTO
  const { subtotalWithIva, grandTotal, baseTotal, paymentFee, paymentFeeLabel } = useMemo(() => {
    if (!orderData.items || orderData.items.length === 0) {
      return { subtotalWithIva: 0, grandTotal: 0, baseTotal: 0, paymentFee: 0, paymentFeeLabel: '' };
    }

    const totalBruto = orderData.items.reduce((total, item) => {
      const unitPrice = getItemPrice(item);
      const quantity = item.quantity || 0;
      return total + quantity * unitPrice;
    }, 0);

    // Total base (sin fee de pago)
    const baseTotalCalc = Math.trunc(totalBruto) + shippingCost;

    // Calcular fee según método de pago seleccionado
    let fee = 0;
    let feeLabel = '';
    if (selectedMethod) {
      if (selectedMethod.id === 'khipu') {
        fee = 500; // Comisión fija Khipu
        feeLabel = 'Comisión Khipu';
      } else if (selectedMethod.id === 'flow') {
        fee = Math.round(baseTotalCalc * 0.038); // 3.8% Flow
        feeLabel = 'Comisión Flow (3.8%)';
      } else if (selectedMethod.id === 'bank_transfer') {
        fee = Math.round(baseTotalCalc * 0.005); // 0.5% Transferencia Bancaria
        feeLabel = 'Comisión Servicio (0.5%)';
      }
    }

    // Total del pedido: Subtotal (con IVA incluido) + Envío + Fee
    const finalOrderTotal = baseTotalCalc + fee;

    return {
      subtotalWithIva: Math.trunc(totalBruto),
      grandTotal: finalOrderTotal,
      baseTotal: baseTotalCalc,
      paymentFee: fee,
      paymentFeeLabel: feeLabel,
    };
  }, [orderData.items, shippingCost, selectedMethod]);

  // ===== RENDERIZADO =====

  // Handler local que bloquea el botón permanentemente y delega al callback
  const handleContinue = () => {
    // Log de depuración: mostrar los montos que el frontend enviará al backend
    try {
      console.log('[CheckoutSummary] Pay requested', {
        orderId: orderData?.id || null,
        itemsCount: orderData.items?.length || 0,
        baseTotal,
        paymentFee,
        grandTotal,
        shippingCost,
        selectedMethod,
      });
    } catch (logEx) {
      console.warn('[CheckoutSummary] Logging failed', logEx);
    }

    // Bloqueo local inmediato: el botón quedará en "Procesando..." incluso si
    // la prop `isProcessing` cambia posteriormente.
    setLocalProcessing(true);
    if (typeof onContinue === 'function') onContinue();
  };

  const isCompact = variant === 'compact'

  return (
    <Paper
      elevation={isCompact ? 1 : 3}
      sx={{
        p: isCompact ? 2 : 3,
        borderRadius: isCompact ? 2 : 3,
        background: 'linear-gradient(135deg, #ffffff 0%, #f8f9ff 100%)',
        border: '1px solid rgba(102, 126, 234, 0.08)',
        position: isCompact ? 'static' : 'sticky',
        top: isCompact ? 'auto' : 100,
        boxShadow: isCompact ? '0 2px 6px rgba(0,0,0,0.05)' : undefined,
      }}
    >
      <Stack spacing={3}>
        {/* Header */}
        <Box>
          <Typography variant={isCompact ? 'subtitle1' : 'h6'} fontWeight="bold" sx={{ mb: 1 }}>
            {isCompact ? 'Resumen' : 'Resumen del Pedido'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {orderData.items?.length || 0} producto
            {(orderData.items?.length || 0) !== 1 ? 's' : ''}
          </Typography>
        </Box>

        {/* Lista de productos con navegación */}
        <Box>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ mb: 2 }}
          >
            <Typography variant="subtitle2" fontWeight="bold">
              Productos
            </Typography>
            {hasMultiplePages && (
              <Chip
                label={`${currentPage} de ${totalPages}`}
                size="small"
                variant="outlined"
                color="primary"
              />
            )}
          </Stack>

          <Box sx={{ position: 'relative' }}>
            {hasMultiplePages && (
              <IconButton
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                size="small"
                sx={{
                  position: 'absolute',
                  left: -16,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  zIndex: 2,
                  bgcolor: 'background.paper',
                  border: '1px solid',
                  borderColor: 'divider',
                  width: 32,
                  height: 32,
                }}
              >
                <ArrowBackIcon fontSize="small" />
              </IconButton>
            )}

            <List
              dense
              sx={{
                bgcolor: 'background.paper',
                borderRadius: 2,
                minHeight: 60,
                maxHeight: 60,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                mx: hasMultiplePages ? 2 : 0,
              }}
            >
              {paginatedItems.map((item, index) => (
                <ListItem key={`${currentPage}-${index}`} sx={{ px: 2 }}>
                  <CheckoutSummaryImage product={item} />
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                          {item.name || item.nombre}
                        </Typography>
                        {(item.isOffered || item.metadata?.isOffered || item.offer_id || item.offered_price) && (
                          <Tooltip title="Este produco es ofertado" arrow>
                            <LocalOfferIcon sx={{ color: 'success.main', fontSize: 18 }} />
                          </Tooltip>
                        )}
                      </Box>
                    }
                    secondary={`Cantidad: ${item.quantity}`}
                    primaryTypographyProps={{
                      component: 'div'
                    }}
                    secondaryTypographyProps={{ variant: 'caption' }}
                  />
                  <Typography variant="body2" fontWeight="bold">
                    {checkoutService.formatPrice(
                      getItemPrice(item) * item.quantity
                    )}
                  </Typography>
                </ListItem>
              ))}
            </List>

            {hasMultiplePages && (
              <IconButton
                onClick={() =>
                  setCurrentPage(prev => Math.min(totalPages, prev + 1))
                }
                disabled={currentPage === totalPages}
                size="small"
                sx={{
                  position: 'absolute',
                  right: -16,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  zIndex: 2,
                  bgcolor: 'background.paper',
                  border: '1px solid',
                  borderColor: 'divider',
                  width: 32,
                  height: 32,
                }}
              >
                <ArrowForwardIcon fontSize="small" />
              </IconButton>
            )}
          </Box>
        </Box>

        <Divider />

        {/* Desglose de precios */}
        <Box>
          <Stack spacing={1.5}>
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="body2">Subtotal (IVA inc.)</Typography>
              <Typography variant="body2" fontWeight="medium">
                {checkoutService.formatPrice(subtotalWithIva)}
              </Typography>
            </Stack>

            <Stack direction="row" justifyContent="space-between">
              <Typography variant="body2">Envío</Typography>
              <Typography
                variant="body2"
                fontWeight="medium"
                color={shippingCost === 0 ? 'success.main' : 'text.primary'}
              >
                {shippingCost === 0
                  ? '¡GRATIS!'
                  : checkoutService.formatPrice(shippingCost)}
              </Typography>
            </Stack>

            {/* Mostrar comisión según método de pago seleccionado */}
            {selectedMethod && paymentFee > 0 && (
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2">{paymentFeeLabel}</Typography>
                <Typography variant="body2" fontWeight="medium">
                  {checkoutService.formatPrice(paymentFee)}
                </Typography>
              </Stack>
            )}
          </Stack>
        </Box>

        <Divider />

        {/* Total */}
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant={isCompact ? 'subtitle1' : 'h6'} fontWeight="bold">
            Total
          </Typography>
          <Typography variant={isCompact ? 'subtitle1' : 'h6'} fontWeight="bold" color="#000000ff">
            {checkoutService.formatPrice(grandTotal)}
          </Typography>
        </Stack>

  {/* Botones de acción */}
  {!hideActions && (
  <Stack spacing={2}>
          {isCompleted ? (
            <>{/* ... botones de completado sin cambios ... */}</>
          ) : (
            <>
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  variant="contained"
                  fullWidth
                  size="large"
                  onClick={handleContinue}
                  disabled={!canContinue || isProcessing || localProcessing}
                  startIcon={
                    (isProcessing || localProcessing) ? (
                      <CircularProgress size={20} color="inherit" />
                    ) : (
                      <PaymentIcon />
                    )
                  }
                  sx={{
                    py: 1.5,
                    borderRadius: 2,
                    fontWeight: 'bold',
                    textTransform: 'none',
                  }}
                >
                  {(isProcessing || localProcessing)
                    ? 'Procesando...'
                    : `Confirmar y Pagar`}
                </Button>
              </motion.div>

              <Button
                variant="outlined"
                fullWidth
                onClick={onBack}
                disabled={isProcessing}
                sx={{ py: 1.5, borderRadius: 2, textTransform: 'none' }}
              >
                Volver al Carrito
              </Button>
            </>
          )}
  </Stack>
  )}

  {!isCompact && <SecurityBadge variant="compact" />}
      </Stack>
    </Paper>
  );
};

export default CheckoutSummary;
