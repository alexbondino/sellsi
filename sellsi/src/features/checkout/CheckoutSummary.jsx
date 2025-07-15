// ============================================================================
// CHECKOUT SUMMARY - RESUMEN DEL PEDIDO EN CHECKOUT
// ============================================================================

import React, { useState, useMemo } from 'react'
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
  ListItemAvatar,
  Avatar,
  CircularProgress,
  IconButton,
  Pagination
} from '@mui/material'
import {
  ShoppingCart as ShoppingCartIcon,
  Payment as PaymentIcon,
  Security as SecurityIcon,
  LocalShipping as LocalShippingIcon,
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon
} from '@mui/icons-material'
import { motion } from 'framer-motion'

// Servicios
import checkoutService from './services/checkoutService'
import { calculatePriceForQuantity } from '../../utils/priceCalculation'
import { useMinithumb } from '../../hooks/useResponsiveThumbnail' // Hook para minithumb

// Componentes UI
import SecurityBadge from '../ui/SecurityBadge'

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

// Componente optimizado para avatares de productos con minithumb
const ProductAvatar = ({ item }) => {
  const minithumbUrl = useMinithumb(item);
  
  return (
    <Avatar
      src={minithumbUrl}
      alt={item.name || item.nombre}
      sx={{ width: 40, height: 40 }}
    >
      <ShoppingCartIcon />
    </Avatar>
  );
};

