import { useEffect } from 'react';
import { registerPrefetchRoute } from '../../hooks/usePrefetch';
import { useAuth } from '../providers/AuthProvider';

/**
 * AuthPrefetchProvider
 * Registra dinámicamente rutas de auth para prefetch sin que el hook base
 * conozca el dominio auth (evita ciclos). Colocar alto en el árbol (dentro de AppProviders).
 */
export const AuthPrefetchProvider = ({ children }) => {
  const { session, loadingUserStatus } = useAuth();

  useEffect(() => {
    // Esperar a que AuthProvider resuelva estado inicial para evitar carrera (session null transitorio)
    if (loadingUserStatus) return;
    // Solo registrar rutas de auth si finalmente NO hay sesión activa
    if (session) return;

    registerPrefetchRoute('/login', () => import('../../domains/auth').then(m => m.Login));
    registerPrefetchRoute('/crear-cuenta', () => import('../../domains/auth').then(m => m.Register));
  }, [loadingUserStatus, session]);

  return children;
};

export default AuthPrefetchProvider;
