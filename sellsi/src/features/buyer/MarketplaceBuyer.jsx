// ❌ NO EDITAR LÓGICA AQUÍ
// ✅ SOLO EDITAR PARA:
// - Cambiar el layout general
// - Agregar/quitar secciones
// - Modificar estilos del contenedor principal

import React from 'react';
import { Box } from '@mui/material';

// Hook centralizado
import useMarketplaceLogic from '../marketplace/useMarketplaceLogic.jsx';

// Componentes de secciones
import SearchSection from '../marketplace/sections/SearchSection.jsx';
import FilterSection from '../marketplace/sections/FilterSection.jsx';
import ProductsSection from '../marketplace/sections/ProductsSection.jsx';

// ✅ MEJORA DE RENDIMIENTO: Memoización del componente principal
const MarketplaceBuyer = React.memo(() => {
  // ===== USAR CUSTOM HOOK PARA TODA LA LÓGICA =====
  // ✅ MEJORA DE RENDIMIENTO: Memoización de configuración estática
  const marketplaceConfig = React.useMemo(
    () => ({
      hasSideBar: true, // Indicar que hay SideBar
      // ✅ Ajustar para que no haya gap - eliminar márgenes negativos
      searchBarMarginLeft: {
        xs: 0,
        sm: 0,
        md: 0,
        lg: 0,
        xl: 0,
      },
      categoryMarginLeft: {
        xs: 0,
        sm: 0,
        md: 0,
        lg: 0,
        xl: 0,
      },
      // ✅ Margen del título sin espacios extra
      titleMarginLeft: {
        xs: 0,
        sm: 0,
        md: 0,
        lg: 0,
        xl: 0,
      },
    }),
    []
  );

  const { searchSectionProps, filterSectionProps, productsSectionProps } =
    useMarketplaceLogic(marketplaceConfig);

  // ✅ MEJORA DE RENDIMIENTO: Memoización de estilos del contenedor principal
  const containerStyles = React.useMemo(
    () => ({
      bgcolor: '#f8fafc',
      minHeight: '100vh',
      pt: { xs: 7, md: 8 },
      pl: '210px', // Exactamente el ancho del SideBar (210px) sin gap
    }),
    []
  );

  return (
    <Box>
      {/* <MarketplaceTopBar /> */}{' '}
      {/* Contenido principal con margen para compensar TopBar fijo y SideBar */}
      <Box sx={containerStyles}>
        {/* Sección de búsqueda y navegación */}
        <SearchSection {...searchSectionProps} /> {/* Sección de filtros */}
        <FilterSection {...filterSectionProps} filterPosition="right" />
        {/* Sección de productos */}
        <ProductsSection {...productsSectionProps} />
      </Box>
    </Box>
  );
});

// ✅ MEJORA DE RENDIMIENTO: DisplayName para debugging
MarketplaceBuyer.displayName = 'MarketplaceBuyer';

export default MarketplaceBuyer;
