/**
 * ============================================================================
 * SUPPLIER PRODUCT FILTERS STORE - GESTIÓN DE FILTROS Y BÚSQUEDA
 * ============================================================================
 *
 * Store especializado para manejar filtros, búsqueda y ordenamiento
 * de productos del proveedor.
 */

import { create } from 'zustand'

const useSupplierProductFilters = create((set, get) => ({
  // ============================================================================
  // ESTADO DE FILTROS
  // ============================================================================
  searchTerm: '',
  categoryFilter: 'all',
  sortBy: 'updateddt',
  sortOrder: 'desc',
  statusFilter: 'all', // all, active, inactive
  stockFilter: 'all', // all, in-stock, low-stock, out-of-stock

  // Filtros avanzados
  priceRange: { min: 0, max: 999999 },
  dateRange: { start: null, end: null },

  // Estado de filtros aplicados
  activeFiltersCount: 0,

  // ============================================================================
  // ACCIONES DE FILTROS
  // ============================================================================

  /**
   * Establecer término de búsqueda
   */
  setSearchTerm: (searchTerm) => {
    set({ searchTerm })
    get().updateActiveFiltersCount()
  },

  /**
   * Establecer filtro de categoría
   */
  setCategoryFilter: (categoryFilter) => {
    set({ categoryFilter })
    get().updateActiveFiltersCount()
  },

  /**
   * Establecer filtro de estado
   */
  setStatusFilter: (statusFilter) => {
    set({ statusFilter })
    get().updateActiveFiltersCount()
  },

  /**
   * Establecer filtro de stock
   */
  setStockFilter: (stockFilter) => {
    set({ stockFilter })
    get().updateActiveFiltersCount()
  },

  /**
   * Establecer rango de precios
   */
  setPriceRange: (priceRange) => {
    set({ priceRange })
    get().updateActiveFiltersCount()
  },

  /**
   * Establecer rango de fechas
   */
  setDateRange: (dateRange) => {
    set({ dateRange })
    get().updateActiveFiltersCount()
  },

  /**
   * Establecer ordenamiento
   */
  setSorting: (sortBy, sortOrder = 'desc') => {
    set({ sortBy, sortOrder })
  },

  // ============================================================================
  // APLICACIÓN DE FILTROS
  // ============================================================================

  /**
   * Aplicar todos los filtros a una lista de productos
   */
  applyFilters: (products) => {
    const {
      searchTerm,
      categoryFilter,
      statusFilter,
      stockFilter,
      priceRange,
      dateRange,
      sortBy,
      sortOrder,
    } = get()

  let filtered = [...products]

  // Excluir productos marcados para eliminación (soft_deleted / archived) por defecto
  filtered = filtered.filter(p => !p.deletion_status || p.deletion_status === 'active')

    // Filtro de búsqueda
    if (searchTerm) {
      const search = searchTerm.toLowerCase().trim()
      filtered = filtered.filter(
        (product) =>
          (product.productnm &&
            product.productnm.toLowerCase().includes(search)) ||
          (product.description &&
            product.description.toLowerCase().includes(search)) ||
          (product.category && product.category.toLowerCase().includes(search))
      )
    }

    // Filtro de categoría
    if (categoryFilter && categoryFilter !== 'all') {
      filtered = filtered.filter(
        (product) => product.category === categoryFilter
      )
    }

    // Filtro de estado
    if (statusFilter && statusFilter !== 'all') {
      filtered = filtered.filter((product) => {
        switch (statusFilter) {
          case 'active':
            return product.is_active === true
          case 'inactive':
            return product.is_active === false
          default:
            return true
        }
      })
    }

    // Filtro de stock
    if (stockFilter && stockFilter !== 'all') {
      filtered = filtered.filter((product) => {
        const stock = product.productqty || 0
        switch (stockFilter) {
          case 'in-stock':
            return stock > 10
          case 'low-stock':
            return stock > 0 && stock <= 10
          case 'out-of-stock':
            return stock === 0
          default:
            return true
        }
      })
    }

    // Filtro de rango de precios
    if (priceRange.min > 0 || priceRange.max < 999999) {
      filtered = filtered.filter((product) => {
        const price = product.price || 0
        return price >= priceRange.min && price <= priceRange.max
      })
    }

    // Filtro de rango de fechas
    if (dateRange.start || dateRange.end) {
      filtered = filtered.filter((product) => {
        // Preferir fecha de creación (`createddt`) para filtros de rango
        const productDate = new Date(product.createddt || product.updateddt)
        const start = dateRange.start
          ? new Date(dateRange.start)
          : new Date('1970-01-01')
        const end = dateRange.end ? new Date(dateRange.end) : new Date()
        return productDate >= start && productDate <= end
      })
    }

    // 🐛 DEBUG: Log antes de ordenar
    if (filtered.length > 0) {
      console.log('[DEBUG applyFilters] ==================== ANTES de ordenar ====================');
      console.log('sortBy:', sortBy);
      console.log('Total productos:', filtered.length);
      filtered.slice(0, 5).forEach((p, i) => {
        console.log(`  [${i}] ${p.productnm?.slice(0, 40) || 'sin nombre'}`);
        console.log(`      updateddt: ${p.updateddt}`);
        console.log(`      createddt: ${p.createddt}`);
        console.log(`      price: ${p.price}`);
      });
    }

    // Aplicar ordenamiento
    filtered.sort((a, b) => {
      // Ordenamiento especial para 'pausedStatus'
      if (sortBy === 'pausedStatus') {
        const aInactive = a.is_active === false
        const bInactive = b.is_active === false
        if (aInactive && !bInactive) return -1
        if (!aInactive && bInactive) return 1
        const nameA = (a.productnm || '').toLowerCase()
        const nameB = (b.productnm || '').toLowerCase()
        if (nameA < nameB) return -1
        if (nameA > nameB) return 1
        return 0
      }

      // Ordenamiento por fechas - más recientes (productos creados recientemente)
      if (sortBy === 'updateddt') {
        const dateA = new Date(a.createddt || 0)
        const dateB = new Date(b.createddt || 0)
        return dateB - dateA // Descendente (más recientes primero)
      }

      // Ordenamiento por fechas - más antiguos (productos creados hace tiempo)
      if (sortBy === 'createddt') {
        const dateA = new Date(a.createddt || 0)
        const dateB = new Date(b.createddt || 0)
        return dateA - dateB // Ascendente (más antiguos primero)
      }

      // Ordenamiento por precio menor a mayor (usar precio efectivo: tiers si existe, sino price base)
      if (sortBy === 'precio_asc') {
        // Calcular precio efectivo para A
        let priceA = Number(a.price) || 0
        if (a.priceTiers?.length > 0) {
          const prices = a.priceTiers.map(t => Number(t.price)).filter(p => p > 0)
          if (prices.length > 0) {
            priceA = Math.min(...prices)
          }
        }
        
        // Calcular precio efectivo para B
        let priceB = Number(b.price) || 0
        if (b.priceTiers?.length > 0) {
          const prices = b.priceTiers.map(t => Number(t.price)).filter(p => p > 0)
          if (prices.length > 0) {
            priceB = Math.min(...prices)
          }
        }
        
        return priceA - priceB // Ascendente
      }

      // Ordenamiento por precio mayor a menor (usar precio efectivo: tiers si existe, sino price base)
      if (sortBy === 'precio_desc') {
        // Calcular precio efectivo para A
        let priceA = Number(a.price) || 0
        if (a.priceTiers?.length > 0) {
          const prices = a.priceTiers.map(t => Number(t.price)).filter(p => p > 0)
          if (prices.length > 0) {
            priceA = Math.min(...prices)
          }
        }
        
        // Calcular precio efectivo para B
        let priceB = Number(b.price) || 0
        if (b.priceTiers?.length > 0) {
          const prices = b.priceTiers.map(t => Number(t.price)).filter(p => p > 0)
          if (prices.length > 0) {
            priceB = Math.min(...prices)
          }
        }
        
        return priceB - priceA // Descendente
      }

      // Ordenamiento por nombre (A-Z) - usar productnm de BD
      if (sortBy === 'productnm') {
        const nameA = (a.productnm || '').toLowerCase()
        const nameB = (b.productnm || '').toLowerCase()
        if (nameA < nameB) return -1
        if (nameA > nameB) return 1
        return 0
      }

      // Ordenamiento por stock (mayor stock primero) - usar productqty de BD
      if (sortBy === 'productqty') {
        const qtyA = Number(a.productqty) || 0
        const qtyB = Number(b.productqty) || 0
        return qtyB - qtyA // Descendente (mayor stock primero)
      }

      // Fallback genérico
      return 0
    })

    // 🐛 DEBUG: Log DESPUÉS de ordenar
    if (filtered.length > 0) {
      console.log('[DEBUG applyFilters] ==================== DESPUES de ordenar ====================');
      console.log('sortBy:', sortBy);
      console.log('Total productos:', filtered.length);
      filtered.slice(0, 5).forEach((p, i) => {
        console.log(`  [${i}] ${p.productnm?.slice(0, 40) || 'sin nombre'}`);
        console.log(`      updateddt: ${p.updateddt}`);
        console.log(`      createddt: ${p.createddt}`);
        console.log(`      price: ${p.price}`);
      });
    }

    return filtered
  },

  // ============================================================================
  // UTILIDADES
  // ============================================================================

  /**
   * Actualizar contador de filtros activos
   */
  updateActiveFiltersCount: () => {
    const {
      searchTerm,
      categoryFilter,
      statusFilter,
      stockFilter,
      priceRange,
      dateRange,
    } = get()

    let count = 0

    if (searchTerm) count++
    if (categoryFilter !== 'all') count++
    if (statusFilter !== 'all') count++
    if (stockFilter !== 'all') count++
    if (priceRange.min > 0 || priceRange.max < 999999) count++
    if (dateRange.start || dateRange.end) count++

    set({ activeFiltersCount: count })
  },

  /**
   * Limpiar todos los filtros
   */
  clearFilters: () => {
    set({
      searchTerm: '',
      categoryFilter: 'all',
      statusFilter: 'all',
      stockFilter: 'all',
      priceRange: { min: 0, max: 999999 },
      dateRange: { start: null, end: null },
      activeFiltersCount: 0,
    })
  },

  /**
   * Obtener resumen de filtros aplicados
   */
  getFiltersSummary: () => {
    const {
      searchTerm,
      categoryFilter,
      statusFilter,
      stockFilter,
      priceRange,
      dateRange,
      activeFiltersCount,
    } = get()

    return {
      searchTerm,
      categoryFilter,
      statusFilter,
      stockFilter,
      priceRange,
      dateRange,
      activeFiltersCount,
      hasFilters: activeFiltersCount > 0,
    }
  },

  /**
   * Establecer filtros predefinidos
   */
  setPresetFilter: (preset) => {
    switch (preset) {
      case 'low-stock':
        set({
          stockFilter: 'low-stock',
          categoryFilter: 'all',
          statusFilter: 'active',
          searchTerm: '',
        })
        break
      case 'out-of-stock':
        set({
          stockFilter: 'out-of-stock',
          categoryFilter: 'all',
          statusFilter: 'active',
          searchTerm: '',
        })
        break
      case 'new-products':
        // Mostrar productos creados en los últimos 3 días (usar createddt)
        const recent = new Date()
        recent.setDate(recent.getDate() - 3)
        set({
          dateRange: { start: recent.toISOString().split('T')[0], end: null },
          categoryFilter: 'all',
          statusFilter: 'active',
          searchTerm: '',
        })
        break
      case 'high-price':
        set({
          priceRange: { min: 100000, max: 999999 },
          categoryFilter: 'all',
          statusFilter: 'active',
          searchTerm: '',
        })
        break
      default:
        get().clearFilters()
    }
    get().updateActiveFiltersCount()
  },

  /**
   * Reset del store
   */
  reset: () => {
    set({
      searchTerm: '',
      categoryFilter: 'all',
      sortBy: 'updateddt',
      sortOrder: 'desc',
      statusFilter: 'all',
      stockFilter: 'all',
      priceRange: { min: 0, max: 999999 },
      dateRange: { start: null, end: null },
      activeFiltersCount: 0,
    })
  },
}))

export default useSupplierProductFilters
