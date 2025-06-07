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
const SearchSection = ({
  shouldShowSearchBar,
  searchBarProps,
  categoryNavigationProps,
  hasSidebar = false, // Nueva prop para detectar si hay sidebar
}) => {
  return (
    <Box
      sx={{
        mt: 0,
        py: 1,
        px: { xs: 1, md: 3 },
        bgcolor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        boxShadow: shouldShowSearchBar ? '0 4px 20px rgba(0,0,0,0.15)' : 'none',
        borderBottom: shouldShowSearchBar ? '1px solid #e2e8f0' : 'none',
        position: 'fixed',
        top: shouldShowSearchBar ? 64 : -150,
        left: hasSidebar ? '250px' : 0,
        right: 0,
        zIndex: 1000,
        transition: 'all 0.3s ease-out',
        transform: shouldShowSearchBar ? 'translateY(0)' : 'translateY(-10px)',
        opacity: shouldShowSearchBar ? 1 : 0,
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      {' '}
      <Box
        sx={{
          width: '100%',
          maxWidth: {
            sm: '720px',
            md: '960px',
            lg: '1280px',
            xl: '1700px',
          },
          py: 1,
        }}
      >
        {' '}
        {/* ✅ USAR SearchBar EXISTENTE */}
        <SearchBar {...searchBarProps} />
        {/* ✅ USAR CategoryNavigation EXISTENTE */}
        <CategoryNavigation {...categoryNavigationProps} />
      </Box>
    </Box>
  )
}

SearchSection.displayName = 'SearchSection'

export default SearchSection
