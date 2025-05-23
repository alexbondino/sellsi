import React, { useEffect, useState, useRef } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Box, CssBaseline } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import GlobalStyles from '@mui/material/GlobalStyles';

import theme from './styles/theme';
import TopBar from './components/TopBar';
import BottomBar from './components/BottomBar';
import Home from './pages/Home';
import ProviderHome from './pages/provider/ProviderHome';
import TestSupabase from './services/test-supabase';

function App() {
  const scrollTargets = useRef({});
  const [mensaje, setMensaje] = useState('');
  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  const handleScrollTo = sectionKey => {
    scrollTargets.current[sectionKey]?.current?.scrollIntoView({
      behavior: 'smooth',
    });
  };

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
          body: { overflowX: 'hidden', margin: 0 },
          '#root': { overflowX: 'hidden' },
        }}
      />
      <BrowserRouter>
        <TopBar onNavigate={handleScrollTo} />

        <Box
          sx={{
            width: '100%',
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            pt: '64px',
            overflowX: 'hidden',
          }}
        >
          <Routes>
            <Route path="/" element={<Home scrollTargets={scrollTargets} />} />
            <Route path="/supplier/home" element={<ProviderHome />} />
          </Routes>

          <Box sx={{ flexGrow: 1, textAlign: 'center', py: 4 }}>
            <h1>This is Sellsi</h1>
            <p>Respuesta del backend:</p>
            <pre>{mensaje}</pre>
            <TestSupabase />
          </Box>

          <BottomBar />
        </Box>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