const CheckoutSummary = ({
  orderData,
  selectedMethod,
  onContinue,
  onBack,
  isProcessing = false,
  canContinue = false,
  isCompleted = false,
  onViewOrders,
  onContinueShopping
}) => {
  
  // ===== ESTADO PARA VIRTUALIZACIÓN =====
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 2
  
  // ===== CÁLCULOS =====
  
  // Paginación de productos
  const paginatedItems = useMemo(() => {
    const items = orderData.items || []
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    const endIndex = startIndex + ITEMS_PER_PAGE
    return items.slice(startIndex, endIndex)
  }, [orderData.items, currentPage])
  
  const totalPages = Math.ceil((orderData.items?.length || 0) / ITEMS_PER_PAGE)
  const hasMultiplePages = totalPages > 1
  
  // Función para calcular el precio correcto de un item (con tramos si los tiene)
  const getItemPrice = (item) => {
    if (item.price_tiers && item.price_tiers.length > 0) {
      const basePrice = item.originalPrice || item.precioOriginal || item.price || item.precio || 0
      return calculatePriceForQuantity(item.quantity, item.price_tiers, basePrice)
    }
    return item.price || 0
  }
  
  const fees = selectedMethod 
    ? checkoutService.formatPrice(
        (orderData.subtotal * (selectedMethod.fees?.percentage || 0)) / 100 + (selectedMethod.fees?.fixed || 0)
      )
    : checkoutService.formatPrice(0)

  const totalWithFees = selectedMethod
    ? orderData.subtotal + orderData.tax + orderData.shipping + ((orderData.subtotal * (selectedMethod.fees?.percentage || 0)) / 100 + (selectedMethod.fees?.fixed || 0))
    : orderData.subtotal + orderData.tax + orderData.shipping

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
        top: 100
      }}
    >
      <Stack spacing={3}>
        {/* Header */}
        <Box>
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 1 }}>
            Resumen del Pedido
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {orderData.items?.length || 0} producto{(orderData.items?.length || 0) !== 1 ? 's' : ''}
          </Typography>
        </Box>

        {/* Lista de productos virtualizada */}
        <Box>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
            <Typography variant="subtitle2" fontWeight="bold">
              Productos
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              {hasMultiplePages && (
                <Chip 
                  label={`${currentPage} de ${totalPages}`} 
                  size="small" 
                  variant="outlined"
                  color="primary"
                />
              )}
              {/* Controles de navegación movidos arriba */}
              {hasMultiplePages && (
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <IconButton 
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    size="small"
                    sx={{ width: 32, height: 32 }}
                  >
                    <ArrowBackIcon fontSize="small" />
                  </IconButton>
                  
                  <IconButton 
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    size="small"
                    sx={{ width: 32, height: 32 }}
                  >
                    <ArrowForwardIcon fontSize="small" />
                  </IconButton>
                </Stack>
              )}
            </Stack>
          </Stack>
          
          <List dense sx={{ 
            bgcolor: 'background.paper', 
            borderRadius: 2, 
            minHeight: 72,
            maxHeight: 72,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start'
          }}>
            {paginatedItems.map((item, index) => (
              <ListItem key={`${currentPage}-${index}`} sx={{ px: 2 }}>
                <ListItemAvatar>
                  <ProductAvatar item={item} />
                </ListItemAvatar>
                <ListItemText
                  primary={item.name || item.nombre}
                  secondary={`Cantidad: ${item.quantity}`}
                  primaryTypographyProps={{ variant: 'body2', fontWeight: 'medium' }}
                  secondaryTypographyProps={{ variant: 'caption' }}
                />
                <Typography variant="body2" fontWeight="bold">
                  {checkoutService.formatPrice(getItemPrice(item) * item.quantity)}
                </Typography>
              </ListItem>
            ))}
          </List>
        </Box>

        <Divider />

        {/* Desglose de precios */}
        <Box>
          <Stack spacing={2}>
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="body2">Subtotal</Typography>
              <Typography variant="body2" fontWeight="medium">
                {checkoutService.formatPrice(orderData.subtotal)}
              </Typography>
            </Stack>
            
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="body2">IVA (19%)</Typography>
              <Typography variant="body2" fontWeight="medium">
                {checkoutService.formatPrice(orderData.tax)}
              </Typography>
            </Stack>
            
            {/* Comisión por servicio (2%) eliminada */}
            
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="body2">Envío</Typography>
              <Typography 
                variant="body2" 
                fontWeight="medium"
                color={orderData.shipping === 0 ? 'success.main' : 'text.primary'}
              >
                {orderData.shipping === 0 ? '¡GRATIS!' : checkoutService.formatPrice(orderData.shipping)}
              </Typography>
            </Stack>

            {selectedMethod && selectedMethod.fees && (selectedMethod.fees.percentage > 0 || selectedMethod.fees.fixed > 0) && (
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2">Comisión ({selectedMethod.name})</Typography>
                <Typography variant="body2" fontWeight="medium">
                  {fees}
                </Typography>
              </Stack>
            )}
          </Stack>
        </Box>

        <Divider />

        {/* Total */}
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" fontWeight="bold">
            Total a Pagar
          </Typography>
          <Typography variant="h6" fontWeight="bold" color="primary">
            {checkoutService.formatPrice(totalWithFees)}
          </Typography>
        </Stack>


        {/* Información de envío */}
        <Box sx={{ p: 2, bgcolor: 'info.50', borderRadius: 2 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <LocalShippingIcon color="info" fontSize="small" />
            <Typography variant="body2" color="info.main">
              Los productos se mantendrán en tu carrito hasta completar el pago
            </Typography>
          </Stack>
        </Box>

        {/* Botones de acción */}
        <Stack spacing={2}>
          {isCompleted ? (
            // Botones cuando el pago está completado
            <>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  variant="contained"
                  fullWidth
                  size="large"
                  onClick={onViewOrders}
                  startIcon={<PaymentIcon />}
                  sx={{
                    py: 1.5,
                    borderRadius: 2,
                    fontWeight: 'bold',
                    textTransform: 'none',
                    bgcolor: 'success.main',
                    '&:hover': {
                      bgcolor: 'success.dark'
                    }
                  }}
                >
                  Ver Mis Pedidos
                </Button>
              </motion.div>

              <Button
                variant="outlined"
                fullWidth
                onClick={onContinueShopping}
                sx={{
                  py: 1.5,
                  borderRadius: 2,
                  textTransform: 'none',
                  borderColor: 'success.main',
                  color: 'success.main',
                  '&:hover': {
                    borderColor: 'success.dark',
                    bgcolor: 'success.50'
                  }
                }}
              >
                Continuar Comprando
              </Button>
            </>
          ) : (
            // Botones normales durante el proceso
            <>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  variant="contained"
                  fullWidth
                  size="large"
                  onClick={onContinue}
                  disabled={!canContinue || isProcessing}
                  startIcon={
                    isProcessing ? (
                      <CircularProgress size={20} sx={{ color: 'white' }} />
                    ) : (
                      <PaymentIcon />
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
                  {isProcessing ? 'Procesando Pago...' : 
                   !selectedMethod ? 'Selecciona un método de pago' : 
                   'Confirmar y Pagar'}
                </Button>
              </motion.div>

              <Button
                variant="outlined"
                fullWidth
                onClick={onBack}
                disabled={isProcessing}
                sx={{
                  py: 1.5,
                  borderRadius: 2,
                  textTransform: 'none'
                }}
              >
                Volver al Carrito
              </Button>
            </>
          )}
        </Stack>

        {/* Información de seguridad */}
        <SecurityBadge variant="compact" />
      </Stack>
    </Paper>
  )
}

export default CheckoutSummary
