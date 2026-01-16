/**
 * ============================================================================
 * FINANCING PLAZOS CELL COMPONENT
 * ============================================================================
 * 
 * Componente reutilizable para mostrar plazos de financiamiento.
 * 
 * CARACTERÍSTICAS:
 * - Muestra Plazo Otorgado (term_days)
 * - Muestra Días de Vigencia (calculado con colores)
 * - Lógica de días negativos para mora
 * 
 * COMPARTIDO entre Supplier y Buyer views.
 */

import React from 'react';
import { Box, Typography, Tooltip } from '@mui/material';

/**
 * Calcula y renderiza días de vigencia con colores
 * 
 * @param {Object} financing - Objeto de financiamiento
 * @returns {JSX.Element}
 */
const renderDaysRemaining = (financing) => {
  const amountUsed = Number(financing.amount_used || 0);
  const amountPaid = Number(financing.amount_paid || 0);
  
  // Si está pagado, mostrar 0
  if (amountPaid >= amountUsed && amountUsed > 0) {
    return (
      <Typography variant="body2" fontWeight={600} sx={{ fontSize: '14px', color: 'text.secondary' }}>
        0 días
      </Typography>
    );
  }
  
  // Calcular días restantes o días en mora
  if (!financing.expires_at) {
    return <Typography variant="body2" sx={{ fontSize: '14px' }}>-</Typography>;
  }
  
  const expiryDate = new Date(financing.expires_at);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  expiryDate.setHours(0, 0, 0, 0);
  
  const diffTime = expiryDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  let color = 'success.main';
  
  if (diffDays < 0) {
    // Vencido: días negativos (mora)
    color = 'error.main';
  } else if (diffDays <= 7) {
    color = 'error.main';
  } else if (diffDays <= 15) {
    color = 'warning.main';
  }
  
  return (
    <Typography variant="body2" fontWeight={600} sx={{ fontSize: '14px', color }}>
      {diffDays} días
    </Typography>
  );
};

/**
 * Componente de celda de plazos
 * 
 * @param {Object} financing - Objeto de financiamiento con term_days, expires_at, amount_used, amount_paid
 * @returns {JSX.Element}
 */
const FinancingPlazosCell = ({ financing }) => {
  const tooltipContent = (
    <Box sx={{ p: 0.5 }}>
      <Typography variant="caption" display="block" sx={{ fontWeight: 'bold', mb: 0.5 }}>
        Plazos del Financiamiento
      </Typography>
      <Typography variant="caption" display="block" sx={{ mb: 0.5 }}>
        <strong>Otorgado:</strong> El plazo del crédito fue otorgado por {financing.term_days} días
      </Typography>
      <Typography variant="caption" display="block">
        <strong>Vigencia:</strong> Indica cuántos días quedan disponibles para usar el crédito (valores negativos indican días en mora)
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
      <Box sx={{ minWidth: 120, textAlign: 'center' }}>
        {/* Plazo Otorgado */}
        <Box sx={{ mb: 0.5 }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '12px', display: 'block' }}>
            Otorgado:
          </Typography>
          <Typography variant="body2" fontWeight={500} sx={{ fontSize: '14px' }}>
            {financing.term_days} días
          </Typography>
        </Box>
        
        {/* Días de Vigencia */}
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '12px', display: 'block' }}>
            Vigencia:
          </Typography>
          {renderDaysRemaining(financing)}
        </Box>
      </Box>
    </Tooltip>
  );
};

export default FinancingPlazosCell;
