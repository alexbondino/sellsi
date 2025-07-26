# 🚀 PLAN DE IMPLEMENTACIÓN FASE 4.1: CACHE STRATEGY IMPLEMENTATION

**Fecha**: 21 de Julio de 2025  
**Ejecutor**: Colega desarrollador (siguiendo instrucciones al pie de la letra)  
**Objetivo**: Implementar estrategia completa de cache con TTL, cleanup automático y optimización de observers para prevenir memory leaks y mejorar performance

---

## 📊 **ANÁLISIS EXHAUSTIVO DEL ESTADO ACTUAL**

### 🔍 **Problemas Críticos Identificados**

#### **1. Cache Global Sin TTL - CRÍTICO**
**Ubicación**: `src/hooks/useResponsiveThumbnail.js:7`
```javascript
// ❌ PROBLEMA: Cache infinito sin limpieza
const thumbnailCache = new Map();
```

**Impacto Medido**:
- **Memory leak potencial**: Cache crece indefinidamente
- **Datos obsoletos**: Thumbnails cacheados nunca se invalidan
- **Performance degradation**: Map global sin límites de tamaño

**Evidencia de Uso**:
- 8+ operaciones de cache por hook (get/set)
- Usado en producto cards (~100-1000+ productos por página)
- Cache keys: `minithumb_first_${productId}` - potencialmente miles

#### **2. Intersection Observers Sin Límites - ALTO**
**Ubicaciones**:
- `src/hooks/useLazyImage.js:54` - Observer por imagen lazy
- `src/features/layout/LazyImage.jsx:31` - Observer duplicado 
- `src/features/supplier/hooks/useLazyProducts.js:54` - Observer para infinite scroll

**Impacto Medido**:
- **Concurrent observers**: Sin límite máximo
- **Memory overhead**: ~1-2KB por observer activo
- **Performance impact**: +100 observers simultáneos en grids grandes

#### **3. Server State Sin Gestión - MEDIO**
**Ubicaciones**:
- `src/hooks/useResponsiveThumbnail.js:149-170` - Query directa a Supabase
- Múltiples servicios hacen queries independientes
- Sin deduplicación de requests

**Impacto**:
- **Requests redundantes**: Mismo producto consultado múltiples veces
- **Network overhead**: ~50-100ms por query innecesaria
- **Rate limiting risk**: Burst requests a Supabase

---

## 🎯 **PLAN DE IMPLEMENTACIÓN DETALLADO**

### **ETAPA 1: IMPLEMENTAR TTL EN useResponsiveThumbnail**

#### **Paso 1.1: Crear Cache Manager Centralizado**
**Archivo**: `src/utils/cacheManager.js` (NUEVO)

```javascript
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
```

#### **Paso 1.2: Refactorizar useResponsiveThumbnail**
**Archivo**: `src/hooks/useResponsiveThumbnail.js` (MODIFICAR)

**Cambios específicos**:

1. **Importar nuevo cache manager**:
```javascript
// ❌ ELIMINAR (línea 7):
const thumbnailCache = new Map();

// ✅ AGREGAR (línea 5):
import { thumbnailCacheManager } from '../utils/cacheManager';
```

2. **Actualizar función fetchThumbnailsFromDB** (líneas 149-200):
```javascript
// Reemplazar verificación de cache existente:
// ❌ ELIMINAR:
const cacheKey = `minithumb_first_${productId}`;
if (thumbnailCache.has(cacheKey)) {
  const cachedData = thumbnailCache.get(cacheKey);
  setDbThumbnails(cachedData);
  return;
}

// ✅ AGREGAR:
const cacheKey = `minithumb_first_${productId}`;
const cachedData = thumbnailCacheManager.get(cacheKey);
if (cachedData !== null) {
  console.log('[useMinithumb] ✅ Usando thumbnail desde cache TTL:', cacheKey, cachedData);
  setDbThumbnails(cachedData);
  return;
}
```

3. **Actualizar operaciones de cache** (todas las ocurrencias):
```javascript
// ❌ ELIMINAR todas las líneas tipo:
thumbnailCache.set(cacheKey, data);

// ✅ REEMPLAZAR por:
thumbnailCacheManager.set(cacheKey, data, 15 * 60 * 1000); // 15 min TTL para thumbnails
```

#### **Paso 1.3: Agregar Cache Invalidation**
**Archivo**: `src/hooks/useResponsiveThumbnail.js` (AGREGAR al final)

