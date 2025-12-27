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
      startTime: Date.now(),
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
    const now = Date.now();
    // SHORT-CIRCUIT: si hay entrada válida por TTL, no tocar DB
    if (cached && now - cached.timestamp < this.TTL) {
      if (!silent && process.env.NODE_ENV !== 'production') {
        console.log('[FASE1_ETAG] Cache HIT (short-circuit):', productId);
      }
      this.recordMetric('cache_hit', now - startTime);
      return cached.data;
    }

    try {
      //
      // 🛡️ FIX PGRST116: Usar .maybeSingle() en lugar de .single() para evitar
      // error cuando no existe image_order=0 (producto eliminado o sin imágenes)
      const { data, error } = await supabase
        .from('product_images')
        .select('product_id,thumbnails,thumbnail_url,thumbnail_signature')
        .eq('product_id', productId)
        .eq('image_order', 0)
        .maybeSingle();

      if (error) {
        console.warn('[FASE1_ETAG] DB Error:', error?.message);
        this.recordMetric('error', Date.now() - startTime);
        return cached?.data || null;
      }

      const currentSignature = data?.thumbnail_signature;
      if (cached && cached.signature === currentSignature) {
        // Firma igual: solo refrescar timestamp (refresh) => HIT lógico
        cached.timestamp = Date.now();
        if (!silent && process.env.NODE_ENV !== 'production') {
          console.log(
            '[FASE1_ETAG] Cache HIT (refresh signature match):',
            productId
          );
        }
        this.recordMetric('cache_hit', Date.now() - startTime);
        return cached.data;
      }

      // MISS real (no existía o firma cambió)
      if (!silent && process.env.NODE_ENV !== 'production') {
        console.log(
          '[FASE1_ETAG] Cache MISS DB fetch:',
          productId,
          'signature:',
          currentSignature
        );
      }
      this.cache.set(productId, {
        data,
        signature: currentSignature,
        timestamp: Date.now(),
      });
      this.recordMetric('cache_miss', Date.now() - startTime);
      return data;
    } catch (err) {
      console.error(
        '[FASE1_ETAG] Error fetchThumbnailWithETag:',
        err?.message || err
      );
      this.recordMetric('error', Date.now() - startTime);
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

    // Limitar tamaño máximo (5000 entradas) - INCREASED for marketplace scale
    const maxSize = 5000;
    if (this.cache.size > maxSize) {
      const entries = Array.from(this.cache.entries()).sort(
        (a, b) => a[1].timestamp - b[1].timestamp
      ); // más antiguos primero

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
        remaining: this.cache.size,
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
    const hitRatio =
      this.metrics.totalRequests > 0
        ? ((this.metrics.cacheHits / this.metrics.totalRequests) * 100).toFixed(
            1
          )
        : 0;

    console.log(
      `[FASE1_ETAG] ${type}: ${duration}ms | Hit Ratio: ${hitRatio}% | Cache Size: ${this.cache.size}`
    );
  }

  /**
   * Obtener estadísticas del cache
   */
  getStats() {
    const hitRatio =
      this.metrics.totalRequests > 0
        ? ((this.metrics.cacheHits / this.metrics.totalRequests) * 100).toFixed(
            2
          )
        : 0;

    return {
      cacheSize: this.cache.size,
      hitRatio: hitRatio + '%',
      totalRequests: this.metrics.totalRequests,
      cacheHits: this.metrics.cacheHits,
      cacheMisses: this.metrics.cacheMisses,
      errors: this.metrics.errors,
      ttl: this.TTL,
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

  /**
   * Batch fetch: pobla cache para múltiples productIds con una sola query.
   * Respeta short-circuit para IDs ya válidos.
   */
  async fetchMany(productIds = [], { silent = true } = {}) {
    const start = Date.now();
    if (!Array.isArray(productIds) || productIds.length === 0) return {};
    const now = Date.now();
    const resultMap = {};

    const need = [];
    for (const id of productIds) {
      const cached = this.cache.get(id);
      if (cached && now - cached.timestamp < this.TTL) {
        resultMap[id] = cached.data;
      } else {
        need.push(id);
      }
    }

    if (!need.length) {
      this.recordMetric('cache_hit', Date.now() - start); // todo fueron hits (lógico)
      return resultMap;
    }

    try {
      const { data, error } = await supabase
        .from('product_images')
        .select('product_id,thumbnails,thumbnail_url,thumbnail_signature')
        .in('product_id', need)
        .eq('image_order', 0);
      if (error) {
        console.warn('[FASE1_ETAG] Batch DB Error:', error?.message);
        this.recordMetric('error', Date.now() - start);
        return resultMap; // devolver lo que había
      }
      const now2 = Date.now();
      for (const row of data) {
        this.cache.set(row.product_id, {
          data: row,
          signature: row.thumbnail_signature,
          timestamp: now2,
        });
        resultMap[row.product_id] = row;
      }
      // Para IDs sin fila (posible ausencia) dejar undefined explícito
      this.recordMetric('cache_miss', Date.now() - start);
      if (!silent && process.env.NODE_ENV !== 'production') {
        console.log(
          '[FASE1_ETAG] Batch fetch stored:',
          data.length,
          'requested:',
          productIds.length
        );
      }
      return resultMap;
    } catch (err) {
      console.error('[FASE1_ETAG] Batch fetch error:', err?.message || err);
      this.recordMetric('error', Date.now() - start);
      return resultMap;
    }
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

export async function getOrFetchManyMainThumbnails(
  productIds = [],
  options = {}
) {
  return phase1ETAGService.fetchMany(productIds, options);
}
