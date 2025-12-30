// src/shared/components/display/product-card/ProductCardSkeleton.jsx
import React from 'react';
import { Card, Box, Skeleton, alpha } from '@mui/material';

/**
 * ProductCardSkeleton
 * Un skeleton inteligente que replica el layout y dimensiones de ProductCard
 * para minimizar CLS. Soporta variantes: 'buyer' | 'supplier' | 'provider'.
 */
export const ProductCardSkeleton = React.memo(({ type = 'buyer' }) => {
  // Estilos del card alineados EXACTAMENTE con ProductCard.jsx
  const cardStyles = React.useMemo(
    () => ({
      // ✅ CORREGIDO: Altura exacta de ProductCard
      height:
        type === 'supplier'
          ? { xs: 380, sm: 400, md: 435, lg: 487.5, xl: 520 }
          : { xs: 380, sm: 400, md: 435, lg: 487.5, xl: 520 },
      // ✅ CORREGIDO: width y maxWidth exactos de ProductCard
      width: '100%',
      maxWidth:
        type === 'supplier'
          ? { xs: '100%', sm: '100%', md: 240, lg: 380, xl: 370 }
          : { xs: '100%', sm: '100%', md: 240, lg: 320, xl: 340 },
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      border: '1px solid',
      borderColor: 'divider',
      borderRadius: 2,
      overflow: 'hidden',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      boxSizing: 'border-box',
    }),
    [type]
  );

  // ✅ CORREGIDO: Altura del contenedor de imagen/avatar según tipo
  const headerHeight = React.useMemo(() => {
    // Para provider: altura del avatar según ProductCardProviderContext línea 74
    if (type === 'provider') {
      return { xs: 160, sm: 170, md: 187.5, lg: 243.75, xl: 260 };
    }
    // Para buyer: altura de imagen de producto según ProductCardImage
    return { xs: 142, sm: 154, md: 187.5, lg: 243.75, xl: 260 };
  }, [type]);

  return (
    <Card
      elevation={type === 'buyer' || type === 'provider' ? 2 : 0}
      sx={cardStyles}
    >
      {/* Encabezado / Imagen - buyer muestra imagen de producto, provider muestra avatar/logo, supplier NO muestra imagen */}
      {type !== 'supplier' && (
        <Box
          sx={{
            width: '100%',
            height: headerHeight,
            bgcolor: type === 'provider' ? '#fff' : 'grey.100',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            p: type === 'provider' ? { xs: 1.5, sm: 1.8, md: 1.5 } : 0,
          }}
        >
          <Skeleton
            variant={type === 'provider' ? 'rectangular' : 'rectangular'}
            animation="wave"
            sx={{
              width: '100%',
              height: '100%',
            }}
          />
        </Box>
      )}

      {/* ✅ CORREGIDO: Estructura con CardContent como ProductCard */}
      <Box sx={{ height: '100%' }}>
        {/* CardContent equivalente */}
        <Box
          sx={{
            flexGrow: 1,
            // ✅ Provider usa padding diferente (ProductCardProviderContext línea 96)
            px: type === 'provider' ? { xs: 1.5, sm: 2 } : { xs: 1, sm: 2 },
            py: type === 'provider' ? 2 : 2,
            pb: type === 'provider' ? '8px !important' : { xs: 6, md: 9 },
            display: 'flex',
            flexDirection: 'column',
            // Provider usa alignItems center y textAlign center
            alignItems: type === 'provider' ? 'center' : 'stretch',
            textAlign: type === 'provider' ? 'center' : 'left',
          }}
        >
          {/* Cuerpo del card: variante específica */}
          {type === 'supplier' && <SupplierBodySkeleton />}
          {type === 'buyer' && <BuyerBodySkeleton />}
          {type === 'provider' && <ProviderBodySkeleton />}
        </Box>

        {/* ✅ CORREGIDO: CardActions equivalente con posicionamiento absoluto */}
        {(type === 'buyer' || type === 'provider') && (
          <Box
            sx={{
              // ✅ Provider usa padding diferente (ProductCardProviderContext línea 164)
              p: type === 'provider' ? { xs: 1.5, sm: 2 } : 0,
              pt: type === 'provider' ? 0 : 0,
              ...(type === 'buyer' && {
                position: 'absolute',
                left: '16px',
                right: '16px',
                bottom: '10px',
              }),
              ...(type === 'provider' && {
                display: 'flex',
                justifyContent: 'center',
              }),
            }}
          >
            <Skeleton
              variant="rectangular"
              height={40}
              sx={{ borderRadius: 2, width: type === 'provider' ? '100%' : '100%' }}
            />
          </Box>
        )}
      </Box>
    </Card>
  );
});

ProductCardSkeleton.displayName = 'ProductCardSkeleton';

// ---------- Sub-skeletons por variante ---------- //

