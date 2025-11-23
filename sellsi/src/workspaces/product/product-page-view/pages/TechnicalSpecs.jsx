import React from 'react'
import { Box, Container, Typography, Button, Paper } from '@mui/material'
import { StorefrontOutlined } from '@mui/icons-material'
import ProductPageView from '../ProductPageView.jsx'
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
const TechnicalSpecs = ({ isLoggedIn = false }) => {
  const {
    product,
    loading,
    error, // 🆕 Agregar estado de error
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
          // 🆕 Mostrar skeleton mientras carga
          <Container maxWidth="md" sx={{ py: 4 }}>
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              minHeight: '50vh' 
            }}>
              {/* Aquí podrías usar un skeleton más elaborado */}
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
                  Cargando producto...
                </Typography>
                <Box sx={{ 
                  width: 40, 
                  height: 40, 
                  border: '3px solid #f3f3f3', 
                  borderTop: '3px solid #1976d2', 
                  borderRadius: '50%', 
                  animation: 'spin 1s linear infinite',
                  mx: 'auto',
                  '@keyframes spin': {
                    '0%': { transform: 'rotate(0deg)' },
                    '100%': { transform: 'rotate(360deg)' },
                  }
                }} />
              </Box>
            </Box>
          </Container>
        ) : error || !product ? (
          // 🆕 Solo mostrar error después de terminar de cargar
          <Container maxWidth="md" sx={{ py: 4 }}>
            <Paper elevation={2} sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="h5" color="error" gutterBottom>
                {error || 'Producto no encontrado'}
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                {error === 'ID de producto inválido en la URL' 
                  ? 'La URL del producto no es válida.'
                  : error === 'No se proporcionó un slug de producto'
                  ? 'La URL del producto está incompleta.'
                  : 'El producto que buscas no existe o ha sido removido.'}
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
