// thumbnailService.js - Servicio específico para gestión de thumbnails
import { supabase } from '../supabase.js';
import { getOrFetchMainThumbnail } from '../phase1ETAGThumbnailService.js';
import { FeatureFlags } from '../../workspaces/supplier/shared-utils/featureFlags.js';

// Use the public env vars to call the Edge Function from the client
// Use process.env during tests / Node. In Vite builds import.meta.env is replaced at build time.
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

/**
 * Servicio especializado para la gestión de thumbnails
 * Maneja la generación, actualización y eliminación de thumbnails
 */
export class ThumbnailService {
  static THUMBNAIL_BUCKET = 'product-images-thumbnails';
  static EDGE_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/generate-thumbnail`;

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
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          imageUrl,
          productId,
          supplierId,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Edge Function error: ${response.status} ${errorText}`);
      }

      const result = await response.json();

      if (result.thumbnailUrl) {
        // Thumbnail generated successfully
        return {
          success: true,
          thumbnailUrl: result.thumbnailUrl,
        };
      } else {
        return {
          success: false,
          error: 'No thumbnail URL returned from Edge Function',
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
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
      await this.deleteThumbnail(productId, supplierId);

      // Generar nuevo thumbnail
      return await this.generateThumbnail(imageUrl, productId, supplierId);
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
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

      try {
        // List all objects under the product folder and remove them.
        const prefix = `${supplierId}/${productId}/`;
        const { data: list, error: listErr } = await supabase.storage
          .from(this.THUMBNAIL_BUCKET)
          .list(prefix);

        if (listErr) {
          return { success: false, error: listErr.message };
        }

        if (!list || list.length === 0) {
          return { success: true }; // nothing to delete
        }

        const paths = list.map(item => `${prefix}${item.name}`);
        const { error } = await supabase.storage
          .from(this.THUMBNAIL_BUCKET)
          .remove(paths);

        if (error) return { success: false, error: error.message };

        return { success: true };
      } catch (err) {
        return { success: false, error: err.message };
      }
    } catch (error) {
      return { success: false, error: error.message };
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
        .eq('id', productImageId);

      if (error) {
        return { success: false, error: error.message };
      }

      // Thumbnail URL updated in database successfully
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Obtener URL del thumbnail basado en la imagen original
   * @param {string} productId - ID del producto
   * @param {string} supplierId - ID del proveedor
   * @returns {string} URL pública del thumbnail
   */
  static async getThumbnailUrl(productId, supplierId) {
    // Intentar primero cache Phase1 (short-circuit) si flag activo
    if (FeatureFlags?.FEATURE_PHASE1_THUMBS) {
      try {
        const cached = await getOrFetchMainThumbnail(productId, {
          silent: true,
        });
        if (cached?.thumbnail_url) return cached.thumbnail_url;
      } catch (_) {
        /* fallback abajo */
      }
    }
    // Legacy fallback directo a DB (único fetch si no estaba en cache)
    try {
      const { data: row, error } = await supabase
        .from('product_images')
        .select('thumbnail_url')
        .eq('product_id', productId)
        .eq('image_order', 0)
        .limit(1)
        .maybeSingle();
      if (!error && row?.thumbnail_url) return row.thumbnail_url;
    } catch (_) {
      /* ignore */
    }
    // Último fallback: construir URL pública convencional
    try {
      const thumbnailPath = `${supplierId}/${productId}/thumbnail.jpg`;
      const { data } = supabase.storage
        .from(this.THUMBNAIL_BUCKET)
        .getPublicUrl(thumbnailPath);
      return data?.publicUrl || null;
    } catch (_) {
      return null;
    }
  }

  /**
   * Verificar si existe un thumbnail para un producto
   * @param {string} productId - ID del producto
   * @param {string} supplierId - ID del proveedor
   * @returns {Promise<boolean>} true si existe el thumbnail
   */
  static async thumbnailExists(productId, supplierId) {
    try {
      const prefix = `${supplierId}/${productId}/`;
      const { data, error } = await supabase.storage
        .from(this.THUMBNAIL_BUCKET)
        .list(prefix);

      if (error) return false;
      return data && data.length > 0;
    } catch (error) {
      return false;
    }
  }
}

export default ThumbnailService;
