import React, { useMemo } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Divider,
  Stack,
  CircularProgress,
} from '@mui/material';
import { Info as InfoIcon } from '@mui/icons-material';
import { formatPrice } from '../../../../../shared/utils/formatters';

/**
 * Componente para mostrar el panel de resultados de venta
 * Muestra cálculos de ingresos, tarifas y totales
 */
const ProductResultsPanel = ({
  calculations,
  isValid,
  hasActualChanges, // 🔧 FIX EDIT: Para detectar cambios reales
  isLoading,
  isEditMode,
  onBack,
  onSubmit,
}) => {
  // 🔧 FIX EDIT: Lógica para habilitar/deshabilitar botón según el modo
  const isButtonDisabled = useMemo(() => {
    if (isLoading) return true;

    // En modo edición, solo habilitar si hay cambios reales Y es válido
    if (isEditMode) {
      if (!isValid) return true;
      if (hasActualChanges !== undefined) {
        return !hasActualChanges;
      }
      return false;
    }

    // 🔧 NUEVO: En modo creación (producto nuevo), el botón SIEMPRE está habilitado
    // Las validaciones se manejan en el momento del submit con toasters informativos
    return false;
  }, [isLoading, isValid, isEditMode, hasActualChanges]);

  return (
    <Paper sx={{ p: 3, position: 'sticky', top: 100 }}>
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
        Resultado Venta
      </Typography>

      <Box sx={{ mb: 3 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            mb: 1,
          }}
        >
          <Typography variant="body2">Ingreso por Ventas</Typography>
          <Typography variant="body2" fontWeight="600">
            {calculations.isRange
              ? `${formatPrice(
                  calculations.rangos.ingresoPorVentas.min
                )} - ${formatPrice(calculations.rangos.ingresoPorVentas.max)}`
              : formatPrice(calculations.ingresoPorVentas)}
          </Typography>
        </Box>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            mb: 1,
          }}
        >
          <Typography variant="body2">Tarifa por Servicio (3%)</Typography>
          <Typography variant="body2" fontWeight="600">
            {calculations.isRange
              ? `${formatPrice(
                  calculations.rangos.tarifaServicio.min
                )} - ${formatPrice(calculations.rangos.tarifaServicio.max)}`
              : formatPrice(calculations.tarifaServicio)}
          </Typography>
        </Box>
        <Divider sx={{ my: 2 }} />
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            mb: 2,
          }}
        >
          <Typography variant="h6" fontWeight="600" color="primary.main">
            Total
          </Typography>
          <Typography variant="h6" fontWeight="600" color="primary.main">
            {calculations.isRange
              ? `${formatPrice(calculations.rangos.total.min)} - ${formatPrice(
                  calculations.rangos.total.max
                )}`
              : formatPrice(calculations.total)}
          </Typography>
        </Box>

        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
        >
          <InfoIcon fontSize="small" color="primary" />
          {calculations.isRange
            ? 'Estos son los rangos de montos que podrás recibir según cómo se distribuyan las ventas entre los tramos de precio'
            : 'Este es el monto que recibirás en tu cuenta una vez concretada la venta. El valor no considera los costos de despacho.'}
        </Typography>
      </Box>

      {/* Botones de acción */}
      <Stack spacing={2}>
        <Button
          variant="outlined"
          onClick={onBack}
          sx={{ textTransform: 'none', fontWeight: 600 }}
          fullWidth
        >
          Atrás
        </Button>
        <Button
          variant="contained"
          onClick={onSubmit}
          disabled={isButtonDisabled} // 🔧 FIX EDIT: Usar nueva lógica condicional
          sx={{
            textTransform: 'none',
            fontWeight: 600,
            position: 'relative',
          }}
          fullWidth
        >
          {isLoading ? (
            <>
              <Box
                component="span"
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                <CircularProgress
                  size={20}
                  color="inherit"
                  sx={{ color: 'white' }}
                />
                {isEditMode ? 'Actualizando...' : 'Publicando...'}
              </Box>
            </>
          ) : isEditMode ? (
            'Actualizar Producto'
          ) : (
            'Publicar Producto'
          )}
        </Button>
      </Stack>
    </Paper>
  );
};

export default ProductResultsPanel;
