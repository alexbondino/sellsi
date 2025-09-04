/**
 * 🎯 MARKETPLACE LOGIC HOOK - SHARED
 * 
 * Migrado desde: domains/marketplace/pages/useMarketplaceLogic.jsx
 * Motivo: Es usado por buyer y supplier domains
 * 
 * USADO EN:
 * - domains/buyer/pages/MarketplaceBuyer.jsx
 * - domains/supplier/pages/MarketplaceSupplier.jsx
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useTheme } from '@mui/material';
import { useLocation } from 'react-router-dom';

// Importar los hooks desde marketplace (mantenemos la referencia)
import { useMarketplaceState } from '../../../domains/marketplace/hooks/state/useMarketplaceState';
import { useProductSorting } from '../../../domains/marketplace/hooks/products/useProductSorting';
import { useScrollBehavior } from '../../../domains/marketplace/hooks/ui/useScrollBehavior';
import { useMarketplaceSearchBus } from '../../contexts/MarketplaceSearchContext';

/**
 * Hook centralizado que consolida toda la lógica de Marketplace
 * ✅ OPTIMIZADO: Reduce re-renders innecesarios
 */
export const useMarketplaceLogic = (options = {}) => {
  // ✅ OPTIMIZACIÓN: Memoizar configuración estática con comparación profunda
  const memoizedOptions = useMemo(
    () => {
      const defaultConfig = {
        hasSideBar: false,
  // 🚩 NUEVO FLAG: Permite que algunos consumidores (Marketplace público) limpien la búsqueda
  // cuando se cambia entre vista de proveedores y productos.
  clearSearchOnViewToggle: false,
        searchBarMarginLeft: {
          xs: 0,
          sm: 0,
          md: 2,
          lg: 33.7,
          xl: 41,
        },
        categoryMarginLeft: {
          xs: 0,
          sm: 0,
          md: 3,
          lg: 35.5,
          xl: 40,
        },
        titleMarginLeft: {
          xs: 0,
          sm: 0,
          md: 0,
          lg: 0,
          xl: 0,
        },
      };

      // ✅ OPTIMIZACIÓN: Solo mergear si las opciones han cambiado
      return Object.keys(options).length > 0 ? { ...defaultConfig, ...options } : defaultConfig;
    },
    [options]
  );

  const {
    hasSideBar,
    searchBarMarginLeft,
    categoryMarginLeft,
    titleMarginLeft,
  clearSearchOnViewToggle,
  } = memoizedOptions;

  const theme = useTheme();
  const location = useLocation();

  // ===== CONSOLIDAR HOOKS EXISTENTES =====
  const {
    seccionActiva,
    busqueda,
    categoriaSeleccionada,
    filtros,
    filtroVisible,
    filtroModalOpen,
    productosFiltrados,
    hayFiltrosActivos,
    totalProductos,
    precioRango,
    comisionRango,
    categorias,
    loading,
    error,
    setSeccionActiva,
    setBusqueda,
    setCategoriaSeleccionada,
    setFiltroVisible,
    setFiltroModalOpen,
    setPrecioRango,
    setComisionRango,
    updateFiltros,
    resetFiltros,
    toggleCategoria,
    handleTipoVentaChange,
  } = useMarketplaceState();

  // Hook para opciones de ordenamiento
  const {
    ordenamiento: currentOrdenamiento,
    setOrdenamiento: setCurrentOrdenamiento,
    productosOrdenados,
    sortOptions: currentSortOptions,
  } = useProductSorting(productosFiltrados);

  // Hook para comportamiento de scroll - SOLO para SearchSection
  const { shouldShowSearchBar } = useScrollBehavior();

  // ===== ESTADOS LOCALES PARA UI =====
  const [anchorElCategorias, setAnchorElCategorias] = useState(null);
  
  // ✅ NUEVO: Estado para manejar el modal móvil de filtros
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  
  // ✅ NUEVO: Estado para el switch de vistas (Vista 1: proveedores, Vista 2: productos)
  const [isProviderView, setIsProviderView] = useState(
    location.state?.providerSwitchActive || false
  );

  // ✅ NUEVO: Effect para detectar navegación desde catálogo del proveedor
  useEffect(() => {
    if (location.state?.providerSwitchActive) {
      setIsProviderView(true);
      // Limpiar el estado para evitar que se mantenga en futuras navegaciones
      window.history.replaceState({}, document.title);
    }
  }, [location.state?.providerSwitchActive]);

  // ✅ NUEVO: Effect para aplicar búsqueda inicial cuando se navega desde TopBar u otra sección
  useEffect(() => {
    if (location.state?.initialSearch !== undefined && location.state?.initialSearch !== null) {
      const term = String(location.state.initialSearch).trim();
      if (term !== '') {
        setBusqueda(term);
      } else {
        setBusqueda('');
      }
      // Limpiar state para no re-aplicar en futuras navegaciones
      try {
        window.history.replaceState({}, document.title, location.pathname + location.search);
      } catch (_) {}
    }
  }, [location.state?.initialSearch, location.pathname, location.search, setBusqueda]);

  // ✅ REEMPLAZO: Integración vía contexto (MarketPlaceSearchBus) en lugar de evento global
  const searchBus = useMarketplaceSearchBus();
  useEffect(() => {
    if (!searchBus) return; // Si no hay provider (fallback) simplemente no hacemos nada
    if (!location.pathname.startsWith('/buyer/marketplace')) return;
    setBusqueda(searchBus.externalSearchTerm || '');
  }, [searchBus?.externalSearchTerm, location.pathname, setBusqueda]);

  // ===== HANDLERS MEMOIZADOS =====
  const handleToggleFiltro = useCallback(() => {
    // Para desktop: toggle del panel lateral
    setFiltroModalOpen(prev => !prev);
    setFiltroVisible(prev => !prev);
  }, [setFiltroModalOpen, setFiltroVisible]);

  // ✅ NUEVO: Handler para móvil
  const handleMobileFilterClose = useCallback(() => {
    setIsMobileFilterOpen(false);
  }, []);

  // ✅ NUEVO: Handler unificado que detecta el dispositivo
  const handleUnifiedToggleFilters = useCallback(() => {
    // Para móvil (xs, sm): abrir modal
    if (window.innerWidth < 900) { // md breakpoint
      setIsMobileFilterOpen(true);
    } else {
      // Para desktop: usar el handler original
      handleToggleFiltro();
    }
  }, [handleToggleFiltro]);

  // ✅ OPTIMIZACIÓN: Handler para el switch de vistas - memoizado estable
  const handleToggleProviderView = useCallback(() => {
    // Opcionalmente limpiar búsqueda (comportamiento legacy de Marketplace público)
    if (clearSearchOnViewToggle) {
      setBusqueda('');
    }
    // Resetear filtros antes o después no afecta porque no depende de isProviderView interno
    resetFiltros();
    setIsProviderView(prev => !prev);
  }, [clearSearchOnViewToggle, resetFiltros, setBusqueda]);

  // ✅ OPTIMIZACIÓN: Memoizar todos los handlers que se pasan como props
  const memoSetBusqueda = useCallback(v => setBusqueda(v), [setBusqueda]);
  const memoSetSeccionActiva = useCallback(
    v => setSeccionActiva(v),
    [setSeccionActiva]
  );
  const memoUpdateFiltros = useCallback(v => updateFiltros(v), [updateFiltros]);
  const memoResetFiltros = useCallback(() => resetFiltros(), [resetFiltros]);
  const memoToggleCategoria = useCallback(
    v => toggleCategoria(v),
    [toggleCategoria]
  );
  const memoSetCurrentOrdenamiento = useCallback(
    v => setCurrentOrdenamiento(v),
    [setCurrentOrdenamiento]
  );

  const handleOpenCategorias = useCallback(event => {
    setAnchorElCategorias(event.currentTarget);
  }, []);

  const handleCloseCategorias = useCallback(() => {
    setAnchorElCategorias(null);
  }, []);

  // ===== PROPS ORGANIZADOS POR SECCIONES (MEMOIZADOS) =====
  
  // ✅ OPTIMIZACIÓN: Memoizar searchBarProps separadamente para mayor granularidad
  const searchBarProps = useMemo(
    () => ({
      busqueda,
      setBusqueda: memoSetBusqueda,
      ordenamiento: currentOrdenamiento,
      setOrdenamiento: memoSetCurrentOrdenamiento,
      sortOptions: currentSortOptions,
      onToggleFilters: handleUnifiedToggleFilters, // ✅ CAMBIADO: Usar handler unificado
      hayFiltrosActivos,
      filtroVisible,
      filtroModalOpen,
      searchBarMarginLeft,
      // ✅ NUEVO: Props para el modal móvil
      isMobileFilterOpen,
      onMobileFilterClose: handleMobileFilterClose,
      // ✅ NUEVO: Props para el switch de vistas
      isProviderView,
      onToggleProviderView: handleToggleProviderView,
      hasSideBar, // Necesario para determinar si mostrar el switch
    }),
    [
      busqueda,
      memoSetBusqueda,
      currentOrdenamiento,
      memoSetCurrentOrdenamiento,
      currentSortOptions,
      handleUnifiedToggleFilters, // ✅ CAMBIADO
      hayFiltrosActivos,
      filtroVisible,
      filtroModalOpen,
      searchBarMarginLeft,
      isMobileFilterOpen,
      handleMobileFilterClose,
      isProviderView,
      handleToggleProviderView,
      hasSideBar,
    ]
  );

  // ✅ OPTIMIZACIÓN: Memoizar categoryNavigationProps separadamente
  const categoryNavigationProps = useMemo(
    () => ({
      seccionActiva,
      categoriaSeleccionada,
      onSeccionChange: memoSetSeccionActiva,
      onCategoriaToggle: memoToggleCategoria,
      categoryMarginLeft,
      isProviderView, // Para ocultar elementos en Vista 1
    }),
    [
      seccionActiva,
      categoriaSeleccionada,
      memoSetSeccionActiva,
      memoToggleCategoria,
      categoryMarginLeft,
      isProviderView,
    ]
  );

  // Props para SearchSection - SOLO SearchSection necesita shouldShowSearchBar
  const searchSectionProps = useMemo(
    () => ({
      shouldShowSearchBar, // Solo para animaciones de SearchBar
      hasSideBar,
      searchBarProps,
      categoryNavigationProps,
    }),
    [shouldShowSearchBar, hasSideBar, searchBarProps, categoryNavigationProps]
  );

  // ✅ DESACOPLADO: FilterSection ya no depende de shouldShowSearchBar
  const desktopFilterProps = useMemo(
    () => ({
      filtros,
      categoriaSeleccionada,
      busqueda,
      updateFiltros: memoUpdateFiltros,
      resetFiltros: memoResetFiltros,
      totalProductos,
      filtrosAbiertos: filtroVisible,
    }),
    [
      filtros,
      categoriaSeleccionada,
      busqueda,
      memoUpdateFiltros,
      memoResetFiltros,
      totalProductos,
      filtroVisible,
    ]
  );

  const filterSectionProps = useMemo(
    () => ({
      hayFiltrosActivos,
      handleToggleFiltro,
      desktopFilterProps,
      // ✅ NUEVO: Props para el modal móvil
      isMobileOpen: isMobileFilterOpen,
      onMobileClose: handleMobileFilterClose,
    }),
    [hayFiltrosActivos, handleToggleFiltro, desktopFilterProps, isMobileFilterOpen, handleMobileFilterClose]
  );

  // ✅ DESACOPLADO: ProductsSection ya no depende de shouldShowSearchBar
  const productsSectionProps = useMemo(
    () => ({
      // shouldShowSearchBar removido - layout estático ahora
      seccionActiva,
      setSeccionActiva: memoSetSeccionActiva,
      totalProductos,
      productosOrdenados,
      resetFiltros: memoResetFiltros,
      hasSideBar,
      titleMarginLeft,
      loading,
      error,
      isProviderView, // Para cambiar el comportamiento en Vista 1
    }),
    [
      seccionActiva,
      memoSetSeccionActiva,
      totalProductos,
      productosOrdenados,
      memoResetFiltros,
      hasSideBar,
      titleMarginLeft,
      loading,
      error,
      isProviderView,
    ]
  );

  // ===== RETORNAR TODO ORGANIZADO =====
  return {
    // Props por secciones
    searchSectionProps,
    filterSectionProps,
    productsSectionProps,
    // Estados generales
    theme,
  };
};

// ✅ EDITAR AQUÍ PARA:
// - Cambiar lógica de estados
// - Modificar handlers de eventos
// - Ajustar comportamiento de filtros
// - Agregar nueva funcionalidad
// - Cambiar props que se pasan a las secciones
