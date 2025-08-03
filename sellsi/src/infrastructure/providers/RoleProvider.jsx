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
    // '/buyer/cart', // ✅ MOVIDO A neutralRoutes
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
    '/buyer/cart', // ✅ AGREGADO: Carrito accesible para ambos roles
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
  const isCartRoute = location.pathname.startsWith('/buyer/cart'); // ✅ NUEVO: Incluir carrito para mostrar sidebar
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
    
    // Solo navegar si no se especifica skipNavigation
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

  // ✅ NUEVO: Protección de rutas - redirigir si el usuario intenta acceder a rutas que no coinciden con su rol actual
  useEffect(() => {
    if (!session || needsOnboarding || loadingUserStatus || !userProfile || !currentAppRole || isRoleSwitching) {
      return;
    }

    const currentPath = location.pathname;
    
    // ✅ DEBUG: Log para verificar la ruta actual
    console.log('🔍 Route protection check:', { currentPath, currentAppRole });
    
    // ✅ PRIMERO: Verificar si es una ruta neutral (incluyendo cart)
    const isNeutralRoute = Array.from(neutralRoutes).some(route => {
      // ✅ FIX: Comparación exacta para ruta raíz, startsWith para otras
      if (route === '/') {
        return currentPath === '/';
      }
      const isMatch = currentPath === route || currentPath.startsWith(route + '/') || currentPath.startsWith(route + '?');
      if (isMatch) {
        console.log('✅ Neutral route detected:', route, 'for path:', currentPath);
      }
      return isMatch;
    });
    
    if (isNeutralRoute) {
      console.log('✅ Skipping protection for neutral route:', currentPath);
      return; // No redirigir rutas neutrales
    }
    
    // Determinar si está en una ruta de supplier o buyer (DESPUÉS de verificar rutas neutrales)
    const isOnSupplierRoute = Array.from(supplierDashboardRoutes).some(route =>
      currentPath.startsWith(route)
    );
    const isOnBuyerRoute = Array.from(buyerDashboardRoutes).some(route =>
      currentPath.startsWith(route) && !neutralRoutes.has(currentPath) // Excluir rutas neutrales
    );

    // Si tiene rol SUPPLIER pero está en ruta de BUYER → redirigir a supplier
    if (currentAppRole === 'supplier' && isOnBuyerRoute) {
      console.log('🔄 Supplier detected on buyer route, redirecting to supplier home');
      navigate('/supplier/home', { replace: true });
      return;
    }
    
    // Si tiene rol BUYER pero está en ruta de SUPPLIER → redirigir a buyer
    if (currentAppRole === 'buyer' && isOnSupplierRoute) {
      console.log('🔄 Buyer detected on supplier route, redirecting to buyer marketplace');
      navigate('/buyer/marketplace', { replace: true });
      return;
    }
  }, [
    session,
    needsOnboarding,
    loadingUserStatus,
    userProfile,
    currentAppRole,
    isRoleSwitching,
    location.pathname,
    navigate,
    supplierDashboardRoutes,
    buyerDashboardRoutes
  ]);

  // Redirigir a usuarios logueados de rutas neutrales a su dashboard preferido
  useEffect(() => {
    if (!loadingUserStatus && session && !needsOnboarding && userProfile) {
      if (neutralRoutes.has(location.pathname) && 
          location.pathname !== '/terms-and-conditions' && 
          location.pathname !== '/privacy-policy' &&
          location.pathname !== '/buyer/cart' && // ✅ EXCEPCIÓN: No redirigir desde cart
          !location.pathname.startsWith('/buyer/cart/')) { // ✅ EXCEPCIÓN: Incluir subrutas del cart
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
