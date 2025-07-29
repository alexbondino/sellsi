// uploadService.js - Servicio optimizado para uploads a Supabase Storage
import { supabase } from '../../../services/supabase.js'

// Solo verificar en desarrollo
if (import.meta.env.DEV && !supabase) {
  console.error('❌ [UploadService] Objeto supabase no disponible!')
  throw new Error('Supabase client no inicializado')
}

if (import.meta.env.DEV) {
  console.log('✅ [UploadService] Supabase client inicializado correctamente')
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
   * @returns {Promise<{success: boolean, data?: any[], errors?: string[]}>}
   */
  static async uploadMultipleImagesWithThumbnails(files, productId, supplierId) {
    try {
      // Subir imágenes en paralelo - solo thumbnails para la primera (principal)
      const uploadPromises = files.map((file, index) => 
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
          errors.push(`Archivo ${files[index].name}: ${errorMsg}`)
        }
      })

      return {
        success: successful.length > 0,
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
   * @returns {Promise<{success: boolean, data?: any, error?: string}>}
   */
  static async uploadImageWithThumbnail(file, productId, supplierId, isMainImage = false) {
    console.log('🔍 [uploadImageWithThumbnail] Iniciando upload:', {
      fileName: file?.name || file?.file?.name,
      fileSize: file?.size || file?.file?.size,
      fileType: file?.type || file?.file?.type,
      isWrapper: !!file?.file,
      productId,
      supplierId,
      isMainImage
    })

    try {
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

      // 2. Generar nombre único del archivo
      const timestamp = Date.now()
      const fileExtension = actualFile.name.split('.').pop()
      const fileName = `${supplierId}/${productId}/${timestamp}_${actualFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
      console.log('📁 [uploadImageWithThumbnail] Nombre de archivo generado:', fileName)
      
      // Verificar que el bucket existe y tenemos permisos
      console.log('🪣 [uploadImageWithThumbnail] Verificando bucket:', this.IMAGE_BUCKET)
      const { data: bucketData, error: bucketError } = await supabase.storage
        .from(this.IMAGE_BUCKET)
        .list('', { limit: 1 })
      if (bucketError) {
        console.error('❌ [uploadImageWithThumbnail] Error de bucket:', bucketError)
        return { success: false, error: `Error accediendo al bucket: ${bucketError.message}` }
      }
      console.log('✅ [uploadImageWithThumbnail] Bucket verificado exitosamente')

      // 3. Subir imagen original a Supabase Storage
      console.log('📤 [uploadImageWithThumbnail] Iniciando upload a Supabase...')
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
      console.log('✅ [uploadImageWithThumbnail] Upload exitoso:', data)

      // Verificar que realmente se subió usando getPublicUrl
      const { data: publicUrlData } = supabase.storage
        .from(this.IMAGE_BUCKET)
        .getPublicUrl(fileName)
      // Verificar con un delay pequeño para que se propague
      setTimeout(async () => {
        const { data: verifyData, error: verifyError } = await supabase.storage
          .from(this.IMAGE_BUCKET)
          .list(fileName.split('/').slice(0, -1).join('/'))
        // No logs
      }, 800)

      // 4. Obtener URL pública de la imagen original (usar la que ya generamos)
      const urlData = publicUrlData

      // 🔥 CRÍTICO: INSERTAR REGISTRO EN product_images ANTES DE GENERAR THUMBNAIL
      console.log('💾 [uploadImageWithThumbnail] Guardando referencia en DB...')
      const { error: dbInsertError } = await supabase
        .from('product_images')
        .insert({
          product_id: productId,
          image_url: urlData.publicUrl,
          thumbnail_url: null, // Se actualizará después con el thumbnail
          thumbnails: null     // Se actualizará después con los thumbnails
        })

      if (dbInsertError) {
        console.error('❌ [uploadImageWithThumbnail] Error insertando en DB:', dbInsertError)
        // No fallar todo el proceso, pero logging para debugging
      } else {
        console.log('✅ [uploadImageWithThumbnail] Referencia guardada en DB exitosamente')
      }

      // 5. Generar thumbnail usando Edge Function (SOLO para imagen principal y NO WebP)
      let thumbnailUrl = null
      if (isMainImage) {
        // Skip thumbnail generation for WebP images since Edge Function doesn't support them
        if (actualFile.type === 'image/webp') {
          console.log('⚠️ [uploadImageWithThumbnail] WebP detectado - saltando generación de thumbnail')
          // WebP detected - skip thumbnail generation, image uploaded successfully
        } else {
          try {
            console.log('🖼️ [uploadImageWithThumbnail] Generando thumbnail...')
            const thumbnailResult = await this.generateThumbnail(urlData.publicUrl, productId, supplierId)
            if (thumbnailResult.success) {
              thumbnailUrl = thumbnailResult.thumbnailUrl
              console.log('✅ [uploadImageWithThumbnail] Thumbnail generado:', thumbnailUrl)
            } else {
              console.log('⚠️ [uploadImageWithThumbnail] Falló generación de thumbnail:', thumbnailResult.error)
            }
          } catch (thumbnailError) {
            console.log('⚠️ [uploadImageWithThumbnail] Error en thumbnail (continuando):', thumbnailError.message)
            // Continue without thumbnail if generation fails
          }
        }
      }

      console.log('✅ [uploadImageWithThumbnail] Upload completado exitosamente')
      return {
        success: true,
        data: {
          id: data.id || fileName,
          fileName: actualFile.name,
          filePath: fileName,
          publicUrl: urlData.publicUrl,
          thumbnailUrl: thumbnailUrl, // ✅ NUEVO: URL del thumbnail
          size: actualFile.size,
          type: actualFile.type,
          uploadedAt: new Date().toISOString(),
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
