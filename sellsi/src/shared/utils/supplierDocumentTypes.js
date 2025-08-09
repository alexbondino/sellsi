// src/shared/utils/supplierDocumentTypes.js

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { supabase } from '../../services/supabase';

// ============================================================================
// CACHE GLOBAL PARA DOCUMENT TYPES DE PROVEEDORES
// ============================================================================

const globalSupplierCache = {
  // Map de supplierId -> { documentTypes, timestamp }
  suppliers: new Map(),
  subscribers: new Set(),
  loadingSuppliers: new Set(), // Para evitar consultas duplicadas
  CACHE_DURATION: 10 * 60 * 1000, // 10 minutos (más que shipping porque cambia menos)
};

// Función para notificar a todos los subscribers
const notifySubscribers = (supplierId, newData) => {
  globalSupplierCache.subscribers.forEach(callback => {
    try {
      callback(supplierId, newData);
    } catch (error) {
      console.error('Error notifying supplier cache subscriber:', error);
    }
  });
};

// Función centralizada para obtener document types de un proveedor
const fetchSupplierDocumentTypesCentralized = async (supplierId) => {
  if (!supplierId) return [];
  
  // Si ya está cargando, esperar
  if (globalSupplierCache.loadingSuppliers.has(supplierId)) {
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (!globalSupplierCache.loadingSuppliers.has(supplierId)) {
          clearInterval(checkInterval);
          const cached = globalSupplierCache.suppliers.get(supplierId);
          resolve(cached?.documentTypes || []);
        }
      }, 50);
    });
  }

  // Verificar caché válido
  const cached = globalSupplierCache.suppliers.get(supplierId);
  if (cached && 
      cached.timestamp && 
      Date.now() - cached.timestamp < globalSupplierCache.CACHE_DURATION) {
    console.log('🎯 [SupplierCache] Cache HIT para supplierId:', supplierId, cached.documentTypes);
    return cached.documentTypes;
  }

  try {
    globalSupplierCache.loadingSuppliers.add(supplierId);
    console.log('🔄 [SupplierCache] Fetching document_types para supplierId:', supplierId);

    const { data, error } = await supabase
      .from('users')
      .select('document_types')
      .eq('user_id', supplierId)
      .single();
    
    if (error) {
      console.error('Error obteniendo document_types del proveedor:', error);
      return [];
    }
    
    // Filtrar solo los tipos válidos (excluir 'ninguno')
    const documentTypes = data?.document_types || [];
    const filteredTypes = documentTypes.filter(type => type !== 'ninguno');
    
    // Guardar en caché
    const cacheEntry = {
      documentTypes: filteredTypes,
      timestamp: Date.now()
    };
    
    globalSupplierCache.suppliers.set(supplierId, cacheEntry);
    console.log('💾 [SupplierCache] Guardado en cache:', supplierId, filteredTypes);
    
    // Notificar subscribers
    notifySubscribers(supplierId, cacheEntry);
    
    return filteredTypes;
  } catch (error) {
    console.error('Error en fetchSupplierDocumentTypesCentralized:', error);
    return [];
  } finally {
    globalSupplierCache.loadingSuppliers.delete(supplierId);
  }
};

/**
 * Obtiene los tipos de documento que un proveedor puede emitir (LEGACY - mantener para compatibilidad)
 * @param {string} supplierId - ID del proveedor
 * @returns {Promise<Array<string>>} Array de tipos de documento habilitados
 */
export const getSupplierDocumentTypes = async (supplierId) => {
  return await fetchSupplierDocumentTypesCentralized(supplierId);
};

/**
 * Filtra las opciones de documento según los tipos disponibles del proveedor
 * @param {Array<string>} supplierDocumentTypes - Tipos de documento del proveedor
 * @returns {Array<Object>} Opciones de documento filtradas para UI
 */
export const getAvailableDocumentOptions = (supplierDocumentTypes = []) => {
  const allOptions = [
    { value: 'boleta', label: 'Boleta' },
    { value: 'factura', label: 'Factura' }
  ];
  
  // Filtrar opciones que el proveedor tiene habilitadas
  const enabledOptions = allOptions.filter(option => 
    supplierDocumentTypes.includes(option.value)
  );
  
  // Solo agregar "ninguno" si no hay otras opciones habilitadas O si explícitamente tiene "ninguno"
  if (enabledOptions.length === 0 || supplierDocumentTypes.includes('ninguno')) {
    enabledOptions.push({ value: 'ninguno', label: 'Ninguno' });
  }
  
  return enabledOptions;
};

/**
 * Obtiene el primer tipo de documento válido como valor por defecto
 * @param {Array<string>} supplierDocumentTypes - Tipos de documento del proveedor
 * @returns {string|null} Primer tipo de documento válido o null si no hay ninguno
 */
export const getDefaultDocumentType = (supplierDocumentTypes = []) => {
  const validTypes = supplierDocumentTypes.filter(type => type !== 'ninguno');
  return validTypes.length > 0 ? validTypes[0] : null;
};

/**
 * Verifica si un proveedor tiene tipos de documento configurados
 * @param {Array<string>} supplierDocumentTypes - Tipos de documento del proveedor
 * @returns {boolean} true si tiene al menos un tipo válido configurado
 */
export const hasValidDocumentTypes = (supplierDocumentTypes = []) => {
  return supplierDocumentTypes.some(type => type !== 'ninguno' && type);
};

