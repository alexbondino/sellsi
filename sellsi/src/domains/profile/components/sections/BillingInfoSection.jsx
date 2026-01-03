import React from 'react';
import {
  Box,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
} from '@mui/material';
import { regiones, getComunasByRegion } from '../../../../utils/chileData';
import { validateRut, validateEmail } from '../../../../utils/validators';
import {
  getHighlightFieldStyle,
  getHighlightHelperText,
} from '../../../../utils/fieldHighlightStyles';

/**
 * Sección de Facturación del perfil
 * Layout: 2 columnas - campos a la izquierda, descripciones a la derecha
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
  showBilling = true,
  showUpdateButton = true,
  showErrors = false,
  shouldHighlight = false,
  id,
}) => {
  const handleRegionChange = event => {
    const value = event.target.value;
    onRegionChange('billing', 'billingRegion', 'billingCommune', value);
  };

  if (!showBilling) {
    return null;
  }

  const isHighlighted = showErrors || shouldHighlight;
  const businessNameFilled = !!(
    formData.businessName && formData.businessName.trim() !== ''
  );
  const shouldShowError = fieldValue =>
    isHighlighted &&
    businessNameFilled &&
    (!fieldValue || String(fieldValue).trim() === '');

  return (
    <Box id={id} sx={{ p: 3, height: 'fit-content' }}>
      {/* Header de la sección */}
      <Box sx={{ mb: 2.5 }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Facturación
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
          Datos para emisión de documentos tributarios
        </Typography>
        <Box sx={{ mt: 1.5, borderBottom: 2, borderColor: 'primary.main' }} />
      </Box>

      {/* Layout 2 columnas */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
          gap: 3,
        }}
      >
        {/* Columna izquierda - Campos */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {/* Razón Social */}
          <TextField
            label="Razón Social"
            value={formData.businessName || ''}
            onChange={e => onFieldChange('businessName', e.target.value)}
            fullWidth
            variant="outlined"
            size="small"
            placeholder="Nombre de empresa o persona"
          />

          {/* RUT */}
          <TextField
            label="RUT"
            value={formData.billingRut || ''}
            onChange={e => {
              const raw = e.target.value.replace(/[^0-9kK]/g, '');
              const formatted = raw.replace(
                /(\d{1,2})(\d{3})(\d{3})([\dkK])?$/,
                (match, p1, p2, p3, p4) => {
                  let rut = p1 + '.' + p2 + '.' + p3;
                  if (p4) rut += '-' + p4;
                  return rut;
                }
              );
              onFieldChange('billingRut', formatted);
            }}
            fullWidth
            variant="outlined"
            size="small"
            placeholder="12.345.678-9"
            error={
              !validateRut(formData.billingRut) ||
              shouldShowError(formData.billingRut)
            }
            helperText={getHighlightHelperText(
              formData.billingRut,
              shouldShowError(formData.billingRut),
              !validateRut(formData.billingRut)
                ? 'Formato de RUT inválido'
                : '',
              'RUT es obligatorio'
            )}
            sx={getHighlightFieldStyle(
              formData.billingRut,
              shouldShowError(formData.billingRut)
            )}
          />

          {/* Giro */}
          <TextField
            label="Giro"
            value={formData.businessLine || ''}
            onChange={e => onFieldChange('businessLine', e.target.value)}
            fullWidth
            variant="outlined"
            size="small"
            placeholder="Ej: Comercio al por menor"
            error={shouldShowError(formData.businessLine)}
            helperText={getHighlightHelperText(
              formData.businessLine,
              shouldShowError(formData.businessLine),
              '',
              'Giro es obligatorio'
            )}
            sx={getHighlightFieldStyle(
              formData.businessLine,
              shouldShowError(formData.businessLine)
            )}
          />

          {/* Dirección */}
          <TextField
            label="Dirección"
            value={formData.billingAddress || ''}
            onChange={e => onFieldChange('billingAddress', e.target.value)}
            fullWidth
            variant="outlined"
            size="small"
            placeholder="Dirección fiscal"
            error={shouldShowError(formData.billingAddress)}
            helperText={getHighlightHelperText(
              formData.billingAddress,
              shouldShowError(formData.billingAddress),
              '',
              'Dirección es obligatoria'
            )}
            sx={getHighlightFieldStyle(
              formData.billingAddress,
              shouldShowError(formData.billingAddress)
            )}
          />

          {/* Región */}
          <FormControl
            fullWidth
            size="small"
            error={shouldShowError(formData.billingRegion)}
            sx={getHighlightFieldStyle(
              formData.billingRegion,
              shouldShowError(formData.billingRegion)
            )}
          >
            <InputLabel
              sx={
                shouldShowError(formData.billingRegion)
                  ? { color: '#f44336', fontWeight: 'bold' }
                  : {}
              }
            >
              Región
            </InputLabel>
            <Select
              value={formData.billingRegion || ''}
              onChange={handleRegionChange}
              label="Región"
              MenuProps={{
                disableScrollLock: true,
                PaperProps: { style: { maxHeight: 48 * 5 + 8 } },
              }}
            >
              {regiones.map(region => (
                <MenuItem key={region.value} value={region.value}>
                  {region.label}
                </MenuItem>
              ))}
            </Select>
            {shouldShowError(formData.billingRegion) && (
              <Typography variant="caption" color="error">
                Región es obligatoria
              </Typography>
            )}
          </FormControl>

          {/* Comuna */}
          <FormControl
            fullWidth
            size="small"
            disabled={!formData.billingRegion}
            error={shouldShowError(formData.billingCommune)}
            sx={getHighlightFieldStyle(
              formData.billingCommune,
              shouldShowError(formData.billingCommune)
            )}
          >
            <InputLabel
              sx={
                shouldShowError(formData.billingCommune)
                  ? { color: '#f44336', fontWeight: 'bold' }
                  : {}
              }
            >
              Comuna
            </InputLabel>
            <Select
              value={formData.billingCommune || ''}
              onChange={e => onFieldChange('billingCommune', e.target.value)}
              label="Comuna"
              MenuProps={{
                disableScrollLock: true,
                PaperProps: { style: { maxHeight: 48 * 5 + 8 } },
              }}
            >
              {(formData.billingRegion
                ? getComunasByRegion(formData.billingRegion)
                : []
              ).map(comuna => (
                <MenuItem key={comuna.value} value={comuna.value}>
                  {comuna.label}
                </MenuItem>
              ))}
            </Select>
            {shouldShowError(formData.billingCommune) && (
              <Typography variant="caption" color="error">
                Comuna es obligatoria
              </Typography>
            )}
          </FormControl>

          {/* Botón Actualizar */}
          {showUpdateButton && (
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
              <Button
                variant="contained"
                onClick={onUpdate}
                disabled={!hasChanges || loading}
              >
                {loading ? 'Actualizando...' : 'Actualizar'}
              </Button>
            </Box>
          )}
        </Box>

        {/* Columna derecha - Descripciones */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            p: 2,
            backgroundColor: 'rgba(0,0,0,0.02)',
            borderRadius: 2,
            height: 'fit-content',
          }}
        >
          <Typography
            variant="subtitle2"
            sx={{ fontWeight: 600, color: 'primary.main', mb: 1 }}
          >
            ℹ️ Información de ayuda
          </Typography>

          <Box>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              ¿Para qué son estos datos?
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}
            >
              Si compras, los proveedores usarán estos datos para emitir tus
              facturas. Si vendes, Sellsi te facturará a estos datos.
            </Typography>
          </Box>

          <Box>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              Razón Social
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}
            >
              Nombre legal de tu empresa o tu nombre si eres persona natural con
              giro.
            </Typography>
          </Box>

          <Box>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              RUT de Facturación
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}
            >
              RUT de la empresa o persona a quien se emitirá la factura. Debe
              estar registrado en el SII.
            </Typography>
          </Box>

          <Box>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              Giro Comercial
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}
            >
              Actividad económica principal según tu registro en el SII.
            </Typography>
          </Box>

          <Box>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              Dirección Fiscal
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}
            >
              Dirección registrada en el SII. Esta aparecerá en las facturas que
              recibas.
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default BillingInfoSection;
