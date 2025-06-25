import { useState, useCallback, useMemo } from 'react';
import { useTheme } from '@mui/material';

// Importar los hooks existentes
import { useMarketplaceState } from './hooks/useMarketplaceState';
import { useProductSorting } from './hooks/useProductSorting';
import { useScrollBehavior } from './hooks/useScrollBehavior';

/**
 * Hook centralizado que consolida toda la lógica de Marketplace
 * ✅ OPTIMIZADO: Reduce re-renders innecesarios
 */
const useMarketplaceLogic = (options = {}) => {
  // ✅ OPTIMIZACIÓN: Memoizar configuración estática
  const memoizedOptions = useMemo(
    () => ({
      hasSideBar: false,
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
      ...options,
    }),
    [options]
  );

  const {
    hasSideBar,
    searchBarMarginLeft,
    categoryMarginLeft,
    titleMarginLeft,
  } = memoizedOptions;

  const theme = useTheme();

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

  // ===== HANDLERS MEMOIZADOS =====
  const handleToggleFiltro = useCallback(() => {
    setFiltroModalOpen(prev => !prev);
    setFiltroVisible(prev => !prev);
  }, [setFiltroModalOpen, setFiltroVisible]);

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
      onToggleFilters: handleToggleFiltro,
      hayFiltrosActivos,
      filtroVisible,
      filtroModalOpen,
      searchBarMarginLeft,
    }),
    [
      busqueda,
      memoSetBusqueda,
      currentOrdenamiento,
      memoSetCurrentOrdenamiento,
      currentSortOptions,
      handleToggleFiltro,
      hayFiltrosActivos,
      filtroVisible,
      filtroModalOpen,
      searchBarMarginLeft,
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
    }),
    [
      seccionActiva,
      categoriaSeleccionada,
      memoSetSeccionActiva,
      memoToggleCategoria,
      categoryMarginLeft,
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
      // shouldShowSearchBar removido - ya no necesario
      hayFiltrosActivos,
      handleToggleFiltro,
      desktopFilterProps,
    }),
    [hayFiltrosActivos, handleToggleFiltro, desktopFilterProps]
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

export default useMarketplaceLogic;

// ✅ EDITAR AQUÍ PARA:
// - Cambiar lógica de estados
// - Modificar handlers de eventos
// - Ajustar comportamiento de filtros
// - Agregar nueva funcionalidad
// - Cambiar props que se pasan a las secciones
