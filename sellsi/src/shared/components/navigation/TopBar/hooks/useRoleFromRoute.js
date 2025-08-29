// Fase 2: Hook para derivar rol a partir de ruta y prop isBuyer
// Extrae la lógica previa de getRoleFromCurrentRoute dentro de TopBar.
// Mantiene compatibilidad: si isRoleLoading true => retorna { currentRole: null }

import { useMemo } from 'react';

// Rutas específicas (podrían centralizarse luego en un map compartido)
const SUPPLIER_ROUTES = [
  '/supplier/home',
  '/supplier/myproducts',
  '/supplier/addproduct',
  '/supplier/my-orders',
  '/supplier/profile',
  '/supplier/marketplace',
];

const BUYER_ROUTES = [
  '/buyer/marketplace',
  '/buyer/orders',
  '/buyer/performance',
  '/buyer/cart',
  '/buyer/paymentmethod',
  '/buyer/profile',
];

export function useRoleFromRoute({ pathname, isBuyerProp, isRoleLoading }) {
  return useMemo(() => {
    if (isRoleLoading) return { currentRole: null };

    const matchSupplier = SUPPLIER_ROUTES.some(r => pathname.startsWith(r));
    if (matchSupplier) return { currentRole: 'supplier' };
    const matchBuyer = BUYER_ROUTES.some(r => pathname.startsWith(r));
    if (matchBuyer) return { currentRole: 'buyer' };
    return { currentRole: isBuyerProp ? 'buyer' : 'supplier' };
  }, [pathname, isBuyerProp, isRoleLoading]);
}
