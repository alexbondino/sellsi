import React from 'react';
import { 
  Box, 
  Typography, 
  TextField, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem,
  Button 
} from '@mui/material';
import { 
  regiones, 
  getComunasByRegion 
} from '../../../../utils/chileData';
import { validateRut, validateEmail } from '../../../../utils/validators';

/**
 * Sección de Facturación del perfil
 * Incluye: razón social, RUT, giro, dirección, región, comuna y botón actualizar
 * Solo se muestra si el documento tributario incluye "Factura"
 */
const BillingInfoSection = ({ 
  formData, 
  onFieldChange,
  onRegionChange,
  hasChanges,
  loading,
  onUpdate,
  getSensitiveFieldValue,
  onFocusSensitive,
  onBlurSensitive,
  showBilling = true,  // Nueva prop para controlar visibilidad
  showUpdateButton = true  // Nueva prop para controlar el botón
}) => {
  
  const handleRegionChange = (event) => {
    const value = event.target.value;
    onRegionChange('billing', 'billingRegion', 'billingCommune', value);
  };

  // No renderizar si showBilling es false
  if (!showBilling) {
    return null;
  }

  return (
    <Box sx={{ p: 3, height: 'fit-content' }}>
      <Box sx={{ mb: 2 }}>
        <Typography variant="h6">Facturación</Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Si compras los Proveedores te facturarán y si vendes Sellsi te facturará
        </Typography>
        <Box sx={{ mt: 1, borderBottom: 2, borderColor: 'primary.main' }} />
      </Box>
      
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <TextField
          label="Razón Social"
          value={formData.businessName || ''}
          onChange={(e) => onFieldChange('businessName', e.target.value)}
          fullWidth
          variant="outlined"
          size="small"
        />
        
        <TextField
          label="RUT"
          value={formData.billingRut || ''}
          onChange={(e) => {
            const raw = e.target.value.replace(/[^0-9kK]/g, '');
            const formatted = raw.replace(/(\d{1,2})(\d{3})(\d{3})([\dkK])?$/, (match, p1, p2, p3, p4) => {
              let rut = p1 + '.' + p2 + '.' + p3;
              if (p4) rut += '-' + p4;
              return rut;
            });
            onFieldChange('billingRut', formatted);
          }}
          fullWidth
          variant="outlined"
          size="small"
          error={!validateRut(formData.billingRut)}
          helperText={!validateRut(formData.billingRut) ? 'Formato de RUT inválido' : ''}

        />
        
        <TextField
          label="Giro"
          value={formData.businessLine || ''}
          onChange={(e) => onFieldChange('businessLine', e.target.value)}
          fullWidth
          variant="outlined"
          size="small"
        />
        
        <TextField
          label="Dirección"
          value={formData.billingAddress || ''}
          onChange={(e) => onFieldChange('billingAddress', e.target.value)}
          fullWidth
          variant="outlined"
          size="small"
        />
        
        <FormControl fullWidth size="small">
          <InputLabel>Región</InputLabel>
          <Select
            value={formData.billingRegion || ''}
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
        
        <FormControl fullWidth size="small" disabled={!formData.billingRegion}>
          <InputLabel>Comuna</InputLabel>
          <Select
            value={formData.billingCommune || ''}
            onChange={(e) => onFieldChange('billingCommune', e.target.value)}
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
            {(formData.billingRegion ? getComunasByRegion(formData.billingRegion) : []).map(comuna => (
              <MenuItem key={comuna.value} value={comuna.value}>
                {comuna.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        
        {/* Botón Actualizar - Solo se muestra si showUpdateButton es true */}
        {showUpdateButton && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
            <Button 
              variant="contained" 
              onClick={onUpdate}
              disabled={!hasChanges || loading}
              sx={{ 
                bgcolor: 'primary.main',
                '&:hover': { bgcolor: 'primary.dark' }
              }}
            >
              {loading ? 'Actualizando...' : 'Actualizar'}
            </Button>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default BillingInfoSection;
