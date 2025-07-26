import { useEffect, useRef } from 'react';
import { useAuth } from '../../infrastructure/providers/AuthProvider';
import { useRole } from '../../infrastructure/providers/RoleProvider';
import { usePrefetch } from '../../hooks/usePrefetch';
import useCartStore from '../stores/cart/cartStore';

export const useAppInitialization = () => {
  const { session, loadingUserStatus } = useAuth();
  const { currentAppRole } = useRole();
  const { prefetchRoute } = usePrefetch();
  const { initializeCartWithUser } = useCartStore();

  // Inicializar el carrito cuando el usuario se autentica
  useEffect(() => {
    if (session && session.user) {
      initializeCartWithUser(session.user.id);
    }
  }, [session, initializeCartWithUser]);

  // Prefetch de rutas para rendimiento
  useEffect(() => {
    if (!loadingUserStatus && session && currentAppRole) {
      setTimeout(() => {
        if (currentAppRole === 'buyer') {
          prefetchRoute('/buyer/marketplace');
          prefetchRoute('/buyer/cart');
          prefetchRoute('/buyer/orders');
          prefetchRoute('/buyer/performance');
        } else {
          prefetchRoute('/supplier/home');
          prefetchRoute('/supplier/myproducts');
          prefetchRoute('/supplier/addproduct');
          prefetchRoute('/supplier/my-orders');
        }
      }, 1500);
    }
  }, [loadingUserStatus, session, currentAppRole, prefetchRoute]);

  // Cierra modales al retroceder/avanzar en el navegador (popstate)
  useEffect(() => {
    const handlePopstate = () => {
      window.dispatchEvent(new CustomEvent('closeAllModals'));
    };
    window.addEventListener('popstate', handlePopstate);
    return () => window.removeEventListener('popstate', handlePopstate);
  }, []);

  return {
    isInitialized: !loadingUserStatus,
  };
};
