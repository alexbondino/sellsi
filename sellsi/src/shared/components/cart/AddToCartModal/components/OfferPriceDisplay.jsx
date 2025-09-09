import React from 'react';
import { Box, Typography, Paper, Stack, Divider, Alert } from '@mui/material';

export function OfferPriceDisplay({ offer, productData, isOfferMode }) {
  if (!isOfferMode || !offer) return null;

  const originalPrice = productData.originalPrice;
  const offerPrice = offer.offered_price;
  const totalOfferValue = offerPrice * offer.offered_quantity;
  const originalTotalValue = originalPrice ? originalPrice * offer.offered_quantity : null;
  const savings = originalTotalValue ? originalTotalValue - totalOfferValue : null;
  const savingsPercentage = originalTotalValue ? ((savings / originalTotalValue) * 100) : null;

  return (
    <Box>
      <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
        Precio de oferta aceptada
      </Typography>
      <Paper
        variant="outlined"
        sx={{ p: 2, border: 2, borderColor: 'common.black', bgcolor: 'success.50' }}
      >
        <Stack spacing={2}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="body2" color="text.secondary">
              Precio ofertado por unidad:
            </Typography>
            <Typography variant="h6" color="text.primary" sx={{ fontWeight: 700 }}>
              ${offerPrice.toLocaleString('es-CL')}
            </Typography>
          </Stack>

          {originalPrice && originalPrice > offerPrice && (
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="body2" color="text.secondary">
                Precio original:
              </Typography>
              <Typography
                variant="body2"
                sx={{ textDecoration: 'line-through', color: 'text.secondary' }}
              >
                ${originalPrice.toLocaleString('es-CL')}
              </Typography>
            </Stack>
          )}

          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="body2" color="text.secondary">
              Cantidad acordada:
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {offer.offered_quantity} unidades
            </Typography>
          </Stack>

          {savings && savingsPercentage && (
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="body2" color="success.main" sx={{ fontWeight: 600 }}>
                Tu ahorro:
              </Typography>
              <Typography variant="body2" color="success.main" sx={{ fontWeight: 700 }}>
                ${savings.toLocaleString('es-CL')} ({savingsPercentage.toFixed(1)}%)
              </Typography>
            </Stack>
          )}
          <Divider />
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Total de la oferta:
            </Typography>
            <Typography variant="h5" color="text.primary" sx={{ fontWeight: 800 }}>
              ${totalOfferValue.toLocaleString('es-CL')}
            </Typography>
          </Stack>
        </Stack>
      </Paper>

      {offer.purchase_deadline && (
        <Alert severity="warning" sx={{ mt: 2 }}>
          <Typography variant="body2">
            <strong>Tiempo límite:</strong> Tienes hasta el{' '}
            {new Date(offer.purchase_deadline).toLocaleString('es-CL')} para agregar este producto al carrito.
          </Typography>
        </Alert>
      )}
    </Box>
  );
}
