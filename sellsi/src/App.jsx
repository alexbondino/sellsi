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
import { BannerProvider, useBanner } from './features/ui/banner/BannerContext';
import Banner from './features/ui/banner/Banner';
import { Toaster } from 'react-hot-toast';
import { supabase } from './services/supabase';
import { usePrefetch } from './hooks/usePrefetch';
import useCartStore from './features/buyer/hooks/cartStore';

import SideBar from './features/layout/SideBar';

// LAZY LOADING DE RUTAS...
import Home from './features/landing_page/Home';
const BuyerMarketplace = React.lazy(() =>
  import('./features/buyer/marketplace/BuyerMarketplace')
);
const Marketplace = React.lazy(() =>
  import('./features/marketplace/Marketplace')
);
const BuyerCart = React.lazy(() =>
  import('./features/buyer/my-cart/BuyerCart')
);
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
const BuyerRequests = React.lazy(() =>
  import('./features/buyer/my-requests/BuyerRequests')
);
const BuyerPerformance = React.lazy(() =>
  import('./features/buyer/my-performance/BuyerPerformance')
);
const TechnicalSpecs = React.lazy(() =>
  import('./features/marketplace/view_page/TechnicalSpecs')
);
const Login = React.lazy(() => import('./features/login/Login'));
const Register = React.lazy(() => import('./features/register/Register'));
const Onboarding = React.lazy(() => import('./features/onboarding/Onboarding'));

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

const USER_NAME_STATUS = { PENDING: 'pendiente' };

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
  const [currentAppRole, setCurrentAppRole] = useState('buyer');
  const SideBarWidth = '250px';

  const buyerDashboardRoutes = new Set([
    '/buyer/marketplace',
    '/buyer/orders',
    '/buyer/performance',
    '/buyer/cart',
  ]);
  const supplierDashboardRoutes = new Set([
    '/supplier/home',
    '/supplier/myproducts',
    '/supplier/addproduct',
    '/supplier/my-orders',
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
      if (listener?.subscription) listener.subscription.unsubscribe();
    };
  }, [initializeCartWithUser, isBackendSynced]);

  const isBuyer = currentAppRole === 'buyer';
  const logoUrl = userProfile ? userProfile.logo_url : null;

  const handleRoleChangeFromTopBar = newRole => {
    setCurrentAppRole(newRole);
    if (newRole === 'supplier') navigate('/supplier/home');
    else navigate('/buyer/marketplace');
  };

  useEffect(() => {
    // ... lógica de efectos ...
  }, [
    location.pathname,
    session,
    needsOnboarding,
    loadingUserStatus,
    userProfile,
    buyerDashboardRoutes,
    supplierDashboardRoutes,
  ]);

  useEffect(() => {
    if (session && needsOnboarding && location.pathname !== '/onboarding') {
      navigate('/onboarding', { replace: true });
    }
  }, [session, needsOnboarding, location.pathname, navigate]);

  // ... resto de la lógica y efectos ...

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
    (Array.from(buyerDashboardRoutes).some(route =>
      location.pathname.startsWith(route)
    ) ||
      Array.from(supplierDashboardRoutes).some(route =>
        location.pathname.startsWith(route)
      ));
  const showBottomBar = location.pathname !== '/'; // Ejemplo: no mostrar en landing
  const topBarHeight = '64px';

  return (
    <>
      <TopBar
        session={session}
        isBuyer={isBuyer}
        logoUrl={logoUrl}
        onNavigate={() => {}}
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
          overflowX: 'hidden',
          bgcolor: 'background.default',
        }}
      >
        <Box sx={{ display: 'flex', flexGrow: 1, mt: topBarHeight }}>
          {isDashboardRoute && (
            <SideBar role={currentAppRole} width={SideBarWidth} />
          )}
          <Box
            component="main"
            sx={{
              flexGrow: 1,
              // ✅ CORRECCIÓN APLICADA AQUÍ
              // Se cambió 'p' (padding en los 4 lados) por 'py' (padding vertical).
              py: isDashboardRoute ? 3 : 0,
              ml: isDashboardRoute ? { xs: 0, md: SideBarWidth } : 0,
              width: isDashboardRoute
                ? { xs: '100%', md: `calc(100% - ${SideBarWidth})` }
                : '100%',
              overflowX: 'hidden',
              pb: { xs: showBottomBar ? '56px' : 0, md: 0 },
            }}
          >
            <Suspense fallback={<SuspenseLoader />}>
              <Routes>
                {/* ... Tus Rutas ... */}
                <Route path="/" element={<Home />} />
                <Route
                  path="/buyer/marketplace"
                  element={<BuyerMarketplace />}
                />
                <Route path="/supplier/home" element={<ProviderHome />} />
                <Route
                  path="*"
                  element={
                    <Typography sx={{ p: 4 }}>
                      404 - Página no encontrada
                    </Typography>
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

function App() {
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
          <AppContent />
        </BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: { background: '#333', color: '#fff' },
          }}
        />
      </BannerProvider>
    </ThemeProvider>
  );
}

export default App;
