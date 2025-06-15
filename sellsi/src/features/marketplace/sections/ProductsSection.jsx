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
import {
  Box,
  Typography,
  IconButton,
  Paper,
  Button,
  CircularProgress,
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { toast } from 'react-hot-toast'
import ProductCard from '../ProductCard/ProductCard'
import useCartStore from '../../../features/buyer/hooks/cartStore'
import LoadingOverlay from '../../ui/LoadingOverlay'

/**
 * Componente que maneja la sección de productos, título y grid
 * Mantiene exactamente el mismo diseño y comportamiento que la implementación original
 */
// ✅ MEJORA DE RENDIMIENTO: Memoización del componente
const ProductsSection = React.memo(({
  shouldShowSearchBar,
  seccionActiva,
  setSeccionActiva,
  totalProductos,
  productosOrdenados,
  resetFiltros,
  hasSidebar = false, // Nueva prop para detectar si hay sidebar
  titleMarginLeft = { xs: 0, sm: 0, md: 0, lg: 0, xl: 0 }, // Nueva prop para margen del título
  loading,
  error,
}) => {
  // Hook para usar el store del carrito
  const addItem = useCartStore((state) => state.addItem)

  // ✅ MEJORA DE RENDIMIENTO: Memoización del handler para agregar al carrito
  const handleAddToCart = React.useCallback((producto) => {
    // Si el producto ya viene formateado (con price_tiers), usarlo tal cual
    if (producto.price_tiers || producto.cantidadSeleccionada) {
      // Producto ya formateado desde ProductCard, usar directamente
      addItem(producto, producto.cantidadSeleccionada || 1)
    } else {
      // Convertir la estructura del producto al formato esperado por el store
      const productForCart = {
        id: producto.id,
        name: producto.nombre,
        price: producto.precio,
        image: producto.imagen,
        maxStock: producto.stock || 50, // Usar stock disponible o valor por defecto
        supplier: producto.proveedor || producto.supplier || producto.provider,
        // Añadir otros campos que pueda necesitar el store
        originalPrice: producto.precioOriginal,
        discount: producto.descuento,
        rating: producto.rating,
        sales: producto.ventas,
      }

      // Llamar la función addItem del store con la cantidad seleccionada
      const quantity = producto.cantidadSeleccionada || 1
      addItem(productForCart, quantity)
    }

    // Mostrar toast de confirmación
    toast.success(`Agregado al carrito: ${producto.nombre}`, {
      icon: '✅',
    })
  }, [addItem])

  // ✅ MEJORA DE RENDIMIENTO: Memoización de estilos del contenedor principal
  const mainContainerStyles = React.useMemo(() => ({
    pt: shouldShowSearchBar ? '180px' : '130px',
    minHeight: 'calc(100vh - 140px)',
    display: 'flex',
    justifyContent: 'center',
    px: { xs: 1, md: 3 },
  }), [shouldShowSearchBar])

  // ✅ MEJORA DE RENDIMIENTO: Memoización de estilos del contenedor interno
  const innerContainerStyles = React.useMemo(() => ({
    width: '100%',
    maxWidth: {
      sm: '720px',
      md: '960px',
      lg: '1280px',
      xl: '1700px',
    },
  }), [])

  // ✅ MEJORA DE RENDIMIENTO: Memoización de estilos del grid
  const gridStyles = React.useMemo(() => ({
    display: 'grid',
    gridTemplateColumns: {
      xs: 'repeat(2, 1fr)', // Móvil: 2 columnas
      sm: 'repeat(2, 1fr)', // Tablet: 2 columnas
      md: 'repeat(3, 1fr)', // Desktop: 3 columnas
      lg: 'repeat(4, 1fr)', // Large: 4 columnas
      xl: 'repeat(5, 1fr)', // XL: 5 columnas
    },
    gap: { xs: 1.5, sm: 1.5, md: 4, lg: 6, xl: 6 }, // ✅ REDUCIR gap responsive - md reducido
    width: '100%',
    justifyItems: 'center', // ✅ AGREGAR: Centrar cada producto
  }), [])

  // ✅ MEJORA DE RENDIMIENTO: Memoización de estilos de las tarjetas
  const cardContainerStyles = React.useMemo(() => ({
    width: '100%',
    maxWidth: '240px', // ✅ AGREGAR: Ancho máximo de cada tarjeta
  }), [])

  // ✅ MEJORA DE RENDIMIENTO: Memoización del título de sección
  const sectionTitle = React.useMemo(() => {
    switch (seccionActiva) {
      case 'nuevos':
        return '✨ Nuevos Productos'
      case 'ofertas':
        return '🔥 Ofertas Destacadas'
      case 'topVentas':
        return '⭐ Top Ventas'
      default:
        return '🛍️ Todos los Productos'
    }
  }, [seccionActiva])

  // ✅ MEJORA DE RENDIMIENTO: Memoización del handler de volver
  const handleBackClick = React.useCallback(() => {
    setSeccionActiva('todos')
  }, [setSeccionActiva])

  return (
    <Box sx={mainContainerStyles}>
      <Box sx={innerContainerStyles}>
        {/* ✅ TÍTULO con márgenes reducidos e iguales */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 4,
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              ml: titleMarginLeft,
            }}
          >
            {seccionActiva !== 'todos' && (
              <IconButton
                onClick={handleBackClick}
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
              {sectionTitle}
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">
            {totalProductos} productos encontrados
          </Typography>
        </Box>

        {/* ✅ ÁREA DE PRODUCTOS centrada con márgenes automáticos */}
        <Box sx={{ width: '100%' }}>
          {loading ? (
            <LoadingOverlay message="Cargando productos..." height={300} />
          ) : error ? (
            <Paper
              sx={{
                p: 6,
                textAlign: 'center',
                bgcolor: '#fff',
                borderRadius: 3,
                border: '1px solid #e2e8f0',
              }}
            >
              <Typography variant="h6" color="error" sx={{ mb: 2 }}>
                Error al cargar productos
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {error}
              </Typography>
            </Paper>
          ) : productosOrdenados.length === 0 ? (
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
              <Button variant="outlined" onClick={resetFiltros} sx={{ mt: 2 }}>
                Limpiar filtros
              </Button>
            </Paper>          ) : (
            <Box sx={gridStyles}>
              {productosOrdenados.map((producto) => (
                <Box key={producto.id} sx={cardContainerStyles}>
                  <ProductCard
                    producto={producto}
                    onAddToCart={handleAddToCart}
                    onViewDetails={(producto) => {
                      // Aquí puedes agregar la lógica para ver detalles
                    }}
                  />
                </Box>
              ))}
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  )
})

// ✅ MEJORA DE RENDIMIENTO: DisplayName para debugging
ProductsSection.displayName = 'ProductsSection'

export default ProductsSection
