/**
 * ============================================================================
 * ADVANCED LOADING STATES - COMPONENTES DE LOADING PROFESIONALES
 * ============================================================================
 */

/*
  Ruedita que gira cuando se está carga el marketplace de productos.
  Cambiar el nombre a "Loading"
*/

import React from 'react';
import {
  Box,
  Grid,
  Paper,
  Skeleton,
  Typography,
  LinearProgress,
  Fade,
  Grow,
  CircularProgress,
  Chip,
} from '@mui/material';
import { Inventory as InventoryIcon } from '@mui/icons-material';

/**
 * Skeleton loader mejorado para productos
 */
export const ProductCardSkeleton = ({ index = 0 }) => (
  <Grow in={true} timeout={300} style={{ transitionDelay: `${index * 50}ms` }}>
    <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
      <Paper
        sx={{
          p: 2,
          height: 420,
          borderRadius: 2,
          overflow: 'hidden',
        }}
      >
        {/* Imagen */}
        <Skeleton
          variant="rectangular"
          height={200}
          sx={{
            mb: 2,
            borderRadius: 1,
            animation: 'wave 1.6s ease-in-out 0.5s infinite',
          }}
        />

        {/* Título */}
        <Skeleton variant="text" height={28} width="85%" sx={{ mb: 1 }} />

        {/* Precio */}
        <Skeleton variant="text" height={24} width="60%" sx={{ mb: 1 }} />

        {/* Stock */}
        <Skeleton variant="text" height={20} width="40%" sx={{ mb: 2 }} />

        {/* Botones */}
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Skeleton
            variant="rectangular"
            height={32}
            width={80}
            sx={{ borderRadius: 1 }}
          />
          <Skeleton
            variant="rectangular"
            height={32}
            width={80}
            sx={{ borderRadius: 1 }}
          />
        </Box>
      </Paper>
    </Grid>
  </Grow>
);

/**
 * Grid de skeletons con animación staggered
 */
export const ProductSkeletonGrid = ({ count = 8 }) => (
  <>
    {Array.from({ length: count }).map((_, index) => (
      <ProductCardSkeleton key={`skeleton-${index}`} index={index} />
    ))}
  </>
);

/**
 * Loading state para carga inicial
 */
export const InitialLoadingState = () => (
  <Fade in={true} timeout={600}>
    <Box sx={{ width: '100%' }}>
      {/* Progress bar */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Cargando productos...
        </Typography>
        <LinearProgress
          sx={{
            height: 6,
            borderRadius: 3,
            backgroundColor: 'grey.200',
            '& .MuiLinearProgress-bar': {
              borderRadius: 3,
            },
          }}
        />
      </Box>

      {/* Skeleton grid */}
      <Grid container spacing={3}>
        <ProductSkeletonGrid count={8} />
      </Grid>
    </Box>
  </Fade>
);

/**
 * Loading state para infinite scroll
 */
export const LoadMoreState = ({ show = true }) => (
  <Fade in={show} timeout={300}>
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        py: 0,
        gap: 2,
      }}
    >
      <CircularProgress size={24} thickness={4} />
      <Typography variant="body2" color="text.secondary">
        Cargando más productos...
      </Typography>
    </Box>
  </Fade>
);

/**
 * Progress indicator para scroll
 */
export const ScrollProgress = ({ progress, totalCount, displayedCount }) => (
  <Fade in={progress < 100} timeout={300}>
    <Paper
      sx={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        p: 2,
        zIndex: 1000,
        borderRadius: 2,
        boxShadow: 3,
        minWidth: 200,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <InventoryIcon fontSize="small" color="primary" />
        <Typography variant="body2" fontWeight={600}>
          Productos cargados
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{
            flex: 1,
            height: 8,
            borderRadius: 4,
            backgroundColor: 'grey.200',
            '& .MuiLinearProgress-bar': {
              borderRadius: 4,
            },
          }}
        />
        <Chip
          label={`${displayedCount}/${totalCount}`}
          size="small"
          color="primary"
          variant="outlined"
        />
      </Box>
    </Paper>
  </Fade>
);

/**
 * Empty state mejorado con centrado horizontal
 */
export const EmptyProductsState = ({ searchTerm, categoryFilter }) => (
  <Grow in={true} timeout={600}>
    <Grid size={12}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          width: '100%',
          py: 4,
        }}
      >
        <Paper
          elevation={0}
          sx={{
            p: 6,
            textAlign: 'center',
            maxWidth: 500,
            width: '100%',
            mx: 'auto',
            borderRadius: 3,
            border: '2px dashed',
            borderColor: 'grey.300',
            backgroundColor: 'grey.50',
          }}
        >
          <InventoryIcon
            sx={{
              fontSize: 64,
              color: 'text.secondary',
              mb: 2,
              opacity: 0.5,
            }}
          />
          <Typography
            variant="h6"
            color="text.secondary"
            gutterBottom
            fontWeight={600}
          >
            {searchTerm || categoryFilter !== 'all'
              ? 'No se encontraron productos'
              : 'Aún no tienes productos'}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {searchTerm || categoryFilter !== 'all'
              ? 'Intenta modificar los filtros de búsqueda'
              : 'Comienza agregando tu primer producto para mostrar tu catálogo'}
          </Typography>{' '}
          {(searchTerm || categoryFilter !== 'all') && (
            <Box
              sx={{
                display: 'flex',
                gap: 1,
                justifyContent: 'center',
                alignItems: 'center',
                flexWrap: 'wrap',
                mt: 1,
              }}
            >
              {searchTerm && (
                <Chip
                  label={`Búsqueda: "${searchTerm}"`}
                  size="small"
                  variant="outlined"
                  color="primary"
                />
              )}
              {categoryFilter !== 'all' && (
                <Chip
                  label={`Categoría: ${categoryFilter}`}
                  size="small"
                  variant="outlined"
                  color="secondary"
                />
              )}
            </Box>
          )}
        </Paper>
      </Box>
    </Grid>
  </Grow>
);
