import React, { useState } from 'react'
import { Box, Button, Container, Typography, Grid } from '@mui/material'
import ProductCard from '../ProductCard/ProductCard'
import { PRODUCTOS } from '../../../data/marketplace/products'

const ProductPageViewDemo = () => {
  const [selectedProduct, setSelectedProduct] = useState(null)

  const handleAddToCart = (product) => {
    console.log('Producto agregado al carrito:', product.nombre)
    alert(`${product.nombre} agregado al carrito!`)
  }

  const handleViewDetails = (product) => {
    console.log('Ver detalles del producto:', product.nombre)
  }
  // Tomar los primeros 6 productos para la demo
  const demoProducts = PRODUCTOS.slice(0, 6)

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" align="center" gutterBottom sx={{ mb: 4 }}>
        Demo - ProductPageView Integration
      </Typography>

      <Typography
        variant="body1"
        align="center"
        color="text.secondary"
        sx={{ mb: 4 }}
      >
        Haz clic en cualquier producto para ver la vista detallada con
        características de venta y especificaciones técnicas.
      </Typography>

      <Grid container spacing={3}>
        {demoProducts.map((producto, index) => (
          <Grid item xs={12} sm={6} md={4} lg={2} key={index}>
            <ProductCard
              producto={producto}
              onAddToCart={handleAddToCart}
              onViewDetails={handleViewDetails}
            />
          </Grid>
        ))}
      </Grid>

      <Box sx={{ mt: 6, p: 3, bgcolor: 'grey.100', borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom>
          Funcionalidades Implementadas:
        </Typography>
        <ul>
          <li>✅ Funcionalidad "Tipo de Venta" comentada/removida</li>
          <li>✅ ProductPageView con vista detallada completa</li>
          <li>✅ Generación automática de características de venta</li>
          <li>✅ Especificaciones técnicas dinámicas</li>
          <li>✅ Integración completa con ProductCard</li>
          <li>✅ Animaciones y transiciones suaves</li>
        </ul>
      </Box>
    </Container>
  )
}

export default ProductPageViewDemo
