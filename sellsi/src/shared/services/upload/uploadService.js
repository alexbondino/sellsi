// uploadService.js - Servicio optimizado para uploads a Supabase Storage
import { supabase } from '../../../services/supabase.js'
import { StorageCleanupService } from '../storage/storageCleanupService.js'

// Solo verificar en desarrollo
if (import.meta.env.DEV && !supabase) {
  console.error('❌ [UploadService] Objeto supabase no disponible!')
  throw new Error('Supabase client no inicializado')
}


/**
 * Servicio optimizado para subir archivos PDF a Supabase Storage
 * Implementa buenas prácticas para agilidad del backend
 */
export class UploadService {
  static PDF_BUCKET = 'product-documents'
  static IMAGE_BUCKET = 'product-images'
  static THUMBNAIL_BUCKET = 'product-images-thumbnails'  // ✅ NUEVO: Bucket para thumbnails
  static MAX_PDF_SIZE = 5 * 1024 * 1024 // 5MB
  static MAX_IMAGE_SIZE = 2 * 1024 * 1024 // 2MB

  /**
   * Subir archivo PDF con validación y optimización
   * @param {File} file - Archivo PDF a subir
   * @param {string} productId - ID del producto
   * @param {string} supplierId - ID del proveedor
   * @returns {Promise<{success: boolean, data?: any, error?: string}>}
   */
  static async uploadPDF(file, productId, supplierId) {
    try {
      // Validaciones
      if (!file) {
        return { success: false, error: 'No se proporcionó archivo' }
      }

      if (file.type !== 'application/pdf') {
        return { success: false, error: 'Solo se permiten archivos PDF' }
      }

      if (file.size > this.MAX_PDF_SIZE) {
        return { success: false, error: 'El archivo debe ser menor a 5MB' }
      }

      // Generar nombre único del archivo
      const timestamp = Date.now()
      const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
      const fileName = `${supplierId}/${productId}/${timestamp}_${sanitizedFileName}`

      // Subir archivo a Supabase Storage
      const { data, error } = await supabase.storage
        .from(this.PDF_BUCKET)
        .upload(fileName, file, {
          cacheControl: '3600', // Cache por 1 hora
          upsert: false, // No sobrescribir archivos existentes
        })

      if (error) {
        return { success: false, error: error.message }
      }

      // Obtener URL pública
      const { data: urlData } = supabase.storage
        .from(this.PDF_BUCKET)
        .getPublicUrl(fileName)

      return {
        success: true,
        data: {
          id: data.id || fileName,
          fileName: file.name,
          filePath: fileName,
          publicUrl: urlData.publicUrl,
          size: file.size,
          type: file.type,
          uploadedAt: new Date().toISOString(),
        },
      }
    } catch (error) {
      return { success: false, error: 'Error inesperado al subir archivo' }
    }
  }

