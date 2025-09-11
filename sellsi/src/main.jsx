import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// Sentry deferred: removed direct import to keep SDK out of critical path
import { scheduleSentryInit, captureException } from './lib/sentryDeferred.js';

import App from './app/App.jsx';
import './index.css';

// 1. Programar inicialización diferida de Sentry (idle / first interaction)
scheduleSentryInit();

// 2. Renderizar la aplicación UNA SOLA VEZ
const container = document.getElementById('root');
const root = createRoot(container);

root.render(
  <StrictMode>
  <App />
  </StrictMode>
);

// 4. Cargar herramientas de emergencia solo en desarrollo
if (import.meta.env.DEV) {
  import('./utils/cartEmergencyTools.js');
}

// 5. 🚨 EXPORT CACHE SERVICES GLOBALLY FOR FORCE REFRESH
try {
  import('./services/thumbnailCacheService.js').then(module => {
    window.thumbnailCacheService = module.default;
  });
  import('./services/thumbnailInvalidationService.js').then(module => {
    window.thumbnailInvalidationService = module.default;
  });
} catch (e) {
  console.warn('⚠️ Could not export cache services globally:', e);
}

// Opcional: ejemplo de captura manual temprana (se eliminará si no se usa)
// captureException(new Error('Sentry deferred test (remove in prod)'));
