import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Card,
  Stack,
  Chip,
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { formatPrice } from '../../../../shared/utils/formatters';

/**
 * Componente para la barra inferior expandible en móvil
 * Muestra el total y permite expandir para ver detalles completos
 */
const MobileExpandableBottomBar = ({
  calculations,
  formData,
  isValid,
  hasActualChanges, // 🔧 FIX EDIT: Para detectar cambios reales
  isLoading,
  isEditMode,
  onSubmit,
}) => {
  const [isPanelExpanded, setIsPanelExpanded] = useState(false);

  // 🔧 FIX EDIT: Lógica para habilitar/deshabilitar botón según el modo
  const isButtonDisabled = useMemo(() => {
    if (isLoading) return true;
    if (!isValid) return true;

    // En modo edición, solo habilitar si hay cambios reales
    if (isEditMode && hasActualChanges !== undefined) {
      return !hasActualChanges;
    }

    // En modo creación, solo verificar validez
    return false;
  }, [isLoading, isValid, isEditMode, hasActualChanges]);

  // 🔧 FIX 3: Bloquear scroll del body cuando el panel está expandido
  useEffect(() => {
    if (isPanelExpanded) {
      // Guardar el scroll actual y bloquear
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
    } else {
      // Restaurar el scroll
      const scrollY = document.body.style.top;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0') * -1);
      }
    }

    // Cleanup al desmontar el componente
    return () => {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
    };
  }, [isPanelExpanded]);

  return (
    <>
      {/* Barra Principal Compacta - JUSTO ENCIMA de MobileBar */}
      <Paper
        elevation={24}
        sx={{
          position: 'fixed',
          bottom: 80, // 🔧 80px desde abajo para estar encima de MobileBar (que mide ~70px)
          left: 0,
          right: 0,
          zIndex: 1450, // 🔧 Mayor que MobileBar (1400) pero no excesivo
          borderRadius: '16px 16px 0 0',
          background: 'linear-gradient(135deg, #fff 0%, #f8f9fa 100%)',
          borderTop: '2px solid #1976d2',
          p: 2,
          boxShadow: '0 -8px 32px rgba(0,0,0,0.25)',
        }}
      >
        {/* Una sola fila con Total a la izquierda y botones a la derecha */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 2,
          }}
        >
          {/* Total Estimado - Izquierda */}
          <Box sx={{ flex: 1 }}>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mb: 0.5, fontSize: '0.7rem' }}
            >
              Total a recibir
            </Typography>
            <Typography
              variant="h6"
              fontWeight="700"
              color="primary.main"
              sx={{ lineHeight: 1, fontSize: '1rem' }}
            >
              {calculations.isRange
                ? `${formatPrice(
                    calculations.rangos.total?.min || 0
                  )} - ${formatPrice(calculations.rangos.total?.max || 0)}`
                : `${formatPrice(calculations.total || 0)}`}
            </Typography>
          </Box>

          {/* Botones de Acción - Derecha */}
          <Box sx={{ display: 'flex', gap: 1 }}>
            {/* Botón Ver Detalles - Más pequeño */}
            <Button
              variant="outlined"
              size="small"
              startIcon={<VisibilityIcon sx={{ fontSize: '0.8rem' }} />}
              onClick={() => setIsPanelExpanded(true)}
              sx={{
                py: 0.4,
                px: 0.8,
                fontSize: '0.65rem', // 🔧 Reducido aún más
                textTransform: 'none',
                borderRadius: 2,
                fontWeight: 600,
                minWidth: 'auto',
              }}
            >
              Ver Detalles
            </Button>

            {/* Botón Publicar Producto - Más pequeño */}
            <Button
              variant="contained"
              size="small"
              onClick={onSubmit}
              disabled={isButtonDisabled} // 🔧 FIX EDIT: Usar nueva lógica condicional
              sx={{
                py: 0.4,
                px: 1.2,
                fontSize: '0.65rem', // 🔧 Reducido aún más
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                minWidth: 'auto',
              }}
            >
              {isLoading ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Typography sx={{ fontSize: '0.6rem' }}>
                    {isEditMode ? 'Actualizando...' : 'Publicando...'}
                  </Typography>
                </Box>
              ) : isEditMode ? (
                'Actualizar'
              ) : (
                'Publicar'
              )}
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Panel de Detalles Expandido */}
      {isPanelExpanded && (
        <Paper
          elevation={24}
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 10000, // 🔧 Z-index máximo para estar por encima de todo
            background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Header del Panel Expandido */}
          <Box
            sx={{
              p: 3,
              borderBottom: '2px solid #e0e0e0',
              background: 'linear-gradient(135deg, #fff 0%, #f8f9fa 100%)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 2,
              }}
            >
              <Typography
                variant="h5"
                fontWeight="700"
                color="primary.main"
                sx={{ fontSize: '1.3rem' }}
              >
                Detalles de Venta
              </Typography>
              <Button
                variant="outlined"
                size="small"
                startIcon={<CloseIcon />}
                onClick={() => setIsPanelExpanded(false)}
                sx={{
                  textTransform: 'none',
                  borderRadius: 2,
                  fontWeight: 600,
                  fontSize: '0.7rem',
                }}
              >
                Cerrar
              </Button>
            </Box>

            {/* Total destacado - Ahora es Resumen General igual que desktop */}
            <Box
              sx={{
                textAlign: 'left',
                p: 2,
                borderRadius: 3,
                background: 'white',
                border: '2px solid #1976d2',
              }}
            >
              <Typography
                variant="h6"
                fontWeight="600"
                sx={{ mb: 2, fontSize: '1rem' }}
              >
                📊 Resumen General
              </Typography>

              <Stack spacing={1}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ fontSize: '0.75rem' }}
                  >
                    Ingreso por Ventas:
                  </Typography>
                  <Typography
                    variant="body1"
                    fontWeight="600"
                    sx={{ fontSize: '0.8rem' }}
                  >
                    {calculations.isRange
                      ? `${formatPrice(
                          calculations.rangos.ingresoPorVentas.min
                        )} - ${formatPrice(
                          calculations.rangos.ingresoPorVentas.max
                        )}`
                      : formatPrice(calculations.ingresoPorVentas)}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ fontSize: '0.75rem' }}
                  >
                    Tarifa por Servicio (2%):
                  </Typography>
                  <Typography
                    variant="body1"
                    fontWeight="600"
                    sx={{ fontSize: '0.8rem' }}
                  >
                    {calculations.isRange
                      ? `${formatPrice(
                          calculations.rangos.tarifaServicio.min
                        )} - ${formatPrice(
                          calculations.rangos.tarifaServicio.max
                        )}`
                      : formatPrice(calculations.tarifaServicio)}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    pt: 1,
                    borderTop: '2px solid #1976d2',
                    mt: 1,
                  }}
                >
                  <Typography
                    variant="h6"
                    fontWeight="700"
                    color="primary.main"
                    sx={{ fontSize: '0.9rem' }}
                  >
                    Total:
                  </Typography>
                  <Typography
                    variant="h6"
                    fontWeight="700"
                    color="primary.main"
                    sx={{ fontSize: '0.9rem' }}
                  >
                    {calculations.isRange
                      ? `${formatPrice(
                          calculations.rangos.total.min
                        )} - ${formatPrice(calculations.rangos.total.max)}`
                      : formatPrice(calculations.total)}
                  </Typography>
                </Box>
              </Stack>

              {/* Texto explicativo debajo del total */}
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mt: 2, display: 'block', fontSize: '0.7rem' }}
              >
                {calculations.isRange
                  ? 'Estos son los rangos de montos que podrás recibir según cómo se distribuyan las ventas entre los tramos de precio'
                  : 'Este es el monto que recibirás en tu cuenta una vez concretada la venta. El valor no considera los costos de despacho.'}
              </Typography>
            </Box>
          </Box>

          {/* Contenido Scrolleable */}
          <Box
            sx={{
              flex: 1,
              overflow: 'auto',
              p: 3,
              '&::-webkit-scrollbar': {
                width: '6px',
              },
              '&::-webkit-scrollbar-track': {
                backgroundColor: 'grey.200',
                borderRadius: '3px',
              },
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: 'primary.main',
                borderRadius: '3px',
              },
            }}
          >
            <Stack spacing={3}>
              {calculations.isRange ? (
                // Mostrar detalles de rangos - Igual que desktop
                <>
                  {/* Mostrar detalles por tramo */}
                  <Typography
                    variant="h6"
                    fontWeight="600"
                    sx={{ mb: 2, fontSize: '0.9rem' }}
                  >
                    📋 Detalles por Tramo
                  </Typography>
                  {calculations.rangos.details?.map((detail, index) => (
                    <Card
                      key={index}
                      elevation={1}
                      sx={{
                        p: 2.5,
                        borderRadius: 3,
                        background: `linear-gradient(135deg, ${
                          index % 2 === 0 ? '#f8f9fa' : '#f5f5f5'
                        } 0%, #ffffff 100%)`,
                        border: `1px solid ${
                          index % 2 === 0 ? '#e0e0e0' : '#d0d0d0'
                        }`,
                      }}
                    >
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          mb: 1.5,
                        }}
                      >
                        <Typography
                          variant="h6"
                          fontWeight="600"
                          color="primary.main"
                          sx={{ fontSize: '0.85rem' }}
                        >
                          📊 Rango {index + 1}
                        </Typography>
                        <Chip
                          label={`${detail.min}-${detail.max} unidades`}
                          color="primary"
                          variant="outlined"
                          sx={{ fontSize: '0.6rem' }}
                        />
                      </Box>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                        }}
                      >
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ fontSize: '0.7rem' }}
                        >
                          Precio por unidad:
                        </Typography>
                        <Typography
                          variant="body1"
                          fontWeight="600"
                          sx={{ fontSize: '0.75rem' }}
                        >
                          {formatPrice(detail.precio)}
                        </Typography>
                      </Box>
                    </Card>
                  ))}
                </>
              ) : null}

              {/* Información adicional */}

              <Typography
                variant="h6"
                fontWeight="600"
                sx={{ mb: 2, fontSize: '1rem' }}
              >
                � Detalles del Producto
              </Typography>

              {/* Información adicional */}
              <Card
                elevation={1}
                sx={{
                  p: 3,
                  borderRadius: 3,
                  background:
                    'linear-gradient(135deg, #f5f5f5 0%, #ffffff 100%)',
                  border: '1px solid #e0e0e0',
                }}
              >
                <Typography
                  variant="h6"
                  fontWeight="600"
                  sx={{ mb: 2, fontSize: '1rem' }}
                >
                  📦 Información del Producto
                </Typography>
                <Stack spacing={1}>
                  <Box
                    sx={{ display: 'flex', justifyContent: 'space-between' }}
                  >
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ fontSize: '0.75rem' }}
                    >
                      Stock disponible:
                    </Typography>
                    <Typography
                      variant="body1"
                      fontWeight="600"
                      sx={{ fontSize: '0.8rem' }}
                    >
                      {formData.stock} unidades
                    </Typography>
                  </Box>
                  <Box
                    sx={{ display: 'flex', justifyContent: 'space-between' }}
                  >
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ fontSize: '0.75rem' }}
                    >
                      Compra mínima:
                    </Typography>
                    <Typography
                      variant="body1"
                      fontWeight="600"
                      sx={{ fontSize: '0.8rem' }}
                    >
                      {formData.compraMinima} unidades
                    </Typography>
                  </Box>
                  <Box
                    sx={{ display: 'flex', justifyContent: 'space-between' }}
                  >
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ fontSize: '0.75rem' }}
                    >
                      Tipo de precio:
                    </Typography>
                    <Chip
                      label={formData.pricingType}
                      color="primary"
                      size="small"
                      sx={{ fontSize: '0.65rem' }}
                    />
                  </Box>
                </Stack>
              </Card>

              {/* Información de Despacho */}
              <Card
                elevation={1}
                sx={{
                  p: 3,
                  borderRadius: 3,
                  background:
                    'linear-gradient(135deg, #e8f5e8 0%, #ffffff 100%)',
                  border: '2px solid #4caf50',
                }}
              >
                <Typography
                  variant="h6"
                  fontWeight="600"
                  sx={{ mb: 2, fontSize: '1rem' }}
                >
                  🚚 Información de Despacho
                </Typography>

                {/* Mostrar regiones de despacho */}
                {formData.shippingRegions &&
                formData.shippingRegions.length > 0 ? (
                  <Box>
                    {formData.shippingRegions.map((region, index) => (
                      <Box
                        key={index}
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          py: 1,
                          borderBottom:
                            index < formData.shippingRegions.length - 1
                              ? '1px solid #e0e0e0'
                              : 'none',
                        }}
                      >
                        <Box sx={{ flex: 1 }}>
                          <Typography
                            variant="body2"
                            fontWeight="600"
                            sx={{ fontSize: '0.75rem' }}
                          >
                            {region.regionLabel}
                          </Typography>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ fontSize: '0.65rem' }}
                          >
                            {region.maxDeliveryDays} días hábiles
                          </Typography>
                        </Box>
                        <Typography
                          variant="body2"
                          fontWeight="600"
                          color="primary.main"
                          sx={{ fontSize: '0.75rem' }}
                        >
                          {formatPrice(region.shippingValue)}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ fontSize: '0.7rem' }}
                  >
                    No hay regiones de despacho configuradas
                  </Typography>
                )}
              </Card>
            </Stack>
          </Box>
        </Paper>
      )}
    </>
  );
};

export default MobileExpandableBottomBar;
