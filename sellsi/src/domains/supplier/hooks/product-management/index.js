/**
 * ============================================================================
 * PRODUCT MANAGEMENT HOOKS - EXPORTACIONES CENTRALIZADAS
 * ============================================================================
 *
 * Índice para todos los hooks especializados de gestión de productos.
 * Usa el hook de dashboard para datos y hooks especializados para operaciones.
 */

// Hooks especializados
export { default as useProductImages } from './useProductImages'
export { default as useProductSpecifications } from './useProductSpecifications'
export { default as useProductPriceTiers } from './useProductPriceTiers'
export { default as useProductCleanup } from './useProductCleanup'
export { default as useProductBackground } from './useProductBackground'

// Importar el hook de dashboard para datos
import { useSupplierDashboard } from '../dashboard-management/useSupplierDashboard'

// Hooks especializados para operaciones
import useProductImages from './useProductImages'
import useProductSpecifications from './useProductSpecifications'
import useProductPriceTiers from './useProductPriceTiers'
import useProductCleanup from './useProductCleanup'
import useProductBackground from './useProductBackground'

/**
 * Hook compuesto que combina dashboard (datos) con hooks especializados (operaciones)
 * Mantiene compatibilidad con el sistema actual mientras migra gradualmente
 */
export const useSupplierProductsComposite = () => {
  // Hook principal para datos (funcional)
  const dashboard = useSupplierDashboard()
  
  // Stores especializados para operaciones (Zustand)
  const imagesStore = useProductImages()
  const specificationsStore = useProductSpecifications()
  const priceTiersStore = useProductPriceTiers()
  const cleanupStore = useProductCleanup()
  const backgroundStore = useProductBackground()

  return {
    // DATOS: del dashboard hook funcional
    products: dashboard.products || [],
    filteredProducts: dashboard.filteredProducts || [],
    loading: dashboard.loading || false,
    error: dashboard.error || imagesStore.error || specificationsStore.error || priceTiersStore.error || cleanupStore.error || backgroundStore.error,
    
    // Estados de filtros del dashboard
    searchTerm: dashboard.searchTerm || '',
    categoryFilter: dashboard.categoryFilter || 'all',
    sortBy: dashboard.sortBy || 'updateddt',
    sortOrder: dashboard.sortOrder || 'desc',
    
    // Estados de operaciones de los stores especializados
    operationStates: {
      processing: {
        ...backgroundStore.processing,
        ...imagesStore.processing,
        ...specificationsStore.processing,
        ...priceTiersStore.processing,
      },
      deleting: dashboard.deleting || {},
      updating: dashboard.updating || {},
    },

    // ============================================================================
    // MÉTODOS CRUD BÁSICOS (del dashboard hook funcional)
    // ============================================================================
    loadProducts: dashboard.loadProducts || (() => Promise.resolve([])),
    getProductById: dashboard.getProductById || (() => null),
    
    // Métodos de filtros del dashboard
    setSearchTerm: dashboard.setSearchTerm || (() => {}),
    setCategoryFilter: dashboard.setCategoryFilter || (() => {}),
    setSorting: dashboard.setSorting || (() => {}),
    applyFilters: dashboard.applyFilters || (() => {}),
    clearFilters: dashboard.clearFilters || (() => {}),

    // Métodos CRUD básicos (placeholders - deberían implementarse en dashboard si se necesitan)
    createBasicProduct: dashboard.addProduct || (() => Promise.resolve(null)),
    updateBasicProduct: dashboard.updateProduct || (() => Promise.resolve(null)),
    deleteBasicProduct: dashboard.deleteProduct || (() => Promise.resolve()),

    // ============================================================================
    // MÉTODOS ESPECIALIZADOS (de los stores de Zustand)
    // ============================================================================
    
    // Gestión de imágenes
    processProductImages: imagesStore.processProductImages,
    cleanupImagesFromUrls: imagesStore.cleanupImagesFromUrls,
    deleteSpecificImages: imagesStore.deleteSpecificImages,
    cleanupAllProductImages: imagesStore.cleanupAllProductImages,
    verifyFileExistence: imagesStore.verifyFileExistence,

    // Gestión de especificaciones
    processProductSpecifications: specificationsStore.processProductSpecifications,
    validateSpecifications: specificationsStore.validateSpecifications,
    createSpecification: specificationsStore.createSpecification,
    formatSpecificationsForDisplay: specificationsStore.formatSpecificationsForDisplay,
    groupSpecificationsByCategory: specificationsStore.groupSpecificationsByCategory,

    // Gestión de tramos de precio
    processPriceTiers: priceTiersStore.processPriceTiers,
    validatePriceTiers: priceTiersStore.validatePriceTiers,
    calculatePriceForQuantity: priceTiersStore.calculatePriceForQuantity,
    formatTiersForDisplay: priceTiersStore.formatTiersForDisplay,

    // Limpieza y mantenimiento
    cleanupDeletedProduct: cleanupStore.cleanupDeletedProduct,
    cleanupOrphanedFiles: cleanupStore.cleanupOrphanedFiles,
    getCleanupProgress: cleanupStore.getCleanupProgress,

    // Procesamiento en background
    processProductInBackground: backgroundStore.processProductInBackground,
    createCompleteProduct: backgroundStore.createCompleteProduct,
    updateCompleteProduct: backgroundStore.updateCompleteProduct,
    getBackgroundTaskStatus: backgroundStore.getBackgroundTaskStatus,
    isProductProcessing: backgroundStore.isProductProcessing,
    getProcessingProducts: backgroundStore.getProcessingProducts,

    // ============================================================================
    // MÉTODOS COMPUESTOS PARA COMPATIBILIDAD
    // ============================================================================

    /**
     * Crear producto con procesamiento completo (compatible con API anterior)
     */
    createProduct: async (productData) => {
      return await backgroundStore.createCompleteProduct(productData, {
        dashboard,
        imagesStore,
        specificationsStore,
        priceTiersStore
      })
    },

    /**
     * Actualizar producto con procesamiento completo (compatible con API anterior)
     */
    updateProduct: async (productId, updates) => {
      return await backgroundStore.updateCompleteProduct(productId, updates, {
        dashboard,
        imagesStore,
        specificationsStore,
        priceTiersStore
      })
    },

    /**
     * Eliminar producto con limpieza completa (compatible con API anterior)
     */
    deleteProduct: async (productId) => {
      // Usar el método del dashboard para eliminar
      const deleteResult = await dashboard.deleteProduct?.(productId)
      
      if (deleteResult?.success) {
        // Luego hacer limpieza completa en background
        const cleanupResult = await cleanupStore.cleanupDeletedProduct(productId)
        return {
          success: true,
          cleanup: cleanupResult
        }
      }
      
      return deleteResult || { success: false, error: 'Delete method not available' }
    },

    // ============================================================================
    // UTILIDADES
    // ============================================================================
    clearError: () => {
      // Solo limpiar errores de los stores que tienen el método
      imagesStore.clearError?.()
      specificationsStore.clearError?.()
      priceTiersStore.clearError?.()
      cleanupStore.clearError?.()
      backgroundStore.clearError?.()
    },

    reset: () => {
      // Solo resetear stores que tienen el método
      imagesStore.reset?.()
      specificationsStore.reset?.()
      priceTiersStore.reset?.()
      cleanupStore.reset?.()
      backgroundStore.reset?.()
    },

    // Acceso a hooks individuales para casos avanzados
    hooks: {
      dashboard,
      imagesStore,
      specificationsStore,
      priceTiersStore,
      cleanupStore,
      backgroundStore
    }
  }
}

// Export default del hook compuesto
export default useSupplierProductsComposite
