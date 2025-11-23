/**
  py: 4, px: { xs: 0, sm: 0, md: 4 }
 * PRODUCT PAGE SKELETONS - SKELETON LOADERS PROFESIONALES
 * ============================================================================
 *
 * Skeleton loaders específicos para ProductPageView al estilo de
 * marketplaces profesionales como Amazon, MercadoLibre, etc.
 */

import React from 'react';
import { Box, Card, Grid, Skeleton, Paper, Fade, Grow } from '@mui/material';

/**
 * Skeleton para la galería de imágenes
 */
export const ProductImageGallerySkeleton = () => (
  <Fade in={true} timeout={600}>
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        maxWidth: '100%',
        px: { xs: 2, sm: 3, md: 4 },
        py: 2,
      }}
    >
      {/* Main Image Skeleton */}
      <Card
        elevation={2}
        sx={{
          mb: 2,
          overflow: 'hidden',
          borderRadius: 3,
          width: 'fit-content',
          display: 'flex',
          justifyContent: 'center',
          mx: 'auto',
        }}
      >
        <Skeleton
          variant="rectangular"
          width={500}
          height={500}
          sx={{
            bgcolor: 'grey.100',
            animation: 'wave 1.6s ease-in-out 0.5s infinite',
          }}
        />
      </Card>

      {/* Thumbnails Skeleton */}
      <Box
        sx={{
          display: 'flex',
          gap: 1,
          justifyContent: 'center',
          width: 480,
          height: 95,
          alignItems: 'center',
          mx: 'auto',
        }}
      >
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton
            key={index}
            variant="rectangular"
            width={80}
            height={80}
            sx={{
              borderRadius: 2,
              bgcolor: 'grey.100',
              animation: `wave 1.6s ease-in-out ${index * 0.1}s infinite`,
            }}
          />
        ))}
      </Box>
    </Box>
  </Fade>
);

/**
 * Skeleton para la información del producto
 */
export const ProductInfoSkeleton = () => (
  <Grow in={true} timeout={800}>
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start',
        alignItems: 'center',
        textAlign: 'center',
        px: { xs: 2, sm: 2, md: -5 },
        maxWidth: { lg: 500, xl: 600 },
      }}
    >
      {/* Título del producto */}
      <Skeleton
        variant="text"
        width="80%"
        height={48}
        sx={{ mb: 2, borderRadius: 1 }}
      />

      {/* Proveedor */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 1 }}>
        <Skeleton variant="circular" width={24} height={24} />
        <Skeleton
          variant="rectangular"
          width={120}
          height={24}
          sx={{ borderRadius: 1 }}
        />
      </Box>

      {/* Compra mínima */}
      <Skeleton
        variant="text"
        width="60%"
        height={24}
        sx={{ mb: 3, borderRadius: 1 }}
      />

      {/* Tabla de precios skeleton */}
      <Box sx={{ mb: 3, width: '100%' }}>
        <Skeleton
          variant="text"
          width="50%"
          height={32}
          sx={{ mb: 1, mx: 'auto', borderRadius: 1 }}
        />
        <Paper sx={{ maxWidth: 400, mx: 'auto' }}>
          {Array.from({ length: 4 }).map((_, index) => (
            <Box
              key={index}
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                p: 1.5,
                borderBottom: index < 3 ? '1px solid' : 'none',
                borderColor: 'divider',
              }}
            >
              <Skeleton variant="text" width={80} height={20} />
              <Skeleton variant="text" width={100} height={20} />
            </Box>
          ))}
        </Paper>
      </Box>

      {/* Descripción */}
      <Box sx={{ mb: 4, width: '100%' }}>
        <Skeleton variant="text" width="90%" height={20} sx={{ mb: 1 }} />
        <Skeleton variant="text" width="85%" height={20} sx={{ mb: 1 }} />
        <Skeleton variant="text" width="70%" height={20} />
      </Box>

      {/* Stock */}
      <Skeleton
        variant="text"
        width="40%"
        height={24}
        sx={{ mb: 4, borderRadius: 1 }}
      />

      {/* Botones de compra */}
      <Box
        sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}
      >
        <Skeleton
          variant="rectangular"
          width="100%"
          height={48}
          sx={{ borderRadius: 2 }}
        />
        <Skeleton
          variant="rectangular"
          width="100%"
          height={48}
          sx={{ borderRadius: 2 }}
        />
      </Box>
    </Box>
  </Grow>
);

/**
 * Skeleton completo para ProductPageView
 */
export const ProductPageSkeleton = () => (
  <Box sx={{ py: 4, px: { xs: 2, sm: 3, md: 4 } }}>
    {' '}
    <Grid container spacing={12} sx={{ alignItems: 'flex-start' }}>
      {/* Imagen del Producto */}
      <Grid xs={12} sm={6} md={6} lg={5}>
        <Box sx={{ display: 'flex', justifyContent: 'right' }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              minHeight: '600px',
              ml: { xs: 0, sm: 2, md: 0, lg: 32, xl: 28 },
              p: { xs: 1, sm: 2 },
            }}
          >
            <ProductImageGallerySkeleton />
          </Box>
        </Box>
      </Grid>

      {/* Información del Producto */}
      <Grid xs={12} sm={6} md={6} lg={7} xl={6}>
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <ProductInfoSkeleton />
        </Box>
      </Grid>
    </Grid>
  </Box>
);

/**
 * ============================================================================
 * INTEGRACIÓN CON COMPONENTES UI REUTILIZABLES
 * ============================================================================
 *
 * Ejemplos de cómo integrar skeleton loaders con componentes UI existentes
 * para crear experiencias de carga más realistas.
 */

/*
// Ejemplo: Usar StatusChip en skeleton loaders
import { StatusChip } from '../../../../../shared/components/display/product-card'

export const ProductInfoSkeletonWithStatusChip = () => (
  <Grow in={true} timeout={800}>
    <Box sx={{ ... }}>
      // ...existing skeleton code...
      
      // En lugar de Skeleton para stock, usar StatusChip real
      <StatusChip
        value={0}
        statusConfig={[
          { condition: (v) => v > 10, label: 'En Stock', color: 'success' },
          { condition: (v) => v > 0, label: 'Pocas Unidades', color: 'warning' },
          { condition: (v) => v === 0, label: 'Cargando...', color: 'default' },
        ]}
        sx={{ mb: 4 }}
      />
      
      // ...rest of skeleton code...
    </Box>
  </Grow>
)
*/

// ============================================================================
// SKELETONS EXISTENTES (mantener código actual)
// ============================================================================
