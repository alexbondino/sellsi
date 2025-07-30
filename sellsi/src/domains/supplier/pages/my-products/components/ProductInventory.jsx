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
  Stack,
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
  isMobile = false, // 🔧 Nueva prop para móvil
}) => {
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
                  if (e.target.value.includes('.') || e.target.value.includes('-')) {
                    e.target.value = e.target.value.replace(/[.-]/g, '');
                  }
                }
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
              <Stack direction="row" spacing={1} alignItems="center">
                <ToggleButtonGroup
                  value={formData.pricingType}
                  exclusive
                  onChange={onPricingTypeChange}
                  sx={{ 
                    flexShrink: 0,
                    '& .MuiToggleButton-root': {
                      fontSize: '0.875rem',
                      padding: '8px 12px',
                    }
                  }}
                >
                  <ToggleButton
                    value="Unidad"
                    sx={{ textTransform: 'none', minWidth: '80px' }}
                  >
                    Unidad
                  </ToggleButton>
                  <ToggleButton
                    value="Volumen"
                    sx={{ textTransform: 'none', minWidth: '80px' }}
                  >
                    Volumen
                  </ToggleButton>
                </ToggleButtonGroup>
                <Tooltip
                  title={
                    <>
                      <b>¿Qué son las ventas por Volumen?</b>
                      <br />
                      Permite asignar hasta 5 precios según la
                      cantidad que te compren. Por ejemplo: si te
                      compran entre 1 y 9 unidades, pagan $100 por
                      unidad; si te compran 10 o más, pagan $90.
                    </>
                  }
                  placement="top"
                  arrow
                  enterTouchDelay={0}
                  leaveTouchDelay={3000}
                  disableFocusListener={false}
                  disableHoverListener={false}
                  disableTouchListener={false}
                >
                  <IconButton
                    size="small"
                    sx={{
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
              </Stack>
            </Box>
          </Stack>
        </Box>
      ) : (
        // 🖥️ Layout Desktop - Mantener actual
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Segunda fila: Configuración de Precios y ToggleButtonGroup */}
          <Box>
            <Typography
              variant="h6"
              gutterBottom
              sx={{ fontWeight: 600, color: 'black', mb: 2 }}
            >
              Condiciones de Venta
            </Typography>
            {/* Primera fila: Stock y Compra Mínima (ahora debajo de Condiciones de Venta y sobre Precio a cobrar según) */}
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <TextField
                sx={{ width: '35%' }}
                label="Stock Disponible"
                placeholder="Ingrese su stock"
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
                    if (e.target.value.includes('.') || e.target.value.includes('-')) {
                      e.target.value = e.target.value.replace(/[.-]/g, '');
                    }
                  }
                }}
                autoComplete="off"
                // Siempre habilitado
              />
              {/* Compra Mínima eliminada de esta fila por requerimiento */}
            </Box>
            <Typography
              variant="subtitle2"
              gutterBottom
              sx={{ fontWeight: 600 , mb: 2 }}
            >
              Precio a cobrar por:
            </Typography>
            <ToggleButtonGroup
              value={formData.pricingType}
              exclusive
              onChange={onPricingTypeChange}
              sx={{ mb: 3 }}
            >
              <ToggleButton
                value="Unidad"
                sx={{ textTransform: 'none', width: '103px' }}
              >
                Unidad
              </ToggleButton>
              <ToggleButton
                value="Volumen"
                sx={{ textTransform: 'none', width: '103px' }}
              >
                Volumen
              </ToggleButton>
              <Tooltip
                title={
                  <>
                    <b>¿Qué son las ventas por Volumen?</b>
                    <br />
                    Permite asignar hasta 5 precios según la
                    cantidad que te compren. Por ejemplo: si te
                    compran entre 1 y 9 unidades, pagan $100 por
                    unidad; si te compran 10 o más, pagan $90.
                  </>
                }
                placement="right"
                arrow
                enterTouchDelay={0}
                leaveTouchDelay={3000}
                disableFocusListener={false}
                disableHoverListener={false}
                disableTouchListener={false}
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
          </Box>

          {/* Eliminado duplicado de Stock */}
        </Box>
      )}
    </Box>
  );
};

export default ProductInventory;
