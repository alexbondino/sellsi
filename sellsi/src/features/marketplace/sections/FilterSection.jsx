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
 * ✅ DESACOPLADO: Ya no depende del estado de SearchBar para mostrar el FAB móvil
 */
// ✅ MEJORA DE RENDIMIENTO: Memoización del componente
const FilterSection = React.memo(({
  // shouldShowSearchBar removido - ya no necesario
  hayFiltrosActivos,
  desktopFilterProps,
  filterPosition = 'left', // Nueva prop para controlar posición
}) => {  // ✅ FAB SIEMPRE VISIBLE: Mejor UX independiente del estado de SearchBar
  const fabStyles = React.useMemo(() => ({
    position: 'fixed',
    bottom: 80,
    right: 20,
    zIndex: 1000,
    transition: 'all 0.3s ease',
    display: {
      xs: 'flex', // Siempre visible en móvil
      sm: 'flex', // Siempre visible en tablet
      md: 'none', // Oculto en desktop (usa panel lateral)
      lg: 'none',
      xl: 'none',
    },
  }), []) // Sin dependencias - completamente estático

  // Handler local para abrir el panel móvil
  const [open, setOpen] = React.useState(false);
  const handleOpenMobile = React.useCallback(() => setOpen(true), []);
  const handleCloseMobile = React.useCallback(() => setOpen(false), []);

  return (
    <>
      {/* Floating button for mobile - siempre disponible para mejor UX */}
      <Fab
        color="primary"
        onClick={handleOpenMobile}
        sx={fabStyles}
      >
        <Badge color="error" variant="dot" invisible={!hayFiltrosActivos}>
          <FilterAltIcon />
        </Badge>
      </Fab>
      {/* FilterPanel unificado - maneja responsive internamente */}
      <FilterPanel
        {...desktopFilterProps}
        filterPosition={filterPosition}
        isMobileOpen={open}
        onMobileClose={handleCloseMobile}
      />
    </>
  )
})

// ✅ MEJORA DE RENDIMIENTO: DisplayName para debugging
FilterSection.displayName = 'FilterSection'

export default FilterSection
