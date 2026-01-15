/**
 * ============================================================================
 * FINANCING AMOUNTS CELL COMPONENT
 * ============================================================================
 * 
 * Componente reutilizable para mostrar montos de financiamiento con barra de progreso.
 * 
 * CARACTERÍSTICAS:
 * - Muestra Asignado, Utilizado y Disponible
 * - Barra de progreso con colores:
 *   - Azul Sellsi (primary): uso < 90%
 *   - Naranja (warning): uso >= 90%
 * - Tooltip con detalles completos
 * 
 * COMPARTIDO entre Supplier y Buyer views.
 */

import React from 'react';
import { Box, Typography, LinearProgress, Tooltip } from '@mui/material';

/**
 * Componente de celda de montos con barra de progreso
 * 
 * @param {Object} financing - Objeto de financiamiento con amount, amount_used
 * @returns {JSX.Element}
 */
const FinancingAmountsCell = ({ financing }) => {
  const amount = Number(financing.amount || 0);
  const amountUsed = Number(financing.amount_used || 0);
  const available = amount - amountUsed;
  const usagePercentage = amount > 0 ? (amountUsed / amount) * 100 : 0;
  
  // Color de la barra: naranja si >= 90%, azul Sellsi si < 90%
  const barColor = usagePercentage >= 90 ? 'warning' : 'primary';
  
  // Formatear montos
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(value);
  };
  
  // Contenido del tooltip
  const tooltipContent = (
    <Box sx={{ p: 1 }}>
      <Typography variant="caption" display="block" sx={{ fontWeight: 'bold', mb: 0.5 }}>
        Detalle de Montos
      </Typography>
      <Typography variant="caption" display="block">
        Asignado: {formatCurrency(amount)}
      </Typography>
      <Typography variant="caption" display="block">
        Utilizado: {formatCurrency(amountUsed)} ({usagePercentage.toFixed(1)}%)
      </Typography>
      <Typography variant="caption" display="block">
        Disponible: {formatCurrency(available)}
      </Typography>
    </Box>
  );
  
  return (
    <Tooltip
      title={tooltipContent}
      arrow
      placement="top"
      enterDelay={200}
      leaveDelay={100}
    >
      <Box sx={{ minWidth: 180, maxWidth: 220, mx: 'auto' }}>
        {/* Textos de montos */}
        <Box sx={{ mb: 0.5 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.25 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '14px' }}>
              Asignado:
            </Typography>
            <Typography variant="caption" fontWeight={600} sx={{ fontSize: '14px' }}>
              {formatCurrency(amount)}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.25 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '14px' }}>
              Utilizado:
            </Typography>
            <Typography variant="caption" sx={{ fontSize: '14px' }}>
              {formatCurrency(amountUsed)}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '14px' }}>
              Disponible:
            </Typography>
            <Typography 
              variant="caption" 
              fontWeight={600} 
              color={available > 0 ? 'success.main' : 'text.secondary'}
              sx={{ fontSize: '14px' }}
            >
              {formatCurrency(available)}
            </Typography>
          </Box>
        </Box>
        
        {/* Barra de progreso */}
        <LinearProgress
          variant="determinate"
          value={Math.min(usagePercentage, 100)}
          color={barColor}
          sx={{
            height: 6,
            borderRadius: 1,
            backgroundColor: 'action.hover',
            '& .MuiLinearProgress-bar': {
              borderRadius: 1,
            },
          }}
        />
        
        {/* Porcentaje debajo de la barra */}
        <Typography 
          variant="caption" 
          color="text.secondary" 
          sx={{ fontSize: '12px', display: 'block', textAlign: 'center', mt: 0.25 }}
        >
          {usagePercentage.toFixed(1)}% utilizado
        </Typography>
      </Box>
    </Tooltip>
  );
};

export default FinancingAmountsCell;
