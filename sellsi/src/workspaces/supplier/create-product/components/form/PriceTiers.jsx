import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  IconButton,
  Stack,
  InputAdornment,
  Button,
  Chip,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';

const PriceTiers = ({
  tramos,
  onTramoChange,
  onTramoBlur, // Nueva prop desde AddProduct.jsx
  onAddTramo,
  onRemoveTramo,
  errors,
  stockDisponible, // Nueva prop para el stock disponible
  isMobile = false, // 🔧 Nueva prop para móvil
}) => {
  // 📊 Estado para tracking del tramo visible en móvil
  const [activeTramoIndex, setActiveTramoIndex] = useState(0);
  const scrollContainerRef = useRef(null);

  // 🔧 Hook para detectar tramo visible en scroll horizontal
  useEffect(() => {
    if (!isMobile || !scrollContainerRef.current) return;

    const scrollContainer = scrollContainerRef.current;
    const handleScroll = () => {
      const scrollLeft = scrollContainer.scrollLeft;
      const cardWidth = 280 + 16; // width + gap
      const currentIndex = Math.round(scrollLeft / cardWidth);
      setActiveTramoIndex(Math.min(currentIndex, tramos.length - 1));
    };

    scrollContainer.addEventListener('scroll', handleScroll);
    return () => scrollContainer.removeEventListener('scroll', handleScroll);
  }, [isMobile, tramos.length]);

  // Función para manejar cambios en tramos - solo actualiza valor
  const handleTramoChange = (index, field, value) => {
    if (field === 'min' && index > 0) {
      // No permitir editar cantidad mínima en rangos 2+
      return;
    }

    // Delegar al handler del padre
    onTramoChange(index, field, value);
  };

  // Función para validar y corregir valores al salir del campo (onBlur)
  const handleTramoBlur = (index, field, value) => {
    // Siempre delegar al handler del padre si existe - para que se ejecute la lógica automática
    if (onTramoBlur) {
      onTramoBlur(index, field, value);
    }
  };

  // Función para determinar si un rango es el último
  const isLastRange = index => {
    return index === tramos.length - 1;
  };

  // Función para determinar si el campo MAX debe estar oculto y mostrar stock disponible
  const shouldShowStockInsteadOfMaxInput = index => {
    return index > 0 && isLastRange(index); // A partir del rango 2 y siendo el último
  };

  // Función para obtener el valor que debe mostrar el campo MAX
  const getMaxFieldValue = (tramo, index) => {
    if (shouldShowStockInsteadOfMaxInput(index)) {
      return stockDisponible?.toString() || '';
    }
    return tramo.max || '';
  };

  // Función para determinar si el campo MAX debe estar deshabilitado
  const isMaxFieldDisabled = index => {
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
    return (
      currentPrice > 0 && previousPrice > 0 && currentPrice >= previousPrice
    );
  };

  // Función para determinar si toda la card debe tener borde rojo por error de precio
  const getCardBorderError = (tramo, index) => {
    return getPriceFieldError(tramo, index);
  };
  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 1,
        }}
      >
        <Typography
          variant="subtitle2"
          gutterBottom
          sx={{ fontWeight: 600, mb: 0 }}
        >
          Define diferentes precios según la cantidad vendida{' '}
        </Typography>
        {/* 📊 Contador de tramos para móvil */}
        {isMobile && (
          <Chip
            label={`${tramos.length}/5 tramos`}
            size="small"
            color="primary"
            variant="outlined"
          />
        )}
      </Box>

      {isMobile ? (
        // 📱 Layout Móvil - Stack Vertical, sin scroll horizontal
        <>
          <Stack spacing={2} sx={{ width: '100%' }}>
            {tramos.map((tramo, index) => (
              <Paper
                key={index}
                elevation={1}
                sx={{
                  p: 2,
                  border: '1px solid',
                  borderColor: getCardBorderError(tramo, index)
                    ? 'error.main'
                    : 'divider',
                  borderRadius: 2,
                  minHeight: '200px',
                  backgroundColor: getCardBorderError(tramo, index)
                    ? 'error.50'
                    : 'inherit',
                  width: '100%',
                }}
              >
                {/* Contenido igual que antes */}
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
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ fontWeight: 500, mb: 1, display: 'block' }}
                    >
                      Cantidades:
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <TextField
                        label="Min"
                        placeholder="1"
                        value={tramo.min || ''}
                        onChange={e =>
                          handleTramoChange(index, 'min', e.target.value)
                        }
                        onBlur={e =>
                          handleTramoBlur(index, 'min', e.target.value)
                        }
                        type="number"
                        size="small"
                        autoComplete="off"
                        disabled={index > 0}
                        sx={{ flex: 1 }}
                        inputProps={{ min: 1, step: 1 }}
                      />
                      <TextField
                        label="Max"
                        placeholder={
                          isLastRange(index) && stockDisponible
                            ? stockDisponible
                            : 'Ej: 10'
                        }
                        value={
                          shouldShowStockInsteadOfMaxInput(index)
                            ? stockDisponible
                            : tramo.max || ''
                        }
                        onChange={e =>
                          handleTramoChange(index, 'max', e.target.value)
                        }
                        onBlur={e =>
                          handleTramoBlur(index, 'max', e.target.value)
                        }
                        type="number"
                        size="small"
                        autoComplete="off"
                        disabled={shouldShowStockInsteadOfMaxInput(index)}
                        sx={{ flex: 1 }}
                        inputProps={{ min: 1, step: 1 }}
                      />
                    </Box>
                  </Box>
                  <Box>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ fontWeight: 500, mb: 1, display: 'block' }}
                    >
                      Precio unitario:
                    </Typography>
                    <TextField
                      fullWidth
                      label="Precio"
                      placeholder="Ej: 15000"
                      value={tramo.precio || ''}
                      onChange={e =>
                        handleTramoChange(index, 'precio', e.target.value)
                      }
                      type="number"
                      size="small"
                      autoComplete="off"
                      error={getPriceFieldError(tramo, index)}
                      helperText={
                        getPriceFieldError(tramo, index)
                          ? 'Los precios deben ser descendentes'
                          : ''
                      }
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">$</InputAdornment>
                        ),
                        inputProps: {
                          min: 1,
                          step: 1,
                          onInput: e => {
                            if (
                              e.target.value.includes('.') ||
                              e.target.value.includes('-')
                            ) {
                              e.target.value = e.target.value.replace(
                                /[.-]/g,
                                ''
                              );
                            }
                          },
                        },
                      }}
                    />
                  </Box>
                </Stack>
              </Paper>
            ))}
          </Stack>
          {/* Botón Agregar Tramo */}
          {tramos.length < 5 && (
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={onAddTramo}
              sx={{
                width: '100%',
                py: 1.5,
                borderStyle: 'dashed',
                borderColor: 'primary.main',
                color: 'primary.main',
                textTransform: 'none',
                mb: 2,
                '&:hover': {
                  borderStyle: 'dashed',
                  backgroundColor: 'primary.50',
                },
              }}
            >
              Agregar Tramo
            </Button>
          )}
        </>
      ) : (
        // 🖥️ Layout Desktop - Mantener actual
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
                borderColor: getCardBorderError(tramo, index)
                  ? 'error.main'
                  : 'divider',
                borderRadius: 2,
                height: '100%',
                width: '24%',
                minHeight: '192px',
                backgroundColor: getCardBorderError(tramo, index)
                  ? 'error.50'
                  : 'inherit',
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
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ fontWeight: 500, mb: 1, display: 'block' }}
                  >
                    Cantidades:
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <TextField
                      label="Min"
                      placeholder="Ej: 10"
                      value={tramo.min || ''}
                      onChange={e =>
                        handleTramoChange(index, 'min', e.target.value)
                      }
                      onBlur={e =>
                        handleTramoBlur(index, 'min', e.target.value)
                      }
                      type="number"
                      size="small"
                      autoComplete="off"
                      disabled={index > 0} // Deshabilitar para rangos 2+
                      InputLabelProps={{ shrink: true }}
                      inputProps={{
                        min: 1,
                        step: 1,
                        onInput: e => {
                          if (
                            e.target.value.includes('.') ||
                            e.target.value.includes('-')
                          ) {
                            e.target.value = e.target.value.replace(
                              /[.-]/g,
                              ''
                            );
                          }
                        },
                      }}
                      sx={{
                        width: '50%',
                        '& input[type=number]': {
                          MozAppearance: 'textfield',
                        },
                        '& input[type=number]::-webkit-outer-spin-button': {
                          WebkitAppearance: 'none',
                          margin: 0,
                        },
                        '& input[type=number]::-webkit-inner-spin-button': {
                          WebkitAppearance: 'none',
                          margin: 0,
                        },
                      }}
                    />
                    <TextField
                      label="Max"
                      placeholder="Ej: 99"
                      value={getMaxFieldValue(tramo, index)}
                      onChange={e =>
                        handleTramoChange(index, 'max', e.target.value)
                      }
                      onBlur={e =>
                        handleTramoBlur(index, 'max', e.target.value)
                      }
                      type="number"
                      size="small"
                      autoComplete="off"
                      disabled={isMaxFieldDisabled(index)}
                      error={getMaxFieldError(tramo, index)}
                      InputLabelProps={{ shrink: true }}
                      inputProps={{
                        min: 1,
                        step: 1,
                        onInput: e => {
                          if (
                            e.target.value.includes('.') ||
                            e.target.value.includes('-')
                          ) {
                            e.target.value = e.target.value.replace(
                              /[.-]/g,
                              ''
                            );
                          }
                        },
                      }}
                      sx={{
                        width: '50%',
                        '& input[type=number]': {
                          MozAppearance: 'textfield',
                        },
                        '& input[type=number]::-webkit-outer-spin-button': {
                          WebkitAppearance: 'none',
                          margin: 0,
                        },
                        '& input[type=number]::-webkit-inner-spin-button': {
                          WebkitAppearance: 'none',
                          margin: 0,
                        },
                        ...(shouldShowStockInsteadOfMaxInput(index) && {
                          '& .MuiInputBase-input': {
                            color: 'text.secondary',
                            fontWeight: 500,
                          },
                          '& .MuiOutlinedInput-root': {
                            backgroundColor: 'grey.50',
                          },
                        }),
                        ...(getMaxFieldError(tramo, index) && {
                          '& .MuiOutlinedInput-root': {
                            backgroundColor: 'error.50',
                          },
                        }),
                      }}
                    />
                  </Box>
                </Box>
                <TextField
                  fullWidth
                  label="Precio Unitario"
                  placeholder="Ej: 15000"
                  value={tramo.precio || ''}
                  onChange={e =>
                    handleTramoChange(index, 'precio', e.target.value)
                  }
                  type="number"
                  size="small"
                  autoComplete="off"
                  error={getPriceFieldError(tramo, index)}
                  helperText={
                    getPriceFieldError(tramo, index)
                      ? 'Los precios deben ser descendentes'
                      : ''
                  }
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">$</InputAdornment>
                    ),
                    inputProps: {
                      min: 1,
                      step: 1,
                      onInput: e => {
                        if (
                          e.target.value.includes('.') ||
                          e.target.value.includes('-')
                        ) {
                          e.target.value = e.target.value.replace(/[.-]/g, '');
                        }
                      },
                    },
                  }}
                  sx={{
                    '& input[type=number]': {
                      MozAppearance: 'textfield',
                    },
                    '& input[type=number]::-webkit-outer-spin-button': {
                      WebkitAppearance: 'none',
                      margin: 0,
                    },
                    '& input[type=number]::-webkit-inner-spin-button': {
                      WebkitAppearance: 'none',
                      margin: 0,
                    },
                    ...(getPriceFieldError(tramo, index) && {
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: 'error.50',
                      },
                    }),
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
                width: '24%',
                minHeight: '192px',
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
      )}

      {/* Mensaje de ayuda dinámico para tramos debajo de las cards */}
      {(() => {
        // Contar cuántos rangos están completados
        const completedRanges = tramos.filter((tramo, idx) => {
          const min = tramo.min;
          const max = shouldShowStockInsteadOfMaxInput(idx)
            ? stockDisponible
            : tramo.max;
          const precio = tramo.precio;

          // Verificar si el rango está completado (tiene min, max (o es último), y precio)
          return min && precio && (idx === tramos.length - 1 || max);
        });

        // Solo mostrar si hay al menos 1 rango completado
        if (completedRanges.length === 0) {
          return null;
        }

        return (
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
              const max = shouldShowStockInsteadOfMaxInput(idx)
                ? stockDisponible
                : tramo.max;
              const precio = tramo.precio;

              // Verificar si el rango está completado (tiene min, max (o es último), y precio)
              const isRangeCompleted =
                min && precio && (idx === arr.length - 1 || max);

              // Solo mostrar el texto si el rango está completado
              if (!isRangeCompleted) {
                return null;
              }

              // Si es el último rango
              if (idx === arr.length - 1) {
                return (
                  <Typography
                    key={idx}
                    variant="caption"
                    color="text.secondary"
                    display="block"
                  >
                    Rango {idx + 1}: si el cliente compra <b>{min}</b> unidades
                    o más, paga <b>${precio}</b> por unidad.
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
                    Rango {idx + 1}: si el cliente compra entre <b>{min}</b> y{' '}
                    <b>{max}</b> unidades, paga <b>${precio}</b> por unidad.
                  </Typography>
                );
              }
            })}
          </Box>
        );
      })()}

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
