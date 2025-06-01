// ✅ EDITAR AQUÍ PARA:
// - Cambiar diseño del título y contador
// - Modificar grid responsive de productos
// - Ajustar mensaje de "no encontrados"
// - Cambiar espaciado y márgenes del contenido

// 🔗 CONTIENE:
// - Título dinámico según sección
// - Contador de productos
// - Grid de ProductCard
// - Estado vacío con botón "Limpiar filtros"

import React from 'react'
import { Box, Typography, IconButton, Paper, Button } from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import ProductCard from '../ProductCard/ProductCard'

/**
 * Componente que maneja la sección de productos, título y grid
 * Mantiene exactamente el mismo diseño y comportamiento que la implementación original
 */
const ProductsSection = ({
  shouldShowSearchBar,
  seccionActiva,
  setSeccionActiva,
  totalProductos,
  productosOrdenados,
  resetFiltros,
}) => {
  return (
    <Box
      sx={{
        pt: shouldShowSearchBar ? '180px' : '130px',
        minHeight: 'calc(100vh - 140px)',
      }}
    >
      {/* ✅ TÍTULO con márgenes reducidos e iguales */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 4,
          maxWidth: { lg: '1150px', xl: '1650px' }, // ✅ AGREGAR: Mismo ancho máximo
          mx: 'auto', // ✅ AGREGAR: Centrar
          px: { xs: 0, sm: 0, md: 0, lg: 0, xl: 0 }, // ✅ COMPLETO: Márgenes para todos los breakpoints
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {seccionActiva !== 'todos' && (
            <IconButton
              onClick={() => setSeccionActiva('todos')}
              sx={{
                bgcolor: '#f1f5f9',
                color: 'primary.main',
                '&:hover': {
                  bgcolor: 'primary.main',
                  color: 'white',
                },
                transition: 'all 0.2s ease',
              }}
              aria-label="Volver a todos los productos"
            >
              <ArrowBackIcon />
            </IconButton>
          )}

          <Typography variant="h5" fontWeight={600} sx={{ color: '#1e293b' }}>
            {seccionActiva === 'nuevos'
              ? '✨ Nuevos Productos'
              : seccionActiva === 'ofertas'
              ? '🔥 Ofertas Destacadas'
              : seccionActiva === 'topVentas'
              ? '⭐ Top Ventas'
              : '🛍️ Todos los Productos'}
          </Typography>
        </Box>

        <Typography variant="body2" color="text.secondary">
          {totalProductos} productos encontrados
        </Typography>
      </Box>

      {/* ✅ ÁREA DE PRODUCTOS centrada con márgenes automáticos */}
      <Box
        sx={{
          width: '100%',
          maxWidth: { lg: '1150px', xl: '1650px' }, // ✅ AGREGAR: Ancho máximo del contenedor
          mx: 'auto', // ✅ AGREGAR: Centrar horizontalmente
          px: { xs: 0, sm: 0, md: 0, lg: 0, xl: 0 }, // ✅ COMPLETO: Márgenes idénticos al título para todos los breakpoints
        }}
      >
        {/* Grid de productos o mensaje de no encontrados */}
        {productosOrdenados.length === 0 ? (
          <Paper
            sx={{
              p: 6,
              textAlign: 'center',
              bgcolor: '#fff',
              borderRadius: 3,
              border: '1px solid #e2e8f0',
            }}
          >
            <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
              😞 No se encontraron productos
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Intenta ajustar los filtros o realiza una búsqueda diferente
            </Typography>
            <Button
              variant="outlined"
              onClick={resetFiltros}
              sx={{ borderRadius: 2, px: 3 }}
            >
              Limpiar filtros
            </Button>
          </Paper>
        ) : (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: 'repeat(2, 1fr)', // Móvil: 2 columnas
                sm: 'repeat(2, 1fr)', // Tablet: 2 columnas
                md: 'repeat(3, 1fr)', // Desktop: 3 columnas
                lg: 'repeat(4, 1fr)', // Large: 4 columnas
                xl: 'repeat(5, 1fr)', // XL: 5 columnas
              },
              gap: { xs: 1.5, sm: 1.5, md: 3, lg: 6, xl: 6 }, // ✅ REDUCIR gap responsive
              width: '100%',
              justifyItems: 'center', // ✅ AGREGAR: Centrar cada producto
            }}
          >
            {productosOrdenados.map((producto) => (
              <Box
                key={producto.id}
                sx={{
                  width: '100%',
                  maxWidth: '240px', // ✅ AGREGAR: Ancho máximo de cada tarjeta
                }}
              >
                <ProductCard
                  producto={producto}
                  onAddToCart={(producto) => {
                    console.log('Producto agregado al carrito:', producto)
                    // Aquí puedes agregar la lógica para añadir al carrito
                  }}
                  onViewDetails={(producto) => {
                    console.log('Ver detalles del producto:', producto)
                    // Aquí puedes agregar la lógica para ver detalles
                  }}
                />
              </Box>
            ))}
          </Box>
        )}{' '}
      </Box>
    </Box>
  )
}

ProductsSection.displayName = 'ProductsSection'

export default ProductsSection
