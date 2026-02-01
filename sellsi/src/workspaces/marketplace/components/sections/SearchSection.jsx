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
import { categoryNavigationStyles as catStyles } from '../CategoryNavigation/CategoryNavigation.styles';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import { Button, Tooltip } from '@mui/material';

/**
 * Componente que encapsula la barra de búsqueda y navegación de categorías
 * ✅ OPTIMIZADO: Solo maneja su propia visibilidad sin afectar otros componentes
 */
// ✅ MEJORA DE RENDIMIENTO: Memoización del componente con comparación personalizada
const SearchSection = React.memo(({
  shouldShowSearchBar, // Solo afecta a este componente
  searchBarProps,
  categoryNavigationProps,
  hasSideBar = false, // (No se usará para el layout, solo para lógica futura si se requiere)
}) => {
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
        left: 0, // SIEMPRE pegado a la izquierda
        right: 0,
        width: { xs: '100vw', sm: '100vw', md: '100vw', lg: '100vw', xl: '100%' }, // 100vw en md/lg, 100% en xl
        zIndex: 1,
        display: 'flex',
        justifyContent: 'center',
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

    // ✅ MEJORA DE RENDIMIENTO: Memoización de estilos del contenedor interno - Estáticos
    const innerContainerStyles = React.useMemo(
      () => ({
        width: '100%',
        maxWidth: {
          xs: '100%', // Mobile ocupa todo el ancho
          sm: '720px',
          md: '960px',
          lg: '1280px',
          xl: '1700px',
        },
        py: { xs: 0.5, md: 1 }, // Padding vertical 0 en mobile, 1 en md+
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

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'));
  // Hide only the text input on small screens (xs, sm) when not in provider view
  const hideOnlyInput = isSmall && !searchBarProps?.isProviderView;

  // Extraer control de vista de searchBarProps para renderizarlo fuera del 40%
  const { isProviderView, onToggleProviderView } = searchBarProps || {};

  // Usar portal para que SearchSection siempre esté pegada al viewport y no se mueva con el layout
    return ReactDOM.createPortal(
      <Box sx={finalContainerStyles}>
        {/* Contenedor con dos filas: fila superior (search + ordenamiento + proveedor) y fila inferior (categorías) */}
        <Box sx={{ ...innerContainerStyles, display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: 1 }}>
            {/* Fila 1: SearchBar + selector de categorías (botón Categorías/Despacho) + botón Productos/Proveedores */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
              {/* Left column: Search area. md:50%, lg:40% */}
              <Box sx={{ width: { xs: '55%', sm: '55%', md: '65%', lg: '50%', xl: '40%' }, display: 'flex', alignItems: 'center' }}>
                <SearchBar {...searchBarProps} hideTextInputOnMobile={hideOnlyInput} />
              </Box>

              {/* Right column: controls (md:50%, lg:60%) */}
              <Box sx={{ width: { xs: '45%', sm: '45%', md: '35%', lg: '50%', xl: '60%' }, display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: { xs: 0, sm: 0.25, md: 1 } }}>
                {/* Botón Productos/Proveedores (outline con icono) */}
                {onToggleProviderView && (
                  <Box sx={{ display: { xs: 'block', md: 'block' }, ml: { xs: 0, sm: 0, md: 1 }, flexShrink: 0 }}>
                    <Tooltip title="Alternar vista entre Productos y Proveedores disponibles.">
                      <span>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={onToggleProviderView}
                          startIcon={<VisibilityIcon />}
                          sx={{
                            ...catStyles.categoriesButton,
                            borderWidth: 1,
                            borderStyle: 'solid',
                            borderColor: '#000',
                            color: '#000',
                            height: '36px',
                            minWidth: 'auto',
                          }}
                          aria-pressed={isProviderView}
                        >
                          {isProviderView ? 'Ver Productos' : 'Ver Proveedores'}
                        </Button>
                      </span>
                    </Tooltip>
                  </Box>
                )}
              </Box>
            </Box>
          </Box>

          {/* Fila de categorías (segunda fila): navegación completa */}
          <Box sx={{ mt: 0 }}>
            <CategoryNavigation {...categoryNavigationProps} />
          </Box>
        </Box>
      </Box>,
      typeof window !== 'undefined' ? document.body : null
    );
});

// ✅ MEJORA DE RENDIMIENTO: DisplayName para debugging
SearchSection.displayName = 'SearchSection';

export default SearchSection;
