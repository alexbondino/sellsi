// ❌ NO EDITAR LÓGICA AQUÍ
// ✅ SOLO EDITAR PARA:
// - Cambiar el layout general
// - Agregar/quitar secciones
// - Modificar estilos del contenedor principal

import React, { useState, useEffect } from 'react';
import { Box } from '@mui/material';

// Hook centralizado
// 🔄 Migrado: usar hook compartido parametrizable
import { useMarketplaceLogic } from '../../../shared/hooks';

// Componentes de secciones
import SearchSection from '../components/sections/SearchSection.jsx';
// import FilterSection from '../components/sections/FilterSection.jsx'; // Botón de filtros comentado
import ProductsSection from '../components/sections/ProductsSection.jsx';

// ✅ MEJORA DE RENDIMIENTO: Memoización del componente principal
const Marketplace = React.memo(({ hasSideBar = false }) => {
  // ✅ ELIMINADO: Login modal duplicado - ahora se gestiona centralmente desde TopBar

  // ===== USAR CUSTOM HOOK PARA TODA LA LÓGICA =====
  // ✅ MEJORA DE RENDIMIENTO: Memoización de configuración estática
  const marketplaceConfig = React.useMemo(
    () => ({
      hasSideBar, // Parametrizable: con o sin SideBar
      // ✅ Valores específicos para Marketplace (ajustados según hasSideBar)
      searchBarMarginLeft: hasSideBar
        ? { xs: 0, sm: 0, md: 0, lg: 0, xl: 0 }
        : { xs: 0, sm: 0, md: -5, lg: 3, xl: 3 },
      categoryMarginLeft: hasSideBar
        ? { xs: 0, sm: 0, md: 0, lg: 0, xl: 0 }
        : { xs: 0, sm: 0, md: -5, lg: 2, xl: 2 },
      // ✅ Nuevo: Margen del título "🛍️ Todos los Productos"
      titleMarginLeft: hasSideBar
        ? { xs: 0, sm: 0, md: 0, lg: 0, xl: 0 }
        : { xs: 0, sm: 0, md: 0, lg: 2, xl: 3 },
    }),
    [hasSideBar]
  );

  const { searchSectionProps, filterSectionProps, productsSectionProps } =
    useMarketplaceLogic({
      ...marketplaceConfig,
      clearSearchOnViewToggle: true,
    });

  // ✅ MEJORA DE RENDIMIENTO: Memoización de configuración estática
  // Configuración de botones de navegación (sin botones para Marketplace)
  const navigationButtons = React.useMemo(() => [], []);

  // Configuración de botones de autenticación (usa defaults)
  const authButtons = React.useMemo(() => ({}), []);

  // ✅ MEJORA DE RENDIMIENTO: Memoización de handler de navegación
  const handleNavigate = React.useCallback(ref => {
    // Eliminado log de desarrollo
    // TODO: Implementar navegación si es necesario
  }, []);

  // ✅ MEJORA DE RENDIMIENTO: Memoización de estilos del contenedor principal
  const containerStyles = React.useMemo(
    () => ({
      bgcolor: '#f8fafc',
      minHeight: '100vh',
      pt: { xs: 7, md: 8 },
      // ✅ RESPONSIVIDAD: Márgenes adaptativos según hasSideBar
      px: hasSideBar
        ? {
            xs: 2, // Mobile: margen pequeño
            sm: 3, // Tablet pequeña: margen medio
            md: 4, // Tablet: margen moderado
            lg: 6, // Desktop: margen amplio
            xl: 20, // Desktop grande: margen máximo
          }
        : { xs: 2, sm: 3, md: 4, lg: 6, xl: 8 }, // Sin sidebar: márgenes más pequeños
      pb: { xs: 3, md: 4 },
    }),
    [hasSideBar]
  );
  return (
    <Box>
      {/* TopBar eliminada, ahora la maneja App.jsx globalmente */}
      {/* Contenido principal con margen para compensar TopBar fijo (SIN SideBar) */}
      <Box sx={containerStyles}>
        {/* Sección de búsqueda y navegación */}
        <SearchSection {...searchSectionProps} />
        {/* Sección de filtros */}
        {/* <FilterSection {...filterSectionProps} /> */}{' '}
        {/* Botón de filtros comentado */}
        {/* Sección de productos */}
        <ProductsSection {...productsSectionProps} />
      </Box>
      {/* ✅ ELIMINADO: Login modal duplicado - ahora se gestiona centralmente desde TopBar */}
    </Box>
  );
});

// ✅ MEJORA DE RENDIMIENTO: DisplayName para debugging
Marketplace.displayName = 'Marketplace';

export default Marketplace;
