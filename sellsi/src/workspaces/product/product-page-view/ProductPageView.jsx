import React, { useState, useEffect, useCallback, Suspense, memo } from 'react';
import { useLocation } from 'react-router-dom';
import { showErrorToast, showCartSuccess } from '../../../utils/toastHelpers';
import { useLayout } from '../../../infrastructure/providers/LayoutProvider';

// Imports principales optimizados (solo lo esencial)
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Paper,
  Rating,
  Chip,
  Divider,
  IconButton,
  // CircularProgress eliminado para reemplazo por skeletons
  Breadcrumbs,
  Link,
  ThemeProvider,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  ArrowBack,
  ShoppingCart,
  LocalShipping,
  Security,
  Assignment,
  CheckCircle,
  AttachMoney,
  Schedule,
  Inventory,
  Description,
  Home,
  StorefrontOutlined,
  Inventory2Outlined,
} from '@mui/icons-material';

// Lazy imports para componentes pesados - simplificados para evitar errores
const ProductImageGallery = React.lazy(() =>
  import('./components/ProductImageGallery').catch(() => ({
    default: () => <div>Error al cargar galería</div>,
  }))
);
const PurchaseActions = React.lazy(() =>
  import('./components/PurchaseActions').catch(() => ({
    default: () => <div>Error al cargar acciones</div>,
  }))
);
const ProductHeader = React.lazy(() =>
  import('./components/ProductHeader/index').catch(() => ({
    default: () => <div>Error al cargar header</div>,
  }))
);
const ProductShipping = React.lazy(() =>
  import('./components/ProductShipping').catch(() => ({
    default: () => <div>Error al cargar shipping</div>,
  }))
);
const ProductInfo = React.lazy(() =>
  import('./components/ProductInfo').catch(() => ({
    default: () => <div>Error al cargar información</div>,
  }))
);
const LoadingOverlay = React.lazy(() =>
  import('../../../shared/components/feedback/LoadingOverlay').catch(() => ({
    default: () => <div>Cargando...</div>,
  }))
);

// Import regular para skeleton (necesario para fallback)
import { ProductPageSkeleton } from './components/ProductPageSkeletons';
import { ProductHeaderSkeleton } from './components/skeletons/ProductHeaderSkeleton';
import { ProductInfoSkeleton } from './components/ProductPageSkeletons';
import { ProductShippingSkeleton } from './components/skeletons/ProductShippingSkeleton';
import { dashboardThemeCore } from '../../../styles/dashboardThemeCore';
import { SPACING_BOTTOM_MAIN } from '../../../styles/layoutSpacing';

