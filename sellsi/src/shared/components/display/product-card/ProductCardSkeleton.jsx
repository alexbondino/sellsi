// src/shared/components/display/product-card/ProductCardSkeleton.jsx
import React from 'react';
import { Card, Box, Skeleton, alpha } from '@mui/material';

/**
 * ProductCardSkeleton
 * Un skeleton inteligente que replica el layout y dimensiones de ProductCard
 * para minimizar CLS. Soporta variantes: 'buyer' | 'supplier' | 'provider'.
 */
export const ProductCardSkeleton = React.memo(({ type = 'buyer' }) => {
  // Estilos del card alineados con ProductCard.jsx
  const cardStyles = React.useMemo(
    () => ({
      height:
        type === 'supplier'
          ? { xs: 380, sm: 400, md: 357.5, lg: 487.5, xl: 520 }
          : { xs: 340, sm: 360, md: 340, lg: 420, xl: 440 },
      // ✅ Buyer: valores reducidos para mostrar 4 tarjetas por fila en desktop
      width:
        type === 'supplier'
          ? { xs: 180, sm: 195, md: 220, lg: 370, xl: 360 }
          : { xs: 160, sm: 180, md: 200, lg: 230, xl: 250 },
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      border: '1px solid',
      borderColor: 'divider',
      borderRadius: 2,
      overflow: 'hidden',
      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: theme =>
          `0 8px 25px ${alpha(theme.palette.primary.main, 0.08)}`,
        borderColor: 'primary.main',
      },
    }),
    [type]
  );

  // Altura del contenedor de imagen/encabezado para cada variante
  const headerHeight = React.useMemo(() => {
    // Alineado a ProductCardImage y ProviderContext
    return { xs: 142, sm: 154, md: 187.5, lg: 220, xl: 220 };
  }, []);

  return (
    <Card
      elevation={type === 'buyer' || type === 'provider' ? 2 : 0}
      sx={cardStyles}
    >
      {/* Encabezado / Imagen */}
      <Box
        sx={{
          width: '100%',
          height: headerHeight,
          bgcolor: 'grey.100',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Skeleton
          variant={type === 'provider' ? 'rectangular' : 'rectangular'}
          animation="wave"
          sx={{
            width: '100%',
            height: '100%',
            borderRadius: type === 'provider' ? 0 : 0,
          }}
        />
      </Box>

      {/* Cuerpo del card: variante específica */}
      <Box sx={{ flex: 1, p: 2, position: 'relative' }}>
        {type === 'supplier' && <SupplierBodySkeleton />}
        {type === 'buyer' && <BuyerBodySkeleton />}
        {type === 'provider' && <ProviderBodySkeleton />}
      </Box>

      {/* Botón/acciones al pie (buyer y provider muestran botón) */}
      {(type === 'buyer' || type === 'provider') && (
        <Box
          sx={{
            position: 'absolute',
            left: 16,
            right: 16,
            bottom: 10,
            p: 0,
          }}
        >
          <Skeleton
            variant="rectangular"
            height={40}
            sx={{ borderRadius: 2 }}
          />
        </Box>
      )}
    </Card>
  );
});

ProductCardSkeleton.displayName = 'ProductCardSkeleton';

// ---------- Sub-skeletons por variante ---------- //

const BuyerBodySkeleton = () => (
  <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
    {/* Nombre del producto */}
    <Box sx={{ mb: { xs: 0.5, md: 1 } }}>
      <Skeleton variant="text" width="85%" height={28} />
    </Box>

    {/* MOBILE: bloque compacto */}
    <Box
      sx={{
        display: { xs: 'flex', sm: 'flex', md: 'none' },
        flexDirection: 'column',
        gap: 1,
      }}
    >
      {/* Proveedor */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <Skeleton variant="circular" width={16} height={16} />
        <Skeleton variant="text" width={120} height={18} />
      </Box>
      {/* Compra mínima */}
      <Skeleton variant="text" width={160} height={18} />
      {/* Precio */}
      <Skeleton variant="text" width={110} height={26} />
      {/* Stock */}
      <Skeleton variant="text" width={140} height={18} />
    </Box>

    {/* DESKTOP: bloque detallado */}
    <Box
      sx={{
        display: { xs: 'none', sm: 'none', md: 'flex' },
        flexDirection: 'column',
        gap: 0.75,
        flex: 1,
      }}
    >
      {/* Proveedor */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <Skeleton variant="circular" width={16} height={16} />
        <Skeleton variant="text" width={160} height={18} />
      </Box>
      {/* Compra mínima */}
      <Skeleton variant="text" width={190} height={18} />
      {/* Precio (incluye posible precio tachado) */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Skeleton variant="text" width={120} height={28} />
        <Skeleton variant="text" width={80} height={18} />
      </Box>
      {/* Stock */}
      <Skeleton variant="text" width={160} height={18} />
    </Box>
  </Box>
);

const SupplierBodySkeleton = () => (
  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
    {/* Badges superpuestos */}
    <Box
      sx={{ position: 'absolute', top: 8, left: 8, display: 'flex', gap: 1 }}
    >
      <Skeleton variant="rounded" width={60} height={22} />
      <Skeleton variant="rounded" width={48} height={22} />
    </Box>
    {/* Menú de acciones */}
    <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
      <Skeleton variant="circular" width={34} height={34} />
    </Box>

    {/* Categoría */}
    <Skeleton variant="rounded" width={90} height={20} />
    {/* Nombre */}
    <Skeleton variant="text" width="90%" height={26} />
    {/* Precio o tramos */}
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Skeleton variant="text" width={120} height={24} />
      <Skeleton variant="text" width={80} height={18} />
    </Box>
    {/* Métricas */}
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
      <Skeleton variant="text" width={160} height={18} />
      <Skeleton variant="text" width={180} height={18} />
      <Skeleton variant="text" width={140} height={18} />
    </Box>
  </Box>
);

const ProviderBodySkeleton = () => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      textAlign: 'center',
      gap: 1,
      pb: '48px', // espacio para botón inferior
    }}
  >
    {/* Nombre y verificación */}
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 0.5,
        justifyContent: 'center',
        width: '100%',
      }}
    >
      <Skeleton variant="text" width="70%" height={24} />
      <Skeleton variant="circular" width={18} height={18} />
    </Box>
    {/* Descripción */}
    <Box sx={{ width: '100%' }}>
      <Skeleton variant="text" width="92%" height={18} sx={{ mx: 'auto' }} />
      <Skeleton variant="text" width="88%" height={18} sx={{ mx: 'auto' }} />
      <Skeleton variant="text" width="75%" height={18} sx={{ mx: 'auto' }} />
    </Box>
  </Box>
);

