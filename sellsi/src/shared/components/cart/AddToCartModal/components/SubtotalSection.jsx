import React, { useMemo } from 'react';
import { Paper, Stack, Typography, Box } from '@mui/material';

export function SubtotalSection({ currentPricing, shippingValidation, product, quantity }) {
  // Calcular si aplica despacho gratuito basado en la cantidad actual
  const shippingDisplay = useMemo(() => {
    if (!shippingValidation?.canShip || shippingValidation?.shippingInfo?.cost == null) {
      return null;
    }

    const baseCost = shippingValidation.shippingInfo.cost;
    
    // Verificar si aplica free shipping
    const freeShippingEnabled = product?.free_shipping_enabled || product?.freeShippingEnabled;
    const freeShippingMinQty = product?.free_shipping_min_quantity || product?.freeShippingMinQuantity;
    const currentQty = quantity || 1;
    
    const isFreeShipping = freeShippingEnabled && freeShippingMinQty && currentQty >= freeShippingMinQty;
    
    return {
      cost: isFreeShipping ? 0 : baseCost,
      isFree: isFreeShipping,
      minQtyForFree: freeShippingMinQty,
      freeShippingEnabled,
    };
  }, [shippingValidation, product, quantity]);

  return (
    <Paper
      variant="outlined"
      sx={{ p: 2, bgcolor: 'grey.50' }}
      onClick={(e) => e.stopPropagation()}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          Subtotal
        </Typography>
        <Box sx={{ textAlign: 'right' }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            ${currentPricing.total.toLocaleString('es-CL')}
          </Typography>
          {currentPricing.hasDiscountTiers && (
            <Typography variant="caption" color="text.secondary">
              (${currentPricing.unitPrice.toLocaleString('es-CL')} por unidad)
            </Typography>
          )}
        </Box>
      </Stack>
      {shippingDisplay && (
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            Envío
          </Typography>
          {shippingDisplay.isFree ? (
            <Typography variant="h6" sx={{ fontWeight: 700, color: 'success.main' }}>
              GRATIS
            </Typography>
          ) : (
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                ${shippingDisplay.cost.toLocaleString('es-CL')}
              </Typography>
              {shippingDisplay.freeShippingEnabled && shippingDisplay.minQtyForFree && (
                <Typography variant="caption" color="success.main">
                  Gratis desde {shippingDisplay.minQtyForFree.toLocaleString('es-CL')} uds
                </Typography>
              )}
            </Box>
          )}
        </Stack>
      )}
    </Paper>
  );
}
