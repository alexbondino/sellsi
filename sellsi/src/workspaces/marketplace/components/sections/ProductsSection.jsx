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
import {
  Box,
  Typography,
  useTheme,
  useMediaQuery,
  CircularProgress,
  Paper,
  Button,
  Alert,
} from '@mui/material';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import BusinessIcon from '@mui/icons-material/Business';
import InfoIcon from '@mui/icons-material/Info';
import { SPACING_BOTTOM_MAIN } from '../../../../styles/layoutSpacing';
import {
  productGridColumns,
  productGridGaps,
  paginationResponsiveConfig,
} from '../../../../shared/constants/layoutTokens';
import { PRODUCTS_TEXTS } from '../../../../shared/constants/productsTexts';
import { useProductsDerivation } from '../../../../shared/hooks/useProductsDerivation';
import { isNewDate } from '../../../../shared/utils/product/isNewDate';
import { useProgressiveProducts } from '../../../../shared/hooks/useProgressiveProducts';
import { useGridPriority } from '../../../../shared/utils/gridPriorityCalculator';
import { scrollManagerAntiRebote } from '../../../../shared/utils/scrollManagerAntiRebote'; // ✅ Nuevo sistema anti-rebote
import { FeatureFlags } from '../../../supplier/shared-utils/featureFlags.js';
import { ProductCardSkeletonGrid } from '../../../../shared/components/display/product-card/ProductCardSkeleton';
import ProductsSectionView from './ProductsSection/ProductsSectionView';
import { getOrFetchManyMainThumbnails } from '../../../../services/phase1ETAGThumbnailService.js';

/**
 * Componente que maneja la sección de productos, título y grid
 * ✅ DESACOPLADO: Layout estático independiente del estado de SearchBar
 */
