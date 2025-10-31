import React from 'react';
import { Alert, Typography } from '@mui/material';
import { Warning as WarningIcon, CheckCircle as CheckIcon } from '@mui/icons-material';
import { sanitizeShippingMessage } from '../logic/shippingMessage';

export function ShippingStatus({
  isLoadingRegions,
  isLoadingUserProfile,
  effectiveUserRegion,
  justOpened,
  shippingValidation,
  getUserRegionName,
}) {
  if (isLoadingRegions || isLoadingUserProfile) {
    return (
      <Alert severity="info" sx={{ mt: 2 }}>
        <Typography variant="body2">Cargando información de despacho...</Typography>
      </Alert>
    );
  }

  if (!effectiveUserRegion) {
    if (justOpened) {
      return (
        <Alert severity="info" sx={{ mt: 2 }}>
          <Typography variant="body2">Cargando información de despacho...</Typography>
        </Alert>
      );
    }
    return (
      <Alert severity="info" sx={{ mt: 2 }}>
        <Typography variant="body2">
          Configura tu dirección de despacho en tu perfil para ver disponibilidad de despacho
        </Typography>
      </Alert>
    );
  }

  if (!shippingValidation) {
    return (
      <Alert severity="info" sx={{ mt: 2 }}>
        <Typography variant="body2">Cargando información de despacho...</Typography>
      </Alert>
    );
  }

  if (shippingValidation.canShip) {
    const rawMsg = shippingValidation.message || shippingValidation.shippingInfo?.message || '';
    const sanitizedMsg = sanitizeShippingMessage(rawMsg);
    return (
      <Alert severity="success" sx={{ mt: 2 }} icon={<CheckIcon />}>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          Este producto tiene despacho hacia tu región: {getUserRegionName(effectiveUserRegion)}
        </Typography>
        {sanitizedMsg && (
          <Typography variant="caption" color="text.secondary">
            {sanitizedMsg}
          </Typography>
        )}
      </Alert>
    );
  }

  return (
    <Alert severity="warning" sx={{ mt: 2 }} icon={<WarningIcon />}>
      <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
        Este producto actualmente no cuenta con despacho hacia tu región
      </Typography>
      {shippingValidation.availableRegions && shippingValidation.availableRegions.length > 0 ? (
        <Typography variant="caption" color="text.secondary">
          Este producto solo tiene despacho a: {shippingValidation.availableRegions.join(', ')}
        </Typography>
      ) : (
        <Typography variant="caption" color="text.secondary">
          Este producto no tiene regiones de despacho configuradas. Contáctanos a contacto@sellsi.cl para más información.
        </Typography>
      )}
    </Alert>
  );
}
