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

// Cache global compartido entre todas las instancias
// MEJORA: Ahora incluye cachedUserId para evitar contaminación entre cuentas.
const globalCache = {
  userRegion: null,
  timestamp: null,
  isLoading: false,
  subscribers: new Set(),
  CACHE_DURATION: 5 * 60 * 1000, // 5 minutos
  cachedUserId: null, // Nuevo: userId asociado a userRegion
};

// Función para notificar a todos los subscribers
const notifySubscribers = () => {
  globalCache.subscribers.forEach(callback => {
    try {
      callback({
        userRegion: globalCache.userRegion,
        isLoading: globalCache.isLoading
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
  if (globalCache.cachedUserId && globalCache.cachedUserId !== currentUserId) {
    globalCache.userRegion = null;
    globalCache.timestamp = null;
    globalCache.cachedUserId = currentUserId || null;
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
      globalCache.timestamp &&
      Date.now() - globalCache.timestamp < globalCache.CACHE_DURATION) {
    return globalCache.userRegion;
  }

  // Si no hay usuario autenticado -> limpiar y salir
  if (!currentUserId) {
    globalCache.userRegion = null;
    globalCache.timestamp = Date.now();
    globalCache.cachedUserId = null;
    notifySubscribers();
    return null;
  }

  try {
    globalCache.isLoading = true;
    notifySubscribers();

    const { data: profile, error } = await getUserProfile(currentUserId);
    if (error) {
      console.error('[useOptimizedUserShippingRegion] Error fetching profile:', error);
      globalCache.userRegion = null;
    } else {
      globalCache.userRegion = profile?.shipping_region || null;
    }
    globalCache.timestamp = Date.now();
    globalCache.cachedUserId = currentUserId;
    return globalCache.userRegion;
  } catch (error) {
    console.error('[useOptimizedUserShippingRegion] Unexpected error:', error);
    globalCache.userRegion = null;
    globalCache.cachedUserId = currentUserId;
    return null;
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
  const [userRegion, setUserRegion] = useState(globalCache.userRegion);
  const [isLoadingUserRegion, setIsLoadingUserRegion] = useState(globalCache.isLoading);
  const subscriberRef = useRef(null);

  // Función para actualizar el estado local cuando cambia el cache global
  const updateLocalState = useCallback((newState) => {
    setUserRegion(newState.userRegion);
    setIsLoadingUserRegion(newState.isLoading);
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
        fetchUserRegionCentralized();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return { 
    userRegion, 
    isLoadingUserRegion,
    refreshRegion,
    // Función para invalidar caché manualmente (para usar desde Profile)
    invalidateUserCache: () => {
      globalCache.userRegion = null;
      globalCache.timestamp = null;
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
    // No borramos cachedUserId para que detecte mismatch si cambia user posteriormente
    notifySubscribers();
  };
  window.primeUserShippingRegionCache = (region) => {
    if (!region) return;
    globalCache.userRegion = region;
    globalCache.timestamp = Date.now();
    try { globalCache.cachedUserId = localStorage.getItem('user_id'); } catch(e) {}
    notifySubscribers();
  };
}

export default useOptimizedUserShippingRegion;
