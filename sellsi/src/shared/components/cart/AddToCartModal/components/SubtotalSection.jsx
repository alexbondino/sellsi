import React from 'react';
import { Paper, Stack, Typography, Box } from '@mui/material';

export function SubtotalSection({ currentPricing, shippingValidation }) {
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
      {shippingValidation?.canShip && shippingValidation?.shippingInfo?.cost != null && (
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            Envío
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            ${shippingValidation.shippingInfo.cost.toLocaleString('es-CL')}
          </Typography>
        </Stack>
      )}
    </Paper>
  );
}
