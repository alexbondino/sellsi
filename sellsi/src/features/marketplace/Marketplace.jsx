// ❌ NO EDITAR LÓGICA AQUÍ
// ✅ SOLO EDITAR PARA:
// - Cambiar el layout general
// - Agregar/quitar secciones
// - Modificar estilos del contenedor principal

import React from 'react'
import { Box } from '@mui/material'

// Hook centralizado
import useMarketplaceLogic from './useMarketplaceLogic.jsx'

// Componentes de secciones
import SearchSection from './sections/SearchSection.jsx'
import FilterSection from './sections/FilterSection.jsx'
import ProductsSection from './sections/ProductsSection.jsx'

const Marketplace = () => {
  // ===== USAR CUSTOM HOOK PARA TODA LA LÓGICA =====
  const { searchSectionProps, filterSectionProps, productsSectionProps } =
    useMarketplaceLogic({
      hasSidebar: false, // Indicar que NO hay sidebar
      // ✅ Valores específicos para Marketplace (mover más a la izquierda)
      searchBarMarginLeft: {
        xs: 0,
        sm: 0,
        md: -5,
        lg: 3,
        xl: 3,
      },
      categoryMarginLeft: {
        xs: 0,
        sm: 0,
        md: -5,
        lg: 2,
        xl: 2,
      },
      // ✅ Nuevo: Margen del título "🛍️ Todos los Productos"
      titleMarginLeft: {
        xs: 0,
        sm: 0,
        md: 0,
        lg: 2,
        xl: 3,
      },
    })
  // Configuración de botones de navegación (sin botones para Marketplace)
  const navigationButtons = []

  // Configuración de botones de autenticación (usa defaults)
  const authButtons = {}

  // Función de navegación (placeholder)
  const handleNavigate = (ref) => {
    console.log('Navegando a:', ref)
    // TODO: Implementar navegación si es necesario
  }

  return (
    <Box>
      {/* TopBar eliminada, ahora la maneja App.jsx globalmente */}
      {/* Contenido principal con margen para compensar TopBar fijo (SIN sidebar) */}
      <Box
        sx={{
          bgcolor: '#f8fafc',
          minHeight: '100vh',
          pt: { xs: 7, md: 8 },
        }}
      >
        {/* Sección de búsqueda y navegación */}
        <SearchSection {...searchSectionProps} />

        {/* Sección de filtros */}
        <FilterSection {...filterSectionProps} />

        {/* Sección de productos */}
        <ProductsSection {...productsSectionProps} />
      </Box>
    </Box>
  )
}

export default Marketplace
