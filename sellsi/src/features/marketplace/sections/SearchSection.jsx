// ✅ EDITAR AQUÍ PARA:
// - Cambiar diseño de la barra de búsqueda fija
// - Modificar animaciones de aparición/desaparición
// - Ajustar posicionamiento y estilos del contenedor
// - Cambiar comportamiento responsive

// 🔗 CONTIENE:
// - SearchBar (buscador + ordenamiento + botón filtros)
// - CategoryNavigation (botón categorías + chips + secciones)

import React from 'react';
import { Box } from '@mui/material';
import SearchBar from '../SearchBar/SearchBar';
import CategoryNavigation from '../../layout/NavBar';

/**
 * Componente que encapsula la barra de búsqueda y navegación de categorías
 * ✅ OPTIMIZADO: Solo maneja su propia visibilidad sin afectar otros componentes
 */
// ✅ MEJORA DE RENDIMIENTO: Memoización del componente con comparación personalizada
const SearchSection = React.memo(
  ({
    shouldShowSearchBar, // Solo afecta a este componente
    searchBarProps,
    categoryNavigationProps,
    hasSideBar = false, // Nueva prop para detectar si hay SideBar
  }) => {
    // ✅ OPTIMIZACIÓN: Removed console.count for production performance
    // ✅ MEJORA DE RENDIMIENTO: Memoización más granular de estilos del contenedor principal
    const mainContainerStyles = React.useMemo(
      () => ({
        mt: 0,
        py: 1,
        px: hasSideBar ? { xs: 0, md: 0 } : { xs: 1, md: 3 }, // Sin padding lateral cuando hay SideBar
        bgcolor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        position: 'fixed',
        top: 64, // Posición fija - no cambia
        left: hasSideBar ? '210px' : 0, // Cambiado de 250px a 210px para coincidir con el ancho real del SideBar
        right: 0,
        zIndex: 1000,
        display: 'flex',
        justifyContent: 'center',
      }),
      [hasSideBar]
    );
    // ✅ ANIMACIÓN OPTIMIZADA: Solo transform y opacity para 60fps
    const dynamicStyles = React.useMemo(
      () => ({
        boxShadow: shouldShowSearchBar ? '0 4px 20px rgba(0,0,0,0.15)' : 'none',
        borderBottom: shouldShowSearchBar ? '1px solid #e2e8f0' : 'none',
        transform: shouldShowSearchBar
          ? 'translateY(0) translateZ(0)'
          : 'translateY(-100%) translateZ(0)', // Usar translateY en vez de top
        opacity: shouldShowSearchBar ? 1 : 0,
        transition:
          'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease-out, box-shadow 0.3s ease-out',
        willChange: 'transform, opacity', // Ayuda al navegador a optimizar
      }),
      [shouldShowSearchBar]
    );

    // ✅ MEJORA DE RENDIMIENTO: Memoización de estilos del contenedor interno - Estáticos
    const innerContainerStyles = React.useMemo(
      () => ({
        width: '100%',
        maxWidth: {
          sm: '720px',
          md: '960px',
          lg: '1280px',
          xl: '1700px',
        },
        py: 1,
      }),
      []
    );

    // ✅ OPTIMIZACIÓN: Combinar estilos finales solo cuando sea necesario
    const finalContainerStyles = React.useMemo(
      () => ({
        ...mainContainerStyles,
        ...dynamicStyles,
      }),
      [mainContainerStyles, dynamicStyles]
    );

    return (
      <Box sx={finalContainerStyles}>
        <Box sx={innerContainerStyles}>
          {/* ✅ USAR SearchBar EXISTENTE */}
          <SearchBar {...searchBarProps} />
          {/* ✅ USAR CategoryNavigation EXISTENTE */}
          <CategoryNavigation {...categoryNavigationProps} />
        </Box>
      </Box>
    );
  },
  (prevProps, nextProps) => {
    // ✅ OPTIMIZACIÓN: Comparación personalizada más específica
    return (
      prevProps.shouldShowSearchBar === nextProps.shouldShowSearchBar &&
      prevProps.hasSideBar === nextProps.hasSideBar &&
      // Comparación profunda solo de las props que realmente pueden cambiar
      prevProps.searchBarProps.busqueda === nextProps.searchBarProps.busqueda &&
      prevProps.searchBarProps.ordenamiento ===
        nextProps.searchBarProps.ordenamiento &&
      prevProps.searchBarProps.hayFiltrosActivos ===
        nextProps.searchBarProps.hayFiltrosActivos &&
      prevProps.categoryNavigationProps.seccionActiva ===
        nextProps.categoryNavigationProps.seccionActiva &&
      prevProps.categoryNavigationProps.categoriaSeleccionada ===
        nextProps.categoryNavigationProps.categoriaSeleccionada
    );
  }
);

// ✅ MEJORA DE RENDIMIENTO: DisplayName para debugging
SearchSection.displayName = 'SearchSection';

export default SearchSection;
