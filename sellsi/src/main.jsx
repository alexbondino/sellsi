import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider, CssBaseline, createTheme } from '@mui/material';
import * as Sentry from '@sentry/react';

import App from './App.jsx';
import './index.css';

// 1. Inicializar Sentry (solo en producción y preview, como buena práctica)
// La condición 'import.meta.env.PROD' es verdadera tanto para 'production' como para 'preview' en Vercel.
if (import.meta.env.PROD) {
  Sentry.init({
    // CORRECCIÓN: Se utiliza la variable con prefijo VITE_ para que sea accesible en el navegador.
    dsn: import.meta.env.SENTRY_DSN,

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
