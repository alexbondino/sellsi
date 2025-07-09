import AuthCallback from './features/auth/AuthCallback';
import React, { useEffect, useState, useRef, Suspense } from 'react';
import { Box, CssBaseline, CircularProgress, Typography } from '@mui/material';
import Loader from './components/Loader';
import { ThemeProvider } from '@mui/material/styles';
import GlobalStyles from '@mui/material/GlobalStyles';
import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import WhatsAppWidget from './components/WhatsAppWidget';

import theme from './styles/theme'; // Asegúrate de que tu tema está correctamente configurado
import TopBar from './features/layout/TopBar';
import BottomBar from './features/layout/BottomBar';
import MobileBar from './features/layout/MobileBar';
import PrivateRoute from './features/auth/PrivateRoute';
import { BannerProvider, useBanner } from './features/ui/banner/BannerContext';
import Banner from './features/ui/banner/Banner';
import { Toaster } from 'react-hot-toast';
import { supabase } from './services/supabase';
import { usePrefetch } from './hooks/usePrefetch';
import useCartStore from './features/buyer/hooks/cartStore';

import SideBar from './features/layout/SideBar';
import { AdminLogin, AdminPanelTable } from './features/admin_panel';
import ScrollToTop from './features/ScrollToTop';

// ============================================================================
// 🚀 CODE SPLITTING: LAZY LOADING DE COMPONENTES POR RUTAS
// ============================================================================

// Landing Page (carga inmediata para primera impresión)
import Home from './features/landing_page/Home';

// 📦 RUTAS PRINCIPALES - LAZY LOADING
const MarketplaceBuyer = React.lazy(() =>
  import('./features/buyer/MarketplaceBuyer')
);
const Marketplace = React.lazy(() =>
  import('./features/marketplace/Marketplace')
);
const BuyerCart = React.lazy(() => import('./features/buyer/BuyerCart'));

// 📦 SUPPLIER DASHBOARD - LAZY LOADING
const ProviderHome = React.lazy(() =>
  import('./features/supplier/home/ProviderHome')
);
const MyProducts = React.lazy(() =>
  import('./features/supplier/my-products/MyProducts')
);
const AddProduct = React.lazy(() =>
  import('./features/supplier/my-products/AddProduct')
);
const MyOrdersPage = React.lazy(() =>
  import('./features/supplier/my-orders/MyOrdersPage')
);
const MarketplaceSupplier = React.lazy(() =>
  import('./features/supplier/MarketplaceSupplier.jsx')
);

// 📦 PROFILE PAGES - LAZY LOADING
const SupplierProfile = React.lazy(() =>
  import('./features/supplier/SupplierProfile')
);
const BuyerProfile = React.lazy(() =>
  import('./features/buyer/BuyerProfile')
);

// 📦 RUTAS SECUNDARIAS - LAZY LOADING
const BuyerOrders = React.lazy(() => import('./features/buyer/BuyerOrders'));
const BuyerPerformance = React.lazy(() =>
  import('./features/buyer/BuyerPerformance')
);
const TechnicalSpecs = React.lazy(() =>
  import('./features/marketplace/view_page/TechnicalSpecs')
);
const ProviderCatalog = React.lazy(() =>
  import('./features/marketplace/ProviderCatalog')
);
const ProductPageWrapper = React.lazy(() =>
  import('./features/marketplace/ProductPageView/ProductPageWrapper')
);

// 📦 AUTH & ONBOARDING - LAZY LOADING
const Login = React.lazy(() => import('./features/login/Login'));
const Register = React.lazy(() => import('./features/register/Register'));
const Onboarding = React.lazy(() => import('./features/onboarding/Onboarding'));

// 📦 ERROR PAGES - LAZY LOADING
const NotFound = React.lazy(() => import('./features/ui/NotFound'));

// ============================================================================
// 🎨 COMPONENTE DE LOADING UNIVERSAL PARA SUSPENSE
// ============================================================================
const SuspenseLoader = () => (
  <Box
    sx={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      bgcolor: 'background.default',
      zIndex: 1500,
    }}
  >
    <Loader />
  </Box>
);

// Constante para el estado pendiente del nombre de usuario
const USER_NAME_STATUS = {
  PENDING: 'pendiente',
};

