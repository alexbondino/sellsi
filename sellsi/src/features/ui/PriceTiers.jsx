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
}) => {
  return (
    <Box>
      <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
        Configuración de Tramos de Precio:
      </Typography>
      <Typography
        variant="caption"
        color="text.secondary"
        display="block"
        sx={{ mb: 2 }}
      >
        Define diferentes precios según la cantidad comprada.{' '}
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
              borderColor: 'divider',
              borderRadius: 2,
              height: '100%',
              width: '180px',
              minHeight: '162px',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 1,
              }}
            >
              <Typography variant="subtitle2" fontWeight="600">
                Tramo {index + 1}
              </Typography>
              {tramos.length > 1 && (
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
              <TextField
                fullWidth
                label="Cantidad"
                placeholder="Ej: 10"
                value={tramo.cantidad}
                onChange={e => onTramoChange(index, 'cantidad', e.target.value)}
                type="number"
                size="small"
              />
              <TextField
                fullWidth
                label="Precio"
                placeholder="Ej: 1500"
                value={tramo.precio}
                onChange={e => onTramoChange(index, 'precio', e.target.value)}
                type="number"
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">$</InputAdornment>
                  ),
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
            ¿Cómo funcionan los tramos?
          </Typography>
          {tramos.map((tramo, idx, arr) => {
            const min = tramo.cantidad;
            const nextTramo = arr[idx + 1];
            const max =
              nextTramo && nextTramo.cantidad ? nextTramo.cantidad - 1 : null;
            const precio = tramo.precio;
            // Si el siguiente tramo existe pero no tiene cantidad, mostrar solo la línea del tramo actual
            if (idx < arr.length - 1) {
              if (nextTramo && !nextTramo.cantidad) {
                return (
                  <Typography
                    key={idx}
                    variant="caption"
                    color="text.secondary"
                    display="block"
                  >
                    Tramo {idx + 1}: si el cliente compra entre <b>{min}</b> y{' '}
                    <b>Cantidad a definir del Tramo {idx + 2}</b> unidades, paga{' '}
                    <b>${precio}</b> por unidad.
                  </Typography>
                );
              } else {
                return (
                  <Typography
                    key={idx}
                    variant="caption"
                    color="text.secondary"
                    display="block"
                  >
                    Tramo {idx + 1}: si el cliente compra entre <b>{min}</b> y{' '}
                    <b>{max}</b> unidades, paga <b>${precio}</b> por unidad.
                  </Typography>
                );
              }
            } else {
              // Solo mostrar el último tramo si su cantidad está definida
              if (tramo.cantidad) {
                return (
                  <Typography
                    key={idx}
                    variant="caption"
                    color="text.secondary"
                    display="block"
                  >
                    Tramo {idx + 1}: si compra <b>{min}</b> unidades o más, paga{' '}
                    <b>${precio}</b> por unidad.
                  </Typography>
                );
              } else {
                return null;
              }
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
