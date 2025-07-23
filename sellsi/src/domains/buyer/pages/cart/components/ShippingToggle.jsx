/**
 * ============================================================================
 * SHIPPING TOGGLE - TOGGLE PARA ACTIVAR/DESACTIVAR VALIDACIÓN AVANZADA
 * ============================================================================
 * 
 * Componente toggle para cambiar entre modo simple y avanzado de validación de despacho
 */

import React from 'react';
import { 
  FormControlLabel, 
  Switch, 
  Box, 
  Typography, 
  Tooltip,
  Chip
} from '@mui/material';
import { 
  Info as InfoIcon,
  FlashOn as FlashOnIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';

/**
 * Toggle para activar/desactivar validación avanzada de despacho
 * @param {Object} props - Props del componente
 * @param {boolean} props.isAdvancedMode - Estado actual del modo avanzado
 * @param {Function} props.onToggle - Función para cambiar el modo
 * @param {boolean} props.disabled - Si el toggle está deshabilitado
 * @returns {JSX.Element} Componente toggle
 */
const ShippingToggle = ({ 
  isAdvancedMode, 
  onToggle, 
  disabled = false 
}) => {
  return (
    <Box sx={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: 2, 
      p: 2, 
      bgcolor: 'grey.50', 
      borderRadius: 2, 
      border: '1px solid', 
      borderColor: 'grey.300',
      mb: 2
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {isAdvancedMode ? (
          <SettingsIcon sx={{ color: 'primary.main', fontSize: 20 }} />
        ) : (
          <FlashOnIcon sx={{ color: 'warning.main', fontSize: 20 }} />
        )}
        <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
          Validación de Despacho:
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Chip
          label={isAdvancedMode ? 'Avanzada' : 'Simple'}
          color={isAdvancedMode ? 'primary' : 'warning'}
          size="small"
          variant={isAdvancedMode ? 'filled' : 'outlined'}
        />
        
        <FormControlLabel
          control={
            <Switch
              checked={isAdvancedMode}
              onChange={(e) => onToggle(e.target.checked)}
              disabled={disabled}
              color="primary"
            />
          }
          label=""
          sx={{ margin: 0 }}
        />
      </Box>

      <Tooltip
        title={
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
              Modos de Validación:
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>Simple:</strong> Muestra "3-5 días hábiles - $5.990" sin validación
            </Typography>
            <Typography variant="body2">
              <strong>Avanzada:</strong> Valida información de despacho por producto y región del usuario
            </Typography>
          </Box>
        }
        placement="top"
      >
        <InfoIcon sx={{ color: 'grey.500', fontSize: 16, cursor: 'help' }} />
      </Tooltip>
    </Box>
  );
};

export default ShippingToggle;
