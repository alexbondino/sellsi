/**
 * ============================================================================
 * OPTIMIZED USER SHIPPING REGION HOOK
 * ============================================================================
 * 
 * Hook optimizado que reemplaza useUserShippingRegion con caché inteligente,
 * pero mantiene la misma interfaz para compatibilidad.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { getUserProfile } from '../services/user';
import { onCacheReady } from '../infrastructure/auth/AuthReadyCoordinator';

// Cache global compartido entre todas las instancias
// MEJORA: Ahora incluye cachedUserId para evitar contaminación entre cuentas.
// FIX CRÍTICO: Persistencia en sessionStorage + optimistic updates para evitar
// pérdida de estado al minimizar/restaurar navegador
const globalCache = {
  userRegion: null,
  timestamp: null,
  isLoading: false,
  subscribers: new Set(),
  CACHE_DURATION: 15 * 60 * 1000, // 15 minutos (extendido desde 5)
  SESSION_CACHE_DURATION: 30 * 60 * 1000, // 30 minutos para sessionStorage
  cachedUserId: null, // Nuevo: userId asociado a userRegion
  isStale: false, // Nuevo: indica si el cache necesita refresh pero mantiene valor
  
  // ⭐ NUEVO: Inicializar desde sessionStorage al cargar
  init() {
    if (typeof window === 'undefined' || typeof sessionStorage === 'undefined') return;
    
    try {
      const cached = sessionStorage.getItem('user_shipping_region_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        const age = Date.now() - parsed.timestamp;
        
        // Validar que no tenga más de 30 minutos
        if (age < this.SESSION_CACHE_DURATION) {
          this.userRegion = parsed.userRegion;
          this.timestamp = parsed.timestamp;
          this.cachedUserId = parsed.cachedUserId;
          this.isStale = age > this.CACHE_DURATION; // Marcar como stale si > 15min pero < 30min
          
          console.log('✅ [useOptimizedUserShippingRegion] Cache restaurado desde sessionStorage:', {
            userRegion: this.userRegion,
            age: Math.round(age / 1000) + 's',
            isStale: this.isStale
          });
        } else {
          
          sessionStorage.removeItem('user_shipping_region_cache');
        }
      }
    } catch (e) {
      console.warn('⚠️ [useOptimizedUserShippingRegion] Error al cargar cache:', e);
    }
  },
  
  // ⭐ NUEVO: Persistir en sessionStorage
  persist() {
    if (typeof window === 'undefined' || typeof sessionStorage === 'undefined') return;
    
    try {
      if (this.userRegion) {
        sessionStorage.setItem('user_shipping_region_cache', JSON.stringify({
          userRegion: this.userRegion,
          timestamp: this.timestamp,
          cachedUserId: this.cachedUserId
        }));
      } else {
        sessionStorage.removeItem('user_shipping_region_cache');
      }
    } catch (e) {
      console.warn('⚠️ [useOptimizedUserShippingRegion] Error al persistir cache:', e);
    }
  }
};

// Inicializar cache desde sessionStorage al cargar el módulo
globalCache.init();

// Función para notificar a todos los subscribers
// FIX: Ahora incluye flag isStale para optimistic updates
const notifySubscribers = () => {
  globalCache.subscribers.forEach(callback => {
    try {
      callback({
        userRegion: globalCache.userRegion,
        isLoading: globalCache.isLoading,
        isStale: globalCache.isStale // Indica si el valor es viejo pero válido
      });
    } catch (error) {
      console.error('Error notifying subscriber:', error);
    }
  });
};

// Función centralizada para obtener región del usuario
const fetchUserRegionCentralized = async () => {
  // Obtener userId actual al inicio
  const currentUserId = (() => {
    try {
      return localStorage.getItem('user_id');
    } catch (e) { return null; }
  })();

  // Si user cambió respecto al cache, invalidar inmediatamente
  // ⚡ FIX CRÍTICO: Solo invalidar si AMBOS existen y son DIFERENTES
  // No invalidar si uno es null (puede ser timing issue de localStorage)
  if (globalCache.cachedUserId && currentUserId && globalCache.cachedUserId !== currentUserId) {
    console.log('🔄 [useOptimizedUserShippingRegion] Usuario cambió, invalidando cache:', {
      cached: globalCache.cachedUserId,
      current: currentUserId
    });
    globalCache.userRegion = null;
    globalCache.timestamp = null;
    globalCache.cachedUserId = currentUserId;
    globalCache.isStale = false;
    globalCache.persist(); // Persistir cambios
  } else if (!globalCache.cachedUserId && currentUserId) {
    // Si no hay cachedUserId pero hay currentUserId, actualizar sin borrar
    
    globalCache.cachedUserId = currentUserId;
    if (globalCache.userRegion) {
      globalCache.persist(); // Persistir con el userId actualizado
    }
  }

  // Si ya está cargando, esperar a que termine
  if (globalCache.isLoading) {
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (!globalCache.isLoading) {
          clearInterval(checkInterval);
          resolve(globalCache.userRegion);
        }
      }, 40);
    });
  }

  // Reutilizar cache válido sólo si userId coincide
  if (currentUserId &&
      globalCache.userRegion !== null &&
      globalCache.cachedUserId === currentUserId &&
      globalCache.timestamp) {
    
    const cacheAge = Date.now() - globalCache.timestamp;
    
    // ✅ Cache fresco: retornar inmediatamente
    if (cacheAge < globalCache.CACHE_DURATION) {
      globalCache.isStale = false;
      return globalCache.userRegion;
    }
    
    // ⚡ OPTIMISTIC UPDATE: Cache expirado pero válido (< 30min)
    // Retornar el valor viejo MIENTRAS refrescamos en background
    if (cacheAge < globalCache.SESSION_CACHE_DURATION) {
      
      globalCache.isStale = true;
      notifySubscribers(); // Notificar que tenemos valor stale
      
      // Refrescar en background (no bloqueante)
      (async () => {
        try {
          globalCache.isLoading = true;
          const { data: profile, error } = await getUserProfile(currentUserId);
          
          if (!error && profile?.shipping_region) {
            globalCache.userRegion = profile.shipping_region;
            globalCache.timestamp = Date.now();
            globalCache.isStale = false;
            globalCache.persist();
            notifySubscribers();
            
          }
        } catch (err) {
          console.error('⚠️ [useOptimizedUserShippingRegion] Error al refrescar en background:', err);
        } finally {
          globalCache.isLoading = false;
        }
      })();
      
      // Retornar el valor viejo inmediatamente (sin esperar)
      return globalCache.userRegion;
    }
    
    // Cache muy viejo (> 30min): forzar refresh bloqueante
    
  }

  // Si no hay usuario autenticado -> limpiar y salir
  if (!currentUserId) {
    globalCache.userRegion = null;
    globalCache.timestamp = Date.now();
    globalCache.cachedUserId = null;
    globalCache.isStale = false;
    globalCache.persist();
    notifySubscribers();
    return null;
  }

  try {
    globalCache.isLoading = true;
    notifySubscribers();

    const { data: profile, error } = await getUserProfile(currentUserId);
    if (error) {
      console.error('[useOptimizedUserShippingRegion] Error fetching profile:', error);
      // ⚡ OPTIMISTIC: NO borrar el valor anterior si hay error
      // Solo mantener el timestamp viejo para intentar de nuevo más tarde
      if (!globalCache.userRegion) {
        globalCache.userRegion = null; // Solo si no había valor
      }
      globalCache.isStale = true; // Marcar como stale por error
    } else {
      globalCache.userRegion = profile?.shipping_region || null;
      globalCache.timestamp = Date.now();
      globalCache.isStale = false;
      globalCache.persist(); // Persistir nuevo valor
      // ✅ Notificar al AuthReadyCoordinator que user-region cache está listo
      try { onCacheReady('user-region'); } catch(e) {}
    }
    globalCache.cachedUserId = currentUserId;
    return globalCache.userRegion;
  } catch (error) {
    console.error('[useOptimizedUserShippingRegion] Unexpected error:', error);
    // ⚡ OPTIMISTIC: Mantener valor anterior si existe
    if (!globalCache.userRegion) {
      globalCache.userRegion = null;
    }
    globalCache.cachedUserId = currentUserId;
    globalCache.isStale = true;
    return globalCache.userRegion;
  } finally {
    globalCache.isLoading = false;
    notifySubscribers();
  }
};

/**
 * Hook optimizado que reemplaza useUserShippingRegion
 * Mantiene la misma interfaz pero usa caché global
 */
