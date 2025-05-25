import React, { useEffect, useState, useRef } from 'react';
import { Box, CssBaseline } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import GlobalStyles from '@mui/material/GlobalStyles';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';

import theme from './styles/theme';
import TopBar from './components/TopBar';
import BottomBar from './components/BottomBar';
import Home from './pages/Home';
import ProviderHome from './pages/provider/ProviderHome';
import TestSupabase from './services/test-supabase';
import Marketplace from './pages/Marketplace';
import Login from './components/Login';
import Register from './components/Register';

// ✅ COMPONENTE interno para acceder a location y renderizar rutas
function AppContent({ mensaje }) {
  const location = useLocation();
  const scrollTargets = useRef({});

  const handleScrollTo = sectionKey => {
    scrollTargets.current[sectionKey]?.current?.scrollIntoView({
      behavior: 'smooth',
    });
  };

  const needsPadding = true;

  return (
    <>
      <TopBar onNavigate={handleScrollTo} />
      <Box
        sx={{
          width: '100%',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          pt: needsPadding ? '64px' : 0,
          overflowX: 'hidden',
        }}
      >
        <Routes>
          <Route path="/" element={<Home scrollTargets={scrollTargets} />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/crear-cuenta" element={<Register />} />
          <Route path="/supplier/home" element={<ProviderHome />} />
        </Routes>

        {/* Zona de pruebas backend */}
        {process.env.NODE_ENV === 'development' &&
          location.pathname === '/' && (
            <Box sx={{ flexGrow: 1, textAlign: 'center', py: 4 }}>
              <h1>This is Sellsi</h1>
              <p>Respuesta del backend:</p>
              <pre>{mensaje}</pre>
              <TestSupabase />
            </Box>
          )}

        <BottomBar />
      </Box>
    </>
  );
}

function App() {
  const [mensaje, setMensaje] = useState('');
  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  useEffect(() => {
    const fetchBackend = async () => {
      try {
        const res = await fetch(`${backendUrl}/`);
        const data = await res.json();
        setMensaje(JSON.stringify(data));
        console.log('✅ Backend conectado:', data);
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
          body: { overflowX: 'hidden', margin: 0 },
          '#root': { overflowX: 'hidden' },
        }}
      />
      <BrowserRouter>
        <AppContent mensaje={mensaje} />
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
