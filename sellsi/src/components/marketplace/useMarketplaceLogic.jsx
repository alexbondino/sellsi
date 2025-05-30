// ✅ EDITAR AQUÍ PARA:
// - Cambiar lógica de estados
// - Modificar handlers de eventos
// - Ajustar comportamiento de filtros
// - Agregar nueva funcionalidad
// - Cambiar props que se pasan a las secciones

import { useState, useCallback, useMemo } from 'react'
import { useTheme } from '@mui/material'

// Importar los hooks existentes
import { useMarketplaceState } from '../../hooks/marketplace/useMarketplaceState'
import { useProductSorting } from '../../hooks/marketplace/useProductSorting'
import { useScrollBehavior } from '../../hooks/marketplace/useScrollBehavior'

/**
 * Hook centralizado que consolida toda la lógica de Marketplace
 * Mantiene exactamente el mismo comportamiento que la implementación original
 */
const useMarketplaceLogic = () => {
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
    // Always toggle the modal for mobile behavior, and visible state for desktop
    setFiltroModalOpen(!filtroModalOpen)
    setFiltroVisible(!filtroVisible)
  }, [filtroModalOpen, setFiltroModalOpen, filtroVisible, setFiltroVisible])

  const handleOpenCategorias = useCallback((event) => {
    setAnchorElCategorias(event.currentTarget)
  }, [])

  const handleCloseCategorias = useCallback(() => {
    setAnchorElCategorias(null)
  }, [])

  // ===== PROPS ORGANIZADOS POR SECCIONES =====
  // Props para SearchSection
  const searchSectionProps = useMemo(
    () => ({
      shouldShowSearchBar,
      // SearchBar props
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
      },
    }),
    [
      shouldShowSearchBar,
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
    }),
    [
      shouldShowSearchBar,
      seccionActiva,
      setSeccionActiva,
      totalProductos,
      productosOrdenados,
      resetFiltros,
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