```javascript
/**
 * Función para invalidar cache de thumbnails de un producto específico
 * Usar cuando se actualiza/elimina un producto
 */
export const invalidateThumbnailCache = (productId) => {
  const patterns = [
    `minithumb_first_${productId}`,
    `responsive_thumb_${productId}`,
    `thumb_info_${productId}`
  ];
  
  patterns.forEach(pattern => {
    thumbnailCacheManager.delete(pattern);
  });
  
  console.log(`[useResponsiveThumbnail] Cache invalidado para producto ${productId}`);
};

/**
 * Función para limpiar todo el cache de thumbnails
 * Usar en casos de actualizaciones masivas o debugging
 */
export const clearAllThumbnailCache = () => {
  thumbnailCacheManager.clear();
  console.log('[useResponsiveThumbnail] Todo el cache de thumbnails limpiado');
};
```

---

### **ETAPA 2: LIMITAR OBSERVERS CONCURRENTES**

#### **Paso 2.1: Crear Observer Pool Manager**
**Archivo**: `src/utils/observerPoolManager.js` (NUEVO)

```javascript
/**
 * ============================================================================
 * OBSERVER POOL MANAGER - GESTIÓN DE INTERSECTION OBSERVERS
 * ============================================================================
 *
 * Sistema para limitar y reutilizar IntersectionObservers para prevenir
 * memory leaks y optimizar performance.
 */

class ObserverPoolManager {
  constructor(options = {}) {
    this.maxObservers = options.maxObservers || 10;
    this.defaultOptions = options.defaultOptions || {
      threshold: 0.1,
      rootMargin: '50px'
    };
    
    this.observers = new Map(); // key: optionsHash, value: observer
    this.targets = new Map();   // key: element, value: { observer, callbacks }
    this.stats = {
      activeObservers: 0,
      observedElements: 0,
      reusedObservers: 0,
      createdObservers: 0
    };

    // Exponer para debugging
    if (typeof window !== 'undefined') {
      window.observerPool = this;
    }
  }

  /**
   * Crear hash único para opciones del observer
   */
  createOptionsHash(options) {
    return JSON.stringify(options);
  }

  /**
   * Obtener o crear observer para opciones específicas
   */
  getObserver(options = this.defaultOptions) {
    const hash = this.createOptionsHash(options);
    
    if (this.observers.has(hash)) {
      this.stats.reusedObservers++;
      return this.observers.get(hash);
    }

    // Verificar límite de observers
    if (this.observers.size >= this.maxObservers) {
      console.warn(`[ObserverPool] Límite de observers alcanzado (${this.maxObservers}). Reusando observer existente.`);
      // Retornar el primer observer disponible
      return this.observers.values().next().value;
    }

    // Crear nuevo observer
    const observer = new IntersectionObserver((entries) => {
      this.handleIntersection(entries);
    }, options);

    this.observers.set(hash, observer);
    this.stats.createdObservers++;
    this.stats.activeObservers = this.observers.size;
    
    console.log(`[ObserverPool] Nuevo observer creado. Total: ${this.observers.size}`);
    return observer;
  }

  /**
   * Observar elemento con callback específico
   */
  observe(element, callback, options = this.defaultOptions) {
    if (!element || typeof callback !== 'function') {
      console.warn('[ObserverPool] Elemento o callback inválido');
      return () => {}; // Retornar unobserve dummy
    }

    const observer = this.getObserver(options);
    
    // Si el elemento ya está siendo observado, agregar callback
    if (this.targets.has(element)) {
      const target = this.targets.get(element);
      target.callbacks.push(callback);
    } else {
      // Observar nuevo elemento
      this.targets.set(element, {
        observer,
        callbacks: [callback]
      });
      
      observer.observe(element);
      this.stats.observedElements = this.targets.size;
    }

    // Retornar función de cleanup
    return () => this.unobserve(element, callback);
  }

  /**
   * Dejar de observar elemento o callback específico
   */
  unobserve(element, callback = null) {
    const target = this.targets.get(element);
    if (!target) return;

    if (callback) {
      // Remover callback específico
      const index = target.callbacks.indexOf(callback);
      if (index > -1) {
        target.callbacks.splice(index, 1);
      }

      // Si no quedan callbacks, dejar de observar el elemento
      if (target.callbacks.length === 0) {
        target.observer.unobserve(element);
        this.targets.delete(element);
        this.stats.observedElements = this.targets.size;
      }
    } else {
      // Remover observación completa del elemento
      target.observer.unobserve(element);
      this.targets.delete(element);
      this.stats.observedElements = this.targets.size;
    }
  }

  /**
   * Manejar intersecciones
   */
  handleIntersection(entries) {
    entries.forEach(entry => {
      const target = this.targets.get(entry.target);
      if (target) {
        target.callbacks.forEach(callback => {
          try {
            callback(entry);
          } catch (error) {
            console.error('[ObserverPool] Error en callback:', error);
          }
        });
      }
    });
  }

  /**
   * Cleanup completo
   */
  cleanup() {
    // Disconnect todos los observers
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
    this.targets.clear();
    
    this.stats = {
      activeObservers: 0,
      observedElements: 0,
      reusedObservers: this.stats.reusedObservers,
      createdObservers: this.stats.createdObservers
    };
    
    console.log('[ObserverPool] Cleanup completo realizado');
  }

  /**
   * Obtener estadísticas
   */
  getStats() {
    return {
      ...this.stats,
      efficiency: this.stats.reusedObservers / Math.max(this.stats.createdObservers, 1)
    };
  }
}

// Instancia global del pool de observers
export const globalObserverPool = new ObserverPoolManager({
  maxObservers: 10,
  defaultOptions: {
    threshold: 0.1,
    rootMargin: '50px'
  }
});

export default ObserverPoolManager;
```

