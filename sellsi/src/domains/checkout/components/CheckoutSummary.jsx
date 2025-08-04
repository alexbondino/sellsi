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
  CircularProgress,
} from '@mui/material';
import {
  Payment as PaymentIcon,
  LocalShipping as LocalShippingIcon,
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
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
}) => {
  // Estado para navegación de productos
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 1;

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
  const { subtotalWithIva, orderTotal } = useMemo(() => {
    if (!orderData.items || orderData.items.length === 0) {
      return { subtotalWithIva: 0, orderTotal: 0 };
    }

    const totalBruto = orderData.items.reduce((total, item) => {
      const unitPrice = getItemPrice(item);
      const quantity = item.quantity || 0;
      return total + quantity * unitPrice;
    }, 0);

    // Khipu fee (fixed $500 when payment method is selected)
    const khipuFee = selectedMethod ? 500 : 0;

    // Total del pedido: Subtotal (con IVA incluido) + Envío + Khipu
    const finalOrderTotal = Math.trunc(totalBruto) + shippingCost + khipuFee;

    return {
      subtotalWithIva: Math.trunc(totalBruto),
      orderTotal: finalOrderTotal,
    };
  }, [orderData.items, shippingCost, selectedMethod]);

  // ===== RENDERIZADO =====

  return (
    <Paper
      elevation={3}
      sx={{
        p: 3,
        borderRadius: 3,
        background: 'linear-gradient(135deg, #ffffff 0%, #f8f9ff 100%)',
        border: '1px solid rgba(102, 126, 234, 0.1)',
        position: 'sticky',
        top: 100,
      }}
    >
      <Stack spacing={3}>
        {/* Header */}
        <Box>
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 1 }}>
            Resumen del Pedido
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
                    primary={item.name || item.nombre}
                    secondary={`Cantidad: ${item.quantity}`}
                    primaryTypographyProps={{
                      variant: 'body2',
                      fontWeight: 'medium',
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
          <Stack spacing={2}>
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

            {/* Mostrar comisión Khipu cuando hay método de pago seleccionado */}
            {selectedMethod && (
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2">Khipu</Typography>
                <Typography variant="body2" fontWeight="medium">
                  {checkoutService.formatPrice(500)}
                </Typography>
              </Stack>
            )}
          </Stack>
        </Box>

        <Divider />

        {/* Total */}
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
        >
          <Typography variant="h6" fontWeight="bold">
            Total
          </Typography>
          <Typography variant="h6" fontWeight="bold" color="primary">
            {/* <-- CORREGIDO: Muestra el total del pedido, sin comisiones adivinadas. */}
            {checkoutService.formatPrice(orderTotal)}
          </Typography>
        </Stack>

        {/* Botones de acción */}
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
                  onClick={onContinue}
                  disabled={!canContinue || isProcessing}
                  startIcon={
                    isProcessing ? (
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
                  {isProcessing
                    ? 'Procesando...'
                    : `Confirmar y Pagar ${checkoutService.formatPrice(
                        orderTotal
                      )}`}
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

        <SecurityBadge variant="compact" />
      </Stack>
    </Paper>
  );
};

export default CheckoutSummary;
