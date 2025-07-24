/**
 * ============================================================================
 * PRODUCT IMAGES HOOK - GESTIÓN DE IMÁGENES
 * ============================================================================
 *
 * Hook especializado únicamente en la gestión de imágenes de productos.
 * Incluye subida, procesamiento, thumbnails y limpieza.
 */

import { create } from 'zustand'
import { supabase } from '../../../../services/supabase'
import { UploadService } from '../../../../shared/services/upload'
import { queryClient } from '../../../../utils/queryClient'
import { QUERY_KEYS } from '../../../../utils/queryClient'

const useProductImages = create((set, get) => ({
  // ============================================================================
  // ESTADO
  // ============================================================================
  loading: false,
  error: null,
  processingImages: {}, // { productId: boolean }

  // ============================================================================
  // OPERACIONES DE IMÁGENES
  // ============================================================================

  /**
   * Procesar imágenes del producto (versión inteligente)
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

      // 🔥 ACTUALIZAR CACHÉ DE REACT QUERY INMEDIATAMENTE
      try {
        if (finalImageData.length > 0) {
          // Setear data nueva inmediatamente (sin esperar refetch)
          const newThumbnailData = {
            thumbnails: finalImageData[0]?.thumbnails || null,
            thumbnail_url: finalImageData[0]?.thumbnail_url || null
          };
          
          queryClient.setQueryData(QUERY_KEYS.THUMBNAIL(productId), newThumbnailData);
        } else {
          // Si no hay imágenes, limpiar el cache
          queryClient.setQueryData(QUERY_KEYS.THUMBNAIL(productId), null);
        }
      } catch (cacheError) {
        console.warn('Error actualizando cache:', cacheError);
      }

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
   * Limpiar imágenes del producto
   */
  cleanupProductImages: async (productId) => {
    try {
      // Obtener imágenes actuales
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

      // 🔥 LIMPIAR CACHÉ DE REACT QUERY PARA THUMBNAILS
      try {
        // Limpiar cache inmediatamente (producto sin imágenes)
        queryClient.setQueryData(QUERY_KEYS.THUMBNAIL(productId), null);
      } catch (cacheError) {
        console.warn('Error limpiando cache:', cacheError);
      }

      return { success: true }
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
  // UTILIDADES
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
}))

export default useProductImages
