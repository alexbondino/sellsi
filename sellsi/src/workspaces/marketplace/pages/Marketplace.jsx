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
import { useLayout } from '../../../infrastructure/providers';

// Componentes de secciones
import SearchSection from '../components/sections/SearchSection.jsx';
// import FilterSection from '../components/sections/FilterSection.jsx'; // Botón de filtros comentado
import ProductsSection from '../components/sections/ProductsSection.jsx';

// ✅ MEJORA DE RENDIMIENTO: Memoización del componente principal
const Marketplace = React.memo(({ hasSideBar = false }) => {
  // ✅ Obtener estado del sidebar desde LayoutProvider
  const { sideBarCollapsed } = useLayout();

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
      // Con sidebar: márgenes simétricos más reducidos para compensar el espacio ocupado
      // Sin sidebar: márgenes más amplios ya que hay más espacio disponible
      px: hasSideBar
        ? {
            xs: 1, // ✅ MOBILE FIX: Sin padding para maximizar espacio de cards
            sm: 1.5, // Tablet pequeña: margen reducido
            md: 3, // Tablet: margen moderado
            lg: 4, // Desktop: margen compacto
            xl: 6, // Desktop grande: margen medio (reducido de 20 a 6)
          }
        : {
            xs: 1, // ✅ MOBILE FIX: Sin padding para maximizar espacio de cards
            sm: 1.5, // Tablet pequeña: margen medio
            md: 4, // Tablet: margen moderado
            lg: 6, // Desktop: margen amplio
            xl: 8, // Desktop grande: margen grande
          },
      pb: { xs: 3, md: 4 },
      // ✅ Asegurar que el contenido use todo el ancho disponible
      width: '100%',
      maxWidth: '100%',
    }),
    [hasSideBar]
  );
  return (
    <Box>
      {/* TopBar eliminada, ahora la maneja App.jsx globalmente */}
      {/* Contenido principal con margen para compensar TopBar fijo */}
      <Box sx={containerStyles}>
        {/* Sección de búsqueda y navegación - Pasamos hasSideBar y sideBarCollapsed */}
        <SearchSection
          {...searchSectionProps}
          hasSideBar={hasSideBar}
          sideBarCollapsed={sideBarCollapsed}
        />
        {/* Sección de filtros */}
        {/* <FilterSection {...filterSectionProps} /> */}{' '}
        {/* Botón de filtros comentado */}
        {/* Sección de productos - Pasamos hasSideBar y sideBarCollapsed */}
        <ProductsSection
          {...productsSectionProps}
          hasSideBar={hasSideBar}
          sideBarCollapsed={sideBarCollapsed}
        />
      </Box>
      {/* ✅ ELIMINADO: Login modal duplicado - ahora se gestiona centralmente desde TopBar */}
    </Box>
  );
});

// ✅ MEJORA DE RENDIMIENTO: DisplayName para debugging
Marketplace.displayName = 'Marketplace';

export default Marketplace;