// ============================================================================
// 📍 COMPONENTE DE CONTENIDO PRINCIPAL
// ============================================================================
function AppContent({ mensaje }) {
  const location = useLocation();
  const navigate = useNavigate();
  const scrollTargets = useRef({});
  const { bannerState, hideBanner } = useBanner();
  const [session, setSession] = useState(null);
  // DEBUG: Log session and !!session on every render
  // ...log eliminado...
  const [userProfile, setUserProfile] = useState(null);
  const [loadingUserStatus, setLoadingUserStatus] = useState(true);
  const { initializeCartWithUser, isBackendSynced } = useCartStore();
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const { prefetchRoute } = usePrefetch();
  // --- Persistencia de currentAppRole en localStorage ---
  // Inicializa desde localStorage si hay sesión activa
  const getInitialAppRole = () => {
    try {
      const storedRole = localStorage.getItem('currentAppRole');
      if (storedRole === 'supplier' || storedRole === 'buyer') {
        return storedRole;
      }
    } catch (e) {}
    return 'buyer';
  };
  const [currentAppRole, setCurrentAppRole] = useState(getInitialAppRole()); // 'buyer' o 'supplier'
  // Sincroniza el tipo de vista global para ProductPageWrapper
  window.currentAppRole = currentAppRole;
  const [isRoleSwitching, setIsRoleSwitching] = useState(false); // Flag para evitar glitch

  const SideBarWidth = '210px'; // Define aquí el ancho original de tu SideBar
  const [currentSideBarWidth, setCurrentSideBarWidth] = useState(SideBarWidth);
  const [sideBarCollapsed, setSideBarCollapsed] = useState(false);

  // Handler para cuando cambia el ancho de la sidebar
  const handleSideBarWidthChange = (newWidth, isCollapsed) => {
    setCurrentSideBarWidth(newWidth);
    setSideBarCollapsed(isCollapsed);
  };

  // Persistente entre renders
  const lastSessionIdRef = useRef(null);

  // Define las rutas para cada rol (para visibilidad de SideBar y redirecciones específicas)
  // Usamos un Set para búsquedas más eficientes.
  const buyerDashboardRoutes = new Set([
    '/buyer/marketplace',
    '/buyer/orders',
    '/buyer/performance',
    '/buyer/cart',
    '/buyer/profile',
    '/catalog', // Catálogo del proveedor accesible desde buyer
  ]);
  const supplierDashboardRoutes = new Set([
    '/supplier/home',
    '/supplier/myproducts',
    '/supplier/addproduct',
    '/supplier/my-orders',
    '/supplier/profile',
    '/supplier/marketplace', // <--- ¡Agregado para que el rol supplier se mantenga!
    '/catalog', // Catálogo del proveedor accesible desde supplier
  ]);
  const neutralRoutes = new Set([
    '/',
    '/marketplace',
    '/technicalspecs',
    '/login',
    '/crear-cuenta',
    '/onboarding',
  ]);

  useEffect(() => {
    let mounted = true;
    setLoadingUserStatus(true);
    setNeedsOnboarding(false);

    const checkUserAndFetchProfile = async currentSession => {
      if (!currentSession || !currentSession.user) {
        if (mounted) {
          setUserProfile(null);
          setNeedsOnboarding(false);
          setLoadingUserStatus(false);
          setCurrentAppRole('buyer');
          // Limpiar localStorage al cerrar sesión
          try { localStorage.removeItem('currentAppRole'); } catch (e) {}
          // Limpiar user_id global
          try { localStorage.removeItem('user_id'); } catch (e) {}
        }
        return;
      }
      // Siempre forzar la obtención del perfil tras SIGNED_IN
      lastSessionIdRef.current = currentSession.user.id;
      // Guardar user_id globalmente en localStorage
      try { localStorage.setItem('user_id', currentSession.user.id); } catch (e) {}
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('user_nm, main_supplier, logo_url')
        .eq('user_id', currentSession.user.id)
        .single();

      if (userError && mounted) {
        setNeedsOnboarding(true);
        setUserProfile(null);
        setLoadingUserStatus(false);
        setCurrentAppRole('buyer');
        try { localStorage.removeItem('currentAppRole'); } catch (e) {}
        // Limpiar user_id global
        try { localStorage.removeItem('user_id'); } catch (e) {}
        return;
      }
      if (mounted) {
        if (!userData || userData.user_nm?.toLowerCase() === USER_NAME_STATUS.PENDING) {
          setNeedsOnboarding(true);
          setUserProfile(null);
          setCurrentAppRole('buyer');
          try { localStorage.removeItem('currentAppRole'); } catch (e) {}
          // Limpiar user_id global
          try { localStorage.removeItem('user_id'); } catch (e) {}
        } else {
          setNeedsOnboarding(false);
          setUserProfile(userData);
          const backendRole = userData.main_supplier ? 'supplier' : 'buyer';
          // Si hay un valor en localStorage y sesión activa, úsalo, si no, usa el backend
          let roleToSet = backendRole;
          try {
            const storedRole = localStorage.getItem('currentAppRole');
            if (storedRole === 'supplier' || storedRole === 'buyer') {
              roleToSet = storedRole;
            }
          } catch (e) {}
          setCurrentAppRole(roleToSet);
        }
        setLoadingUserStatus(false);
      }
    };
    supabase.auth.getSession().then(({ data }) => {
      if (mounted) {
        setSession(data.session);
        checkUserAndFetchProfile(data.session);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        if (mounted) {
          if (event === 'SIGNED_IN') {
            setSession(newSession);
            // Guardar user_id globalmente en localStorage
            if (newSession?.user?.id) {
              try { localStorage.setItem('user_id', newSession.user.id); } catch (e) {}
            }
            // Forzar obtención del perfil incluso si el usuario ya estaba en sesión
            checkUserAndFetchProfile(newSession);
          } else if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
            // Limpiar localStorage de toda la sesión
            localStorage.removeItem('user_id');
            localStorage.removeItem('account_type');
            localStorage.removeItem('supplierid');
            localStorage.removeItem('sellerid');
            localStorage.removeItem('access_token');
            localStorage.removeItem('auth_token');
            // Limpiar el tipo de vista temporal
            try { localStorage.removeItem('currentAppRole'); } catch (e) {}
            setSession(newSession);
            checkUserAndFetchProfile(newSession);
          } else if (event === 'USER_UPDATED') {
            setSession(newSession);
            // Guardar user_id globalmente en localStorage
            if (newSession?.user?.id) {
              try { localStorage.setItem('user_id', newSession.user.id); } catch (e) {}
            }
          }
        }
      }
    );

    return () => {
      mounted = false;
      if (listener?.subscription) {
        listener.subscription.unsubscribe();
      }
    };
  }, []); // SOLO al montar

  // --- Estados derivados del perfil de usuario ---
  const isBuyer = currentAppRole === 'buyer';
  const logoUrl = userProfile ? userProfile.logo_url : null;

  // Solo actualiza el cache buster cuando cambia el logoUrl
  const [logoCacheBuster, setLogoCacheBuster] = useState(Date.now());
  useEffect(() => {
    setLogoCacheBuster(Date.now());
  }, [logoUrl]);

  useEffect(() => {
    // LOGS ELIMINADOS
  }, [userProfile, logoUrl]);

  // Redirección forzada a home tras logout SOLO si ya terminó la validación
  useEffect(() => {
    // Solo redirige a '/' si la ruta actual no es pública (incluye rutas que empiezan con /technicalspecs)
    if (
      !loadingUserStatus &&
      !session &&
      !(
        location.pathname === '/' ||
        location.pathname === '/marketplace' ||
        location.pathname === '/login' ||
        location.pathname === '/crear-cuenta' ||
        location.pathname === '/onboarding' ||
        location.pathname.startsWith('/technicalspecs')
      )
    ) {
      navigate('/', { replace: true });
    }
  }, [session, location.pathname, navigate, loadingUserStatus]);

  // Función para manejar el cambio de rol desde TopBar
  const handleRoleChangeFromTopBar = newRole => {
    setCurrentAppRole(newRole);
    // Persistir en localStorage mientras haya sesión
    try {
      if (session && session.user) {
        localStorage.setItem('currentAppRole', newRole);
      }
    } catch (e) {}
    setIsRoleSwitching(true); // Activar flag
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
      // Limpiar flag si la ruta ya corresponde al rol
      if (
        (currentAppRole === 'supplier' && location.pathname.startsWith('/supplier')) ||
        (currentAppRole === 'buyer' && location.pathname.startsWith('/buyer'))
      ) {
        setIsRoleSwitching(false);
      }
      return;
    }
    // --- NUEVO: Si hay override temporal (localStorage), no sobrescribir el rol ---
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
      // No forzar cambio de rol si hay override temporal
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
      if (
        newRole !== currentAppRole &&
        !neutralRoutes.has(currentPath)
      ) {
        setCurrentAppRole(newRole);
      }
    } else if (!session && currentAppRole !== 'buyer') {
      setCurrentAppRole('buyer');
    }
  }, [
    location.pathname,
    session,
    needsOnboarding,
    loadingUserStatus,
    userProfile,
    buyerDashboardRoutes,
    supplierDashboardRoutes,
    currentAppRole,
    neutralRoutes,
    isRoleSwitching,
  ]);

  // Redirigir a usuarios logueados de rutas neutrales a su dashboard preferido
  // basado en su perfil real.
  useEffect(() => {
    if (!loadingUserStatus && session && !needsOnboarding && userProfile) {
      if (neutralRoutes.has(location.pathname)) {
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
    userProfile, // Dependencia importante
    neutralRoutes,
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
  }, [session, needsOnboarding, location.pathname, navigate, neutralRoutes]);

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

  const handleScrollTo = refName => {
    const element = scrollTargets.current[refName]?.current;
    if (element) {
      const topBarHeight = 64; // Altura de tu TopBar
      const elementPosition =
        element.getBoundingClientRect().top + window.pageYOffset;
      const offsetPosition = elementPosition - topBarHeight;
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
    }
  };
  // Inicializar el carrito cuando el usuario se autentica
  useEffect(() => {
    if (session && session.user) {
      initializeCartWithUser(session.user.id);
    }
  }, [session, initializeCartWithUser]);
  // Función para refrescar el perfil del usuario (para usar después de actualizaciones)
  const refreshUserProfile = async () => {
    if (!session?.user?.id) return;
    
    try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('user_nm, main_supplier, logo_url')
        .eq('user_id', session.user.id)
        .single();

      if (userError) {
        console.error('❌ [APP] Error refreshing user profile:', userError.message);
        return;
      }

      if (userData) {
        setUserProfile(userData);
      }
    } catch (error) {
      console.error('❌ [APP] Error refreshing user profile:', error);
    }
  };
  // Loader global centrado SOLO para rutas privadas
  const isPublicRoute = location.pathname.startsWith('/technicalspecs') || location.pathname === '/' || location.pathname.startsWith('/marketplace') || location.pathname === '/login' || location.pathname === '/crear-cuenta';
  if (loadingUserStatus && !isPublicRoute) {
    return (
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.default',
          zIndex: 2000,
        }}
      >
        <Loader />
      </Box>
    );
  }

  // Determinar si la SideBar debe mostrarse.
  // La SideBar se muestra si hay una sesión, no se necesita onboarding,
  // y la ruta actual es una ruta de dashboard (ya sea de comprador o proveedor),
  // o si la ruta es una ficha técnica de producto.
  const isProductPageRoute =
    location.pathname.match(/^\/marketplace\/product\/[^/]+(\/[^/]+)?$/);

  const isDashboardRoute =
    session &&
    !needsOnboarding &&
    (
      Array.from(buyerDashboardRoutes).some(route =>
        location.pathname.startsWith(route)
      ) ||
      Array.from(supplierDashboardRoutes).some(route =>
        location.pathname.startsWith(route)
      ) ||
      isProductPageRoute
    );

  // La BottomBar se muestra en todas las rutas excepto en '/supplier/home' y '/onboarding'
  const showBottomBar = location.pathname !== '/supplier/home' && location.pathname !== '/onboarding';
  const topBarHeight = '64px'; // Consistente con la altura de TopBar

  return (
    <>
      <TopBar
        key={`${session?.user?.id || 'no-session'}-${logoUrl || 'default-topbar'}`}
        session={session}
        isBuyer={isBuyer}
        logoUrl={logoUrl ? `${logoUrl}?cb=${logoCacheBuster}` : null}
        onNavigate={handleScrollTo}
        onRoleChange={handleRoleChangeFromTopBar}
      />

      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          overflowX: 'hidden',
          bgcolor: 'background.default',
        }}
      >
        {/* Banner */}
        <Banner
          message={bannerState.message}
          severity={bannerState.severity}
          duration={bannerState.duration}
          show={bannerState.show}
          onClose={hideBanner}
        />

        {/* Contenedor principal para SideBar y Contenido (Main) */}
        <Box
          sx={{
            display: 'flex',
            flex: '1 0 auto', // Toma el espacio disponible
            mt: topBarHeight,
          }}
        >
          {isDashboardRoute && (
            // Pasamos el currentAppRole a la SideBar para que sepa qué menú mostrar
            <SideBar 
              role={currentAppRole} 
              width={SideBarWidth} 
              onWidthChange={handleSideBarWidthChange}
            />
          )}

          <Box
            component="main"
            sx={theme => ({
              flexGrow: 1,
              pl: isDashboardRoute ? 3 : 0,
              pr: isDashboardRoute ? 3 : 0,
              pt: isDashboardRoute ? 3 : 0,
              pb: isDashboardRoute ? { xs: session ? 10 : 3, md: 3 } : { xs: session ? 10 : 0, md: 0 },
              width: isDashboardRoute
                ? { xs: '100%', md: `calc(100% - ${currentSideBarWidth})` }
                : '100%',
              overflowX: 'hidden',
              ml: isDashboardRoute ? { md: 14, lg: 14, xl: 0 } : 0,
              // Animación robusta: solo en md y lg, nunca en xl
              transition: [
                theme.breakpoints.up('md') && theme.breakpoints.down('lg')
                  ? 'transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94), margin-left 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94), width 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
                  : 'margin-left 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94), width 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
              ].join(','),
              // Solo aplicar el shift animado en md y lg, nunca en xl
              transform: {
                xs: 'none',
                sm: 'none',
                md: isDashboardRoute && sideBarCollapsed ? 'translateX(-80px)' : 'none',
                lg: isDashboardRoute && sideBarCollapsed ? 'translateX(-80px)' : 'none',
                xl: 'none',
              },
            })}
          >
            <Suspense fallback={<SuspenseLoader />}>
              <Routes>
                {/* Rutas Públicas / Generales */}
                <Route
                  path="/"
                  element={<Home scrollTargets={scrollTargets} />}
                />
                <Route path="/marketplace" element={<Marketplace />} />
                <Route path="/marketplace/product/:id" element={<ProductPageWrapper isLoggedIn={!!session} />} />
                <Route path="/marketplace/product/:id/:slug" element={<ProductPageWrapper isLoggedIn={!!session} />} />
                {/* TechnicalSpecs puede ser accedido sin iniciar sesión, si es contenido común */}
                <Route
                  path="/technicalspecs/:productSlug"
                  element={<TechnicalSpecs isLoggedIn={!!session} />}
                />
                <Route path="/login" element={<Login />} />
                <Route path="/crear-cuenta" element={<Register />} />

                {/* RUTAS ADMINISTRATIVAS - ACCESO VISUAL PARA TESTING */}
                <Route path="/admin-login" element={<AdminLogin />} />
                <Route path="/admin-panel/dashboard" element={<AdminPanelTable />} />

                {/* Ruta para testing de 404 (solo desarrollo) */}
                <Route path="/404" element={<NotFound />} />

            {/* Ruta de callback de autenticación Supabase */}
            <Route path="/auth/callback" element={<AuthCallback />} />

                {/* Todas estas rutas están ahora protegidas SÓLO por autenticación y onboarding */}
                <Route
                  path="/onboarding"
                  element={
                    <PrivateRoute
                      isAuthenticated={!!session}
                      needsOnboarding={needsOnboarding}
                      loading={loadingUserStatus}
                      redirectTo="/"
                    >
                      <Onboarding />
                    </PrivateRoute>
                  }
                />

                {/* RUTAS DEL DASHBOARD DEL COMPRADOR - Ahora protegidas por PrivateRoute */}
                <Route
                  path="/buyer/marketplace"
                  element={
                    <PrivateRoute
                      isAuthenticated={!!session}
                      needsOnboarding={needsOnboarding}
                      loading={loadingUserStatus}
                      redirectTo="/"
                    >
                      <MarketplaceBuyer />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/buyer/orders"
                  element={
                    <PrivateRoute
                      isAuthenticated={!!session}
                      needsOnboarding={needsOnboarding}
                      loading={loadingUserStatus}
                      redirectTo="/"
                    >
                      <BuyerOrders />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/buyer/performance"
                  element={
                    <PrivateRoute
                      isAuthenticated={!!session}
                      needsOnboarding={needsOnboarding}
                      loading={loadingUserStatus}
                      redirectTo="/"
                    >
                      <BuyerPerformance />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/buyer/cart"
                  element={
                    <PrivateRoute
                      isAuthenticated={!!session}
                      needsOnboarding={needsOnboarding}
                      loading={loadingUserStatus}
                      redirectTo="/"
                    >
                      <BuyerCart />
                    </PrivateRoute>
                  }
                />

                {/* RUTA DEL CATÁLOGO DEL PROVEEDOR - Protegida por PrivateRoute */}
                <Route
                  path="/catalog/:userNm/:userId"
                  element={
                    <PrivateRoute
                      isAuthenticated={!!session}
                      needsOnboarding={needsOnboarding}
                      loading={loadingUserStatus}
                      redirectTo="/"
                    >
                      <ProviderCatalog />
                    </PrivateRoute>
                  }
                />

                {/* RUTAS DEL DASHBOARD DEL PROVEEDOR - Ya protegidas por PrivateRoute */}
                <Route
                  path="/supplier/home"
                  element={
                    <PrivateRoute
                      isAuthenticated={!!session}
                      needsOnboarding={needsOnboarding}
                      loading={loadingUserStatus}
                      redirectTo="/"
                    >
                      <ProviderHome />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/supplier/myproducts"
                  element={
                    <PrivateRoute
                      isAuthenticated={!!session}
                      needsOnboarding={needsOnboarding}
                      loading={loadingUserStatus}
                      redirectTo="/"
                    >
                      <MyProducts />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/supplier/addproduct"
                  element={
                    <PrivateRoute
                      isAuthenticated={!!session}
                      needsOnboarding={needsOnboarding}
                      loading={loadingUserStatus}
                      redirectTo="/"
                    >
                      <AddProduct />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/supplier/my-orders"
                  element={
                    <PrivateRoute
                      isAuthenticated={!!session}
                      needsOnboarding={needsOnboarding}
                      loading={loadingUserStatus}
                      redirectTo="/"
                    >
                      <MyOrdersPage />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/supplier/profile"
                  element={
                    <PrivateRoute
                      isAuthenticated={!!session}
                      needsOnboarding={needsOnboarding}
                      loading={loadingUserStatus}
                      redirectTo="/"
                    >
                      <SupplierProfile onProfileUpdated={refreshUserProfile} />
                    </PrivateRoute>
                  }
                />
                {/* Marketplace para el proveedor: igual que el del comprador pero con SideBar de proveedor */}
                <Route
                  path="/supplier/marketplace"
                  element={
                    <PrivateRoute
                      isAuthenticated={!!session}
                      needsOnboarding={needsOnboarding}
                      loading={loadingUserStatus}
                      redirectTo="/"
                    >
                      <MarketplaceSupplier />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/buyer/profile"
                  element={
                    <PrivateRoute
                      isAuthenticated={!!session}
                      needsOnboarding={needsOnboarding}
                      loading={loadingUserStatus}
                      redirectTo="/"
                    >
                      <BuyerProfile onProfileUpdated={refreshUserProfile} />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/supplier/myproducts/product/:productSlug"
                  element={
                    <PrivateRoute
                      isAuthenticated={!!session}
                      needsOnboarding={needsOnboarding}
                      loading={loadingUserStatus}
                      redirectTo="/"
                    >
                      {/* Puedes reutilizar el mismo wrapper de ficha técnica o crear uno específico para supplier */}
                      <ProductPageWrapper isLoggedIn={!!session} />
                    </PrivateRoute>
                  }
                />
                {/* Ruta de fallback para rutas no encontradas */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </Box>
        </Box>
        
        {/* BottomBar - Flex shrink: 0 para que mantenga su tamaño */}
        {showBottomBar && (
          <Box sx={{ flexShrink: 0 }}>
            <BottomBar />
          </Box>
        )}

        {/* MobileBar - Solo se muestra en móviles cuando hay sesión */}
        <MobileBar 
          role={currentAppRole} 
          session={session}
          isBuyer={isBuyer}
          logoUrl={logoUrl ? `${logoUrl}?cb=${logoCacheBuster}` : null}
        />
      </Box>
    </>
  );
}

// ============================================================================
// 🚀 COMPONENTE RAÍZ DE LA APLICACIÓN
// ============================================================================
function App() {
  const [mensaje, setMensaje] = useState('Cargando...');
  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  // Basic backend health check (optional, can be removed if not needed)
  useEffect(() => {
    // ✅ COMENTADO: Backend health check para evitar errores CORS
    // Si tu backend no está listo, esto puede ser un problema.
    // Considera remover o mejorar esta verificación en producción.
    /*
    if (backendUrl) {
      fetch(`${backendUrl}/`)
        .then(res => res.json())
        .then(data => setMensaje(JSON.stringify(data)))
        .catch(error => {
          console.error('❌ Error al conectar con backend:', error);
          setMensaje('No se pudo conectar con el backend.');
        });
    } else {
    */
    if (true) {
      setMensaje('Backend health check deshabilitado - usando Supabase');
    }
    // }
  }, []);  // Removed backendUrl dependency

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <GlobalStyles
        styles={{
          html: { overflowX: 'hidden' },
          body: { overflowX: 'hidden', margin: 0, scrollBehavior: 'smooth' },
          '#root': { overflowX: 'hidden', position: 'relative' },
        }}
      />
      <BannerProvider>
        <BrowserRouter>
          <ScrollToTop />
          <AppContent mensaje={mensaje} />
        </BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#333',
              color: '#fff',
              borderRadius: '8px',
              marginTop: '60px' // Mover los toasts más abajo del TopBar
            },
            success: { style: { background: '#4caf50' } },
            error: { style: { background: '#f44336' } },
          }}
        />
      </BannerProvider>
    </ThemeProvider>
  );
}


// Botón flotante de WhatsApp solo para desktop

// Botón flotante de WhatsApp solo para desktop y solo si hay sesión iniciada


function WhatsAppFAB({ isLoggedIn }) {
  // Componente deprecado - ahora se usa WhatsAppWidget
  return null;
}


// Wrapper para obtener el estado de sesión desde AppContent
function AppWithWhatsApp() {
  // Usamos un truco: renderizamos AppContent para obtener el estado de sesión
  // y pasamos la prop a WhatsAppFAB
  const [isLoggedIn, setIsLoggedIn] = React.useState(false);
  const [userProfile, setUserProfile] = React.useState(null);
  
  // Escuchamos cambios en localStorage para detectar login/logout
  React.useEffect(() => {
    function checkSession() {
      // Si hay un user_id en localStorage, consideramos que hay sesión
      setIsLoggedIn(!!localStorage.getItem('user_id'));
    }
    checkSession();
    window.addEventListener('storage', checkSession);
    return () => window.removeEventListener('storage', checkSession);
  }, []);


  // Obtener perfil completo del usuario para el widget
  React.useEffect(() => {
    const fetchProfile = async () => {
      if (isLoggedIn) {
        const userId = localStorage.getItem('user_id');
        if (!userId) { setUserProfile(null); return; }
        const { data, error } = await supabase
          .from('users')
          .select('user_id, user_nm')
          .eq('user_id', userId)
          .single();
        if (error || !data) {
          setUserProfile({ user_id: userId });
        } else {
          setUserProfile(data);
        }
      } else {
        setUserProfile(null);
      }
    };
    fetchProfile();
  }, [isLoggedIn]);

  return (
    <>
      <App />
      <WhatsAppWidget isLoggedIn={isLoggedIn} userProfile={userProfile} />
    </>
  );
}

export default AppWithWhatsApp;
