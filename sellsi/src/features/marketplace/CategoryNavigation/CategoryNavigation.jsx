
// ✅ EDITAR AQUÍ PARA:
// - Agregar/quitar categorías
// - Cambiar diseño del menú dropdown
// - Modificar chips de categorías seleccionadas
// - Ajustar botones de secciones (Nuevos, Ofertas, etc.)

import React, { useState } from 'react';
import {
  Box,
  Button,
  Menu,
  MenuItem,
  Chip,
  Typography,
  Grow,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { SECTIONS, SECTION_LABELS } from '../marketplace/constants';
import { categoryNavigationStyles as styles } from '../hooks/CategoryNavigation/CategoryNavigation.styles';

// Definir categorías por defecto si no existe import
const CATEGORIAS = [
  'Tecnología',
  'Electrodomésticos',
  'Hogar',
  'Deportes',
  'Moda',
  'Juguetes',
  'Salud',
  'Belleza',
  'Automotriz',
  'Libros',
  'Mascotas',
  // Agrega o edita según tus necesidades
];

const CategoryNavigation = React.memo(({
  seccionActiva,
  categoriaSeleccionada,
  onSeccionChange,
  onCategoriaToggle,
  categoryMarginLeft = {
    xs: 0,
    sm: 0,
    md: 3,
    lg: 35.5,
    xl: 43,
  }, // Valores por defecto para Marketplace normal
  isProviderView = false, // ✅ NUEVO: Prop para ocultar elementos en vista de proveedores
}) => {
  // Estado local para el menú de categorías
  const [anchorElCategorias, setAnchorElCategorias] = useState(null);
  const [sectionsExpanded, setSectionsExpanded] = useState(false);
  const theme = useTheme();

  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Handlers locales para abrir/cerrar menú
  const handleOpenCategorias = (e) => {
    setAnchorElCategorias(e.currentTarget);
  };
  const handleCloseCategorias = () => {
    setAnchorElCategorias(null);
  };

  // ✅ MEJORA DE RENDIMIENTO: Memoización de handlers
  const handleCategoriaClick = React.useCallback(
    categoria => {
      console.time('CategoryNavigation:handleCategoriaClick');
      onCategoriaToggle(categoria);
      handleCloseCategorias();
      console.timeEnd('CategoryNavigation:handleCategoriaClick');
    },
    [onCategoriaToggle]
  );

  const handleSectionClick = React.useCallback(
    value => {
      console.time('CategoryNavigation:handleSectionClick');
      onSeccionChange(value);
      // Colapsar en móvil después de seleccionar
      if (isMobile) {
        setSectionsExpanded(false);
      }
      console.timeEnd('CategoryNavigation:handleSectionClick');
    },
    [onSeccionChange, isMobile]
  );

  const toggleSectionsExpanded = React.useCallback(
    () => {
      console.time('CategoryNavigation:toggleSectionsExpanded');
      setSectionsExpanded(!sectionsExpanded);
      console.timeEnd('CategoryNavigation:toggleSectionsExpanded');
    },
    [sectionsExpanded]
  );

  // ✅ MEJORA DE RENDIMIENTO: Memoización de estilos del contenedor principal
  const containerStyles = React.useMemo(
    () => ({
      ...styles.container,
      marginLeft: categoryMarginLeft, // ✅ Usar prop en lugar de valor fijo
    }),
    [categoryMarginLeft]
  );

  // ✅ MEJORA DE RENDIMIENTO: Memoización de la lista de categorías
  const categoriesWithAll = React.useMemo(() => ['Todas', ...CATEGORIAS], []);

  return (
    <Box sx={containerStyles}>
      {/* ✅ Ocultar todo el contenido en vista de proveedores */}
      {!isProviderView && (
        <>
          {/* Botón de categorías */}
          <Button
            endIcon={<ArrowDropDownIcon />}
            onClick={handleOpenCategorias}
            sx={styles.categoriesButton}
          >
            Categorías
          </Button>
          {/* Menu de categorías */}      <Menu
            anchorEl={anchorElCategorias}
            open={Boolean(anchorElCategorias)}
            onClose={handleCloseCategorias}
            disableScrollLock={true}
            PaperProps={{ sx: styles.categoriesMenu }}
          >
            {categoriesWithAll.map(categoria => {
              const isSelected = categoriaSeleccionada.includes(categoria);

              return (
                <MenuItem
                  key={categoria}
                  onClick={() => handleCategoriaClick(categoria)}
                  sx={styles.menuItem(isSelected)}
                >
                  {categoria}
                  {categoria === 'Tecnología' && (
                    <KeyboardArrowRightIcon fontSize="small" sx={{ ml: 'auto' }} />
                  )}
                  {categoria === 'Todas' && isSelected && (
                    <Box sx={styles.selectedIndicator} />
                  )}
                </MenuItem>
              );
            })}
          </Menu>{' '}
          {/* Navegación de secciones */}
          {/* En desktop: mostrar todos los botones */}
          {!isMobile && (
            <>
              {Object.entries(SECTIONS)
                .filter(([key, value]) =>
                  !['OFERTAS', 'TOP_VENTAS'].includes(key)
                )
                .map(([key, value]) => (
                  <Button
                    key={value}
                    onClick={() => handleSectionClick(value)}
                    sx={styles.sectionButton(seccionActiva === value)}
                  >
                    {SECTION_LABELS[value]}
                  </Button>
                ))}
            </>
          )}
          {/* En móvil: botón colapsible */}
          {isMobile && (
            <Box>
              {/* Botón principal para expandir/colapsar */}
              <Button
                endIcon={sectionsExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                onClick={toggleSectionsExpanded}
                sx={{
                  ...styles.categoriesButton,
                  fontSize: '0.9rem',
                  px: 2,
                }}
              >
                Secciones
              </Button>

              {/* Botones expandidos con animación */}
              <Grow in={sectionsExpanded} timeout={300}>
                <Box
                  sx={{
                    display: sectionsExpanded ? 'flex' : 'none',
                    flexDirection: 'column',
                    gap: 1,
                    mt: 1,
                    p: 1,
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    borderRadius: 2,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    position: 'absolute',
                    zIndex: 1000,
                    minWidth: '200px',
                  }}
                >
                  {Object.entries(SECTIONS)
                    .filter(([key, value]) =>
                      !['OFERTAS', 'TOP_VENTAS'].includes(key)
                    )
                    .map(([key, value]) => (
                      <Button
                        key={value}
                        onClick={() => handleSectionClick(value)}
                        sx={{
                          ...styles.sectionButton(seccionActiva === value),
                          justifyContent: 'flex-start',
                          px: 2,
                          py: 1.5,
                          fontSize: '0.85rem',
                        }}
                      >
                        {SECTION_LABELS[value]}
                      </Button>
                    ))}
                </Box>
              </Grow>
            </Box>
          )}
          {/* Chips de categorías seleccionadas */}
          {categoriaSeleccionada
            .filter(cat => cat !== 'Todas')
            .slice(0, 3)
            .map(cat => (
              <Chip
                key={cat}
                label={cat}
                onDelete={() => onCategoriaToggle(cat)}
                size="small"
                color="primary"
                variant="outlined"
                sx={styles.categoryChip}
              />
            ))}
          {categoriaSeleccionada.filter(cat => cat !== 'Todas').length > 3 && (
            <Typography variant="caption" sx={styles.moreCategories}>
              +{categoriaSeleccionada.filter(cat => cat !== 'Todas').length - 3} más
            </Typography>
          )}
        </>
      )}
    </Box>
  );
});

// ✅ OPTIMIZACIÓN: DisplayName para debugging
CategoryNavigation.displayName = 'CategoryNavigation';

export default CategoryNavigation;
