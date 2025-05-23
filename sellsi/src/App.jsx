import { Box } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import theme from './styles/theme';
import React, { useEffect, useState, useRef } from 'react';
import CssBaseline from '@mui/material/CssBaseline';
import TestSupabase from './services/test-supabase';
import BottomBar from './components/BottomBar';
import TopBar from './components/TopBar';
import Home from './pages/Home';

function App() {
  // Referencias para hacer scroll a las secciones
  const scrollTargets = useRef({});

  const handleScrollTo = sectionKey => {
    scrollTargets.current[sectionKey]?.current?.scrollIntoView({
      behavior: 'smooth',
    });
  };

  // ⚙️ Para pruebas backend (eliminar si no lo usas luego)
  const [mensaje, setMensaje] = useState('');
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

      {/* TopBar con scroll handler */}
      <TopBar onNavigate={handleScrollTo} />

      <Box
        sx={{
          width: '100vw',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          paddingTop: '64px', // espacio por barra fija
        }}
      >
        <Home scrollTargets={scrollTargets} />

        {/* Zona de pruebas */}
        <Box sx={{ flexGrow: 1, textAlign: 'center', py: 4 }}>
          <h1>This is sellsi</h1>
          <p>Respuesta del backend:</p>
          <pre>{mensaje}</pre>
          <TestSupabase />
        </Box>

        <BottomBar />
      </Box>
    </ThemeProvider>
  );
}

export default App;
