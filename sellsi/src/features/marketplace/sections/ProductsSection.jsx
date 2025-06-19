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
  useTheme,
  useMediaQuery,
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { toast } from 'react-hot-toast'
import ProductCard from '../ProductCard/ProductCard'
import useCartStore from '../../../features/buyer/hooks/cartStore'
import LoadingOverlay from '../../ui/LoadingOverlay'

/**
 * Componente que maneja la sección de productos, título y grid
 * ✅ DESACOPLADO: Layout estático independiente del estado de SearchBar
 */
// ✅ MEJORA DE RENDIMIENTO: Memoización del componente
const ProductsSection = React.memo(({
  // shouldShowSearchBar removido - ya no necesario
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
  // ✅ OPTIMIZACIÓN: Removed console.count for production performance
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
  // ✅ LAYOUT ESTÁTICO: Padding fijo para mejor performance
  const mainContainerStyles = React.useMemo(() => ({
    pt: '180px', // Padding fijo - compensa SearchBar fija
    minHeight: 'calc(100vh - 140px)',
    display: 'flex',
    justifyContent: 'center',
    px: { xs: 1, md: 3 },
    mb: { xs: 10, md: 50 }, // Margen inferior para separar del BottomBar/footer
  }), []) // Sin dependencias - completamente estático

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
  // ✅ MEJORA DE RENDIMIENTO: Memoización del handler de volver (solo dependencias necesarias)
  const handleBackClick = React.useCallback(() => {
    setSeccionActiva('todos')
  }, [setSeccionActiva])  // ✅ MEJORA DE RENDIMIENTO: Memoización del mapeo de productos para evitar re-renders innecesarios
  // ✅ OPTIMIZACIÓN CRÍTICA: Solo recalcular cuando productosOrdenados realmente cambie
  const memoizedProducts = React.useMemo(() => {
    if (!Array.isArray(productosOrdenados) || productosOrdenados.length === 0) {
      return []
    }
    
    // ✅ OPTIMIZACIÓN: Evitar crear objetos nuevos si no es necesario
    return productosOrdenados
  }, [productosOrdenados])  // ✅ SISTEMA HÍBRIDO RESPONSIVO: Infinite Scroll + Paginación
  const theme = useTheme()
  const isXs = useMediaQuery(theme.breakpoints.only('xs'))
  const isSm = useMediaQuery(theme.breakpoints.only('sm'))
  const isMd = useMediaQuery(theme.breakpoints.only('md'))
  const isLg = useMediaQuery(theme.breakpoints.only('lg'))
  const isXl = useMediaQuery(theme.breakpoints.up('xl'))
  // ✅ VALORES RESPONSIVOS CON CARGA PROGRESIVA: Adaptan según el tamaño de pantalla
  const responsiveConfig = React.useMemo(() => {
    if (isXs) {
      return {
        PRODUCTS_PER_PAGE: 60,    // Móvil: menos productos por página
        INITIAL_PRODUCTS: 8,      // Móvil: grid 2x4
        LOAD_MORE_BATCH: 6,       // ✅ PROGRESIVO: Cargar de a 4 (la mitad del inicial)
        PRELOAD_TRIGGER: 6        // ✅ PROGRESIVO: Cuando llegue al producto 6, cargar 4 más
      }
    }
    if (isSm) {
      return {
        PRODUCTS_PER_PAGE: 80,    // Tablet pequeña: grid 2xN
        INITIAL_PRODUCTS: 12,     // Tablet: grid 2x6
        LOAD_MORE_BATCH: 9,       // ✅ PROGRESIVO: Cargar de a 6
        PRELOAD_TRIGGER: 9        // ✅ PROGRESIVO: Cuando llegue al producto 9, cargar 6 más
      }
    }
    if (isMd) {
      return {
        PRODUCTS_PER_PAGE: 90,    // Desktop: grid 3xN
        INITIAL_PRODUCTS: 15,     // Desktop: grid 3x5
        LOAD_MORE_BATCH: 9,       // ✅ PROGRESIVO: Cargar de a 6 (2 filas de 3)
        PRELOAD_TRIGGER: 9       // ✅ PROGRESIVO: Cuando llegue al producto 12, cargar 6 más
      }
    }
    if (isLg) {
      return {
        PRODUCTS_PER_PAGE: 100,   // Large: grid 4xN
        INITIAL_PRODUCTS: 20,     // Large: grid 4x5
        LOAD_MORE_BATCH: 12,       // ✅ PROGRESIVO: Cargar de a 8 (2 filas de 4)
        PRELOAD_TRIGGER: 12       // ✅ PROGRESIVO: Cuando llegue al producto 16, cargar 8 más
      }
    }
    if (isXl) {
      return {
        PRODUCTS_PER_PAGE: 125,   // XL: grid 5xN, más productos
        INITIAL_PRODUCTS: 25,     // XL: grid 5x5
        LOAD_MORE_BATCH: 15,      // ✅ PROGRESIVO: Cargar de a 10 (2 filas de 5)
        PRELOAD_TRIGGER: 15       // ✅ PROGRESIVO: Cuando llegue al producto 20, cargar 10 más
      }
    }
    // Fallback
    return {
      PRODUCTS_PER_PAGE: 100,
      INITIAL_PRODUCTS: 20,
      LOAD_MORE_BATCH: 8,
      PRELOAD_TRIGGER: 16
    }
  }, [isXs, isSm, isMd, isLg, isXl])

  const { PRODUCTS_PER_PAGE, INITIAL_PRODUCTS, LOAD_MORE_BATCH, PRELOAD_TRIGGER } = responsiveConfig
  
  const [currentPage, setCurrentPage] = React.useState(1)
  const [visibleProductsCount, setVisibleProductsCount] = React.useState(INITIAL_PRODUCTS)
  const [isLoadingMore, setIsLoadingMore] = React.useState(false)
  
  // Calcular productos totales y páginas
  const totalPages = Math.ceil(memoizedProducts.length / PRODUCTS_PER_PAGE)
  const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE
  const endIndex = startIndex + PRODUCTS_PER_PAGE
  const currentPageProducts = memoizedProducts.slice(startIndex, endIndex)
  
  // Productos visibles en la página actual (con infinite scroll limitado)
  const visibleProducts = React.useMemo(() => {
    return currentPageProducts.slice(0, visibleProductsCount)
  }, [currentPageProducts, visibleProductsCount])
  
  // Verificar si infinite scroll está activo (menos de 100 productos en página actual)
  const isInfiniteScrollActive = currentPageProducts.length <= PRODUCTS_PER_PAGE && visibleProductsCount < currentPageProducts.length
    const loadMoreProducts = React.useCallback(() => {
    if (isLoadingMore || !isInfiniteScrollActive) return
    
    setIsLoadingMore(true)
    setTimeout(() => {
      setVisibleProductsCount(prev => Math.min(prev + LOAD_MORE_BATCH, currentPageProducts.length))
      setIsLoadingMore(false)
    }, 300)
  }, [isLoadingMore, isInfiniteScrollActive, currentPageProducts.length, LOAD_MORE_BATCH])
  // ✅ CARGA PROGRESIVA: Detectar posición del último producto visible y cargar anticipadamente
  React.useEffect(() => {
    if (!isInfiniteScrollActive) return

    const handleScroll = () => {
      // ✅ NUEVA LÓGICA: Detectar cuándo el usuario está cerca del producto trigger
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop
      const windowHeight = window.innerHeight
      const documentHeight = document.documentElement.scrollHeight
      
      // Calcular el porcentaje de scroll
      const scrollPercent = scrollTop / (documentHeight - windowHeight)
      
      // Calcular qué producto aproximadamente está viendo el usuario
      const aproximateProductIndex = Math.floor(scrollPercent * visibleProductsCount)
      
      // ✅ CARGA ANTICIPADA: Si está cerca del producto trigger, cargar más
      const shouldPreload = aproximateProductIndex >= PRELOAD_TRIGGER - 2 // 2 productos antes del trigger
      
      // También mantener la lógica original como respaldo (200px del final)
      const nearBottom = scrollTop + windowHeight >= documentHeight - 200
      
      if (shouldPreload || nearBottom) {
        loadMoreProducts()
      }
    }

    let scrollTimeout
    const throttledScroll = () => {
      if (scrollTimeout) return
      scrollTimeout = setTimeout(() => {
        handleScroll()
        scrollTimeout = null
      }, 150)
    }

    window.addEventListener('scroll', throttledScroll)
    return () => {
      window.removeEventListener('scroll', throttledScroll)
      if (scrollTimeout) clearTimeout(scrollTimeout)
    }
  }, [loadMoreProducts, isInfiniteScrollActive, PRELOAD_TRIGGER, visibleProductsCount])
  // Manejar cambio de página
  const handlePageChange = React.useCallback((page) => {
    setCurrentPage(page)
    setVisibleProductsCount(INITIAL_PRODUCTS) // Reset a productos iniciales responsivos
    setIsLoadingMore(false)
    // Scroll suave al inicio de la sección de productos
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [INITIAL_PRODUCTS])
  // Componente de paginación responsivo
  const PaginationComponent = React.useMemo(() => {
    if (totalPages <= 1) return null

    // ✅ RESPONSIVO: Menos botones en móvil, más en desktop
    const showPages = isXs ? 3 : isSm ? 4 : 5
    
    let startPage = Math.max(1, currentPage - Math.floor(showPages / 2))
    let endPage = Math.min(totalPages, startPage + showPages - 1)
    
    if (endPage - startPage < showPages - 1) {
      startPage = Math.max(1, endPage - showPages + 1)
    }

    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        gap: { xs: 0.5, sm: 1 }, // ✅ RESPONSIVO: Gap más pequeño en móvil
        py: 3,
        flexWrap: 'wrap' // ✅ RESPONSIVO: Permitir wrap en pantallas muy pequeñas
      }}>
        {/* Botón Anterior */}
        <Button
          variant="outlined"
          disabled={currentPage === 1}
          onClick={() => handlePageChange(currentPage - 1)}
          sx={{ 
            minWidth: 'auto', 
            px: { xs: 1, sm: 2 }, // ✅ RESPONSIVO: Padding más pequeño en móvil
            fontSize: { xs: '0.75rem', sm: '0.875rem' } // ✅ RESPONSIVO: Texto más pequeño en móvil
          }}
        >
          {isXs ? '‹' : '‹ Anterior'}
        </Button>        {/* Números de página */}
        {!isXs && startPage > 1 && (
          <>
            <Button
              variant={1 === currentPage ? "contained" : "outlined"}
              onClick={() => handlePageChange(1)}
              sx={{ minWidth: { xs: 32, sm: 40 } }}
            >
              1
            </Button>
            {startPage > 2 && <Typography variant="body2">...</Typography>}
          </>
        )}

        {Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i).map(page => (
          <Button
            key={page}
            variant={page === currentPage ? "contained" : "outlined"}
            onClick={() => handlePageChange(page)}
            sx={{ 
              minWidth: { xs: 32, sm: 40 }, // ✅ RESPONSIVO: Botones más pequeños en móvil
              fontSize: { xs: '0.75rem', sm: '0.875rem' }
            }}
          >
            {page}
          </Button>
        ))}

        {!isXs && endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && <Typography variant="body2">...</Typography>}
            <Button
              variant={totalPages === currentPage ? "contained" : "outlined"}
              onClick={() => handlePageChange(totalPages)}
              sx={{ minWidth: { xs: 32, sm: 40 } }}
            >
              {totalPages}
            </Button>
          </>
        )}

        {/* Botón Siguiente */}
        <Button
          variant="outlined"
          disabled={currentPage === totalPages}
          onClick={() => handlePageChange(currentPage + 1)}
          sx={{ 
            minWidth: 'auto', 
            px: { xs: 1, sm: 2 },
            fontSize: { xs: '0.75rem', sm: '0.875rem' }
          }}
        >
          {isXs ? '›' : 'Siguiente ›'}
        </Button>

        {/* Info de página - Solo en pantallas medianas y grandes */}
        {!isXs && (
          <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
            Página {currentPage} de {totalPages}
          </Typography>
        )}
      </Box>    )
  }, [currentPage, totalPages, handlePageChange, isXs, isSm])

  // ✅ RESPONSIVO: Actualizar productos visibles cuando cambia el breakpoint
  React.useEffect(() => {
    setVisibleProductsCount(INITIAL_PRODUCTS)
  }, [INITIAL_PRODUCTS])

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
          </Box>          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Typography variant="body2" color="text.secondary">
              {totalProductos} productos encontrados
            </Typography>
            {totalPages > 1 && (
              <Typography variant="body2" color="primary.main" sx={{ fontSize: '0.875rem' }}>
                Mostrando {startIndex + 1}-{Math.min(endIndex, totalProductos)} | Página {currentPage} de {totalPages}
              </Typography>
            )}
          </Box>
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
              </Typography>              <Button variant="outlined" onClick={resetFiltros} sx={{ mt: 2 }}>
                Limpiar filtros
              </Button>            </Paper>          ) : (
            <>
              {/* ✅ PAGINACIÓN SUPERIOR */}
              {PaginationComponent}
              
              <Box sx={gridStyles}>
                {visibleProducts.map((producto) => (
                  <Box key={`product-${producto.id || producto.productid}`} sx={cardContainerStyles}>
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
              
              {/* ✅ INFINITE SCROLL: Solo activo dentro de cada página */}
              {isInfiniteScrollActive && isLoadingMore && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4, mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <CircularProgress size={20} />
                    <Typography variant="body2" color="text.secondary">
                      Cargando más productos...
                    </Typography>
                  </Box>
                </Box>
              )}
              
              {/* ✅ MENSAJE: Todos los productos de la página cargados */}
              {!isInfiniteScrollActive && !isLoadingMore && visibleProductsCount >= currentPageProducts.length && currentPageProducts.length >= PRODUCTS_PER_PAGE && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4, mb: 2 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                    ✨ Has visto todos los productos de esta página. Usa la paginación para ver más.
                  </Typography>
                </Box>
              )}

              {/* 🔧 DEBUG INFO (puedes eliminar esto en producción) */}
              {process.env.NODE_ENV === 'development' && (
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  mt: 2, 
                  p: 2, 
                  bgcolor: '#f8f9fa', 
                  borderRadius: 1,
                  border: '1px dashed #e9ecef'
                }}>
                  <Typography variant="caption" color="text.secondary">
                    📊 Debug: Productos visibles: {visibleProductsCount} | 
                    Trigger de carga: {PRELOAD_TRIGGER} | 
                    Lote de carga: {LOAD_MORE_BATCH} | 
                    Total en página: {currentPageProducts.length}
                  </Typography>
                </Box>
              )}

              {/* ✅ PAGINACIÓN INFERIOR */}
              {PaginationComponent}
            </>
          )}
        </Box>
      </Box>
    </Box>
  )
})

// ✅ MEJORA DE RENDIMIENTO: DisplayName para debugging
ProductsSection.displayName = 'ProductsSection'

export default ProductsSection
