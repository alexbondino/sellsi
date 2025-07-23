/**
 * ============================================================================
 * USE SUPPLIER PRODUCTS - FACADE PRINCIPAL REFACTORIZADO
 * ============================================================================
 *
 * Hook facade que combina los hooks especializados y proporciona
 * una interfaz unificada para la gestión de productos del proveedor.
 * 
 * ARQUITECTURA POST-REFACTOR:
 * - CRUD básico: useSupplierProductsCRUD
 * - Gestión de imágenes: useProductImages
 * - Especificaciones: useProductSpecifications
 * - Tramos de precio: useProductPriceTiers
 * - Procesamiento background: useProductBackground
 * - Limpieza: useProductCleanup
 * - Filtros: useSupplierProductFilters (se mantiene)
 */

import { useMemo, useEffect } from 'react'
import useSupplierProductsCRUD from './crud/useSupplierProductsCRUD'
import useProductImages from './images/useProductImages'
import useProductSpecifications from './specifications/useProductSpecifications'
import useProductPriceTiers from './pricing/useProductPriceTiers'
import useProductBackground from './background/useProductBackground'
import useProductCleanup from './cleanup/useProductCleanup'
import useSupplierProductFilters from './useSupplierProductFilters'
import { isProductActive } from '../../../utils/productActiveStatus'
import { supabase } from '../../../services/supabase'

/**
 * Hook facade para gestión completa de productos del proveedor
 * Inyección de dependencias opcional para testing y flexibilidad
 */
