import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider, CssBaseline, createTheme } from '@mui/material';
// Sentry deferred: removed direct import to keep SDK out of critical path
import { scheduleSentryInit, captureException } from './lib/sentryDeferred.js';

import App from './app/App.jsx';
import './index.css';

// 1. Programar inicialización diferida de Sentry (idle / first interaction)
scheduleSentryInit();

// 2. Crear el tema de MUI
const theme = createTheme({
  // Aquí puedes añadir personalizaciones a tu tema si quieres
});

// 3. Renderizar la aplicación UNA SOLA VEZ
const container = document.getElementById('root');
const root = createRoot(container);

root.render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline /> {/* Normaliza los estilos base */}
      <App />
    </ThemeProvider>
  </StrictMode>
);

// 4. Cargar herramientas de emergencia solo en desarrollo
if (import.meta.env.DEV) {
  import('./utils/cartEmergencyTools.js');
}

// Opcional: ejemplo de captura manual temprana (se eliminará si no se usa)
// captureException(new Error('Sentry deferred test (remove in prod)'));
