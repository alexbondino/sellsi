// ❌ NO EDITAR LÓGICA AQUÍ
// ✅ SOLO EDITAR PARA:
// - Cambiar el layout general
// - Agregar/quitar secciones
// - Modificar estilos del contenedor principal

import React from 'react'
import { Box } from '@mui/material'

// Hook centralizado
import useMarketplaceLogic from '../components/marketplace/useMarketplaceLogic.jsx'

// Componentes de secciones
import SearchSection from '../components/marketplace/sections/SearchSection.jsx'
import FilterSection from '../components/marketplace/sections/FilterSection.jsx'
import ProductsSection from '../components/marketplace/sections/ProductsSection.jsx'

const Marketplace = () => {
  // ===== USAR CUSTOM HOOK PARA TODA LA LÓGICA =====
  const { searchSectionProps, filterSectionProps, productsSectionProps } =
    useMarketplaceLogic()

  return (
    <Box sx={{ bgcolor: '#f8fafc', minHeight: '100vh' }}>
      {/* Sección de búsqueda y navegación */}
      <SearchSection {...searchSectionProps} />

      {/* Sección de filtros */}
      <FilterSection {...filterSectionProps} />

      {/* Sección de productos */}
      <ProductsSection {...productsSectionProps} />
    </Box>
  )
}

export default React.memo(Marketplace)
