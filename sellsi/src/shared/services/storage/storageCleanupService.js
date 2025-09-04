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
  // Mapa de producto -> timestamp (epoch ms) hasta el cual NO se debe ejecutar cleanup
  static recentGenerationUntil = new Map();
  static DEFAULT_GRACE_MS = 60000; // 60s por defecto

  /**
   * Marcar que un producto acaba de regenerar thumbnails; evita cleanup prematuro
   * @param {string} productId
   * @param {number} ms
   */
  static markRecentGeneration(productId, ms = this.DEFAULT_GRACE_MS) {
    if (!productId) return;
    const until = Date.now() + ms;
    this.recentGenerationUntil.set(productId, until);
    try { console.info('[StorageCleanupService] Grace period iniciado', { productId, until }); } catch(_){}
  }
  
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
      // Guardar early si está dentro del grace period
      const graceUntil = this.recentGenerationUntil.get(productId);
      if (graceUntil && Date.now() < graceUntil) {
        const remaining = graceUntil - Date.now();
        try { console.info('[StorageCleanupService] Skip cleanup (grace period activo)', { productId, remaining }); } catch(_){}
        // Reprogramar automáticamente después del periodo restante + pequeño buffer
        setTimeout(() => {
          this.cleanupProductOrphans(productId).catch(()=>{});
        }, remaining + 500);
        return results; // Nada limpiado (intencional)
      }
      // 1. Obtener todas las URLs registradas en BD para este producto
      // IMPORTANTE: incluir 'thumbnails' para no marcar como huérfanos los variants
      const { data: dbImages, error: dbError } = await supabase
        .from('product_images')
        .select('image_url, thumbnail_url, thumbnails')
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
      
      
      // 🔥 MEJORADO: Buscar en todos los directorios del bucket
      
      const { data: allFolders, error: foldersError } = await supabase.storage
        .from(this.IMAGE_BUCKET)
        .list('', { limit: 1000 });

      if (foldersError) {
        console.error('❌ [getProductFilesFromStorage] Error listando directorios:', foldersError);
        return allFiles;
      }

      

      // Buscar en cada directorio de supplier
      for (const folder of allFolders || []) {
        if (folder.name && folder.id === null) { // Es un directorio
          const supplierPath = folder.name;
          
          
          // Buscar archivos en este directorio de supplier
          const { data: supplierFiles, error: supplierError } = await supabase.storage
            .from(this.IMAGE_BUCKET)
            .list(supplierPath, { limit: 1000 });

          if (!supplierError && supplierFiles) {
            
            
            // Buscar subdirectorio del producto o archivos que contengan el productId
            for (const file of supplierFiles) {
              const fullPath = `${supplierPath}/${file.name}`;
              
              if (file.id === null) { // Es un subdirectorio
                if (file.name === productId) {
                  
                  // Este es el directorio del producto, listar sus archivos
                  const { data: productFiles, error: productError } = await supabase.storage
                    .from(this.IMAGE_BUCKET)
                    .list(`${supplierPath}/${productId}`, { limit: 1000 });

                  if (!productError && productFiles) {
                    
                    allFiles.push(...productFiles.map(pFile => ({
                      bucket: this.IMAGE_BUCKET,
                      path: `${supplierPath}/${productId}/${pFile.name}`,
                      fullPath: `${supplierPath}/${productId}/${pFile.name}`,
                      type: 'image'
                    })));
                  }
                }
              } else {
                // Es un archivo, verificar si pertenece al producto
                if (file.name.includes(productId)) {
                  allFiles.push({
                    bucket: this.IMAGE_BUCKET,
                    path: fullPath,
                    fullPath: fullPath,
                    type: 'image'
                  });
                }
              }
            }
          } else if (supplierError) {
            
          }
        }
      }

      // 🔥 MEJORADO: Buscar en bucket de thumbnails de manera similar
      const { data: thumbFolders, error: thumbFoldersError } = await supabase.storage
        .from(this.THUMBNAIL_BUCKET)
        .list('', { limit: 1000 });

      if (!thumbFoldersError && thumbFolders) {
        for (const folder of thumbFolders) {
          if (folder.name && folder.id === null) { // Es un directorio
            const supplierPath = folder.name;
            
            const { data: supplierThumbs, error: supplierThumbError } = await supabase.storage
              .from(this.THUMBNAIL_BUCKET)
              .list(supplierPath, { limit: 1000 });

            if (!supplierThumbError && supplierThumbs) {
              for (const thumb of supplierThumbs) {
                const fullPath = `${supplierPath}/${thumb.name}`;
                
                if (thumb.id === null && thumb.name === productId) {
                  // Directorio del producto en thumbnails
                  const { data: productThumbs, error: productThumbError } = await supabase.storage
                    .from(this.THUMBNAIL_BUCKET)
                    .list(`${supplierPath}/${productId}`, { limit: 1000 });

                  if (!productThumbError && productThumbs) {
                    allFiles.push(...productThumbs.map(pThumb => ({
                      bucket: this.THUMBNAIL_BUCKET,
                      path: `${supplierPath}/${productId}/${pThumb.name}`,
                      fullPath: `${supplierPath}/${productId}/${pThumb.name}`,
                      type: 'thumbnail'
                    })));
                  }
                } else if (thumb.id !== null && thumb.name.includes(productId)) {
                  // Archivo thumbnail que contiene el productId
                  allFiles.push({
                    bucket: this.THUMBNAIL_BUCKET,
                    path: fullPath,
                    fullPath: fullPath,
                    type: 'thumbnail'
                  });
                }
              }
            }
          }
        }
      }

      
      return allFiles;
    } catch (error) {
      console.error(`❌ [getProductFilesFromStorage] Error:`, error);
      return allFiles;
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

    // Extraer paths de URLs de BD (image_url, thumbnail_url y cada variant en thumbnails JSON)
    dbImages.forEach(img => {
      if (img.image_url) {
        const path = this.extractPathFromUrl(img.image_url);
        if (path) dbUrls.add(path);
      }
      if (img.thumbnail_url) {
        const path = this.extractPathFromUrl(img.thumbnail_url);
        if (path) dbUrls.add(path);
      }
      if (img.thumbnails && typeof img.thumbnails === 'object') {
        try {
          // thumbnails puede venir como objeto ya parseado o string JSON
          const thumbObj = Array.isArray(img.thumbnails) ? img.thumbnails : (typeof img.thumbnails === 'string' ? JSON.parse(img.thumbnails) : img.thumbnails);
          // Si es array, iteramos; si es objeto simple {variant:url,...}
          if (Array.isArray(thumbObj)) {
            thumbObj.forEach(entry => {
              if (!entry) return;
              Object.values(entry).forEach(url => {
                const p = this.extractPathFromUrl(url);
                if (p) dbUrls.add(p);
              });
            });
          } else if (thumbObj && typeof thumbObj === 'object') {
            Object.values(thumbObj).forEach(url => {
              const p = this.extractPathFromUrl(url);
              if (p) dbUrls.add(p);
            });
          }
        } catch (e) {
          // Ignorar parse errors
        }
      }
    });

    // Identificar archivos en storage que no están en BD
    const orphans = storageFiles.filter(file => !dbUrls.has(file.path));

    // Instrumentación: log de candidatos a eliminación (solo en debug)
    if (orphans.length > 0) {
      try {
        console.warn('[StorageCleanupService] Archivos huérfanos detectados (previo a eliminación):', orphans.map(o => o.path));
      } catch(_){}
    }
    return orphans;
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
      try { console.info('[StorageCleanupService] Eliminadas imágenes huérfanas:', imageFiles.map(f => f.path)); } catch(_){}
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
      try { console.info('[StorageCleanupService] Eliminados thumbnails huérfanos:', thumbFiles.map(f => f.path)); } catch(_){}
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
    return results;
  }

  /**
   * 🔥 NUEVO: Eliminar TODAS las imágenes de un producto (para reemplazo completo)
   * @param {string} productId - ID del producto
   * @returns {Promise<{success: boolean, cleaned: number, errors: string[]}>}
   */
  static async deleteAllProductImages(productId) {
    const results = {
      success: true,
      cleaned: 0,
      errors: []
    };

    try {
      
      
      // 1. Eliminar TODOS los registros de la BD para este producto
      
      const { error: dbDeleteError, count: deletedCount } = await supabase
        .from('product_images')
        .delete({ count: 'exact' })
        .eq('product_id', productId);

      if (dbDeleteError) {
        console.error(`❌ [deleteAllProductImages] Error eliminando de BD:`, dbDeleteError)
        results.errors.push(`Error eliminando registros de BD: ${dbDeleteError.message}`);
        results.success = false;
        return results;
      }

      

      // 2. Obtener TODOS los archivos del producto desde storage
      
      const storageFiles = await this.getProductFilesFromStorage(productId);
      

      // 3. Eliminar TODOS los archivos del storage
      if (storageFiles.length > 0) {
        
        const deleteResult = await this.removeFiles(storageFiles);
        results.cleaned = deleteResult.cleaned;
        results.errors.push(...deleteResult.errors);
        
      } else {
        
      }

      
      return results;
    } catch (error) {
      results.success = false;
      results.errors.push(`Error general eliminando producto: ${error.message}`);
      
      return results;
    }
  }

  /**
   * 🔧 Helper: Eliminar archivos del storage
   * @param {Array} files - Lista de archivos a eliminar
   * @returns {Promise<{cleaned: number, errors: string[]}>}
   */
  static async removeFiles(files) {
    const results = { cleaned: 0, errors: [] };

    
    
    for (const file of files) {
      try {
        
        
        const { error } = await supabase.storage
          .from(file.bucket)
          .remove([file.path]);

        if (error) {
          
          results.errors.push(`Error eliminando ${file.path}: ${error.message}`);
        } else {
          results.cleaned++;
          
        }
      } catch (error) {
        
        results.errors.push(`Error inesperado eliminando ${file.path}: ${error.message}`);
      }
    }

    
    return results;
  }
}

export default StorageCleanupService;
