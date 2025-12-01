import React from 'react';
import { Box, Typography, Paper, Stack } from '@mui/material';

const tierPaperSx = (isActive) => ({
  p: 1,
  border: isActive ? 2 : 1,
  borderColor: isActive ? 'primary.main' : 'grey.300',
  bgcolor: isActive ? 'primary.50' : 'transparent',
  cursor: 'default',
});

const tiersContainerSx = {
  display: 'flex',
  flexDirection: 'column',
  gap: 0, // Stack spacing maneja el gap
};

export function PriceTiersDisplay({ productData, priceTiers, quantity }) {
  if (!priceTiers || priceTiers.length === 0) {
    return (
      <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="h6" color="text.primary" sx={{ fontWeight: 700 }}>
          Precio
        </Typography>
        <Typography variant="h5" color="primary.main" sx={{ fontWeight: 800, mt: 1 }}>
          ${productData.basePrice.toLocaleString('es-CL')}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          por unidad
        </Typography>
      </Paper>
    );
  }

  return (
    <Box>
      <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
        Precio antes de envío
      </Typography>
      <Stack spacing={0.5} sx={tiersContainerSx}>
        {priceTiers.map((tier, index) => {
          const minQty = tier.min_quantity || 1;
          const maxQty = tier.max_quantity;
          const isActive = quantity >= minQty && (maxQty == null || quantity <= maxQty);
          const rangeText = maxQty ? `${minQty} - ${maxQty}` : `${minQty}+`;
          return (
            <Paper
              key={tier.id || index}
              variant="outlined"
              sx={tierPaperSx(isActive)}
              onClick={(e) => e.stopPropagation()}
            >
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography
                  variant="body2"
                  color={isActive ? 'primary.main' : 'black'}
                  sx={{ fontWeight: isActive ? 600 : 400 }}
                >
                  {rangeText} unidades
                </Typography>
                <Typography
                  variant="h6"
                  color={isActive ? 'primary.main' : 'black'}
                  sx={{ fontWeight: isActive ? 700 : 600 }}
                >
                  ${tier.price.toLocaleString('es-CL')}
                </Typography>
              </Stack>
            </Paper>
          );
        })}
      </Stack>
    </Box>
  );
}
