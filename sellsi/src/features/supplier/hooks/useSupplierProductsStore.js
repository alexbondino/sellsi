/**
 * ============================================================================
 * SUPPLIER PRODUCTS STORE - GESTIÓN GLOBAL DE PRODUCTOS DEL PROVEEDOR
 * ============================================================================
 *
 * Store centralizado usando Zustand para manejar el estado de productos
 * del proveedor actual. Incluye operaciones CRUD y filtros.
 *
 * CARACTERÍSTICAS:
 * - ✅ Gestión completa de productos del proveedor
 * - ✅ Operaciones CRUD (Create, Read, Update, Delete)
 * - ✅ Filtros y búsqueda
 * - ✅ Estados de carga
 * - ✅ Preparado para integración con backend
 *
 * TODO FUTURO:
 * - 🔄 Sincronización con Supabase
 * - 🔄 Optimistic updates
 * - 🔄 Cache inteligente
 */

import { create } from 'zustand'
import { PRODUCTOS } from '../../marketplace/products'

// Función helper para simular productos del proveedor actual
const getSupplierProducts = (supplierId) => {
  // Por ahora filtramos productos mockados por proveedor
  // En el futuro esto será una llamada al backend
  const currentUser = localStorage.getItem('user_id')
  const supplierName =
    localStorage.getItem('supplier_name') || 'Viña Doña Aurora'

  return PRODUCTOS.filter((product) => product.proveedor === supplierName).map(
    (product) => ({
      ...product,
      supplierId: currentUser,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
  )
}

const useSupplierProductsStore = create((set, get) => ({
  // ============================================================================
  // ESTADO
  // ============================================================================
  products: [],
  filteredProducts: [],
  searchTerm: '',
  categoryFilter: 'all',
  sortBy: 'updatedAt',
  sortOrder: 'desc',
  loading: false,
  error: null,

  // Estados para operaciones específicas
  deleting: {}, // { productId: boolean }
  updating: {}, // { productId: boolean }

  // ============================================================================
  // ACCIONES BÁSICAS
  // ============================================================================

  /**
   * Cargar productos del proveedor
   */
  loadProducts: async (supplierId) => {
    set({ loading: true, error: null })

    try {
      // Simular delay de red
      await new Promise((resolve) => setTimeout(resolve, 500))

      const products = getSupplierProducts(supplierId)

      set({
        products,
        filteredProducts: products,
        loading: false,
      })

      // Aplicar filtros actuales
      get().applyFilters()
    } catch (error) {
      set({
        error: error.message || 'Error al cargar productos',
        loading: false,
      })
    }
  },
  /**
   * Agregar nuevo producto
   */
  addProduct: async (productData) => {
    set({ loading: true, error: null })

    try {
      // Validar campos requeridos
      if (
        !productData.nombre ||
        !productData.descripcion ||
        !productData.categoria
      ) {
        throw new Error(
          'Faltan campos requeridos: nombre, descripción y categoría son obligatorios'
        )
      }

      // Simular delay de red
      await new Promise((resolve) => setTimeout(resolve, 800))

      const newProduct = {
        id: Date.now(), // En producción será generado por el backend
        ...productData,
        // Asegurar que los campos obligatorios existan
        nombre: productData.nombre || '',
        descripcion: productData.descripcion || '',
        categoria: productData.categoria || '',
        proveedor:
          productData.proveedor ||
          localStorage.getItem('supplier_name') ||
          'Proveedor',
        supplierId: localStorage.getItem('user_id'),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      const { products } = get()
      const updatedProducts = [newProduct, ...products]

      set({
        products: updatedProducts,
        loading: false,
      })

      // Aplicar filtros
      get().applyFilters()

      return { success: true, product: newProduct }
    } catch (error) {
      set({
        error: error.message || 'Error al agregar producto',
        loading: false,
      })
      return { success: false, error: error.message }
    }
  },

  /**
   * Actualizar producto existente
   */
  updateProduct: async (productId, updates) => {
    set((state) => ({
      updating: { ...state.updating, [productId]: true },
      error: null,
    }))

    try {
      // Simular delay de red
      await new Promise((resolve) => setTimeout(resolve, 600))

      const { products } = get()
      const updatedProducts = products.map((product) =>
        product.id === productId
          ? {
              ...product,
              ...updates,
              updatedAt: new Date().toISOString(),
            }
          : product
      )

      set((state) => ({
        products: updatedProducts,
        updating: { ...state.updating, [productId]: false },
      }))

      // Aplicar filtros
      get().applyFilters()

      return { success: true }
    } catch (error) {
      set((state) => ({
        updating: { ...state.updating, [productId]: false },
        error: error.message || 'Error al actualizar producto',
      }))
      return { success: false, error: error.message }
    }
  },

  /**
   * Eliminar producto
   */
  deleteProduct: async (productId) => {
    set((state) => ({
      deleting: { ...state.deleting, [productId]: true },
      error: null,
    }))

    try {
      // Simular delay de red
      await new Promise((resolve) => setTimeout(resolve, 400))

      const { products } = get()
      const updatedProducts = products.filter(
        (product) => product.id !== productId
      )

      set((state) => ({
        products: updatedProducts,
        deleting: { ...state.deleting, [productId]: false },
      }))

      // Aplicar filtros
      get().applyFilters()

      return { success: true }
    } catch (error) {
      set((state) => ({
        deleting: { ...state.deleting, [productId]: false },
        error: error.message || 'Error al eliminar producto',
      }))
      return { success: false, error: error.message }
    }
  },

  // ============================================================================
  // FILTROS Y BÚSQUEDA
  // ============================================================================

  /**
   * Establecer término de búsqueda
   */
  setSearchTerm: (searchTerm) => {
    set({ searchTerm })
    get().applyFilters()
  },

  /**
   * Establecer filtro de categoría
   */
  setCategoryFilter: (categoryFilter) => {
    set({ categoryFilter })
    get().applyFilters()
  },

  /**
   * Establecer ordenamiento
   */
  setSorting: (sortBy, sortOrder = 'desc') => {
    set({ sortBy, sortOrder })
    get().applyFilters()
  },

  /**
   * Aplicar todos los filtros activos
   */
  applyFilters: () => {
    const { products, searchTerm, categoryFilter, sortBy, sortOrder } = get()

    let filtered = [...products] // Filtro por búsqueda
    if (searchTerm) {
      const search = searchTerm.toLowerCase().trim()
      filtered = filtered.filter(
        (product) =>
          (product.nombre && product.nombre.toLowerCase().includes(search)) ||
          (product.proveedor &&
            product.proveedor.toLowerCase().includes(search)) ||
          (product.descripcion &&
            product.descripcion.toLowerCase().includes(search)) ||
          (product.categoria &&
            product.categoria.toLowerCase().includes(search))
      )
    }

    // Filtro por categoría
    if (categoryFilter && categoryFilter !== 'all') {
      filtered = filtered.filter(
        (product) => product.categoria === categoryFilter
      )
    }

    // Ordenamiento
    filtered.sort((a, b) => {
      let valueA = a[sortBy]
      let valueB = b[sortBy]

      // Convertir fechas
      if (sortBy === 'createdAt' || sortBy === 'updatedAt') {
        valueA = new Date(valueA)
        valueB = new Date(valueB)
      }

      // Convertir números
      if (sortBy === 'precio' || sortBy === 'stock' || sortBy === 'ventas') {
        valueA = Number(valueA) || 0
        valueB = Number(valueB) || 0
      }

      if (sortOrder === 'asc') {
        return valueA > valueB ? 1 : -1
      } else {
        return valueA < valueB ? 1 : -1
      }
    })

    set({ filteredProducts: filtered })
  },

  /**
   * Limpiar todos los filtros
   */
  clearFilters: () => {
    set({
      searchTerm: '',
      categoryFilter: 'all',
      sortBy: 'updatedAt',
      sortOrder: 'desc',
    })
    get().applyFilters()
  },

  // ============================================================================
  // UTILIDADES
  // ============================================================================

  /**
   * Obtener producto por ID
   */
  getProductById: (productId) => {
    const { products } = get()
    return products.find((product) => product.id === productId)
  },

  /**
   * Limpiar errores
   */
  clearError: () => {
    set({ error: null })
  },

  /**
   * Reset completo del store
   */
  reset: () => {
    set({
      products: [],
      filteredProducts: [],
      searchTerm: '',
      categoryFilter: 'all',
      sortBy: 'updatedAt',
      sortOrder: 'desc',
      loading: false,
      error: null,
      deleting: {},
      updating: {},
    })
  },
}))

export default useSupplierProductsStore
