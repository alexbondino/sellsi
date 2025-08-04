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
        <Typography variant="caption" color="text.secondary" component="span">
          Según región seleccionada
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
          Consultar precio
        </Typography>
      </Box>
    );
  }

  // Modo avanzado: mostrar información validada
  const productId = product.id || product.productid;
  const validation = shippingValidation?.shippingStates?.[productId];
  const isLoading = shippingValidation?.isLoading;

  // ✅ NUEVO: Mostrar estado de carga profesional
  if (isLoading || !validation) {
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
        bgcolor: 'action.hover',
        border: '1px solid',
        borderColor: 'divider',
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
          <Box 
            sx={{ 
              width: 14, 
              height: 14, 
              borderRadius: '50%',
              bgcolor: 'primary.main',
              opacity: 0.6,
              animation: 'pulse 1.5s ease-in-out infinite',
              mr: 0.5,
              '@keyframes pulse': {
                '0%': { opacity: 0.6 },
                '50%': { opacity: 1 },
                '100%': { opacity: 0.6 }
              }
            }} 
          />
          <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
            Cargando...
          </Typography>
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }} component="span">
          Verificando despacho
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
          bgcolor: 'transparent',
          border: 'none',
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
            <ShippingIcon sx={{ fontSize: 14, color: 'success.main', mr: 0.5 }} />
            <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'success.main' }}>
              Disponible
            </Typography>
          </Box>
          <Typography variant="caption" color="text.secondary" component="span">
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
          bgcolor: 'transparent',
          border: 'none',
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
          <Typography 
            variant="caption" 
            color="warning.main" 
            sx={{ fontSize: '0.65rem' }}
            component="span"
          >
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
            <InfoIcon sx={{ fontSize: 14, color: 'info.main', mr: 0.5 }} />
            <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'info.main' }}>
              Sin Información
            </Typography>
          </Box>
          <Typography 
            variant="caption" 
            color="info.main" 
            sx={{ fontSize: '0.65rem', textAlign: 'left' }}
            component="span"
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
          <Typography variant="caption" color="text.secondary" component="span">
            Según región seleccionada
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
            Consultar precio
          </Typography>
        </Box>
      );
  }
};

export default ShippingDisplay;
