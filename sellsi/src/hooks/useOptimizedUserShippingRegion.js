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
const globalCache = {
  userRegion: null,
  timestamp: null,
  isLoading: false,
  subscribers: new Set(),
  CACHE_DURATION: 5 * 60 * 1000, // 5 minutos
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
  // Si ya está cargando, esperar
  if (globalCache.isLoading) {
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (!globalCache.isLoading) {
          clearInterval(checkInterval);
          resolve(globalCache.userRegion);
        }
      }, 50);
    });
  }

  // Verificar caché válido
  if (globalCache.userRegion !== null && 
      globalCache.timestamp && 
      Date.now() - globalCache.timestamp < globalCache.CACHE_DURATION) {
    return globalCache.userRegion;
  }

  try {
    globalCache.isLoading = true;
    notifySubscribers();

    const userId = localStorage.getItem('user_id');
    if (!userId) {
      globalCache.userRegion = null;
      globalCache.timestamp = Date.now();
      return null;
    }

    const { data: profile, error } = await getUserProfile(userId);
    
    if (error) {
      console.error('Error fetching user profile:', error);
      globalCache.userRegion = null;
    } else {
      globalCache.userRegion = profile?.shipping_region || null;
    }
    
    globalCache.timestamp = Date.now();
    return globalCache.userRegion;
  } catch (error) {
    console.error('Error in fetchUserRegionCentralized:', error);
    globalCache.userRegion = null;
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
      notifySubscribers();
    }
  };
};

export default useOptimizedUserShippingRegion;
