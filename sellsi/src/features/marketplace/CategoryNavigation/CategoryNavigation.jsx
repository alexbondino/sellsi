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
import { CATEGORIAS } from '../products';
import { SECTIONS, SECTION_LABELS } from '../marketplace/constants';
import { categoryNavigationStyles as styles } from '../hooks/CategoryNavigation/CategoryNavigation.styles';

const CategoryNavigation = ({
  seccionActiva,
  categoriaSeleccionada,
  anchorElCategorias,
  onSeccionChange,
  onCategoriaToggle,
  onOpenCategorias,
  onCloseCategorias,
  categoryMarginLeft = {
    xs: 0,
    sm: 0,
    md: 3,
    lg: 35.5,
    xl: 43,
  }, // Valores por defecto para Marketplace normal
}) => {
  const [sectionsExpanded, setSectionsExpanded] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleCategoriaClick = categoria => {
    onCategoriaToggle(categoria);
    onCloseCategorias();
  };

  const handleSectionClick = value => {
    onSeccionChange(value);
    // Colapsar en móvil después de seleccionar
    if (isMobile) {
      setSectionsExpanded(false);
    }
  };

  const toggleSectionsExpanded = () => {
    setSectionsExpanded(!sectionsExpanded);
  };
  return (
    <Box
      sx={{
        ...styles.container,
        marginLeft: categoryMarginLeft, // ✅ Usar prop en lugar de valor fijo
      }}
    >
      {/* Botón de categorías */}
      <Button
        endIcon={<ArrowDropDownIcon />}
        onClick={onOpenCategorias}
        sx={styles.categoriesButton}
      >
        Categorías
      </Button>
      {/* Menu de categorías */}
      <Menu
        anchorEl={anchorElCategorias}
        open={Boolean(anchorElCategorias)}
        onClose={onCloseCategorias}
        PaperProps={{ sx: styles.categoriesMenu }}
      >
        {['Todas', ...CATEGORIAS].map(categoria => {
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
          {Object.entries(SECTIONS).map(([key, value]) => (
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
              {Object.entries(SECTIONS).map(([key, value]) => (
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
    </Box>
  );
};

export default React.memo(CategoryNavigation);
