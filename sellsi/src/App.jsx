import React, { useEffect, useState, useRef, Suspense } from 'react';
import { Box, CssBaseline, CircularProgress, Typography } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import GlobalStyles from '@mui/material/GlobalStyles';
import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
  useNavigate,
} from 'react-router-dom';

import theme from './styles/theme';
import TopBar from './features/layout/TopBar';
import BottomBar from './features/layout/BottomBar';
import PrivateRoute from './features/auth/PrivateRoute'; // Ensure this is the simplified PrivateRoute
import { BannerProvider, useBanner } from './features/ui/BannerContext';
import Banner from './features/ui/Banner';
import { Toaster } from 'react-hot-toast';
import { supabase } from './services/supabase';
import { usePrefetch } from './hooks/usePrefetch';
import useCartStore from './features/buyer/hooks/cartStore';

import SideBar from './features/layout/SideBar';

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
  import('./features/supplier/pages/MyProducts')
);
const AddProduct = React.lazy(() =>
  import('./features/supplier/pages/AddProduct')
);
const MyOrdersPage = React.lazy(() =>
  import('./features/supplier/pages/MyOrdersPage')
);

// 📦 RUTAS SECUNDARIAS - LAZY LOADING
const BuyerOrders = React.lazy(() => import('./features/buyer/BuyerOrders'));
const BuyerPerformance = React.lazy(() =>
  import('./features/buyer/BuyerPerformance')
);
const TechnicalSpecs = React.lazy(() =>
  import('./features/marketplace/view_page/TechnicalSpecs')
);

// 📦 AUTH & ONBOARDING - LAZY LOADING
const Login = React.lazy(() => import('./features/login/Login'));
const Register = React.lazy(() => import('./features/register/Register'));
const Onboarding = React.lazy(() => import('./features/onboarding/Onboarding'));

