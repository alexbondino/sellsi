/**
 * SERVICIO DE INVALIDACIÓN DE CACHE
 * 
 * Servicio que se debe llamar cada vez que:
 * - Se elimina un producto
 * - Se eliminan imágenes de un producto
 * - Se actualizan thumbnails
 * 
 * Invalida automáticamente el cache para que las imágenes
 * eliminadas desaparezcan inmediatamente del frontend
 */

import thumbnailCacheService from './thumbnailCacheService';

class CacheInvalidationService {
  
  /**
   * Invalidar cache cuando se elimina un producto completo
   * @param {string} productId - ID del producto eliminado
   */
  static onProductDeleted(productId) {
    console.log(`[CacheInvalidation] Invalidando cache para producto eliminado: ${productId}`);
    thumbnailCacheService.invalidateProductCache(productId);
  }

  /**
   * Invalidar cache cuando se eliminan imágenes de un producto
   * @param {string} productId - ID del producto
   * @param {string[]} deletedImageUrls - URLs de las imágenes eliminadas (opcional)
   */
  static onProductImagesDeleted(productId, deletedImageUrls = []) {
    console.log(`[CacheInvalidation] Invalidando cache para imágenes eliminadas del producto: ${productId}`);
    console.log(`[CacheInvalidation] URLs eliminadas:`, deletedImageUrls);
    
    // Invalidar todo el cache del producto
    thumbnailCacheService.invalidateProductCache(productId);
    
    // También limpiar cache de validación de URLs específicas
    deletedImageUrls.forEach(url => {
      if (url) {
        const cacheKey = `url_${url}`;
        thumbnailCacheService.urlValidationCache.delete(cacheKey);
      }
    });
  }

  /**
   * Invalidar cache cuando se actualizan thumbnails de un producto
   * @param {string} productId - ID del producto
   */
  static onProductThumbnailsUpdated(productId) {
    console.log(`[CacheInvalidation] Invalidando cache para thumbnails actualizados: ${productId}`);
    thumbnailCacheService.invalidateProductCache(productId);
  }

  /**
   * Invalidar cache masivo cuando se eliminan múltiples productos
   * @param {string[]} productIds - Array de IDs de productos eliminados
   */
  static onMultipleProductsDeleted(productIds) {
    console.log(`[CacheInvalidation] Invalidando cache para productos eliminados:`, productIds);
    productIds.forEach(productId => {
      thumbnailCacheService.invalidateProductCache(productId);
    });
  }

  /**
   * Limpiar todo el cache - Solo para desarrollo o situaciones extremas
   */
  static clearAllCache() {
    console.log(`[CacheInvalidation] ⚠️ Limpiando TODO el cache de thumbnails`);
    thumbnailCacheService.clearAllCache();
  }

  /**
   * Invalidar cache por proveedor - Cuando se elimina un proveedor
   * @param {string} supplierId - ID del proveedor
   */
  static onSupplierDeleted(supplierId) {
    console.log(`[CacheInvalidation] Invalidando cache para proveedor eliminado: ${supplierId}`);
    
    // Como no tenemos una forma directa de buscar por supplier,
    // limpiar todo el cache como medida de seguridad
    thumbnailCacheService.clearAllCache();
  }

  /**
   * Obtener estadísticas del estado del cache
   */
  static getCacheStats() {
    return thumbnailCacheService.getCacheStats();
  }
}

export default CacheInvalidationService;