#### **Paso 2.2: Refactorizar useLazyImage**
**Archivo**: `src/hooks/useLazyImage.js` (MODIFICAR)

**Cambios específicos**:

1. **Importar observer pool** (línea 10):
```javascript
// ✅ AGREGAR:
import { globalObserverPool } from '../utils/observerPoolManager';
```

2. **Reemplazar IntersectionObserver directo** (líneas 54-75):
```javascript
// ❌ ELIMINAR todo el useEffect actual:
useEffect(() => {
  if (!src) return

  const observer = new IntersectionObserver(
    (entries) => {
      const [entry] = entries
      if (entry.isIntersecting && !isLoaded && !isLoading) {
        setIsLoading(true)
        loadImage()
      }
    },
    { threshold, rootMargin }
  )

  const currentRef = imgRef.current
  if (currentRef) {
    observer.observe(currentRef)
  }

  return () => {
    if (currentRef) {
      observer.unobserve(currentRef)
    }
  }
}, [src, threshold, rootMargin, loadImage])

// ✅ REEMPLAZAR por:
useEffect(() => {
  if (!src || !imgRef.current) return;

  const handleIntersection = (entry) => {
    if (entry.isIntersecting && !isLoaded && !isLoading) {
      setIsLoading(true);
      loadImage();
    }
  };

  const unobserveFunc = globalObserverPool.observe(
    imgRef.current,
    handleIntersection,
    { threshold, rootMargin }
  );

  return unobserveFunc;
}, [src, threshold, rootMargin, loadImage, isLoaded, isLoading]);
```

#### **Paso 2.3: Refactorizar LazyImage component**
**Archivo**: `src/features/layout/LazyImage.jsx` (MODIFICAR)

**Cambios específicos** (líneas 31-50):

```javascript
// ❌ ELIMINAR:
useEffect(() => {
  const observer = new IntersectionObserver(
    (entries) => {
      const [entry] = entries
      if (entry.isIntersecting) {
        setIsVisible(true)
        observer.disconnect()
      }
    },
    { rootMargin }
  )

  const currentElement = elementRef.current
  if (currentElement) {
    observer.observe(currentElement)
  }

  return () => {
    if (currentElement) {
      observer.unobserve(currentElement)
    }
  }
}, [rootMargin])

// ✅ REEMPLAZAR por:
useEffect(() => {
  if (!elementRef.current) return;

  const handleIntersection = (entry) => {
    if (entry.isIntersecting) {
      setIsVisible(true);
    }
  };

  const unobserveFunc = globalObserverPool.observe(
    elementRef.current,
    handleIntersection,
    { rootMargin }
  );

  return unobserveFunc;
}, [rootMargin]);
```

---

### **ETAPA 3: IMPLEMENTAR REACT QUERY PARA SERVER STATE**

#### **Paso 3.1: Instalar React Query**
**Comando terminal**:
```bash
npm install @tanstack/react-query @tanstack/react-query-devtools
```

#### **Paso 3.2: Configurar Query Client**
**Archivo**: `src/utils/queryClient.js` (NUEVO)

