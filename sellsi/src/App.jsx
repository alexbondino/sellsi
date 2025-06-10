import React, { useEffect, useState, useRef } from 'react';
import { Box, CssBaseline } from '@mui/material';
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
import Home from './features/landing_page/Home';
import ProviderHome from './features/supplier/home/ProviderHome';
import FichaTecnica from './pages/FichaTecnica';
import Marketplace from './features/marketplace/Marketplace';
import MarketplaceBuyer from './features/buyer/marketplace/MarketplaceBuyer';
import BuyerOrders from './pages/buyer/BuyerOrders';
import BuyerPerformance from './pages/buyer/BuyerPerformance';
import BuyerCart from './pages/buyer/BuyerCart';
import Login from './features/login/Login';
import Register from './features/register/Register';
import PrivateRoute from './auth/PrivateRoute';
import { BannerProvider, useBanner } from './contexts/BannerContext';
import { Banner } from './hooks/shared';
import { supabase } from './services/supabase';

// Contenido principal que depende de la ruta
function AppContent({ mensaje }) {
  const location = useLocation();
  const navigate = useNavigate();
  const scrollTargets = useRef({});
  const { bannerState, hideBanner } = useBanner();
  const handleScrollTo = refName => {
    const element = scrollTargets.current[refName]?.current;
    if (element) {
      const topBarHeight = 30;
      const elementPosition =
        element.getBoundingClientRect().top + window.pageYOffset;
      const offsetPosition = elementPosition - topBarHeight;
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    }
  };
  useEffect(() => {
    const checkSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error('❌ Error obteniendo la sesión:', error.message);
        return;
      }

      const session = data.session;
      const accountType = localStorage.getItem('account_type');

      if (session && location.pathname === '/') {
        if (accountType === 'proveedor') {
          navigate('/supplier/home', { replace: true });
        } else if (accountType === 'comprador') {
          navigate('/buyer/marketplace', { replace: true });
        } else {
          navigate('/supplier/home', { replace: true });
        }
      }
    };

    checkSession();
  }, [location.pathname, navigate]);

  useEffect(() => {
    const handlePopstate = () => {
      const event = new CustomEvent('closeAllModals');
      window.dispatchEvent(event);
    };

    window.addEventListener('popstate', handlePopstate);
    return () => {
      window.removeEventListener('popstate', handlePopstate);
    };
  }, []);

  const needsPadding = true;
  const showTopBar = true;
  const showBottomBar = location.pathname !== '/supplier/home';

  return (
    <>
      {showTopBar && <TopBar onNavigate={handleScrollTo} />}

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
          pt: needsPadding ? '64px' : 0,
          overflowX: 'hidden',
          bgcolor: 'background.default',
        }}
      >
        <Routes>
          <Route path="/" element={<Home scrollTargets={scrollTargets} />} />
          <Route path="/marketplace" element={<Marketplace />} />{' '}
          <Route path="/buyer/marketplace" element={<MarketplaceBuyer />} />
          <Route path="/buyer/orders" element={<BuyerOrders />} />
          <Route path="/buyer/performance" element={<BuyerPerformance />} />
          <Route path="/buyer/cart" element={<BuyerCart />} />
          <Route path="/fichatecnica/:productSlug" element={<FichaTecnica />} />
          <Route path="/login" element={<Login />} />
          <Route path="/crear-cuenta" element={<Register />} />
          <Route
            path="/supplier/home"
            element={
              <PrivateRoute requiredAccountType="proveedor">
                <ProviderHome />
              </PrivateRoute>
            }
          />
        </Routes>

        {process.env.NODE_ENV === 'development' &&
          location.pathname === '/' && (
            <Box sx={{ flexGrow: 1, textAlign: 'center', py: 4 }}>
              <h1>This is Sellsi</h1>
              <p>Respuesta del backend:</p>
              <pre>{mensaje}</pre>
            </Box>
          )}

        {showBottomBar && <BottomBar />}
      </Box>
    </>
  );
}

// Componente principal que monta el contenido y aplica estilos globales
function App() {
  const [mensaje, setMensaje] = useState('Cargando...');
  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  useEffect(() => {
    const fetchBackend = async () => {
      try {
        const res = await fetch(`${backendUrl}/`);
        const data = await res.json();
        setMensaje(JSON.stringify(data));
      } catch (error) {
        console.error('❌ Error al conectar con backend:', error);
        setMensaje('No se pudo conectar con el backend.');
      }
    };

    fetchBackend();
  }, [backendUrl]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <GlobalStyles
        styles={{
          html: { overflowX: 'hidden' },
          body: {
            overflowX: 'hidden',
            margin: 0,
            scrollBehavior: 'smooth',
          },
          '#root': {
            overflowX: 'hidden',
            position: 'relative',
          },
          '.MuiPopover-root': {
            '& .MuiBackdrop-root': {
              backgroundColor: 'transparent',
            },
          },
        }}
      />
      <BannerProvider>
        <BrowserRouter>
          <AppContent mensaje={mensaje} />
        </BrowserRouter>
      </BannerProvider>
    </ThemeProvider>
  );
}

export default App;
