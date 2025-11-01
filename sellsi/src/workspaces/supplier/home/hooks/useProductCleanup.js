/**
 * ============================================================================
 * PRODUCT CLEANUP HOOK - LIMPIEZA Y MANTENIMIENTO
 * ============================================================================
 *
 * Hook especializado en operaciones de limpieza, mantenimiento y auditoría.
 * Se enfoca en la limpieza de archivos huérfanos y mantenimiento del storage.
 */

import { create } from 'zustand'
import { supabase } from '../../../../services/supabase'

const useProductCleanup = create((set, get) => ({
  // ============================================================================
  // ESTADO
  // ============================================================================
  loading: false,
  error: null,
  cleanupStats: null, // Estadísticas de la última limpieza

  // ============================================================================
  // OPERACIONES DE LIMPIEZA
  // ============================================================================

  /**
   * Limpiar archivos huérfanos de un proveedor
   */
  cleanupOrphanedFiles: async (supplierId) => {
    set({ loading: true, error: null, cleanupStats: null })

    try {
      const stats = {
        filesScanned: 0,
        orphanedFiles: 0,
        filesDeleted: 0,
        errors: 0,
        storageFreed: 0 // en bytes
      }

      // 1. Obtener todos los productos del proveedor
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('productid')
        .eq('supplier_id', supplierId)

      if (productsError) throw productsError

      const productIds = products.map(p => p.productid)

      // 2. Obtener todas las imágenes registradas en BD
      const { data: registeredImages, error: imagesError } = await supabase
        .from('product_images')
        .select('image_url, thumbnail_url')
        .in('product_id', productIds)

      if (imagesError) throw imagesError

      const registeredUrls = new Set()
      registeredImages.forEach(img => {
        if (img.image_url) registeredUrls.add(img.image_url)
        if (img.thumbnail_url) registeredUrls.add(img.thumbnail_url)
      })

      // 3. Escanear archivos en storage
      const orphanedFiles = await get().findOrphanedFiles(supplierId, registeredUrls)
      stats.filesScanned = orphanedFiles.scanned
      stats.orphanedFiles = orphanedFiles.orphaned.length

      // 4. Eliminar archivos huérfanos
      for (const file of orphanedFiles.orphaned) {
        try {
          const { error } = await supabase.storage
            .from(file.bucket)
            .remove([file.path])

          if (!error) {
            stats.filesDeleted++
            stats.storageFreed += file.size || 0
          } else {
            stats.errors++
          }
        } catch (error) {
          stats.errors++
        }
      }

      set({ 
        loading: false, 
        cleanupStats: {
          ...stats,
          completedAt: new Date().toISOString(),
          supplierId
        }
      })

      return { success: true, stats }
    } catch (error) {
      set({ 
        loading: false, 
        error: `Error en limpieza: ${error.message}` 
      })
      return { success: false, error: error.message }
    }
  },

  /**
   * Encontrar archivos huérfanos en el storage
   */
  findOrphanedFiles: async (supplierId, registeredUrls) => {
    const orphanedFiles = []
    let scannedCount = 0

    try {
      // Escanear bucket principal
      const mainBucketFiles = await get().scanBucket('product-images', `${supplierId}/`, registeredUrls)
      orphanedFiles.push(...mainBucketFiles.orphaned)
      scannedCount += mainBucketFiles.scanned

      // Escanear bucket de thumbnails
      const thumbnailBucketFiles = await get().scanBucket('product-images-thumbnails', `${supplierId}/`, registeredUrls)
      orphanedFiles.push(...thumbnailBucketFiles.orphaned)
      scannedCount += thumbnailBucketFiles.scanned

      return {
        orphaned: orphanedFiles,
        scanned: scannedCount
      }
    } catch (error) {
      throw new Error(`Error escaneando archivos: ${error.message}`)
    }
  },

  /**
   * Escanear un bucket específico
   */
  scanBucket: async (bucketName, prefix, registeredUrls) => {
    const orphanedFiles = []
    let scannedCount = 0

    try {
      const { data: files, error } = await supabase.storage
        .from(bucketName)
        .list(prefix, { limit: 1000 })

      if (error) throw error

      for (const file of files || []) {
        if (file.name && file.name !== '.emptyFolderPlaceholder') {
          scannedCount++
          
          // Construir URL completa del archivo
          const { data: { publicUrl } } = supabase.storage
            .from(bucketName)
            .getPublicUrl(`${prefix}${file.name}`)

          // Verificar si está registrado en BD
          if (!registeredUrls.has(publicUrl)) {
            orphanedFiles.push({
              bucket: bucketName,
              path: `${prefix}${file.name}`,
              name: file.name,
              size: file.metadata?.size || 0,
              lastModified: file.updated_at,
              url: publicUrl
            })
          }
        }
      }

      // Escanear subdirectorios recursivamente
      const subdirs = files?.filter(f => !f.name && f.id) || []
      for (const subdir of subdirs) {
        const subResult = await get().scanBucket(bucketName, `${prefix}${subdir.name}/`, registeredUrls)
        orphanedFiles.push(...subResult.orphaned)
        scannedCount += subResult.scanned
      }

      return {
        orphaned: orphanedFiles,
        scanned: scannedCount
      }
    } catch (error) {
      throw new Error(`Error escaneando bucket ${bucketName}: ${error.message}`)
    }
  },

  /**
   * Limpiar registros de BD sin archivos correspondientes
   */
  cleanupOrphanedRecords: async (supplierId) => {
    set({ loading: true, error: null })

    try {
      const stats = {
        recordsScanned: 0,
        orphanedRecords: 0,
        recordsDeleted: 0,
        errors: 0
      }

      // Obtener productos del proveedor
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('productid')
        .eq('supplier_id', supplierId)

      if (productsError) throw productsError
      const productIds = products.map(p => p.productid)

      // Obtener registros de imágenes
      const { data: imageRecords, error: imagesError } = await supabase
        .from('product_images')
        .select('*')
        .in('product_id', productIds)

      if (imagesError) throw imagesError
      stats.recordsScanned = imageRecords.length

      // Verificar cada registro
      for (const record of imageRecords) {
        let shouldDelete = false

        // Verificar si el archivo principal existe
        if (record.image_url) {
          const fileExists = await get().verifyFileExists(record.image_url, 'product-images')
          if (!fileExists) shouldDelete = true
        }

        // Verificar si el thumbnail existe (opcional)
        if (record.thumbnail_url && !shouldDelete) {
          const thumbnailExists = await get().verifyFileExists(record.thumbnail_url, 'product-images-thumbnails')
          // Solo eliminar si ambos archivos no existen
          if (!thumbnailExists && record.image_url) {
            const mainExists = await get().verifyFileExists(record.image_url, 'product-images')
            if (!mainExists) shouldDelete = true
          }
        }

        if (shouldDelete) {
          stats.orphanedRecords++
          
          try {
            const { error } = await supabase
              .from('product_images')
              .delete()
              .eq('id', record.id)

            if (!error) {
              stats.recordsDeleted++
            } else {
              stats.errors++
            }
          } catch (error) {
            stats.errors++
          }
        }
      }

      set({ 
        loading: false,
        cleanupStats: {
          ...stats,
          type: 'records',
          completedAt: new Date().toISOString(),
          supplierId
        }
      })

      return { success: true, stats }
    } catch (error) {
      set({ 
        loading: false, 
        error: `Error limpiando registros: ${error.message}` 
      })
      return { success: false, error: error.message }
    }
  },

  /**
   * Verificar si un archivo existe en el storage
   */
  verifyFileExists: async (fileUrl, bucketName) => {
    try {
      // Extraer path del archivo de la URL
      const urlParts = fileUrl.split(`/${bucketName}/`)
      if (urlParts.length < 2) return false

      const filePath = urlParts[1]
      const fileName = filePath.split('/').pop()
      const directory = filePath.substring(0, filePath.lastIndexOf('/'))

      // Listar archivos en el directorio
      const { data: files, error } = await supabase.storage
        .from(bucketName)
        .list(directory, { limit: 1000 })

      if (error) return false

      // Verificar si el archivo existe
      return files?.some(file => file.name === fileName) || false
    } catch (error) {
      return false
    }
  },

  /**
   * Limpieza completa (archivos + registros)
   */
  fullCleanup: async (supplierId) => {
    try {
      // 1. Limpiar archivos huérfanos
      const filesResult = await get().cleanupOrphanedFiles(supplierId)
      
      // 2. Limpiar registros huérfanos
      const recordsResult = await get().cleanupOrphanedRecords(supplierId)

      const combinedStats = {
        files: filesResult.success ? filesResult.stats : null,
        records: recordsResult.success ? recordsResult.stats : null,
        completedAt: new Date().toISOString(),
        supplierId
      }

      set({ cleanupStats: combinedStats })

      return {
        success: filesResult.success && recordsResult.success,
        stats: combinedStats,
        errors: [
          ...(filesResult.success ? [] : [filesResult.error]),
          ...(recordsResult.success ? [] : [recordsResult.error])
        ]
      }
    } catch (error) {
      set({ error: `Error en limpieza completa: ${error.message}` })
      return { success: false, error: error.message }
    }
  },

  /**
   * Auditoría de consistencia de datos
   */
  auditDataConsistency: async (supplierId) => {
    try {
      const auditResults = {
        products: { total: 0, inconsistencies: [] },
        images: { total: 0, orphaned: 0, missing: 0 },
        priceTiers: { total: 0, invalid: 0 },
        timestamp: new Date().toISOString()
      }

      // Auditar productos
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('supplier_id', supplierId)

      if (productsError) throw productsError
      auditResults.products.total = products.length

      // Verificar consistencia de productos
      for (const product of products) {
        if (!product.productnm || product.productnm.trim() === '') {
          auditResults.products.inconsistencies.push({
            productId: product.productid,
            issue: 'Nombre vacío'
          })
        }

        if (!product.price || product.price < 0) {
          auditResults.products.inconsistencies.push({
            productId: product.productid,
            issue: 'Precio inválido'
          })
        }
      }

      // Auditar imágenes
      const { data: images, error: imagesError } = await supabase
        .from('product_images')
        .select('*')
        .in('product_id', products.map(p => p.productid))

      if (imagesError) throw imagesError
      auditResults.images.total = images.length

      // Verificar consistencia de imágenes
      for (const image of images) {
        // Verificar si el archivo principal existe
        const mainExists = await get().verifyFileExists(image.image_url, 'product-images')
        if (!mainExists) auditResults.images.missing++

        // Verificar producto padre
        const parentExists = products.some(p => p.productid === image.product_id)
        if (!parentExists) auditResults.images.orphaned++
      }

      return { success: true, audit: auditResults }
    } catch (error) {
      set({ error: `Error en auditoría: ${error.message}` })
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
   * Obtener estadísticas de la última limpieza
   */
  getLastCleanupStats: () => {
    const state = get()
    return state.cleanupStats
  },

  /**
   * Formatear tamaño de archivo
   */
  formatFileSize: (bytes) => {
    if (bytes === 0) return '0 Bytes'
    
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  },

  /**
   * Programar limpieza automática
   */
  scheduleAutoCleanup: (supplierId, intervalHours = 24) => {
    // Esta función podría implementar un sistema de limpieza programada
    // Por ahora, simplemente retorna la configuración
    return {
      supplierId,
      intervalHours,
      nextCleanup: new Date(Date.now() + intervalHours * 60 * 60 * 1000),
      enabled: true
    }
  },
}))

export default useProductCleanup