// Componente memoizado para evitar re-renders innecesarios
const ProductPageView = memo(
  ({
    product,
    onClose,
    onAddToCart,
    isPageView = false,
    loading = false,
    isLoggedIn = false,
    fromMyProducts = false,
    isFromSupplierMarketplace = false,
    isSupplier = false,
    // Nuevos props para breadcrumbs
    onGoHome,
    onGoToMarketplace,
  }) => {
    // ...logs eliminados...
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const location = useLocation();

    // Hook para responsividad
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    // Hook para estado del sidebar
    const { sideBarCollapsed } = useLayout();

    // Mover useCallback ANTES de cualquier return condicional para seguir las reglas de los Hooks
    const handleAddToCart = useCallback(
      cartProduct => {
        // Debug log removed
        // Verificar sesión antes de permitir agregar al carrito
        if (!isLoggedIn) {
          showErrorToast(
            'Debes iniciar sesión para agregar productos al carrito',
            {
              icon: '🔒',
            }
          );
          // Disparar evento para abrir Login modal
          const event = new CustomEvent('openLogin');
          window.dispatchEvent(event);
          return;
        }
        if (onAddToCart) {
          // Si recibimos un producto formateado del PurchaseActions, usar ese
          // Si no, formatear con los datos básicos del producto
          onAddToCart(cartProduct || product);
          // Debug log removed
        }
      },
      [isLoggedIn, onAddToCart, product]
    );

    // DEBUG: Log product and loading state
    if (!product || loading) {
      // ...log eliminado...
      // Debug log removed
      return (
        <ThemeProvider theme={dashboardThemeCore}>
          <Box
            sx={{
              backgroundColor: 'background.default',
              pt: { xs: 1, md: 4 }, // Menos padding top en móvil
              px: { xs: 0.75, md: 3 }, // small mobile gutter
              pb: SPACING_BOTTOM_MAIN,
              width: '100%',
            }}
          >
            <Box
              sx={{
                // Estilos condicionales del container
                backgroundColor: { xs: 'transparent', md: 'white' },
                border: { xs: 'none', md: '1.5px solid #e0e0e0' },
                boxShadow: { xs: 'none', md: 6 },
                borderRadius: { xs: 0, md: 3 },
                p: { xs: 0, md: 3 },
                mb: { xs: 0, md: 6 },
                maxWidth: '1450px',
                mx: 'auto',
                width: '100%',
              }}
            >
              <Box
                sx={{
                  mb: 4,
                  boxShadow: 'none',
                  border: 'none',
                  outline: 'none',
                  backgroundImage: 'none',
                }}
              >
                <Box
                  sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}
                >
                  <Button
                    startIcon={<ArrowBack />}
                    onClick={onClose}
                    sx={{ textTransform: 'none' }}
                  >
                    {fromMyProducts
                      ? 'Volver a Mis Productos'
                      : isFromSupplierMarketplace
                      ? 'Volver a Marketplace'
                      : 'Volver al Marketplace'}
                  </Button>
                  <Typography
                    variant="h4"
                    fontWeight="600"
                    color="black"
                  ></Typography>
                </Box>
                {/* Breadcrumbs responsivos */}
                <Box
                  sx={{
                    px: { xs: 0.75, md: 0 },
                    mb: { xs: 1, md: 2 },
                  }}
                >
                  <Breadcrumbs
                    sx={{ fontSize: '0.875rem', color: 'text.secondary' }}
                  >
                    <Link
                      underline="hover"
                      color="inherit"
                      onClick={onGoHome}
                      sx={{
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                      }}
                    >
                      <Home fontSize="small" />
                      Inicio
                    </Link>
                    <Link
                      underline="hover"
                      color="inherit"
                      onClick={onGoToMarketplace}
                      sx={{
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                      }}
                    >
                      {fromMyProducts ? (
                        <Inventory2Outlined fontSize="small" />
                      ) : (
                        <StorefrontOutlined fontSize="small" />
                      )}
                      {fromMyProducts
                        ? 'Mis Productos'
                        : isFromSupplierMarketplace
                        ? 'Marketplace'
                        : 'Marketplace'}
                    </Link>
                    {product && (
                      <Typography color="black" sx={{ fontWeight: 600 }}>
                        {product.nombre}
                      </Typography>
                    )}
                  </Breadcrumbs>
                </Box>
              </Box>
              <Container maxWidth="xl">
                <ProductPageSkeleton />
              </Container>
            </Box>
          </Box>
        </ThemeProvider>
      );
    }
    const {
      nombre,
      imagen,
      precio,
      precioOriginal,
      descuento,
      rating,
      ventas,
      stock,
      categoria,
    } = product;
    // Debug log removed

    return (
      <ThemeProvider theme={dashboardThemeCore}>
        <Box
          sx={{
            backgroundColor: 'background.default',
            pt: { xs: 1, md: 4 },
            pb: SPACING_BOTTOM_MAIN,
            // ✅ Ancho calculado descontando el sidebar
            width: {
              xs: '100%',
              md: sideBarCollapsed ? 'calc(100% - 80px)' : 'calc(100% - 240px)',
            },
            // ✅ Margen izquierdo = ancho del sidebar
            ml: {
              xs: 0,
              md: sideBarCollapsed ? '80px' : '240px',
            },
            // ✅ Padding horizontal simétrico
            px: { xs: 0.75, md: 3 },
            transition: 'all 0.3s ease',
          }}
        >
          {/* Paper padre con estilos condicionales */}
          <Box
            sx={{
              // Estilos condicionales del container
              backgroundColor: { xs: 'transparent', md: 'white' },
              border: { xs: 'none', md: '1.5px solid #e0e0e0' },
              boxShadow: { xs: 'none', md: 6 },
              borderRadius: { xs: 0, md: 3 },
              p: { xs: 0, md: 3 },
              mb: { xs: 0, md: 6 },
              maxWidth: '1450px',
              mx: 'auto', // ✅ Centrado en el espacio disponible
              width: '100%',
            }}
          >
            {/* 1. Breadcrumbs responsivos */}
            <Box
              sx={{
                px: { xs: 0.75, md: 0 },
                mb: { xs: 1, md: 2 },
                width: '100%',
              }}
            >
              <Breadcrumbs
                sx={{ fontSize: '0.875rem', color: 'text.secondary' }}
              >
                <Link
                  underline="hover"
                  color="inherit"
                  onClick={onGoHome}
                  sx={{
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                  }}
                >
                  <Home fontSize="small" />
                  Inicio
                </Link>
                <Link
                  underline="hover"
                  color="inherit"
                  onClick={onGoToMarketplace}
                  sx={{
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                  }}
                >
                  {fromMyProducts ? (
                    <Inventory2Outlined fontSize="small" />
                  ) : (
                    <StorefrontOutlined fontSize="small" />
                  )}
                  {fromMyProducts
                    ? 'Mis Productos'
                    : isFromSupplierMarketplace
                    ? 'Marketplace'
                    : 'Marketplace'}
                </Link>
                {product && (
                  <Typography color="primary.main" sx={{ fontWeight: 600 }}>
                    {isMobile ? 'Ficha Técnica' : product.nombre}
                  </Typography>
                )}
              </Breadcrumbs>
            </Box>

            {/* 2. ProductHeader con prop de responsividad */}
            <Box sx={{ width: '100%' }}>
              <Suspense
                fallback={
                  <ProductHeaderSkeleton
                    isMobile={isMobile}
                    showTiers={!!product?.priceTiers?.length}
                    showPurchaseActions={
                      !product?.fromMyProducts &&
                      !product?.isFromSupplierMarketplace &&
                      !product?.isSupplier
                    }
                  />
                }
              >
                <ProductHeader
                  product={product}
                  selectedImageIndex={selectedImageIndex}
                  onImageSelect={setSelectedImageIndex}
                  onAddToCart={handleAddToCart}
                  isLoggedIn={isLoggedIn}
                  fromMyProducts={fromMyProducts}
                  isMobile={isMobile}
                />
              </Suspense>
            </Box>

            {/* 2.5. Descripción del Producto */}
            <Suspense fallback={<ProductInfoSkeleton />}>
              <ProductInfo product={product} isMobile={isMobile} />
            </Suspense>

            {/* 3. ProductShipping - Regiones de Despacho */}
            {isLoggedIn && (
              <Box sx={{ width: '100%' }}>
                <Suspense fallback={<ProductShippingSkeleton />}>
                  <ProductShipping
                    product={product}
                    isMobile={isMobile}
                    isLoggedIn={isLoggedIn}
                  />
                </Suspense>
              </Box>
            )}
          </Box>
        </Box>
      </ThemeProvider>
    );
  }
);

// Definir displayName para debugging
ProductPageView.displayName = 'ProductPageView';

export default ProductPageView;