```javascript
/**
 * ============================================================================
 * REACT QUERY CLIENT - CONFIGURACIÓN PARA SERVER STATE
 * ============================================================================
 */

import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache por 15 minutos por defecto
      staleTime: 15 * 60 * 1000,
      cacheTime: 30 * 60 * 1000,
      
      // Retry configuration
      retry: (failureCount, error) => {
        // No retry para errores 404, 401, 403
        if (error?.status && [404, 401, 403].includes(error.status)) {
          return false;
        }
        // Retry hasta 3 veces para otros errores
        return failureCount < 3;
      },
      
      // Refetch behavior
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      refetchOnMount: false,
    },
    mutations: {
      // Retry mutations una vez por defecto
      retry: 1,
    },
  },
});

// Configuración específica para diferentes tipos de queries
export const QUERY_KEYS = {
  // Thumbnails
  THUMBNAIL: (productId) => ['thumbnail', productId],
  THUMBNAIL_LIST: (productIds) => ['thumbnails', 'list', ...productIds],
  
  // Products
  PRODUCT: (productId) => ['product', productId],
  PRODUCTS_BY_SUPPLIER: (supplierId) => ['products', 'supplier', supplierId],
  
  // Images
  PRODUCT_IMAGES: (productId) => ['product_images', productId],
};

// Configuraciones de cache específicas por tipo
export const CACHE_CONFIGS = {
  THUMBNAILS: {
    staleTime: 15 * 60 * 1000, // 15 minutos
    cacheTime: 60 * 60 * 1000, // 1 hora
  },
  
  PRODUCT_DATA: {
    staleTime: 5 * 60 * 1000,  // 5 minutos
    cacheTime: 30 * 60 * 1000, // 30 minutos
  },
  
  CRITICAL_DATA: {
    staleTime: 1 * 60 * 1000,  // 1 minuto
    cacheTime: 5 * 60 * 1000,  // 5 minutos
  },
};
```

#### **Paso 3.3: Crear Query Hooks para Thumbnails**
**Archivo**: `src/hooks/useThumbnailQueries.js` (NUEVO)

```javascript
/**
 * ============================================================================
 * THUMBNAIL QUERIES - REACT QUERY HOOKS PARA THUMBNAILS
 * ============================================================================
 */

import { useQuery, useQueries } from '@tanstack/react-query';
import { supabase } from '../services/supabase';
import { QUERY_KEYS, CACHE_CONFIGS } from '../utils/queryClient';

/**
 * Query individual para thumbnails de un producto
 */
export const useThumbnailQuery = (productId, options = {}) => {
  return useQuery({
    queryKey: QUERY_KEYS.THUMBNAIL(productId),
    queryFn: async () => {
      if (!productId) throw new Error('Product ID is required');

      const { data, error } = await supabase
        .from('product_images')
        .select('thumbnails, thumbnail_url')
        .eq('product_id', productId)
        .order('image_url', { ascending: true })
        .limit(1);

      if (error) throw error;

      const firstRow = data?.[0];
      return firstRow || null;
    },
    enabled: !!productId,
    ...CACHE_CONFIGS.THUMBNAILS,
    ...options,
  });
};

/**
 * Query batch para múltiples thumbnails
 * Optimizado para cargar muchos productos a la vez
 */
export const useThumbnailsBatch = (productIds = [], options = {}) => {
  return useQuery({
    queryKey: QUERY_KEYS.THUMBNAIL_LIST(productIds),
    queryFn: async () => {
      if (!productIds.length) return {};

      const { data, error } = await supabase
        .from('product_images')
        .select('product_id, thumbnails, thumbnail_url')
        .in('product_id', productIds)
        .order('product_id, image_url');

      if (error) throw error;

      // Agrupar por product_id y tomar el primero de cada uno
      const thumbnailsMap = {};
      data.forEach(row => {
        if (!thumbnailsMap[row.product_id]) {
          thumbnailsMap[row.product_id] = row;
        }
      });

      return thumbnailsMap;
    },
    enabled: productIds.length > 0,
    ...CACHE_CONFIGS.THUMBNAILS,
    ...options,
  });
};

/**
 * Hook para múltiples queries independientes
 * Cuando necesitas queries separadas para cada producto
 */
export const useThumbnailsIndependent = (productIds = []) => {
  return useQueries({
    queries: productIds.map(productId => ({
      queryKey: QUERY_KEYS.THUMBNAIL(productId),
      queryFn: async () => {
        const { data, error } = await supabase
          .from('product_images')
          .select('thumbnails, thumbnail_url')
          .eq('product_id', productId)
          .order('image_url', { ascending: true })
          .limit(1);

        if (error) throw error;
        return data?.[0] || null;
      },
      enabled: !!productId,
      ...CACHE_CONFIGS.THUMBNAILS,
    })),
  });
};

/**
 * Invalidación específica de cache de thumbnails
 */
export const useInvalidateThumbnails = () => {
  const queryClient = useQueryClient();
  
  return {
    invalidateProduct: (productId) => {
      queryClient.invalidateQueries({ 
        queryKey: QUERY_KEYS.THUMBNAIL(productId) 
      });
    },
    
    invalidateAll: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['thumbnail'] 
      });
    },
    
    removeProduct: (productId) => {
      queryClient.removeQueries({ 
        queryKey: QUERY_KEYS.THUMBNAIL(productId) 
      });
    },
  };
};
```

