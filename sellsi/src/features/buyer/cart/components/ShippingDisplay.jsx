/**
 * ============================================================================
 * SHIPPING DISPLAY COMPONENT - COMPONENTE DE MOSTRAR INFORMACIÓN DE DESPACHO
 * ============================================================================
 * 
 * Componente reutilizable para mostrar información de despacho en el carrito
 * con soporte para los diferentes estados de validación.
 */

import React from 'react';
import { 
  Box, 
  Typography, 
  Tooltip, 
  IconButton,
  Chip
} from '@mui/material';
import { 
  Info as InfoIcon,
  LocalShipping as ShippingIcon,
  Warning as WarningIcon,
  Error as ErrorIcon 
} from '@mui/icons-material';
import { SHIPPING_STATES } from '../hooks/useShippingValidation';

/**
 * Componente para mostrar información de despacho por producto
 * @param {Object} props - Props del componente
 * @param {Object} props.product - Producto
 * @param {Object} props.shippingValidation - Estado de validación de despacho
 * @param {boolean} props.isAdvancedMode - Modo avanzado activado
 * @param {Function} props.formatPrice - Función para formatear precios
 * @returns {JSX.Element} Componente de información de despacho
 */
const ShippingDisplay = ({ 
  product, 
  shippingValidation, 
  isAdvancedMode = false, 
  formatPrice = (price) => `$${price.toLocaleString('es-CL')}` 
}) => {
  // Modo simple: mostrar información estática
  if (!isAdvancedMode) {
    return (
      <Box sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        width: '140px',
        minWidth: '140px',
        maxWidth: '140px',
        py: 1,
        px: 0,
        borderRadius: 1,
        bgcolor: 'transparent',
        border: 'none',
      }}>
        <Typography variant="caption" sx={{ fontWeight: 'bold', mb: 0.5 }}>
          🚚 Envío Estándar
        </Typography>
        <Typography variant="caption" color="text.secondary">
          3-5 días hábiles
        </Typography>
        <Typography
          variant="body1"
          sx={{
            mt: 1,
            color: 'primary.main',
            fontWeight: 'bold',
            fontSize: '1rem',
          }}
        >
          $5.990
        </Typography>
      </Box>
    );
  }

  // Modo avanzado: mostrar información validada
  const productId = product.id || product.productid;
  const validation = shippingValidation?.shippingStates?.[productId];

  if (!validation) {
    return (
      <Box sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        width: '140px',
        minWidth: '140px',
        maxWidth: '140px',
        py: 1,
        px: 0,
      }}>
        <Typography variant="caption" sx={{ fontWeight: 'bold', mb: 0.5 }}>
          🚚 Cargando...
        </Typography>
      </Box>
    );
  }

  // Renderizar según el estado de validación
  switch (validation.state) {
    case SHIPPING_STATES.COMPATIBLE:
      return (
        <Box sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          width: '140px',
          minWidth: '140px',
          maxWidth: '140px',
          py: 1,
          px: 0,
          borderRadius: 1,
          bgcolor: 'success.50',
          border: '1px solid',
          borderColor: 'success.200',
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
            <ShippingIcon sx={{ fontSize: 14, color: 'success.main', mr: 0.5 }} />
            <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'success.main' }}>
              Disponible
            </Typography>
          </Box>
          <Typography variant="caption" color="text.secondary">
            {validation.shippingInfo?.days} días hábiles
          </Typography>
          <Typography
            variant="body1"
            sx={{
              mt: 1,
              color: 'success.main',
              fontWeight: 'bold',
              fontSize: '1rem',
            }}
          >
            {formatPrice(validation.shippingInfo?.cost || 0)}
          </Typography>
        </Box>
      );

    case SHIPPING_STATES.INCOMPATIBLE_REGION:
      return (
        <Box sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          width: '140px',
          minWidth: '140px',
          maxWidth: '140px',
          py: 1,
          px: 0,
          borderRadius: 1,
          bgcolor: 'warning.50',
          border: '1px solid',
          borderColor: 'warning.200',
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
            <WarningIcon sx={{ fontSize: 14, color: 'warning.main', mr: 0.5 }} />
            <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'warning.main' }}>
              No disponible
            </Typography>
            <Tooltip 
              title={`Este producto solo está disponible para despacho en: ${validation.availableRegions?.join(', ')}`}
              placement="top"
            >
              <IconButton size="small" sx={{ ml: 0.5, p: 0.25 }}>
                <InfoIcon sx={{ fontSize: 12, color: 'warning.main' }} />
              </IconButton>
            </Tooltip>
          </Box>
          <Typography variant="caption" color="warning.main" sx={{ fontSize: '0.65rem' }}>
            {validation.message}
          </Typography>
        </Box>
      );

    case SHIPPING_STATES.NO_SHIPPING_INFO:
      return (
        <Box sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          width: '140px',
          minWidth: '140px',
          maxWidth: '140px',
          py: 1,
          px: 0,
          borderRadius: 1,
          bgcolor: 'transparent',
          border: 'none',
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
            <ErrorIcon sx={{ fontSize: 14, color: 'error.main', mr: 0.5 }} />
            <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'error.main' }}>
              Sin información
            </Typography>
          </Box>
          <Typography 
            variant="caption" 
            color="error.main" 
            sx={{ fontSize: '0.65rem', textAlign: 'left' }}
          >
            {validation.message}
          </Typography>
        </Box>
      );

    default:
      return (
        <Box sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          width: '140px',
          minWidth: '140px',
          maxWidth: '140px',
          py: 1,
          px: 0,
        }}>
          <Typography variant="caption" sx={{ fontWeight: 'bold', mb: 0.5 }}>
            🚚 Envío Estándar
          </Typography>
          <Typography variant="caption" color="text.secondary">
            3-5 días hábiles
          </Typography>
          <Typography
            variant="body1"
            sx={{
              mt: 1,
              color: 'primary.main',
              fontWeight: 'bold',
              fontSize: '1rem',
            }}
          >
            $5.990
          </Typography>
        </Box>
      );
  }
};

export default ShippingDisplay;
