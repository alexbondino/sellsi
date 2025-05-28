import React from 'react'
import { Grid, Box, Typography } from '@mui/material' // ✅ CAMBIAR: Grid2 → Grid
import ProductCard from '../ProductCard'

const ProductGrid = ({
  productos = [],
  onAddToCart,
  onViewDetails,
  emptyMessage = 'No hay productos para mostrar.',
  emptySubMessage = 'Intenta ajustar tu búsqueda o filtros.',
}) => {
  if (!Array.isArray(productos)) {
    console.error('ProductGrid: productos no es un array', productos)
    return (
      <Typography color="error">
        Error: Los datos de productos son incorrectos.
      </Typography>
    )
  }

  if (productos.length === 0) {
    return (
      <Box textAlign="center" p={3}>
        <Typography variant="h6">{emptyMessage}</Typography>
        <Typography>{emptySubMessage}</Typography>
      </Box>
    )
  }

  return (
    <Grid container spacing={2}>
      {' '}
      {/* ✅ Grid normal */}
      {productos.map((producto) => {
        if (!producto || typeof producto.id === 'undefined') {
          console.warn('ProductGrid: Producto inválido o sin ID', producto)
          return null
        }
        return (
          <Grid item xs={12} sm={6} md={4} lg={3} key={producto.id}>
            {' '}
            {/* ✅ Grid item */}
            <ProductCard producto={producto} />
          </Grid>
        )
      })}
    </Grid>
  )
}

export default ProductGrid
