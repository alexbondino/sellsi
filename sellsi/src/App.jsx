import React, { useEffect, useState, useRef } from 'react';
import { Box, CssBaseline } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import theme from './styles/theme';
import GlobalStyles from '@mui/material/GlobalStyles';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';

import TestSupabase from './services/test-supabase';
import BottomBar from './components/BottomBar';
import TopBar from './components/TopBar';
import Home from './pages/Home';
import Marketplace from './pages/Marketplace.jsx';
import Login from './components/Login.jsx';
import CrearAcc from './components/Register.jsx';

// ✅ COMPONENTE interno para acceder a location
function AppContent({ mensaje }) {
  // ✅ RECIBIR mensaje como prop
  const location = useLocation();
  const scrollTargets = useRef({});

  const handleScrollTo = sectionKey => {
    scrollTargets.current[sectionKey]?.current?.scrollIntoView({
      behavior: 'smooth',
    });
  };

  // ✅ DETERMINAR si necesitamos padding-top
  const needsPadding = location.pathname === '/'; // Solo Home necesita padding

  return (
    <>
      {/* Barra superior con scroll dinámico */}
      <TopBar onNavigate={handleScrollTo} />

      <Box
        sx={{
          width: '100%',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          pt: needsPadding ? '64px' : 0, // ✅ CONDICIONAL: padding solo para Home
          overflowX: 'hidden',
        }}
      >
        {/* Rutas con convención web estándar */}
        <Routes>
          <Route path="/" element={<Home scrollTargets={scrollTargets} />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/crear-cuenta" element={<CrearAcc />} />
        </Routes>

        {/* Zona de pruebas backend - solo en desarrollo y solo en Home */}
        {process.env.NODE_ENV === 'development' &&
          location.pathname === '/' && (
            <Box sx={{ flexGrow: 1, textAlign: 'center', py: 4 }}>
              <h1>This is Sellsi</h1>
              <p>Respuesta del backend:</p>
              <pre>{mensaje}</pre> {/* ✅ USAR la prop mensaje */}
              <TestSupabase />
            </Box>
          )}

        {/* BottomBar */}
        <BottomBar />
      </Box>
    </>
  );
}

function App() {
  // ⚙️ Backend testing
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
          body: { overflowX: 'hidden' },
          '#root': { overflowX: 'hidden' },
        }}
      />
      <BrowserRouter>
        <AppContent mensaje={mensaje} /> {/* ✅ PASAR mensaje como prop */}
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
