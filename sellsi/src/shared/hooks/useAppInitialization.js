import { useEffect, useRef } from 'react';
import { useAuth } from '../../infrastructure/providers';
import useCartStore from '../stores/cart/cartStore';

export const useAppInitialization = () => {
  const { session, loadingUserStatus } = useAuth();
  // Prefetch basado en rol movido a RolePrefetchProvider para desacoplar responsabilidades.
  const { initializeCartWithUser } = useCartStore();

  // Inicializar el carrito cuando el usuario se autentica
  useEffect(() => {
    if (session && session.user) {
      initializeCartWithUser(session.user.id);
    }
  }, [session, initializeCartWithUser]);

  // (Lógica de prefetch por rol eliminada; ver RolePrefetchProvider.)

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