  /**
   * Subir múltiples archivos PDF de forma optimizada
   * @param {File[]} files - Array de archivos PDF
   * @param {string} productId - ID del producto
   * @param {string} supplierId - ID del proveedor
   * @returns {Promise<{success: boolean, data?: any[], errors?: string[]}>}
   */
  static async uploadMultiplePDFs(files, productId, supplierId) {
    try {
      const uploadPromises = files.map((file) =>
        this.uploadPDF(file, productId, supplierId)
      )

      const results = await Promise.allSettled(uploadPromises)

      const successful = []
      const errors = []

      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value.success) {
          successful.push(result.value.data)
        } else {
          const errorMsg =
            result.status === 'rejected'
              ? result.reason.message
              : result.value.error
          errors.push(`Archivo ${files[index].name}: ${errorMsg}`)
        }
      })

      return {
        success: successful.length > 0,
        data: successful,
        errors: errors.length > 0 ? errors : undefined,
      }
    } catch (error) {
      return { success: false, errors: ['Error inesperado al subir archivos'] }
    }
  }

  /**
   * Eliminar archivo PDF de Supabase Storage
   * @param {string} filePath - Ruta del archivo en storage
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  static async deletePDF(filePath) {
    try {
      const { error } = await supabase.storage
        .from(this.PDF_BUCKET)
        .remove([filePath])

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      return { success: false, error: 'Error inesperado al eliminar archivo' }
    }
  }

  /**
   * Subir imagen con optimización
   * @param {File} file - Archivo de imagen
   * @param {string} productId - ID del producto
   * @param {string} supplierId - ID del proveedor
   * @returns {Promise<{success: boolean, data?: any, error?: string}>}
   */
  static async uploadImage(file, productId, supplierId) {
    try {
      // Validaciones
      if (!file) {
        return { success: false, error: 'No se proporcionó archivo' }
      }

      if (!file.type.startsWith('image/')) {
        return { success: false, error: 'Solo se permiten archivos de imagen' }
      }

      if (file.size > this.MAX_IMAGE_SIZE) {
        return { success: false, error: 'La imagen debe ser menor a 2MB' }
      }

      // Generar nombre único del archivo
      const timestamp = Date.now()
      const extension = file.name.split('.').pop()
      const fileName = `${supplierId}/${productId}/${timestamp}.${extension}`

      // Subir archivo a Supabase Storage
      const { data, error } = await supabase.storage
        .from(this.IMAGE_BUCKET)
        .upload(fileName, file, {
          cacheControl: '3600', // Cache por 1 hora
          upsert: false,
        })

      if (error) {
        return { success: false, error: error.message }
      }

      // Obtener URL pública
      const { data: urlData } = supabase.storage
        .from(this.IMAGE_BUCKET)
        .getPublicUrl(fileName)

      return {
        success: true,
        data: {
          id: data.id || fileName,
          fileName: file.name,
          filePath: fileName,
          publicUrl: urlData.publicUrl,
          size: file.size,
          type: file.type,
          uploadedAt: new Date().toISOString(),
        },
      }
    } catch (error) {
      return { success: false, error: 'Error inesperado al subir imagen' }
    }
  }

  /**
   * ✅ NUEVO: Subir múltiples imágenes con generación automática de thumbnails
   * @param {File[]} files - Archivos de imagen a subir
   * @param {string} productId - ID del producto
   * @param {string} supplierId - ID del proveedor
   * @param {Object} options - Opciones adicionales
   * @param {boolean} options.replaceExisting - Si debe limpiar imágenes existentes antes
   * @returns {Promise<{success: boolean, data?: any[], errors?: string[]}>}
   */
  static async uploadMultipleImagesWithThumbnails(files, productId, supplierId, options = {}) {
    const { replaceExisting = false } = options
    
    try {
      // Si replaceExisting es true, limpiar todas las imágenes del producto primero
      if (replaceExisting) {
        try {
          const cleanupResult = await StorageCleanupService.deleteAllProductImages(productId)
        } catch (cleanupError) {
          console.warn('⚠️ [uploadMultipleImages] Error en limpieza (continuando):', cleanupError.message)
          // No fallar por errores de limpieza, continuar con el upload
        }
      }
      // En modo reemplazo, crear referencias para archivos existentes
      if (replaceExisting) {
        const existingFiles = files.filter(file => file.isExisting || (file.file && file.file.size === 0))
        const newFiles = files.filter(file => !(file.isExisting || (file.file && file.file.size === 0)))
        // Crear referencias para archivos existentes EN PARALELO
        const referencePromises = existingFiles.map(async (file, index) => {
          if (file.url) {
            const { error: dbInsertError } = await supabase
              .from('product_images')
              .insert({
                product_id: productId,
                image_url: file.url,
                thumbnail_url: null,
                thumbnails: null,
                image_order: index // Usar índice del array
              })
            if (dbInsertError) {
              console.error('❌ [uploadMultipleImages] Error recreando referencia:', dbInsertError.message)
              return { success: false, error: dbInsertError.message }
            } else {
              return { success: true }
            }
          }
          return { success: false, error: 'No URL provided' }
        })
        // Esperar a que todas las referencias se creen
        await Promise.allSettled(referencePromises)
        // Procesar solo archivos nuevos
        const filesToProcess = newFiles
        if (filesToProcess.length === 0) {
          return {
            success: true,
            data: [],
            message: `Referencias recreadas: ${existingFiles.length}`
          }
        }
        // Subir archivos nuevos
          const uploadPromises = filesToProcess.map((file, index) => 
            this.uploadImageWithThumbnail(file, productId, supplierId, index === 0)
          )
        const results = await Promise.allSettled(uploadPromises)
        const successful = []
        const errors = []
        results.forEach((result, index) => {
          if (result.status === 'fulfilled' && result.value?.success) {
            successful.push(result.value.data)
          } else {
            const errorMsg = result.status === 'rejected' 
              ? (result.reason?.message || 'Error desconocido')
              : (result.value?.error || 'Error de procesamiento')
            errors.push(`Archivo ${filesToProcess[index].name || filesToProcess[index].file?.name}: ${errorMsg}`)
          }
        })
          // 🔔 Dispatch evento global cuando haya al menos una subida exitosa
          if (successful.length > 0) {
            this.dispatchProductImagesReady(productId, { count: successful.length, mode: 'multiple', mainUpdated: successful.some(img => img.isMain) })
          }
        return {
          success: successful.length > 0 || existingFiles.length > 0,
          data: successful,
          errors: errors.length > 0 ? errors : undefined,
          message: `Nuevos: ${successful.length}, Referencias: ${existingFiles.length}`
        }
      }
      // MODO NORMAL: Filtrar imágenes existentes para no procesarlas
      const newFiles = files.filter(file => {
        // Si tiene isExisting o si el file.size es 0 (marcador de existente), saltarlo
        const isExisting = file.isExisting || (file.file && file.file.size === 0);
        return !isExisting;
      });
      // Si no hay archivos nuevos que subir, retornar éxito
      if (newFiles.length === 0) {
        return {
          success: true,
          data: [],
          message: 'No hay archivos nuevos que procesar'
        };
      }
      // Subir imágenes en paralelo - solo thumbnails para la primera (principal)
      const uploadPromises = newFiles.map((file, index) => 
        this.uploadImageWithThumbnail(file, productId, supplierId, index === 0)
      )
      const results = await Promise.allSettled(uploadPromises)
      const successful = []
      const errors = []
      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value?.success) {
          successful.push(result.value.data)
        } else {
          const errorMsg = result.status === 'rejected' 
            ? (result.reason?.message || 'Error desconocido')
            : (result.value?.error || 'Error de procesamiento')
          errors.push(`Archivo ${newFiles[index].name || newFiles[index].file?.name}: ${errorMsg}`)
        }
      })
        // 🔔 Dispatch evento global cuando haya al menos una subida exitosa
        if (successful.length > 0) {
          this.dispatchProductImagesReady(productId, { count: successful.length, mode: 'multiple', mainUpdated: successful.some(img => img.isMain) })
        }
      return {
        success: successful.length > 0 || files.length > newFiles.length, // Éxito si subió algo O si había existentes
        data: successful,
        errors: errors.length > 0 ? errors : undefined,
      }
    } catch (error) {
      return { success: false, errors: ['Error inesperado al subir imágenes'] }
    }
  }

  /**
   * ✅ NUEVO: Subir una imagen individual con generación automática de thumbnail
   * @param {File} file - Archivo de imagen a subir
   * @param {string} productId - ID del producto
   * @param {string} supplierId - ID del proveedor
   * @param {boolean} isMainImage - Si es la imagen principal (para generar thumbnails)
   * @param {Object} options - Opciones adicionales
   * @param {boolean} options.replaceExisting - Si debe limpiar imágenes existentes antes
   * @returns {Promise<{success: boolean, data?: any, error?: string}>}
   */
  static async uploadImageWithThumbnail(file, productId, supplierId, isMainImage = false, options = {}) {
    const { replaceExisting = false } = options
    

    try {
      // 🔥 REMOVIDO: Limpieza duplicada (ya se hace en uploadMultipleImagesWithThumbnails)

      // 🔥 CRÍTICO: Manejar objetos wrapper del ImageUploader
      const actualFile = file?.file || file // Si es wrapper, usar file.file, sino usar file directamente
      
      // 1. Validaciones
      if (!actualFile) {
        console.error('❌ [uploadImageWithThumbnail] No se proporcionó archivo')
        return { success: false, error: 'No se proporcionó archivo' }
      }

      if (!actualFile.type || !actualFile.type.startsWith('image/')) {
        console.error('❌ [uploadImageWithThumbnail] Tipo de archivo inválido:', actualFile.type)
        return { success: false, error: 'Solo se permiten archivos de imagen' }
      }

      if (actualFile.size > this.MAX_IMAGE_SIZE) {
        console.error('❌ [uploadImageWithThumbnail] Archivo muy grande:', actualFile.size, 'vs', this.MAX_IMAGE_SIZE)
        return { success: false, error: 'La imagen debe ser menor a 2MB' }
      }

  // 2. Generar nombre único del archivo (timestamp + sufijo aleatorio + nombre saneado)
  const timestamp = Date.now()
  const rand = (crypto?.randomUUID ? crypto.randomUUID().slice(0,8) : Math.random().toString(36).slice(2,10))
  const safeName = actualFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')
  const fileName = `${supplierId}/${productId}/${timestamp}_${rand}_${safeName}`
      
      // 🔥 REMOVIDO: Verificación de bucket (innecesaria para cada imagen)

      const { data, error } = await supabase.storage
        .from(this.IMAGE_BUCKET)
        .upload(fileName, actualFile, {
          cacheControl: '3600',
          upsert: false,
        })

      if (error) {
        console.error('❌ [uploadImageWithThumbnail] Error en upload:', error)
        return { success: false, error: error.message }
      }

      // 4. Obtener URL pública de la imagen original
      const { data: publicUrlData } = supabase.storage
        .from(this.IMAGE_BUCKET)
        .getPublicUrl(fileName)

      
      // Insert atómico del registro y obtención del orden mediante RPC
      let imageOrder = 0
      try {
        const { data: rpcResult, error: rpcError } = await supabase.rpc('insert_image_with_order', {
          p_product_id: productId,
          p_image_url: publicUrlData.publicUrl,
          p_supplier_id: supplierId
        })
        if (rpcError) {
          console.error('❌ [uploadImageWithThumbnail] Error RPC insert_image_with_order:', rpcError.message)
        } else {
          imageOrder = rpcResult ?? 0
        }
      } catch (rpcCatch) {
        console.error('❌ [uploadImageWithThumbnail] Excepción RPC:', rpcCatch)
      }

      // 5. Generar thumbnail usando Edge Function (SOLO para imagen principal y NO WebP)
      let thumbnailUrl = null
  // Decidir si es imagen principal por orden real (prioridad) o flag pasado
  const effectiveIsMain = imageOrder === 0 || isMainImage
  if (effectiveIsMain) {
        // Skip thumbnail generation for WebP images since Edge Function doesn't support them
        if (actualFile.type !== 'image/webp') {
          try {
            const thumbnailResult = await this.generateThumbnail(publicUrlData.publicUrl, productId, supplierId)
            if (thumbnailResult.success) {
              thumbnailUrl = thumbnailResult.thumbnailUrl
            }
          } catch (thumbnailError) {
            // Continue without thumbnail if generation fails
          }
        }
      }

      return {
        success: true,
        data: {
          id: data.id || fileName,
          fileName: actualFile.name,
          filePath: fileName,
          publicUrl: publicUrlData.publicUrl,
          thumbnailUrl: thumbnailUrl, // ✅ NUEVO: URL del thumbnail
          size: actualFile.size,
          type: actualFile.type,
          uploadedAt: new Date().toISOString(),
          imageOrder,
          isMain: imageOrder === 0,
        },
      }
    } catch (error) {
      // Logging detallado para debugging
      const actualFile = file?.file || file
      console.error('🔥 [uploadImageWithThumbnail] Error detallado:', {
        fileName: actualFile?.name,
        fileSize: actualFile?.size,
        fileType: actualFile?.type,
        isWrapper: !!file?.file,
        productId,
        supplierId,
        errorMessage: error?.message,
        errorStack: error?.stack,
        errorName: error?.name
      })
      
      return { 
        success: false, 
        error: `Error al subir imagen ${actualFile?.name}: ${error?.message || error || 'Error desconocido'}` 
      }
    }
  }

  /**
   * ✅ NUEVO: Generar thumbnail usando Edge Function (solo para imagen principal)
   * @param {string} imageUrl - URL de la imagen original
   * @param {string} productId - ID del producto
   * @param {string} supplierId - ID del proveedor
   * @returns {Promise<{success: boolean, thumbnailUrl?: string, error?: string}>}
   */
  static async generateThumbnail(imageUrl, productId, supplierId) {
    try {
      const response = await fetch(`${supabase.supabaseUrl}/functions/v1/generate-thumbnail`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabase.supabaseKey}`,
        },
        body: JSON.stringify({
          imageUrl: imageUrl, // Correcto: imageUrl en lugar de imagePath
          productId,
          supplierId,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Edge Function error: ${response.status} ${errorText}`)
      }

      const result = await response.json()
      if (result.thumbnailUrl) {
        return {
          success: true,
          thumbnailUrl: result.thumbnailUrl,
        }
      } else {
        return {
          success: false,
          error: 'No thumbnail URL returned from Edge Function',
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
      }
    }
  }

  /**
   * 🔔 Dispatch de evento global para notificar actualización de imágenes de un producto
   * Consumido por UniversalProductImage (listener productImagesReady) para invalidar cache y recargar thumbnails.
   * @param {string} productId
   * @param {object} meta Información adicional (count, mode, mainUpdated, etc.)
   */
  static dispatchProductImagesReady(productId, meta = {}) {
    try {
      if (typeof window === 'undefined' || !productId) return;
      const detail = { productId, timestamp: Date.now(), ...meta };
      window.dispatchEvent(new CustomEvent('productImagesReady', { detail }));
    } catch (e) {
      // Silencioso: no bloquear flujo de upload por errores de dispatch
    }
  }

  /**
   * Crear buckets si no existen (función de inicialización)
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  static async initializeBuckets() {
    try {
      // Verificar y crear bucket para PDFs
      const { data: pdfBuckets } = await supabase.storage.listBuckets()
      const pdfBucketExists = pdfBuckets?.some(
        (bucket) => bucket.name === this.PDF_BUCKET
      )

      if (!pdfBucketExists) {
        const { error: pdfError } = await supabase.storage.createBucket(
          this.PDF_BUCKET,
          {
            public: true,
            allowedMimeTypes: ['application/pdf'],
            fileSizeLimit: this.MAX_PDF_SIZE,
          }
        )
        // No logs
      }

      // Verificar y crear bucket para imágenes
      const imageBucketExists = pdfBuckets?.some(
        (bucket) => bucket.name === this.IMAGE_BUCKET
      )

      if (!imageBucketExists) {
        const { error: imageError } = await supabase.storage.createBucket(
          this.IMAGE_BUCKET,
          {
            public: true,
            allowedMimeTypes: ['image/*'],
            fileSizeLimit: this.MAX_IMAGE_SIZE,
          }
        )
        // No logs
      }

      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }
}

export default UploadService
