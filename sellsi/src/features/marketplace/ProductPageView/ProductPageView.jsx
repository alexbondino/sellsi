import React, { useState, useEffect, useCallback } from 'react'
// Si tienes un contexto de vista, importa aquí:
// import { useViewType } from '../../context/ViewTypeContext'
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
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  CircularProgress,
  Breadcrumbs,
  Link,
  ThemeProvider,
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
import { toast } from 'react-hot-toast'
import { useLocation } from 'react-router-dom'

import ProductImageGallery from './components/ProductImageGallery'
// import SalesCharacteristics from './components/SalesCharacteristics'
import SaleConditions from './components/SaleConditions'
import TechnicalSpecifications from './components/TechnicalSpecifications'
import PurchaseActions from './components/PurchaseActions'
import ProductHeader from './components/ProductHeader'
import LoadingOverlay from '../../ui/LoadingOverlay'
import { ProductPageSkeleton } from './components/ProductPageSkeletons'
import { dashboardThemeCore } from '../../../styles/dashboardThemeCore'


const ProductPageView = ({
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

  // Mover useCallback ANTES de cualquier return condicional para seguir las reglas de los Hooks
  const handleAddToCart = useCallback((cartProduct) => {
    // Debug log removed
    // Verificar sesión antes de permitir agregar al carrito
    if (!isLoggedIn) {
      toast.error('Debes iniciar sesión para agregar productos al carrito', {
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
      // Mostrar toast de confirmación aquí
      toast.success(
        `Agregado al carrito: ${(cartProduct || product)?.name || product?.nombre}`,
        {
          icon: '✅',
        }
      )
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
            pt: { xs: 2, md: 4 },
            px: 3,
            pb: 12,
            width: '100%',
          }}
        >
          <Box
            sx={{
              backgroundColor: 'white',
              maxWidth: '1450px',
              mx: 'auto',
              p: 3,
              mb: 6,
              border: '1.5px solid #e0e0e0',
              boxShadow: 6,
              borderRadius: 3,
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
          pt: { xs: 2, md: 4 },
          px: 3,
          pb: 12,
          width: '100%',
        }}
      >
        {/* Header y breadcrumbs ahora SIEMPRE dentro del Paper, arriba del contenido */}
        <Box
          sx={{
            backgroundColor: 'white',
            maxWidth: '1450px',
            mx: 'auto',
            p: 3,
            mb: 6,
            border: '1.5px solid #e0e0e0',
            boxShadow: 6,
            borderRadius: 3,
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
          <Grid container spacing={3} sx={{ boxShadow: 'none', border: 'none', outline: 'none', backgroundImage: 'none' }}>
          {/* Columna principal */}
          <Grid item xs={12} lg={8} sx={{ boxShadow: 'none', border: 'none', outline: 'none', backgroundImage: 'none' }}>
            <Paper
              sx={{
                p: 0,
                width: '100%',
                minWidth: '100%',
                maxWidth: '100%',
                boxSizing: 'border-box',
                boxShadow: 'none',
                border: 'none',
                outline: 'none',
                backgroundImage: 'none',
              }}
              elevation={0}
              square
            >
              {/* Galería e info principal */}
              <ProductHeader
                product={product}
                selectedImageIndex={selectedImageIndex}
                onImageSelect={setSelectedImageIndex}
                onAddToCart={handleAddToCart}
                isLoggedIn={isLoggedIn}
                fromMyProducts={fromMyProducts}
              />
              {/* Condiciones de venta */}
              <Box sx={{ mt: 6 }}>
                <SaleConditions product={product} />
              </Box>
              {/* Especificaciones técnicas */}
              <Box sx={{ mt: 6, mb: 4 }}>
                <TechnicalSpecifications product={product} />
              </Box>
            </Paper>
          </Grid>
          {/* Aquí podrías agregar una columna lateral si la necesitas */}
        </Grid>
        </Box>
    </Box>
    </ThemeProvider>
  )
}

export default ProductPageView
