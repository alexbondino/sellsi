/**
 * ============================================================================
 * PREFETCH HOOK SIMPLIFICADO - Solo Auth y Role Prefetch
 * ============================================================================
 *
 * Versión simplificada que mantiene solo las funcionalidades esenciales:
 * - Auth prefetch (login/register)
 * - Role prefetch (supplier/buyer routes)
 *
 * ELIMINADO:
 * - Mapeo completo de rutas
 * - Hover prefetch
 * - Rutas relacionadas automáticas
 * - Estrategias idle/visible
 */

import { useEffect, useRef } from 'react';

// Solo las rutas críticas para auth y navegación por roles
const CRITICAL_ROUTES = new Map([
  ['/login', () => import('../workspaces/auth/login/components/Login')],
  [
    '/crear-cuenta',
    () => import('../workspaces/auth/register/components/Register'),
  ],
  ['/buyer/marketplace', () => import('../workspaces/marketplace')],
  [
    '/supplier/home',
    () => import('../workspaces/supplier/home/components/Home'),
  ],
]);

export const registerPrefetchRoute = (routePath, importerFn) => {
  if (typeof routePath === 'string' && typeof importerFn === 'function') {
    CRITICAL_ROUTES.set(routePath, importerFn);
  }
};

export const unregisterPrefetchRoute = routePath => {
  CRITICAL_ROUTES.delete(routePath);
};

/**
 * Hook simplificado para prefetching crítico
 */
export const usePrefetch = () => {
  const prefetchedRoutes = useRef(new Set());

  const prefetchRoute = routePath => {
    if (prefetchedRoutes.current.has(routePath)) {
      return;
    }

    const importFunction = CRITICAL_ROUTES.get(routePath);
    if (importFunction) {
      prefetchedRoutes.current.add(routePath);
      importFunction().catch(() => {
        // Remover de prefetched en caso de error para permitir reintento
        prefetchedRoutes.current.delete(routePath);
      });
    }
  };

  return {
    prefetchRoute,
    prefetchedRoutes: prefetchedRoutes.current,
  };
};

// Mantener compatibilidad para componentes existentes
export const usePrefetchOnHover = () => {
  return {
    onMouseEnter: () => {},
    onMouseLeave: () => {},
  };
};
