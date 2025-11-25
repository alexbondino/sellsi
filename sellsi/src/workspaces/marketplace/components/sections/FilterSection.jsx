// ✅ EDITAR AQUÍ PARA:
// - Cambiar comportamiento del botón flotante móvil
// - Modificar cuándo mostrar filtros desktop vs móvil
// - Ajustar posicionamiento del botón flotante

// 🔗 CONTIENE:
// - FilterPanel (desktop)
// - FilterPanel (móvil)
// - Botón flotante con badge

import React from 'react'
import FilterPanel from '../FilterPanel/FilterPanel'

/**
 * Componente que maneja los filtros tanto para desktop como mobile
 * ✅ MIGRACIÓN MÓVIL: FAB eliminado - funcionalidad transferida a SearchBar
 */
// ✅ MEJORA DE RENDIMIENTO: Memoización del componente
const FilterSection = React.memo(({
  hayFiltrosActivos,
  desktopFilterProps,
  filterPosition = 'left', // Nueva prop para controlar posición
  // ✅ NUEVAS PROPS: Para manejar estado móvil desde SearchBar
  isMobileOpen = false,
  onMobileClose = () => {},
}) => {
  return (
    <>
      {/* FilterPanel unificado - maneja responsive internamente */}
      <FilterPanel
        {...desktopFilterProps}
        filterPosition={filterPosition}
        isMobileOpen={isMobileOpen}
        onMobileClose={onMobileClose}
      />
    </>
  )
})

// ✅ MEJORA DE RENDIMIENTO: DisplayName para debugging
FilterSection.displayName = 'FilterSection'

export default FilterSection