const BuyerBodySkeleton = () => (
  <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
    {/* ✅ Product name - EXACTO como ProductCardBuyerContext */}
    <Box sx={{ mb: { xs: 0.5, md: 1 } }}>
      <Skeleton
        variant="text"
        width="85%"
        sx={{
          minHeight: 48,
          fontSize: { xs: 14, md: 17.5 },
        }}
      />
    </Box>

    {/* ✅ MOBILE: bloque compacto - EXACTO como ProductCardBuyerContext */}
    <Box
      sx={{
        display: { xs: 'flex', sm: 'flex', md: 'none' },
        flexDirection: 'column',
        justifyContent: 'space-between',
        alignItems: 'stretch',
        gap: 1,
      }}
    >
      {/* Proveedor con ícono de verificación */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <Skeleton variant="text" width={30} height={18} sx={{ fontSize: 12 }} />
        <Skeleton variant="text" width={90} height={18} sx={{ fontSize: 12, fontWeight: 700 }} />
        <Skeleton variant="circular" width={16} height={16} />
      </Box>
      {/* Compra mínima */}
      <Skeleton variant="text" width={160} height={18} sx={{ fontSize: 12 }} />
      {/* Precio */}
      <Skeleton variant="text" width={110} height={26} sx={{ fontSize: { xs: 14, sm: 16, md: 22 } }} />
      {/* Stock */}
      <Skeleton variant="text" width={140} height={18} sx={{ fontSize: 12 }} />
    </Box>

    {/* ✅ DESKTOP: bloque detallado - EXACTO como ProductCardBuyerContext */}
    <Box
      sx={{
        display: { xs: 'none', sm: 'none', md: 'flex' },
        flexDirection: 'column',
        justifyContent: 'space-between',
        alignItems: 'stretch',
        gap: 0.5,
        mb: 1.5,
        flexGrow: 1,
      }}
    >
      {/* Proveedor con ícono de verificación */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <Skeleton variant="text" width={30} height={18} sx={{ fontSize: 12 }} />
        <Skeleton variant="text" width={120} height={18} sx={{ fontSize: 12, fontWeight: 700 }} />
        <Skeleton variant="circular" width={16} height={16} />
      </Box>
      {/* Compra mínima */}
      <Skeleton variant="text" width={190} height={18} sx={{ fontSize: 12 }} />
      {/* Precio (puede incluir precio tachado) */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Skeleton variant="text" width={120} height={28} sx={{ fontSize: { xs: 14, sm: 16, md: 22 } }} />
      </Box>
      {/* Stock */}
      <Skeleton variant="text" width={160} height={18} sx={{ fontSize: 12 }} />
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
      width: '100%',
    }}
  >
    {/* Nombre y verificación - ProductCardProviderContext línea 106 (mb: 1.5) */}
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 0.5,
        justifyContent: 'center',
        mb: 1.5,
      }}
    >
      <Skeleton 
        variant="text" 
        width="70%" 
        sx={{ 
          fontSize: { xs: '1rem', sm: '1.1rem', md: '1.4rem' },
          height: { xs: 24, sm: 26, md: 34 }
        }} 
      />
      <Skeleton variant="circular" width={{ xs: 18, sm: 20, md: 20 }} height={{ xs: 18, sm: 20, md: 20 }} sx={{ flexShrink: 0 }} />
    </Box>
    {/* Descripción - ProductCardProviderContext línea 131 (WebkitLineClamp: xs: 6, sm: 6, md: 6, lg: 8) */}
    <Box sx={{ width: '100%' }}>
      <Skeleton variant="text" width="95%" sx={{ fontSize: { xs: '0.85rem', sm: '0.9rem', md: '0.9rem' }, mx: 'auto', mb: 0.5 }} />
      <Skeleton variant="text" width="92%" sx={{ fontSize: { xs: '0.85rem', sm: '0.9rem', md: '0.9rem' }, mx: 'auto', mb: 0.5 }} />
      <Skeleton variant="text" width="88%" sx={{ fontSize: { xs: '0.85rem', sm: '0.9rem', md: '0.9rem' }, mx: 'auto', mb: 0.5 }} />
      <Skeleton variant="text" width="90%" sx={{ fontSize: { xs: '0.85rem', sm: '0.9rem', md: '0.9rem' }, mx: 'auto', mb: 0.5 }} />
      <Skeleton variant="text" width="95%" sx={{ fontSize: { xs: '0.85rem', sm: '0.9rem', md: '0.9rem' }, mx: 'auto', mb: 0.5 }} />
      <Skeleton variant="text" width="92%" sx={{ fontSize: { xs: '0.85rem', sm: '0.9rem', md: '0.9rem' }, mx: 'auto', mb: 0.5 }} />
      <Skeleton variant="text" width="88%" sx={{ fontSize: { xs: '0.85rem', sm: '0.9rem', md: '0.9rem' }, mx: 'auto', mb: 0.5 }} />
      <Skeleton variant="text" width="90%" sx={{ fontSize: { xs: '0.85rem', sm: '0.9rem', md: '0.9rem' }, mx: 'auto', mb: 0.5 }} />
      <Skeleton variant="text" width="85%" sx={{ fontSize: { xs: '0.85rem', sm: '0.9rem', md: '0.9rem' }, mx: 'auto', mb: 0.5 }} />
      {/* Sixth line hidden on xs/sm to match new WebkitLineClamp */}
      <Skeleton variant="text" width="80%" sx={{ fontSize: { xs: '0.85rem', sm: '0.9rem', md: '0.9rem' }, mx: 'auto', mb: 0.5, display: { xs: 'none', sm: 'none', md: 'block' } }} />
      {/* Líneas adicionales para lg/xl (display condicional via CSS si es necesario, o siempre visible) */}
      <Skeleton variant="text" width="87%" sx={{ fontSize: { xs: '0.85rem', sm: '0.9rem', md: '0.9rem' }, mx: 'auto', mb: 0.5, display: { xs: 'none', lg: 'block' } }} />
      <Skeleton variant="text" width="75%" sx={{ fontSize: { xs: '0.85rem', sm: '0.9rem', md: '0.9rem' }, mx: 'auto', display: { xs: 'none', lg: 'block' } }} />
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
