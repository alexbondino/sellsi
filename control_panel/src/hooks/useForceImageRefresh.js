/**
 * 🔧 HOOK: useForceImageRefresh
 * 
 * Hook que escucha eventos de invalidación de imágenes y fuerza
 * un refresh inmediato sin necesidad de F5 manual
 */

import { useEffect } from 'react';

export const useForceImageRefresh = (productId, onRefresh) => {
  useEffect(() => {
    if (!productId || !onRefresh) return;

    const handleForceRefresh = (event) => {
      const { productId: eventProductId, timestamp } = event.detail;
      
      // Solo refrescar si es el producto específico o si no se especifica producto (refresh global)
      if (eventProductId === productId || !eventProductId) {
        console.log(`🔄 [useForceImageRefresh] Force refresh for product: ${productId} at ${timestamp}`);
        onRefresh();
      }
    };

    // Escuchar el evento personalizado
    window.addEventListener('forceImageRefresh', handleForceRefresh);

    return () => {
      window.removeEventListener('forceImageRefresh', handleForceRefresh);
    };
  }, [productId, onRefresh]);
};

/**
 * 🔧 UTILITY: Manual force refresh
 * 
 * Función utilitaria para forzar refresh desde cualquier componente
 */
export const forceImageRefresh = (productId) => {
  window.dispatchEvent(new CustomEvent('forceImageRefresh', { 
    detail: { productId, timestamp: Date.now() }
  }));
};

/**
 * 🔧 UTILITY: Global force refresh
 * 
 * Fuerza refresh de todas las imágenes (usar con cuidado)
 */
export const forceGlobalImageRefresh = () => {
  window.dispatchEvent(new CustomEvent('forceImageRefresh', { 
    detail: { productId: null, timestamp: Date.now() }
  }));
};

export default useForceImageRefresh;