#### **Paso 3.4: Integrar React Query en App**
**Archivo**: `src/App.jsx` (MODIFICAR)

**Agregar imports** (líneas superiores):
```javascript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from './utils/queryClient';
```

**Envolver componente principal**:
```javascript
// Buscar el return principal de App y envolver con:
return (
  <QueryClientProvider client={queryClient}>
    {/* ... resto del JSX existente ... */}
    
    {/* DevTools solo en desarrollo */}
    {process.env.NODE_ENV === 'development' && (
      <ReactQueryDevtools initialIsOpen={false} />
    )}
  </QueryClientProvider>
);
```

---

### **ETAPA 4: REFACTORIZAR useResponsiveThumbnail CON REACT QUERY**

#### **Paso 4.1: Crear Nueva Versión del Hook**
**Archivo**: `src/hooks/useResponsiveThumbnailV2.js` (NUEVO)

```javascript
/**
 * ============================================================================
 * USE RESPONSIVE THUMBNAIL V2 - CON REACT QUERY Y CACHE TTL
 * ============================================================================
 */

import { useMemo } from 'react';
import { useTheme } from '@mui/material/styles';
import { useMediaQuery } from '@mui/material';
import { useThumbnailQuery } from './useThumbnailQueries';

/**
 * Hook optimizado para thumbnails con React Query
 */
export const useResponsiveThumbnail = (product) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.between('md', 'lg'));
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg'));

  // Query solo si no tenemos thumbnails en el producto
  const needsQuery = product && product.id && !product.thumbnails;
  
  const { 
    data: dbThumbnails, 
    isLoading: isLoadingThumbnails,
    error: thumbnailError 
  } = useThumbnailQuery(
    product?.id,
    { 
      enabled: needsQuery,
      // Cache extra largo para thumbnails
      staleTime: 30 * 60 * 1000, // 30 minutos
      cacheTime: 2 * 60 * 60 * 1000, // 2 horas
    }
  );

  const thumbnailUrl = useMemo(() => {
    if (!product) return '/placeholder-product.jpg';

    // Prioridad 1: Thumbnails del producto
    if (product.thumbnails && typeof product.thumbnails === 'object') {
      if (isMobile && product.thumbnails.mobile) {
        return product.thumbnails.mobile;
      }
      if (isTablet && product.thumbnails.tablet) {
        return product.thumbnails.tablet;
      }
      if (isDesktop && product.thumbnails.desktop) {
        return product.thumbnails.desktop;
      }
    }

    // Prioridad 2: Thumbnails de la base de datos (React Query)
    if (dbThumbnails?.thumbnails && typeof dbThumbnails.thumbnails === 'object') {
      const thumbs = dbThumbnails.thumbnails;
      if (isMobile && thumbs.mobile) return thumbs.mobile;
      if (isTablet && thumbs.tablet) return thumbs.tablet;
      if (isDesktop && thumbs.desktop) return thumbs.desktop;
    }

    // Prioridad 3: Thumbnail_url de la BD
    if (dbThumbnails?.thumbnail_url) {
      return dbThumbnails.thumbnail_url;
    }

    // Prioridad 4: Thumbnails principales del producto
    if (product.thumbnailUrl || product.thumbnail_url) {
      return product.thumbnailUrl || product.thumbnail_url;
    }

    // Prioridad 5: Imagen original
    if (product.imagen) {
      return product.imagen;
    }

    return '/placeholder-product.jpg';
  }, [product, isMobile, isTablet, isDesktop, dbThumbnails]);

  return {
    thumbnailUrl,
    isLoading: isLoadingThumbnails,
    error: thumbnailError,
    hasResponsiveThumbnails: !!(product?.thumbnails || dbThumbnails?.thumbnails),
  };
};

/**
 * Hook para minithumb con React Query
 */
export const useMinithumb = (product) => {
  const needsQuery = product && product.id && 
    !(product.thumbnails?.minithumb);
  
  const { 
    data: dbThumbnails,
    isLoading 
  } = useThumbnailQuery(
    product?.id,
    { enabled: needsQuery }
  );

  return useMemo(() => {
    if (!product) return '/placeholder-product.jpg';

    // Prioridad 1: Minithumb del producto
    if (product.thumbnails?.minithumb) {
      return product.thumbnails.minithumb;
    }

    // Prioridad 2: Minithumb de la BD
    if (dbThumbnails?.thumbnails?.minithumb) {
      return dbThumbnails.thumbnails.minithumb;
    }

    // Construir desde thumbnail_url si es posible
    if (dbThumbnails?.thumbnail_url) {
      const constructedUrl = dbThumbnails.thumbnail_url.replace(
        '_desktop_320x260.jpg',
        '_minithumb_40x40.jpg'
      );
      if (constructedUrl !== dbThumbnails.thumbnail_url) {
        return constructedUrl;
      }
    }

    // Fallbacks
    if (product.thumbnailUrl) return product.thumbnailUrl;
    if (product.thumbnail_url) return product.thumbnail_url;
    if (product.imagen) return product.imagen;

    return '/placeholder-product.jpg';
  }, [product, dbThumbnails]);
};

/**
 * Hook para información completa con React Query
 */
export const useThumbnailInfo = (product) => {
  const { thumbnailUrl, isLoading, hasResponsiveThumbnails } = useResponsiveThumbnail(product);
  const minithumb = useMinithumb(product);

  return useMemo(() => ({
    current: thumbnailUrl,
    minithumb,
    mobile: product?.thumbnails?.mobile || thumbnailUrl,
    tablet: product?.thumbnails?.tablet || thumbnailUrl,
    desktop: product?.thumbnails?.desktop || thumbnailUrl,
    original: product?.imagen || '/placeholder-product.jpg',
    hasResponsiveThumbnails,
    isLoading,
  }), [thumbnailUrl, minithumb, product, hasResponsiveThumbnails, isLoading]);
};
```

