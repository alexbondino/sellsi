import React from 'react';
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  ToggleButtonGroup,
  ToggleButton,
  Stack,
} from '@mui/material';

/**
 * Componente para la gestión de inventario y precios
 * Maneja stock, compra mínima, precio por unidad y configuración de precios
 */
const ProductInventory = ({
  formData,
  errors,
  localErrors,
  touched,
  triedSubmit,
  onInputChange,
  onFieldBlur,
  onPricingTypeChange,
  isMobile = false, // 🔧 Nueva prop para móvil
}) => {
  // 🔧 NUEVA FUNCIÓN: Validar stock vs tramos
  const getStockValidationError = () => {
    // Solo validar si estamos en modo volumen y hay tramos configurados
    if (
      formData.pricingType !== 'Volumen' ||
      !formData.tramos ||
      formData.tramos.length === 0
    ) {
      return null;
    }

    const stock = parseInt(formData.stock) || 0;
    if (stock <= 0) return null;

    // Buscar tramos cuyas cantidades min o max excedan el stock
    const invalidTramos = formData.tramos.filter((tramo, index) => {
      const min = parseInt(tramo.min) || 0;
      const max = parseInt(tramo.max) || 0;

      // Verificar MIN
      if (min > stock) return true;

      // Verificar MAX solo si no es el último tramo (el último tiene MAX = stock automáticamente)
      if (index < formData.tramos.length - 1 && max > 0 && max > stock)
        return true;

      return false;
    });

    if (invalidTramos.length > 0) {
      return 'El stock no puede ser menor a las cantidades de los tramos configurados';
    }

    return null;
  };

  // Obtener error de validación de stock
  const stockValidationError = getStockValidationError();

  // Combinar errores existentes con el nuevo error de validación
  const finalStockError =
    touched.stock || triedSubmit
      ? errors.stock || localErrors.stock || stockValidationError
      : stockValidationError;

  const showVolumeHelp = formData.pricingType === 'Volumen';

  return (
    <Box>
      {isMobile ? (
        // 📱 Layout Móvil - Stack Vertical
        <Box>
          <Stack spacing={2}>
            <TextField
              fullWidth
              label="Stock Disponible"
              placeholder="Ingrese su stock"
              value={formData.stock}
              onChange={onInputChange('stock')}
              onBlur={() => onFieldBlur('stock')}
              error={!!finalStockError}
              helperText={finalStockError || ''}
              type="number"
              inputProps={{
                min: 1,
                max: 15000,
                step: 1,
                onInput: e => {
                  if (
                    e.target.value.includes('.') ||
                    e.target.value.includes('-')
                  ) {
                    e.target.value = e.target.value.replace(/[.-]/g, '');
                  }
                },
              }}
              autoComplete="off"
              size="medium"
            />

            <Box>
              <Typography
                variant="subtitle2"
                gutterBottom
                sx={{ fontWeight: 600, mb: 2 }}
              >
                Precio a cobrar por:
              </Typography>
              <ToggleButtonGroup
                value={formData.pricingType}
                exclusive
                onChange={onPricingTypeChange}
                sx={{
                  width: '100%',
                  '& .MuiToggleButton-root': {
                    fontSize: '0.875rem',
                    padding: '8px 12px',
                  },
                }}
              >
                <ToggleButton
                  value="Unidad"
                  sx={{ textTransform: 'none', width: '100%' }}
                >
                  Unidad
                </ToggleButton>
                <ToggleButton
                  value="Volumen"
                  sx={{ textTransform: 'none', width: '100%' }}
                >
                  Volumen
                </ToggleButton>
              </ToggleButtonGroup>

              {showVolumeHelp && (
                <Box sx={{ mt: 1.5 }}>
                  <Typography variant="body2">
                    Permite asignar hasta 5 precios según la cantidad que te
                    compren. Por ejemplo: si te compran entre 1 y 9 unidades,
                    pagan $100 por unidad; si te compran 10 o más, pagan $90.
                  </Typography>
                </Box>
              )}
            </Box>
          </Stack>
        </Box>
      ) : (
        // 🖥️ Layout Desktop
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box>
            <Typography
              variant="h6"
              gutterBottom
              sx={{ fontWeight: 600, color: 'black', mb: 2 }}
            >
              Condiciones de Venta
            </Typography>

            {/* Stock */}
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <TextField
                sx={{ width: '100%' }}
                label="Stock Disponible"
                placeholder="Ingrese su stock"
                value={formData.stock}
                onChange={onInputChange('stock')}
                onBlur={() => onFieldBlur('stock')}
                error={!!finalStockError}
                helperText={finalStockError || ''}
                type="number"
                inputProps={{
                  min: 1,
                  max: 15000,
                  step: 1,
                  onInput: e => {
                    if (
                      e.target.value.includes('.') ||
                      e.target.value.includes('-')
                    ) {
                      e.target.value = e.target.value.replace(/[.-]/g, '');
                    }
                  },
                }}
                autoComplete="off"
              />
            </Box>

            <Typography
              variant="subtitle2"
              gutterBottom
              sx={{ fontWeight: 600, mb: 2 }}
            >
              Precio a cobrar por:
            </Typography>

            {/* Grupo Unidad / Volumen ocupando el 50% */}
            <Box
              sx={{
                width: '100%',
                mb: showVolumeHelp ? 1 : 3, // un poco menos si mostramos ayuda debajo
              }}
            >
              <ToggleButtonGroup
                value={formData.pricingType}
                exclusive
                onChange={onPricingTypeChange}
                sx={{
                  width: '100%',
                }}
              >
                <ToggleButton
                  value="Unidad"
                  sx={{
                    textTransform: 'none',
                    flex: 1,
                  }}
                >
                  Unidad
                </ToggleButton>
                <ToggleButton
                  value="Volumen"
                  sx={{
                    textTransform: 'none',
                    flex: 1,
                  }}
                >
                  Volumen
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>

            {showVolumeHelp && (
              <Box
                sx={{
                  width: '100%',
                  mb: 3,
                }}
              >
                <Typography variant="body5">
                  Permite asignar hasta 5 precios según la cantidad que te
                  compren. Por ejemplo: si te compran entre 1 y 9 unidades,
                  pagan $100 por unidad; si te compran 10 o más, pagan $90.
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default ProductInventory;