/**
 * ProductCardSkeletonGrid
 * Renderiza una grilla de skeletons respetando el ancho de cada card.
 */
export const ProductCardSkeletonGrid = React.memo(
  ({ type = 'buyer', count = 8, gridStyles, cardContainerStyles }) => {
    // Fallbacks por si no se pasan estilos del layout real
    const grid = gridStyles || {
      display: 'grid',
      gridTemplateColumns: {
        xs: 'repeat(2, 1fr)',
        sm: 'repeat(2, 1fr)',
        md: 'repeat(3, 1fr)',
        lg: 'repeat(4, 1fr)',
        xl: 'repeat(5, 1fr)',
      },
      gap: { xs: 2, sm: 2, md: 3, lg: 3, xl: 3 },
      width: '100%',
      justifyItems: 'center',
    };
    const cardWrap = cardContainerStyles || {
      width: '100%',
      maxWidth: '240px',
    };

    return (
      <Box sx={grid}>
        {Array.from({ length: count }).map((_, i) => (
          <Box key={i} sx={cardWrap}>
            <ProductCardSkeleton type={type} />
          </Box>
        ))}
      </Box>
    );
  }
);

ProductCardSkeletonGrid.displayName = 'ProductCardSkeletonGrid';

export default ProductCardSkeleton;
