import React from 'react';
import { Box, Card, CardContent, CardActions, Skeleton, Stack, Collapse } from '@mui/material';

/**
 * Skeleton para MobileOrderCard
 * Usado en MyOrdersPage (supplier orders)
 * Refleja estructura real: Header con ID/fecha/estado → Resumen productos → Totales → Botón expandir → Detalles colapsables → Acciones
 */
const MobileSupplierOrdersSkeleton = ({ rows = 3, expanded = false }) => {
  return (
    <Box>
      {Array.from({ length: rows }).map((_, i) => (
        <Card key={i} sx={{ mb: 2, borderRadius: 2, boxShadow: 2 }}>
          <CardContent sx={{ pb: 1 }}>
            {/* Header: ID + copy icon + Status chip */}
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Box>
                  <Skeleton variant="text" width="35%" height={20} sx={{ minWidth: 90 }} />
                  <Skeleton variant="text" width="30%" height={16} sx={{ minWidth: 70, mt: 0.5 }} />
                </Box>
                <Skeleton variant="circular" width={24} height={24} />
              </Stack>
              <Skeleton variant="rounded" width="30%" height={24} sx={{ minWidth: 80, maxWidth: 110 }} />
            </Stack>

            {/* Resumen productos (count + units) */}
            <Box sx={{ mb: 1.5 }}>
              <Skeleton variant="text" width="40%" height={18} sx={{ minWidth: 90 }} />
              <Skeleton variant="text" width="35%" height={22} sx={{ minWidth: 80 }} />
            </Box>

            {/* Totales: Productos, Envío, Total */}
            <Box sx={{ mb: 2 }}>
              <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                <Skeleton variant="text" width="30%" height={18} sx={{ minWidth: 70 }} />
                <Skeleton variant="text" width="25%" height={18} sx={{ minWidth: 60 }} />
              </Stack>
              <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                <Skeleton variant="text" width="25%" height={18} sx={{ minWidth: 50 }} />
                <Skeleton variant="text" width="25%" height={18} sx={{ minWidth: 60 }} />
              </Stack>
              <Box sx={{ pt: 1, borderTop: '1px solid rgba(0,0,0,0.12)' }}>
                <Stack direction="row" justifyContent="space-between">
                  <Skeleton variant="text" width="20%" height={22} sx={{ minWidth: 45 }} />
                  <Skeleton variant="text" width="30%" height={22} sx={{ minWidth: 70 }} />
                </Stack>
              </Box>
            </Box>

            {/* Botón expandir/contraer */}
            <Skeleton variant="rounded" width="100%" height={36} sx={{ mb: 1 }} />

            {/* Detalles expandibles */}
            {expanded && (
              <Collapse in={true} timeout="auto" unmountOnExit>
                <Box sx={{ pt: 2 }}>
                  {/* Detalle de Productos (con copy icon) */}
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                    <Skeleton variant="text" width="45%" height={20} sx={{ minWidth: 100 }} />
                    <Skeleton variant="circular" width={24} height={24} />
                  </Stack>

                  {/* Lista de productos */}
                  <Stack spacing={0.5} sx={{ mb: 2 }}>
                    {Array.from({ length: 2 }).map((_, idx) => (
                      <Stack key={idx} direction="row" justifyContent="space-between">
                        <Skeleton variant="text" width="60%" height={18} sx={{ minWidth: 120 }} />
                        <Skeleton variant="text" width="30%" height={18} sx={{ minWidth: 70 }} />
                      </Stack>
                    ))}
                  </Stack>

                  {/* Dirección de Entrega (con copy icon) */}
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                    <Skeleton variant="text" width="50%" height={20} sx={{ minWidth: 120 }} />
                    <Skeleton variant="circular" width={24} height={24} />
                  </Stack>
                  <Skeleton variant="text" width="90%" height={18} sx={{ mb: 2, minWidth: 150 }} />

                  {/* Documento Tributario */}
                  <Box sx={{ mb: 2 }}>
                    <Skeleton variant="text" width="50%" height={20} sx={{ minWidth: 120, mb: 0.5 }} />
                    <Skeleton variant="text" width="40%" height={18} sx={{ minWidth: 90 }} />
                  </Box>

                  {/* Fechas */}
                  <Box sx={{ mb: 2 }}>
                    <Skeleton variant="text" width="25%" height={20} sx={{ minWidth: 50, mb: 0.5 }} />
                    <Stack spacing={0.5}>
                      <Skeleton variant="text" width="70%" height={18} sx={{ minWidth: 130 }} />
                      <Skeleton variant="text" width="70%" height={18} sx={{ minWidth: 130 }} />
                    </Stack>
                  </Box>
                </Box>
              </Collapse>
            )}
          </CardContent>

          {/* Actions: Botones verticales fullWidth */}
          <CardActions sx={{ px: 2, pb: 2, pt: 0 }}>
            <Stack spacing={1} sx={{ width: '100%' }}>
              <Skeleton variant="rounded" width="100%" height={42} />
              <Skeleton variant="rounded" width="100%" height={42} />
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 0.5 }}>
                <Skeleton variant="circular" width={40} height={40} />
              </Box>
            </Stack>
          </CardActions>
        </Card>
      ))}
    </Box>
  );
};

export default MobileSupplierOrdersSkeleton;
