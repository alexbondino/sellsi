import React from 'react'
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Avatar,
  Chip,
} from '@mui/material'
import { LocalShipping, Security, Assignment } from '@mui/icons-material'

import ProductImageGallery from './ProductImageGallery'
import PurchaseActions from './PurchaseActions'
import PriceDisplay from '../../../shared/PriceDisplay'
import StockIndicator from '../../../shared/StockIndicator'

const ProductHeader = ({
  product,
  selectedImageIndex,
  onImageSelect,
  onAddToCart,
  onBuyNow,
}) => {
  const {
    nombre,
    proveedor,
    imagen,
    precio,
    /* COMMENTED OUT: Discount and rating variables */
    // precioOriginal,
    // descuento,
    // rating,
    // ventas,
    stock,
    compraMinima,
    descripcion = 'Producto de alta calidad con excelentes características y garantía de satisfacción.',
  } = product
  /* COMMENTED OUT: Discount calculation */
  // const hasDiscount = precioOriginal && precioOriginal > precio
  return (
    <Grid container spacing={12} sx={{ alignItems: 'flex-end' }}>
      {' '}
      {/* Imagen del Producto */}
      <Grid
        item
        xs={12}
        sm={6}
        md={6}
        lg={5}
        sx={{ display: 'flex', justifyContent: 'right' }}
      >
        <Box
          sx={{
            display: 'flex', // Kept for alignItems to work effectively
            alignItems: 'center', // To vertically center ProductImageGallery within this Box
            // justifyContent: 'center', // This is now handled by the parent Grid item
            // width: '100%', // Removed to allow the Box to be sized by its content (ProductImageGallery)
            minHeight: '600px',
            ml: { xs: 0, sm: 2, md: 0, lg: 32, xl: 28 }, // Adjust margin for smaller screens
            p: { xs: 1, sm: 2 },
          }}
        >
          <ProductImageGallery
            mainImage={imagen}
            selectedIndex={selectedImageIndex}
            onImageSelect={onImageSelect}
            productName={nombre}
          />
        </Box>
      </Grid>
      {/* Información del Producto */}
      <Grid
        item
        xs={12}
        sm={6}
        md={6}
        lg={7}
        sx={{ display: 'flex', justifyContent: 'center' }}
      >
        <Box
          sx={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start', // Keep original alignment for product info
            alignItems: 'center', // This centers the block of text content
            textAlign: 'center', // This centers the text itself if it wraps
            px: { xs: 2, sm: 2, md: -5 }, // Horizontal padding for better spacing
          }}
        >
          {/* Nombre del Producto */}{' '}
          <Typography
            variant="h3"
            sx={{
              fontWeight: 700,
              color: 'text.primary',
              mb: 2,
              lineHeight: 1.2,
            }}
          >
            {' '}
            {nombre}{' '}
          </Typography>
          {/* Nombre del Proveedor */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Avatar
              sx={{
                width: 24,
                height: 24,
                mr: 1,
                fontSize: '0.75rem',
              }}
            >
              {proveedor?.charAt(0)}
            </Avatar>
            <Chip
              label={proveedor}
              size="small"
              variant="outlined"
              color="primary"
            />{' '}
          </Box>{' '}
          {/* Compra mínima */}
          <Typography
            variant="body1"
            sx={{
              mb: 3,
              fontSize: 16,
              fontWeight: 500,
              color: 'text.secondary',
            }}
          >
            Compra mínima: {compraMinima} unidades
          </Typography>{' '}
          {/* Precios */}
          <PriceDisplay
            price={precio}
            showRange={true}
            variant="h2"
            sx={{ mb: 3 }}
          />
          {/* Descripción */}
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ mb: 4, lineHeight: 1.6 }}
          >
            {descripcion}
          </Typography>{' '}
          {/* Stock */}
          <StockIndicator stock={stock} showUnits={true} sx={{ mb: 4 }} />{' '}
          {/* Botones de Compra */}
          <PurchaseActions
            onAddToCart={onAddToCart}
            onBuyNow={onBuyNow}
            stock={stock}
          />
        </Box>
      </Grid>
    </Grid>
  )
}

export default ProductHeader
