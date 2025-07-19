// thumbnailService.js - Servicio específico para gestión de thumbnails
import { supabase } from '../supabase.js'

/**
 * Servicio especializado para la gestión de thumbnails
 * Maneja la generación, actualización y eliminación de thumbnails
 */
export class ThumbnailService {
  static THUMBNAIL_BUCKET = 'product-images-thumbnails'
  static EDGE_FUNCTION_URL = `${supabase.supabaseUrl}/functions/v1/generate-thumbnail`

  /**
   * Generar thumbnail para una imagen específica
   * @param {string} imageUrl - URL de la imagen original
   * @param {string} productId - ID del producto
   * @param {string} supplierId - ID del proveedor
   * @returns {Promise<{success: boolean, thumbnailUrl?: string, error?: string}>}
   */
  static async generateThumbnail(imageUrl, productId, supplierId) {
    try {
      // Generating thumbnail for image

      const response = await fetch(this.EDGE_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabase.supabaseKey}`,
        },
        body: JSON.stringify({
          imageUrl,
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
        // Thumbnail generated successfully
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
      console.error('❌ Error generating thumbnail:', error)
      return {
        success: false,
        error: error.message,
      }
    }
  }

  /**
   * Regenerar thumbnail para una imagen existente
   * @param {string} imageUrl - URL de la imagen original
   * @param {string} productId - ID del producto
   * @param {string} supplierId - ID del proveedor
   * @returns {Promise<{success: boolean, thumbnailUrl?: string, error?: string}>}
   */
  static async regenerateThumbnail(imageUrl, productId, supplierId) {
    try {
      // Regenerating thumbnail for image

      // Eliminar thumbnail anterior si existe
      await this.deleteThumbnail(productId, supplierId)

      // Generar nuevo thumbnail
      return await this.generateThumbnail(imageUrl, productId, supplierId)
    } catch (error) {
      console.error('❌ Error regenerating thumbnail:', error)
      return {
        success: false,
        error: error.message,
      }
    }
  }

  /**
   * Eliminar thumbnail de un producto
   * @param {string} productId - ID del producto
   * @param {string} supplierId - ID del proveedor
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  static async deleteThumbnail(productId, supplierId) {
    try {
      // Deleting thumbnail for product

      const thumbnailPath = `${supplierId}/${productId}/thumbnail.jpg`
      
      const { error } = await supabase.storage
        .from(this.THUMBNAIL_BUCKET)
        .remove([thumbnailPath])

      if (error) {
        console.error('❌ Error deleting thumbnail:', error)
        return { success: false, error: error.message }
      }

      // Thumbnail deleted successfully
      return { success: true }
    } catch (error) {
      console.error('❌ Unexpected error deleting thumbnail:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Actualizar thumbnail_url en la base de datos
   * @param {string} productImageId - ID de la imagen del producto
   * @param {string} thumbnailUrl - URL del thumbnail generado
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  static async updateThumbnailUrlInDatabase(productImageId, thumbnailUrl) {
    try {
      // Updating thumbnail_url in database for image

      const { error } = await supabase
        .from('product_images')
        .update({ thumbnail_url: thumbnailUrl })
        .eq('id', productImageId)

      if (error) {
        console.error('❌ Error updating thumbnail_url in database:', error)
        return { success: false, error: error.message }
      }

      // Thumbnail URL updated in database successfully
      return { success: true }
    } catch (error) {
      console.error('❌ Unexpected error updating thumbnail URL in database:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Obtener URL del thumbnail basado en la imagen original
   * @param {string} productId - ID del producto
   * @param {string} supplierId - ID del proveedor
   * @returns {string} URL pública del thumbnail
   */
  static getThumbnailUrl(productId, supplierId) {
    const thumbnailPath = `${supplierId}/${productId}/thumbnail.jpg`
    const { data } = supabase.storage
      .from(this.THUMBNAIL_BUCKET)
      .getPublicUrl(thumbnailPath)
    
    return data.publicUrl
  }

  /**
   * Verificar si existe un thumbnail para un producto
   * @param {string} productId - ID del producto
   * @param {string} supplierId - ID del proveedor
   * @returns {Promise<boolean>} true si existe el thumbnail
   */
  static async thumbnailExists(productId, supplierId) {
    try {
      const thumbnailPath = `${supplierId}/${productId}/thumbnail.jpg`
      
      const { data, error } = await supabase.storage
        .from(this.THUMBNAIL_BUCKET)
        .list('', { search: thumbnailPath })

      if (error) {
        console.error('❌ Error checking thumbnail existence:', error)
        return false
      }

      return data && data.length > 0
    } catch (error) {
      console.error('❌ Unexpected error checking thumbnail existence:', error)
      return false
    }
  }
}

export default ThumbnailService
