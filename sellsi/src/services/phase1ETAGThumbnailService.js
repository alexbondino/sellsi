// FASE 1: ETag Thumbnail Service - Quick Win #2
// Usar el singleton central para evitar múltiples GoTrueClient y warnings
import { supabase } from './supabase.js';

export class Phase1ETAGThumbnailService {
  constructor() {
    // Cache Map con TTL
    this.cache = new Map();
    this.TTL = 30 * 60 * 1000; // 30 minutos
    
    // Métricas internas (self-contained)
    this.metrics = {
      cacheHits: 0,
      cacheMisses: 0,
      totalRequests: 0,
      errors: 0,
      startTime: Date.now()
    };
    
    // Cleanup automático cada 10 minutos
    setInterval(() => this.cleanup(), 10 * 60 * 1000);
    
    console.log('[FASE1_ETAG] Service initialized with TTL:', this.TTL);
  }

  /**
   * FASE 1: Fetch con ETag usando thumbnail_signature
   * Aprovecha signature existente para evitar re-downloads
   */
  async fetchThumbnailWithETag(productId, { silent = false } = {}) {
    const startTime = Date.now();
    const cached = this.cache.get(productId);
    
    try {
      // Consulta con signature para validar cache (USA NUEVO ÍNDICE FASE 1)
  const { data, error } = await supabase
        .from('product_images')
        .select('product_id,thumbnails,thumbnail_url,thumbnail_signature')
        .eq('product_id', productId)
        .eq('image_order', 0)
        .single();

      if (error) {
        console.warn('[FASE1_ETAG] DB Error:', error);
        this.recordMetric('error', Date.now() - startTime);
        return cached?.data || null;
      }

      const currentSignature = data.thumbnail_signature;
      
      // CACHE HIT: signature matches
      if (cached && cached.signature === currentSignature) {
        if (!silent) console.log('[FASE1_ETAG] Cache HIT:', productId, 'signature:', currentSignature);
        this.recordMetric('cache_hit', Date.now() - startTime);
        return cached.data;
      }

      // CACHE MISS: update cache with new data
  if (!silent) console.log('[FASE1_ETAG] Cache MISS:', productId, 'new signature:', currentSignature);
      
      const cacheEntry = {
        data,
        signature: currentSignature,
        timestamp: Date.now()
      };
      
      this.cache.set(productId, cacheEntry);
      this.recordMetric('cache_miss', Date.now() - startTime);
      
      return data;

    } catch (error) {
      this.recordMetric('error', Date.now() - startTime);
      console.error('[FASE1_ETAG] Error:', error);
      
      // Return cached data if available on error
      return cached?.data || null;
    }
  }

  /**
   * Invalidar cache de un producto específico
   */
  invalidateProduct(productId) {
    const deleted = this.cache.delete(productId);
    console.log('[FASE1_ETAG] Invalidated:', productId, 'existed:', deleted);
    return deleted;
  }

  /**
   * Cleanup automático basado en TTL
   */
  cleanup() {
    const now = Date.now();
    let deletedByTTL = 0;
    let deletedBySize = 0;
    
    // Eliminar por TTL
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.TTL) {
        this.cache.delete(key);
        deletedByTTL++;
      }
    }
    
    // Limitar tamaño máximo (1000 entradas)
    const maxSize = 1000;
    if (this.cache.size > maxSize) {
      const entries = Array.from(this.cache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp); // más antiguos primero
      
      const toDelete = this.cache.size - maxSize;
      for (let i = 0; i < toDelete; i++) {
        this.cache.delete(entries[i][0]);
        deletedBySize++;
      }
    }
    
    if (deletedByTTL > 0 || deletedBySize > 0) {
      console.log('[FASE1_ETAG] Cleanup:', {
        deletedByTTL,
        deletedBySize,
        remaining: this.cache.size
      });
    }
  }

  /**
   * Métrica helper con self-contained logging
   */
  recordMetric(type, duration) {
    this.metrics.totalRequests++;
    
    if (type === 'cache_hit') {
      this.metrics.cacheHits++;
    } else if (type === 'cache_miss') {
      this.metrics.cacheMisses++;
    } else if (type === 'error') {
      this.metrics.errors++;
    }

    // Self-contained performance logging
    const hitRatio = this.metrics.totalRequests > 0 ? 
      (this.metrics.cacheHits / this.metrics.totalRequests * 100).toFixed(1) : 0;
    
    console.log(`[FASE1_ETAG] ${type}: ${duration}ms | Hit Ratio: ${hitRatio}% | Cache Size: ${this.cache.size}`);
  }

  /**
   * Obtener estadísticas del cache
   */
  getStats() {
    const hitRatio = this.metrics.totalRequests > 0 ? 
      (this.metrics.cacheHits / this.metrics.totalRequests * 100).toFixed(2) : 0;
    
    return {
      cacheSize: this.cache.size,
      hitRatio: hitRatio + '%',
      totalRequests: this.metrics.totalRequests,
      cacheHits: this.metrics.cacheHits,
      cacheMisses: this.metrics.cacheMisses,
      errors: this.metrics.errors,
      ttl: this.TTL
    };
  }

  /**
   * Clear todo el cache (útil para testing)
   */
  clearAll() {
    const size = this.cache.size;
    this.cache.clear();
    console.log('[FASE1_ETAG] Cache cleared, removed:', size);
    return size;
  }
}

// Singleton instance (exported both as named and default for flexibility)
export const phase1ETAGService = new Phase1ETAGThumbnailService();
// Export default separado para compatibilidad con imports existentes
export default phase1ETAGService;

// Diagnóstico: export trivial para verificar que los exports se exponen correctamente
export const __PHASE1_ETAG_DIAG__ = 'ok';

// Helper universal para reemplazar llamadas directas a supabase.from('product_images') de la imagen principal
// Uso: getOrFetchMainThumbnail(productId)
export async function getOrFetchMainThumbnail(productId, options = {}) {
  return phase1ETAGService.fetchThumbnailWithETag(productId, options);
}
