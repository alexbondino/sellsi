// ✅ EDITAR AQUÍ PARA:
// - Cambiar diseño de la barra de búsqueda fija
// - Modificar animaciones de aparición/desaparición
// - Ajustar posicionamiento y estilos del contenedor
// - Cambiar comportamiento responsive

// 🔗 CONTIENE:
// - SearchBar (buscador + ordenamiento + botón filtros)
// - CategoryNavigation (botón categorías + chips + secciones)

import React from 'react';
import { Box, useMediaQuery, useTheme } from '@mui/material';
import ReactDOM from 'react-dom';
import { SearchBar } from '../../../../shared/components/forms'; // ✅ REFACTOR: Usar el SearchBar compartido con funcionalidad de switch
import CategoryNavigation from '../CategoryNavigation/CategoryNavigation';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import { Button } from '@mui/material';

/**
 * Componente que encapsula la barra de búsqueda y navegación de categorías
 * ✅ OPTIMIZADO: Solo maneja su propia visibilidad sin afectar otros componentes
 */
// ✅ MEJORA DE RENDIMIENTO: Memoización del componente con comparación personalizada
const SearchSection = ({
  shouldShowSearchBar, // Solo afecta a este componente
  searchBarProps,
  categoryNavigationProps,
  hasSideBar = false,
  sideBarCollapsed = true, // ✅ Estado del sidebar (abierto/cerrado)
}) => {
  // ✅ Determinar si el sidebar está visible y abierto
  const isSideBarOpen = hasSideBar && !sideBarCollapsed;

  // ✅ OPTIMIZACIÓN: Removed console.count for production performance
  // ✅ MEJORA DE RENDIMIENTO: Memoización más granular de estilos del contenedor principal
  const mainContainerStyles = React.useMemo(
    () => ({
      mt: 0,
      py: { xs: 0, sm: 0, md: 1 },
      px: 0,
      bgcolor: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(10px)',
      position: 'fixed',
      top: { xs: 45, md: 64 },
      // ✅ CONTENEDOR SIEMPRE OCUPA TODO EL ANCHO
      left: 0,
      right: 0,
      width: '100vw',
      zIndex: 1,
      display: 'flex',
      justifyContent: 'flex-start', // Contenido alineado a la izquierda
    }),
    []
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

  // ✅ MEJORA DE RENDIMIENTO: Memoización de estilos del contenedor interno
  const innerContainerStyles = React.useMemo(
    () => ({
      width: '100%',
      py: { xs: 0.5, md: 1 }, // Padding vertical
      // ✅ AJUSTE DEL CONTENIDO: Solo el contenido interno se mueve según sidebar
      // Margen left para compensar el sidebar cuando está abierto
      ml: isSideBarOpen ? { xs: 0, md: '250px' } : '150px',
      // ✅ ALINEADO CON PRODUCTOS: Mismo padding según estado del sidebar
      px: isSideBarOpen
        ? {
            xs: 2, // Mobile: margen pequeño
            sm: 2.5, // Tablet pequeña: margen reducido
            md: 3, // Tablet: margen moderado
            lg: 4, // Desktop: margen compacto
            xl: 6, // Desktop grande: margen medio
          }
        : {
            xs: 2, // Mobile: margen pequeño
            sm: 3, // Tablet pequeña: margen medio
            md: 4, // Tablet: margen moderado
            lg: 6, // Desktop: margen amplio
            xl: 8, // Desktop grande: margen grande
          },
      // ✅ Ancho ajustado para que el contenido no se extienda debajo del sidebar
      maxWidth: isSideBarOpen
        ? { xs: '100%', md: 'calc(100% - 250px)' }
        : '100%',
    }),
    [isSideBarOpen]
  );

  // ✅ OPTIMIZACIÓN: Combinar estilos finales solo cuando sea necesario
  const finalContainerStyles = React.useMemo(
    () => ({
      ...mainContainerStyles,
      ...dynamicStyles,
    }),
    [mainContainerStyles, dynamicStyles]
  );

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const hideOnlyInput = isMobile && !searchBarProps?.isProviderView;

  // Usar portal para que SearchSection siempre esté pegada al viewport y no se mueva con el layout
  return ReactDOM.createPortal(
    <Box sx={finalContainerStyles}>
      <Box sx={innerContainerStyles}>
        {/* ✅ USAR SearchBar EXISTENTE - Sin botón de filtros */}
        <SearchBar
          {...searchBarProps}
          hideTextInputOnMobile={hideOnlyInput}
          showFiltersButton={false}
        />
        {/* ✅ USAR CategoryNavigation EXISTENTE */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <CategoryNavigation {...categoryNavigationProps} />
        </Box>
      </Box>
    </Box>,
    typeof window !== 'undefined' ? document.body : null
  );
};

// ✅ MEJORA DE RENDIMIENTO: DisplayName para debugging
SearchSection.displayName = 'SearchSection';

export default SearchSection;
