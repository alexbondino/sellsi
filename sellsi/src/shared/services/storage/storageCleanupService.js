/**
 * ============================================================================
 * STORAGE CLEANUP SERVICE - LIMPIEZA ROBUSTA DE ARCHIVOS HUÉRFANOS
 * ============================================================================
 * 
 * Servicio especializado para detectar y limpiar archivos huérfanos en Supabase Storage.
 * Maneja inconsistencias de URLs y previene acumulación de archivos no utilizados.
 */

import { supabase } from '../../../services/supabase.js';

export class StorageCleanupService {
  static IMAGE_BUCKET = 'product-images';
  static THUMBNAIL_BUCKET = 'product-images-thumbnails';
  
  /**
   * Verificar y limpiar archivos huérfanos de un producto específico
   * @param {string} productId - ID del producto
   * @returns {Promise<{success: boolean, cleaned: number, errors: string[]}>}
   */
  static async cleanupProductOrphans(productId) {
    const results = {
      success: true,
      cleaned: 0,
      errors: []
    };

    try {
      // 1. Obtener todas las URLs registradas en BD para este producto
      const { data: dbImages, error: dbError } = await supabase
        .from('product_images')
        .select('image_url, thumbnail_url')
        .eq('product_id', productId);

      if (dbError) {
        results.errors.push(`Error obteniendo imágenes de BD: ${dbError.message}`);
        return results;
      }

      // 2. Obtener archivos reales en storage para este producto
      const storageFiles = await this.getProductFilesFromStorage(productId);
      
      // 3. Identificar archivos huérfanos (en storage pero no en BD)
      const orphanFiles = this.identifyOrphanFiles(dbImages || [], storageFiles);
      
      // 4. Limpiar archivos huérfanos
      if (orphanFiles.length > 0) {
        const cleanupResult = await this.removeOrphanFiles(orphanFiles);
        results.cleaned = cleanupResult.cleaned;
        results.errors.push(...cleanupResult.errors);
      }

      // 5. Verificar y limpiar registros BD sin archivos
      const dbCleanupResult = await this.cleanupBrokenDbRecords(productId, dbImages || []);
      results.errors.push(...dbCleanupResult.errors);

      console.log(`🧹 Storage cleanup para producto ${productId}: ${results.cleaned} archivos limpiados`);
      
      return results;
    } catch (error) {
      results.success = false;
      results.errors.push(`Error general en cleanup: ${error.message}`);
      return results;
    }
  }

  /**
   * Obtener todos los archivos de un producto desde storage
   * @param {string} productId - ID del producto
   * @returns {Promise<Array>} Lista de archivos encontrados
   */
  static async getProductFilesFromStorage(productId) {
    const allFiles = [];
    
    try {
      // Buscar archivos en diferentes rutas posibles
      const possiblePaths = [
        `${productId}/`, // Ruta simple
        // Buscar por supplier_id si es necesario (requiere más lógica)
      ];

      // Buscar en bucket de imágenes
      for (const basePath of possiblePaths) {
        try {
          const { data: imageFiles, error } = await supabase.storage
            .from(this.IMAGE_BUCKET)
            .list('', { limit: 1000 });

          if (!error && imageFiles) {
            // Filtrar archivos que contengan el productId
            const productFiles = imageFiles.filter(file => 
              file.name.includes(productId) || 
              file.name.includes(`${productId}_`) ||
              file.name.includes(`/${productId}/`)
            );
            
            allFiles.push(...productFiles.map(file => ({
              bucket: this.IMAGE_BUCKET,
              path: file.name,
              fullPath: file.name,
              type: 'image'
            })));
          }
        } catch (error) {
          console.warn(`Error listando archivos en ${basePath}:`, error);
        }
      }

      // Buscar en bucket de thumbnails
      try {
        const { data: thumbFiles, error } = await supabase.storage
          .from(this.THUMBNAIL_BUCKET)
          .list('', { limit: 1000 });

        if (!error && thumbFiles) {
          const productThumbs = thumbFiles.filter(file => 
            file.name.includes(productId)
          );
          
          allFiles.push(...productThumbs.map(file => ({
            bucket: this.THUMBNAIL_BUCKET,
            path: file.name,
            fullPath: file.name,
            type: 'thumbnail'
          })));
        }
      } catch (error) {
        console.warn('Error listando thumbnails:', error);
      }

      return allFiles;
    } catch (error) {
      console.error('Error obteniendo archivos de storage:', error);
      return [];
    }
  }

  /**
   * Identificar archivos huérfanos comparando storage vs BD
   * @param {Array} dbImages - Imágenes registradas en BD
   * @param {Array} storageFiles - Archivos encontrados en storage
   * @returns {Array} Lista de archivos huérfanos
   */
  static identifyOrphanFiles(dbImages, storageFiles) {
    const dbUrls = new Set();
    
    // Extraer paths de URLs de BD
    dbImages.forEach(img => {
      if (img.image_url) {
        const path = this.extractPathFromUrl(img.image_url);
        if (path) dbUrls.add(path);
      }
      if (img.thumbnail_url) {
        const path = this.extractPathFromUrl(img.thumbnail_url);
        if (path) dbUrls.add(path);
      }
    });

    // Identificar archivos en storage que no están en BD
    return storageFiles.filter(file => !dbUrls.has(file.path));
  }

