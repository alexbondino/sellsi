import { Box } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import theme from './styles/theme';
import React, { useEffect, useState } from 'react';
import CssBaseline from '@mui/material/CssBaseline';
import TestSupabase from './services/test-supabase';
import BottomBar from './components/BottomBar';
import TopBar from './components/TopBar';
import Home from './pages/Home';

function App() {
  /* Eliminar eventualmente desde aqui */
  const [mensaje, setMensaje] = useState('');
  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  useEffect(() => {
    const fetchBackend = async () => {
      try {
        const res = await fetch(`${backendUrl}/`); // o la ruta que tengas
        const data = await res.json(); // o .text() si no es JSON
        setMensaje(JSON.stringify(data)); // transforma a texto para mostrarlo
      } catch (error) {
        console.error('❌ Error al conectar con backend:', error);
        setMensaje('No se pudo conectar con el backend.');
      }
    };

    fetchBackend();
  }, [backendUrl]);

  /* Hasta aqui */
  return (
    <ThemeProvider theme={theme}>
      <TopBar />
      <Box
        sx={{
          width: '100vw',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        < Home />
        {/* Eliminar eventualmente desde aqui */}
        <Box sx={{ flexGrow: 1, textAlign: 'center', py: 4 }}>
          <h1>This is sellsi</h1>
          <p>Respuesta del backend:</p>
          <pre>{mensaje}</pre>
          <TestSupabase />
        </Box>
        {/* Hasta aqui */}

        <BottomBar />
      </Box>
    </ThemeProvider>
  );
}

export default App;
