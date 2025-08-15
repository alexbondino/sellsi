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
 * Sección de Dirección de Despacho del perfil
 * Incluye: región, comuna, dirección, número, departamento
 */
const ShippingInfoSection = ({ 
  formData, 
  onFieldChange,
  onRegionChange 
  , showErrors = false
}) => {
  
  const handleRegionChange = (event) => {
    const value = event.target.value;
    onRegionChange('shipping', 'shippingRegion', 'shippingCommune', value);
  };

  return (
    <Box sx={{ p: 3, height: 'fit-content' }}>
      <Box sx={{ mb: 2 }}>
        <Typography variant="h6">Dirección de Despacho</Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Aquí enviaremos los productos que compres en el Marketplace
        </Typography>
        <Box sx={{ mt: 1, borderBottom: 2, borderColor: 'primary.main' }} />
      </Box>
      
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <FormControl fullWidth size="small">
          <InputLabel>Región</InputLabel>
          <Select
            value={formData.shippingRegion || ''}
            onChange={handleRegionChange}
            label="Región"
            MenuProps={{ 
              disableScrollLock: true,
              disablePortal: false,
              anchorOrigin: {
                vertical: 'bottom',
                horizontal: 'left',
              },
              transformOrigin: {
                vertical: 'top',
                horizontal: 'left',
              },
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
        
  <FormControl fullWidth size="small" disabled={!formData.shippingRegion} error={showErrors && !formData.shippingCommune}>
          <InputLabel>Comuna</InputLabel>
          <Select
            value={formData.shippingCommune || ''}
            onChange={(e) => {
              onFieldChange('shippingCommune', e.target.value);
            }}
            label="Comuna"
            MenuProps={{ 
              disableScrollLock: true,
              disablePortal: false,
              anchorOrigin: {
                vertical: 'bottom',
                horizontal: 'left',
              },
              transformOrigin: {
                vertical: 'top',
                horizontal: 'left',
              },
              PaperProps: {
                style: {
                  maxHeight: 48 * 5 + 8,
                  overflowX: 'hidden',
                  overflowY: 'auto',
                },
              },
            }}
          >
            {(formData.shippingRegion ? getComunasByRegion(formData.shippingRegion) : []).map(comuna => (
              <MenuItem key={comuna.value} value={comuna.value}>
                {comuna.label}
              </MenuItem>
            ))}
            </Select>
            {showErrors && !formData.shippingCommune ? (
              <Typography variant="caption" color="error">Comuna es obligatoria</Typography>
            ) : null}
        </FormControl>
        
        <TextField
          label="Dirección de Envío"
          value={formData.shippingAddress || ''}
          onChange={(e) => onFieldChange('shippingAddress', e.target.value)}
          fullWidth
          variant="outlined"
          size="small"
          placeholder="Halimeda 433"
          error={showErrors && !formData.shippingAddress}
          helperText={showErrors && !formData.shippingAddress ? 'Dirección de envío es obligatoria' : ''}
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