// ✅ MEJORA DE RENDIMIENTO: Memoización del componente
const ProductsSection = React.memo(
  ({
    seccionActiva,
    setSeccionActiva,
    totalProductos,
    productosOrdenados,
    resetFiltros,
    titleMarginLeft,
    loading,
    error,
    isProviderView = false,
    filtros,
    showNoProductsInRegionBanner = false,
    userRegion,
    getPriceTiers,
    registerProductNode,
  }) => {
    // Layout styles
    const mainContainerStyles = React.useMemo(
      () => ({
        pt: { xs: 4.5, md: '90px' },
        mt: { xs: isProviderView ? -20 : 0, md: 0 },
        pb: SPACING_BOTTOM_MAIN,
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: {
          xs: 'center',
          sm: 'center',
          md: 'flex-start',
          lg: 'flex-start',
          xl: 'flex-start',
        },
        px: { xs: 0, sm: 0, md: 3, lg: 4 },
        boxSizing: 'border-box',
        width: '100%',
      }),
      [isProviderView]
    );

    // ✅ MEJORA DE RENDIMIENTO: Memoización de estilos del contenedor interno
    // Static layout objects (memo innecesario -> removido)
    const innerContainerStyles = {
      width: { xs: '100vw', sm: '100vw', md: '100%', lg: '100%', xl: '100%' },
      maxWidth: {
        xs: '440px',
        sm: '600px',
        md: '960px',
        lg: '1280px',
        xl: '1700px',
      },
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
      gap: {
        xs: productGridGaps.xs,
        sm: productGridGaps.sm,
        md: productGridGaps.md,
        lg: productGridGaps.lg,
        xl: productGridGaps.xl,
      },
      width: '100%',
      justifyItems: 'center',
    };

    // ✅ MEJORA DE RENDIMIENTO: Memoización de estilos de las tarjetas
    const cardContainerStyles = { width: '100%', maxWidth: '240px' };

    // ✅ MEJORA DE RENDIMIENTO: Memoización del título de sección
    const sectionTitle = React.useMemo(() => {
      // Si hay filtro de región activo, mostrar título dinámico
      const activeRegion = filtros?.shippingRegions;
      
      if (activeRegion && !isProviderView) {
        // Mapeo de regiones con números romanos
        const regionLabels = {
          'arica-parinacota': 'la XV Región',
          'tarapaca': 'la I Región',
          'antofagasta': 'la II Región',
          'atacama': 'la III Región',
          'coquimbo': 'la IV Región',
          'valparaiso': 'la V Región',
          'metropolitana': 'la Región Metropolitana',
          'ohiggins': 'la VI Región',
          'maule': 'la VII Región',
          'nuble': 'la XVI Región',
          'biobio': 'la VIII Región',
          'araucania': 'la IX Región',
          'los-rios': 'la XIV Región',
          'los-lagos': 'la X Región',
          'aysen': 'la XI Región',
          'magallanes': 'la XII Región',
        };
        
        const regionLabel = regionLabels[activeRegion] || activeRegion;
        
        return (
          <>
            <ShoppingBagIcon
              sx={{
                color: 'primary.main',
                verticalAlign: 'middle',
                fontSize: { xs: 24, md: 32 },
                mr: 1,
              }}
            />
            Productos disponibles en {regionLabel}
          </>
        );
      }
      
      if (isProviderView) {
        return (
          <>
            <BusinessIcon
              sx={{
                color: '#F59E0B',
                verticalAlign: 'middle',
                fontSize: { xs: 24, md: 32 },
                mr: 1,
              }}
            />
            <span style={{ color: '#F59E0B' }}>Proveedores Disponibles</span>
          </>
        );
      }
      switch (seccionActiva) {
        case 'nuevos':
          return (
            <>
              <AutoAwesomeIcon
                sx={{
                  color: 'primary.main',
                  verticalAlign: 'middle',
                  fontSize: { xs: 24, md: 32 },
                  mr: 1,
                }}
              />
              <span style={{ color: '#1976d2' }}>Nuevos Productos</span>
            </>
          );
        case 'ofertas':
          return '🔥 Ofertas Destacadas';
        case 'topVentas':
          return '⭐ Top Ventas';
        default:
          return (
            <>
              <ShoppingBagIcon
                sx={{
                  color: 'primary.main',
                  verticalAlign: 'middle',
                  fontSize: { xs: 24, md: 32 },
                  mr: 1,
                }}
              />
              Todos los Productos
            </>
          );
      }
    }, [seccionActiva, isProviderView, filtros?.shippingRegions]);

    // ✅ CALCULAR PROVEEDORES ÚNICOS SI isProviderView
    // totalProveedores eliminado (reemplazado por providersCount del hook)

    // ✅ OPTIMIZACIÓN CRÍTICA: Solo recalcular cuando productosOrdenados realmente cambie
    // (Movido arriba antes de cualquier uso para evitar ReferenceError por TDZ)
    // Derivación ahora a través del hook (fase2)
    const { items: derivedItems, providersCount } = useProductsDerivation(
      productosOrdenados,
      { providerView: isProviderView }
    );

    // ✅ FIX: Memoizar correctamente derivedItems y aplicar filtro 'nuevos'
    // Si la sección activa es 'nuevos' (buyer view), mostramos solo productos recientes según createdAt
    const memoizedProducts = React.useMemo(() => {
      if (!Array.isArray(derivedItems)) return derivedItems;
      if (!isProviderView && seccionActiva === 'nuevos') {
        return derivedItems.filter(p => {
          try {
            return isNewDate(p?.createdAt);
          } catch (e) {
            return false;
          }
        });
      }
      return derivedItems;
    }, [derivedItems, seccionActiva, isProviderView]);

    // 🚀 BATCHING THUMBNAILS: limitar cantidad de ProductCard montadas simultáneamente para reducir ráfagas de fetch
    // batching ahora dentro del hook progressive
    // ✅ MEJORA DE RENDIMIENTO: Memoización del handler de volver (solo dependencias necesarias)
    const handleBackClick = React.useCallback(() => {
      setSeccionActiva('todos');
    }, [setSeccionActiva]);
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
      featureFlags: {
        enableViewportThumbs: FeatureFlags?.ENABLE_VIEWPORT_THUMBS,
      },
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
      paginationMeta: {
        startIndex,
        endIndex,
        PRODUCTS_PER_PAGE: PRODUCTS_PER_PAGE_META,
      },
    } = progressive;

    // ✅ NUEVO: Sistema de prioridades para imágenes (primeras 2 filas = fetchpriority="high")
    const gridPriority = useGridPriority(renderItems, {
      isXs,
      isSm,
      isMd,
      isLg,
      isXl,
    });
    const { getPriority, debugInfo } = gridPriority;

    // Debug info removed for production cleanliness
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

    const scrollToTop = React.useCallback(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, []);

    // ✅ SCROLL TO TOP: Mostrar/ocultar FAB usando ScrollManager unificado
    React.useEffect(() => {
      const listenerId = 'products-section-fab';

      const handleFabScroll = scrollData => {
        setShowScrollTop(scrollData.scrollTop > 300);
      };

      const cleanup = scrollManagerAntiRebote.addListener(
        listenerId,
        handleFabScroll,
        {
          priority: -1, // Baja prioridad para FAB
          throttle: 150, // Menos frecuente que infinite scroll
        }
      );

      return cleanup;
    }, []);
    const ui = {
      mainContainerStyles,
      innerContainerStyles,
      gridStyles,
      cardContainerStyles,
      sectionTitle,
    };
    const handlers = {
      handleBackClick,
      resetFiltros,
      scrollToTop,
      showScrollTop,
      seccionActiva,
    };
    // getPriceTiers and registerProductNode are provided via productsSectionProps from useMarketplaceLogic
    const data = {
      loading,
      error,
      isProviderView,
      totalProductos,
      providersCount,
      productosOrdenados,
      renderItems,
      PaginationComponent,
      isInfiniteScrollActive,
      isLoadingMore,
      currentPageProducts,
      PRODUCTS_PER_PAGE_META,
      startIndex,
      endIndex,
      currentPage,
      totalPages,
      titleMarginLeft,
      getPriority, // ✅ Función para determinar prioridad de imagen por índice
      getPriceTiers,
      registerProductNode,
      showNoProductsInRegionBanner,
      userRegion,
    };
    
    // Mapeo de regiones para el banner
    const getRegionLabel = (regionValue) => {
      const regionLabels = {
        'arica-parinacota': 'la XV Región',
        'tarapaca': 'la I Región',
        'antofagasta': 'la II Región',
        'atacama': 'la III Región',
        'coquimbo': 'la IV Región',
        'valparaiso': 'la V Región',
        'metropolitana': 'la Región Metropolitana',
        'ohiggins': 'la VI Región',
        'maule': 'la VII Región',
        'nuble': 'la XVI Región',
        'biobio': 'la VIII Región',
        'araucania': 'la IX Región',
        'los-rios': 'la XIV Región',
        'los-lagos': 'la X Región',
        'aysen': 'la XI Región',
        'magallanes': 'la XII Región',
      };
      return regionLabels[regionValue] || regionValue;
    };
    
    const components = {
      NoProductsInRegionBanner: showNoProductsInRegionBanner && userRegion ? (
        <Alert 
          severity="info" 
          icon={<InfoIcon />}
          sx={{ 
            mb: 3,
            borderRadius: 2,
            '& .MuiAlert-message': {
              width: '100%'
            }
          }}
        >
          <Typography variant="body2">
            No hay productos disponibles para despacho en <strong>{getRegionLabel(userRegion)}</strong>. 
            Mostrando todos los productos disponibles.
          </Typography>
        </Alert>
      ) : null,
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
      Error: err => (
        <Paper
          sx={{
            p: 6,
            textAlign: 'center',
            bgcolor: '#fff',
            borderRadius: 3,
            border: '1px solid #e2e8f0',
          }}
        >
          <Typography variant="h6" color="error" sx={{ mb: 2 }}>
            {PRODUCTS_TEXTS.errorTitle}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {err}
          </Typography>
        </Paper>
      ),
      Empty: (
        <Paper
          sx={{
            p: 6,
            textAlign: 'center',
            bgcolor: '#fff',
            borderRadius: 3,
            border: '1px solid #e2e8f0',
          }}
        >
          <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
            {isProviderView
              ? PRODUCTS_TEXTS.emptyProvidersTitle
              : PRODUCTS_TEXTS.emptyProductsTitle}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {isProviderView
              ? PRODUCTS_TEXTS.emptyProvidersHint
              : PRODUCTS_TEXTS.emptyProductsHint}
          </Typography>
          <Button variant="outlined" onClick={resetFiltros} sx={{ mt: 2 }}>
            {isProviderView
              ? PRODUCTS_TEXTS.clearSearch
              : PRODUCTS_TEXTS.clearFilters}
          </Button>
        </Paper>
      ),
      InfiniteSpinner: (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4, mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <CircularProgress size={20} />
            <Typography variant="body2" color="text.secondary">
              {PRODUCTS_TEXTS.loadMoreSpinner}
            </Typography>
          </Box>
        </Box>
      ),
      PageEndMessage: (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4, mb: 2 }}>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ fontStyle: 'italic' }}
          >
            {PRODUCTS_TEXTS.pageEndMessage}
          </Typography>
        </Box>
      ),
    };

    // Prefetch Phase1 thumbnails: primeros N productos renderizados (una sola vez)
    React.useEffect(() => {
      if (!FeatureFlags.FEATURE_PHASE1_THUMBS) return;
      if (!Array.isArray(renderItems) || !renderItems.length) return;
      // Tomar primeros 24 (o menos) IDs con product_id disponible
      const prefetchCount = 24;
      const ids = renderItems
        .slice(0, prefetchCount)
        .map(p => p?.id || p?.product_id)
        .filter(Boolean);
      if (!ids.length) return;
      let cancelled = false;
      (async () => {
        try {
          await getOrFetchManyMainThumbnails(ids, { silent: true });
        } catch (_) {
          /* noop */
        }
      })();
      return () => {
        cancelled = true;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [renderItems && renderItems.length > 0]);

    return (
      <ProductsSectionView
        ui={ui}
        data={data}
        handlers={handlers}
        components={components}
      />
    );
  }
);

// ✅ MEJORA DE RENDIMIENTO: DisplayName para debugging
ProductsSection.displayName = 'ProductsSection';

// Prefetch inicial sencillo (warm thumbnails) – se hace fuera de render para no afectar SSR hipotético
// NOTA: Simple guard to ensure side effect only in browser
if (typeof window !== 'undefined' && FeatureFlags.FEATURE_PHASE1_THUMBS) {
  // Micro cola para evitar saturar inmediatamente; se puede mejorar con observers
  // 🛡️ SAFARI FIX: Usar window.requestIdleCallback para evitar ReferenceError
  if (window.requestIdleCallback) {
    window.requestIdleCallback(() => {
      try {
        // Buscar un contenedor de productos ya montado (heurística simple)
        // La lógica real ideal estaría dentro de un effect cuando se conocen los IDs iniciales.
      } catch (e) {
        // noop
      }
    });
  }
}

// ✅ ROLLBACK TEMPORAL: Exportar directamente sin ShippingProvider hasta resolver issues
export default ProductsSection;