  /**
   * Extraer path del archivo desde URL completa
   * @param {string} url - URL completa del archivo
   * @returns {string|null} Path extraído o null si no es válido
   */
  static extractPathFromUrl(url) {
    try {
      // Extraer path después del bucket name
      const imageMatch = url.match(/\/product-images\/(.+)$/);
      if (imageMatch) return imageMatch[1];
      
      const thumbMatch = url.match(/\/product-images-thumbnails\/(.+)$/);
      if (thumbMatch) return thumbMatch[1];
      
      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Remover archivos huérfanos del storage
   * @param {Array} orphanFiles - Lista de archivos huérfanos
   * @returns {Promise<{cleaned: number, errors: string[]}>}
   */
  static async removeOrphanFiles(orphanFiles) {
    const result = {
      cleaned: 0,
      errors: []
    };

    // Agrupar por bucket para optimizar eliminación
    const imageFiles = orphanFiles.filter(f => f.bucket === this.IMAGE_BUCKET);
    const thumbFiles = orphanFiles.filter(f => f.bucket === this.THUMBNAIL_BUCKET);

    // Eliminar imágenes huérfanas
    if (imageFiles.length > 0) {
      try {
        const { error } = await supabase.storage
          .from(this.IMAGE_BUCKET)
          .remove(imageFiles.map(f => f.path));
        
        if (error) {
          result.errors.push(`Error eliminando imágenes: ${error.message}`);
        } else {
          result.cleaned += imageFiles.length;
        }
      } catch (error) {
        result.errors.push(`Error eliminando imágenes: ${error.message}`);
      }
    }

    // Eliminar thumbnails huérfanos
    if (thumbFiles.length > 0) {
      try {
        const { error } = await supabase.storage
          .from(this.THUMBNAIL_BUCKET)
          .remove(thumbFiles.map(f => f.path));
        
        if (error) {
          result.errors.push(`Error eliminando thumbnails: ${error.message}`);
        } else {
          result.cleaned += thumbFiles.length;
        }
      } catch (error) {
        result.errors.push(`Error eliminando thumbnails: ${error.message}`);
      }
    }

    return result;
  }

  /**
   * Limpiar registros de BD que apuntan a archivos inexistentes
   * @param {string} productId - ID del producto
   * @param {Array} dbImages - Imágenes registradas en BD
   * @returns {Promise<{errors: string[]}>}
   */
  static async cleanupBrokenDbRecords(productId, dbImages) {
    const result = { errors: [] };
    
    const brokenRecords = [];

    // Verificar si cada URL de BD tiene archivo real
    for (const img of dbImages) {
      let isBroken = false;

      if (img.image_url) {
        const exists = await this.verifyFileExists(img.image_url);
        if (!exists) isBroken = true;
      }

      if (img.thumbnail_url) {
        const exists = await this.verifyFileExists(img.thumbnail_url);
        if (!exists) isBroken = true;
      }

      if (isBroken) {
        brokenRecords.push(img);
      }
    }

    // Eliminar registros rotos de BD
    if (brokenRecords.length > 0) {
      try {
        const urlsToDelete = brokenRecords.map(r => r.image_url).filter(Boolean);
        
        if (urlsToDelete.length > 0) {
          const { error } = await supabase
            .from('product_images')
            .delete()
            .eq('product_id', productId)
            .in('image_url', urlsToDelete);

          if (error) {
            result.errors.push(`Error limpiando registros rotos: ${error.message}`);
          } else {
            console.log(`🗑️ Limpiados ${brokenRecords.length} registros rotos de BD`);
          }
        }
      } catch (error) {
        result.errors.push(`Error limpiando registros rotos: ${error.message}`);
      }
    }

    return result;
  }

  /**
   * Verificar si un archivo existe en storage
   * @param {string} url - URL del archivo
   * @returns {Promise<boolean>} True si existe
   */
  static async verifyFileExists(url) {
    try {
      const path = this.extractPathFromUrl(url);
      if (!path) return false;

      const bucket = url.includes('product-images-thumbnails') 
        ? this.THUMBNAIL_BUCKET 
        : this.IMAGE_BUCKET;

      const { data, error } = await supabase.storage
        .from(bucket)
        .list(path.substring(0, path.lastIndexOf('/')), {
          limit: 1,
          search: path.substring(path.lastIndexOf('/') + 1)
        });

      return !error && data && data.length > 0;
    } catch (error) {
      return false;
    }
  }

  /**
   * Ejecutar limpieza masiva de todos los productos (usar con cuidado)
   * @param {Array} productIds - Lista de IDs de productos a limpiar
   * @returns {Promise<{totalCleaned: number, errors: string[]}>}
   */
  static async bulkCleanup(productIds = []) {
    const results = {
      totalCleaned: 0,
      errors: []
    };

    console.log(`🧹 Iniciando limpieza masiva de ${productIds.length} productos...`);

    for (const productId of productIds) {
      try {
        const cleanupResult = await this.cleanupProductOrphans(productId);
        results.totalCleaned += cleanupResult.cleaned;
        results.errors.push(...cleanupResult.errors);
        
        // Pequeño delay para no sobrecargar
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        results.errors.push(`Error en producto ${productId}: ${error.message}`);
      }
    }

    console.log(`✅ Limpieza masiva completada: ${results.totalCleaned} archivos limpiados`);
    return results;
  }
}

export default StorageCleanupService;