---

### **ETAPA 5: TESTING Y VALIDACIÓN**

#### **Paso 5.1: Crear Tests para Cache Manager**
**Archivo**: `src/utils/__tests__/cacheManager.test.js` (NUEVO)

```javascript
/**
 * Tests para CacheManager
 */
import CacheManager from '../cacheManager';

describe('CacheManager', () => {
  let cacheManager;

  beforeEach(() => {
    cacheManager = new CacheManager({
      maxSize: 3,
      defaultTTL: 100, // 100ms para tests rápidos
      cleanupInterval: 50,
      maxMemoryMB: 1
    });
  });

  afterEach(() => {
    cacheManager.clear();
  });

  test('debe guardar y recuperar datos', () => {
    cacheManager.set('test1', 'data1');
    expect(cacheManager.get('test1')).toBe('data1');
  });

  test('debe retornar null para datos expirados', (done) => {
    cacheManager.set('test2', 'data2', 50); // 50ms TTL
    
    setTimeout(() => {
      expect(cacheManager.get('test2')).toBeNull();
      done();
    }, 100);
  });

  test('debe hacer eviction cuando se alcanza maxSize', () => {
    cacheManager.set('test1', 'data1');
    cacheManager.set('test2', 'data2');
    cacheManager.set('test3', 'data3');
    cacheManager.set('test4', 'data4'); // Debería evict test1
    
    expect(cacheManager.get('test1')).toBeNull();
    expect(cacheManager.get('test4')).toBe('data4');
  });

  test('debe actualizar estadísticas correctamente', () => {
    cacheManager.set('test', 'data');
    cacheManager.get('test'); // hit
    cacheManager.get('missing'); // miss
    
    const stats = cacheManager.getStats();
    expect(stats.hits).toBe(1);
    expect(stats.misses).toBe(1);
    expect(stats.hitRate).toBe(0.5);
  });
});
```

#### **Paso 5.2: Crear Tests para Observer Pool**
**Archivo**: `src/utils/__tests__/observerPoolManager.test.js` (NUEVO)

```javascript
/**
 * Tests para ObserverPoolManager
 */
import ObserverPoolManager from '../observerPoolManager';

// Mock IntersectionObserver
const mockObserver = {
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
};

global.IntersectionObserver = jest.fn(() => mockObserver);

describe('ObserverPoolManager', () => {
  let pool;
  let mockElement;
  let mockCallback;

  beforeEach(() => {
    pool = new ObserverPoolManager({ maxObservers: 2 });
    mockElement = document.createElement('div');
    mockCallback = jest.fn();
    jest.clearAllMocks();
  });

  test('debe reutilizar observers con mismas opciones', () => {
    const options = { threshold: 0.5 };
    
    const observer1 = pool.getObserver(options);
    const observer2 = pool.getObserver(options);
    
    expect(observer1).toBe(observer2);
    expect(global.IntersectionObserver).toHaveBeenCalledTimes(1);
  });

  test('debe limitar número máximo de observers', () => {
    pool.getObserver({ threshold: 0.1 });
    pool.getObserver({ threshold: 0.2 });
    const observer3 = pool.getObserver({ threshold: 0.3 }); // Debería reutilizar
    
    expect(pool.getStats().activeObservers).toBeLessThanOrEqual(2);
  });

  test('debe ejecutar callbacks en intersección', () => {
    pool.observe(mockElement, mockCallback);
    
    // Simular intersección
    const observerCallback = global.IntersectionObserver.mock.calls[0][0];
    observerCallback([{ target: mockElement, isIntersecting: true }]);
    
    expect(mockCallback).toHaveBeenCalledWith(
      expect.objectContaining({ target: mockElement })
    );
  });
});
```

