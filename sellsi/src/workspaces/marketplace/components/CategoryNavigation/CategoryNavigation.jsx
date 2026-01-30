
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
  Tooltip,
} from '@mui/material';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { SECTIONS, SECTION_LABELS } from '../constants';
import { categoryNavigationStyles as styles } from './CategoryNavigation.styles';
import { regiones as REGION_OPTIONS } from '../../../../utils/chileData';

// Categorías estandarizadas
export const CATEGORIAS = [
  'Tabaquería',
  'Alcoholes',
  'Ferretería y Construcción',
  'Gastronomía',
  'Otros',
];

const CategoryNavigation = React.memo(({
  seccionActiva,
  categoriaSeleccionada,
  onSeccionChange,
  onCategoriaToggle,
  onOpenShippingFilter,
  selectedShippingRegions = [],
  categoryMarginLeft = {
    xs: 0,
    sm: 0,
    md: 3,
    lg: 35.5,
    xl: 43,
  }, // Valores por defecto para Marketplace normal
  isProviderView = false, // ✅ NUEVO: Prop para ocultar elementos en vista de proveedores
  resetFiltros, // ✅ NUEVO: Para resetear todos los filtros
  // NUEVA PROP: Si true, renderiza solo el botón/selector de Categorías+Despacho (útil para colocarlo en la fila superior)
  onlySelector = false,
}) => {
  // Estado local para el menú de categorías
  const [anchorElCategorias, setAnchorElCategorias] = useState(null);
  // Estado local para el menú de despacho
  const [anchorElDespacho, setAnchorElDespacho] = useState(null);
  const [sectionsExpanded, setSectionsExpanded] = useState(false);
  const theme = useTheme();

  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Resolver etiqueta legible de la región seleccionada
  const selectedRegionLabels = React.useMemo(() => {
    if (!Array.isArray(selectedShippingRegions) || selectedShippingRegions.length === 0) return [];
    return selectedShippingRegions.map(val => {
      const found = REGION_OPTIONS.find(r => r.value === val);
      return { value: val, label: found ? found.label : val };
    });
  }, [selectedShippingRegions]);

  // Handlers locales para abrir/cerrar menú
  const handleOpenCategorias = (e) => {
    setAnchorElCategorias(e.currentTarget);
  };
  const handleCloseCategorias = () => {
    setAnchorElCategorias(null);
  };

  const handleOpenDespacho = (e) => {
    setAnchorElDespacho(e.currentTarget);
  };
  const handleCloseDespacho = () => {
    setAnchorElDespacho(null);
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
      
      // Si se hace clic en "Todos los Productos", resetear todos los filtros
      if (value === 'todos' && resetFiltros) {
        resetFiltros();
      } else {
        onSeccionChange(value);
      }
      
      // Colapsar en móvil después de seleccionar
      if (isMobile) {
        setSectionsExpanded(false);
      }
      console.timeEnd('CategoryNavigation:handleSectionClick');
    },
    [onSeccionChange, isMobile, resetFiltros]
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
          {/* Si onlySelector=true renderizamos únicamente los botones de Categorías y Despacho (útil para la fila 1) */}
          <Button
            endIcon={<ArrowDropDownIcon />}
            onClick={handleOpenCategorias}
            sx={styles.categoriesButton}
            aria-controls={anchorElCategorias ? 'categorias-menu' : undefined}
            aria-haspopup="true"
          >
            Categorías
          </Button>

          <Box sx={{ display: 'inline-flex', ml: 1 }}>
            <Button
              endIcon={<ArrowDropDownIcon />}
              onClick={handleOpenDespacho}
              sx={styles.categoriesButton}
              aria-label={`Filtrar por Despacho: ${
                (Array.isArray(selectedRegionLabels) && selectedRegionLabels.length > 0)
                  ? selectedRegionLabels.map(s => s.label).join(', ')
                  : 'Todas'
              }`}
              aria-controls={anchorElDespacho ? 'despacho-menu' : undefined}
              aria-haspopup="true"
            >
              Despacho
            </Button>
          </Box>

          {/* Menús compartidos (siempre los necesitamos aunque solo se muestre el selector) */}
          <Menu
            id="despacho-menu"
            anchorEl={anchorElDespacho}
            open={Boolean(anchorElDespacho)}
            onClose={handleCloseDespacho}
            disableScrollLock={true}
            PaperProps={{ sx: styles.categoriesMenu }}
          >
            <MenuItem
              key="todas"
              onClick={() => {
                if (onOpenShippingFilter) onOpenShippingFilter(null);
                handleCloseDespacho();
              }}
              sx={styles.menuItem(!Array.isArray(selectedShippingRegions) || selectedShippingRegions.length === 0)}
            >
              Todas
              {(!Array.isArray(selectedShippingRegions) || selectedShippingRegions.length === 0) && (
                <Box sx={styles.selectedIndicator} />
              )}
            </MenuItem>

            {REGION_OPTIONS.map(r => {
              const isSelected = Array.isArray(selectedShippingRegions) && selectedShippingRegions.includes(r.value);
              return (
                <MenuItem
                  key={r.value}
                  onClick={() => {
                    if (onOpenShippingFilter) onOpenShippingFilter(r.value);
                    handleCloseDespacho();
                  }}
                  sx={styles.menuItem(isSelected)}
                >
                  {r.label}
                  {isSelected && (
                    <Box sx={styles.selectedIndicator} />
                  )}
                </MenuItem>
              )
            })}
          </Menu>

          <Menu
            id="categorias-menu"
            anchorEl={anchorElCategorias}
            open={Boolean(anchorElCategorias)}
            onClose={handleCloseCategorias}
            disableScrollLock={true}
            PaperProps={{ sx: styles.categoriesMenu }}
          >
            {categoriesWithAll.map(categoria => {
              const isSelected = categoriaSeleccionada === categoria;

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
                  {isSelected && (
                    <Box sx={styles.selectedIndicator} />
                  )}
                </MenuItem>
              );
            })}
          </Menu>

          {/* Si onlySelector es true, devolvemos solo los selectores y salimos */}
          {onlySelector && (
            <>
              {/* También renderizamos el chip de categoría seleccionada si aplica */}
              {categoriaSeleccionada && categoriaSeleccionada !== 'Todas' && (
                <Chip
                  label={`Categoría: ${categoriaSeleccionada}`}
                  onDelete={() => onCategoriaToggle('Todas')}
                  size="small"
                  color="primary"
                  variant="outlined"
                  sx={styles.categoryChip}
                />
              )}
            </>
          )}

          {/* Si onlySelector es falso, renderizamos el resto de la navegación (secciones, mobile expand, etc.) */}
          {!onlySelector && (
            <>
              {/* Navegación de secciones */}
              {!isMobile && (
                <>
                  {Object.entries(SECTIONS)
                    .filter(([key, value]) =>
                      !['OFERTAS', 'TOP_VENTAS', 'NUEVOS'].includes(key)
                    )
                    .map(([key, value]) => (
                      <Button
                        key={value}
                        onClick={() => handleSectionClick(value)}
                        sx={styles.sectionButton(seccionActiva === value)}
                        aria-pressed={seccionActiva === value}
                        aria-current={seccionActiva === value ? 'true' : undefined}
                      >
                        {SECTION_LABELS[value]}
                      </Button>
                    ))}
                </>
              )}

              {isMobile && (
                <Box>
                  <Button
                    endIcon={sectionsExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    onClick={toggleSectionsExpanded}
                    sx={styles.categoriesButton}
                  >
                    Secciones
                  </Button>

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
                        left: '45%',
                        transform: 'translateX(-50%)',
                      }}
                    >
                      {Object.entries(SECTIONS)
                        .filter(([key, value]) =>
                          !['OFERTAS', 'TOP_VENTAS', 'NUEVOS'].includes(key)
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
                            aria-pressed={seccionActiva === value}
                            aria-current={seccionActiva === value ? 'true' : undefined}
                          >
                            {SECTION_LABELS[value]}
                          </Button>
                        ))}
                    </Box>
                  </Grow>
                </Box>
              )}

              {/* Chip de categoría seleccionada */}
              {categoriaSeleccionada && categoriaSeleccionada !== 'Todas' && (
                <Chip
                  label={`Categoría: ${categoriaSeleccionada}`}
                  onDelete={() => onCategoriaToggle('Todas')}
                  size="small"
                  color="primary"
                  variant="outlined"
                  sx={styles.categoryChip}
                />
              )}
            </>
          )}
        </>
      )}
    </Box>
  );
});

// ✅ OPTIMIZACIÓN: DisplayName para debugging
CategoryNavigation.displayName = 'CategoryNavigation';

export default CategoryNavigation;
