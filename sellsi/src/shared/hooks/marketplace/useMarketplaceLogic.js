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
// 🌱 CONFIG ESTÁTICA: fuera del hook para no recrearse / mantener referencias estables
const DEFAULT_MARKETPLACE_CONFIG = Object.freeze({
  hasSideBar: false,
  clearSearchOnViewToggle: false,
  searchBarMarginLeft: { xs: 0, sm: 0, md: 2, lg: 33.7, xl: 41 },
  categoryMarginLeft: { xs: 0, sm: 0, md: 3, lg: 35.5, xl: 40 },
  titleMarginLeft: { xs: 0, sm: 0, md: 0, lg: 0, xl: 0 },
});

export const useMarketplaceLogic = (options = {}) => {
  // ✅ OPTIMIZACIÓN: Mezcla superficial de config sólo si se pasan overrides
  const memoizedOptions = useMemo(() => (
    Object.keys(options).length ? { ...DEFAULT_MARKETPLACE_CONFIG, ...options } : DEFAULT_MARKETPLACE_CONFIG
  ), [options]);

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
  getPriceTiers,
  registerProductNode,
  } = useMarketplaceState();
  // Prefetch helpers provided by useMarketplaceState
  // (included in the destructured return to avoid calling the hook twice)

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

  // Handler para abrir/actualizar filtro de despacho desde CategoryNavigation
  // Accepts:
  // - null -> clear selection
  // - single region value -> toggle membership
  // - array of regions -> set explicitly
  const handleOpenShippingFilter = useCallback((regions) => {
    try {
      let newSelection = [];

      if (regions === null) {
        newSelection = [];
      } else if (Array.isArray(regions)) {
        newSelection = regions;
      } else if (typeof regions === 'string') {
        const current = filtros?.shippingRegions || [];
        // toggle
        if (current.includes(regions)) {
          newSelection = current.filter(r => r !== regions);
        } else {
          newSelection = [...current, regions];
        }
      }

      updateFiltros({ shippingRegions: newSelection });
      setFiltroVisible(true);
      setFiltroModalOpen(true);
    } catch (e) {
      // ignore
    }
  }, [updateFiltros, setFiltroVisible, setFiltroModalOpen, filtros]);

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

  // Nota: los setters provenientes de useState y los callbacks memoizados desde
  // `useMarketplaceState`/`useProductSorting` ya son estables; evitar envolverlos
  // en passthroughs redunda en funciones extra y ruido en dependencias.

  // 🔍 DEV RENDER COUNTER (sólo desarrollo) para diagnosticar si este hook se dispara en exceso
  if (import.meta?.env?.MODE !== 'production') {
    // eslint-disable-next-line no-underscore-dangle
    window.__mpLogicHookRenders = (window.__mpLogicHookRenders || 0) + 1;
  }

  // ===== PROPS ORGANIZADOS POR SECCIONES (MEMOIZADOS) =====
  
  // ✅ OPTIMIZACIÓN: Memoizar searchBarProps separadamente para mayor granularidad
  const searchBarProps = useMemo(
    () => ({
      busqueda,
  setBusqueda,
      ordenamiento: currentOrdenamiento,
  setOrdenamiento: setCurrentOrdenamiento,
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
      currentOrdenamiento,
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
  onSeccionChange: setSeccionActiva,
  onCategoriaToggle: toggleCategoria,
      onOpenShippingFilter: handleOpenShippingFilter,
      selectedShippingRegions: filtros?.shippingRegions || [],
      categoryMarginLeft,
      isProviderView, // Para ocultar elementos en Vista 1
    }),
    [
      seccionActiva,
      categoriaSeleccionada,
  setSeccionActiva,
  toggleCategoria,
      handleOpenShippingFilter,
      categoryMarginLeft,
      isProviderView,
      filtros,
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
  updateFiltros,
  resetFiltros,
      totalProductos,
      filtrosAbiertos: filtroVisible,
    }),
    [
      filtros,
      categoriaSeleccionada,
      busqueda,
  updateFiltros,
  resetFiltros,
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
  setSeccionActiva,
      totalProductos,
      productosOrdenados,
  resetFiltros,
      hasSideBar,
      titleMarginLeft,
      loading,
      error,
      isProviderView, // Para cambiar el comportamiento en Vista 1
  // Pasar funciones de nivel inferior para prefetch de tiers
  getPriceTiers,
  registerProductNode,
    }),
    [
      seccionActiva,
  setSeccionActiva,
      totalProductos,
      productosOrdenados,
  resetFiltros,
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
  // 🔍 Exponer contador sólo en dev (no documentado en API pública)
  ...(import.meta?.env?.MODE !== 'production' && { __devRenders: window.__mpLogicHookRenders }),
  };
};

// ✅ EDITAR AQUÍ PARA:
// - Cambiar lógica de estados
// - Modificar handlers de eventos
// - Ajustar comportamiento de filtros
// - Agregar nueva funcionalidad
// - Cambiar props que se pasan a las secciones
