// ✅ EDITAR AQUÍ PARA:
// - Cambiar diseño de la barra de búsqueda fija
// - Modificar animaciones de aparición/desaparición
// - Ajustar posicionamiento y estilos del contenedor
// - Cambiar comportamiento responsive

// 🔗 CONTIENE:
// - SearchBar (buscador + ordenamiento + botón filtros)
// - CategoryNavigation (botón categorías + chips + secciones)

import React from 'react'
import { Box } from '@mui/material'
import SearchBar from '../SearchBar/SearchBar'
import CategoryNavigation from '../CategoryNavigation/CategoryNavigation'

/**
 * Componente que encapsula la barra de búsqueda y navegación de categorías
 * Mantiene exactamente el mismo diseño y comportamiento que la implementación original
 */
// ✅ MEJORA DE RENDIMIENTO: Memoización del componente
const SearchSection = React.memo(({
  shouldShowSearchBar,
  searchBarProps,
  categoryNavigationProps,
  hasSidebar = false, // Nueva prop para detectar si hay sidebar
}) => {
  // ✅ MEJORA DE RENDIMIENTO: Memoización de estilos del contenedor principal
  const mainContainerStyles = React.useMemo(() => ({
    mt: 0,
    py: 1,
    px: hasSidebar ? { xs: 0, md: 0 } : { xs: 1, md: 3 }, // Sin padding lateral cuando hay sidebar
    bgcolor: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(10px)',
    boxShadow: shouldShowSearchBar ? '0 4px 20px rgba(0,0,0,0.15)' : 'none',
    borderBottom: shouldShowSearchBar ? '1px solid #e2e8f0' : 'none',
    position: 'fixed',
    top: shouldShowSearchBar ? 64 : -150,
    left: hasSidebar ? '210px' : 0, // Cambiado de 250px a 210px para coincidir con el ancho real del sidebar
    right: 0,
    zIndex: 1000,
    transition: 'all 0.3s ease-out',
    transform: shouldShowSearchBar ? 'translateY(0)' : 'translateY(-10px)',
    opacity: shouldShowSearchBar ? 1 : 0,
    display: 'flex',
    justifyContent: 'center',
  }), [shouldShowSearchBar, hasSidebar])

  // ✅ MEJORA DE RENDIMIENTO: Memoización de estilos del contenedor interno
  const innerContainerStyles = React.useMemo(() => ({
    width: '100%',
    maxWidth: {
      sm: '720px',
      md: '960px',
      lg: '1280px',
      xl: '1700px',
    },
    py: 1,
  }), [])

  return (
    <Box sx={mainContainerStyles}>
      <Box sx={innerContainerStyles}>
        {/* ✅ USAR SearchBar EXISTENTE */}
        <SearchBar {...searchBarProps} />
        {/* ✅ USAR CategoryNavigation EXISTENTE */}
        <CategoryNavigation {...categoryNavigationProps} />
      </Box>
    </Box>
  )
})

// ✅ MEJORA DE RENDIMIENTO: DisplayName para debugging
SearchSection.displayName = 'SearchSection'

export default SearchSection