// ============================================================================
// 🎨 COMPONENTE DE LOADING UNIVERSAL PARA SUSPENSE
// ============================================================================
const SuspenseLoader = ({ message = 'Cargando...' }) => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      height: '50vh',
      gap: 2,
    }}
  >
    <CircularProgress size={40} />
    <Typography sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>
      {message}
    </Typography>
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
  const [userProfile, setUserProfile] = useState(null);
  const [loadingUserStatus, setLoadingUserStatus] = useState(true);
  const { initializeCartWithUser, isBackendSynced } = useCartStore();
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const { prefetchRoute } = usePrefetch();

  const [currentAppRole, setCurrentAppRole] = useState('buyer'); // 'buyer' o 'supplier'
  const SideBarWidth = '210px';

  // Define las rutas para cada rol (for SideBar visibility and specific redirects)
  const buyerRoutes = [
    '/buyer/marketplace',
    '/buyer/orders',
    '/buyer/performance',
    '/buyer/cart',
    // Removed '/technicalspecs' from here as it's not strictly a 'dashboard' route,
    // and can be accessed by anyone (logged in or not) based on its current placement in Routes.
    // If it *should* be buyer-only, wrap it in PrivateRoute without a specific role.
  ];
  const supplierRoutes = [
    '/supplier/home',
    '/supplier/myproducts',
    '/supplier/addproduct',
    '/supplier/myorders',
  ];
  const neutralRoutes = [
    '/',
    '/marketplace',
    '/technicalspecs', // Keeping it here as a general, public/common route
    '/login',
    '/crear-cuenta',
    '/onboarding',
  ];

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
          setCurrentAppRole('buyer'); // Por defecto para no logueados
        }
        return;
      }
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('user_nm, main_supplier, logo_url')
        .eq('user_id', currentSession.user.id)
        .single();

      if (userError && mounted) {
        console.error('Error fetching user profile:', userError.message);
        setNeedsOnboarding(true);
        setUserProfile(null);
        setLoadingUserStatus(false);
        setCurrentAppRole('buyer');
        return;
      }
      if (mounted) {
        if (
          !userData ||
          userData.user_nm?.toLowerCase() === USER_NAME_STATUS.PENDING
        ) {
          setNeedsOnboarding(true);
          setUserProfile(null);
          setCurrentAppRole('buyer');
        } else {
          setNeedsOnboarding(false);
          setUserProfile(userData);
          // Establece el rol inicial de la aplicación basado en userProfile.main_supplier
          setCurrentAppRole(userData.main_supplier ? 'supplier' : 'buyer');

          if (currentSession?.user?.id && !isBackendSynced) {
            try {
              await initializeCartWithUser(currentSession.user.id);
            } catch (error) {
              console.error('[App] ❌ Error inicializando carrito:', error);
            }
          }
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
      (_event, newSession) => {
        if (mounted) {
          setSession(newSession);
          checkUserAndFetchProfile(newSession);
        }
      }
    );

    return () => {
      mounted = false;
      if (listener?.subscription) {
        listener.subscription.unsubscribe();
      }
    };
  }, [initializeCartWithUser, isBackendSynced]);

  // --- Derived states from userProfile ---
  const isBuyer = currentAppRole === 'buyer';
  const logoUrl = userProfile ? userProfile.logo_url : null;

  // Función para manejar el cambio de rol desde TopBar
  const handleRoleChangeFromTopBar = newRole => {
    setCurrentAppRole(newRole);
    // Redirige al usuario al dashboard correspondiente cuando cambie el rol
    if (newRole === 'supplier') {
      navigate('/supplier/home');
    } else {
      navigate('/buyer/marketplace');
    }
  };

  // 🆕 Simplified useEffect to synchronize the currentAppRole with the route
  // Now, this mostly handles updating the visual `currentAppRole` state
  // based on the URL, assuming PrivateRoute handles authentication only.
  useEffect(() => {
    if (session && !needsOnboarding && !loadingUserStatus && userProfile) {
      const currentPath = location.pathname;

      if (supplierRoutes.some(route => currentPath.startsWith(route))) {
        setCurrentAppRole('supplier');
      } else if (buyerRoutes.some(route => currentPath.startsWith(route))) {
        setCurrentAppRole('buyer');
      } else {
        // If on a neutral route, determine role based on profile (initial state)
        // This ensures the correct default role is set if they land on a public route
        // but are logged in.
        setCurrentAppRole(userProfile.main_supplier ? 'supplier' : 'buyer');
      }
    } else if (!session) {
      // If not logged in, always set role to buyer (default public view)
      setCurrentAppRole('buyer');
    }
  }, [
    location.pathname,
    session,
    needsOnboarding,
    loadingUserStatus,
    userProfile, // Crucial for initial role setting
    buyerRoutes,
    supplierRoutes,
  ]);

  // Redirect to onboarding if needed
  useEffect(() => {
    if (session && needsOnboarding && location.pathname !== '/onboarding') {
      navigate('/onboarding', { replace: true });
    }
  }, [session, needsOnboarding, location.pathname, navigate]);

  // Redirect logged-in users from neutral routes to their *preferred* dashboard
  // based on their actual profile.
  useEffect(() => {
    if (!loadingUserStatus && session && !needsOnboarding && userProfile) {
      if (neutralRoutes.includes(location.pathname)) {
        if (userProfile.main_supplier) {
          // Check actual profile role
          navigate('/supplier/home', { replace: true });
        } else {
          navigate('/buyer/marketplace', { replace: true });
        }
      }
    }
  }, [
    loadingUserStatus,
    session,
    needsOnboarding,
    location.pathname,
    navigate,
    userProfile, // Important dependency
    neutralRoutes,
  ]);

  // Prefetch routes for performance
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
          prefetchRoute('/supplier/myorders');
        }
      }, 1500);
    }
  }, [loadingUserStatus, session, currentAppRole, prefetchRoute]);

  // Close modals on browser back/forward (popstate)
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
      const topBarHeight = 30; // Adjust if your actual top bar height is different
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

  if (loadingUserStatus) {
    return (
      <Box
        sx={{
          width: '100vw',
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.default',
        }}
      >
        <CircularProgress size={48} color="primary" />
      </Box>
    );
  }

  // Determinar si la SideBar debe mostrarse.
  const isDashboardRoute =
    session &&
    !needsOnboarding &&
    (buyerRoutes.some(route => location.pathname.startsWith(route)) ||
      supplierRoutes.some(route => location.pathname.startsWith(route)));

  const showBottomBar = location.pathname !== '/supplier/home';

  return (
    <>
      <TopBar
        session={session}
        isBuyer={isBuyer}
        logoUrl={logoUrl}
        onNavigate={handleScrollTo}
        onRoleChange={handleRoleChangeFromTopBar}
      />

      <Banner
        message={bannerState.message}
        severity={bannerState.severity}
        duration={bannerState.duration}
        show={bannerState.show}
        onClose={hideBanner}
      />

      <Box
        sx={{
          width: '100%',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          pt: '64px',
          overflowX: 'hidden',
          bgcolor: 'background.default',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexGrow: 1,
            minHeight: `calc(100vh - 64px - ${showBottomBar ? '56px' : '0px'})`,
          }}
        >
          {isDashboardRoute && (
            // Pasamos el currentAppRole a la SideBar para que sepa qué menú mostrar
            <SideBar role={currentAppRole} width={SideBarWidth} />
          )}

          <Box
            component="main"
            sx={{
              flexGrow: 1,
              p: isDashboardRoute ? 3 : 0,
              ml: isDashboardRoute ? { xs: 0, md: SideBarWidth } : 0,
              width: isDashboardRoute
                ? { xs: '100%', md: `calc(100% - ${SideBarWidth})` }
                : '100%',
              overflowX: 'hidden',
            }}
          >
            <Suspense fallback={<SuspenseLoader />}>
              <Routes>
                {/* Public / General Routes */}
                <Route
                  path="/"
                  element={<Home scrollTargets={scrollTargets} />}
                />
                <Route path="/marketplace" element={<Marketplace />} />
                {/* TechnicalSpecs can be accessed without login, if it's common content */}
                <Route
                  path="/technicalspecs/:productSlug"
                  element={<TechnicalSpecs />}
                />
                <Route path="/login" element={<Login />} />
                <Route path="/crear-cuenta" element={<Register />} />

                {/* All these routes are now protected ONLY by authentication and onboarding */}
                <Route
                  path="/onboarding"
                  element={
                    <PrivateRoute>
                      <Onboarding />
                    </PrivateRoute>
                  }
                />

                {/* BUYER DASHBOARD ROUTES - Now protected by PrivateRoute */}
                <Route
                  path="/buyer/marketplace"
                  element={
                    <PrivateRoute>
                      <MarketplaceBuyer />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/buyer/orders"
                  element={
                    <PrivateRoute>
                      <BuyerOrders />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/buyer/performance"
                  element={
                    <PrivateRoute>
                      <BuyerPerformance />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/buyer/cart"
                  element={
                    <PrivateRoute>
                      <BuyerCart />
                    </PrivateRoute>
                  }
                />

                {/* SUPPLIER DASHBOARD ROUTES - Already protected by PrivateRoute,
                    just removing the role prop as per the new PrivateRoute logic */}
                <Route
                  path="/supplier/home"
                  element={
                    <PrivateRoute>
                      {' '}
                      {/* Removed requiredAccountType="proveedor" */}
                      <ProviderHome />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/supplier/myproducts"
                  element={
                    <PrivateRoute>
                      {' '}
                      {/* Removed requiredAccountType="proveedor" */}
                      <MyProducts />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/supplier/addproduct"
                  element={
                    <PrivateRoute>
                      {' '}
                      {/* Removed requiredAccountType="proveedor" */}
                      <AddProduct />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/supplier/myorders"
                  element={
                    <PrivateRoute>
                      {' '}
                      {/* Removed requiredAccountType="proveedor" */}
                      <MyOrdersPage />
                    </PrivateRoute>
                  }
                />
              </Routes>
            </Suspense>
          </Box>
        </Box>
        {showBottomBar && <BottomBar />}
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
    fetch(`${backendUrl}/`)
      .then(res => res.json())
      .then(data => setMensaje(JSON.stringify(data)))
      .catch(error => {
        console.error('❌ Error al conectar con backend:', error);
        setMensaje('No se pudo conectar con el backend.');
      });
  }, [backendUrl]);

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
          <AppContent mensaje={mensaje} />
        </BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: { background: '#333', color: '#fff', borderRadius: '8px' },
            success: { style: { background: '#4caf50' } },
            error: { style: { background: '#f44336' } },
          }}
        />
      </BannerProvider>
    </ThemeProvider>
  );
}

export default App;
