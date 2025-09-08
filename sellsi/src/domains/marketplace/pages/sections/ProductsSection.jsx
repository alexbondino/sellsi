// ✅ EDITAR AQUÍ PARA:
// - Cambiar diseño del título y contador
// - Modificar grid responsive de productos
// - Ajustar mensaje de "no encontrados"
// - Cambiar espaciado y márgenes del contenido

// 🔗 CONTIENE:
// - Título dinámico según sección
// - Contador de productos
// - Grid de ProductCard
// - Estado vacío con botón "Limpiar filtros"

import React from 'react';
import { Box, Typography, useTheme, useMediaQuery, CircularProgress, Paper, Button } from '@mui/material';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import BusinessIcon from '@mui/icons-material/Business';
import { SPACING_BOTTOM_MAIN } from '../../../../styles/layoutSpacing';
import { productGridColumns, productGridGaps, paginationResponsiveConfig } from '../../../../shared/constants/layoutTokens';
import { PRODUCTS_TEXTS } from '../../../../shared/constants/productsTexts';
import { useProductsDerivation } from '../../../../shared/hooks/useProductsDerivation';
import { useProgressiveProducts } from '../../../../shared/hooks/useProgressiveProducts';
import { FeatureFlags } from '../../../../shared/flags/featureFlags';
import { ProductCardSkeletonGrid } from '../../../../shared/components/display/product-card/ProductCardSkeleton';
import ProductsSectionView from './ProductsSection/ProductsSectionView';

/**
 * Componente que maneja la sección de productos, título y grid
 * ✅ DESACOPLADO: Layout estático independiente del estado de SearchBar
 */
