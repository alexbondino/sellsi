import React from 'react'
import {
  Box,
  Container,
  Typography,
  Button,
  IconButton,
  Paper,
  Breadcrumbs,
  Link,
  CircularProgress,
} from '@mui/material'
import { ArrowBack, Home, StorefrontOutlined, Inventory2Outlined } from '@mui/icons-material'
import ProductPageView from '../ProductPageView/ProductPageView'
import { useTechnicalSpecs } from './hooks/useTechnicalSpecs'

/**
 * ============================================================================
 * COMPONENTE TECHNICALSPECS - FICHA TÉCNICA DE PRODUCTO
 * ============================================================================
 *
 * Componente UI puro para mostrar la ficha técnica de un producto
 * Toda la lógica de negocio está separada en el hook useTechnicalSpecs
 *
 * NAVEGACIÓN INTELIGENTE:
 * - Botón "Inicio": Navega a Home
 * - Botón "Marketplace": Navega al marketplace de origen (Marketplace/MarketplaceBuyer)
 * - Botón "Volver": Navega al marketplace de origen
 */
const TechnicalSpecs = () => {  const {
    product,
    loading,
    originRoute,
    isFromBuyer,
    fromMyProducts, // 🔍 Agregar el flag
    handleClose,
    handleGoHome,
    handleGoToMarketplace,
    handleAddToCart,
    handleBuyNow,
  } = useTechnicalSpecs()

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '50vh',
        }}
      >
        <CircularProgress color="primary" size={48} />
      </Box>
    )
  }

  if (!product) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper elevation={2} sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h5" color="error" gutterBottom>
            Producto no encontrado
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            El producto que buscas no existe o ha sido removido.
          </Typography>{' '}          <Button
            variant="contained"
            startIcon={<StorefrontOutlined />}
            onClick={handleGoToMarketplace}
          >
            {fromMyProducts ? 'Volver a Mis Productos' : 'Volver al Marketplace'}
          </Button>
        </Paper>
      </Container>
    )
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50' }}>
      {/* Header with navigation */}
      <Box
        sx={{
          bgcolor: 'white',
          borderBottom: '1px solid',
          borderColor: 'grey.200',
          py: 2,
        }}
      >
        <Container maxWidth="xl">
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              mb: 2,
            }}
          >
            {/* Back button */}            <Button
              startIcon={<ArrowBack />}
              onClick={handleClose}
              sx={{
                color: 'text.secondary',
                '&:hover': {
                  bgcolor: 'grey.100',
                },
              }}
            >
              {fromMyProducts ? 'Volver a Mis Productos' : 'Volver al Marketplace'}
            </Button>
          </Box>

          {/* Breadcrumbs */}
          <Breadcrumbs
            sx={{
              fontSize: '0.875rem',
              color: 'text.secondary',
            }}
          >
            {' '}
            <Link
              underline="hover"
              color="inherit"
              onClick={handleGoHome}
              sx={{
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
              }}
            >
              <Home fontSize="small" />
              Inicio
            </Link>{' '}            <Link
              underline="hover"
              color="inherit"
              onClick={handleGoToMarketplace}
              sx={{
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
              }}
            >
              {fromMyProducts ? <Inventory2Outlined fontSize="small" /> : <StorefrontOutlined fontSize="small" />}
              {fromMyProducts ? 'Mis Productos' : 'Marketplace'}
            </Link>
            <Typography color="primary" sx={{ fontWeight: 600 }}>
              {product.nombre}
            </Typography>
          </Breadcrumbs>
        </Container>
      </Box>{' '}
      {/* Product Page View */}
      <Box sx={{ pt: 0 }}>
        <ProductPageView
          product={product}
          onClose={handleClose}
          onAddToCart={handleAddToCart}
          onBuyNow={handleBuyNow}
          isOpen={true}
          isPageView={true} // Flag para indicar que es una vista de página completa
          loading={loading} // Pasar el estado de loading para activar skeletons
        />
      </Box>
    </Box>
  )
}

export default TechnicalSpecs
