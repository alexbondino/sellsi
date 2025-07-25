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
        Stock Disponible
      </Typography>
      <Box
        sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
      >
        {/* Primera fila: Stock y Compra Mínima */}
        <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  sx={{ width: '35%' }}
                  label="Cantidad"
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
                  disabled={formData.pricingType === 'Por Unidad'}
                />
                {/* Compra Mínima eliminada de esta fila por requerimiento */}
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
              value="Por Volumen"
              sx={{ textTransform: 'none' }}
            >
              Por Volumen
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
      </Box>
    </Box>
  );
};

export default ProductInventory;
