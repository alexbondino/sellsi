import React from 'react';
import { 
  Box, 
  Typography, 
  TextField, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem
} from '@mui/material';
import { 
  regiones, 
  getComunasByRegion 
} from '../../../utils/chileData';
import { validateRut } from '../../../utils/validators';

/**
 * Componente modular para información de facturación
 * Reutilizable entre Profile y Onboarding
 */
const BillingInfoForm = ({ 
  formData = {},
  onFieldChange,
  onRegionChange,
  showTitle = true,
  size = 'small', // 'small' | 'medium'
  variant = 'outlined' // 'outlined' | 'standard' | 'filled'
}) => {

  const handleRegionChange = (event) => {
    const value = event.target.value;
    onFieldChange('billingRegion', value);
    // Limpiar comuna cuando cambia la región
    onFieldChange('billingComuna', '');
    
    // Si se proporciona onRegionChange, usarlo (compatibilidad con Profile)
    if (onRegionChange) {
      onRegionChange('billing', 'billingRegion', 'billingComuna', value);
    }
  };

  const handleRutChange = (e) => {
    const raw = e.target.value.replace(/[^0-9kK]/g, '');
    const formatted = raw.replace(/(\d{1,2})(\d{3})(\d{3})([\dkK])?$/, (match, p1, p2, p3, p4) => {
      let rut = p1 + '.' + p2 + '.' + p3;
      if (p4) rut += '-' + p4;
      return rut;
    });
    onFieldChange('billingRut', formatted);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {showTitle && (
        <Typography variant="h6" sx={{ mb: 1, pb: 1, borderBottom: 2, borderColor: 'primary.main' }}>
          Información de Facturación
        </Typography>
      )}
      
      <TextField
        label="Razón Social *"
        value={formData.businessName || ''}
        onChange={(e) => onFieldChange('businessName', e.target.value)}
        fullWidth
        variant={variant}
        size={size}
        required
      />
      
      <TextField
        label="RUT *"
        value={formData.billingRut || ''}
        onChange={handleRutChange}
        fullWidth
        variant={variant}
        size={size}
        required
        error={formData.billingRut && !validateRut(formData.billingRut)}
        helperText={
          formData.billingRut && !validateRut(formData.billingRut) 
            ? 'Formato de RUT inválido (ej: 12.345.678-5)' 
            : ''
        }
        placeholder="12.345.678-5"
      />
      
      <TextField
        label="Giro *"
        value={formData.businessLine || ''}
        onChange={(e) => onFieldChange('businessLine', e.target.value)}
        fullWidth
        variant={variant}
        size={size}
        required
        placeholder="Ej: Comercio de productos alimenticios"
      />
      
      <TextField
        label="Dirección *"
        value={formData.billingAddress || ''}
        onChange={(e) => onFieldChange('billingAddress', e.target.value)}
        fullWidth
        variant={variant}
        size={size}
        required
        placeholder="Ej: Av. Providencia 1234"
      />
      
      <Box sx={{ display: 'flex', gap: 2 }}>
        <FormControl fullWidth size={size}>
          <InputLabel>Región *</InputLabel>
          <Select
            value={formData.billingRegion || ''}
            onChange={handleRegionChange}
            label="Región *"
            MenuProps={{ 
              disableScrollLock: true,
              disablePortal: true,
              PaperProps: {
                style: {
                  maxHeight: 48 * 5 + 8,
                  overflowX: 'hidden',
                  overflowY: 'auto',
                },
              },
            }}
          >
            {regiones.map(region => (
              <MenuItem key={region.value} value={region.value}>
                {region.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        
        <FormControl fullWidth size={size} disabled={!formData.billingRegion}>
          <InputLabel>Comuna *</InputLabel>
          <Select
            value={formData.billingComuna || ''}
            onChange={(e) => onFieldChange('billingComuna', e.target.value)}
            label="Comuna *"
            MenuProps={{ 
              disableScrollLock: true,
              disablePortal: true,
              PaperProps: {
                style: {
                  maxHeight: 48 * 5 + 8,
                  overflowX: 'hidden',
                  overflowY: 'auto',
                },
              },
            }}
          >
            {(formData.billingRegion ? getComunasByRegion(formData.billingRegion) : []).map(comuna => (
              <MenuItem key={comuna.value} value={comuna.value}>
                {comuna.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
    </Box>
  );
};

export default BillingInfoForm;
