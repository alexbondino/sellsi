import React, { useMemo } from 'react'
import { Box, Typography, Divider, CircularProgress, Alert } from '@mui/material'
import { calculateProductShippingCost } from '../../../../utils/shippingCalculation'

const PriceBreakdown = ({
  subtotal,
  discount,
  shippingCost,
  total,
  formatPrice,
  cartStats,
  isCalculatingShipping = false,
  // Nuevas props para lógica de envío avanzada
  cartItems = [],
  isAdvancedShippingMode = false,
  userRegion = null,
}) => {
  // ===== LÓGICA PARA DETERMINAR ESTADO DE ENVÍO =====
  const getShippingDisplayData = () => {
    // Si no está en modo avanzado, usar lógica estándar
    if (!isAdvancedShippingMode || !cartItems.length) {
      return {
        cost: shippingCost,
        status: 'normal',
        message: null,
        isLoading: isCalculatingShipping
      };
    }

    // ✅ NUEVO: Si está calculando en modo avanzado, mostrar loading
    if (isCalculatingShipping) {
      return {
        cost: 0,
        status: 'loading',
        message: null,
        isLoading: true
      };
    }

    // ✅ NUEVO: Si no tenemos la región del usuario (no configurada), mostrar mensaje de advertencia
    if (!userRegion) {
      return {
        cost: 0,
        status: 'no_region_configured',
        message: 'Configure su región de envío en su perfil',
        isLoading: false
      };
    }

    // Verificar si tenemos un único producto
    const hasOnlyOneProduct = cartItems.length === 1;
    const singleProduct = hasOnlyOneProduct ? cartItems[0] : null;

    // Verificar productos sin información de despacho o fecha (usando la función correcta)
    const productsWithoutShipping = cartItems.filter(item => {
      // Usar la función calculateProductShippingCost para determinar si tiene envío disponible
      const shippingCost = calculateProductShippingCost(item, userRegion);
      return shippingCost === 0; // Si devuelve 0, no tiene envío disponible para esta región
    });

    const productsWithShipping = cartItems.filter(item => {
      // Usar la función calculateProductShippingCost para determinar si tiene envío disponible
      const shippingCost = calculateProductShippingCost(item, userRegion);
      return shippingCost > 0; // Si devuelve > 0, sí tiene envío disponible para esta región
    });

    // CASO 1: Único producto sin información de despacho
    if (hasOnlyOneProduct && productsWithoutShipping.length === 1) {
      return {
        cost: 0,
        status: 'unavailable',
        message: 'No Disponible',
        isLoading: false
      };
    }

    // CASO 2: Mix de productos (algunos sin información + algunos con información)
    if (productsWithoutShipping.length > 0 && productsWithShipping.length > 0) {
      // Calcular costo solo de productos que SÍ tienen envío disponible usando la función correcta
      const validShippingCost = productsWithShipping.reduce((total, item) => {
        const shippingCost = calculateProductShippingCost(item, userRegion);
        return total + shippingCost;
      }, 0);

      return {
        cost: validShippingCost, // Solo suma los costos de productos que sí tienen envío
        status: 'mixed',
        message: null,
        isLoading: false
      };
    }

    // CASO 3: Todos los productos sin información de despacho
    if (productsWithoutShipping.length === cartItems.length) {
      return {
        cost: 0,
        status: 'unavailable',
        message: 'No Disponible',
        isLoading: false
      };
    }

    // CASO 4: Todos los productos tienen información (usar lógica normal)
    return {
      cost: shippingCost,
      status: 'normal',
      message: null,
      isLoading: false
    };
  };

  const shippingDisplayData = getShippingDisplayData();
  return (
    <>
      {/* Desglose de precios */}
      <Box sx={{ mb: 3 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            mb: 1,
          }}
        >
          <Typography variant="body2">
            Subtotal ({cartStats.totalQuantity} productos):
          </Typography>
          <Typography variant="body2" fontWeight="medium">
            {formatPrice(subtotal)}
          </Typography>
        </Box>

        {discount > 0 && (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              mb: 1,
            }}
          >
            <Typography variant="body2" color="success.main">
              Descuentos aplicados:
            </Typography>
            <Typography variant="body2" color="success.main" fontWeight="bold">
              -{formatPrice(discount)}
            </Typography>
          </Box>
        )}

        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            mb: 1,
          }}
        >
          <Typography variant="body2">Envío:</Typography>
          {shippingDisplayData.isLoading || isCalculatingShipping ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={16} />
              <Typography variant="body2" color="text.secondary">
                Calculando envío...
              </Typography>
            </Box>
          ) : shippingDisplayData.status === 'no_region_configured' ? (
            <Typography
              variant="body2"
              fontWeight="medium"
              color="warning.main"
              sx={{ fontSize: '0.875rem' }}
            >
              {shippingDisplayData.message}
            </Typography>
          ) : (
            <Typography
              variant="body2"
              fontWeight="medium"
              color={
                shippingDisplayData.status === 'unavailable' 
                  ? 'error.main' 
                  : shippingDisplayData.cost === 0 
                    ? 'success.main' 
                    : 'text.primary'
              }
            >
              {shippingDisplayData.status === 'unavailable' 
                ? shippingDisplayData.message 
                : shippingDisplayData.cost === 0 
                  ? '¡GRATIS!' 
                  : formatPrice(shippingDisplayData.cost)
              }
            </Typography>
          )}
        </Box>

        {/* ✅ NUEVO: Mensaje de advertencia más visible cuando no hay región configurada */}
        {shippingDisplayData.status === 'no_region_configured' && (
          <Alert 
            severity="warning" 
            sx={{ 
              mt: 1, 
              mb: 2,
              fontSize: '0.8rem',
              '& .MuiAlert-message': {
                fontSize: '0.8rem'
              }
            }}
          >
            Para calcular el costo de envío, configure su región en el perfil
          </Alert>
        )}
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* Total */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          mb: 3,
        }}
      >
        <Typography variant="h5" fontWeight="bold" sx={{ mr: 2 }}>
          Total:
        </Typography>
        <Typography
          variant="h5"
          fontWeight="bold"
          sx={{
            background: '#000000ff',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          {formatPrice(subtotal - discount + shippingDisplayData.cost)}
        </Typography>
      </Box>
    </>
  )
}

export default PriceBreakdown
