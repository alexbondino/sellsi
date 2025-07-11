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
// import FilterSection from '../marketplace/sections/FilterSection.jsx'; // Botón de filtros comentado
import ProductsSection from '../marketplace/sections/ProductsSection.jsx';

// ✅ MEJORA DE RENDIMIENTO: Memoización del componente principal
const MarketplaceBuyer = React.memo(() => {
  // ===== USAR CUSTOM HOOK PARA TODA LA LÓGICA =====
  // ✅ MEJORA DE RENDIMIENTO: Memoización de configuración estática
  const marketplaceConfig = React.useMemo(
    () => ({
      hasSideBar: true, // Indicar que hay SideBar
      // ✅ Ajustar para que no haya gap - eliminar márgenes negativos
      // Estos márgenes ya no son necesarios aquí si el componente padre (Main Box en App.jsx)
      // maneja el ml. Si los elementos internos necesitan ajustes, que sea relativo.
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
      // El padding-top debe ser consistente con la altura de la TopBar,
      // o ser 0 si el Box de App.jsx ya tiene un pt.
      pt: { xs: 7, md: 8 },
      // ❌ ELIMINADO: pl: '250px',
      // El `Box component="main"` en App.jsx ya maneja el `ml`
      // para la SideBar. Si necesitas un padding *interno* para el contenido
      // de esta página, usa un valor más general como `p: 3` en App.jsx,
      // o un padding más pequeño aquí que represente el espacio *dentro*
      // del área de contenido, no el desplazamiento de la sidebar.
      // Por ejemplo, si el App.jsx ya tiene `p:3`, no necesitas `pl` aquí.
      // Si `p:3` es insuficiente, podrías agregar `px: 3` (padding horizontal)
      // para un espaciado adicional.
      px: { xs: 2, md: 0, xl:20 }, // Ejemplo: Un padding horizontal general para el contenido interno
    }),
    []
  );

  return (
    <Box>
      {/* <MarketplaceTopBar /> */}{' '}
      {/* Esto debería ser manejado por TopBar en App.jsx */}
      {/* El Box padre en App.jsx (component="main") ya maneja el margen
          para compensar la TopBar y SideBar fija.
          Este Box simplemente define el contenido *dentro* de ese espacio. */}
      <Box sx={containerStyles}>
        {/* Sección de búsqueda y navegación */}
        <SearchSection {...searchSectionProps} />
        {/* Sección de filtros */}
        {/* <FilterSection {...filterSectionProps} filterPosition="right" /> */} {/* Botón de filtros comentado */}
        {/* Sección de productos */}
        <ProductsSection {...productsSectionProps} />
      </Box>
    </Box>
  );
});

// ✅ MEJORA DE RENDIMIENTO: DisplayName para debugging
MarketplaceBuyer.displayName = 'MarketplaceBuyer';

export default MarketplaceBuyer;
