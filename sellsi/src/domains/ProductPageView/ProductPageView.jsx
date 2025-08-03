import React, { useState, useEffect, useCallback, Suspense, memo } from 'react'
// Si tienes un contexto de vista, importa aquí:
// import { useViewType } from '../../context/ViewTypeContext'

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
  CircularProgress,
  Breadcrumbs,
  Link,
  ThemeProvider,
  useTheme,
  useMediaQuery,
} from '@mui/material'
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
} from '@mui/icons-material'
import { useLocation } from 'react-router-dom'
import { showErrorToast, showCartSuccess } from '../../utils/toastHelpers'

// Lazy imports para componentes pesados - simplificados para evitar errores
const ProductImageGallery = React.lazy(() => 
  import('./components/ProductImageGallery').catch(() => ({ default: () => <div>Error al cargar galería</div> }))
)
const PurchaseActions = React.lazy(() => 
  import('./components/PurchaseActions').catch(() => ({ default: () => <div>Error al cargar acciones</div> }))
)
const ProductHeader = React.lazy(() => 
  import('./components/ProductHeader').catch(() => ({ default: () => <div>Error al cargar header</div> }))
)
const ProductShipping = React.lazy(() => 
  import('./components/ProductShipping').catch(() => ({ default: () => <div>Error al cargar shipping</div> }))
)
const LoadingOverlay = React.lazy(() => 
  import('../../shared/components/feedback/LoadingOverlay').catch(() => ({ default: () => <div>Cargando...</div> }))
)

// Import regular para skeleton (necesario para fallback)
import { ProductPageSkeleton } from './components/ProductPageSkeletons'
import { dashboardThemeCore } from '../../styles/dashboardThemeCore'
import { SPACING_BOTTOM_MAIN } from '../../styles/layoutSpacing'


// Componente memoizado para evitar re-renders innecesarios
const ProductPageView = memo(({
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
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const location = useLocation()
  
  // Hook para responsividad
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  // Mover useCallback ANTES de cualquier return condicional para seguir las reglas de los Hooks
  const handleAddToCart = useCallback((cartProduct) => {
    // Debug log removed
    // Verificar sesión antes de permitir agregar al carrito
    if (!isLoggedIn) {
      showErrorToast('Debes iniciar sesión para agregar productos al carrito', {
        icon: '🔒',
      })
      // Disparar evento para abrir Login modal
      const event = new CustomEvent('openLogin')
      window.dispatchEvent(event)
      return
    }
    if (onAddToCart) {
      // Si recibimos un producto formateado del PurchaseActions, usar ese
      // Si no, formatear con los datos básicos del producto
      onAddToCart(cartProduct || product)
      // Debug log removed
    }
  }, [isLoggedIn, onAddToCart, product])

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
            px: { xs: 0, md: 3 }, // Sin padding horizontal en móvil
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
            <Box sx={{ mb: 4, boxShadow: 'none', border: 'none', outline: 'none', backgroundImage: 'none' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
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
                <Typography variant="h4" fontWeight="600" color="black">
                </Typography>
              </Box>
              {/* Breadcrumbs responsivos */}
              <Box sx={{ 
                px: { xs: 2, md: 0 }, 
                mb: { xs: 1, md: 2 } 
              }}>
                <Breadcrumbs sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>
                  <Link
                    underline="hover"
                    color="inherit"
                    onClick={onGoHome}
                    sx={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 0.5 }}
                  >
                    <Home fontSize="small" />
                    Inicio
                  </Link>
                  <Link
                    underline="hover"
                    color="inherit"
                    onClick={onGoToMarketplace}
                    sx={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 0.5 }}
                  >
                    {fromMyProducts
                      ? <Inventory2Outlined fontSize="small" />
                      : <StorefrontOutlined fontSize="small" />}
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
    )
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
    descripcion = 'Producto de alta calidad con excelentes características y garantía de satisfacción.',
  } = product
  // Debug log removed

  return (
    <ThemeProvider theme={dashboardThemeCore}>
      <Box
        sx={{
          backgroundColor: 'background.default',
          pt: { xs: 1, md: 4 }, // Menos padding top en móvil
          px: { xs: 0, md: 3 }, // Sin padding horizontal en móvil
          pb: SPACING_BOTTOM_MAIN,
          width: '100%',
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
            mx: 'auto',
            width: '100%',
          }}
        >
          {/* 1. Breadcrumbs responsivos */}
          <Box sx={{ 
            px: { xs: 2, md: 0 }, 
            mb: { xs: 1, md: 2 },
            width: '100%' 
          }}>
            <Breadcrumbs sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>
              <Link
                underline="hover"
                color="inherit"
                onClick={onGoHome}
                sx={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 0.5 }}
              >
                <Home fontSize="small" />
                Inicio
              </Link>
              <Link
                underline="hover"
                color="inherit"
                onClick={onGoToMarketplace}
                sx={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 0.5 }}
              >
                {fromMyProducts
                  ? <Inventory2Outlined fontSize="small" />
                  : <StorefrontOutlined fontSize="small" />}
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
            <Suspense fallback={<CircularProgress />}>
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

          {/* 2.5. ProductShipping - Regiones de Despacho */}
          <Box sx={{ width: '100%' }}>
            <Suspense fallback={<CircularProgress />}>
              <ProductShipping
                product={product}
                isMobile={isMobile}
                isLoggedIn={isLoggedIn}
              />
            </Suspense>
          </Box>

          {/* 3. Descripción del Producto responsiva */}
          <Box sx={{ 
            px: { xs: 2, md: 0 }, 
            mt: { xs: 4, md: 6 }, 
            mb: 6,
            width: '100%' 
          }}>
            <Paper
              elevation={2}
              sx={{
                p: { xs: 3, sm: 4, md: 5 },
                borderRadius: 3,
                width: { xs: '100%', md: '70%' },
                maxWidth: '900px',
                textAlign: 'center',
                background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)',
                border: '1px solid #e2e8f0',
                position: 'relative',
                overflow: 'hidden',
                margin: '0 auto',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '4px',
                  background: 'linear-gradient(90deg, #1976d2, #42a5f5, #1976d2)',
                  backgroundSize: '200% 100%',
                  animation: 'shimmer 3s ease-in-out infinite',
                },
                '@keyframes shimmer': {
                  '0%': { backgroundPosition: '-200% 0' },
                  '100%': { backgroundPosition: '200% 0' },
                },
              }}
            >
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 700,
                  color: 'black',
                  mb: 3,
                  fontSize: { xs: '1.5rem', sm: '1.5rem', md: '1.5rem' },
                  position: 'relative',
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    bottom: -8,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '60px',
                    height: '3px',
                    background: 'linear-gradient(90deg, #1976d2, #42a5f5)',
                    borderRadius: '2px',
                  },
                }}
              >
                📋 Descripción del Producto
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  fontSize: { xs: '1rem', sm: '1.1rem', md: '1rem' },
                  lineHeight: 1.8,
                  color: '#000000ff',
                  textAlign: 'justify',
                  hyphens: 'auto',
                  wordBreak: 'break-word',
                  letterSpacing: '0.5px',
                  fontWeight: 400,
                  '&::first-letter': {
                    fontSize: '1.5em',
                    fontWeight: 700,
                    color: '#000000ff',
                    float: 'left',
                    lineHeight: 1,
                    marginRight: '1px',
                    marginTop: '2px',
                  },
                }}
              >
                {descripcion}
              </Typography>
            </Paper>
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  )
})

// Definir displayName para debugging
ProductPageView.displayName = 'ProductPageView'

export default ProductPageView
