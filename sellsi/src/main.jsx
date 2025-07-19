import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider, CssBaseline, createTheme } from '@mui/material';
import * as Sentry from '@sentry/react';

import App from './App.jsx';
import './index.css';

// 1. Inicializar Sentry (solo en producción, como buena práctica)
if (import.meta.env.PROD) {
  Sentry.init({
    dsn: 'https://a2bae70d1df327d55986a9391ca3040b@o4509693014900736.ingest.us.sentry.io/4509693017063424',
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration(),
    ],
    tracesSampleRate: 1.0,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  });
}

// 2. Crear el tema de MUI
const theme = createTheme({
  // Aquí puedes añadir personalizaciones a tu tema si quieres
});

// 3. Renderizar la aplicación UNA SOLA VEZ
const container = document.getElementById('root'); // Usamos el ID correcto
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
