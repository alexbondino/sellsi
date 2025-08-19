import { useEffect } from 'react';
import { registerPrefetchRoute } from '../../hooks/usePrefetch';

/**
 * AuthPrefetchProvider
 * Registra dinámicamente rutas de auth para prefetch sin que el hook base
 * conozca el dominio auth (evita ciclos). Colocar alto en el árbol (dentro de AppProviders).
 */
export const AuthPrefetchProvider = ({ children }) => {
  useEffect(() => {
    // Registro lazy de Login y Register
    registerPrefetchRoute('/login', () => import('../../domains/auth').then(m => m.Login));
    registerPrefetchRoute('/crear-cuenta', () => import('../../domains/auth').then(m => m.Register));
  }, []);

  return children;
};

export default AuthPrefetchProvider;
