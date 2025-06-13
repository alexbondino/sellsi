// uploadService.js - Servicio optimizado para uploads a Supabase Storage
import { supabase } from './supabase.js'

/**
 * Servicio optimizado para subir archivos PDF a Supabase Storage
 * Implementa buenas prácticas para agilidad del backend
 */
export class UploadService {
  static PDF_BUCKET = 'product-documents'
  static IMAGE_BUCKET = 'product-images'
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

      console.log('📄 Uploading PDF:', fileName)

      // Subir archivo a Supabase Storage
      const { data, error } = await supabase.storage
        .from(this.PDF_BUCKET)
        .upload(fileName, file, {
          cacheControl: '3600', // Cache por 1 hora
          upsert: false, // No sobrescribir archivos existentes
        })

      if (error) {
        console.error('❌ Error uploading PDF:', error)
        return { success: false, error: error.message }
      }

      // Obtener URL pública
      const { data: urlData } = supabase.storage
        .from(this.PDF_BUCKET)
        .getPublicUrl(fileName)

      console.log('✅ PDF uploaded successfully:', urlData.publicUrl)

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
      console.error('❌ Unexpected error uploading PDF:', error)
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
      console.log(`📄 Uploading ${files.length} PDFs...`)

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

      console.log(`✅ ${successful.length} PDFs uploaded successfully`)
      if (errors.length > 0) {
        console.warn(`⚠️ ${errors.length} uploads failed:`, errors)
      }

      return {
        success: successful.length > 0,
        data: successful,
        errors: errors.length > 0 ? errors : undefined,
      }
    } catch (error) {
      console.error('❌ Unexpected error uploading multiple PDFs:', error)
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
      console.log('🗑️ Deleting PDF:', filePath)

      const { error } = await supabase.storage
        .from(this.PDF_BUCKET)
        .remove([filePath])

      if (error) {
        console.error('❌ Error deleting PDF:', error)
        return { success: false, error: error.message }
      }

      console.log('✅ PDF deleted successfully')
      return { success: true }
    } catch (error) {
      console.error('❌ Unexpected error deleting PDF:', error)
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

      console.log('🖼️ Uploading image:', fileName)

      // Subir archivo a Supabase Storage
      const { data, error } = await supabase.storage
        .from(this.IMAGE_BUCKET)
        .upload(fileName, file, {
          cacheControl: '3600', // Cache por 1 hora
          upsert: false,
        })

      if (error) {
        console.error('❌ Error uploading image:', error)
        return { success: false, error: error.message }
      }

      // Obtener URL pública
      const { data: urlData } = supabase.storage
        .from(this.IMAGE_BUCKET)
        .getPublicUrl(fileName)

      console.log('✅ Image uploaded successfully:', urlData.publicUrl)

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
      console.error('❌ Unexpected error uploading image:', error)
      return { success: false, error: 'Error inesperado al subir imagen' }
    }
  }

  /**
   * Crear buckets si no existen (función de inicialización)
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  static async initializeBuckets() {
    try {
      console.log('🔧 Initializing storage buckets...')

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
        if (pdfError) {
          console.error('❌ Error creating PDF bucket:', pdfError)
        } else {
          console.log('✅ PDF bucket created')
        }
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
        if (imageError) {
          console.error('❌ Error creating image bucket:', imageError)
        } else {
          console.log('✅ Image bucket created')
        }
      }

      return { success: true }
    } catch (error) {
      console.error('❌ Error initializing buckets:', error)
      return { success: false, error: error.message }
    }
  }
}

export default UploadService
