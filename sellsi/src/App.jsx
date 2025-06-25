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
import PrivateRoute from './features/auth/PrivateRoute'; // <-- Tu componente PrivateRoute
import { BannerProvider, useBanner } from './features/ui/BannerContext';
import Banner from './features/ui/Banner';
import { Toaster } from 'react-hot-toast';
import { supabase } from './services/supabase';
import { usePrefetch } from './hooks/usePrefetch';
import useCartStore from './features/buyer/hooks/cartStore';

import Sidebar from './features/layout/Sidebar'; // Asegúrate de que esta ruta sea correcta

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
  const sidebarWidth = '210px';

  // Define las rutas para cada rol (prefijos)
  const buyerRoutesPrefixes = [
    '/buyer/marketplace',
    '/buyer/orders',
    '/buyer/performance',
    '/buyer/cart',
    '/technicalspecs',
  ];
  const supplierRoutesPrefixes = [
    '/supplier/home',
    '/supplier/myproducts',
    '/supplier/addproduct',
    '/supplier/myorders',
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
          setCurrentAppRole('buyer');
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
  }, []);

  const isBuyer = currentAppRole === 'buyer';
  const logoUrl = userProfile ? userProfile.logo_url : null;

  const handleRoleChangeFromTopBar = newRole => {
    setCurrentAppRole(newRole);
    if (newRole === 'supplier') {
      navigate('/supplier/home');
    } else {
      navigate('/buyer/marketplace');
    }
  };

  useEffect(() => {
    if (session && !needsOnboarding && !loadingUserStatus) {
      const currentPath = location.pathname;
      let roleBasedOnPath = currentAppRole;

      if (buyerRoutesPrefixes.some(prefix => currentPath.startsWith(prefix))) {
        roleBasedOnPath = 'buyer';
      } else if (
        supplierRoutesPrefixes.some(prefix => currentPath.startsWith(prefix))
      ) {
        roleBasedOnPath = 'supplier';
      }

      if (roleBasedOnPath !== currentAppRole) {
        console.log(
          `[App] Sincronizando rol: Ruta '${currentPath}' sugiere '${roleBasedOnPath}', actualizando de '${currentAppRole}'`
        );
        setCurrentAppRole(roleBasedOnPath);
      }
    }
  }, [
    location.pathname,
    session,
    needsOnboarding,
    loadingUserStatus,
    currentAppRole,
    buyerRoutesPrefixes,
    supplierRoutesPrefixes,
  ]);

  useEffect(() => {
    if (session && needsOnboarding && location.pathname !== '/onboarding') {
      navigate('/onboarding', { replace: true });
    }
  }, [session, needsOnboarding, location.pathname, navigate]);

  useEffect(() => {
    if (!loadingUserStatus && session && !needsOnboarding) {
      const neutralRoutes = ['/', '/login', '/crear-cuenta', '/onboarding'];
      if (neutralRoutes.includes(location.pathname)) {
        if (currentAppRole === 'buyer') {
          navigate('/buyer/marketplace', { replace: true });
        } else {
          navigate('/supplier/home', { replace: true });
        }
      }
    }
  }, [
    loadingUserStatus,
    session,
    currentAppRole,
    needsOnboarding,
    location.pathname,
    navigate,
  ]);

  useEffect(() => {
    if (!loadingUserStatus && session && currentAppRole) {
      setTimeout(() => {
        if (currentAppRole === 'buyer') {
          prefetchRoute('/buyer/marketplace');
          prefetchRoute('/buyer/cart');
        } else {
          prefetchRoute('/supplier/home');
          prefetchRoute('/supplier/myproducts');
        }
      }, 1500);
    }
  }, [loadingUserStatus, session, currentAppRole, prefetchRoute]);

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
      const topBarHeight = 30;
      const elementPosition =
        element.getBoundingClientRect().top + window.pageYOffset;
      const offsetPosition = elementPosition - topBarHeight;
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    if (session) {
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

  const isDashboardRoute =
    session &&
    !needsOnboarding &&
    !['/', '/marketplace', '/login', '/crear-cuenta', '/onboarding'].includes(
      location.pathname
    );

  const showBottomBar = location.pathname !== '/supplier/home';

  return (
    <>
      <TopBar
        session={session}
        isBuyer={isBuyer} // isBuyer ahora es un derivado de currentAppRole
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
            <Sidebar role={currentAppRole} width={sidebarWidth} />
          )}

          <Box
            component="main"
            sx={{
              flexGrow: 1,
              p: isDashboardRoute ? 3 : 0,
              ml: isDashboardRoute ? { xs: 0, md: sidebarWidth } : 0,
              width: isDashboardRoute
                ? { xs: '100%', md: `calc(100% - ${sidebarWidth})` }
                : '100%',
              overflowX: 'hidden',
            }}
          >
            <Suspense fallback={<SuspenseLoader />}>
              <Routes>
                <Route
                  path="/"
                  element={<Home scrollTargets={scrollTargets} />}
                />
                <Route path="/marketplace" element={<Marketplace />} />

                {/* 🚀 RUTAS DE COMPRADOR PROTEGIDAS */}
                <Route
                  path="/buyer/marketplace"
                  element={
                    <PrivateRoute requiredAccountType="buyer">
                      {' '}
                      {/* Añadimos requiredAccountType */}
                      <MarketplaceBuyer />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/buyer/orders"
                  element={
                    <PrivateRoute requiredAccountType="buyer">
                      <BuyerOrders />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/buyer/performance"
                  element={
                    <PrivateRoute requiredAccountType="buyer">
                      <BuyerPerformance />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/buyer/cart"
                  element={
                    <PrivateRoute requiredAccountType="buyer">
                      <BuyerCart />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/technicalspecs/:productSlug"
                  element={
                    <PrivateRoute requiredAccountType="buyer">
                      <TechnicalSpecs />
                    </PrivateRoute>
                  }
                />
                {/* FIN RUTAS DE COMPRADOR PROTEGIDAS */}

                <Route path="/login" element={<Login />} />
                <Route path="/crear-cuenta" element={<Register />} />
                <Route
                  path="/onboarding"
                  element={
                    <PrivateRoute>
                      <Onboarding />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/supplier/home"
                  element={
                    <PrivateRoute requiredAccountType="supplier">
                      {' '}
                      {/* Usamos "supplier" o "proveedor" aquí? */}
                      <ProviderHome />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/supplier/myproducts"
                  element={
                    <PrivateRoute requiredAccountType="supplier">
                      <MyProducts />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/supplier/addproduct"
                  element={
                    <PrivateRoute requiredAccountType="supplier">
                      <AddProduct />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/supplier/myorders"
                  element={
                    <PrivateRoute requiredAccountType="supplier">
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
