import React, { createContext, useContext, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthProvider';

const RoleContext = createContext();

export const useRole = () => {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
};

export const RoleProvider = ({ children }) => {
  const { session, userProfile, needsOnboarding, loadingUserStatus } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // --- Persistencia de currentAppRole en localStorage ---
  const getInitialAppRole = () => {
    try {
      const storedRole = localStorage.getItem('currentAppRole');
      if (storedRole === 'supplier' || storedRole === 'buyer') {
        return storedRole;
      }
    } catch (e) {}
    return 'buyer';
  };

  const [currentAppRole, setCurrentAppRole] = useState(getInitialAppRole());
  const [isRoleSwitching, setIsRoleSwitching] = useState(false);

  // Sincroniza el tipo de vista global para ProductPageWrapper
  window.currentAppRole = currentAppRole;

  // Define las rutas para cada rol
  const buyerDashboardRoutes = new Set([
    '/buyer/marketplace',
    '/buyer/orders',
    '/buyer/performance',
    '/buyer/cart',
    '/buyer/paymentmethod',
    '/buyer/profile',
    '/catalog',
    '/checkout/success',
    '/checkout/cancel',
  ]);

  const supplierDashboardRoutes = new Set([
    '/supplier/home',
    '/supplier/myproducts',
    '/supplier/addproduct',
    '/supplier/my-orders',
    '/supplier/profile',
    '/supplier/marketplace',
    '/catalog',
  ]);

  const neutralRoutes = new Set([
    '/',
    '/marketplace',
    '/technicalspecs',
    '/login',
    '/crear-cuenta',
    '/onboarding',
    '/terms-and-conditions',
    '/privacy-policy',
  ]);

  // Estados derivados
  const isBuyer = currentAppRole === 'buyer';

  // Determinar si la ruta es de dashboard
  const isProductPageRoute = location.pathname.match(/^\/marketplace\/product\/[^/]+(\/[^/]+)?$/);
  const isTermsOrPrivacyRoute = 
    location.pathname === '/terms-and-conditions' || 
    location.pathname === '/privacy-policy';

  const isDashboardRoute = session &&
    !needsOnboarding &&
    (
      Array.from(buyerDashboardRoutes).some(route =>
        location.pathname.startsWith(route)
      ) ||
      Array.from(supplierDashboardRoutes).some(route =>
        location.pathname.startsWith(route)
      ) ||
      isProductPageRoute ||
      isTermsOrPrivacyRoute
    );

  // Función para manejar el cambio de rol desde TopBar
  const handleRoleChange = (newRole) => {
    setCurrentAppRole(newRole);
    // Persistir en localStorage mientras haya sesión
    try {
      if (session && session.user) {
        localStorage.setItem('currentAppRole', newRole);
      }
    } catch (e) {}
    setIsRoleSwitching(true);
    if (newRole === 'supplier') {
      navigate('/supplier/home');
    } else {
      navigate('/buyer/marketplace');
    }
  };

  // Sincroniza el currentAppRole con la ruta actual
  useEffect(() => {
    if (isRoleSwitching) {
      // Si estamos en transición de rol, no forzar sincronización
      if (
        (currentAppRole === 'supplier' && location.pathname.startsWith('/supplier')) ||
        (currentAppRole === 'buyer' && location.pathname.startsWith('/buyer'))
      ) {
        setIsRoleSwitching(false);
      }
      return;
    }

    // Si hay override temporal (localStorage), no sobrescribir el rol
    let overrideRole = null;
    try {
      const storedRole = localStorage.getItem('currentAppRole');
      if (storedRole === 'supplier' || storedRole === 'buyer') {
        overrideRole = storedRole;
      }
    } catch (e) {}

    if (overrideRole) {
      if (currentAppRole !== overrideRole) {
        setCurrentAppRole(overrideRole);
      }
      return;
    }

    if (session && !needsOnboarding && !loadingUserStatus && userProfile) {
      const currentPath = location.pathname;
      let newRole = currentAppRole;
      
      if (
        Array.from(supplierDashboardRoutes).some(route =>
          currentPath.startsWith(route)
        )
      ) {
        newRole = 'supplier';
      } else if (
        Array.from(buyerDashboardRoutes).some(route =>
          currentPath.startsWith(route)
        )
      ) {
        newRole = 'buyer';
      } else {
        newRole = userProfile.main_supplier ? 'supplier' : 'buyer';
      }
      
      if (newRole !== currentAppRole && !neutralRoutes.has(currentPath)) {
        setCurrentAppRole(newRole);
      }
    } else if (!session && currentAppRole !== 'buyer') {
      setCurrentAppRole('buyer');
      // Limpiar localStorage al cerrar sesión
      try { 
        localStorage.removeItem('currentAppRole'); 
      } catch (e) {}
    }
  }, [
    location.pathname,
    session,
    needsOnboarding,
    loadingUserStatus,
    userProfile,
    currentAppRole,
    isRoleSwitching,
  ]);

  // Redirigir a usuarios logueados de rutas neutrales a su dashboard preferido
  useEffect(() => {
    if (!loadingUserStatus && session && !needsOnboarding && userProfile) {
      if (neutralRoutes.has(location.pathname) && 
          location.pathname !== '/terms-and-conditions' && 
          location.pathname !== '/privacy-policy') {
        const target = userProfile.main_supplier
          ? '/supplier/home'
          : '/buyer/marketplace';
        if (location.pathname !== target) {
          navigate(target, { replace: true });
        }
      }
    }
  }, [
    loadingUserStatus,
    session,
    needsOnboarding,
    location.pathname,
    navigate,
    userProfile,
  ]);

  // Redirigir automáticamente a onboarding si el usuario está autenticado, necesita onboarding y está en una ruta neutral
  useEffect(() => {
    if (
      session &&
      needsOnboarding &&
      location.pathname !== '/onboarding' &&
      (location.pathname === '/' || neutralRoutes.has(location.pathname))
    ) {
      navigate('/onboarding', { replace: true });
    }
  }, [session, needsOnboarding, location.pathname, navigate]);

  // Redirección forzada a home tras logout SOLO si ya terminó la validación
  useEffect(() => {
    if (
      !loadingUserStatus &&
      !session &&
      !(
        location.pathname === '/' ||
        location.pathname === '/marketplace' ||
        location.pathname === '/login' ||
        location.pathname === '/crear-cuenta' ||
        location.pathname === '/onboarding' ||
        location.pathname === '/terms-and-conditions' ||
        location.pathname === '/privacy-policy' ||
        location.pathname.startsWith('/technicalspecs')
      )
    ) {
      navigate('/', { replace: true });
    }
  }, [session, location.pathname, navigate, loadingUserStatus]);

  const value = {
    currentAppRole,
    isRoleSwitching,
    handleRoleChange,
    isDashboardRoute,
    isBuyer,
    buyerDashboardRoutes,
    supplierDashboardRoutes,
    neutralRoutes,
  };

  return (
    <RoleContext.Provider value={value}>
      {children}
    </RoleContext.Provider>
  );
};
