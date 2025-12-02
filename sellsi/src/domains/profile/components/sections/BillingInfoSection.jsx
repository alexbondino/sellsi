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
import { 
  getHighlightFieldStyle, 
  getHighlightHelperText 
} from '../../../../utils/fieldHighlightStyles';

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
  showUpdateButton = true,  // Nueva prop para controlar el botón
  showErrors = false, // Mostrar errores cuando validación falle
  shouldHighlight = false, // Nueva prop para highlight visual consistente
  id // Prop para identificar la sección (scroll/highlight)
}) => {
  
  const handleRegionChange = (event) => {
    const value = event.target.value;
    onRegionChange('billing', 'billingRegion', 'billingCommune', value);
  };

  // No renderizar si showBilling es false
  if (!showBilling) {
    return null;
  }

  // Combinar showErrors (validación) con shouldHighlight (redirección desde modal)
  const isHighlighted = showErrors || shouldHighlight;
  const businessNameFilled = !!(formData.businessName && formData.businessName.trim() !== '');
  const shouldShowError = (fieldValue) => isHighlighted && businessNameFilled && (!fieldValue || String(fieldValue).trim() === '');

  return (
    <Box id={id} sx={{ p: 3, height: 'fit-content' }}>
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
          error={(!validateRut(formData.billingRut)) || shouldShowError(formData.billingRut)}
          helperText={getHighlightHelperText(
            formData.billingRut, 
            shouldShowError(formData.billingRut), 
            !validateRut(formData.billingRut) ? 'Formato de RUT inválido' : '', 
            'RUT es obligatorio'
          )}
          sx={getHighlightFieldStyle(formData.billingRut, shouldShowError(formData.billingRut))}
        />
        
        <TextField
          label="Giro"
          value={formData.businessLine || ''}
          onChange={(e) => onFieldChange('businessLine', e.target.value)}
          fullWidth
          variant="outlined"
          size="small"
          error={shouldShowError(formData.businessLine)}
          helperText={getHighlightHelperText(formData.businessLine, shouldShowError(formData.businessLine), '', 'Giro es obligatorio')}
          sx={getHighlightFieldStyle(formData.businessLine, shouldShowError(formData.businessLine))}
        />
        
        <TextField
          label="Dirección"
          value={formData.billingAddress || ''}
          onChange={(e) => onFieldChange('billingAddress', e.target.value)}
          fullWidth
          variant="outlined"
          size="small"
          error={shouldShowError(formData.billingAddress)}
          helperText={getHighlightHelperText(formData.billingAddress, shouldShowError(formData.billingAddress), '', 'Dirección es obligatoria')}
          sx={getHighlightFieldStyle(formData.billingAddress, shouldShowError(formData.billingAddress))}
        />
        
        <FormControl 
          fullWidth 
          size="small" 
          error={shouldShowError(formData.billingRegion)}
          sx={getHighlightFieldStyle(formData.billingRegion, shouldShowError(formData.billingRegion))}
        >
          <InputLabel sx={shouldShowError(formData.billingRegion) ? { color: '#f44336', fontWeight: 'bold' } : {}}>
            Región
          </InputLabel>
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
          {shouldShowError(formData.billingRegion) && (
            <Typography variant="caption" color="error">Región es obligatoria</Typography>
          )}
        </FormControl>
        
        <FormControl 
          fullWidth 
          size="small" 
          disabled={!formData.billingRegion} 
          error={shouldShowError(formData.billingCommune)}
          sx={getHighlightFieldStyle(formData.billingCommune, shouldShowError(formData.billingCommune))}
        >
          <InputLabel sx={shouldShowError(formData.billingCommune) ? { color: '#f44336', fontWeight: 'bold' } : {}}>
            Comuna
          </InputLabel>
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
          {shouldShowError(formData.billingCommune) && (
            <Typography variant="caption" color="error">Comuna es obligatoria</Typography>
          )}
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
