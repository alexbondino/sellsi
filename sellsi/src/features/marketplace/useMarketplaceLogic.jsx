// ✅ EDITAR AQUÍ PARA:
// - Cambiar lógica de estados
// - Modificar handlers de eventos
// - Ajustar comportamiento de filtros
// - Agregar nueva funcionalidad
// - Cambiar props que se pasan a las secciones

import { useState, useCallback, useMemo } from 'react'
import { useTheme } from '@mui/material'

// Importar los hooks existentes
import { useMarketplaceState } from './hooks/useMarketplaceState'
import { useProductSorting } from './hooks/useProductSorting'
import { useScrollBehavior } from './hooks/useScrollBehavior'

/**
 * Hook centralizado que consolida toda la lógica de Marketplace
 * Mantiene exactamente el mismo comportamiento que la implementación original
 */
const useMarketplaceLogic = (options = {}) => {
  const {
    hasSidebar = false,
    searchBarMarginLeft = {
      xs: 0,
      sm: 0,
      md: 2,
      lg: 33.7,
      xl: 41,
    },
    categoryMarginLeft = {
      xs: 0,
      sm: 0,
      md: 3,
      lg: 35.5,
      xl: 40,
    },
    titleMarginLeft = {
      xs: 0,
      sm: 0,
      md: 0,
      lg: 0,
      xl: 0,
    },
  } = options // Nueva opción para detectar si hay sidebar y márgenes personalizados
  const theme = useTheme()

  // ===== CONSOLIDAR HOOKS EXISTENTES =====
  // Estados del marketplace usando el hook personalizado
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
    loading, // <-- AGREGADO
    error, // <-- AGREGADO
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
  } = useMarketplaceState()

  // Hook para opciones de ordenamiento
  const {
    ordenamiento: currentOrdenamiento,
    setOrdenamiento: setCurrentOrdenamiento,
    productosOrdenados,
    sortOptions: currentSortOptions,
  } = useProductSorting(productosFiltrados)

  // Hook para comportamiento de scroll
  const { shouldShowSearchBar } = useScrollBehavior()

  // ===== ESTADOS LOCALES PARA UI =====
  const [anchorElCategorias, setAnchorElCategorias] = useState(null)

  // ===== HANDLERS =====
  const handleToggleFiltro = useCallback(() => {
    setFiltroModalOpen(!filtroModalOpen)
    setFiltroVisible(!filtroVisible)
  }, [filtroModalOpen, setFiltroModalOpen, filtroVisible, setFiltroVisible])

  const handleOpenCategorias = useCallback((event) => {
    setAnchorElCategorias(event.currentTarget)
  }, [])

  const handleCloseCategorias = useCallback(() => {
    setAnchorElCategorias(null)
  }, [])

  // ===== PROPS ORGANIZADOS POR SECCIONES =====  // Props para SearchSection
  const searchSectionProps = useMemo(
    () => ({
      shouldShowSearchBar,
      hasSidebar, // Nueva prop para indicar si hay sidebar      // SearchBar props
      searchBarProps: {
        busqueda,
        setBusqueda,
        ordenamiento: currentOrdenamiento,
        setOrdenamiento: setCurrentOrdenamiento,
        sortOptions: currentSortOptions,
        onToggleFilters: handleToggleFiltro,
        hayFiltrosActivos,
        filtroVisible,
        filtroModalOpen,
        searchBarMarginLeft, // ✅ Agregar prop personalizado
      },
      // CategoryNavigation props
      categoryNavigationProps: {
        seccionActiva,
        categoriaSeleccionada,
        anchorElCategorias,
        onSeccionChange: setSeccionActiva,
        onCategoriaToggle: toggleCategoria,
        onOpenCategorias: handleOpenCategorias,
        onCloseCategorias: handleCloseCategorias,
        categoryMarginLeft, // ✅ Agregar prop personalizado
      },
    }),
    [
      shouldShowSearchBar,
      hasSidebar, // Incluir hasSidebar en las dependencias
      searchBarMarginLeft, // ✅ Agregar dependencia
      categoryMarginLeft, // ✅ Agregar dependencia
      busqueda,
      setBusqueda,
      currentOrdenamiento,
      setCurrentOrdenamiento,
      currentSortOptions,
      handleToggleFiltro,
      hayFiltrosActivos,
      filtroVisible,
      filtroModalOpen,
      seccionActiva,
      categoriaSeleccionada,
      anchorElCategorias,
      setSeccionActiva,
      toggleCategoria,
      handleOpenCategorias,
      handleCloseCategorias,
    ]
  )
  // Props para FilterSection
  const filterSectionProps = useMemo(
    () => ({
      shouldShowSearchBar,
      hayFiltrosActivos,
      handleToggleFiltro,
      // FilterPanel props para desktop
      desktopFilterProps: {
        filtros,
        categoriaSeleccionada,
        busqueda,
        updateFiltros,
        resetFiltros,
        isMobileOpen: filtroModalOpen,
        onMobileClose: () => setFiltroModalOpen(false),
        totalProductos,
        filtrosAbiertos: filtroVisible,
      },
      // FilterPanel props para mobile
      mobileFilterProps: {
        filtros,
        categoriaSeleccionada,
        busqueda,
        updateFiltros,
        resetFiltros,
        isMobileOpen: filtroModalOpen,
        onMobileClose: () => setFiltroModalOpen(false),
        totalProductos,
        filtrosAbiertos: false,
      },
    }),
    [
      shouldShowSearchBar,
      hayFiltrosActivos,
      handleToggleFiltro,
      filtros,
      categoriaSeleccionada,
      busqueda,
      updateFiltros,
      resetFiltros,
      filtroModalOpen,
      setFiltroModalOpen,
      totalProductos,
      filtroVisible,
    ]
  )

  // Props para ProductsSection
  const productsSectionProps = useMemo(
    () => ({
      shouldShowSearchBar,
      seccionActiva,
      setSeccionActiva,
      totalProductos,
      productosOrdenados,
      resetFiltros,
      hasSidebar, // ✅ AGREGAR: Prop para detectar si hay sidebar
      titleMarginLeft, // ✅ AGREGAR: Prop para margen del título
      loading, // <-- Agregado
      error, // <-- Agregado
    }),
    [
      shouldShowSearchBar,
      seccionActiva,
      setSeccionActiva,
      totalProductos,
      productosOrdenados,
      resetFiltros,
      hasSidebar, // ✅ AGREGAR: Dependencia para hasSidebar
      titleMarginLeft, // ✅ AGREGAR: Dependencia para titleMarginLeft
      loading, // <-- Agregado
      error, // <-- Agregado
    ]
  )
  // ===== RETORNAR TODO ORGANIZADO =====
  return {
    // Props por secciones
    searchSectionProps,
    filterSectionProps,
    productsSectionProps,

    // Estados generales
    theme,
  }
}

export default useMarketplaceLogic

// ✅ EDITAR AQUÍ PARA:
// - Cambiar lógica de estados
// - Modificar handlers de eventos
// - Ajustar comportamiento de filtros
// - Agregar nueva funcionalidad
// - Cambiar props que se pasan a las secciones
