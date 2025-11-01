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
// REGISTRO MUTABLE DE RUTAS → IMPORT DINÁMICO (permite desacoplar dominios)
// ============================================================================
// NOTA: Se removieron rutas de auth (/login y /crear-cuenta) para eliminar
// dependencia circular con el dominio auth. Esas rutas podrán re-registrarse
// más adelante desde un provider específico (AuthPrefetchProvider) sin que este
// hook conozca el dominio.
const ROUTE_COMPONENTS = new Map([
  ['/marketplace', () => import('../domains/marketplace/pages/Marketplace')],
  [
    '/buyer/marketplace',
    () => import('../domains/buyer/pages/MarketplaceBuyer'),
  ],
  ['/buyer/cart', () => import('../domains/buyer/pages/BuyerCart')],
  ['/buyer/orders', () => import('../domains/buyer/pages/BuyerOrders')],
  // BuyerPerformance was removed; prefetch MarketplaceBuyer instead to keep behavior
  [
    '/buyer/performance',
    () => import('../domains/buyer/pages/MarketplaceBuyer'),
  ],
  [
    '/supplier/home',
    () => import('../domains/supplier/pages/home/ProviderHome'),
  ],
  [
    '/supplier/myproducts',
    () => import('../workspaces/supplier/my-products/components/MyProducts'),
  ],
  [
    '/supplier/addproduct',
    () => import('../domains/supplier/pages/my-products/AddProduct'),
  ],
]);

export const registerPrefetchRoute = (routePath, importerFn) => {
  if (typeof routePath === 'string' && typeof importerFn === 'function') {
    ROUTE_COMPONENTS.set(routePath, importerFn);
  }
};

export const unregisterPrefetchRoute = routePath => {
  ROUTE_COMPONENTS.delete(routePath);
};

// ============================================================================
// RUTAS RELACIONADAS POR CONTEXTO
// ============================================================================
// Tabla mutable de rutas relacionadas
const RELATED_ROUTES = new Map([
  ['/', ['/marketplace']],
  ['/marketplace', ['/buyer/marketplace']],
  ['/buyer/marketplace', ['/buyer/cart', '/buyer/orders']],
  ['/buyer/cart', ['/buyer/orders', '/buyer/marketplace']],
  ['/buyer/orders', ['/buyer/marketplace', '/buyer/performance']],
  ['/buyer/performance', ['/buyer/marketplace', '/buyer/orders']],
  ['/supplier/home', ['/supplier/myproducts', '/supplier/addproduct']],
  ['/supplier/myproducts', ['/supplier/addproduct', '/supplier/home']],
  ['/supplier/addproduct', ['/supplier/myproducts', '/supplier/home']],
]);

export const registerRelatedRoutes = (baseRoute, relatedArray) => {
  if (typeof baseRoute === 'string' && Array.isArray(relatedArray)) {
    RELATED_ROUTES.set(baseRoute, relatedArray);
  }
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

    const importFunction = ROUTE_COMPONENTS.get(routePath);
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
    const relatedRoutes = RELATED_ROUTES.get(currentPath) || [];

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
