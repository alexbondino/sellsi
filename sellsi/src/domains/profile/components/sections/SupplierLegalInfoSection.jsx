import React from 'react';
import {
  Box,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { regiones, getComunasByRegion } from '../../../../utils/chileData';
import { validateRut } from '../../../../utils/validators';
import {
  getHighlightFieldStyle,
  getHighlightHelperText,
} from '../../../../utils/fieldHighlightStyles';

/**
 * Sección de Información Legal del Proveedor
 * Layout: 2 columnas - campos a la izquierda, descripciones a la derecha
 * Estos datos se usarán para el sistema de financiamiento (tabla supplier)
 */
const SupplierLegalInfoSection = ({
  formData,
  onFieldChange,
  onRegionChange,
  showErrors = false,
  shouldHighlight = false,
  id,
}) => {
  const handleRegionChange = event => {
    const value = event.target.value;
    onRegionChange('supplier', 'supplierLegalRegion', 'supplierLegalCommune', value);
  };

  const isHighlighted = showErrors || shouldHighlight;
  
  // Validación: si llenó algo, debe llenar todo
  const anyFieldFilled = !!(
    formData.supplierLegalName ||
    formData.supplierLegalRut ||
    formData.supplierLegalRepName ||
    formData.supplierLegalRepRut ||
    formData.supplierLegalAddress ||
    formData.supplierLegalRegion ||
    formData.supplierLegalCommune
  );

  const shouldShowError = fieldValue =>
    isHighlighted &&
    anyFieldFilled &&
    (!fieldValue || String(fieldValue).trim() === '');

  return (
    <Box id={id} sx={{ p: 3, height: 'fit-content' }}>
      {/* Header de la sección */}
      <Box sx={{ mb: 2.5 }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Información Legal del Proveedor
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
          Datos legales de la empresa para financiamiento
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
          {/* RUT Empresa */}
          <TextField
            label="RUT Empresa"
            value={formData.supplierLegalRut || ''}
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
              onFieldChange('supplierLegalRut', formatted);
            }}
            fullWidth
            variant="outlined"
            size="small"
            placeholder="12.345.678-9"
            InputLabelProps={{ shrink: true }}
            error={
              (formData.supplierLegalRut && !validateRut(formData.supplierLegalRut)) ||
              shouldShowError(formData.supplierLegalRut)
            }
            helperText={getHighlightHelperText(
              formData.supplierLegalRut,
              shouldShowError(formData.supplierLegalRut),
              formData.supplierLegalRut && !validateRut(formData.supplierLegalRut)
                ? 'Formato de RUT inválido'
                : '',
              'RUT Empresa es obligatorio'
            )}
            sx={getHighlightFieldStyle(
              formData.supplierLegalRut,
              shouldShowError(formData.supplierLegalRut)
            )}
          />

          {/* Razón Social */}
          <TextField
            label="Razón Social"
            value={formData.supplierLegalName || ''}
            onChange={e => onFieldChange('supplierLegalName', e.target.value)}
            fullWidth
            variant="outlined"
            size="small"
            placeholder="Nombre legal de la empresa"
            InputLabelProps={{ shrink: true }}
            error={shouldShowError(formData.supplierLegalName)}
            helperText={getHighlightHelperText(
              formData.supplierLegalName,
              shouldShowError(formData.supplierLegalName),
              '',
              'Razón Social es obligatoria'
            )}
            sx={getHighlightFieldStyle(
              formData.supplierLegalName,
              shouldShowError(formData.supplierLegalName)
            )}
          />

          {/* RUT Representante Legal */}
          <TextField
            label="RUT Representante Legal"
            value={formData.supplierLegalRepRut || ''}
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
              onFieldChange('supplierLegalRepRut', formatted);
            }}
            fullWidth
            variant="outlined"
            size="small"
            placeholder="12.345.678-9"
            InputLabelProps={{ shrink: true }}
            error={
              (formData.supplierLegalRepRut && !validateRut(formData.supplierLegalRepRut)) ||
              shouldShowError(formData.supplierLegalRepRut)
            }
            helperText={getHighlightHelperText(
              formData.supplierLegalRepRut,
              shouldShowError(formData.supplierLegalRepRut),
              formData.supplierLegalRepRut && !validateRut(formData.supplierLegalRepRut)
                ? 'Formato de RUT inválido'
                : '',
              'RUT Representante Legal es obligatorio'
            )}
            sx={getHighlightFieldStyle(
              formData.supplierLegalRepRut,
              shouldShowError(formData.supplierLegalRepRut)
            )}
          />

          {/* Nombre Representante Legal */}
          <TextField
            label="Nombre Representante Legal"
            value={formData.supplierLegalRepName || ''}
            onChange={e => onFieldChange('supplierLegalRepName', e.target.value)}
            fullWidth
            variant="outlined"
            size="small"
            placeholder="Nombre completo del representante legal"
            InputLabelProps={{ shrink: true }}
            error={shouldShowError(formData.supplierLegalRepName)}
            helperText={getHighlightHelperText(
              formData.supplierLegalRepName,
              shouldShowError(formData.supplierLegalRepName),
              '',
              'Nombre Representante Legal es obligatorio'
            )}
            sx={getHighlightFieldStyle(
              formData.supplierLegalRepName,
              shouldShowError(formData.supplierLegalRepName)
            )}
          />

          {/* Domicilio */}
          <TextField
            label="Domicilio"
            value={formData.supplierLegalAddress || ''}
            onChange={e => onFieldChange('supplierLegalAddress', e.target.value)}
            fullWidth
            variant="outlined"
            size="small"
            placeholder="Dirección legal de la empresa"
            InputLabelProps={{ shrink: true }}
            error={shouldShowError(formData.supplierLegalAddress)}
            helperText={getHighlightHelperText(
              formData.supplierLegalAddress,
              shouldShowError(formData.supplierLegalAddress),
              '',
              'Domicilio es obligatorio'
            )}
            sx={getHighlightFieldStyle(
              formData.supplierLegalAddress,
              shouldShowError(formData.supplierLegalAddress)
            )}
          />

          {/* Región */}
          <FormControl
            fullWidth
            size="small"
            error={shouldShowError(formData.supplierLegalRegion)}
            sx={getHighlightFieldStyle(
              formData.supplierLegalRegion,
              shouldShowError(formData.supplierLegalRegion)
            )}
          >
            <InputLabel
              sx={
                shouldShowError(formData.supplierLegalRegion)
                  ? { color: '#f44336', fontWeight: 'bold' }
                  : {}
              }
            >
              Región
            </InputLabel>
            <Select
              value={formData.supplierLegalRegion || ''}
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
            {shouldShowError(formData.supplierLegalRegion) && (
              <Typography variant="caption" color="error">
                Región es obligatoria
              </Typography>
            )}
          </FormControl>

          {/* Comuna */}
          <FormControl
            fullWidth
            size="small"
            disabled={!formData.supplierLegalRegion}
            error={shouldShowError(formData.supplierLegalCommune)}
            sx={getHighlightFieldStyle(
              formData.supplierLegalCommune,
              shouldShowError(formData.supplierLegalCommune)
            )}
          >
            <InputLabel
              sx={
                shouldShowError(formData.supplierLegalCommune)
                  ? { color: '#f44336', fontWeight: 'bold' }
                  : {}
              }
            >
              Comuna
            </InputLabel>
            <Select
              value={formData.supplierLegalCommune || ''}
              onChange={e => onFieldChange('supplierLegalCommune', e.target.value)}
              label="Comuna"
              MenuProps={{
                disableScrollLock: true,
                PaperProps: { style: { maxHeight: 48 * 5 + 8 } },
              }}
            >
              {(formData.supplierLegalRegion
                ? getComunasByRegion(formData.supplierLegalRegion)
                : []
              ).map(comuna => (
                <MenuItem key={comuna.value} value={comuna.value}>
                  {comuna.label}
                </MenuItem>
              ))}
            </Select>
            {shouldShowError(formData.supplierLegalCommune) && (
              <Typography variant="caption" color="error">
                Comuna es obligatoria
              </Typography>
            )}
          </FormControl>
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
              Esta información legal se utilizará en el sistema de financiamiento
              de Sellsi para tus compradores.
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}
            >
              👉 Los datos se incluirán en los contratos y documentos de
              financiamiento.
            </Typography>
          </Box>

          <Box>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              RUT Empresa
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}
            >
              RUT de la empresa proveedora registrado en el SII.
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
              Nombre legal completo de la empresa según registro SII.
            </Typography>
          </Box>

          <Box>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              Representante Legal
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}
            >
              Persona autorizada para firmar contratos y documentos legales en
              nombre de la empresa.
            </Typography>
          </Box>

          <Box>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              Domicilio
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}
            >
              Dirección legal de la empresa registrada en el SII.
            </Typography>
          </Box>

          <Box>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              Región y Comuna
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}
            >
              Ubicación geográfica del domicilio legal.
            </Typography>
          </Box>

          <Box sx={{ mt: 2 }}>
            <Typography
              variant="caption"
              sx={{ color: 'text.secondary', display: 'block' }}
            >
              💡 Estos datos son opcionales pero recomendados para habilitar
              financiamiento con tus compradores.
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default SupplierLegalInfoSection;
