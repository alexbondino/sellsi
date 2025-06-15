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
import FilterPanel from '../FilterPanel/FilterPanel'

/**
 * Componente que maneja los filtros tanto para desktop como mobile
 * Mantiene exactamente el mismo diseño y comportamiento que la implementación original
 */
// ✅ MEJORA DE RENDIMIENTO: Memoización del componente
const FilterSection = React.memo(({
  shouldShowSearchBar,
  hayFiltrosActivos,
  handleToggleFiltro,
  desktopFilterProps,
  mobileFilterProps,
  filterPosition = 'left', // Nueva prop para controlar posición
}) => {
  // ✅ MEJORA DE RENDIMIENTO: Memoización de estilos del FAB
  const fabStyles = React.useMemo(() => ({
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
  }), [shouldShowSearchBar])

  return (
    <>
      {/* Floating button for mobile - shown only when search bar is hidden */}
      <Fab
        color="primary"
        onClick={handleToggleFiltro}
        sx={fabStyles}
      >
        <Badge color="error" variant="dot" invisible={!hayFiltrosActivos}>
          <FilterAltIcon />
        </Badge>
      </Fab>
      {/* FilterPanel unificado - maneja responsive internamente */}
      <FilterPanel {...desktopFilterProps} filterPosition={filterPosition} />
    </>
  )
})

// ✅ MEJORA DE RENDIMIENTO: DisplayName para debugging
FilterSection.displayName = 'FilterSection'

export default FilterSection
