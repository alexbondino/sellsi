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
import { 
  getHighlightFieldStyle, 
  getHighlightHelperText 
} from '../../../../utils/fieldHighlightStyles';

/**
 * Sección de Dirección de Despacho del perfil
 * Incluye: región, comuna, dirección, número, departamento
 */
const ShippingInfoSection = ({ 
  formData, 
  onFieldChange,
  onRegionChange,
  showErrors = false,
  shouldHighlight = false // Nueva prop para highlight visual consistente
}) => {
  
  // Combinar showErrors (validación) con shouldHighlight (redirección desde modal)
  const isHighlighted = showErrors || shouldHighlight;

  const handleRegionChange = (event) => {
    const value = event.target.value;
    onRegionChange('shipping', 'shippingRegion', 'shippingCommune', value);
  };

  return (
    <Box id="shipping-info-section" sx={{ p: 3, height: 'fit-content' }}>
      <Box sx={{ mb: 2 }}>
        <Typography variant="h6">Dirección de Despacho</Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Aquí enviaremos los productos que compres en el Marketplace
        </Typography>
        <Box sx={{ mt: 1, borderBottom: 2, borderColor: 'primary.main' }} />
      </Box>
      
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <FormControl 
          fullWidth 
          size="small" 
          error={isHighlighted && !formData.shippingRegion}
          sx={getHighlightFieldStyle(formData.shippingRegion, isHighlighted)}
        >
          <InputLabel sx={isHighlighted && !formData.shippingRegion ? { color: '#f44336', fontWeight: 'bold' } : {}}>
            Región
          </InputLabel>
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
          {isHighlighted && !formData.shippingRegion && (
            <Typography variant="caption" color="error">Región es obligatoria</Typography>
          )}
        </FormControl>
        
        <FormControl 
          fullWidth 
          size="small" 
          disabled={!formData.shippingRegion} 
          error={isHighlighted && !formData.shippingCommune}
          sx={getHighlightFieldStyle(formData.shippingCommune, isHighlighted)}
        >
          <InputLabel sx={isHighlighted && !formData.shippingCommune ? { color: '#f44336', fontWeight: 'bold' } : {}}>
            Comuna
          </InputLabel>
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
          {isHighlighted && !formData.shippingCommune && (
            <Typography variant="caption" color="error">Comuna es obligatoria</Typography>
          )}
        </FormControl>
        
        <TextField
          label="Dirección de Envío"
          value={formData.shippingAddress || ''}
          onChange={(e) => onFieldChange('shippingAddress', e.target.value)}
          fullWidth
          variant="outlined"
          size="small"
          placeholder="Halimeda 433"
          error={isHighlighted && !formData.shippingAddress}
          helperText={getHighlightHelperText(formData.shippingAddress, isHighlighted, '', 'Dirección de envío es obligatoria')}
          sx={getHighlightFieldStyle(formData.shippingAddress, isHighlighted)}
        />
        
        <TextField
          label="Dirección Número"
          value={formData.shippingNumber || ''}
          onChange={(e) => onFieldChange('shippingNumber', e.target.value)}
          fullWidth
          variant="outlined"
          size="small"
          type="number"
          error={isHighlighted && !formData.shippingNumber}
          helperText={getHighlightHelperText(formData.shippingNumber, isHighlighted, '', 'Número de dirección es obligatorio')}
          sx={getHighlightFieldStyle(formData.shippingNumber, isHighlighted)}
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
