import React, { useState } from 'react';
import {
  Box,
  Alert,
  Paper,
  Typography,
  Collapse,
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
 * 
 * DISEÑO:
 * - Proveedor único: Alert de MUI (simple, sin expansión)
 * - Múltiples proveedores: Paper custom con layout correcto para contenido expandible
 */
const MinimumPurchaseWarning = ({ validation, isSelectionMode, formatPrice }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // No mostrar si no hay violaciones O si está en modo selección/eliminación
  if (!validation?.hasViolations || isSelectionMode) {
    return null;
  }
  
  const { violations, count } = validation;
  
  // Caso 1: Un solo proveedor no cumple el mínimo (Alert simple)
  if (count === 1) {
    const v = violations[0];
    return (
      <Alert
        severity="warning"
        icon={<WarningIcon />}
        sx={{
          mt: { xs: 1, md: 2 },
          mx: { xs: 0.5, md: 0 },
          borderRadius: 2,
          backgroundColor: '#fff3e0',
          border: '1px solid',
          borderColor: 'warning.main',
          '& .MuiAlert-icon': {
            color: 'warning.main',
            fontSize: { xs: 20, md: 24 },
          },
        }}
      >
        {/* Título y monto faltante */}
        <Typography 
          variant="body2" 
          fontWeight={600} 
          sx={{ 
            mb: { xs: 1.5, md: 1 },
            fontSize: { xs: '0.9rem', md: '0.875rem' },
            lineHeight: 1.4,
          }}
        >
          Necesitas añadir{' '}
          <Box 
            component="span" 
            sx={{ 
              color: 'warning.dark', 
              fontSize: '1.1em',
              fontWeight: 700,
            }}
          >
            {formatPrice(v.missing)}
          </Box>
          {' '}más para cumplir con la compra mínima exigida por el proveedor.
        </Typography>
        
        {/* Proveedor */}
        <Typography 
          variant="body2" 
          color="text.primary" 
          sx={{ 
            mb: { xs: 1.5, md: 1.5 },
            fontSize: { xs: '0.85rem', md: '0.875rem' },
          }}
        >
          Proveedor: <strong>{v.supplierName}</strong>
        </Typography>
        
        {/* Detalles de compra - Layout optimizado */}
        <Box 
          sx={{ 
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            gap: { xs: 1, sm: 2 },
            backgroundColor: { xs: 'rgba(255,255,255,0.5)', md: 'transparent' },
            p: { xs: 1.5, md: 0 },
            borderRadius: { xs: 1, md: 0 },
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', md: '0.75rem' } }}>
              Tu compra actual:
            </Typography>
            <Typography 
              variant="body2" 
              fontWeight={600} 
              sx={{ 
                fontSize: { xs: '0.85rem', md: '0.875rem' },
                ml: { xs: 2, sm: 1 },
              }}
            >
              {formatPrice(v.currentTotal)}
            </Typography>
          </Box>
          
          {/* Separador solo en desktop */}
          <Box sx={{ display: { xs: 'none', sm: 'block' }, color: 'text.secondary' }}>•</Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', md: '0.75rem' } }}>
              Mínimo requerido:
            </Typography>
            <Typography 
              variant="body2" 
              fontWeight={600} 
              sx={{ 
                fontSize: { xs: '0.85rem', md: '0.875rem' },
                ml: { xs: 2, sm: 1 },
              }}
            >
              {formatPrice(v.minimumAmount)}
            </Typography>
          </Box>
        </Box>
      </Alert>
    );
  }
  
  // Caso 2: Múltiples proveedores no cumplen el mínimo (expandible)
  // Usamos Paper custom en lugar de Alert para tener control total del layout
  const firstSupplier = violations[0];
  const othersCount = count - 1;
  
  return (
    <Paper
      elevation={0}
      sx={{
        mt: { xs: 1, md: 2 },
        mx: { xs: 0.5, md: 0 },
        p: { xs: 1.5, md: 2 },
        borderRadius: 2,
        backgroundColor: '#fff3e0',
        border: '1px solid',
        borderColor: 'warning.main',
      }}
    >
      {/* Header con ícono - siempre visible */}
      <Box
        onClick={() => setIsExpanded(!isExpanded)}
        sx={{
          display: 'flex',
          gap: { xs: 1, md: 1.5 },
          cursor: 'pointer',
          '&:hover': {
            opacity: 0.8,
          },
        }}
      >
        {/* Ícono warning - solo ocupa su espacio natural */}
        <WarningIcon 
          sx={{ 
            color: 'warning.main',
            fontSize: { xs: 20, md: 24 },
            flexShrink: 0,
            mt: 0.25, // Pequeño ajuste visual para alinear con texto
          }} 
        />
        
        {/* Contenido del header - flex 1 para ocupar espacio disponible */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              gap: 1,
            }}
          >
            {/* Texto y chips */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', flex: 1, minWidth: 0 }}>
              <Typography 
                variant="body2" 
                fontWeight={600} 
                sx={{ 
                  fontSize: { xs: '0.85rem', md: '0.875rem' },
                  color: 'text.primary',
                }}
              >
                Tienes {count} proveedores que exigen una compra mínima:
              </Typography>
              <Typography 
                variant="body2" 
                color="text.primary" 
                sx={{ fontSize: { xs: '0.85rem', md: '0.875rem' } }}
              >
                <strong>{firstSupplier.supplierName}</strong>
              </Typography>
              {othersCount > 0 && (
                <Chip
                  label={`+${othersCount} más`}
                  size="small"
                  sx={{
                    height: { xs: 18, md: 20 },
                    backgroundColor: 'warning.main',
                    color: 'white',
                    fontWeight: 600,
                    fontSize: { xs: '0.65rem', md: '0.7rem' },
                  }}
                />
              )}
            </Box>
            
            {/* Botón expandir - no necesita IconButton, solo el ícono */}
            <Box sx={{ flexShrink: 0 }}>
              {isExpanded ? (
                <ExpandLessIcon sx={{ color: 'warning.main', fontSize: { xs: 20, md: 22 } }} />
              ) : (
                <ExpandMoreIcon sx={{ color: 'warning.main', fontSize: { xs: 20, md: 22 } }} />
              )}
            </Box>
          </Box>
        </Box>
      </Box>
      
      {/* Contenido expandido - detalle por proveedor */}
      <Collapse in={isExpanded} timeout="auto">
        <Box sx={{ mt: 2 }}>
          {/* Grid flex responsive: 1 col (mobile) → 2 cols (lg) → 3 cols (xl) */}
          <Box 
            sx={{ 
              display: 'flex',
              flexWrap: 'wrap',
              gap: 1.5,
              mb: 1.5,
            }}
          >
            {violations.map((v, index) => (
              <Box
                key={v.supplierId}
                sx={{
                  p: { xs: 1.5, md: 2 },
                  backgroundColor: 'background.paper',
                  borderRadius: 1.5,
                  border: '1px solid',
                  borderColor: 'divider',
                  transition: 'all 0.2s',
                  '&:hover': {
                    borderColor: 'warning.main',
                    boxShadow: '0 2px 8px rgba(237, 108, 2, 0.15)',
                  },
                  // Responsive widths usando porcentajes - cards más anchas
                  width: '100%', // Mobile: 1 card por fila
                  '@media (min-width: 1200px)': { // lg breakpoint
                    width: 'calc(50% - 6px)', // lg: 2 cards por fila
                  },
                  '@media (min-width: 1536px)': { // xl breakpoint
                    width: 'calc(33.333% - 8px)', // xl: 3 cards por fila
                  },
                }}
              >
                {/* Nombre del proveedor */}
                <Typography 
                  variant="body2" 
                  fontWeight={700} 
                  color="text.primary" 
                  sx={{ 
                    mb: { xs: 1.5, md: 1.5 }, 
                    fontSize: { xs: '0.9rem', md: '0.875rem' },
                  }}
                >
                  {index + 1}. {v.supplierName}
                </Typography>
                
                <Stack spacing={{ xs: 1.2, md: 1 }}>
                  {/* Tu compra actual */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
                    <Typography 
                      variant="caption" 
                      color="text.secondary" 
                      sx={{ 
                        fontSize: { xs: '0.75rem', md: '0.75rem' },
                        minWidth: 'fit-content',
                      }}
                    >
                      Tu compra actual:
                    </Typography>
                    <Typography 
                      variant="body2" 
                      fontWeight={600} 
                      sx={{ 
                        fontSize: { xs: '0.85rem', md: '0.875rem' },
                        textAlign: 'right',
                      }}
                    >
                      {formatPrice(v.currentTotal)}
                    </Typography>
                  </Box>
                  
                  {/* Mínimo requerido */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
                    <Typography 
                      variant="caption" 
                      color="text.secondary" 
                      sx={{ 
                        fontSize: { xs: '0.75rem', md: '0.75rem' },
                        minWidth: 'fit-content',
                      }}
                    >
                      Mínimo requerido:
                    </Typography>
                    <Typography 
                      variant="body2" 
                      fontWeight={600} 
                      sx={{ 
                        fontSize: { xs: '0.85rem', md: '0.875rem' },
                        textAlign: 'right',
                      }}
                    >
                      {formatPrice(v.minimumAmount)}
                    </Typography>
                  </Box>
                  
                  {/* Te falta añadir - destacado */}
                  <Box 
                    sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      gap: 1,
                      pt: { xs: 1.2, md: 1 },
                      borderTop: '1px dashed',
                      borderColor: 'divider',
                      mt: { xs: 0.5, md: 0.5 },
                    }}
                  >
                    <Typography 
                      variant="caption" 
                      fontWeight={700} 
                      color="warning.dark" 
                      sx={{ 
                        fontSize: { xs: '0.75rem', md: '0.75rem' },
                        minWidth: 'fit-content',
                      }}
                    >
                      Te falta añadir:
                    </Typography>
                    <Typography 
                      variant="body2" 
                      fontWeight={700} 
                      color="warning.dark" 
                      sx={{ 
                        fontSize: { xs: '0.9rem', md: '0.875rem' },
                        textAlign: 'right',
                      }}
                    >
                      {formatPrice(v.missing)}
                    </Typography>
                  </Box>
                </Stack>
              </Box>
            ))}
          </Box>
          
          {/* Mensaje de ayuda */}
          <Box
            sx={{
              mt: { xs: 1.5, md: 1 },
              p: { xs: 1.5, md: 0 },
              backgroundColor: { xs: 'rgba(255,255,255,0.5)', md: 'transparent' },
              borderRadius: { xs: 1, md: 0 },
            }}
          >
            <Typography 
              variant="caption" 
              color="text.secondary" 
              sx={{ 
                fontStyle: 'italic', 
                fontSize: { xs: '0.75rem', md: '0.75rem' },
                lineHeight: 1.5,
                display: 'block',
              }}
            >
              💡 Añade más productos de estos proveedores o aumenta la cantidad de los ya seleccionados para alcanzar el monto mínimo de compra exigido por el proveedor.
            </Typography>
          </Box>
        </Box>
      </Collapse>
    </Paper>
  );
};

export default MinimumPurchaseWarning;
