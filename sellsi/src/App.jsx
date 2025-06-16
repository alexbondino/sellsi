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
import PrivateRoute from './features/auth/PrivateRoute';
import { BannerProvider, useBanner } from './features/ui/BannerContext';
import Banner from './features/ui/Banner';
import { Toaster } from 'react-hot-toast';
import { supabase } from './services/supabase';
import MarketplaceTopBar from './features/layout/MarketplaceTopBar';
import { usePrefetch } from './hooks/usePrefetch';

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
  const [isBuyer, setIsBuyer] = useState(null);
  const [loadingUserType, setLoadingUserType] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const { prefetchRoute } = usePrefetch();

  useEffect(() => {
    let mounted = true;
    setLoadingUserType(true);
    setIsBuyer(null);
    setNeedsOnboarding(false);

    const checkUserStatus = async currentSession => {
      if (!currentSession || !currentSession.user) {
        if (mounted) {
          setIsBuyer(null);
          setNeedsOnboarding(false);
          setLoadingUserType(false);
        }
        return;
      }

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('user_nm, main_supplier')
        .eq('user_id', currentSession.user.id)
        .single();

      if (userError && mounted) {
        setNeedsOnboarding(true);
        setLoadingUserType(false);
        return;
      }

      if (mounted) {
        if (
          !userData ||
          userData.user_nm?.toLowerCase() === USER_NAME_STATUS.PENDING
        ) {
          setNeedsOnboarding(true);
          setIsBuyer(null);
        } else {
          setNeedsOnboarding(false);
          setIsBuyer(userData.main_supplier === false);
        }
        setLoadingUserType(false);
      }
    };

    supabase.auth.getSession().then(({ data }) => {
      if (mounted) {
        setSession(data.session);
        checkUserStatus(data.session);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        if (mounted) {
          setSession(newSession);
          checkUserStatus(newSession);
        }
      }
    );

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (session && needsOnboarding && location.pathname !== '/onboarding') {
      navigate('/onboarding', { replace: true });
    }
  }, [session, needsOnboarding, location.pathname, navigate]);

  useEffect(() => {
    if (!loadingUserType && session && isBuyer !== null && !needsOnboarding) {
      const neutralRoutes = ['/', '/login', '/crear-cuenta', '/onboarding'];
      if (neutralRoutes.includes(location.pathname)) {
        if (isBuyer) {
          navigate('/buyer/marketplace', { replace: true });
        } else {
          navigate('/supplier/home', { replace: true });
        }
      }
    }
  }, [
    loadingUserType,
    session,
    isBuyer,
    needsOnboarding,
    location.pathname,
    navigate,
  ]);

  useEffect(() => {
    if (!loadingUserType && session && isBuyer !== null) {
      setTimeout(() => {
        if (isBuyer) {
          prefetchRoute('/buyer/marketplace');
          prefetchRoute('/buyer/cart');
        } else {
          prefetchRoute('/supplier/home');
          prefetchRoute('/supplier/myproducts');
        }
      }, 1500);
    }
  }, [loadingUserType, session, isBuyer, prefetchRoute]);

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

  if (loadingUserType) {
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

  const showBottomBar = location.pathname !== '/supplier/home';

  return (
    <>
      {session && isBuyer === true && <MarketplaceTopBar />}
      {(!session || isBuyer !== true) && (
        <TopBar onNavigate={handleScrollTo} session={session} />
      )}

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
        <Suspense fallback={<SuspenseLoader />}>
          <Routes>
            <Route path="/" element={<Home scrollTargets={scrollTargets} />} />
            <Route path="/marketplace" element={<Marketplace />} />
            <Route path="/buyer/marketplace" element={<MarketplaceBuyer />} />
            <Route path="/buyer/orders" element={<BuyerOrders />} />
            <Route path="/buyer/performance" element={<BuyerPerformance />} />
            <Route path="/buyer/cart" element={<BuyerCart />} />
            <Route
              path="/technicalspecs/:productSlug"
              element={<TechnicalSpecs />}
            />
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
                <PrivateRoute requiredAccountType="proveedor">
                  <ProviderHome />
                </PrivateRoute>
              }
            />
            <Route
              path="/supplier/myproducts"
              element={
                <PrivateRoute requiredAccountType="proveedor">
                  <MyProducts />
                </PrivateRoute>
              }
            />
            <Route
              path="/supplier/addproduct"
              element={
                <PrivateRoute requiredAccountType="proveedor">
                  <AddProduct />
                </PrivateRoute>
              }
            />
          </Routes>
        </Suspense>
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