export const useSupplierProducts = (options = {}) => {
  // Inyección de dependencias con defaults
  const crud = options.crudHook || useSupplierProductsCRUD()
  const images = options.imagesHook || useProductImages()
  const specifications = options.specificationsHook || useProductSpecifications()
  const priceTiers = options.priceTiersHook || useProductPriceTiers()
  const background = options.backgroundHook || useProductBackground()
  const cleanup = options.cleanupHook || useProductCleanup()
  const filters = options.filtersHook || useSupplierProductFilters()

  // Store de filtros (mantenido tal como estaba)
  const {
    searchTerm,
    categoryFilter,
    sortBy,
    sortOrder,
    statusFilter,
    stockFilter,
    priceRange,
    dateRange,
    activeFiltersCount,
    setSearchTerm,
    setCategoryFilter,
    setStatusFilter,
    setStockFilter,
    setPriceRange,
    setDateRange,
    setSorting,
    applyFilters,
    clearFilters,
    getFiltersSummary,
    setPresetFilter,
    reset: resetFilters,
  } = filters

  // Estado consolidado (loading principal solo para CRUD, otros hooks no bloquean UI)
  const loading = crud.loading

  // Loading específico para operaciones (sin bloquear UI principal)
  const operationLoading = images.loading || specifications.loading || 
                          priceTiers.loading || cleanup.loading || background.hasActiveTasks()

  // Error consolidado (prioridad: crud > images > specs > pricing > cleanup)
  const error = crud.error || images.error || specifications.error || 
                priceTiers.error || cleanup.error || background.error

  // Estado de procesamiento consolidado (combina todos los tipos de procesamiento)
  const consolidatedProcessing = useMemo(() => {
    const processing = {}
    
    // Función helper para agregar estados de procesamiento
    const addProcessingStates = (stateObj) => {
      if (stateObj && typeof stateObj === 'object') {
        Object.entries(stateObj).forEach(([productId, isProcessing]) => {
          if (isProcessing === true) {
            processing[productId] = true
          }
        })
      }
    }
    
    // Agregar todos los tipos de procesamiento
    addProcessingStates(images.processingImages)
    addProcessingStates(specifications.processingSpecs)
    addProcessingStates(priceTiers.processingTiers)
    addProcessingStates(background.backgroundTasks)
    
    return processing
  }, [
    images.processingImages,
    specifications.processingSpecs,
    priceTiers.processingTiers,
    background.backgroundTasks
  ])

  // Productos filtrados (calculado usando el store de filtros)
  const filteredProducts = useMemo(() => {
    return applyFilters(crud.products)
  }, [
    crud.products,
    searchTerm,
    categoryFilter,
    statusFilter,
    stockFilter,
    priceRange,
    dateRange,
    sortBy,
    sortOrder,
  ])

  // Estadísticas (calculadas)
  const stats = useMemo(() => {
    const total = crud.products.length
    // ✅ USAR NUEVA LÓGICA: productos realmente activos (stock >= compra mínima)
    const active = crud.products.filter(isProductActive).length
    const inStock = crud.products.filter((p) => (p.productqty || 0) > 0).length
    const lowStock = crud.products.filter((p) => {
      const stock = p.productqty || 0
      return stock > 0 && stock <= 10
    }).length
    const outOfStock = crud.products.filter((p) => (p.productqty || 0) === 0).length
    const totalValue = crud.products.reduce(
      (sum, p) => sum + (p.price || 0) * (p.productqty || 0),
      0
    )

    return {
      total,
      active,
      inactive: total - active,
      inStock,
      lowStock,
      outOfStock,
      totalValue,
      averagePrice:
        total > 0
          ? crud.products.reduce((sum, p) => sum + (p.price || 0), 0) / total
          : 0,
    }
  }, [crud.products])

  // ============================================================================
  // EFECTOS - CARGA AUTOMÁTICA DE DATOS
  // ============================================================================

  /**
   * Cargar productos automáticamente cuando el hook se monta
   */
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session?.user?.id) {
          // Cargar productos si no están ya cargados Y no está cargando
          if (crud.products.length === 0 && !crud.loading) {
            console.log('[DEBUG] Loading initial products for supplier:', session.user.id)
            await crud.loadProducts(session.user.id)
          }
        }
      } catch (error) {
        console.error('Error loading initial supplier products:', error)
      }
    }

    loadInitialData()
  }, [crud.products.length, crud.loading]) // Dependencias específicas para evitar loops

  // Productos para UI (con formato mejorado)
  const uiProducts = useMemo(() => {
    return filteredProducts.map((product) => {
      // Calcular datos de tramos de precio si existen
      let tramoMin = null,
        tramoMax = null,
        tramoPrecioMin = null,
        tramoPrecioMax = null

      if (product.priceTiers?.length > 0) {
        const sorted = [...product.priceTiers].sort(
          (a, b) => a.min_quantity - b.min_quantity
        )
        tramoMin = sorted[0]?.min_quantity

        const maxQuantities = sorted
          .map((t) => t.max_quantity)
          .filter((x) => x != null)
        tramoMax =
          maxQuantities.length > 0
            ? Math.max(...maxQuantities)
            : sorted[sorted.length - 1]?.min_quantity

        tramoPrecioMin = Math.min(...sorted.map((t) => Number(t.price)))
        tramoPrecioMax = Math.max(...sorted.map((t) => Number(t.price)))
      }

      // Obtener imagen principal y thumbnail
      let imagenPrincipal = product.image_url
      let thumbnailUrl = null
      let imagenes = []

      if (product.images?.length > 0) {
        imagenes = product.images.map((img) => img.image_url)
        const principal = product.images.find((img) => img.is_primary)
        imagenPrincipal = principal ? principal.image_url : imagenes[0]
        
        // Obtener thumbnail_url de la imagen principal
        if (principal && principal.thumbnail_url) {
          thumbnailUrl = principal.thumbnail_url
        } else if (product.images[0]?.thumbnail_url) {
          thumbnailUrl = product.images[0].thumbnail_url
        }
      }

      return {
        id: product.productid,
        productid: product.productid,
        supplier_id: product.supplier_id,
        nombre: product.productnm,
        imagen: imagenPrincipal,
        thumbnail_url: thumbnailUrl,
        imagenes: imagenes,
        precio: product.price,
        categoria: product.category,
        stock: product.productqty,
        descripcion: product.description,
        compraMinima: product.minimum_purchase,
        negociable: product.negotiable,
        tipo: product.product_type,
        activo: product.is_active,
        createdAt: product.createddt,
        updatedAt: product.updateddt,
        priceTiers: product.priceTiers || [],
        tramoMin,
        tramoMax,
        tramoPrecioMin,
        tramoPrecioMax,
        delivery_regions: product.delivery_regions || [],
      }
    })
  }, [filteredProducts])

  // Reset completo
  const reset = () => {
    crud.clearError()
    images.clearError()
    specifications.clearError()
    priceTiers.clearError()
    cleanup.clearError()
    background.clearError()
    resetFilters()
  }

  // ============================================================================
  // API UNIFICADA FACADE
  // ============================================================================

  return {
    // ========================================
    // DATOS PRINCIPALES
    // ========================================
    products: crud.products,
    filteredProducts,
    uiProducts,
    stats,

    // ========================================
    // ESTADOS CONSOLIDADOS
    // ========================================
    loading, // Solo CRUD loading (para ProductGrid principal)
    operationLoading, // Loading de operaciones específicas
    error,
    operationStates: {
      ...crud.operationStates,
      processing: consolidatedProcessing, // ✅ Estado consolidado para ProductCard
      processingImages: images.processingImages,
      processingSpecs: specifications.processingSpecs,
      processingTiers: priceTiers.processingTiers,
      backgroundTasks: background.backgroundTasks
    },

    // ========================================
    // OPERACIONES PRINCIPALES (FACADE)
    // ========================================
    
    // CRUD básico
    loadProducts: crud.loadProducts,
    createProduct: (productData) => background.createCompleteProduct(productData, {
      crudHook: crud,
      imagesHook: images,
      specificationsHook: specifications,
      priceTiersHook: priceTiers
    }),
    updateProduct: (productId, updates) => background.updateCompleteProduct(productId, updates, {
      crudHook: crud,
      imagesHook: images,
      specificationsHook: specifications,
      priceTiersHook: priceTiers
    }),
    deleteProduct: crud.deleteProduct,

    // Operaciones especializadas (acceso directo si se necesita)
    processImages: async (productId, imagesList) => {
      console.log('[DEBUG] Starting processImages for product:', productId)
      const result = await images.processProductImages(productId, imagesList)
      
      // Si el procesamiento fue exitoso, refrescar el producto para mostrar las nuevas imágenes
      if (result.success) {
        try {
          console.log('[DEBUG] Image processing successful, refreshing product:', productId)
          const refreshResult = await crud.refreshProduct(productId)
          
          if (refreshResult.success) {
            console.log('[DEBUG] Product refreshed successfully:', refreshResult.data)
            
            // FORZAR UN RE-RENDER ADICIONAL con un pequeño delay
            // para asegurar que React detecte el cambio
            setTimeout(() => {
              console.log('[DEBUG] Triggering additional refresh...')
              crud.refreshProduct(productId)
            }, 100)
          } else {
            console.error('[DEBUG] Product refresh failed:', refreshResult.error)
          }
        } catch (error) {
          console.warn('Error refreshing product after image processing:', error)
        }
      } else {
        console.error('[DEBUG] Image processing failed:', result.error)
      }
      
      return result
    },
    processSpecifications: specifications.processProductSpecifications,
    processPriceTiers: priceTiers.processPriceTiers,
    cleanupOrphanedFiles: cleanup.cleanupOrphanedFiles,

    // ========================================
    // FILTROS (DELEGATION)
    // ========================================
    searchTerm,
    categoryFilter,
    sortBy,
    sortOrder,
    statusFilter,
    stockFilter,
    priceRange,
    dateRange,
    activeFiltersCount,
    setSearchTerm,
    setCategoryFilter,
    setStatusFilter,
    setStockFilter,
    setPriceRange,
    setDateRange,
    setSorting,
    clearFilters,
    setPresetFilter,

    // ========================================
    // UTILIDADES
    // ========================================
    clearError: () => {
      crud.clearError()
      images.clearError()
      specifications.clearError()
      priceTiers.clearError()
      cleanup.clearError()
      background.clearError()
    },
    reset,
    getFiltersSummary,

    // ========================================
    // HOOKS INDIVIDUALES (para casos avanzados)
    // ========================================
    hooks: {
      crud,
      images,
      specifications,
      priceTiers,
      background,
      cleanup,
      filters
    },

    // ========================================
    // BACKWARD COMPATIBILITY
    // ========================================
    // Mantener compatibilidad con código existente
    getProductById: (productId) => crud.products.find(p => p.productid === productId),
    refreshProduct: crud.refreshProduct,
  }
}

export default useSupplierProducts
