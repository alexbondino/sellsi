// Ô£à EDITAR AQU├ì PARA:
// - Cambiar dise├▒o del t├¡tulo y contador
// - Modificar grid responsive de productos
// - Ajustar mensaje de "no encontrados"
// - Cambiar espaciado y m├írgenes del contenido

// ­ƒöù CONTIENE:
// - T├¡tulo din├ímico seg├║n secci├│n
// - Contador de productos
// - Grid de ProductCard
// - Estado vac├¡o con bot├│n "Limpiar filtros"

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
import { scrollManagerAntiRebote } from '../../../../shared/utils/scrollManagerAntiRebote'; // Ô£à Nuevo sistema anti-rebote
import { FeatureFlags } from '../../../supplier/shared-utils/featureFlags.js';
import { ProductCardSkeletonGrid } from '../../../../shared/components/display/product-card/ProductCardSkeleton';
import ProductsSectionView from './ProductsSection/ProductsSectionView';
import { getOrFetchManyMainThumbnails } from '../../../../services/phase1ETAGThumbnailService.js';

/**
 * Componente que maneja la secci├│n de productos, t├¡tulo y grid
 * Ô£à DESACOPLADO: Layout est├ítico independiente del estado de SearchBar
 */
// Ô£à MEJORA DE RENDIMIENTO: Memoizaci├│n del componente
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
        // ✅ MOBILE FIX: Ajustar padding-top para compensar search bar fija
        // SearchBar está en top: { xs: 45, md: 64 } + CategoryNavigation
        pt: { 
          xs: isProviderView ? '10px' : '40px', 
          sm: isProviderView ? '10px' : '50px', 
          md: '50px',
          lg: '90px', // Desktop: espacio original restaurado
          xl: '90px'  // Desktop XL: espacio original restaurado
        },
        mt: { xs: 0, sm: 0, md: 0 }, // ✅ MOBILE FIX: Eliminar margin negativo que causaba overlap
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

    // Ô£à MEJORA DE RENDIMIENTO: Memoizaci├│n de estilos del contenedor interno
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

    // Ô£à MEJORA DE RENDIMIENTO: Memoizaci├│n de estilos del grid
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
        xs: 2, // ✅ MOBILE FIX: Aumentar gap para mejor separación (16px)
        sm: 2.5, // ✅ MOBILE FIX: Gap mejorado para sm (20px)
        md: productGridGaps.md,
        lg: productGridGaps.lg,
        xl: productGridGaps.xl,
      },
      width: '100%',
      justifyItems: 'center',
    };

    // Ô£à MEJORA DE RENDIMIENTO: Memoizaci├│n de estilos de las tarjetas
    // ✅ Cards ocupan 100% del ancho disponible en el grid para adaptarse responsivamente
    const cardContainerStyles = {
      width: '100%', // Usar 100% en todos los breakpoints para que se adapte al grid
      maxWidth: { xs: '100%', sm: '100%', md: 240, lg: 320, xl: 340 }, // Límites máximos opcionales
    };

    // Ô£à MEJORA DE RENDIMIENTO: Memoizaci├│n del t├¡tulo de secci├│n
    const sectionTitle = React.useMemo(() => {
      // Si hay filtro de región activo, mostrar título dinámico
      const activeRegion = filtros?.shippingRegions;
      
      if (activeRegion && !isProviderView) {
        // Mapeo de regiones con números romanos
        const regionLabels = {
          'arica-parinacota': 'XV Región',
          'tarapaca': 'I Región',
          'antofagasta': 'II Región',
          'atacama': 'III Región',
          'coquimbo': 'IV Región',
          'valparaiso': 'V Región',
          'metropolitana': 'Región Metropolitana',
          'ohiggins': 'VI Región',
          'maule': 'VII Región',
          'nuble': 'XVI Región',
          'biobio': 'VIII Región',
          'araucania': 'IX Región',
          'los-rios': 'XIV Región',
          'los-lagos': 'X Región',
          'aysen': 'XI Región',
          'magallanes': 'XII Región',
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
            Productos {regionLabel}
          </>
        );
      }
      
      if (isProviderView) {
        return (
          <>
            <BusinessIcon
              sx={{
                color: '#2E52B2',
                verticalAlign: 'middle',
                fontSize: { xs: 24, md: 32 },
                mr: 1,
              }}
            />
            <span style={{ color: '#2E52B2' }}>Proveedores Disponibles</span>
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
              <span style={{ color: '#2E52B2' }}>Nuevos Productos</span>
            </>
          );
        case 'ofertas':
          return '­ƒöÑ Ofertas Destacadas';
        case 'topVentas':
          return 'Ô¡É Top Ventas';
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

    // Ô£à CALCULAR PROVEEDORES ├ÜNICOS SI isProviderView
    // totalProveedores eliminado (reemplazado por providersCount del hook)

    // Ô£à OPTIMIZACI├ôN CR├ìTICA: Solo recalcular cuando productosOrdenados realmente cambie
    // (Movido arriba antes de cualquier uso para evitar ReferenceError por TDZ)
    // Derivaci├│n ahora a trav├®s del hook (fase2)
    const { items: derivedItems, providersCount } = useProductsDerivation(
      productosOrdenados,
      { providerView: isProviderView }
    );

    // Ô£à FIX: Memoizar correctamente derivedItems y aplicar filtro 'nuevos'
    // Si la secci├│n activa es 'nuevos' (buyer view), mostramos solo productos recientes seg├║n createdAt
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

    // ­ƒÜÇ BATCHING THUMBNAILS: limitar cantidad de ProductCard montadas simult├íneamente para reducir r├ífagas de fetch
    // batching ahora dentro del hook progressive
    // Ô£à MEJORA DE RENDIMIENTO: Memoizaci├│n del handler de volver (solo dependencias necesarias)
    const handleBackClick = React.useCallback(() => {
      setSeccionActiva('todos');
    }, [setSeccionActiva]);
    // Ô£à SISTEMA H├ìBRIDO RESPONSIVO: Infinite Scroll + Paginaci├│n
    const theme = useTheme();
    const isXs = useMediaQuery(theme.breakpoints.only('xs'));
    const isSm = useMediaQuery(theme.breakpoints.only('sm'));
    const isMd = useMediaQuery(theme.breakpoints.only('md'));
    const isLg = useMediaQuery(theme.breakpoints.only('lg'));
    const isXl = useMediaQuery(theme.breakpoints.up('xl'));
    // Ô£à VALORES RESPONSIVOS CON CARGA PROGRESIVA: Adaptan seg├║n el tama├▒o de pantalla
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

    // Progressive hook (remplaza l├│gica anterior de paginaci├│n + infinite + batching)
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

    // Ô£à NUEVO: Sistema de prioridades para im├ígenes (primeras 2 filas = fetchpriority="high")
    const gridPriority = useGridPriority(renderItems, {
      isXs,
      isSm,
      isMd,
      isLg,
      isXl,
    });
    const { getPriority, debugInfo } = gridPriority;

    // Debug info removed for production cleanliness
    // Componente de paginaci├│n responsivo
    const PaginationComponent = React.useMemo(() => {
      if (totalPages <= 1) return null;

      // Ô£à RESPONSIVO: Menos botones en m├│vil, m├ís en desktop
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
            gap: { xs: 0.5, sm: 1 }, // Ô£à RESPONSIVO: Gap m├ís peque├▒o en m├│vil
            py: 3,
            flexWrap: 'wrap', // Ô£à RESPONSIVO: Permitir wrap en pantallas muy peque├▒as
          }}
          role="navigation"
          aria-label="Paginaci├│n de productos"
        >
          {/* Bot├│n Anterior */}
          <Button
            variant="outlined"
            disabled={currentPage === 1}
            onClick={() => handlePageChange(currentPage - 1)}
            sx={{
              minWidth: 'auto',
              px: { xs: 1, sm: 2 }, // Ô£à RESPONSIVO: Padding m├ís peque├▒o en m├│vil
              fontSize: { xs: '0.75rem', sm: '0.875rem' }, // Ô£à RESPONSIVO: Texto m├ís peque├▒o en m├│vil
            }}
            aria-label="P├ígina anterior"
          >
            {isXs ? 'ÔÇ╣' : 'ÔÇ╣ Anterior'}
          </Button>{' '}
          {/* N├║meros de p├ígina */}
          {!isXs && startPage > 1 && (
            <>
              <Button
                variant={1 === currentPage ? 'contained' : 'outlined'}
                onClick={() => handlePageChange(1)}
                sx={{ minWidth: { xs: 32, sm: 40 } }}
                aria-label="Ir a p├ígina 1"
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
                minWidth: { xs: 32, sm: 40 }, // Ô£à RESPONSIVO: Botones m├ís peque├▒os en m├│vil
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
              }}
              aria-label={`Ir a p├ígina ${page}`}
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
                aria-label={`Ir a p├ígina ${totalPages}`}
                aria-current={currentPage === totalPages ? 'page' : undefined}
              >
                {totalPages}
              </Button>
            </>
          )}
          {/* Bot├│n Siguiente */}
          <Button
            variant="outlined"
            disabled={currentPage === totalPages}
            onClick={() => handlePageChange(currentPage + 1)}
            sx={{
              minWidth: 'auto',
              px: { xs: 1, sm: 2 },
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
            }}
            aria-label="P├ígina siguiente"
          >
            {isXs ? 'ÔÇ║' : 'Siguiente ÔÇ║'}
          </Button>
          {/* Info de p├ígina - Solo en pantallas medianas y grandes */}
          {!isXs && (
            <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
              P├ígina {currentPage} de {totalPages}
            </Typography>
          )}
        </Box>
      );
    }, [currentPage, totalPages, handlePageChange, isXs, isSm]);

    // Ô£à RESPONSIVO: Actualizar productos visibles cuando cambia el breakpoint
    // (Reseteo visible ahora lo maneja el hook)

    // Ô£à SCROLL TO TOP: Estado y funci├│n para el FAB
    const [showScrollTop, setShowScrollTop] = React.useState(false);

    const scrollToTop = React.useCallback(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, []);

    // Ô£à SCROLL TO TOP: Mostrar/ocultar FAB usando ScrollManager unificado
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
      getPriority, // Ô£à Funci├│n para determinar prioridad de imagen por ├¡ndice
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

// Ô£à MEJORA DE RENDIMIENTO: DisplayName para debugging
ProductsSection.displayName = 'ProductsSection';

// Prefetch inicial sencillo (warm thumbnails) ÔÇô se hace fuera de render para no afectar SSR hipot├®tico
// NOTA: Simple guard to ensure side effect only in browser
if (typeof window !== 'undefined' && FeatureFlags.FEATURE_PHASE1_THUMBS) {
  // Micro cola para evitar saturar inmediatamente; se puede mejorar con observers
  // ­ƒøí´©Å SAFARI FIX: Usar window.requestIdleCallback para evitar ReferenceError
  if (window.requestIdleCallback) {
    window.requestIdleCallback(() => {
      try {
        // Buscar un contenedor de productos ya montado (heur├¡stica simple)
        // La l├│gica real ideal estar├¡a dentro de un effect cuando se conocen los IDs iniciales.
      } catch (e) {
        // noop
      }
    });
  }
}

// Ô£à ROLLBACK TEMPORAL: Exportar directamente sin ShippingProvider hasta resolver issues
export default ProductsSection;
