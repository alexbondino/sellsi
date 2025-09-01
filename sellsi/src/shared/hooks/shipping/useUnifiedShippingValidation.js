/**
 * ============================================================================
 * UNIFIED SHIPPING VALIDATION HOOK - BEST OF BOTH WORLDS
 * ============================================================================
 * 
 * Hook unificado que combina lo mejor de:
 * - useOptimizedShippingValidation (shared) - Cache avanzado
 * - useOptimizedShippingValidation (cart) - Validación bajo demanda
 * 
 * Proporciona una API consistente para ambos casos de uso.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useOptimizedUserShippingRegion } from '../../../hooks/useOptimizedUserShippingRegion';

/**
 * Estados unificados para validación de shipping
 */
export const SHIPPING_STATES = {
  COMPATIBLE: 'compatible',
  INCOMPATIBLE_REGION: 'incompatible_region', 
  NO_SHIPPING_INFO: 'no_shipping_info'
};

/**
 * Cache global para validaciones de shipping
 */
const globalShippingCache = {
  validations: new Map(),
  timestamp: Date.now(),
  CACHE_DURATION: 5 * 60 * 1000, // 5 minutos
  // LRU cap: máximo de entradas en la caché para evitar crecimiento ilimitado
  MAX_ENTRIES: 500,
  
  get: (productId, region) => {
    const key = `${productId}-${region}`;
    const cached = globalShippingCache.validations.get(key);
    
    if (cached && (Date.now() - cached.timestamp) < globalShippingCache.CACHE_DURATION) {
      // Move entry to the end to mark it as recently used (LRU)
      try {
        globalShippingCache.validations.delete(key);
        globalShippingCache.validations.set(key, cached);
      } catch (err) {
        // noop
      }
      return cached.data;
    }
    return null;
  },
  
  set: (productId, region, validation) => {
    const key = `${productId}-${region}`;
    // Si ya existe, remover antes para actualizar su posición (LRU)
    if (globalShippingCache.validations.has(key)) {
      globalShippingCache.validations.delete(key);
    }
    globalShippingCache.validations.set(key, {
      data: validation,
      timestamp: Date.now()
    });

    // Si excede el tamaño máximo, eliminar el entry menos recientemente usado (primero)
    try {
      while (globalShippingCache.validations.size > globalShippingCache.MAX_ENTRIES) {
        const firstKey = globalShippingCache.validations.keys().next().value;
        if (!firstKey) break;
        globalShippingCache.validations.delete(firstKey);
      }
    } catch (err) {
      // noop
    }
  },
  
  // Invalidate a specific productId and optional region; if region omitted, invalidates all entries for productId
  invalidate: (productId, region = null) => {
    if (!productId) return;
    if (region) {
      const key = `${productId}-${region}`;
      globalShippingCache.validations.delete(key);
      return;
    }

    // remove all keys that start with productId-
    const prefix = `${productId}-`;
    const keysToDelete = [];
    for (const k of globalShippingCache.validations.keys()) {
      if (k.startsWith(prefix)) keysToDelete.push(k);
    }
    keysToDelete.forEach(k => globalShippingCache.validations.delete(k));
  },

  clear: () => {
    globalShippingCache.validations.clear();
  }
};

/**
 * Hook unificado para validación de shipping
 * Compatibile con ambos casos de uso existentes
 */