#### **Paso 5.3: Validación Manual**
**Archivo**: `src/utils/performanceMonitor.js` (NUEVO)

```javascript
/**
 * Monitor de performance para validar mejoras
 */
export class PerformanceMonitor {
  constructor() {
    this.metrics = {
      cacheHits: 0,
      cacheMisses: 0,
      observersCreated: 0,
      observersReused: 0,
      memoryUsage: 0,
      requestsSaved: 0
    };
    
    this.startTime = Date.now();
    this.intervals = [];
    
    // Exponer para debugging
    if (typeof window !== 'undefined') {
      window.performanceMonitor = this;
    }
  }

  recordCacheHit() {
    this.metrics.cacheHits++;
  }

  recordCacheMiss() {
    this.metrics.cacheMisses++;
  }

  recordObserverCreated() {
    this.metrics.observersCreated++;
  }

  recordObserverReused() {
    this.metrics.observersReused++;
  }

  updateMemoryUsage(bytes) {
    this.metrics.memoryUsage = bytes;
  }

  getReport() {
    const runtime = Date.now() - this.startTime;
    const cacheEfficiency = this.metrics.cacheHits / 
      (this.metrics.cacheHits + this.metrics.cacheMisses) || 0;
    const observerEfficiency = this.metrics.observersReused / 
      (this.metrics.observersCreated + this.metrics.observersReused) || 0;

    return {
      runtime: `${(runtime / 1000).toFixed(2)}s`,
      cache: {
        hits: this.metrics.cacheHits,
        misses: this.metrics.cacheMisses,
        efficiency: `${(cacheEfficiency * 100).toFixed(1)}%`
      },
      observers: {
        created: this.metrics.observersCreated,
        reused: this.metrics.observersReused,
        efficiency: `${(observerEfficiency * 100).toFixed(1)}%`
      },
      memory: `${(this.metrics.memoryUsage / (1024 * 1024)).toFixed(2)}MB`,
      requestsSaved: this.metrics.requestsSaved
    };
  }

  startMonitoring() {
    // Monitor cada 30 segundos
    const interval = setInterval(() => {
      console.log('[PerformanceMonitor] Report:', this.getReport());
    }, 30000);
    
    this.intervals.push(interval);
  }

  stopMonitoring() {
    this.intervals.forEach(interval => clearInterval(interval));
    this.intervals = [];
  }
}

export const globalPerformanceMonitor = new PerformanceMonitor();
```

---

## 🚀 **PLAN DE DEPLOYMENT Y ROLLBACK**

### **Fase de Deployment Seguro**

#### **Paso 1: Feature Flags**
**Archivo**: `src/utils/featureFlags.js` (NUEVO)

```javascript
/**
 * Feature flags para rollout gradual
 */
export const FEATURE_FLAGS = {
  CACHE_TTL_ENABLED: process.env.REACT_APP_CACHE_TTL === 'true',
  OBSERVER_POOL_ENABLED: process.env.REACT_APP_OBSERVER_POOL === 'true',
  REACT_QUERY_ENABLED: process.env.REACT_APP_REACT_QUERY === 'true',
  PERFORMANCE_MONITORING: process.env.NODE_ENV === 'development',
};

export const isFeatureEnabled = (flag) => {
  return FEATURE_FLAGS[flag] || false;
};
```

#### **Paso 2: Deployment Gradual**

**Semana 1**: Solo Cache TTL
```bash
# .env
REACT_APP_CACHE_TTL=true
REACT_APP_OBSERVER_POOL=false
REACT_APP_REACT_QUERY=false
```

**Semana 2**: Cache TTL + Observer Pool
```bash
# .env
REACT_APP_CACHE_TTL=true
REACT_APP_OBSERVER_POOL=true
REACT_APP_REACT_QUERY=false
```

**Semana 3**: Todo activado
```bash
# .env
REACT_APP_CACHE_TTL=true
REACT_APP_OBSERVER_POOL=true
REACT_APP_REACT_QUERY=true
```

#### **Paso 3: Monitoring de Producción**

**Métricas a monitorear**:
1. **Memory usage**: Debe mantenerse bajo 50MB
2. **Cache hit rate**: Target >70%
3. **Observer count**: Máximo 10 concurrentes
4. **Request reduction**: Target 30% menos queries
5. **Page load time**: Debe mejorar 15-20%