export const useOptimizedUserShippingRegion = () => {
  const [userRegion, setUserRegion] = useState(() => {
    
    return globalCache.userRegion;
  });
  const [isLoadingUserRegion, setIsLoadingUserRegion] = useState(globalCache.isLoading);
  const [isStale, setIsStale] = useState(globalCache.isStale);
  const subscriberRef = useRef(null);

  // Función para actualizar el estado local cuando cambia el cache global
  const updateLocalState = useCallback((newState) => {
    setUserRegion(newState.userRegion);
    setIsLoadingUserRegion(newState.isLoading);
    setIsStale(newState.isStale || false);
  }, []);

  // Función para refrescar manualmente
  const refreshRegion = useCallback(async () => {
    return await fetchUserRegionCentralized();
  }, []);

  useEffect(() => {
    // Suscribirse a cambios del cache global
    subscriberRef.current = updateLocalState;
    globalCache.subscribers.add(updateLocalState);

    // Inicializar si no hay datos en cache
    const initializeRegion = async () => {
      if (globalCache.userRegion === null && !globalCache.isLoading) {
        await fetchUserRegionCentralized();
      }
    };

    initializeRegion();

    return () => {
      // Cleanup: remover subscriber
      if (subscriberRef.current) {
        globalCache.subscribers.delete(subscriberRef.current);
      }
    };
  }, [updateLocalState]);

  // Escuchar cambios en localStorage (login/logout)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'user_id') {
        // Invalidar cache cuando cambia el usuario
        globalCache.userRegion = null;
        globalCache.timestamp = null;
        globalCache.isStale = false;
        globalCache.persist();
        fetchUserRegionCentralized();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // ⭐ NUEVO: Page Visibility API - Detectar cuando se restaura la ventana
  // Este es el FIX CLAVE para el bug de minimizar/restaurar
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Página restaurada desde background
        
        
        // Si el cache está stale o expirado, refrescar suavemente
        if (globalCache.timestamp) {
          const cacheAge = Date.now() - globalCache.timestamp;
          
          if (cacheAge > globalCache.CACHE_DURATION) {
            
            // El fetch ya maneja optimistic updates, no perderemos el valor
            fetchUserRegionCentralized();
          } else {
            
          }
        } else if (!globalCache.isLoading && !globalCache.userRegion) {
          // Si no hay cache y no está cargando, inicializar
          
          fetchUserRegionCentralized();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  return { 
    userRegion, 
    isLoadingUserRegion,
    isStale, // Nuevo: indica si el valor es viejo pero aún válido
    refreshRegion,
    // Función para invalidar caché manualmente (para usar desde Profile)
    invalidateUserCache: () => {
      globalCache.userRegion = null;
      globalCache.timestamp = null;
      globalCache.isStale = false;
      globalCache.persist();
      // Mantener cachedUserId: se fuerza refetch para ese usuario
      notifySubscribers();
    },
    // Nuevo: Primar/forzar valor inmediato de región (para usar justo después de Onboarding)
    primeUserRegionCache: (newRegion) => {
      if (!newRegion || typeof newRegion !== 'string') return;
      // Normalizar (trim y lowercase) manteniendo compatibilidad con formato existente
      const normalized = newRegion.trim();
      globalCache.userRegion = normalized;
      globalCache.timestamp = Date.now();
      globalCache.isStale = false;
      globalCache.persist();
      // Asignar userId actual al primar
      try { globalCache.cachedUserId = localStorage.getItem('user_id'); } catch (e) {}
      notifySubscribers();
    }
  };
};

// Exponer helpers globales para otros módulos (AuthProvider, etc.) sin obligar a montar hook
if (typeof window !== 'undefined') {
  window.invalidateUserShippingRegionCache = () => {
    globalCache.userRegion = null;
    globalCache.timestamp = null;
    globalCache.isStale = false;
    globalCache.persist();
    // No borramos cachedUserId para que detecte mismatch si cambia user posteriormente
    notifySubscribers();
  };
  window.primeUserShippingRegionCache = (region) => {
    if (!region) return;
    globalCache.userRegion = region;
    globalCache.timestamp = Date.now();
    globalCache.isStale = false;
    globalCache.persist();
    try { globalCache.cachedUserId = localStorage.getItem('user_id'); } catch(e) {}
    notifySubscribers();
  };
}

export default useOptimizedUserShippingRegion;
