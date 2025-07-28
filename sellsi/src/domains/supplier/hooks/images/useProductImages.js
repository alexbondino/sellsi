/**
 * ============================================================================
 * PRODUCT IMAGES HOOK - GESTIÓN DE IMÁGENES CON LIMPIEZA Y CACHE ROBUSTO
 * ============================================================================
 *
 * Hook especializado únicamente en la gestión de imágenes de productos.
 * Incluye subida, procesamiento, thumbnails y limpieza robusta.
 * 
 * MEJORAS v2.0:
 * - Sistema de limpieza automática de archivos huérfanos
 * - Gestión robusta de cache con auto-reparación
 * - Verificación de integridad automática
 */

import { create } from 'zustand'
import { supabase } from '../../../../services/supabase'
import { UploadService } from '../../../../shared/services/upload'
import { queryClient } from '../../../../utils/queryClient'
import { QUERY_KEYS } from '../../../../utils/queryClient'
import { StorageCleanupService } from '../../../../shared/services/storage/storageCleanupService'
import { CacheManagementService } from '../../../../shared/services/cache/cacheManagementService'

const useProductImages = create((set, get) => ({
  // ============================================================================
  // ESTADO
  // ============================================================================
  loading: false,
  error: null,
  processingImages: {}, // { productId: boolean }
  cacheService: null, // Se inicializa dinámicamente

  // ============================================================================
  // INICIALIZACIÓN
  // ============================================================================
  
  /**
   * Inicializar servicios (se ejecuta automáticamente)
   */
  _initializeServices: () => {
    const state = get()
    if (!state.cacheService) {
      set({ cacheService: new CacheManagementService(queryClient) })
    }
  },

  /**
   * Verificar y reparar integridad antes de operaciones críticas
   */
  ensureIntegrity: async (productId) => {
    const state = get()
    
    // Inicializar servicios si no existen
    if (!state.cacheService) {
      state._initializeServices()
    }

    try {
      // 1. Verificar integridad del cache
      const cacheIntegrity = await state.cacheService.verifyImageCacheIntegrity(productId)
      
      if (!cacheIntegrity.isHealthy) {
        try {
          if (updatedImages && updatedImages.length > 0) {
            // Actualizar cache con las nuevas imágenes restantes
            const newThumbnailData = {
              thumbnails: updatedImages[0]?.thumbnails || null,
              thumbnail_url: updatedImages[0]?.thumbnail_url || null
            };
            
            queryClient.setQueryData(QUERY_KEYS.THUMBNAIL(productId), newThumbnailData);
          } else {
            // Si no quedan imágenes, limpiar el cache
            queryClient.setQueryData(QUERY_KEYS.THUMBNAIL(productId), null);
          }
        } catch (cacheError) {
          // Error limpiando cache, continuar
        }
      }

      return { success: true }
    } catch (error) {
      set({ error: `Error eliminando imágenes: ${error.message}` })
      return { success: false, error: error.message }
    }
  },

  /**
   * Verificar si archivos existen en el storage (para debugging)
   */
  verifyFileExistence: async (filePaths) => {
    const results = []
    
    for (const filePath of filePaths) {
      try {
        const { data, error } = await supabase.storage
          .from('product-images')
          .list(filePath.substring(0, filePath.lastIndexOf('/')), {
            limit: 1000,
            search: filePath.substring(filePath.lastIndexOf('/') + 1)
          })
        
        const exists = !error && data?.length > 0
        results.push({ filePath, exists })
      } catch (error) {
        results.push({ filePath, exists: false, error: error.message })
      }
    }
    
    return results
  },

  /**
   * Subir múltiples imágenes
   */
  uploadImages: async (files, productId, supplierId) => {
    set((state) => ({
      processingImages: { ...state.processingImages, [productId]: true },
      error: null,
    }))

    try {
      const uploadResult = await UploadService.uploadMultipleImagesWithThumbnails(files, productId, supplierId)
      
      set((state) => ({
        processingImages: { ...state.processingImages, [productId]: false },
      }))

      return uploadResult
    } catch (error) {
      set((state) => ({
        processingImages: { ...state.processingImages, [productId]: false },
        error: `Error subiendo imágenes: ${error.message}`,
      }))
      return { success: false, error: error.message }
    }
  },

  // ============================================================================
  // UTILIDADES MEJORADAS
  // ============================================================================

  /**
   * Limpiar errores
   */
  clearError: () => set({ error: null }),

  /**
   * Obtener estado de procesamiento
   */
  isProcessingImages: (productId) => {
    const state = get()
    return state.processingImages[productId] || false
  },

  /**
   * Inicializar monitoreo automático de salud del cache
   */
  startHealthMonitoring: (productId, intervalMs = 60000) => {
    const state = get()
    
    if (!state.cacheService) {
      state._initializeServices()
    }

    return state.cacheService?.startCacheHealthMonitoring(productId, intervalMs)
  },

  /**
   * Ejecutar verificación manual de integridad
   */  
  runHealthCheck: async (productId) => {
    try {
      const integrityResult = await get().ensureIntegrity(productId)
      const cleanupResult = await StorageCleanupService.cleanupProductOrphans(productId)
      
      return {
        success: true,
        cache: {
          healthy: integrityResult.cacheHealthy,
          repaired: integrityResult.cacheRepaired
        },
        storage: {
          cleaned: cleanupResult.cleaned,
          errors: cleanupResult.errors
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  },

  /**
   * Estadísticas de uso del sistema
   */
  getSystemStats: async () => {
    try {
      // Obtener estadísticas de cache
      const cacheStats = queryClient.getQueryCache().getAll().filter(query => 
        query.queryKey.includes('product-images') || query.queryKey.includes('thumbnail')
      )

      // Obtener productos con imágenes
      const { data: productsWithImages, error } = await supabase
        .from('product_images')
        .select('product_id')
        .limit(1000)

      const uniqueProducts = new Set(productsWithImages?.map(p => p.product_id) || [])

      return {
        cacheEntries: cacheStats.length,
        productsWithImages: uniqueProducts.size,
        cacheHealth: cacheStats.filter(q => q.state.status === 'success').length / cacheStats.length,
        lastUpdated: Math.max(...cacheStats.map(q => q.state.dataUpdatedAt))
      }
    } catch (error) {
      return {
        error: error.message
      }
    }
  }
}))

// Inicializar servicios automáticamente
useProductImages.getState()._initializeServices()

export default useProductImages
