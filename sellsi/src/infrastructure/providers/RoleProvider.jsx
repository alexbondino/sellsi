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
    // ✅ MEJORA: No forzar 'buyer' por defecto, esperar a que se determine desde el perfil
    return null;
  };

  const [currentAppRole, setCurrentAppRole] = useState(getInitialAppRole());
  const [isRoleSwitching, setIsRoleSwitching] = useState(false);
  
  // ✅ NUEVO: Rastrear cambios en main_supplier para sincronización automática
  const [lastMainSupplier, setLastMainSupplier] = useState(userProfile?.main_supplier);

  // ✅ NUEVO: Determinar rol inicial desde el perfil del usuario cuando no hay localStorage
  useEffect(() => {
    if (currentAppRole === null && session && userProfile && !loadingUserStatus) {
      const initialRole = userProfile.main_supplier ? 'supplier' : 'buyer';
      setCurrentAppRole(initialRole);
      setLastMainSupplier(userProfile.main_supplier);
      // Guardar en localStorage para próximas sesiones
      try {
        localStorage.setItem('currentAppRole', initialRole);
      } catch (e) {}
    }
  }, [currentAppRole, session, userProfile, loadingUserStatus]);

  // ✅ NUEVO: Detectar cambios en main_supplier del perfil y sincronizar SOLO si no hay override manual
  useEffect(() => {
    if (userProfile && userProfile.main_supplier !== lastMainSupplier && session) {
      setLastMainSupplier(userProfile.main_supplier);
      
      const newRoleFromProfile = userProfile.main_supplier ? 'supplier' : 'buyer';
      
      // Solo actualizar si NO hay localStorage (es decir, primera vez o después de logout)
      const hasStoredRole = (() => {
        try {
          return localStorage.getItem('currentAppRole') !== null;
        } catch (e) {
          return false;
        }
      })();
      
      if (!hasStoredRole && currentAppRole !== newRoleFromProfile) {
        setCurrentAppRole(newRoleFromProfile);
        try {
          localStorage.setItem('currentAppRole', newRoleFromProfile);
        } catch (e) {}
      }
    }
  }, [userProfile?.main_supplier, lastMainSupplier, currentAppRole, session]);

  // Sincroniza el tipo de vista global para ProductPageWrapper
  window.currentAppRole = currentAppRole;

  // Define las rutas para cada rol
  const buyerDashboardRoutes = new Set([
    '/buyer/marketplace',
    '/buyer/orders',
    '/buyer/performance',
    '/buyer/cart', // ✅ VUELTO A BUYER ROUTES - cart ya no es neutral
    '/buyer/paymentmethod',
    '/buyer/profile',
    // '/catalog', // ✅ MOVIDO A neutralRoutes - debe ser accesible para ambos roles
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
    // '/catalog', // ✅ MOVIDO A neutralRoutes - debe ser accesible para ambos roles
  ]);

  const neutralRoutes = new Set([
    '/',
    '/marketplace',
    '/catalog', // ✅ AGREGADO: Catálogo accesible para ambos roles sin redirección
    '/technicalspecs',
    '/login',
    '/crear-cuenta',
    '/onboarding',
    '/terms-and-conditions',
    '/privacy-policy',
  ]);

  // Estados derivados
  const isBuyer = currentAppRole === 'buyer';
  
  // ✅ MEJORA: Manejar estado inicial mientras se determina el rol
  const isRoleLoading = currentAppRole === null && session && !loadingUserStatus;

  // Determinar si la ruta es de dashboard
  const isProductPageRoute = location.pathname.match(/^\/marketplace\/product\/[^/]+(\/[^/]+)?$/);
  const isCatalogRoute = location.pathname.startsWith('/catalog/');
  const isCartRoute = location.pathname.startsWith('/buyer/cart'); // ✅ CART: Mostrar sidebar en cart (ahora es ruta buyer)
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
      isCatalogRoute || // ✅ AGREGADO: Mostrar SideBar en rutas de catálogo
      isCartRoute || // ✅ NUEVO: Mostrar SideBar en rutas del carrito
      isTermsOrPrivacyRoute
    );

  // ✅ NUEVO: Redirigir a home inicial SOLO después del login
  const redirectToInitialHome = () => {
    if (userProfile) {
      const target = userProfile.main_supplier ? '/supplier/home' : '/buyer/marketplace';
      navigate(target, { replace: true });
    }
  };

  // ✅ MEJORA: Función para manejar el cambio de rol con opciones
  const handleRoleChange = (newRole, options = {}) => {
    const { skipNavigation = false } = options;
    
    setCurrentAppRole(newRole);
    // Persistir en localStorage mientras haya sesión
    try {
      if (session && session.user) {
        localStorage.setItem('currentAppRole', newRole);
      }
    } catch (e) {}
    
    // ✅ CAMBIO: Por defecto SÍ navegar (para cambios manuales del switch)
    // Solo NO navegar si se especifica explícitamente skipNavigation = true
    if (!skipNavigation) {
      setIsRoleSwitching(true);
      if (newRole === 'supplier') {
        navigate('/supplier/home');
      } else {
        navigate('/buyer/marketplace');
      }
    }
  };

  // ✅ NUEVO: Manejar transiciones manuales del switch
  useEffect(() => {
    if (isRoleSwitching) {
      // Si estamos en transición de rol, esperar a llegar a la ruta correcta
      if (
        (currentAppRole === 'supplier' && location.pathname.startsWith('/supplier')) ||
        (currentAppRole === 'buyer' && location.pathname.startsWith('/buyer'))
      ) {
        setIsRoleSwitching(false);
      }
    }
  }, [isRoleSwitching, currentAppRole, location.pathname]);

  // ✅ SIMPLIFICADO: Solo manejar usuarios no logueados
  useEffect(() => {
    if (!session) {
      if (currentAppRole !== 'buyer') {
        setCurrentAppRole('buyer'); // Default para usuarios no logueados
      }
      // Limpiar localStorage al cerrar sesión
      try { 
        localStorage.removeItem('currentAppRole'); 
      } catch (e) {}
    }
  }, [session, currentAppRole]);

  // ✅ ELIMINADO: Protección de rutas por conflicto de rol
  // Ahora permitimos que los usuarios accedan a cualquier ruta independientemente de su rol
  // El switch y el sidebar se adaptan automáticamente a la ruta actual

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
    isRoleLoading,
    handleRoleChange,
    redirectToInitialHome,
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
