// ✅ EDITAR AQUÍ PARA:
// - Cambiar comportamiento del botón flotante móvil
// - Modificar cuándo mostrar filtros desktop vs móvil
// - Ajustar posicionamiento del botón flotante

// 🔗 CONTIENE:
// - FilterPanel (desktop)
// - FilterPanel (móvil)
// - Botón flotante con badge

import React from 'react'
import { Fab, Badge, Box } from '@mui/material'
import FilterAltIcon from '@mui/icons-material/FilterAlt'
import FilterPanel from '../../../hooks/marketplace/FilterPanel'

/**
 * Componente que maneja los filtros tanto para desktop como mobile
 * Mantiene exactamente el mismo diseño y comportamiento que la implementación original
 */
const FilterSection = React.memo(
  ({
    shouldShowSearchBar,
    hayFiltrosActivos,
    handleToggleFiltro,
    desktopFilterProps,
    mobileFilterProps,
  }) => {
    return (
      <>
        {/* Floating button for mobile - shown only when search bar is hidden */}
        <Fab
          color="primary"
          onClick={handleToggleFiltro}
          sx={{
            position: 'fixed',
            bottom: 80,
            right: 20,
            zIndex: 1000,
            transition: 'all 0.3s ease',
            display: {
              xs: shouldShowSearchBar ? 'none' : 'flex',
              sm: shouldShowSearchBar ? 'none' : 'flex',
              md: 'none',
              lg: 'none',
              xl: 'none',
            },
          }}
        >
          <Badge color="error" variant="dot" invisible={!hayFiltrosActivos}>
            <FilterAltIcon />
          </Badge>
        </Fab>

        {/* Desktop FilterPanel */}
        <Box
          sx={{
            display: {
              xs: 'none',
              sm: 'none',
              md: 'block',
              lg: 'block',
              xl: 'block',
            },
          }}
        >
          <FilterPanel {...desktopFilterProps} />
        </Box>

        {/* Mobile FilterPanel */}
        <Box
          sx={{
            display: {
              xs: 'block',
              sm: 'block',
              md: 'none',
              lg: 'none',
              xl: 'none',
            },
          }}
        >
          <FilterPanel {...mobileFilterProps} />
        </Box>
      </>
    )
  }
)

FilterSection.displayName = 'FilterSection'

export default FilterSection