export const useUnifiedShippingValidation = (cartItems = [], isAdvancedMode = false) => {
  const { userRegion, isLoadingUserRegion } = useOptimizedUserShippingRegion();
  
  const [shippingStates, setShippingStates] = useState({});
  const [error, setError] = useState(null);
  const [incompatibleProducts, setIncompatibleProducts] = useState([]);
  const [validationResults, setValidationResults] = useState(new Map());

  /**
   * Obtener nombre legible de la región - memoizado
   */
  const getUserRegionName = useMemo(() => {
    const regionMap = {
      'arica-parinacota': 'Arica y Parinacota',
      'tarapaca': 'Tarapacá',
      'antofagasta': 'Antofagasta',
      'atacama': 'Atacama',
      'coquimbo': 'Coquimbo',
      'valparaiso': 'Valparaíso',
      'metropolitana': 'Región Metropolitana',
      'ohiggins': "O'Higgins",
      'maule': 'Maule',
      'nuble': 'Ñuble',
      'biobio': 'Biobío',
      'araucania': 'Araucanía',
      'los-rios': 'Los Ríos',
      'los-lagos': 'Los Lagos',
      'aysen': 'Aysén',
      'magallanes': 'Magallanes'
    };
    
    return (regionValue) => regionMap[regionValue] || regionValue;
  }, []);

  /**
   * Función principal de validación de shipping (sin efectos secundarios)
   */
  const validateProductShipping = useCallback((product, targetUserRegion = null) => {
    const effectiveUserRegion = targetUserRegion || userRegion;
    
    // Si no hay región del usuario, no se puede validar
    if (!effectiveUserRegion) {
      return {
        state: SHIPPING_STATES.NO_SHIPPING_INFO,
        message: 'Configura tu dirección de despacho en tu perfil',
        canShip: false
      };
    }

    // Obtener información de despacho del producto con múltiples fuentes
    const shippingRegions = product.shippingRegions || 
                          product.delivery_regions || 
                          product.shipping_regions || 
                          product.product_delivery_regions ||
                          [];

    // Si no hay regiones, mostrar mensaje específico
    if (!shippingRegions || shippingRegions.length === 0) {
      return {
        state: SHIPPING_STATES.NO_SHIPPING_INFO,
        message: 'Este producto no cuenta con información de despacho',
        canShip: false
      };
    }

    // Buscar la región del usuario en las regiones del producto
    const matchingRegion = shippingRegions.find(region => {
      const regionValue = region.region || region.value;
      return regionValue === effectiveUserRegion;
    });

    // Estado: Compatible
    if (matchingRegion) {
      const days = matchingRegion.delivery_days || 
                  matchingRegion.maxDeliveryDays || 
                  matchingRegion.days || 
                  'N/A';
      
      const cost = matchingRegion.price || 
                  matchingRegion.shippingValue || 
                  matchingRegion.cost || 
                  0;
      
      return {
        state: SHIPPING_STATES.COMPATIBLE,
        message: `${days} días hábiles - $${cost.toLocaleString('es-CL')}`,
        canShip: true,
        shippingInfo: {
          days: days,
          cost: cost
        }
      };
    }

    // Estado: Incompatible por región
    const availableRegions = shippingRegions.map(region => {
      const regionValue = region.region || region.value;
      return getUserRegionName(regionValue);
    });
    
    return {
      state: SHIPPING_STATES.INCOMPATIBLE_REGION,
      message: `No disponible en: ${getUserRegionName(effectiveUserRegion)}`,
      canShip: false,
      availableRegions: availableRegions
    };
  }, [userRegion, getUserRegionName]);

  /**
   * Validación con caché inteligente (para uso general)
   */
    // validateProductWithCache(product, options?) - options: { forceRefresh }
    const validateProductWithCache = useCallback((product, options = {}) => {
      const { forceRefresh = false } = options || {};
  
      if (!product?.id || !userRegion) {
        return validateProductShipping(product);
      }
  
      // Si no se fuerza refresh, intentar leer cache global
      if (!forceRefresh) {
        const cached = globalShippingCache.get(product.id, userRegion);
        if (cached) return cached;
      }
  
      // Validar y guardar en cache
      const validation = validateProductShipping(product, userRegion);
      globalShippingCache.set(product.id, userRegion, validation);
  
      return validation;
    }, [userRegion, validateProductShipping]);

  /**
   * Validación de un producto específico (BAJO DEMANDA - para carrito)
   */
    // validateSingleProduct(product, options?) - options forwarded to validateProductWithCache
    const validateSingleProduct = useCallback((product, options = {}) => {
      if (!product || !userRegion) return null;
      return validateProductWithCache(product, options);
    }, [userRegion, validateProductWithCache]);

  /**
   * Obtener validación existente por ID
   */
  const getProductValidation = useCallback((productId) => {
    return validationResults.get(productId);
  }, [validationResults]);

  /**
   * Validación batch para múltiples productos
   */
    // validateProductsBatch(products, options?) - options: { forceRefresh }
    const validateProductsBatch = useCallback((products, options = {}) => {
      const { forceRefresh = false } = options || {};
      if (!userRegion || !Array.isArray(products)) return [];
  
      const results = products.map(product => ({
        product,
        validation: validateProductWithCache(product, { forceRefresh })
      }));
  
      // Actualizar estado local para compatibilidad con carrito
      const newResults = new Map(validationResults);
      results.forEach(({ product, validation }) => {
        if (product?.id) {
          newResults.set(product.id, validation);
        }
      });
      setValidationResults(newResults);
  
      return results;
    }, [userRegion, validateProductWithCache, validationResults]);

  /**
   * Verificar si todos los productos son compatibles (para carrito)
   */
  const isCartCompatible = useCallback(() => {
    if (!isAdvancedMode) return true;
    if (!userRegion) return false;
    return incompatibleProducts.length === 0;
  }, [isAdvancedMode, userRegion, incompatibleProducts]);

  /**
   * Verificar si la Información de Despacho está completa
   */
  const isShippingInfoComplete = useCallback(() => {
    try {
      return !!(
        userRegion && 
        Object.keys(shippingStates).length > 0 &&
        Object.values(shippingStates).every(state => 
          state.state !== SHIPPING_STATES.NO_SHIPPING_INFO
        )
      );
    } catch (err) {
      console.error('Error checking shipping info:', err);
      return false;
    }
  }, [userRegion, shippingStates]);

  /**
   * Limpiar cache y estados cuando cambia la región
   */
  useEffect(() => {
    if (userRegion) {
      setShippingStates({});
      setIncompatibleProducts([]);
      setValidationResults(new Map());
      // No limpiar cache global para mantener performance entre componentes
    }
  }, [userRegion]);

    // Permite que consumidores limpien la cache global antes de forzar validaciones frescas
    const clearGlobalShippingCache = useCallback(() => {
      try {
        globalShippingCache.clear();
        setValidationResults(new Map());
      } catch (err) {
        // noop
      }
    }, []);

  return {
    // Estados principales
    userRegion,
    isLoadingUserRegion,
    shippingStates,
    error,
    incompatibleProducts,

    // Estados derivados
    isCartCompatible: isCartCompatible(),
    isShippingInfoComplete: isShippingInfoComplete(),

    // Funciones de validación
    validateProductShipping,     // Función pura sin cache (shared)
    validateProductWithCache,    // Con cache inteligente (shared)
    validateSingleProduct,       // Wrapper para carrito (cart)
    getProductValidation,        // Obtener validación existente (shared)
    validateProductsBatch,       // Validación en lote (shared)

    // Utilidades
    getUserRegionName,
    
    // Constantes
    SHIPPING_STATES,

    // Métricas de cache
    cacheStats: {
      size: globalShippingCache.validations.size,
    maxEntries: globalShippingCache.MAX_ENTRIES,
      validationCount: validationResults.size
    }
  ,
  // Utilities
  clearGlobalShippingCache,
  // Invalidation selectiva: invalidateGlobalCache(productId, region?)
  invalidateGlobalCache: globalShippingCache.invalidate
  };
};

export default useUnifiedShippingValidation;
