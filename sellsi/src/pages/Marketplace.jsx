// ❌ NO EDITAR LÓGICA AQUÍ
// ✅ SOLO EDITAR PARA:
// - Cambiar el layout general
// - Agregar/quitar secciones
// - Modificar estilos del contenedor principal

import React from 'react'
import { Box } from '@mui/material'

// TopBar específico para Marketplace
import MarketplaceTopBar from '../components/MarketplaceTopBar.jsx'

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
    <Box>
      {/* TopBar específico para Marketplace */}
      <MarketplaceTopBar />

      {/* Contenido principal con margen para compensar TopBar fijo */}
      <Box
        sx={{ bgcolor: '#f8fafc', minHeight: '100vh', pt: { xs: 7, md: 8 } }}
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
