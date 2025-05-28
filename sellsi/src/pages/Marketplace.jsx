import React, { useState, useEffect } from 'react'
import {
  Box,
  Container,
  Grid,
  Typography,
  Button,
  IconButton,
  useMediaQuery,
  useTheme,
  Fab,
  Badge,
  Paper,
} from '@mui/material'
import FilterAltIcon from '@mui/icons-material/FilterAlt'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'

// Hooks personalizados
import { useMarketplaceState } from '../hooks/marketplace/useMarketplaceState'
import { useProductSorting } from '../hooks/marketplace/useProductSorting'
import { useScrollBehavior } from '../hooks/marketplace/useScrollBehavior'

// ✅ USAR COMPONENTES EXISTENTES
import SearchBar from '../components/marketplace/SearchBar'
import CategoryNavigation from '../components/marketplace/CategoryNavigation'
import FilterPanel from '../components/marketplace/FilterPanel'
import ProductCard from '../components/marketplace/ProductCard'

const Marketplace = () => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  // Estados del marketplace usando el hook personalizado
  const {
    seccionActiva,
    busqueda,
    categoriaSeleccionada,
    filtros,
    filtroVisible,
    filtroModalOpen,
    productosFiltrados,
    hayFiltrosActivos,
    totalProductos,
    precioRango,
    comisionRango,
    categorias,
    setSeccionActiva,
    setBusqueda,
    setCategoriaSeleccionada,
    setFiltroVisible,
    setFiltroModalOpen,
    setPrecioRango,
    setComisionRango,
    updateFiltros,
    resetFiltros,
    toggleCategoria,
    handleTipoVentaChange,
  } = useMarketplaceState()

  // Hook para opciones de ordenamiento
  const {
    ordenamiento: currentOrdenamiento,
    setOrdenamiento: setCurrentOrdenamiento,
    productosOrdenados,
    sortOptions: currentSortOptions,
  } = useProductSorting(productosFiltrados)

  // Hook para comportamiento de scroll
  const { shouldShowSearchBar } = useScrollBehavior()

  // Estados locales para UI
  const [anchorElCategorias, setAnchorElCategorias] = useState(null)

  // Handlers
  const handleToggleFiltro = () => {
    if (isMobile) {
      setFiltroModalOpen(!filtroModalOpen)
    } else {
      setFiltroVisible(!filtroVisible)
    }
  }

  return (
    <Box sx={{ bgcolor: '#f8fafc', minHeight: '100vh' }}>
      {' '}
      {/* ✅ BARRA DE BÚSQUEDA CON SCROLL BEHAVIOR - AJUSTADA */}
      <Box
        sx={{
          mt: 0,
          py: 1, // ✅ REDUCIR padding: 0 -> 1
          px: { xs: 1, md: 3 },
          bgcolor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          boxShadow: shouldShowSearchBar
            ? '0 4px 20px rgba(0,0,0,0.15)'
            : 'none',
          borderBottom: shouldShowSearchBar ? '1px solid #e2e8f0' : 'none',
          position: 'fixed',
          top: shouldShowSearchBar ? 64 : -150, // ✅ AJUSTAR posición: -200 -> -150
          left: 0,
          right: 0,
          zIndex: 1000,
          transition: 'all 0.3s ease-out',
          transform: shouldShowSearchBar
            ? 'translateY(0)'
            : 'translateY(-10px)',
          opacity: shouldShowSearchBar ? 1 : 0,
        }}
      >
        <Box sx={{ py: 1 }}>
          {' '}
          {/* ✅ REDUCIR padding: 2 -> 1 */}
          {/* ✅ USAR SearchBar EXISTENTE */}
          <SearchBar
            busqueda={busqueda}
            setBusqueda={setBusqueda}
            ordenamiento={currentOrdenamiento}
            setOrdenamiento={setCurrentOrdenamiento}
            sortOptions={currentSortOptions}
            onToggleFilters={handleToggleFiltro}
            hayFiltrosActivos={hayFiltrosActivos}
            filtroVisible={filtroVisible}
            filtroModalOpen={filtroModalOpen}
            isMobile={isMobile}
          />
          {/* ✅ USAR CategoryNavigation EXISTENTE */}
          <CategoryNavigation
            seccionActiva={seccionActiva}
            categoriaSeleccionada={categoriaSeleccionada}
            anchorElCategorias={anchorElCategorias}
            onSeccionChange={setSeccionActiva}
            onCategoriaToggle={toggleCategoria}
            onOpenCategorias={(event) =>
              setAnchorElCategorias(event.currentTarget)
            }
            onCloseCategorias={() => setAnchorElCategorias(null)}
          />
        </Box>
      </Box>
      {/* Botón flotante para móvil */}
      {isMobile && !shouldShowSearchBar && (
        <Fab
          color="primary"
          onClick={handleToggleFiltro}
          sx={{
            position: 'fixed',
            bottom: 80,
            right: 20,
            zIndex: 1000,
            transition: 'all 0.3s ease',
          }}
        >
          <Badge color="error" variant="dot" invisible={!hayFiltrosActivos}>
            <FilterAltIcon />
          </Badge>
        </Fab>
      )}{' '}
      {/* ✅ USAR FilterPanel EXISTENTE */}
      {!isMobile && (
        <FilterPanel
          filtros={filtros}
          categoriaSeleccionada={categoriaSeleccionada}
          busqueda={busqueda}
          updateFiltros={updateFiltros}
          resetFiltros={resetFiltros}
          isMobileOpen={filtroModalOpen}
          onMobileClose={() => setFiltroModalOpen(false)}
          totalProductos={totalProductos}
          filtrosAbiertos={filtroVisible} // ✅ AGREGAR esta prop
        />
      )}
      {/* FilterPanel para móvil */}
      {isMobile && (
        <FilterPanel
          filtros={filtros}
          categoriaSeleccionada={categoriaSeleccionada}
          busqueda={busqueda}
          updateFiltros={updateFiltros}
          resetFiltros={resetFiltros}
          isMobileOpen={filtroModalOpen}
          onMobileClose={() => setFiltroModalOpen(false)}
          totalProductos={totalProductos}
          filtrosAbiertos={false} // En móvil se maneja con isMobileOpen
        />
      )}{' '}
      {/* ✅ CONTENIDO PRINCIPAL con layout exacto del monolítico */}
      <Box
        sx={{
          pt: shouldShowSearchBar ? '180px' : '130px',
          // ✅ REMOVER: pl: !isMobile && filtroVisible ? '320px' : 0,
          // ✅ REMOVER: transition: 'padding-left 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
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
            maxWidth: '1400px', // ✅ AGREGAR: Mismo ancho máximo
            mx: 'auto', // ✅ AGREGAR: Centrar
            px: { xs: 2, md: 4 }, // ✅ AGREGAR: Mismo padding
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
        </Box>{' '}
        {/* ✅ ÁREA DE PRODUCTOS centrada con márgenes automáticos */}
        <Box
          sx={{
            width: '100%',
            maxWidth: '1400px', // ✅ AGREGAR: Ancho máximo del contenedor
            mx: 'auto', // ✅ AGREGAR: Centrar horizontalmente
            px: { xs: 2, md: 4 }, // ✅ AGREGAR: Padding lateral responsive
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
                  xs: 'repeat(1, 1fr)', // Móvil: 1 columna
                  sm: 'repeat(2, 1fr)', // Tablet: 2 columnas
                  md: 'repeat(5, 1fr)', // Desktop: 5 columnas
                  lg: 'repeat(5, 1fr)', // Large: 5 columnas
                  xl: 'repeat(5, 1fr)', // XL: 5 columnas
                },
                gap: { xs: 1.5, md: 2 }, // ✅ REDUCIR gap responsive
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
                  <ProductCard producto={producto} />
                </Box>
              ))}
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  )
}

export default Marketplace
