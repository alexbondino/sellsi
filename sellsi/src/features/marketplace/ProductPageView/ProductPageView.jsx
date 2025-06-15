import React, { useState, useEffect } from 'react'
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
} from '@mui/icons-material'
import { toast } from 'react-hot-toast'

import ProductImageGallery from './components/ProductImageGallery'
// import SalesCharacteristics from './components/SalesCharacteristics'
import SaleConditions from './components/SaleConditions'
import TechnicalSpecifications from './components/TechnicalSpecifications'
import PurchaseActions from './components/PurchaseActions'
import ProductHeader from './components/ProductHeader'
import LoadingOverlay from '../../ui/LoadingOverlay'
import { ProductPageSkeleton } from './components/ProductPageSkeletons'
import MarketplaceTopBar from '../../layout/MarketplaceTopBar'

const ProductPageView = ({
  product,
  onClose,
  onAddToCart,
  isPageView = false,
  loading = false,
}) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)

  // Check user session
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  useEffect(() => {
    const checkSession = () => {
      // Verificar localStorage (nueva lógica)
      const userId = localStorage.getItem('user_id')
      const accountType = localStorage.getItem('account_type') // Verificar también las claves antiguas por compatibilidad
      const supplierid = localStorage.getItem('supplierid')
      const sellerid = localStorage.getItem('sellerid')

      const hasSession = !!(userId || supplierid || sellerid)
      setIsLoggedIn(hasSession)
    }

    checkSession()

    // Listen for storage changes (login/logout events)
    const handleStorageChange = () => {
      checkSession()
    }

    window.addEventListener('storage', handleStorageChange)
    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [])

  if (!product || loading) {
    return (
      <Box
        sx={
          isPageView
            ? {
                // Estilos para vista de página completa
                position: 'relative',
                width: '100%',
                minHeight: '100vh',
                bgcolor: 'background.default',
              }
            : {
                // Estilos para modal overlay
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                bgcolor: 'background.default',
                zIndex: 1400,
                overflow: 'auto',
                transform: 'translateX(0)',
                transition: 'transform 0.3s ease-in-out',
              }
        }
      >
        {/* Header with back button - solo para modal */}
        {!isPageView && (
          <Box
            sx={{
              position: 'sticky',
              top: 0,
              bgcolor: 'white',
              borderBottom: '1px solid #e0e0e0',
              zIndex: 10,
              py: 2,
            }}
          >
            <Container maxWidth="xl">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <IconButton onClick={onClose} sx={{ color: 'primary.main' }}>
                  <ArrowBack />
                </IconButton>
                <Typography variant="h6" color="text.primary">
                  Detalles del Producto
                </Typography>
              </Box>
            </Container>
          </Box>
        )}

        <Container maxWidth="xl">
          <ProductPageSkeleton />
        </Container>
      </Box>
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

  const handleAddToCart = (cartProduct) => {
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
        `Agregado al carrito: ${(cartProduct || product).name || nombre}`,
        {
          icon: '✅',
        }
      )
    }
  }
  return (
    <Box
      sx={
        isPageView
          ? {
              // Estilos para vista de página completa
              position: 'relative',
              width: '100%',
              minHeight: '100vh',
              bgcolor: 'background.default',
            }
          : {
              // Estilos para modal overlay
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              bgcolor: 'background.default',
              zIndex: 1400,
              overflow: 'auto',
              transform: 'translateX(0)',
              transition: 'transform 0.3s ease-in-out',
            }
      }
    >
      {/* MarketplaceTopBar - Solo si está logueado y es vista de página */}
      {isPageView && isLoggedIn && <MarketplaceTopBar />}{' '}
      {/* Header with back button - solo para modal */}
      {!isPageView && (
        <Box
          sx={{
            position: 'sticky',
            top: 0,
            bgcolor: 'white',
            borderBottom: '1px solid #e0e0e0',
            zIndex: 10,
            py: 2,
          }}
        >
          <Container maxWidth="xl">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <IconButton onClick={onClose} sx={{ color: 'primary.main' }}>
                <ArrowBack />
              </IconButton>
              <Typography variant="h6" color="text.primary">
                Detalles del Producto
              </Typography>
            </Box>
          </Container>
        </Box>
      )}
      <Container
        maxWidth="xl"
        sx={{
          py: 4,
          px: { xs: 2, sm: 3, md: 4 },
          // Añadir margen superior si se muestra el TopBar
          pt: isPageView && isLoggedIn ? { xs: 12, md: 14 } : 4,
        }}
      >
        {/* SECCIÓN SUPERIOR - Información Principal */}{' '}
        <ProductHeader
          product={product}
          selectedImageIndex={selectedImageIndex}
          onImageSelect={setSelectedImageIndex}
          onAddToCart={handleAddToCart}
          isLoggedIn={isLoggedIn}
        />{' '}
        {/* SECCIÓN INTERMEDIA - Características de Venta */}
        {/* <Box sx={{ mt: 6 }}>
          <SalesCharacteristics product={product} />
        </Box> */}
        {/* SECCIÓN DE CONDICIONES DE VENTA */}
        <Box sx={{ mt: 6 }}>
          <SaleConditions product={product} />
        </Box>
        {/* SECCIÓN INFERIOR - Especificaciones Técnicas */}
        <Box sx={{ mt: 6, mb: 4 }}>
          <TechnicalSpecifications product={product} />
        </Box>
      </Container>
    </Box>
  )
}

export default ProductPageView
