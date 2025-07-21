/**
 * ============================================================================
 * CACHE MANAGER - SISTEMA DE CACHE GLOBAL CON TTL Y CLEANUP
 * ============================================================================
 *
 * Sistema centralizado para gestionar cache con expiración automática,
 * límites de memoria y cleanup inteligente.
 */

class CacheManager {
  constructor(options = {}) {
    this.maxSize = options.maxSize || 1000; // Máximo 1000 entradas
    this.defaultTTL = options.defaultTTL || 30 * 60 * 1000; // 30 minutos
    this.cleanupInterval = options.cleanupInterval || 5 * 60 * 1000; // 5 minutos
    this.maxMemoryMB = options.maxMemoryMB || 50; // 50MB máximo
    
    this.cache = new Map();
    this.timers = new Map();
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      cleanups: 0,
      memoryUsage: 0
    };

    // Iniciar cleanup automático
    this.startCleanupTimer();
    
    // Exponer para debugging
    if (typeof window !== 'undefined') {
      window.cacheManager = this;
    }
  }

  /**
   * Obtener valor del cache
   * @param {string} key - Clave del cache
   * @returns {any|null} Valor cacheado o null si expiró/no existe
   */
  get(key) {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Verificar expiración
    if (Date.now() > entry.expiresAt) {
      this.delete(key);
      this.stats.misses++;
      return null;
    }

    // Actualizar access time para LRU
    entry.lastAccessed = Date.now();
    this.stats.hits++;
    return entry.data;
  }

  /**
   * Guardar valor en cache
   * @param {string} key - Clave única
   * @param {any} data - Datos a cachear
   * @param {number} ttl - TTL en milisegundos (opcional)
   */
  set(key, data, ttl = this.defaultTTL) {
    // Verificar límites antes de agregar
    if (this.cache.size >= this.maxSize) {
      this.evictLRU();
    }

    const expiresAt = Date.now() + ttl;
    const entry = {
      data,
      expiresAt,
      createdAt: Date.now(),
      lastAccessed: Date.now(),
      size: this.estimateSize(data)
    };

    // Limpiar timer anterior si existe
    const existingTimer = this.timers.get(key);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Crear timer de expiración
    const timer = setTimeout(() => {
      this.delete(key);
    }, ttl);

    this.cache.set(key, entry);
    this.timers.set(key, timer);
    this.updateMemoryUsage();
  }

  /**
   * Eliminar entrada del cache
   */
  delete(key) {
    const entry = this.cache.get(key);
    if (entry) {
      this.cache.delete(key);
      
      const timer = this.timers.get(key);
      if (timer) {
        clearTimeout(timer);
        this.timers.delete(key);
      }
      
      this.updateMemoryUsage();
      return true;
    }
    return false;
  }

  /**
   * Limpiar cache completo
   */
  clear() {
    // Limpiar todos los timers
    this.timers.forEach(timer => clearTimeout(timer));
    this.timers.clear();
    this.cache.clear();
    this.stats.cleanups++;
    this.updateMemoryUsage();
  }

  /**
   * Cleanup automático de entradas expiradas
   */
  cleanup() {
    const now = Date.now();
    let cleanupCount = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.delete(key);
        cleanupCount++;
      }
    }

    this.stats.cleanups++;
    console.log(`[CacheManager] Cleanup completado: ${cleanupCount} entradas eliminadas`);
    
    // Verificar límites de memoria
    this.checkMemoryLimits();
  }

  /**
   * Eviction LRU (Least Recently Used)
   */
  evictLRU() {
    let oldestKey = null;
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.delete(oldestKey);
      this.stats.evictions++;
    }
  }

  /**
   * Estimar tamaño de datos en bytes
   */
  estimateSize(data) {
    if (typeof data === 'string') {
      return data.length * 2; // UTF-16
    }
    if (typeof data === 'object') {
      return JSON.stringify(data).length * 2;
    }
    return 8; // Primitivos
  }

  /**
   * Actualizar estadísticas de memoria
   */
  updateMemoryUsage() {
    let totalSize = 0;
    for (const entry of this.cache.values()) {
      totalSize += entry.size;
    }
    this.stats.memoryUsage = totalSize;
  }

  /**
   * Verificar límites de memoria
   */
  checkMemoryLimits() {
    const memoryMB = this.stats.memoryUsage / (1024 * 1024);
    
    if (memoryMB > this.maxMemoryMB) {
      console.warn(`[CacheManager] Límite de memoria excedido: ${memoryMB.toFixed(2)}MB`);
      
      // Evict agresivamente hasta estar bajo el límite
      while (this.cache.size > 0 && (this.stats.memoryUsage / (1024 * 1024)) > this.maxMemoryMB * 0.8) {
        this.evictLRU();
      }
    }
  }

  /**
   * Iniciar timer de cleanup automático
   */
  startCleanupTimer() {
    setInterval(() => {
      this.cleanup();
    }, this.cleanupInterval);
  }

  /**
   * Obtener estadísticas del cache
   */
  getStats() {
    return {
      ...this.stats,
      size: this.cache.size,
      memoryMB: (this.stats.memoryUsage / (1024 * 1024)).toFixed(2),
      hitRate: this.stats.hits / (this.stats.hits + this.stats.misses) || 0
    };
  }
}

// Instancia global del cache manager
export const globalCacheManager = new CacheManager({
  maxSize: 1000,
  defaultTTL: 30 * 60 * 1000, // 30 minutos
  cleanupInterval: 5 * 60 * 1000, // 5 minutos
  maxMemoryMB: 50
});

// Cache específico para thumbnails con TTL más corto
export const thumbnailCacheManager = new CacheManager({
  maxSize: 500,
  defaultTTL: 15 * 60 * 1000, // 15 minutos
  cleanupInterval: 3 * 60 * 1000, // 3 minutos
  maxMemoryMB: 20
});

export default CacheManager;
