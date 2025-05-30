// ✅ EDITAR AQUÍ PARA:
// - Cambiar número de columnas por breakpoint
// - Modificar espaciado entre productos
// - Ajustar mensaje de error o loading
// - Cambiar comportamiento cuando no hay productos

import React from 'react'
import { Grid, Box, Typography } from '@mui/material' // ✅ CAMBIAR: Grid2 → Grid
import ProductCard from '../ProductCard/ProductCard'

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
          <Grid item xs={12} sm={6} md={3} lg={3} xl={3} key={producto.id}>
            {' '}
            {/* ✅ Grid item - md=3, lg=3, xl=3 para 4 productos por fila */}
            <ProductCard producto={producto} />
          </Grid>
        )
      })}
    </Grid>
  )
}

export default React.memo(ProductGrid)
