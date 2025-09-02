import { useState, useEffect, useRef, useCallback } from 'react';

// Funciones de utilidad fuera del componente para evitar dependencias cambiantes
const calculateTimeRemaining = (offer) => {
  const now = new Date();
  
  if (offer.status === 'pending') {
    const expiresAt = new Date(offer.expires_at);
    return Math.max(0, Math.floor((expiresAt - now) / 1000));
  } else if (offer.status === 'accepted') {
    const deadline = new Date(offer.purchase_deadline);
    return Math.max(0, Math.floor((deadline - now) / 1000));
  }
  
  return 0;
};

const formatTimeRemaining = (seconds) => {
  if (seconds <= 0) return 'Expirado';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
};

/**
 * Hook para manejar timers de ofertas de manera optimizada
 * @param {Object} offer - Objeto de oferta
 * @param {Function} onExpire - Callback cuando la oferta expira
 * @returns {number} Segundos restantes
 */
export const useOfferTimer = (offer, onExpire = null) => {
  const [timeRemaining, setTimeRemaining] = useState(0);
  const intervalRef = useRef(null);
  
  // Memoizar la función onExpire para evitar re-renders innecesarios
  const memoizedOnExpire = useCallback(onExpire, []);
  
  useEffect(() => {
    if (!offer || !['pending', 'accepted'].includes(offer.status)) {
      setTimeRemaining(0);
      return;
    }
    
    // Calcular tiempo inicial
    const initialTime = calculateTimeRemaining(offer);
    setTimeRemaining(initialTime);
    
    // Si ya expiró, llamar callback inmediatamente
    if (initialTime <= 0 && memoizedOnExpire) {
      memoizedOnExpire(offer);
      return;
    }
    
    // Configurar interval
    intervalRef.current = setInterval(() => {
      const remaining = calculateTimeRemaining(offer);
      setTimeRemaining(remaining);
      
      // Si expira, llamar callback y limpiar
      if (remaining <= 0) {
        if (memoizedOnExpire) {
          memoizedOnExpire(offer);
        }
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }
    }, 1000);
    
    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [offer?.id, offer?.status, offer?.expires_at, offer?.purchase_deadline, memoizedOnExpire]);
  
  return timeRemaining;
};

/**
 * Hook para manejar múltiples timers de ofertas
 * @param {Array} offers - Array de ofertas
 * @param {Function} onOfferExpire - Callback cuando una oferta expira
 * @returns {Object} Mapa de ID de oferta a tiempo restante
 */
export const useMultipleOfferTimers = (offers, onOfferExpire = null) => {
  const [timers, setTimers] = useState({});
  const intervalRef = useRef(null);
  
  // Memoizar la función onOfferExpire para evitar re-renders innecesarios
  const memoizedOnOfferExpire = useCallback(onOfferExpire, []);
  
  useEffect(() => {
    if (!offers || offers.length === 0) {
      setTimers({});
      return;
    }
    
    // Filtrar solo ofertas activas
    const activeOffers = offers.filter(offer => 
      ['pending', 'accepted'].includes(offer.status)
    );
    
    if (activeOffers.length === 0) {
      setTimers({});
      return;
    }
    
    // Calcular tiempos iniciales
    const initialTimers = {};
    activeOffers.forEach(offer => {
      initialTimers[offer.id] = calculateTimeRemaining(offer);
    });
    setTimers(initialTimers);
    
    // Timer maestro para todas las ofertas
    intervalRef.current = setInterval(() => {
      const newTimers = {};
      let hasExpired = false;
      
      activeOffers.forEach(offer => {
        const remaining = calculateTimeRemaining(offer);
        newTimers[offer.id] = remaining;
        
        // Detectar expiración
        if (remaining <= 0 && initialTimers[offer.id] > 0) {
          hasExpired = true;
          if (memoizedOnOfferExpire) {
            memoizedOnOfferExpire(offer);
          }
        }
      });
      
      setTimers(newTimers);
      
      // Si todas expiraron, limpiar interval
      const allExpired = Object.values(newTimers).every(time => time <= 0);
      if (allExpired && intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }, 1000);
    
    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [offers?.length, memoizedOnOfferExpire]);
  
  return timers;
};

/**
 * Hook para formatear tiempo de manera reactiva
 * @param {number} seconds - Segundos a formatear
 * @returns {string} Tiempo formateado
 */
export const useFormattedTime = (seconds) => {
  return formatTimeRemaining(seconds);
};