// ✅ MEJORA DE RENDIMIENTO: Memoización del componente
const ProductsSection = React.memo(({ seccionActiva, setSeccionActiva, totalProductos, productosOrdenados, resetFiltros, titleMarginLeft, loading, error, isProviderView = false }) => {
  // Layout styles
  const mainContainerStyles = React.useMemo(() => ({
    pt: { xs: 3.5, md: '90px' },
    mt: { xs: isProviderView ? -20 : 0, md: 0 },
    pb: SPACING_BOTTOM_MAIN,
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: { xs: 'center', sm: 'center', md: 'flex-start', lg: 'flex-start', xl: 'flex-start' },
    px: { xs: 0, sm: 0, md: 3, lg: 4 },
    boxSizing: 'border-box',
    width: '100%',
  }), [isProviderView]);

    // ✅ MEJORA DE RENDIMIENTO: Memoización de estilos del contenedor interno
  // Static layout objects (memo innecesario -> removido)
  const innerContainerStyles = {
    width: { xs: '100vw', sm: '100vw', md: '100%', lg: '100%', xl: '100%' },
    maxWidth: { xs: '440px', sm: '600px', md: '960px', lg: '1280px', xl: '1700px' },
    mx: { xs: 'auto', sm: 'auto', md: 0 },
  };

    // ✅ MEJORA DE RENDIMIENTO: Memoización de estilos del grid
  const gridStyles = {
    display: 'grid',
    gridTemplateColumns: {
      xs: `repeat(${productGridColumns.xs}, 1fr)`,
      sm: `repeat(${productGridColumns.sm}, 1fr)`,
      md: `repeat(${productGridColumns.md}, 1fr)`,
      lg: `repeat(${productGridColumns.lg}, 1fr)`,
      xl: `repeat(${productGridColumns.xl}, 1fr)`,
    },
    gap: { xs: productGridGaps.xs, sm: productGridGaps.sm, md: productGridGaps.md, lg: productGridGaps.lg, xl: productGridGaps.xl },
    width: '100%',
    justifyItems: 'center',
  };

    // ✅ MEJORA DE RENDIMIENTO: Memoización de estilos de las tarjetas
  const cardContainerStyles = { width: '100%', maxWidth: '240px' };

    // ✅ MEJORA DE RENDIMIENTO: Memoización del título de sección
  const sectionTitle = React.useMemo(() => {
      if (isProviderView) {
        return (
          <>
            <BusinessIcon sx={{ color: '#1976d2', verticalAlign: 'middle', fontSize: { xs: 24, md: 32 }, mr: 1 }} />
            <span style={{ color: '#1976d2' }}>
              Proveedores Disponibles
            </span>
          </>
        );
      }
      switch (seccionActiva) {
        case 'nuevos':
          return (
            <>
              <AutoAwesomeIcon sx={{ color: 'primary.main', verticalAlign: 'middle', fontSize: { xs: 24, md: 32 }, mr: 1 }} />
              <span style={{ color: '#1976d2' }}>
                Nuevos Productos
              </span>
            </>
          );
        case 'ofertas':
          return '🔥 Ofertas Destacadas';
        case 'topVentas':
          return '⭐ Top Ventas';
        default:
          return (
            <>
              <ShoppingBagIcon sx={{ color: 'primary.main', verticalAlign: 'middle', fontSize: { xs: 24, md: 32 }, mr: 1 }} />
              Todos los Productos
            </>
          );
      }
  }, [seccionActiva, isProviderView]);

    // ✅ CALCULAR PROVEEDORES ÚNICOS SI isProviderView
  // totalProveedores eliminado (reemplazado por providersCount del hook)

    // ✅ OPTIMIZACIÓN CRÍTICA: Solo recalcular cuando productosOrdenados realmente cambie
    // (Movido arriba antes de cualquier uso para evitar ReferenceError por TDZ)
  // Derivación ahora a través del hook (fase2)
  const { items: derivedItems, providersCount } = useProductsDerivation(productosOrdenados, { providerView: isProviderView });
  const memoizedProducts = derivedItems;

    // 🚀 BATCHING THUMBNAILS: limitar cantidad de ProductCard montadas simultáneamente para reducir ráfagas de fetch
  // batching ahora dentro del hook progressive
    // ✅ MEJORA DE RENDIMIENTO: Memoización del handler de volver (solo dependencias necesarias)
  const handleBackClick = React.useCallback(() => { setSeccionActiva('todos'); }, [setSeccionActiva]);
  // ✅ SISTEMA HÍBRIDO RESPONSIVO: Infinite Scroll + Paginación
  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.only('xs'));
  const isSm = useMediaQuery(theme.breakpoints.only('sm'));
  const isMd = useMediaQuery(theme.breakpoints.only('md'));
  const isLg = useMediaQuery(theme.breakpoints.only('lg'));
  const isXl = useMediaQuery(theme.breakpoints.up('xl'));
    // ✅ VALORES RESPONSIVOS CON CARGA PROGRESIVA: Adaptan según el tamaño de pantalla
  const responsiveConfig = React.useMemo(() => {
    if (isXs) return paginationResponsiveConfig.xs;
    if (isSm) return paginationResponsiveConfig.sm;
    if (isMd) return paginationResponsiveConfig.md;
    if (isLg) return paginationResponsiveConfig.lg;
    if (isXl) return paginationResponsiveConfig.xl;
    return paginationResponsiveConfig.fallback;
  }, [isXs, isSm, isMd, isLg, isXl]);

    const {
      PRODUCTS_PER_PAGE,
      INITIAL_PRODUCTS,
      LOAD_MORE_BATCH,
      PRELOAD_TRIGGER,
    } = responsiveConfig;

    // Progressive hook (remplaza lógica anterior de paginación + infinite + batching)
  const progressive = useProgressiveProducts(memoizedProducts, {
      responsive: { isXs, isSm, isMd, isLg, isXl },
      featureFlags: { enableViewportThumbs: FeatureFlags?.ENABLE_VIEWPORT_THUMBS },
      strategy: 'hybrid',
    });
    const {
      page: currentPage,
      totalPages,
      pageItems: currentPageProducts,
      renderItems,
      changePage: handlePageChange,
      loadMore: loadMoreProducts,
      canLoadMore: isInfiniteScrollActive,
      isLoadingMore,
      paginationMeta: { startIndex, endIndex, PRODUCTS_PER_PAGE: PRODUCTS_PER_PAGE_META }
    } = progressive;
    // Componente de paginación responsivo
  const PaginationComponent = React.useMemo(() => {
      if (totalPages <= 1) return null;

      // ✅ RESPONSIVO: Menos botones en móvil, más en desktop
      const showPages = isXs ? 3 : isSm ? 4 : 5;

      let startPage = Math.max(1, currentPage - Math.floor(showPages / 2));
      let endPage = Math.min(totalPages, startPage + showPages - 1);

      if (endPage - startPage < showPages - 1) {
        startPage = Math.max(1, endPage - showPages + 1);
      }

      return (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: { xs: 0.5, sm: 1 }, // ✅ RESPONSIVO: Gap más pequeño en móvil
            py: 3,
            flexWrap: 'wrap', // ✅ RESPONSIVO: Permitir wrap en pantallas muy pequeñas
          }}
          role="navigation"
          aria-label="Paginación de productos"
        >
          {/* Botón Anterior */}
          <Button
            variant="outlined"
            disabled={currentPage === 1}
            onClick={() => handlePageChange(currentPage - 1)}
            sx={{
              minWidth: 'auto',
              px: { xs: 1, sm: 2 }, // ✅ RESPONSIVO: Padding más pequeño en móvil
              fontSize: { xs: '0.75rem', sm: '0.875rem' }, // ✅ RESPONSIVO: Texto más pequeño en móvil
            }}
            aria-label="Página anterior"
          >
            {isXs ? '‹' : '‹ Anterior'}
          </Button>{' '}
          {/* Números de página */}
          {!isXs && startPage > 1 && (
            <>
              <Button
                variant={1 === currentPage ? 'contained' : 'outlined'}
                onClick={() => handlePageChange(1)}
                sx={{ minWidth: { xs: 32, sm: 40 } }}
                aria-label="Ir a página 1"
                aria-current={currentPage === 1 ? 'page' : undefined}
              >
                1
              </Button>
              {startPage > 2 && <Typography variant="body2">...</Typography>}
            </>
          )}
          {Array.from(
            { length: endPage - startPage + 1 },
            (_, i) => startPage + i
          ).map(page => (
            <Button
              key={page}
              variant={page === currentPage ? 'contained' : 'outlined'}
              onClick={() => handlePageChange(page)}
              sx={{
                minWidth: { xs: 32, sm: 40 }, // ✅ RESPONSIVO: Botones más pequeños en móvil
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
              }}
              aria-label={`Ir a página ${page}`}
              aria-current={page === currentPage ? 'page' : undefined}
            >
              {page}
            </Button>
          ))}
          {!isXs && endPage < totalPages && (
            <>
              {endPage < totalPages - 1 && (
                <Typography variant="body2">...</Typography>
              )}
              <Button
                variant={totalPages === currentPage ? 'contained' : 'outlined'}
                onClick={() => handlePageChange(totalPages)}
                sx={{ minWidth: { xs: 32, sm: 40 } }}
                aria-label={`Ir a página ${totalPages}`}
                aria-current={currentPage === totalPages ? 'page' : undefined}
              >
                {totalPages}
              </Button>
            </>
          )}
          {/* Botón Siguiente */}
          <Button
            variant="outlined"
            disabled={currentPage === totalPages}
            onClick={() => handlePageChange(currentPage + 1)}
            sx={{
              minWidth: 'auto',
              px: { xs: 1, sm: 2 },
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
            }}
            aria-label="Página siguiente"
          >
            {isXs ? '›' : 'Siguiente ›'}
          </Button>
          {/* Info de página - Solo en pantallas medianas y grandes */}
          {!isXs && (
            <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
              Página {currentPage} de {totalPages}
            </Typography>
          )}
        </Box>
      );
  }, [currentPage, totalPages, handlePageChange, isXs, isSm]);

    // ✅ RESPONSIVO: Actualizar productos visibles cuando cambia el breakpoint
  // (Reseteo visible ahora lo maneja el hook)

    // ✅ SCROLL TO TOP: Estado y función para el FAB
  const [showScrollTop, setShowScrollTop] = React.useState(false);

  const scrollToTop = React.useCallback(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }, []);

    // ✅ SCROLL TO TOP: Mostrar/ocultar FAB basado en scroll
  React.useEffect(() => {
    const handleScroll = () => { setShowScrollTop(window.pageYOffset > 300); };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  const ui = { mainContainerStyles, innerContainerStyles, gridStyles, cardContainerStyles, sectionTitle };
  const handlers = { handleBackClick, resetFiltros, scrollToTop, showScrollTop, seccionActiva };
  const data = {
    loading, error, isProviderView, totalProductos, providersCount, productosOrdenados,
    renderItems, PaginationComponent, isInfiniteScrollActive, isLoadingMore, currentPageProducts,
    PRODUCTS_PER_PAGE_META, startIndex, endIndex, currentPage, totalPages, titleMarginLeft
  };
  const components = {
    Loading: (
      <Box sx={{ px: { xs: 0, sm: 0, md: 0 } }}>
        <ProductCardSkeletonGrid
          type={isProviderView ? 'provider' : 'buyer'}
          count={Math.max(PRODUCTS_PER_PAGE_META || 8, 8)}
          gridStyles={gridStyles}
          cardContainerStyles={cardContainerStyles}
        />
      </Box>
    ),
    Error: (err) => (
      <Paper sx={{ p: 6, textAlign: 'center', bgcolor: '#fff', borderRadius: 3, border: '1px solid #e2e8f0' }}>
        <Typography variant='h6' color='error' sx={{ mb: 2 }}>{PRODUCTS_TEXTS.errorTitle}</Typography>
        <Typography variant='body2' color='text.secondary' sx={{ mb: 3 }}>{err}</Typography>
      </Paper>
    ),
    Empty: (
      <Paper sx={{ p: 6, textAlign: 'center', bgcolor: '#fff', borderRadius: 3, border: '1px solid #e2e8f0' }}>
        <Typography variant='h6' color='text.secondary' sx={{ mb: 2 }}>
          {isProviderView ? PRODUCTS_TEXTS.emptyProvidersTitle : PRODUCTS_TEXTS.emptyProductsTitle}
        </Typography>
        <Typography variant='body2' color='text.secondary' sx={{ mb: 3 }}>
          {isProviderView ? PRODUCTS_TEXTS.emptyProvidersHint : PRODUCTS_TEXTS.emptyProductsHint}
        </Typography>
        <Button variant='outlined' onClick={resetFiltros} sx={{ mt: 2 }}>
          {isProviderView ? PRODUCTS_TEXTS.clearSearch : PRODUCTS_TEXTS.clearFilters}
        </Button>
      </Paper>
    ),
    InfiniteSpinner: (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4, mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <CircularProgress size={20} />
          <Typography variant='body2' color='text.secondary'>{PRODUCTS_TEXTS.loadMoreSpinner}</Typography>
        </Box>
      </Box>
    ),
    PageEndMessage: (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4, mb: 2 }}>
        <Typography variant='body2' color='text.secondary' sx={{ fontStyle: 'italic' }}>{PRODUCTS_TEXTS.pageEndMessage}</Typography>
      </Box>
    )
  };

  return <ProductsSectionView ui={ui} data={data} handlers={handlers} components={components} />;
});

// ✅ MEJORA DE RENDIMIENTO: DisplayName para debugging
ProductsSection.displayName = 'ProductsSection';

// ✅ ROLLBACK TEMPORAL: Exportar directamente sin ShippingProvider hasta resolver issues
export default ProductsSection;
