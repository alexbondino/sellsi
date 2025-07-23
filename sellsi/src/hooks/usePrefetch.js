/**
 * ============================================================================
 * PREFETCH HOOK - CARGA ANTICIPADA DE RUTAS PROBABLES
 * ============================================================================
 *
 * Hook personalizado para implementar prefetching inteligente de componentes lazy.
 * Anticipa las rutas que el usuario probablemente visitará basándose en:
 * - Hover sobre botones/links
 * - Rutas típicas de navegación
 * - Patrón de uso por tipo de usuario
 *
 * ESTRATEGIAS:
 * - Prefetch on hover (100-200ms delay)
 * - Prefetch de rutas relacionadas después de 2s en página
 * - Prefetch por tipo de usuario (buyer vs supplier)
 */

import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

// ============================================================================
// MAPEO DE RUTAS Y SUS COMPONENTES LAZY
// ============================================================================
const ROUTE_COMPONENTS = {
  '/marketplace': () => import('../features/marketplace/Marketplace'),
  '/buyer/marketplace': () => import('../features/buyer/MarketplaceBuyer'),
  '/buyer/cart': () => import('../features/buyer/BuyerCart'),
  '/buyer/orders': () => import('../features/buyer/BuyerOrders'),
  '/buyer/performance': () => import('../features/buyer/BuyerPerformance'),
  '/supplier/home': () => import('../domains/supplier/pages/home/ProviderHome'),
  '/supplier/myproducts': () =>
    import('../domains/supplier/pages/my-products/MyProducts'),
  '/supplier/addproduct': () =>
    import('../domains/supplier/pages/my-products/AddProduct'),
  '/login': () => import('../domains/auth').then(module => module.Login),
  '/crear-cuenta': () => import('../domains/auth').then(module => module.Register),
};

// ============================================================================
// RUTAS RELACIONADAS POR CONTEXTO
// ============================================================================
const RELATED_ROUTES = {
  '/': ['/marketplace', '/login', '/crear-cuenta'],
  '/marketplace': ['/login', '/buyer/marketplace'],
  '/buyer/marketplace': ['/buyer/cart', '/buyer/orders'],
  '/buyer/cart': ['/buyer/orders', '/buyer/marketplace'],
  '/buyer/orders': ['/buyer/marketplace', '/buyer/performance'],
  '/buyer/performance': ['/buyer/marketplace', '/buyer/orders'],
  '/supplier/home': ['/supplier/myproducts', '/supplier/addproduct'],
  '/supplier/myproducts': ['/supplier/addproduct', '/supplier/home'],
  '/supplier/addproduct': ['/supplier/myproducts', '/supplier/home'],
  '/login': ['/marketplace', '/buyer/marketplace'],
  '/crear-cuenta': ['/marketplace', '/buyer/marketplace'],
};

/**
 * Hook principal para manejar prefetching
 */
export const usePrefetch = () => {
  const location = useLocation();
  const prefetchedRoutes = useRef(new Set());
  const prefetchTimers = useRef(new Map());

  /**
   * Prefetch de un componente específico
   */
  const prefetchRoute = routePath => {
    if (prefetchedRoutes.current.has(routePath)) {
      return; // Ya está prefetched
    }

    const importFunction = ROUTE_COMPONENTS[routePath];
    if (importFunction) {
      // Marcar como prefetched antes de iniciar la importación
      prefetchedRoutes.current.add(routePath);

      importFunction()
        .then(() => {
          // [LOGS ELIMINADOS POR LIMPIEZA DE PRODUCCIÓN]
        })
        .catch(error => {
          // Si falla, remover de prefetched para reintentarlo
          prefetchedRoutes.current.delete(routePath);
          console.warn(`❌ Failed to prefetch ${routePath}:`, error);
        });
    }
  };

  /**
   * Prefetch con delay (para hover)
   */
  const prefetchWithDelay = (routePath, delay = 150) => {
    // Cancelar timer previo si existe
    if (prefetchTimers.current.has(routePath)) {
      clearTimeout(prefetchTimers.current.get(routePath));
    }

    const timer = setTimeout(() => {
      prefetchRoute(routePath);
      prefetchTimers.current.delete(routePath);
    }, delay);

    prefetchTimers.current.set(routePath, timer);
  };

  /**
   * Cancelar prefetch pendiente
   */
  const cancelPrefetch = routePath => {
    if (prefetchTimers.current.has(routePath)) {
      clearTimeout(prefetchTimers.current.get(routePath));
      prefetchTimers.current.delete(routePath);
    }
  };

  /**
   * Prefetch de rutas relacionadas a la actual
   */
  const prefetchRelatedRoutes = () => {
    const currentPath = location.pathname;
    const relatedRoutes = RELATED_ROUTES[currentPath] || [];

    // Delay para no interferir con la carga de la página actual
    setTimeout(() => {
      relatedRoutes.forEach(route => {
        prefetchRoute(route);
      });
    }, 2000);
  };

  // Prefetch automático de rutas relacionadas al cambiar de página
  useEffect(() => {
    prefetchRelatedRoutes();
  }, [location.pathname]);

  // Cleanup de timers al desmontar
  useEffect(() => {
    return () => {
      prefetchTimers.current.forEach(timer => clearTimeout(timer));
      prefetchTimers.current.clear();
    };
  }, []);

  return {
    prefetchRoute,
    prefetchWithDelay,
    cancelPrefetch,
    prefetchedRoutes: prefetchedRoutes.current,
  };
};

/**
 * Hook para prefetching en hover de elementos
 */
export const usePrefetchOnHover = routePath => {
  const { prefetchWithDelay, cancelPrefetch } = usePrefetch();

  const handleMouseEnter = () => {
    if (routePath) {
      prefetchWithDelay(routePath, 150);
    }
  };

  const handleMouseLeave = () => {
    if (routePath) {
      cancelPrefetch(routePath);
    }
  };

  return {
    onMouseEnter: handleMouseEnter,
    onMouseLeave: handleMouseLeave,
  };
};

export default usePrefetch;