#### **Paso 4: Plan de Rollback**

**Rollback automático si**:
- Memory usage > 100MB por 5 minutos
- Cache hit rate < 30% por 10 minutos
- JavaScript errors > 5% increase
- Page load time > 20% slower

**Comandos de rollback**:
```bash
# Rollback inmediato
REACT_APP_CACHE_TTL=false
REACT_APP_OBSERVER_POOL=false
REACT_APP_REACT_QUERY=false

# Deploy anterior
git revert <commit-hash>
npm run build && npm run deploy
```

---

## 📊 **MÉTRICAS DE ÉXITO Y VALIDACIÓN**

### **KPIs Técnicos**

#### **Pre-implementación (Baseline)**
- [ ] Memory usage actual: ___MB
- [ ] Cache hit rate: 0% (no cache TTL)
- [ ] Observers concurrentes: Sin límite
- [ ] Requests por página: ___
- [ ] Page load time: ___ms

#### **Post-implementación (Targets)**
- [ ] Memory usage: <50MB ✅
- [ ] Cache hit rate: >70% ✅
- [ ] Observers concurrentes: ≤10 ✅
- [ ] Request reduction: -30% ✅
- [ ] Page load time: -20% ✅

### **Checklist de Validación**

#### **Cache TTL Implementation**
- [ ] `CacheManager` creado y testeado
- [ ] `useResponsiveThumbnail` migrado
- [ ] Cache invalidation implementado
- [ ] TTL funcionando correctamente
- [ ] Memory limits respetados
- [ ] Tests unitarios passing

#### **Observer Pool Implementation**
- [ ] `ObserverPoolManager` creado
- [ ] `useLazyImage` migrado
- [ ] `LazyImage` component migrado
- [ ] Límite de observers funcionando
- [ ] Reuso de observers verificado
- [ ] Tests unitarios passing

#### **React Query Implementation**
- [ ] React Query instalado y configurado
- [ ] Query client setupeado
- [ ] `useThumbnailQueries` implementado
- [ ] `useResponsiveThumbnailV2` funcionando
- [ ] DevTools funcionando en dev
- [ ] Cache invalidation con React Query

#### **Testing & Monitoring**
- [ ] Tests unitarios completos
- [ ] Performance monitor implementado
- [ ] Feature flags funcionando
- [ ] Métricas baseline tomadas
- [ ] Plan de rollback documentado

---

## ⚠️ **CONSIDERACIONES CRÍTICAS PARA EL EJECUTOR**

### **1. Orden de Implementación OBLIGATORIO**
- **NO cambiar el orden** de las etapas
- Validar cada etapa antes de continuar
- Hacer commits pequeños y frecuentes
- Testear en desarrollo antes de production

### **2. Puntos de No-Retorno**
- Una vez migrado a React Query, mantener consistencia
- No mezclar cache antiguo con nuevo sistema
- Observer pool debe ser global o no implementar

### **3. Testing Obligatorio**
```bash
# Antes de cada commit
npm test
npm run build
npm run start # Verificar en navegador
```

### **4. Logs de Debug**
- Mantener todos los console.log durante development
- Configurar para remover en production build
- Usar performance monitor activamente

### **5. Rollback Triggers**
- Memory leak detectado
- Cache hit rate < 30%
- Errores de JavaScript aumentan >5%
- Performance degrada >10%

---

## 📅 **TIMELINE DE IMPLEMENTACIÓN**

| Semana | Etapa | Entregables | Tiempo Est. |
|--------|-------|-------------|-------------|
| **1** | Cache TTL | CacheManager + useResponsiveThumbnail migrado | 16h |
| **2** | Observer Pool | ObserverPoolManager + hooks migrados | 12h |
| **3** | React Query | Setup + queries básicas | 20h |
| **4** | Integration | useResponsiveThumbnailV2 + testing | 16h |
| **5** | Deployment | Feature flags + monitoring + rollout | 8h |

**Total estimado**: ~72 horas de desarrollo

---

## 💡 **NOTAS FINALES PARA EL EJECUTOR**

1. **Lee completamente antes de empezar** - Este plan es largo pero evita errores costosos
2. **Usa feature flags** - Permite rollback rápido si algo falla  
3. **Monitor constantemente** - Las métricas son tu guía de éxito
4. **Documenta problemas** - Cualquier desviación del plan debe ser documentada
5. **Pregunta si tienes dudas** - Mejor clarificar que implementar incorrectamente

**¡El éxito de esta implementación depende de seguir cada paso meticulosamente!**

---

**Documento creado**: 21 de Julio de 2025  
**Versión**: 1.0  
**Estado**: LISTO PARA IMPLEMENTACIÓN
