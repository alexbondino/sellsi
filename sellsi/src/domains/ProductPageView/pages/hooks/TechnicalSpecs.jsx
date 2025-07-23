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
import ProductPageView from '../../ProductPageView'
import { useTechnicalSpecs } from './useTechnicalSpecs'

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
const TechnicalSpecs = ({ isLoggedIn = false }) => {
  // DEBUG: Log isLoggedIn prop on every render
  // ...log eliminado...
  // Debug log removed
  const {
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
  // Solo renderizar el layout principal de ProductPageView, sin header/breadcrumbs externos
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50' }}>
      <Box sx={{ pt: 0 }}>
        {loading ? (
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
        ) : !product ? (
          <Container maxWidth="md" sx={{ py: 4 }}>
            <Paper elevation={2} sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="h5" color="error" gutterBottom>
                Producto no encontrado
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                El producto que buscas no existe o ha sido removido.
              </Typography>
              <Button
                variant="contained"
                startIcon={<StorefrontOutlined />}
                onClick={handleGoToMarketplace}
              >
                {fromMyProducts ? 'Volver a Mis Productos' : 'Volver al Marketplace'}
              </Button>
            </Paper>
          </Container>
        ) : (
          <ProductPageView
            product={product}
            onClose={handleClose}
            onAddToCart={handleAddToCart}
            onBuyNow={handleBuyNow}
            isOpen={true}
            isPageView={true}
            loading={loading}
            isLoggedIn={isLoggedIn}
            onGoHome={handleGoHome}
            onGoToMarketplace={handleGoToMarketplace}
            fromMyProducts={fromMyProducts}
          />
        )}
      </Box>
    </Box>
  );
}

export default TechnicalSpecs
