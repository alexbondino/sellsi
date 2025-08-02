import React, { useRef, useState, useEffect } from 'react';
import { Box } from '@mui/material';
import Loader from '../components/Loader';

import { AppProviders } from '../infrastructure/providers/AppProviders';
import { AppRouter } from '../infrastructure/router/AppRouter';
import { AppShell } from '../shared/components/layout/AppShell';
import { useAuth } from '../infrastructure/providers/AuthProvider';
import { useLocation } from 'react-router-dom';

// ============================================================================
// 📍 COMPONENTE DE CONTENIDO PRINCIPAL
// ============================================================================
function AppContent() {
  const location = useLocation();
  const scrollTargets = useRef({});
  const { session, loadingUserStatus } = useAuth();

  // Loader global centrado SOLO para rutas privadas
  const isPublicRoute =
    location.pathname.startsWith('/technicalspecs') ||
    location.pathname === '/' ||
    location.pathname.startsWith('/marketplace') ||
    location.pathname === '/login' ||
    location.pathname === '/crear-cuenta';

  if (loadingUserStatus && !isPublicRoute) {
    return (
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.default',
          zIndex: 2000,
        }}
      >
        <Loader />
        <KhipuButton />
      </Box>
    );
  }

  return (
    <AppShell>
      <AppRouter scrollTargets={scrollTargets} />
    </AppShell>
  );
}

// ============================================================================
// 🚀 COMPONENTE RAÍZ DE LA APLICACIÓN
// ============================================================================
function App() {
  const [mensaje, setMensaje] = useState('Cargando...');

  // Basic backend health check (optional, can be removed if not needed)
  useEffect(() => {
    // ✅ COMENTADO: Backend health check para evitar errores CORS
    // Si tu backend no está listo, esto puede ser un problema.
    // Considera remover o mejorar esta verificación en producción.
    setMensaje('Backend health check deshabilitado - usando Supabase');
  }, []);

  return (
    <AppProviders>
      <AppContent />
    </AppProviders>
  );
}

// Wrapper simplificado - la gestión del WhatsApp widget ahora está dentro de AppShell
function AppWithWhatsApp() {
  return <App />;
}

export default AppWithWhatsApp;
