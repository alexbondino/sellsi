/**
 * SERVICIO CENTRAL DE CACHE DE THUMBNAILS
 *
 * Maneja el cache inteligente de thumbnails con invalidación automática
 * y verificación de existencia de URLs para evitar imágenes fantasma
 */

import { supabase } from './supabase';
import {
  getOrFetchMainThumbnail,
  phase1ETAGService,
} from './phase1ETAGThumbnailService.js';
import { supabase } from './supabase.js';
import { queryClient, QUERY_KEYS } from '../utils/queryClient.js';

// Use a deep import due to the way vite & testing handle module resolution
// Multiple variations available:
// A) '../shared/flags/featureFlags.js' (shared version)
// B) '../path/to/workspaces/.../featureFlags.js' (workspace specific)
import { FeatureFlags } from '../workspaces/supplier/shared-utils/featureFlags.js';

class ThumbnailCacheService {
  constructor() {
    // Cache en memoria con TTL (Time To Live)
    this.cache = new Map();
    this.urlValidationCache = new Map();

    // Configuración - OPTIMIZED for marketplace scale
    this.TTL = 15 * 60 * 1000; // 🚀 INCREASED: 5min→15min (less cache churn)
    this.MAX_CACHE_SIZE = 3000; // 🚀 INCREASED: 1000→3000 (more thumbnails)

    // 🚀 NEW: Request debouncing to prevent spam
    this.pendingRequests = new Map(); // productId → Promise
    this.requestQueue = new Set(); // Track queued requests

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
        timestamp: Date.now(),
      });

      return exists;
    } catch (error) {
      // Cachear como no existente en caso de error
      this.urlValidationCache.set(cacheKey, {
        exists: false,
        timestamp: Date.now(),
      });

      return false;
    }
  }

  /**
   * Obtener thumbnails de la base de datos con cache
   */
  async getThumbnails(productId, forceRefresh = false) {
    const cacheKey = this.generateCacheKey(productId);

    // 🚀 NEW: Check if request is already pending (debouncing)
    if (!forceRefresh && this.pendingRequests.has(productId)) {
      return await this.pendingRequests.get(productId);
    }

    // Revisar cache primero (a menos que se fuerce refresh)
    if (!forceRefresh && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.TTL) {
        return cached.data;
      }
    }

    // 🚀 NEW: Create pending request promise
    const fetchPromise = (async () => {
      try {
        let firstRow = null;
        if (FeatureFlags?.FEATURE_PHASE1_THUMBS && !forceRefresh) {
          // Delegar al servicio Phase1 (short-circuit). Devuelve fila completa.
          firstRow = await getOrFetchMainThumbnail(productId, { silent: true });
        }
        if (!firstRow) {
          const { data, error } = await supabase
            .from('product_images')
            .select('thumbnails, thumbnail_url, image_url')
            .eq('product_id', productId)
            .order('image_order', { ascending: true })
            .limit(1);
          if (error) return null;
          firstRow = data?.[0];
        }
        let thumbnailData = null;
        if (firstRow) {
          if (firstRow.thumbnails) {
            try {
              thumbnailData =
                typeof firstRow.thumbnails === 'string'
                  ? JSON.parse(firstRow.thumbnails)
                  : firstRow.thumbnails;
            } catch (_) {
              /* noop */
            }
          }
          if (!thumbnailData && firstRow.thumbnail_url) {
            const minithumbUrl = firstRow.thumbnail_url.replace(
              '_desktop_320x260.jpg',
              '_minithumb_40x40.jpg'
            );
            if (minithumbUrl !== firstRow.thumbnail_url) {
              thumbnailData = {
                minithumb: minithumbUrl,
                desktop: firstRow.thumbnail_url,
              };
            }
          }
        }
        const cacheData = {
          data: thumbnailData,
          timestamp: Date.now(),
          productId,
        };
        this.cache.set(cacheKey, cacheData);
        this.cleanupCache();
        return thumbnailData;
      } catch (error) {
        console.warn('🚨 getThumbnails error:', error);
        return null;
      } finally {
        // 🚀 NEW: Clean up pending request
        this.pendingRequests.delete(productId);
      }
    })();

    // 🚀 NEW: Store pending request for debouncing
    this.pendingRequests.set(productId, fetchPromise);

    return await fetchPromise;
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
    } catch (error) {}

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
            return this.addCacheBuster(thumbnailUrl);
          } else {
            // Si el thumbnail no existe, invalidar cache pero continuar con fallbacks
            this.invalidateProductCache(productId);
          }
        }
      }

      // 2. Consultar base de datos
      const thumbnailData = await this.getThumbnails(productId);
      if (thumbnailData && thumbnailData[size]) {
        const exists = await this.verifyThumbnailExists(thumbnailData[size]);
        if (exists) {
          return this.addCacheBuster(thumbnailData[size]);
        } else {
          // Si el thumbnail de BD no existe, invalidar cache pero continuar
          this.invalidateProductCache(productId);
        }
      }

      // 3. Construir desde imagen original para minithumb
      if (size === 'minithumb' && product.imagen) {
        const constructedUrl = this.buildMinithumbUrl(product.imagen);
        if (constructedUrl) {
          const exists = await this.verifyThumbnailExists(constructedUrl);
          if (exists) {
            return this.addCacheBuster(constructedUrl);
          }
        }
      }

      // 4. FALLBACK DIRECTO A IMAGEN PRINCIPAL - FUNCIONALIDAD PRINCIPAL NUEVA
      const mainImage = product.imagen || product.image;
      if (mainImage && mainImage !== '/placeholder-product.jpg') {
        const exists = await this.verifyThumbnailExists(mainImage);
        if (exists) {
          return this.addCacheBuster(mainImage);
        }
      }

      // 5. Fallbacks adicionales (thumbnail_url, etc.)
      const fallbacks = [product.thumbnail_url, product.thumbnailUrl].filter(
        Boolean
      );

      for (const fallbackUrl of fallbacks) {
        const exists = await this.verifyThumbnailExists(fallbackUrl);
        if (exists) {
          return this.addCacheBuster(fallbackUrl);
        }
      }

      // 6. Último recurso: placeholder
      return '/placeholder-product.jpg';
    } catch (error) {
      // En caso de error, intentar imagen principal como último recurso
      const mainImage = product.imagen || product.image;
      if (mainImage && mainImage !== '/placeholder-product.jpg') {
        return this.addCacheBuster(mainImage);
      }
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
    for (const [key] of this.urlValidationCache.entries()) {
      if (key.includes(productId)) this.urlValidationCache.delete(key);
    }
    // También invalidar fase1 para consistencia cross-cache
    try {
      phase1ETAGService.invalidateProduct(productId);
    } catch (_) {
      /* noop */
    }

    // � AGGRESSIVE INVALIDATION - Force immediate refresh
    this.forceImmediateRefresh(productId);
  }

  /**
   * 🔥 NUEVA FUNCIÓN: Force immediate refresh sin esperar eventos
   */
  forceImmediateRefresh(productId) {
    try {
      // 1. Invalidate React Query AGGRESSIVELY
      if (window.queryClient) {
        // Invalidate ALL possible query combinations
        window.queryClient.invalidateQueries({
          queryKey: ['thumbnails'],
          exact: false,
        });
        window.queryClient.invalidateQueries({
          queryKey: ['thumbnail'],
          exact: false,
        });
        window.queryClient.invalidateQueries({
          queryKey: ['product'],
          exact: false,
        });

        // Force refetch immediately
        window.queryClient.refetchQueries({
          queryKey: ['thumbnails', productId],
        });
        window.queryClient.refetchQueries({
          queryKey: ['thumbnail', productId],
        });
      }

      // 2. Force DOM image refresh with cache busting
      const images = document.querySelectorAll(
        `img[data-product-id="${productId}"]`
      );
      images.forEach(img => {
        const originalSrc = img.src;
        if (originalSrc && !originalSrc.includes('placeholder')) {
          // Force immediate cache bust
          const cacheBustedSrc = this.addCacheBuster(originalSrc.split('?')[0]);
          img.src = cacheBustedSrc;
        }
      });

      // 3. Emit multiple events for different systems
      [
        'forceImageRefresh',
        'thumbnailInvalidated',
        'productImageUpdated',
      ].forEach(eventType => {
        window.dispatchEvent(
          new CustomEvent(eventType, {
            detail: { productId, timestamp: Date.now(), force: true },
          })
        );
      });

      console.log(`🔄 FORCED refresh for product ${productId}`);
    } catch (error) {
      console.warn('⚠️ Error in forceImmediateRefresh:', error);
    }
  }

  /**
   * 🚀 OPTIMIZED: Smart cleanup por tamaño y TTL con LRU
   */
  cleanupCache() {
    const now = Date.now();
    let deletedByTTL = 0;
    let deletedBySize = 0;

    // 1. Limpiar por TTL primero
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.TTL) {
        this.cache.delete(key);
        deletedByTTL++;
      }
    }

    // 2. Limpiar por tamaño usando LRU (Least Recently Used)
    if (this.cache.size > this.MAX_CACHE_SIZE) {
      const entries = Array.from(this.cache.entries()).sort(
        (a, b) => a[1].timestamp - b[1].timestamp
      ); // más antiguos primero

      const toDelete = this.cache.size - this.MAX_CACHE_SIZE;
      for (let i = 0; i < toDelete; i++) {
        this.cache.delete(entries[i][0]);
        deletedBySize++;
      }
    }

    // 3. También limpiar URL validation cache
    for (const [key, value] of this.urlValidationCache.entries()) {
      if (now - value.timestamp > this.TTL) {
        this.urlValidationCache.delete(key);
      }
    }

    // 4. Log cleanup si es significativo
    if (deletedByTTL > 10 || deletedBySize > 5) {
      console.log(
        `🧹 Thumbnail cache cleanup: TTL=${deletedByTTL}, Size=${deletedBySize}, Remaining=${this.cache.size}`
      );
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
  }

  /**
   * 🚀 NEW: Batch loading para múltiples productos
   * Evita waterfall requests y mejora performance drasticamente
   */
  async getBestThumbnailsBatch(products) {
    if (!products || !products.length) return {};

    const results = {};
    const needFetch = [];

    // Check cache first
    products.forEach(product => {
      const productId =
        product?.id || product?.productid || product?.product_id;
      if (!productId) return;

      const cacheKey = this.generateCacheKey(productId);
      const cached = this.cache.get(cacheKey);

      if (cached && Date.now() - cached.timestamp < this.TTL) {
        results[productId] = cached.data;
      } else {
        needFetch.push(productId);
      }
    });

    // Batch fetch missing ones
    if (needFetch.length > 0) {
      try {
        const { data } = await supabase
          .from('product_images')
          .select('product_id, thumbnails, thumbnail_url, thumbnail_signature')
          .in('product_id', needFetch)
          .eq('image_order', 0);

        data?.forEach(item => {
          if (item) {
            const cacheKey = this.generateCacheKey(item.product_id);
            this.cache.set(cacheKey, {
              data: item.thumbnails || item.thumbnail_url,
              timestamp: Date.now(),
              signature: item.thumbnail_signature,
            });
            results[item.product_id] = item.thumbnails || item.thumbnail_url;
          }
        });

        // Cleanup if needed
        this.performCleanup();
      } catch (error) {
        console.warn('🚨 Batch thumbnail fetch failed:', error);
      }
    }

    return results;
  }

  /**
   * Obtener estadísticas del cache
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      urlValidationSize: this.urlValidationCache.size,
      maxSize: this.MAX_CACHE_SIZE,
      ttl: this.TTL,
    };
  }
}

// Exportar instancia singleton
export default new ThumbnailCacheService();
