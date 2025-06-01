import React from 'react'
import {
  Box,
  Typography,
  Grid,
  Rating,
  Chip,
  Card,
  CardContent,
} from '@mui/material'
import { LocalShipping, Security, Assignment } from '@mui/icons-material'

import ProductImageGallery from './ProductImageGallery'
import PurchaseActions from './PurchaseActions'

const ProductHeader = ({
  product,
  selectedImageIndex,
  onImageSelect,
  onAddToCart,
  onBuyNow,
}) => {
  const {
    nombre,
    imagen,
    precio,
    precioOriginal,
    descuento,
    rating,
    ventas,
    stock,
    descripcion = 'Producto de alta calidad con excelentes características y garantía de satisfacción.',
  } = product
  const hasDiscount = precioOriginal && precioOriginal > precio
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
          {/* Nombre del Producto */}
          <Typography
            variant="h3"
            sx={{
              fontWeight: 700,
              color: 'text.primary',
              mb: 2,
              lineHeight: 1.2,
            }}
          >
            {nombre}
          </Typography>
          {/* Rating y Ventas */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Rating value={rating} readOnly precision={0.1} />
              <Typography variant="body1" color="text.secondary">
                ({rating})
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              {ventas} vendidos
            </Typography>
          </Box>
          {/* Precios */}
          <Box sx={{ mb: 3 }}>
            {hasDiscount && (
              <Box
                sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    textDecoration: 'line-through',
                    color: 'text.secondary',
                  }}
                >
                  ${precioOriginal.toLocaleString('es-CL')}
                </Typography>
                <Chip
                  label={`-${descuento}%`}
                  color="error"
                  size="small"
                  sx={{ fontWeight: 'bold' }}
                />
              </Box>
            )}
            <Typography
              variant="h2"
              sx={{
                fontWeight: 700,
                color: 'primary.main',
                mb: 1,
              }}
            >
              ${precio.toLocaleString('es-CL')}
            </Typography>
          </Box>
          {/* Descripción */}
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ mb: 4, lineHeight: 1.6 }}
          >
            {descripcion}
          </Typography>
          {/* Stock */}
          <Box sx={{ mb: 4 }}>
            <Typography
              variant="body2"
              color={stock < 10 ? 'error.main' : 'success.main'}
              sx={{ fontWeight: 600 }}
            >
              {stock < 10
                ? `¡Solo ${stock} disponibles!`
                : `Stock disponible: ${stock} unidades`}
            </Typography>
          </Box>{' '}
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
