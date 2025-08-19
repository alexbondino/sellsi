import React, { useEffect } from 'react';
import { useAuth } from '../providers/AuthProvider';
import { useRole } from '../providers/RoleProvider';
import { usePrefetch } from '../../hooks/usePrefetch';

/**
 * RolePrefetchProvider
 * Encapsula la lógica de prefetch basada en rol que antes vivía en useAppInitialization,
 * para mantener el hook libre de conocimiento de rutas específicas.
 */
export const RolePrefetchProvider = ({ children, buyerDelay = 1500, supplierDelay = 1500 }) => {
  const { session, loadingUserStatus } = useAuth();
  const { currentAppRole } = useRole();
  const { prefetchRoute } = usePrefetch();

  useEffect(() => {
    if (loadingUserStatus || !session || !currentAppRole) return;
    const buyerRoutes = ['/buyer/marketplace','/buyer/cart','/buyer/orders','/buyer/performance'];
    const supplierRoutes = ['/supplier/home','/supplier/myproducts','/supplier/addproduct','/supplier/my-orders'];
    const routes = currentAppRole === 'buyer' ? buyerRoutes : supplierRoutes;
    const delay = currentAppRole === 'buyer' ? buyerDelay : supplierDelay;
    const timer = setTimeout(() => routes.forEach(r => prefetchRoute(r)), delay);
    return () => clearTimeout(timer);
  }, [loadingUserStatus, session, currentAppRole, prefetchRoute, buyerDelay, supplierDelay]);

  return children;
};

export default RolePrefetchProvider;
