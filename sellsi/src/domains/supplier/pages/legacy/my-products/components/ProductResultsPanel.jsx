import React from 'react';
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
import { formatPrice } from '../../../../shared/utils/formatters';

/**
 * Componente para mostrar el panel de resultados de venta
 * Muestra cálculos de ingresos, tarifas y totales
 */
const ProductResultsPanel = ({
  calculations,
  isValid,
  isLoading,
  isEditMode,
  onBack,
  onSubmit,
}) => {
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
                )} - ${formatPrice(
                  calculations.rangos.ingresoPorVentas.max
                )}`
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
          <Typography variant="body2">
            Tarifa por Servicio (2%)
          </Typography>
          <Typography variant="body2" fontWeight="600">
            {calculations.isRange
              ? `${formatPrice(
                  calculations.rangos.tarifaServicio.min
                )} - ${formatPrice(
                  calculations.rangos.tarifaServicio.max
                )}`
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
          <Typography variant="h6" fontWeight="600">
            Total
          </Typography>
          <Typography
            variant="h6"
            fontWeight="600"
            color="primary.main"
          >
            {calculations.isRange
              ? `${formatPrice(
                  calculations.rangos.total.min
                )} - ${formatPrice(calculations.rangos.total.max)}`
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
          disabled={!isValid || isLoading}
          sx={{ 
            textTransform: 'none', 
            fontWeight: 600,
            position: 'relative'
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
                  gap: 1
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
          ) : (
            isEditMode ? 'Actualizar Producto' : 'Publicar Producto'
          )}
        </Button>
      </Stack>
    </Paper>
  );
};

export default ProductResultsPanel;
