// ❌ NO EDITAR LÓGICA AQUÍ
// ✅ SOLO EDITAR PARA:
// - Cambiar el layout general
// - Agregar/quitar secciones
// - Modificar estilos del contenedor principal

import React from 'react';
import { Box } from '@mui/material';

// TopBar específico para Marketplace
import MarketplaceTopBar from '../../layout/MarketplaceTopBar.jsx';

// Sidebar específico para Buyer
import SidebarBuyer from '../../layout/SidebarBuyer.jsx';

// Hook centralizado
import useMarketplaceLogic from '../../../components/marketplace/useMarketplaceLogic.jsx';

// Componentes de secciones
import SearchSection from '../../../components/marketplace/sections/SearchSection.jsx';
import FilterSection from '../../../components/marketplace/sections/FilterSection.jsx';
import ProductsSection from '../../../components/marketplace/sections/ProductsSection.jsx';

const MarketplaceBuyer = () => {
  // ===== USAR CUSTOM HOOK PARA TODA LA LÓGICA =====
  const { searchSectionProps, filterSectionProps, productsSectionProps } =
    useMarketplaceLogic({
      hasSidebar: true, // Indicar que hay sidebar
      // ✅ Valores específicos para MarketplaceBuyer (más separación del borde)
      searchBarMarginLeft: {
        xs: 0,
        sm: 0,
        md: 0, // Más que Marketplace normal
        lg: -12.5, // Más que Marketplace normal
        xl: -12, // Más que Marketplace normal
      },
      categoryMarginLeft: {
        xs: 0,
        sm: 0,
        md: 0, // Más que SearchBar
        lg: -13.5, // Más que SearchBar
        xl: -13, // Más que SearchBar
      },
      // ✅ Nuevo: Margen del título "🛍️ Todos los Productos" para MarketplaceBuyer
      titleMarginLeft: {
        xs: 0,
        sm: 0,
        md: 0, // Ajustado para MarketplaceBuyer
        lg: 2, // Ajustado para MarketplaceBuyer
        xl: 3, // Ajustado para MarketplaceBuyer
      },
    });
  return (
    <Box>
      {/* TopBar específico para Marketplace */}
      <MarketplaceTopBar />
      {/* Sidebar específico para Buyer */}
      <SidebarBuyer />{' '}
      {/* Contenido principal con margen para compensar TopBar fijo y Sidebar */}
      <Box
        sx={{
          bgcolor: '#f8fafc',
          minHeight: '100vh',
          pt: { xs: 7, md: 8 },
          pl: { xs: '250px', md: '260px', lg: '0px', xl: '0px' }, // Responsive left margin for sidebar
        }}
      >
        {/* Sección de búsqueda y navegación */}
        <SearchSection {...searchSectionProps} /> {/* Sección de filtros */}
        <FilterSection {...filterSectionProps} filterPosition="right" />
        {/* Sección de productos */}
        <ProductsSection {...productsSectionProps} />
      </Box>
    </Box>
  );
};

export default MarketplaceBuyer;
