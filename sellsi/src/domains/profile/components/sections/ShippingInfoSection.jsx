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
import {
  getHighlightFieldStyle,
  getHighlightHelperText,
} from '../../../../utils/fieldHighlightStyles';

/**
 * Sección de Dirección de Despacho del perfil
 * Layout: 2 columnas - campos a la izquierda, descripciones a la derecha
 */
const ShippingInfoSection = ({
  formData,
  onFieldChange,
  onRegionChange,
  showErrors = false,
  shouldHighlight = false,
}) => {
  const isHighlighted = showErrors || shouldHighlight;

  const handleRegionChange = event => {
    const value = event.target.value;
    onRegionChange('shipping', 'shippingRegion', 'shippingCommune', value);
  };

  return (
    <Box id="shipping-info-section" sx={{ p: 3, height: 'fit-content' }}>
      {/* Header de la sección */}
      <Box sx={{ mb: 2.5 }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Dirección de Despacho
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
          Dirección donde recibirás tus compras
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
          {/* Región */}
          <FormControl
            fullWidth
            size="small"
            error={isHighlighted && !formData.shippingRegion}
            sx={getHighlightFieldStyle(formData.shippingRegion, isHighlighted)}
          >
            <InputLabel
              sx={
                isHighlighted && !formData.shippingRegion
                  ? { color: '#f44336', fontWeight: 'bold' }
                  : {}
              }
            >
              Región
            </InputLabel>
            <Select
              value={formData.shippingRegion || ''}
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
            {isHighlighted && !formData.shippingRegion && (
              <Typography variant="caption" color="error">
                Región es obligatoria
              </Typography>
            )}
          </FormControl>

          {/* Comuna */}
          <FormControl
            fullWidth
            size="small"
            disabled={!formData.shippingRegion}
            error={isHighlighted && !formData.shippingCommune}
            sx={getHighlightFieldStyle(formData.shippingCommune, isHighlighted)}
          >
            <InputLabel
              sx={
                isHighlighted && !formData.shippingCommune
                  ? { color: '#f44336', fontWeight: 'bold' }
                  : {}
              }
            >
              Comuna
            </InputLabel>
            <Select
              value={formData.shippingCommune || ''}
              onChange={e => onFieldChange('shippingCommune', e.target.value)}
              label="Comuna"
              MenuProps={{
                disableScrollLock: true,
                PaperProps: { style: { maxHeight: 48 * 5 + 8 } },
              }}
            >
              {(formData.shippingRegion
                ? getComunasByRegion(formData.shippingRegion)
                : []
              ).map(comuna => (
                <MenuItem key={comuna.value} value={comuna.value}>
                  {comuna.label}
                </MenuItem>
              ))}
            </Select>
            {isHighlighted && !formData.shippingCommune && (
              <Typography variant="caption" color="error">
                Comuna es obligatoria
              </Typography>
            )}
          </FormControl>

          {/* Dirección */}
          <TextField
            label="Dirección"
            value={formData.shippingAddress || ''}
            onChange={e => onFieldChange('shippingAddress', e.target.value)}
            fullWidth
            variant="outlined"
            size="small"
            placeholder="Ej: Av. Providencia"
            error={isHighlighted && !formData.shippingAddress}
            helperText={getHighlightHelperText(
              formData.shippingAddress,
              isHighlighted,
              '',
              'Dirección es obligatoria'
            )}
            sx={getHighlightFieldStyle(formData.shippingAddress, isHighlighted)}
          />

          {/* Número */}
          <TextField
            label="Número"
            value={formData.shippingNumber || ''}
            onChange={e => onFieldChange('shippingNumber', e.target.value.replace(/\D/g, ''))}
            inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
            fullWidth
            variant="outlined"
            size="small"
            placeholder="Ej: 1234"
            error={isHighlighted && !formData.shippingNumber}
            helperText={getHighlightHelperText(
              formData.shippingNumber,
              isHighlighted,
              '',
              'Número es obligatorio'
            )}
            sx={getHighlightFieldStyle(formData.shippingNumber, isHighlighted)}
          />

          {/* Departamento (opcional) */}
          <TextField
            label="Depto. / Oficina (opcional)"
            value={formData.shippingDept || ''}
            onChange={e => onFieldChange('shippingDept', e.target.value)}
            fullWidth
            variant="outlined"
            size="small"
            placeholder="Ej: Depto 101, Oficina 5"
          />
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
              ¿Para qué es esta dirección?
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}
            >
              Esta será la dirección predeterminada donde enviaremos los
              productos que compres en el Marketplace.
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
              Selecciona primero la región para habilitar el listado de comunas.
              Esta información se usa para calcular tiempos y costos de envío.
            </Typography>
          </Box>

          <Box>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              Dirección Completa
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}
            >
              Ingresa la calle y número exactamente como figura en la entrega.
              Puedes agregar referencias como departamento u oficina si aplica.
            </Typography>
          </Box>

          <Box>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              Importante
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}
            >
              Asegúrate de que la dirección esté completa y correcta para evitar
              retrasos en la entrega. Puedes actualizar esta información en
              cualquier momento.
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default ShippingInfoSection;
