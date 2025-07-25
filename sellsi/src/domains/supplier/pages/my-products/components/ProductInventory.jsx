import React from 'react';
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  ToggleButtonGroup,
  ToggleButton,
  Tooltip,
  IconButton,
} from '@mui/material';
import { Info as InfoIcon } from '@mui/icons-material';

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
}) => {
  return (
    <Box>
      <Typography
        variant="h6"
        gutterBottom
        sx={{ fontWeight: 600, color: 'black', mb: 2 }}
      >
        Inventario y Disponibilidad
      </Typography>
      <Box
        sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
      >
        {/* Primera fila: Stock y Compra Mínima */}
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            sx={{ width: '35%' }}
            label="Stock Disponible:"
            placeholder="Ingrese un número entre 1 y 15.000"
            value={formData.stock}
            onChange={onInputChange('stock')}
            onBlur={() => onFieldBlur('stock')}
            error={
              !!(touched.stock || triedSubmit) &&
              !!(errors.stock || localErrors.stock)
            }
            helperText={
              touched.stock || triedSubmit
                ? errors.stock || localErrors.stock
                : ''
            }
            type="number"
            inputProps={{ 
              min: 1, 
              max: 15000,
              step: 1,
              onInput: (e) => {
                // Solo permitir números enteros positivos
                if (e.target.value.includes('.') || e.target.value.includes('-')) {
                  e.target.value = e.target.value.replace(/[.-]/g, '');
                }
              }
            }}
            autoComplete="off"
          />
          <TextField
            sx={{ width: '35%' }}
            label="Compra Mínima:"
            placeholder="Seleccione un número entre 1 y 15.000"
            value={formData.compraMinima}
            onChange={onInputChange('compraMinima')}
            onBlur={() => onFieldBlur('compraMinima')}
            error={
              !!(touched.compraMinima || triedSubmit) &&
              !!(errors.compraMinima || localErrors.compraMinima)
            }
            helperText={
              touched.compraMinima || triedSubmit
                ? errors.compraMinima || localErrors.compraMinima
                : ''
            }
            type="number"
            inputProps={{ 
              min: 1, 
              max: 15000,
              step: 1,
              onInput: (e) => {
                // Solo permitir números enteros positivos
                if (e.target.value.includes('.') || e.target.value.includes('-')) {
                  e.target.value = e.target.value.replace(/[.-]/g, '');
                }
              }
            }}
            autoComplete="off"
          />
        </Box>

        {/* Segunda fila: Configuración de Precios y ToggleButtonGroup */}
        <Box>
          <Typography
            variant="h6"
            gutterBottom
            sx={{ fontWeight: 600, color: 'black', mb: 2 }}
          >
            Configuración de Precios
          </Typography>
          <Typography
            variant="subtitle2"
            gutterBottom
            sx={{ fontWeight: 600 , mb: 2 }}
          >
            Precio a cobrar según:
          </Typography>
          <ToggleButtonGroup
            value={formData.pricingType}
            exclusive
            onChange={onPricingTypeChange}
            sx={{ mb: 3 }}
          >
            <ToggleButton
              value="Por Unidad"
              sx={{ textTransform: 'none' }}
            >
              Por Unidad
            </ToggleButton>
            <ToggleButton
              value="Por Tramos"
              sx={{ textTransform: 'none' }}
            >
              Por Tramos
            </ToggleButton>
            <Tooltip
              title={
                <>
                  <b>¿Qué son los tramos?</b>
                  <br />
                  Permite asignar hasta 5 precios según la
                  cantidad que te compren. Por ejemplo: si te
                  compran entre 1 y 9 unidades, pagan $100 por
                  unidad; si te compran 10 o más, pagan $90.
                </>
              }
              placement="right"
              arrow
            >
              <IconButton
                size="small"
                sx={{
                  ml: 1,
                  boxShadow: 'none',
                  outline: 'none',
                  border: 'none',
                  '&:focus': {
                    outline: 'none',
                    border: 'none',
                    boxShadow: 'none',
                  },
                  '&:active': {
                    outline: 'none',
                    border: 'none',
                    boxShadow: 'none',
                  },
                }}
                disableFocusRipple
                disableRipple
              >
                <InfoIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </ToggleButtonGroup>

          {/* Campo Precio de Venta (condicional - misma ubicación que los tramos) */}
          {formData.pricingType === 'Por Unidad' && (
            <TextField
              sx={{ width: '73.51%' }}
              label="Precio de Venta:"
              placeholder="Campo de entrada"
              value={formData.precioUnidad}
              onChange={onInputChange('precioUnidad')}
              onBlur={() => onFieldBlur('precioUnidad')}
              error={
                !!(touched.precioUnidad || triedSubmit) &&
                !!(errors.precioUnidad || localErrors.precioUnidad)
              }
              helperText={
                touched.precioUnidad || triedSubmit
                  ? errors.precioUnidad ||
                    localErrors.precioUnidad
                  : ''
              }
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    $
                  </InputAdornment>
                ),
                inputProps: { 
                  min: 1,
                  step: 1,
                  onInput: (e) => {
                    // Solo permitir números enteros positivos
                    if (e.target.value.includes('.') || e.target.value.includes('-')) {
                      e.target.value = e.target.value.replace(/[.-]/g, '');
                    }
                  }
                },
              }}
              type="number"
              autoComplete="off"
            />
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default ProductInventory;
