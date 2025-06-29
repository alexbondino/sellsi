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

import theme from './styles/theme'; // Asegúrate de que tu tema está correctamente configurado
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
  const SideBarWidth = '210px'; // Define aquí el ancho de tu SideBar

  // Define las rutas para cada rol (para visibilidad de SideBar y redirecciones específicas)
  // Usamos un Set para búsquedas más eficientes.
  const buyerDashboardRoutes = new Set([
    '/buyer/marketplace',
    '/buyer/orders',
    '/buyer/performance',
    '/buyer/cart',
    '/buyer/profile',
  ]);
  const supplierDashboardRoutes = new Set([
    '/supplier/home',
    '/supplier/myproducts',
    '/supplier/addproduct',
    '/supplier/my-orders',
    '/supplier/profile',
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
        setNeedsOnboarding(true); // Podría ser un error, o que el perfil no existe y necesita onboarding
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
          setCurrentAppRole('buyer'); // Asegura que si necesitan onboarding, el rol inicial no interfiera
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
      (event, newSession) => {
        if (mounted) {
          // Evitar recargas innecesarias durante cambios de contraseña
          // Solo recargar en eventos críticos como login/logout
          if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
            setSession(newSession);
            checkUserAndFetchProfile(newSession);
          } else if (event === 'USER_UPDATED') {
            // Para USER_UPDATED, solo actualizamos la sesión pero no recargamos el perfil completo
            setSession(newSession);
            console.log('🔄 [Auth] User updated, session refreshed without profile reload');
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
  }, [initializeCartWithUser, isBackendSynced]);

  // --- Estados derivados del perfil de usuario ---
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

  // Sincroniza el currentAppRole con la ruta actual
  useEffect(() => {
    if (session && !needsOnboarding && !loadingUserStatus && userProfile) {
      const currentPath = location.pathname;

      if (
        Array.from(supplierDashboardRoutes).some(route =>
          currentPath.startsWith(route)
        )
      ) {
        setCurrentAppRole('supplier');
      } else if (
        Array.from(buyerDashboardRoutes).some(route =>
          currentPath.startsWith(route)
        )
      ) {
        setCurrentAppRole('buyer');
      } else {
        // Si está en una ruta neutral, determina el rol basado en el perfil (estado inicial)
        // Esto asegura que el rol predeterminado correcto se establezca si aterrizan en una ruta pública
        // pero han iniciado sesión.
        setCurrentAppRole(userProfile.main_supplier ? 'supplier' : 'buyer');
      }
    } else if (!session) {
      // Si no ha iniciado sesión, siempre establece el rol a comprador (vista pública predeterminada)
      setCurrentAppRole('buyer');
    }
  }, [
    location.pathname,
    session,
    needsOnboarding,
    loadingUserStatus,
    userProfile, // Crucial para la configuración inicial del rol
    buyerDashboardRoutes,
    supplierDashboardRoutes,
  ]);

  // Redirigir a onboarding si es necesario
  useEffect(() => {
    if (session && needsOnboarding && location.pathname !== '/onboarding') {
      navigate('/onboarding', { replace: true });
    }
  }, [session, needsOnboarding, location.pathname, navigate]);

  // Redirigir a usuarios logueados de rutas neutrales a su dashboard preferido
  // basado en su perfil real.
  useEffect(() => {
    if (!loadingUserStatus && session && !needsOnboarding && userProfile) {
      if (neutralRoutes.has(location.pathname)) {
        if (userProfile.main_supplier) {
          // Verifica el rol real del perfil
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
    userProfile, // Dependencia importante
    neutralRoutes,
  ]);

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
  // La SideBar se muestra si hay una sesión, no se necesita onboarding,
  // y la ruta actual es una ruta de dashboard (ya sea de comprador o proveedor).
  const isDashboardRoute =
    session &&
    !needsOnboarding &&
    (Array.from(buyerDashboardRoutes).some(route =>
      location.pathname.startsWith(route)
    ) ||
      Array.from(supplierDashboardRoutes).some(route =>
        location.pathname.startsWith(route)
      ));

  // La BottomBar se muestra en todas las rutas excepto en '/supplier/home'
  const showBottomBar = location.pathname !== '/supplier/home';
  const topBarHeight = '64px'; // Consistente con la altura de TopBar

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
          // pt: '64px', // Eliminado de aquí, se gestiona en el `Box` principal que contiene SideBar y Main
          overflowX: 'hidden', // Evita el scroll horizontal en el layout general
          bgcolor: 'background.default',
        }}
      >
        {/* Contenedor principal para SideBar y Contenido (Main) */}
        <Box
          sx={{
            display: 'flex',
            flexGrow: 1,
            mt: topBarHeight, // El contenido principal comienza debajo de la TopBar
            minHeight: `calc(100vh - ${topBarHeight} - ${
              showBottomBar ? '56px' : '0px'
            })`,
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
              p: isDashboardRoute ? 3 : 0, // Añade padding solo si es una ruta de dashboard
              // La clave está aquí: `ml` es el margen izquierdo
              // Aplica `SideBarWidth` solo si la `SideBar` está visible (isDashboardRoute) y en desktop
              ml: isDashboardRoute ? { xs: 0, md: SideBarWidth } : 0,
              // Ajusta el ancho para ocupar el espacio restante
              width: isDashboardRoute
                ? { xs: '100%', md: `calc(100% - ${SideBarWidth})` }
                : '100%',
              overflowX: 'hidden', // Evita el scroll horizontal dentro del main content
            }}
          >
            <Suspense fallback={<SuspenseLoader />}>
              <Routes>
                {/* Rutas Públicas / Generales */}
                <Route
                  path="/"
                  element={<Home scrollTargets={scrollTargets} />}
                />
                <Route path="/marketplace" element={<Marketplace />} />
                <Route path="/marketplace/product/:id" element={<ProductPageWrapper />} />
                <Route path="/marketplace/product/:id/:slug" element={<ProductPageWrapper />} />
                {/* TechnicalSpecs puede ser accedido sin iniciar sesión, si es contenido común */}
                <Route
                  path="/technicalspecs/:productSlug"
                  element={<TechnicalSpecs />}
                />
                <Route path="/login" element={<Login />} />
                <Route path="/crear-cuenta" element={<Register />} />

                {/* Ruta para testing de 404 (solo desarrollo) */}
                <Route path="/404" element={<NotFound />} />

                {/* Todas estas rutas están ahora protegidas SÓLO por autenticación y onboarding */}
                <Route
                  path="/onboarding"
                  element={
                    <PrivateRoute>
                      <Onboarding />
                    </PrivateRoute>
                  }
                />

                {/* RUTAS DEL DASHBOARD DEL COMPRADOR - Ahora protegidas por PrivateRoute */}
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

                {/* RUTAS DEL DASHBOARD DEL PROVEEDOR - Ya protegidas por PrivateRoute */}
                <Route
                  path="/supplier/home"
                  element={
                    <PrivateRoute>
                      <ProviderHome />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/supplier/myproducts"
                  element={
                    <PrivateRoute>
                      <MyProducts />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/supplier/addproduct"
                  element={
                    <PrivateRoute>
                      <AddProduct />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/supplier/my-orders"
                  element={
                    <PrivateRoute>
                      <MyOrdersPage />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/supplier/profile"
                  element={
                    <PrivateRoute>
                      <SupplierProfile onProfileUpdated={refreshUserProfile} />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/buyer/profile"
                  element={
                    <PrivateRoute>
                      <BuyerProfile onProfileUpdated={refreshUserProfile} />
                    </PrivateRoute>
                  }
                />
                {/* Ruta de fallback para rutas no encontradas */}
                <Route path="*" element={<NotFound />} />
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

export default App;
