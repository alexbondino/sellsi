import React from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  IconButton,
  Stack,
  InputAdornment,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';

const PriceTiers = ({
  tramos,
  onTramoChange,
  onAddTramo,
  onRemoveTramo,
  errors,
  stockDisponible, // Nueva prop para el stock disponible
}) => {
  
  // Función para manejar cambios en tramos con lógica de auto-corrección
  const handleTramoChange = (index, field, value) => {
    if (field === 'min' && index > 0) {
      // No permitir editar cantidad mínima en rangos 2+
      return;
    }
    
    // Para todos los campos, permitir cualquier valor durante la edición
    onTramoChange(index, field, value);
  };
  
  // Función para validar y corregir valores al salir del campo (onBlur)
  const handleTramoBlur = (index, field, value) => {
    if (field === 'min' && index > 0) {
      // No permitir editar cantidad mínima en rangos 2+
      return;
    }
    
    if (field === 'max' && index > 0) {
      // Para rangos 2+, actualizar cantidad mínima automáticamente
      const prevTramoMax = parseInt(tramos[index - 1]?.max) || 0;
      const newMin = prevTramoMax + 1;
      
      // Llamar al handler del padre para actualizar tanto min como max
      onTramoChange(index, 'min', newMin.toString());
      
      // Si el nuevo max es menor o igual al min, ajustar max
      const newMax = parseInt(value) || 0;
      let finalMaxValue = value;
      if (newMax <= newMin) {
        finalMaxValue = (newMin + 1).toString();
        onTramoChange(index, 'max', finalMaxValue);
      }
      
      // Actualizar el min del siguiente tramo si existe
      if (tramos[index + 1]) {
        const nextMin = (parseInt(finalMaxValue) || 0) + 1;
        onTramoChange(index + 1, 'min', nextMin.toString());
      }
      return;
    }
    
    if (field === 'max' && index === 0) {
      // Para rango 1, si max es menor o igual a min, ajustar max
      const currentMin = parseInt(tramos[0]?.min) || 1;
      const newMax = parseInt(value) || 0;
      
      let finalMaxValue = value;
      if (newMax <= currentMin) {
        finalMaxValue = (currentMin + 1).toString();
        onTramoChange(index, field, finalMaxValue);
      }
      
      // Actualizar el min del siguiente tramo si existe
      if (tramos[index + 1]) {
        const nextMin = (parseInt(finalMaxValue) || 0) + 1;
        onTramoChange(index + 1, 'min', nextMin.toString());
      }
      return;
    }
    
    if (field === 'min' && index === 0) {
      // Para rango 1, si min es mayor o igual a max, ajustar max
      const currentMax = parseInt(tramos[0]?.max) || 0;
      const newMin = parseInt(value) || 1;
      
      if (newMin >= currentMax) {
        onTramoChange(index, 'max', (newMin + 1).toString());
        
        // Actualizar el min del siguiente tramo si existe
        if (tramos[index + 1]) {
          const nextMin = newMin + 2;
          onTramoChange(index + 1, 'min', nextMin.toString());
        }
      }
      return;
    }
  };
  
  // Función para determinar si un rango es el último
  const isLastRange = (index) => {
    return index === tramos.length - 1;
  };
  
  // Función para determinar si el campo MAX debe estar oculto y mostrar stock disponible
  const shouldShowStockInsteadOfMaxInput = (index) => {
    return index > 0 && isLastRange(index); // A partir del rango 2 y siendo el último
  };
  
  // Función para obtener el valor que debe mostrar el campo MAX
  const getMaxFieldValue = (tramo, index) => {
    if (shouldShowStockInsteadOfMaxInput(index)) {
      return stockDisponible?.toString() || '';
    }
    return tramo.max;
  };
  
  // Función para determinar si el campo MAX debe estar deshabilitado
  const isMaxFieldDisabled = (index) => {
    return shouldShowStockInsteadOfMaxInput(index);
  };
  
  // Función para determinar el estilo del campo MAX cuando debe estar resaltado en rojo
  const getMaxFieldError = (tramo, index) => {
    if (index > 0 && !isLastRange(index) && (!tramo.max || tramo.max === '')) {
      return true; // Campo vacío en rango intermedio (no último)
    }
    return false;
  };
  
  // Función para detectar si un tramo tiene precio incorrecto (no descendente)
  const getPriceFieldError = (tramo, index) => {
    if (index === 0) return false; // El primer tramo no puede tener error de precio descendente
    
    const currentPrice = parseFloat(tramo.precio) || 0;
    const previousPrice = parseFloat(tramos[index - 1]?.precio) || 0;
    
    // Error si el precio actual es mayor o igual al anterior
    return currentPrice > 0 && previousPrice > 0 && currentPrice >= previousPrice;
  };
  
  // Función para determinar si toda la card debe tener borde rojo por error de precio
  const getCardBorderError = (tramo, index) => {
    return getPriceFieldError(tramo, index);
  };
  return (
    <Box>
      <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600, mb: 1}}>
        Define diferentes precios según la cantidad vendida{' '}
      </Typography>

      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 2,
          justifyContent: 'flex-start',
        }}
      >
        {tramos.map((tramo, index) => (
          <Paper
            key={index}
            elevation={1}
            sx={{
              p: 2,
              border: '1px solid',
              borderColor: getCardBorderError(tramo, index) ? 'error.main' : 'divider',
              borderRadius: 2,
              height: '100%',
              width: '180px',
              minHeight: '192px',
              backgroundColor: getCardBorderError(tramo, index) ? 'error.50' : 'inherit',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 0.5,
              }}
            >
              <Typography variant="subtitle2" fontWeight="600">
                Rango {index + 1}
              </Typography>
              {tramos.length > 2 && index >= 2 && (
                <IconButton
                  onClick={() => onRemoveTramo(index)}
                  color="error"
                  size="small"
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              )}
            </Box>
            <Stack spacing={2}>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, mb: 1, display: 'block' }}>
                  Cantidades:
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <TextField
                    label="Min"
                    placeholder="Ej: 10"
                    value={tramo.min}
                    onChange={e => handleTramoChange(index, 'min', e.target.value)}
                    onBlur={e => handleTramoBlur(index, 'min', e.target.value)}
                    type="number"
                    size="small"
                    autoComplete="off"
                    disabled={index > 0} // Deshabilitar para rangos 2+
                    InputLabelProps={{ shrink: true }}
                    inputProps={{
                      min: 1,
                      step: 1,
                      onInput: (e) => {
                        if (e.target.value.includes('.') || e.target.value.includes('-')) {
                          e.target.value = e.target.value.replace(/[.-]/g, '');
                        }
                      }
                    }}
                    sx={{ 
                      width: '50%',
                      '& input[type=number]': {
                        '-moz-appearance': 'textfield',
                      },
                      '& input[type=number]::-webkit-outer-spin-button': {
                        '-webkit-appearance': 'none',
                        margin: 0,
                      },
                      '& input[type=number]::-webkit-inner-spin-button': {
                        '-webkit-appearance': 'none',
                        margin: 0,
                      },
                    }}
                  />
                  <TextField
                    label="Max"
                    placeholder="Ej: 99"
                    value={getMaxFieldValue(tramo, index)}
                    onChange={e => handleTramoChange(index, 'max', e.target.value)}
                    onBlur={e => handleTramoBlur(index, 'max', e.target.value)}
                    type="number"
                    size="small"
                    autoComplete="off"
                    disabled={isMaxFieldDisabled(index)}
                    error={getMaxFieldError(tramo, index)}
                    InputLabelProps={{ shrink: true }}
                    inputProps={{
                      min: 1,
                      step: 1,
                      onInput: (e) => {
                        if (e.target.value.includes('.') || e.target.value.includes('-')) {
                          e.target.value = e.target.value.replace(/[.-]/g, '');
                        }
                      }
                    }}
                    sx={{ 
                      width: '50%',
                      '& input[type=number]': {
                        '-moz-appearance': 'textfield',
                      },
                      '& input[type=number]::-webkit-outer-spin-button': {
                        '-webkit-appearance': 'none',
                        margin: 0,
                      },
                      '& input[type=number]::-webkit-inner-spin-button': {
                        '-webkit-appearance': 'none',
                        margin: 0,
                      },
                      ...(shouldShowStockInsteadOfMaxInput(index) && {
                        '& .MuiInputBase-input': {
                          color: 'text.secondary',
                          fontWeight: 500,
                        },
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: 'grey.50',
                        }
                      }),
                      ...(getMaxFieldError(tramo, index) && {
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: 'error.50',
                        }
                      })
                    }}
                  />
                </Box>
              </Box>
              <TextField
                fullWidth
                label="Precio Unitario"
                placeholder="Ej: 15000"
                value={tramo.precio}
                onChange={e => handleTramoChange(index, 'precio', e.target.value)}
                type="number"
                size="small"
                autoComplete="off"
                error={getPriceFieldError(tramo, index)}
                helperText={
                  getPriceFieldError(tramo, index) 
                    ? "los precios deben ser descendentes"
                    : ""
                }
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">$</InputAdornment>
                  ),
                  inputProps: { 
                    min: 1,
                    step: 1,
                    onInput: (e) => {
                      if (e.target.value.includes('.') || e.target.value.includes('-')) {
                        e.target.value = e.target.value.replace(/[.-]/g, '');
                      }
                    }
                  },
                }}
                sx={{
                  '& input[type=number]': {
                    '-moz-appearance': 'textfield',
                  },
                  '& input[type=number]::-webkit-outer-spin-button': {
                    '-webkit-appearance': 'none',
                    margin: 0,
                  },
                  '& input[type=number]::-webkit-inner-spin-button': {
                    '-webkit-appearance': 'none',
                    margin: 0,
                  },
                  ...(getPriceFieldError(tramo, index) && {
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'error.50',
                    }
                  })
                }}
              />
            </Stack>
          </Paper>
        ))}

        {/* Botón para agregar tramo */}
        {tramos.length < 5 && (
          <Paper
            elevation={0}
            sx={{
              p: 2,
              border: '2px dashed',
              borderColor: 'primary.main',
              borderRadius: 2,
              height: '100%',
              width: '180px',
              minHeight: '162px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              '&:hover': {
                bgcolor: 'primary.50',
              },
            }}
            onClick={onAddTramo}
          >
            <Stack alignItems="center" spacing={1}>
              <AddIcon color="primary" />
              <Typography variant="body2" color="primary" fontWeight="600">
                Agregar Tramo
              </Typography>
            </Stack>
          </Paper>
        )}
      </Box>

      {/* Mensaje de ayuda dinámico para tramos debajo de las cards */}
      {tramos.length >= 2 && (
        <Box sx={{ mt: 3 }}>
          <Typography
            variant="body2"
            color="info.main"
            sx={{ fontWeight: 500 }}
          >
            ¿Cómo funcionan los rangos?
          </Typography>
          {tramos.map((tramo, idx, arr) => {
            const min = tramo.min;
            const max = shouldShowStockInsteadOfMaxInput(idx) ? stockDisponible : tramo.max;
            const precio = tramo.precio;
            
            // Si es el último rango
            if (idx === arr.length - 1) {
              return (
                <Typography
                  key={idx}
                  variant="caption"
                  color="text.secondary"
                  display="block"
                >
                  Rango {idx + 1}: si el cliente compra <b>{min || `Cantidad mínima a definir`}</b> unidades o más, paga{' '}
                  <b>${precio || 'Precio a definir'}</b> por unidad.
                </Typography>
              );
            } else {
              // Rangos intermedios
              return (
                <Typography
                  key={idx}
                  variant="caption"
                  color="text.secondary"
                  display="block"
                >
                  Rango {idx + 1}: si el cliente compra entre <b>{min || `Cantidad mínima a definir`}</b> y{' '}
                  <b>{max || `Cantidad máxima a definir`}</b> unidades, paga{' '}
                  <b>${precio || 'Precio a definir'}</b> por unidad.
                </Typography>
              );
            }
          })}
        </Box>
      )}

      {errors && (
        <Typography
          variant="caption"
          color="error"
          display="block"
          sx={{ mt: 1 }}
        >
          {errors}
        </Typography>
      )}
    </Box>
  );
};

export default PriceTiers;
