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

// Constantes
const CATEGORIES = [
  { value: '', label: 'Selecciona una categoría' },
  { value: 'Supermercado', label: 'Supermercado' },
  { value: 'Electrodomésticos', label: 'Electrodomésticos' },
  { value: 'Tecnología', label: 'Tecnología' },
  { value: 'Hogar', label: 'Hogar' },
  { value: 'Moda', label: 'Moda' },
];

/**
 * Componente para la información básica del producto
 * Maneja nombre, descripción y categoría
 */
const ProductBasicInfo = ({
  formData,
  errors,
  touched,
  triedSubmit,
  onInputChange,
  onFieldBlur,
}) => {
  return (
    <>
      {/* FILA 1: Información Básica (50%) | Categoría (50%) */}
      <Box>
        <Typography
          variant="h6"
          gutterBottom
          sx={{ fontWeight: 600, color: 'black', mb: 2 }}
        >
          Información Básica
        </Typography>
        <TextField
          fullWidth
          label="Nombre Producto:"
          placeholder="Máximo 40 caracteres"
          value={formData.nombre}
          onChange={onInputChange('nombre')}
          onBlur={() => onFieldBlur('nombre')}
          error={
            !!(touched.nombre || triedSubmit) && !!errors.nombre
          }
          helperText={
            touched.nombre || triedSubmit
              ? errors.nombre ||
                `${formData.nombre.length}/40 caracteres`
              : ''
          }
          inputProps={{ maxLength: 40 }}
        />
      </Box>
      
      <Box>
        <Typography
          variant="h6"
          gutterBottom
          sx={{ fontWeight: 600, color: 'black', mb: 2 }}
        >
          Categoría
        </Typography>
        <FormControl
          fullWidth
          error={
            !!(touched.categoria || triedSubmit) &&
            !!errors.categoria
          }
        >
          <InputLabel>Categoría:</InputLabel>
          <Select
            value={formData.categoria}
            onChange={onInputChange('categoria')}
            onBlur={() => onFieldBlur('categoria')}
            label="Categoría:"
            MenuProps={{
              disableScrollLock: true,
            }}
          >
            {CATEGORIES.map(category => (
              <MenuItem key={category.value} value={category.value}>
                {category.label}
              </MenuItem>
            ))}
          </Select>
          {(touched.categoria || triedSubmit) &&
            errors.categoria && (
              <Typography
                variant="caption"
                color="error"
                sx={{ mt: 0.5, ml: 1.5 }}
              >
                {errors.categoria}
              </Typography>
            )}
        </FormControl>
      </Box>

      {/* FILA 2: Descripción del Producto (100%) */}
      <Box className="full-width">
        <TextField
          fullWidth
          label="Descripción Producto:"
          placeholder="Máximo 600 caracteres"
          multiline
          rows={3}
          value={formData.descripcion}
          onChange={onInputChange('descripcion')}
          onBlur={() => onFieldBlur('descripcion')}
          error={
            !!(touched.descripcion || triedSubmit) &&
            !!errors.descripcion
          }
          helperText={
            touched.descripcion || triedSubmit
              ? errors.descripcion ||
                `${formData.descripcion.length}/600 caracteres`
              : ''
          }
          inputProps={{ maxLength: 600 }}
        />
      </Box>
    </>
  );
};

export default ProductBasicInfo;
