import React, { useState } from 'react';
import {
  Box,
  Alert,
  Typography,
  Collapse,
  IconButton,
  Stack,
  Chip,
} from '@mui/material';
import {
  Warning as WarningIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';

/**
 * MinimumPurchaseWarning - Alerta de compra mínima de proveedores
 * Muestra advertencias cuando el carrito no cumple con el monto mínimo de compra de uno o más proveedores
 */
const MinimumPurchaseWarning = ({ validation, isSelectionMode, formatPrice }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // No mostrar si no hay violaciones O si está en modo selección/eliminación
  if (!validation?.hasViolations || isSelectionMode) {
    return null;
  }
  
  const { violations, count } = validation;
  
  // Caso 1: Un solo proveedor no cumple el mínimo
  if (count === 1) {
    const v = violations[0];
    return (
      <Alert
        severity="warning"
        icon={<WarningIcon />}
        sx={{
          mt: 2,
          borderRadius: 2,
          backgroundColor: '#fff3e0',
          border: '1px solid',
          borderColor: 'warning.main',
          '& .MuiAlert-icon': {
            color: 'warning.main',
            fontSize: 24,
          },
        }}
      >
        <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>
          Necesitas añadir <Box component="span" sx={{ color: 'warning.dark', fontSize: '1.05em' }}>{formatPrice(v.missing)}</Box> más para cumplir con la compra mínima
        </Typography>
        <Typography variant="body2" color="text.primary" sx={{ mb: 1 }}>
          Proveedor: <strong>{v.supplierName}</strong>
        </Typography>
        <Stack direction="row" spacing={2} flexWrap="wrap" sx={{ gap: 0.5 }}>
          <Typography variant="caption" color="text.secondary">
            Tu compra actual: <strong>{formatPrice(v.currentTotal)}</strong>
          </Typography>
          <Typography variant="caption" color="text.secondary">
            •
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Mínimo requerido: <strong>{formatPrice(v.minimumAmount)}</strong>
          </Typography>
        </Stack>
      </Alert>
    );
  }
  
  // Caso 2: Múltiples proveedores no cumplen el mínimo (expandible)
  const firstSupplier = violations[0];
  const othersCount = count - 1;
  
  return (
    <Alert
      severity="warning"
      icon={<WarningIcon />}
      sx={{
        mt: 2,
        borderRadius: 2,
        backgroundColor: '#fff3e0',
        border: '1px solid',
        borderColor: 'warning.main',
        '& .MuiAlert-icon': {
          color: 'warning.main',
          fontSize: 24,
        },
      }}
    >
      {/* Mensaje colapsado - clickeable para expandir */}
      <Box
        onClick={() => setIsExpanded(!isExpanded)}
        sx={{
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          '&:hover': {
            opacity: 0.8,
          },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <Typography variant="body2" fontWeight={600}>
            Tienes {count} proveedores que requieren compra mínima:
          </Typography>
          <Typography variant="body2" color="text.primary">
            <strong>{firstSupplier.supplierName}</strong>
          </Typography>
          {othersCount > 0 && (
            <Chip
              label={`+${othersCount} más`}
              size="small"
              sx={{
                height: 20,
                backgroundColor: 'warning.main',
                color: 'white',
                fontWeight: 600,
                fontSize: '0.7rem',
              }}
            />
          )}
        </Box>
        <IconButton size="small" sx={{ color: 'warning.main' }}>
          {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
      </Box>
      
      {/* Contenido expandido - detalle por proveedor */}
      <Collapse in={isExpanded} timeout="auto">
        <Stack spacing={1.5} sx={{ mt: 2 }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
            Haz clic en cada proveedor para ver los detalles:
          </Typography>
          {violations.map((v, index) => (
            <Box
              key={v.supplierId}
              sx={{
                p: 2,
                backgroundColor: 'background.paper',
                borderRadius: 1.5,
                border: '1px solid',
                borderColor: 'divider',
                transition: 'all 0.2s',
                '&:hover': {
                  borderColor: 'warning.main',
                  boxShadow: '0 2px 8px rgba(237, 108, 2, 0.15)',
                },
              }}
            >
              <Typography variant="body2" fontWeight={600} color="text.primary" sx={{ mb: 1.5 }}>
                {index + 1}. {v.supplierName}
              </Typography>
              
              <Stack spacing={1}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="caption" color="text.secondary">
                    Tu compra actual:
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {formatPrice(v.currentTotal)}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="caption" color="text.secondary">
                    Mínimo requerido:
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {formatPrice(v.minimumAmount)}
                  </Typography>
                </Box>
                
                <Box 
                  sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    pt: 1,
                    borderTop: '1px dashed',
                    borderColor: 'divider',
                    mt: 0.5,
                  }}
                >
                  <Typography variant="caption" fontWeight={600} color="warning.dark">
                    Te falta añadir:
                  </Typography>
                  <Typography variant="body2" fontWeight={700} color="warning.dark">
                    {formatPrice(v.missing)}
                  </Typography>
                </Box>
              </Stack>
            </Box>
          ))}
          
          {/* Mensaje de ayuda */}
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, fontStyle: 'italic' }}>
            💡 Añade más productos de estos proveedores para alcanzar el monto mínimo de compra
          </Typography>
        </Stack>
      </Collapse>
    </Alert>
  );
};

export default MinimumPurchaseWarning;
