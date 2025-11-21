import React from 'react';
import {
  Box,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
} from '@mui/material';

// Constantes
const CATEGORIES = [
  { value: '', label: 'Selecciona una categoría' },
  { value: 'Tabaquería', label: 'Tabaquería' },
  { value: 'Alcoholes', label: 'Alcoholes' },
  { value: 'Ferretería y Construcción', label: 'Ferretería y Construcción' },
  { value: 'Gastronomía', label: 'Gastronomía' },
  { value: 'Otros', label: 'Otros' },
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
  isMobile = false, // 🔧 Nueva prop para móvil
}) => {
  return (
    <>
      {isMobile ? (
        // 📱 Layout Móvil - Stack Vertical
        <Box>
          <Stack spacing={2}>
            <TextField
              fullWidth
              label="Nombre Producto"
              placeholder="Máximo 40 caracteres"
              value={formData.nombre}
              onChange={onInputChange('nombre')}
              onBlur={() => onFieldBlur('nombre')}
              error={!!(touched.nombre || triedSubmit) && !!errors.nombre}
              helperText={
                touched.nombre || triedSubmit
                  ? errors.nombre || `${formData.nombre.length}/40 caracteres`
                  : ''
              }
              inputProps={{ maxLength: 40 }}
              size="medium"
              autoComplete="off"
            />

            <FormControl
              fullWidth
              sx={{ width: '100%', min_width: 0 }}
              error={!!(touched.categoria || triedSubmit) && !!errors.categoria}
              size="medium"
            >
              <InputLabel>Categoría</InputLabel>
              <Select
                value={formData.categoria}
                onChange={onInputChange('categoria')}
                onBlur={() => onFieldBlur('categoria')}
                label="Categoría"
                MenuProps={{
                  disableScrollLock: true,
                  sx: {
                    zIndex: 1500,
                  },
                  PaperProps: {
                    sx: {
                      zIndex: 1500,
                    },
                  },
                  BackdropProps: {
                    sx: {
                      zIndex: 1499,
                    },
                  },
                }}
              >
                {CATEGORIES.map(category => (
                  <MenuItem key={category.value} value={category.value}>
                    {category.label}
                  </MenuItem>
                ))}
              </Select>
              {(touched.categoria || triedSubmit) && errors.categoria && (
                <Typography
                  variant="caption"
                  color="error"
                  sx={{ mt: 0.5, ml: 1.5 }}
                >
                  {errors.categoria}
                </Typography>
              )}
            </FormControl>

            <TextField
              fullWidth
              multiline
              rows={4}
              label="Descripción Producto"
              placeholder="Máximo 3000 caracteres"
              value={formData.descripcion}
              onChange={onInputChange('descripcion')}
              onBlur={() => onFieldBlur('descripcion')}
              error={
                !!(touched.descripcion || triedSubmit) && !!errors.descripcion
              }
              helperText={
                touched.descripcion || triedSubmit
                  ? errors.descripcion ||
                    `${formData.descripcion.length}/3000 caracteres`
                  : ''
              }
              inputProps={{ maxLength: 3000 }}
              autoComplete="off"
            />
          </Stack>
        </Box>
      ) : (
        // 🖥️ Layout Desktop - Mantener actual
        <>
          {/* FILA 1: Información Básica (50%) | Categoría (50%) */}
          <Box>
            <Typography
              variant="h6"
              gutterBottom
              sx={{ fontWeight: 600, color: 'black', mb: 2 }}
            >
              Información General
            </Typography>
            <TextField
              fullWidth
              label="Nombre Producto"
              placeholder="Máximo 40 caracteres"
              value={formData.nombre}
              onChange={onInputChange('nombre')}
              onBlur={() => onFieldBlur('nombre')}
              error={!!(touched.nombre || triedSubmit) && !!errors.nombre}
              helperText={
                touched.nombre || triedSubmit
                  ? errors.nombre || `${formData.nombre.length}/40 caracteres`
                  : ''
              }
              inputProps={{ maxLength: 40 }}
              autoComplete="off"
            />
          </Box>

          <Box sx={{ mt: 6 }}>
            {/* Eliminado título de Categoría; se agregó margen superior para alinear con el campo de Nombre Producto */}
            <FormControl
              fullWidth
              error={!!(touched.categoria || triedSubmit) && !!errors.categoria}
            >
              <InputLabel>Categoría</InputLabel>

              <Select
                fullWidth
                value={formData.categoria}
                onChange={onInputChange('categoria')}
                onBlur={() => onFieldBlur('categoria')}
                label="Categoría"
                MenuProps={{
                  disableScrollLock: true,
                  sx: {
                    zIndex: 1500, // z-index para el menú desplegable
                  },
                  PaperProps: {
                    sx: {
                      zIndex: 1500, // z-index para el papel del dropdown
                    },
                  },
                  // Forzar el z-index del backdrop/modal
                  BackdropProps: {
                    sx: {
                      zIndex: 1499,
                    },
                  },
                }}
              >
                {CATEGORIES.map(category => (
                  <MenuItem key={category.value} value={category.value}>
                    {category.label}
                  </MenuItem>
                ))}
              </Select>
              {(touched.categoria || triedSubmit) && errors.categoria && (
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
          <Box className="full-width" sx={{ mb: 2 }}>
            <TextField
              fullWidth
              label="Descripción Producto"
              placeholder="Máximo 3000 caracteres"
              multiline
              rows={4}
              value={formData.descripcion}
              onChange={onInputChange('descripcion')}
              onBlur={() => onFieldBlur('descripcion')}
              error={
                !!(touched.descripcion || triedSubmit) && !!errors.descripcion
              }
              helperText={
                touched.descripcion || triedSubmit
                  ? errors.descripcion ||
                    `${formData.descripcion.length}/3000 caracteres`
                  : ''
              }
              inputProps={{ maxLength: 3000 }}
              autoComplete="off"
            />
          </Box>
        </>
      )}
    </>
  );
};

export default ProductBasicInfo;
