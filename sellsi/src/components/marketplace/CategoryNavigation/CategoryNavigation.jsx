// ✅ EDITAR AQUÍ PARA:
// - Agregar/quitar categorías
// - Cambiar diseño del menú dropdown
// - Modificar chips de categorías seleccionadas
// - Ajustar botones de secciones (Nuevos, Ofertas, etc.)

import React from 'react'
import { Box, Button, Menu, MenuItem, Chip, Typography } from '@mui/material'
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight'
import { CATEGORIAS } from '../../../data/marketplace/products'
import { SECTIONS, SECTION_LABELS } from '../../../utils/marketplace/constants'
import { categoryNavigationStyles as styles } from '../../../hooks/marketplace/CategoryNavigation/CategoryNavigation.styles'

const CategoryNavigation = ({
  seccionActiva,
  categoriaSeleccionada,
  anchorElCategorias,
  onSeccionChange,
  onCategoriaToggle,
  onOpenCategorias,
  onCloseCategorias,
}) => {
  const handleCategoriaClick = (categoria) => {
    onCategoriaToggle(categoria)
    onCloseCategorias()
  }

  return (
    <Box sx={styles.container}>
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
        {['Todas', ...CATEGORIAS].map((categoria) => {
          const isSelected = categoriaSeleccionada.includes(categoria)

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
          )
        })}
      </Menu>

      {/* Navegación de secciones */}
      {Object.entries(SECTIONS).map(([key, value]) => (
        <Button
          key={value}
          onClick={() => onSeccionChange(value)}
          sx={styles.sectionButton(seccionActiva === value)}
        >
          {SECTION_LABELS[value]}
        </Button>
      ))}

      {/* Chips de categorías seleccionadas */}
      {categoriaSeleccionada
        .filter((cat) => cat !== 'Todas')
        .slice(0, 3)
        .map((cat) => (
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

      {categoriaSeleccionada.filter((cat) => cat !== 'Todas').length > 3 && (
        <Typography variant="caption" sx={styles.moreCategories}>
          +{categoriaSeleccionada.filter((cat) => cat !== 'Todas').length - 3}{' '}
          más
        </Typography>
      )}
    </Box>
  )
}

export default React.memo(CategoryNavigation)
