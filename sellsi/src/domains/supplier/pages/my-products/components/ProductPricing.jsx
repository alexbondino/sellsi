import React from 'react';
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
} from '@mui/material';

/**
 * Componente para la configuración de precios unitarios
 * Maneja precio de venta y compra mínima cuando el tipo de precio es "Por Unidad"
 */
const ProductPricing = ({
  formData,
  errors,
  localErrors,
  touched,
  triedSubmit,
  onInputChange,
  onFieldBlur,
}) => {
  return (
    <Box
      className="full-width"
      sx={{
        p: 0,
        m: 0,
        boxShadow: 'none',
        bgcolor: 'transparent',
        overflow: 'visible',
        mb: 3,
      }}
    >
      <Typography
        variant="subtitle2"
        gutterBottom
        sx={{ fontWeight: 600, color: 'black', mb: 2 }}
      >
        Define el valor unitario y la compra mínima
      </Typography>
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
        <TextField
          sx={{ width: '17%' }}
          label="Precio de Venta"
          placeholder="Ej: 15000"
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
          type="number"
          autoComplete="off"
          inputProps={{ 
            min: 1, 
            step: 1,
            onInput: (e) => {
              if (e.target.value.includes('.') || e.target.value.includes('-')) {
                e.target.value = e.target.value.replace(/[.-]/g, '');
              }
            }
          }}
        />
        <TextField
          sx={{ width: '17%' }}
          label="Compra Mínima"
          placeholder="Ej: 1"
          value={formData.compraMinima}
          onChange={onInputChange('compraMinima')}
          onBlur={() => onFieldBlur('compraMinima')}
          error={
            !!(touched.compraMinima || triedSubmit) &&
            !!(errors.compraMinima || localErrors.compraMinima)
          }
          helperText={
            touched.compraMinima || triedSubmit
              ? errors.compraMinima ||
                localErrors.compraMinima
              : ''
          }
          type="number"
          autoComplete="off"
          inputProps={{ min: 1, step: 1 }}
        />
      </Box>
    </Box>
  );
};

export default ProductPricing;