/**
 * Hook OPTIMIZADO para obtener y gestionar los tipos de documento de un proveedor
 * Usa cache global compartido similar a useOptimizedUserShippingRegion
 * @param {string} supplierId - ID del proveedor
 * @returns {Object} Estado y funciones relacionadas con document types
 */
export const useSupplierDocumentTypes = (supplierId) => {
  const [documentTypes, setDocumentTypes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const subscriberRef = useRef(null);
  
  // Función para actualizar el estado local cuando cambia el cache global
  const updateLocalState = useCallback((changedSupplierId, newData) => {
    if (changedSupplierId === supplierId) {
      setDocumentTypes(newData.documentTypes);
      setIsLoading(false);
    }
  }, [supplierId]);
  
  useEffect(() => {
    if (!supplierId) {
      setDocumentTypes([]);
      setIsLoading(false);
      setError(null);
      return;
    }
    
    // Suscribirse a cambios del cache global
    subscriberRef.current = updateLocalState;
    globalSupplierCache.subscribers.add(updateLocalState);
    
    const initializeData = async () => {
      // Verificar si ya tenemos datos en cache
      const cached = globalSupplierCache.suppliers.get(supplierId);
      if (cached && 
          cached.timestamp && 
          Date.now() - cached.timestamp < globalSupplierCache.CACHE_DURATION) {
        console.log('🎯 [useSupplierDocumentTypes] Cache HIT inicial para:', supplierId);
        setDocumentTypes(cached.documentTypes);
        setIsLoading(false);
        return;
      }
      
      // No hay cache válido, hacer fetch
      setIsLoading(true);
      setError(null);
      
      try {
        const types = await fetchSupplierDocumentTypesCentralized(supplierId);
        setDocumentTypes(types);
      } catch (err) {
        console.error('Error en useSupplierDocumentTypes:', err);
        setError(err.message);
        setDocumentTypes([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    initializeData();
    
    return () => {
      // Cleanup: remover subscriber
      if (subscriberRef.current) {
        globalSupplierCache.subscribers.delete(subscriberRef.current);
      }
    };
  }, [supplierId, updateLocalState]);
  
  const availableOptions = useMemo(() => 
    getAvailableDocumentOptions(documentTypes), 
    [documentTypes]
  );
  
  const defaultType = useMemo(() => 
    getDefaultDocumentType(documentTypes), 
    [documentTypes]
  );
  
  const hasValidTypes = useMemo(() => 
    hasValidDocumentTypes(documentTypes), 
    [documentTypes]
  );
  
  return {
    documentTypes,
    availableOptions,
    defaultType,
    hasValidTypes,
    loading: isLoading, // Alias para compatibilidad
    isLoading,
    error
  };
};

// ============================================================================
// FUNCIONES DE INVALIDACIÓN Y UTILIDADES DE CACHE
// ============================================================================

/**
 * Invalidar cache de un proveedor específico
 * Usar cuando se actualiza document_types del proveedor
 */
export const invalidateSupplierCache = (supplierId) => {
  if (!supplierId) return;
  
  console.log('🗑️ [SupplierCache] Invalidando cache para supplierId:', supplierId);
  globalSupplierCache.suppliers.delete(supplierId);
  
  // Notificar a subscribers para que refresquen sus datos
  notifySubscribers(supplierId, { documentTypes: [], timestamp: null });
};

/**
 * Limpiar todo el cache de proveedores
 * Usar en casos de logout o actualizaciones masivas
 */
export const clearAllSupplierCache = () => {
  console.log('🗑️ [SupplierCache] Limpiando todo el cache de proveedores');
  globalSupplierCache.suppliers.clear();
  globalSupplierCache.loadingSuppliers.clear();
};

/**
 * Obtener estadísticas del cache para debugging
 */
export const getSupplierCacheStats = () => {
  const now = Date.now();
  const validEntries = [];
  const expiredEntries = [];
  
  for (const [supplierId, entry] of globalSupplierCache.suppliers.entries()) {
    if (now - entry.timestamp < globalSupplierCache.CACHE_DURATION) {
      validEntries.push(supplierId);
    } else {
      expiredEntries.push(supplierId);
    }
  }
  
  return {
    totalCached: globalSupplierCache.suppliers.size,
    validEntries: validEntries.length,
    expiredEntries: expiredEntries.length,
    currentlyLoading: globalSupplierCache.loadingSuppliers.size,
    subscribers: globalSupplierCache.subscribers.size,
    cacheDurationMs: globalSupplierCache.CACHE_DURATION,
    validSupplierIds: validEntries,
    expiredSupplierIds: expiredEntries
  };
};

/**
 * Función para precargar document types de múltiples proveedores
 * Útil para optimizar carga inicial de marketplace
 */
export const preloadSupplierDocumentTypes = async (supplierIds = []) => {
  if (!Array.isArray(supplierIds) || supplierIds.length === 0) return;
  
  console.log('🚀 [SupplierCache] Precargando document_types para proveedores:', supplierIds);
  
  const promises = supplierIds.map(supplierId => 
    fetchSupplierDocumentTypesCentralized(supplierId)
  );
  
  try {
    await Promise.all(promises);
    console.log('✅ [SupplierCache] Precarga completada');
  } catch (error) {
    console.error('❌ [SupplierCache] Error en precarga:', error);
  }
};

// Exponer para debugging en development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  window.supplierDocumentTypesCache = {
    stats: getSupplierCacheStats,
    invalidate: invalidateSupplierCache,
    clear: clearAllSupplierCache,
    preload: preloadSupplierDocumentTypes,
    cache: globalSupplierCache
  };
}
