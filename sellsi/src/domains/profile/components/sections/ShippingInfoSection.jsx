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
} from '../../../../utils/chileData';

/**
 * Sección de Información de Envío del perfil
 * Incluye: región, comuna, dirección, número, departamento
 */
const ShippingInfoSection = ({ 
  formData, 
  onFieldChange,
  onRegionChange 
}) => {
  
  const handleRegionChange = (event) => {
    const value = event.target.value;
    console.log('[ShippingInfoSection] Región seleccionada:', value);
    onRegionChange('shipping', 'shippingRegion', 'shippingComuna', value);
  };

  return (
    <Box sx={{ p: 3, height: 'fit-content' }}>
      <Typography variant="h6" sx={{ mb: 2, pb: 1, borderBottom: 2, borderColor: 'primary.main' }}>
        Información de Envío
      </Typography>
      
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <FormControl fullWidth size="small">
          <InputLabel>Región</InputLabel>
          <Select
            value={formData.shippingRegion || ''}
            onChange={handleRegionChange}
            label="Región"
            MenuProps={{ disableScrollLock: true }}
          >
            {regiones.map(region => (
              <MenuItem key={region.value} value={region.value}>
                {region.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        
        <FormControl fullWidth size="small" disabled={!formData.shippingRegion}>
          <InputLabel>Comuna</InputLabel>
          <Select
            value={formData.shippingComuna || ''}
            onChange={(e) => {
              console.log('[ShippingInfoSection] Comuna seleccionada:', e.target.value);
              onFieldChange('shippingComuna', e.target.value);
            }}
            label="Comuna"
            MenuProps={{ disableScrollLock: true }}
          >
            {(formData.shippingRegion ? getComunasByRegion(formData.shippingRegion) : []).map(comuna => (
              <MenuItem key={comuna.value} value={comuna.value}>
                {comuna.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        
        <TextField
          label="Dirección de Envío"
          value={formData.shippingAddress || ''}
          onChange={(e) => onFieldChange('shippingAddress', e.target.value)}
          fullWidth
          variant="outlined"
          size="small"
          placeholder="Halimeda 433"
        />
        
        <TextField
          label="Dirección Número"
          value={formData.shippingNumber || ''}
          onChange={(e) => onFieldChange('shippingNumber', e.target.value)}
          fullWidth
          variant="outlined"
          size="small"
          type="number"
        />
        
        <TextField
          label="Dirección Depto."
          value={formData.shippingDept || ''}
          onChange={(e) => onFieldChange('shippingDept', e.target.value)}
          fullWidth
          variant="outlined"
          size="small"
          placeholder="Depto. 101"
        />
      </Box>
    </Box>
  );
};

export default ShippingInfoSection;
