import React, { useState } from 'react'
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

import ProductImageGallery from './components/ProductImageGallery'
import SalesCharacteristics from './components/SalesCharacteristics'
import SaleConditions from './components/SaleConditions'
import TechnicalSpecifications from './components/TechnicalSpecifications'
import PurchaseActions from './components/PurchaseActions'
import ProductHeader from './components/ProductHeader'

const ProductPageView = ({
  product,
  onClose,
  onAddToCart,
  onBuyNow,
  isPageView = false,
}) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)

  if (!product) {
    return null
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
    // comision, // COMMENTED OUT: Commission functionality removed
    categoria,
    descripcion = 'Producto de alta calidad con excelentes características y garantía de satisfacción.',
  } = product

  const handleAddToCart = () => {
    if (onAddToCart) {
      onAddToCart(product)
    }
  }

  const handleBuyNow = () => {
    if (onBuyNow) {
      onBuyNow(product)
    }
  }
  return (
    <Box
      sx={{
        ...(isPageView
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
            }),
      }}
    >
      {' '}
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
      <Container maxWidth="xl" sx={{ py: 4, px: { xs: 2, sm: 3, md: 4 } }}>
        {/* SECCIÓN SUPERIOR - Información Principal */}
        <ProductHeader
          product={product}
          selectedImageIndex={selectedImageIndex}
          onImageSelect={setSelectedImageIndex}
          onAddToCart={handleAddToCart}
          onBuyNow={handleBuyNow}
        />{' '}
        {/* SECCIÓN INTERMEDIA - Características de Venta */}
        <Box sx={{ mt: 6 }}>
          <SalesCharacteristics product={product} />
        </Box>
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
