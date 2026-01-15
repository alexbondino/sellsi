/**
 * ============================================================================
 * FINANCING DATES CELL COMPONENT
 * ============================================================================
 * 
 * Componente reutilizable para mostrar fechas clave de financiamiento.
 * 
 * CARACTERÍSTICAS:
 * - Muestra fecha de Solicitud (created_at)
 * - Muestra fecha de Aprobación (activated_at)
 * - Formato DD/MM/YYYY
 * 
 * COMPARTIDO entre Supplier y Buyer views.
 */

import React from 'react';
import { Box, Typography, Tooltip } from '@mui/material';

/**
 * Formatea fecha a DD/MM/YYYY
 * @param {string} dateString - Fecha en formato ISO
 * @returns {string} Fecha formateada
 */
const formatDate = (dateString) => {
  if (!dateString) return '-';
  
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  
  return `${day}/${month}/${year}`;
};

/**
 * Componente de celda de fechas
 * 
 * @param {Object} financing - Objeto de financiamiento con created_at y activated_at
 * @returns {JSX.Element}
 */
const FinancingDatesCell = ({ financing }) => {
  const tooltipContent = (
    <Box sx={{ p: 0.5 }}>
      <Typography variant="caption" display="block" sx={{ fontWeight: 'bold', mb: 0.5 }}>
        Fechas del Financiamiento
      </Typography>
      <Typography variant="caption" display="block" sx={{ mb: 0.5 }}>
        <strong>Solicitud:</strong> Fecha en que el comprador generó la solicitud
      </Typography>
      <Typography variant="caption" display="block">
        <strong>Aprobación:</strong> Fecha en que la operación fue aprobada por Sellsi
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
      <Box sx={{ minWidth: 120 }}>
        {/* Fecha de Solicitud */}
        <Box sx={{ mb: 0.5 }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '12px', display: 'block' }}>
            Solicitud:
          </Typography>
          <Typography variant="body2" fontWeight={500} sx={{ fontSize: '14px' }}>
            {formatDate(financing.created_at)}
          </Typography>
        </Box>
        
        {/* Fecha de Aprobación */}
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '12px', display: 'block' }}>
            Aprobación:
          </Typography>
          <Typography variant="body2" fontWeight={600} color="primary" sx={{ fontSize: '14px' }}>
            {formatDate(financing.activated_at)}
          </Typography>
        </Box>
      </Box>
    </Tooltip>
  );
};

export default FinancingDatesCell;
