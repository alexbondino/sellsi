/**
 * SERVICIO CENTRAL DE CACHE DE THUMBNAILS
 * 
 * Maneja el cache inteligente de thumbnails con invalidación automática
 * y verificación de existencia de URLs para evitar imágenes fantasma
 */

import { supabase } from './supabase';

class ThumbnailCacheService {
  constructor() {
    // Cache en memoria con TTL (Time To Live)
    this.cache = new Map();
    this.urlValidationCache = new Map();
    
    // Configuración
    this.TTL = 5 * 60 * 1000; // 5 minutos
    this.MAX_CACHE_SIZE = 1000;
    
    // Limpiar cache periódicamente
    this.startCleanupInterval();
  }

  /**
   * Generar clave de cache única para un producto
   */
  generateCacheKey(productId, type = 'thumbnails') {
    return `${type}_${productId}`;
  }

  /**
   * Verificar si una URL de thumbnail existe realmente
   */
  async verifyThumbnailExists(url) {
    if (!url) return false;
    
    // Revisar cache de validación primero
    const cacheKey = `url_${url}`;
    if (this.urlValidationCache.has(cacheKey)) {
      const cached = this.urlValidationCache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.TTL) {
        return cached.exists;
      }
    }

    try {
      // Hacer una petición HEAD para verificar existencia sin descargar
      const response = await fetch(url, { method: 'HEAD' });
      const exists = response.ok;
      
      // Guardar resultado en cache
      this.urlValidationCache.set(cacheKey, {
        exists,
        timestamp: Date.now()
      });
      
      return exists;
    } catch (error) {
      console.warn(`[ThumbnailCache] Error verificando URL: ${url}`, error);
      
      // Cachear como no existente en caso de error
      this.urlValidationCache.set(cacheKey, {
        exists: false,
        timestamp: Date.now()
      });
      
      return false;
    }
  }

  /**
   * Obtener thumbnails de la base de datos con cache
   */
  async getThumbnails(productId, forceRefresh = false) {
    const cacheKey = this.generateCacheKey(productId);
    
    // Revisar cache primero (a menos que se fuerce refresh)
    if (!forceRefresh && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.TTL) {
        console.log(`[ThumbnailCache] ✅ Cache hit para ${productId}`);
        return cached.data;
      }
    }

    try {
      console.log(`[ThumbnailCache] 🔍 Consultando BD para ${productId}`);
      
      // Consultar base de datos
      const { data, error } = await supabase
        .from('product_images')
        .select('thumbnails, thumbnail_url, image_url')
        .eq('product_id', productId)
        .order('image_url', { ascending: true })
        .limit(1);

      if (error) {
        console.warn(`[ThumbnailCache] Error BD para ${productId}:`, error);
        return null;
      }

      const firstRow = data?.[0];
      let thumbnailData = null;

      if (firstRow) {
        // Procesar thumbnails si existen
        if (firstRow.thumbnails) {
          try {
            thumbnailData = typeof firstRow.thumbnails === 'string' 
              ? JSON.parse(firstRow.thumbnails)
              : firstRow.thumbnails;
          } catch (e) {
            console.warn(`[ThumbnailCache] Error parsing thumbnails para ${productId}:`, e);
          }
        }

        // Si no hay thumbnails pero hay thumbnail_url, construir minithumb
        if (!thumbnailData && firstRow.thumbnail_url) {
          const minithumbUrl = firstRow.thumbnail_url.replace(
            '_desktop_320x260.jpg',
            '_minithumb_40x40.jpg'
          );
          
          if (minithumbUrl !== firstRow.thumbnail_url) {
            thumbnailData = {
              minithumb: minithumbUrl,
              desktop: firstRow.thumbnail_url
            };
          }
        }
      }

      // Guardar en cache
      const cacheData = {
        data: thumbnailData,
        timestamp: Date.now(),
        productId
      };
      
      this.cache.set(cacheKey, cacheData);
      this.cleanupCache();
      
      console.log(`[ThumbnailCache] 💾 Guardado en cache para ${productId}:`, thumbnailData);
      return thumbnailData;

    } catch (error) {
      console.error(`[ThumbnailCache] Error inesperado para ${productId}:`, error);
      return null;
    }
  }

  /**
   * Construir URL de minithumb desde imagen original
   */
  buildMinithumbUrl(originalImageUrl) {
    if (!originalImageUrl) return null;
    
    try {
      const url = new URL(originalImageUrl);
      
      // Verificar si es URL de Supabase con bucket de imágenes
      if (url.pathname.includes('/storage/v1/object/public/product-images/')) {
        // Cambiar al bucket de thumbnails
        const thumbnailPath = url.pathname.replace(
          '/storage/v1/object/public/product-images/', 
          '/storage/v1/object/public/product-images-thumbnails/'
        );
        
        // Obtener nombre del archivo y extraer timestamp
        const pathParts = thumbnailPath.split('/');
        const fileName = pathParts[pathParts.length - 1];
        const timestampMatch = fileName.match(/^(\d+)_/);
        
        if (timestampMatch) {
          const timestamp = timestampMatch[1];
          const minithumbFileName = `${timestamp}_minithumb_40x40.jpg`;
          
          // Construir URL del minithumb
          pathParts[pathParts.length - 1] = minithumbFileName;
          return `${url.origin}${pathParts.join('/')}`;
        }
      }
    } catch (error) {
      console.warn('[ThumbnailCache] Error construyendo minithumb URL:', error);
    }
    
    return null;
  }

  /**
   * Obtener la mejor URL de thumbnail disponible y verificada
   */
  async getBestThumbnailUrl(product, size = 'minithumb') {
    if (!product) return '/placeholder-product.jpg';

    const productId = product.id || product.product_id;
    
    try {
      // 1. Intentar desde thumbnails del producto
      if (product.thumbnails && typeof product.thumbnails === 'object') {
        const thumbnailUrl = product.thumbnails[size];
        if (thumbnailUrl) {
          const exists = await this.verifyThumbnailExists(thumbnailUrl);
          if (exists) {
            console.log(`[ThumbnailCache] ✅ Thumbnail ${size} desde producto verificado`);
            return this.addCacheBuster(thumbnailUrl);
          } else {
            console.log(`[ThumbnailCache] ❌ Thumbnail ${size} desde producto no existe, invalidando...`);
            this.invalidateProductCache(productId);
          }
        }
      }

      // 2. Consultar base de datos
      const thumbnailData = await this.getThumbnails(productId);
      if (thumbnailData && thumbnailData[size]) {
        const exists = await this.verifyThumbnailExists(thumbnailData[size]);
        if (exists) {
          console.log(`[ThumbnailCache] ✅ Thumbnail ${size} desde BD verificado`);
          return this.addCacheBuster(thumbnailData[size]);
        } else {
          console.log(`[ThumbnailCache] ❌ Thumbnail ${size} desde BD no existe, invalidando...`);
          this.invalidateProductCache(productId);
        }
      }

      // 3. Construir desde imagen original
      if (product.imagen) {
        const constructedUrl = this.buildMinithumbUrl(product.imagen);
        if (constructedUrl) {
          const exists = await this.verifyThumbnailExists(constructedUrl);
          if (exists) {
            console.log(`[ThumbnailCache] ✅ Thumbnail construido verificado`);
            return this.addCacheBuster(constructedUrl);
          }
        }
      }

      // 4. Fallbacks
      const fallbacks = [
        product.thumbnail_url,
        product.thumbnailUrl,
        product.imagen
      ].filter(Boolean);

      for (const fallbackUrl of fallbacks) {
        const exists = await this.verifyThumbnailExists(fallbackUrl);
        if (exists) {
          console.log(`[ThumbnailCache] ✅ Fallback verificado:`, fallbackUrl);
          return this.addCacheBuster(fallbackUrl);
        }
      }

      console.log(`[ThumbnailCache] ⚠️ No se encontró thumbnail válido para producto ${productId}`);
      return '/placeholder-product.jpg';

    } catch (error) {
      console.error(`[ThumbnailCache] Error obteniendo thumbnail para ${productId}:`, error);
      return '/placeholder-product.jpg';
    }
  }

  /**
   * Añadir cache buster a URL para evitar cache del navegador
   */
  addCacheBuster(url) {
    if (!url || url === '/placeholder-product.jpg') return url;
    
    try {
      const urlObj = new URL(url);
      urlObj.searchParams.set('t', Date.now());
      return urlObj.toString();
    } catch (error) {
      // Si falla, retornar URL original
      return url;
    }
  }

  /**
   * Invalidar cache de un producto específico
   */
  invalidateProductCache(productId) {
    const cacheKey = this.generateCacheKey(productId);
    this.cache.delete(cacheKey);
    
    // También limpiar cache de validación de URLs relacionadas
    for (const [key, value] of this.urlValidationCache.entries()) {
      if (key.includes(productId)) {
        this.urlValidationCache.delete(key);
      }
    }
    
    console.log(`[ThumbnailCache] 🗑️ Cache invalidado para producto ${productId}`);
  }

  /**
   * Limpiar cache por tamaño y TTL
   */
  cleanupCache() {
    const now = Date.now();
    
    // Limpiar por TTL
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.TTL) {
        this.cache.delete(key);
      }
    }
    
    // Limpiar por tamaño si es necesario
    if (this.cache.size > this.MAX_CACHE_SIZE) {
      const entries = Array.from(this.cache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      // Eliminar las más antiguas
      const toDelete = entries.slice(0, entries.length - this.MAX_CACHE_SIZE);
      toDelete.forEach(([key]) => this.cache.delete(key));
    }
  }

  /**
   * Iniciar limpieza periódica del cache
   */
  startCleanupInterval() {
    setInterval(() => {
      this.cleanupCache();
    }, 60000); // Cada minuto
  }

  /**
   * Limpiar todo el cache (usar en desarrollo)
   */
  clearAllCache() {
    this.cache.clear();
    this.urlValidationCache.clear();
    console.log('[ThumbnailCache] 🧹 Todo el cache limpiado');
  }

  /**
   * Obtener estadísticas del cache
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      urlValidationSize: this.urlValidationCache.size,
      maxSize: this.MAX_CACHE_SIZE,
      ttl: this.TTL
    };
  }
}

// Exportar instancia singleton
export default new ThumbnailCacheService();
