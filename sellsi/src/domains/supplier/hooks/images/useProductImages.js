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
        console.warn(`⚠️ Cache corrompido detectado para producto ${productId}:`, cacheIntegrity.issues)
      }

      // 2. Limpiar archivos huérfanos si existen problemas
      if (!cacheIntegrity.isHealthy || cacheIntegrity.issues.some(issue => issue.includes('huérfano'))) {
        const cleanupResult = await StorageCleanupService.cleanupProductOrphans(productId)
        
        if (cleanupResult.cleaned > 0) {
          console.log(`🧹 Limpiados ${cleanupResult.cleaned} archivos huérfanos para producto ${productId}`)
        }

        if (cleanupResult.errors.length > 0) {
          console.warn('⚠️ Errores durante limpieza:', cleanupResult.errors)
        }
      }

      return {
        cacheHealthy: cacheIntegrity.isHealthy,
        cacheRepaired: cacheIntegrity.repaired,
        filesCleanedUp: true
      }
    } catch (error) {
      console.error('Error verificando integridad:', error)
      return {
        cacheHealthy: false,
        cacheRepaired: false,
        filesCleanedUp: false,
        error: error.message
      }
    }
  },

  // ============================================================================
  // OPERACIONES DE IMÁGENES MEJORADAS
  // ============================================================================

  /**
   * Procesar imágenes del producto (versión robusta con auto-limpieza)
   */
  processProductImages: async (productId, images) => {
    if (!images?.length) {
      return { success: true, data: [] }
    }

    set((state) => ({
      processingImages: { ...state.processingImages, [productId]: true },
      error: null,
    }))

    try {
      // 🔧 VERIFICAR INTEGRIDAD ANTES DE PROCESAR
      const integrityCheck = await get().ensureIntegrity(productId)
      
      if (integrityCheck.error) {
        console.warn('Continuando a pesar de errores de integridad:', integrityCheck.error)
      }

      const supplierId = localStorage.getItem('user_id')

      // 1. SEPARAR imágenes nuevas (archivos) de existentes (URLs)
      const newImages = []       // Archivos que hay que subir
      const existingUrls = []    // URLs que ya existen y se mantienen

      for (const img of images) {
        if (img && img.file instanceof File) {
          newImages.push(img)
        } else if (img instanceof File) {
          newImages.push(img)
        } else if (typeof img === 'string') {
          existingUrls.push(img)
        } else if (img && typeof img.url === 'string') {
          existingUrls.push(img.url)
        }
      }

      // 2. Obtener imágenes actuales
      const { data: currentImages } = await supabase
        .from('product_images')
        .select('image_url')
        .eq('product_id', productId)

      const currentUrls = currentImages?.map(img => img.image_url) || []

      // 3. ELIMINAR imágenes que ya no están en la nueva lista
      const urlsToDelete = currentUrls.filter(url => !existingUrls.includes(url))
      
      if (urlsToDelete.length > 0) {
        await get().deleteSpecificImages(productId, urlsToDelete)
      }

      // 4. COMBINAR URLs existentes + nuevas (con thumbnails)
      const finalImageData = []
      
      // Procesar URLs existentes (mantener con sus thumbnails actuales)
      const { data: currentImagesWithThumbnails } = await supabase
        .from('product_images')
        .select('image_url, thumbnail_url')
        .eq('product_id', productId)
      
      for (const url of existingUrls) {
        const existingImage = currentImagesWithThumbnails?.find(img => img.image_url === url)
        finalImageData.push({
          image_url: url,
          thumbnail_url: existingImage?.thumbnail_url || null
        })
      }

      // 5. SUBIR nuevas imágenes con thumbnails
      if (newImages.length > 0) {
        const files = newImages.map(img => img.file || img)
        
        const uploadResult = await UploadService.uploadMultipleImagesWithThumbnails(files, productId, supplierId)
        
        if (uploadResult.success && uploadResult.data) {
          for (const imageData of uploadResult.data) {
            finalImageData.push({
              image_url: imageData.publicUrl,
              thumbnail_url: imageData.thumbnailUrl || null
            })
          }
        }
      }

      // 6. REEMPLAZAR TODOS los registros en product_images
      if (finalImageData.length > 0) {
        // PRIMERO: Obtener URLs existentes ANTES de eliminar
        const { data: existingImages, error: fetchError } = await supabase
          .from('product_images')
          .select('image_url, thumbnail_url')
          .eq('product_id', productId)
        
        if (!fetchError && existingImages?.length > 0) {
          // Limpiar imágenes existentes del storage
          await get().cleanupImagesFromUrls(existingImages)
        }
        
        // DESPUÉS: Eliminar registros de la BD
        await supabase.from('product_images').delete().eq('product_id', productId)

        // Insertar todos los registros nuevos (con thumbnails)
        const imagesToInsert = finalImageData.map((imageData) => ({
          product_id: productId,
          image_url: imageData.image_url,
          thumbnail_url: imageData.thumbnail_url
        }))

        const { error } = await supabase.from('product_images').insert(imagesToInsert)
        
        if (error) throw error
      }

      set((state) => ({
        processingImages: { ...state.processingImages, [productId]: false },
      }))

      // 🔥 ACTUALIZAR CACHÉ DE REACT QUERY CON VERIFICACIÓN ROBUSTA
      try {
        const state = get()
        
        if (finalImageData.length > 0) {
          // Crear backup antes de actualizar
          const backup = await state.cacheService?.createCacheBackup(productId)
          
          // Setear data nueva inmediatamente (sin esperar refetch)
          const newThumbnailData = {
            thumbnails: finalImageData[0]?.thumbnails || null,
            thumbnail_url: finalImageData[0]?.thumbnail_url || null
          }
          
          queryClient.setQueryData(QUERY_KEYS.THUMBNAIL(productId), newThumbnailData)
          
          // Verificar que la actualización fue exitosa
          setTimeout(async () => {
            const verification = await state.cacheService?.verifyImageCacheIntegrity(productId)
            if (verification && !verification.isHealthy) {
              console.warn('Cache actualizado pero detectado problema, restaurando backup...')
              if (backup) {
                await state.cacheService?.restoreCacheFromBackup(backup)
              }
            }
          }, 1000)
          
        } else {
          // Si no hay imágenes, limpiar el cache
          queryClient.setQueryData(QUERY_KEYS.THUMBNAIL(productId), null)
        }
      } catch (cacheError) {
        console.warn('Error actualizando cache:', cacheError)
      }

      // 🧹 LIMPIEZA FINAL PARA PREVENIR ARCHIVOS HUÉRFANOS
      setTimeout(async () => {
        try {
          await StorageCleanupService.cleanupProductOrphans(productId)
        } catch (cleanupError) {
          console.warn('Error en limpieza final:', cleanupError)
        }
      }, 2000)

      return { success: true, data: finalImageData }
    } catch (error) {
      set((state) => ({
        processingImages: { ...state.processingImages, [productId]: false },
        error: `Error procesando imágenes: ${error.message}`,
      }))
      return { success: false, error: error.message }
    }
  },

  /**
   * Limpiar imágenes usando URLs directas
   */
  cleanupImagesFromUrls: async (imageRecords) => {
    try {
      // Limpiar imágenes originales
      for (const record of imageRecords) {
        if (record.image_url) {
          try {
            const urlParts = record.image_url.split('/product-images/')
            if (urlParts.length > 1) {
              const filePath = urlParts[1]
              await supabase.storage
                .from('product-images')
                .remove([filePath])
            }
          } catch (error) {
            // Error silenciado para operación de limpieza
          }
        }
        
        // Limpiar thumbnails
        if (record.thumbnail_url) {
          try {
            const urlParts = record.thumbnail_url.split('/product-images-thumbnails/')
            if (urlParts.length > 1) {
              const filePath = urlParts[1]
              await supabase.storage
                .from('product-images-thumbnails')
                .remove([filePath])
            }
          } catch (error) {
            // Error silenciado para operación de limpieza
          }
        }
      }
      
      // Limpiar thumbnails huérfanos del directorio
      try {
        const firstRecord = imageRecords[0]
        if (firstRecord && firstRecord.image_url) {
          const urlParts = firstRecord.image_url.split('/product-images/')
          if (urlParts.length > 1) {
            const directory = urlParts[1].split('/').slice(0, -1).join('/')
            
            // Listar todos los thumbnails en el directorio
            const { data: thumbnailFiles, error: listError } = await supabase.storage
              .from('product-images-thumbnails')
              .list(directory)
            
            if (!listError && thumbnailFiles && thumbnailFiles.length > 0) {
              // Eliminar todos los thumbnails del directorio
              const filesToDelete = thumbnailFiles.map(file => `${directory}/${file.name}`)
              await supabase.storage
                .from('product-images-thumbnails')
                .remove(filesToDelete)
            }
          }
        }
      } catch (error) {
        // Error silenciado para operación de limpieza
      }
    } catch (error) {
      throw error
    }
  },

  /**
   * Limpiar imágenes del producto (versión robusta)
   */
  cleanupProductImages: async (productId) => {
    try {
      // 🔧 VERIFICAR INTEGRIDAD ANTES DE LIMPIAR
      await get().ensureIntegrity(productId)

      // Usar el servicio especializado de limpieza
      const cleanupResult = await StorageCleanupService.cleanupProductOrphans(productId)
      
      if (cleanupResult.errors.length > 0) {
        console.warn('Errores durante limpieza robusta:', cleanupResult.errors)
      }

      // Método tradicional como fallback
      const { data: imageRecords, error } = await supabase
        .from('product_images')
        .select('image_url, thumbnail_url')
        .eq('product_id', productId)

      if (error) throw error

      if (imageRecords && imageRecords.length > 0) {
        // Limpiar archivos del storage
        await get().cleanupImagesFromUrls(imageRecords)
        
        // Eliminar registros de la BD
        const { error: deleteError } = await supabase
          .from('product_images')
          .delete()
          .eq('product_id', productId)

        if (deleteError) throw deleteError
      }

      // 🔥 LIMPIAR CACHÉ DE REACT QUERY CON VERIFICACIÓN
      try {
        const state = get()
        
        // Crear backup antes de limpiar
        const backup = await state.cacheService?.createCacheBackup(productId)
        
        // Limpiar cache inmediatamente (producto sin imágenes)
        queryClient.setQueryData(QUERY_KEYS.THUMBNAIL(productId), null)
        
        // Invalidar todas las queries relacionadas para forzar refetch
        await queryClient.invalidateQueries({
          queryKey: ['product-images', productId]
        })
        
        await queryClient.invalidateQueries({
          queryKey: ['thumbnail'],
          predicate: (query) => query.queryKey.includes(productId)
        })
        
      } catch (cacheError) {
        console.warn('Error limpiando cache:', cacheError)
      }

      console.log(`✅ Limpieza completa para producto ${productId}: ${cleanupResult.cleaned} archivos huérfanos eliminados`)

      return { success: true, cleaned: cleanupResult.cleaned }
    } catch (error) {
      set({ error: `Error limpiando imágenes: ${error.message}` })
      return { success: false, error: error.message }
    }
  },

  /**
   * Eliminar imágenes específicas por URL
   */
  deleteSpecificImages: async (productId, urlsToDelete) => {
    try {
      // Obtener registros completos para limpieza
      const { data: imageRecords, error } = await supabase
        .from('product_images')
        .select('image_url, thumbnail_url')
        .eq('product_id', productId)
        .in('image_url', urlsToDelete)

      if (error) throw error

      if (imageRecords && imageRecords.length > 0) {
        // Limpiar archivos del storage
        await get().cleanupImagesFromUrls(imageRecords)
        
        // Eliminar registros de la BD
        const { error: deleteError } = await supabase
          .from('product_images')
          .delete()
          .eq('product_id', productId)
          .in('image_url', urlsToDelete)

        if (deleteError) throw deleteError
      }

      // 🔥 ACTUALIZAR CACHÉ DE REACT QUERY PARA IMÁGENES ESPECÍFICAS
      try {
        // Obtener thumbnails actualizadas después de la eliminación
        const { data: updatedImages } = await supabase
          .from('product_images')
          .select('thumbnails, thumbnail_url')
          .eq('product_id', productId)
          .order('image_url', { ascending: true })
          .limit(1);

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
        console.warn('Error actualizando cache después de eliminación específica:', cacheError);
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
