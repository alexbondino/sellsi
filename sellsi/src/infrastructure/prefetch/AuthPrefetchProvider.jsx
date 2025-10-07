import { useEffect } from 'react';
import { registerPrefetchRoute, usePrefetch } from '../../hooks/usePrefetch';
import { useAuth } from '../providers';
import { Timer } from '../../workspaces/auth';

/**
 * AuthPrefetchProvider
 * Registra dinámicamente rutas de auth para prefetch sin que el hook base
 * conozca el dominio auth (evita ciclos). Colocar alto en el árbol (dentro de AppProviders).
 */
export const AuthPrefetchProvider = ({ children }) => {
  const { session, loadingUserStatus } = useAuth();
  const { prefetchRoute } = usePrefetch();

  useEffect(() => {
    // Esperar a que AuthProvider resuelva estado inicial para evitar carrera (session null transitorio)
    if (loadingUserStatus) return;
    // Solo registrar rutas de auth si finalmente NO hay sesión activa
    if (session) return;

    registerPrefetchRoute('/login', () =>
      import('../../domains/auth').then(m => m.Login)
    );
    registerPrefetchRoute('/crear-cuenta', () =>
      import('../../domains/auth').then(m => m.Register)
    );

    // Trigger prefetch for auth chunks. Use requestIdleCallback when available to avoid blocking.
    const doPrefetch = () => {
      try {
        prefetchRoute('/login');
        prefetchRoute('/crear-cuenta');
      } catch (e) {
        // ignore
      }
    };

    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      const id = window.requestIdleCallback(() => doPrefetch(), {
        timeout: 2000,
      });
      return () => window.cancelIdleCallback?.(id);
    }

    const t = setTimeout(doPrefetch, 50);
    return () => clearTimeout(t);
  }, [loadingUserStatus, session]);

  return children;
};

export default AuthPrefetchProvider;
