// 🛡️ SAFARI FIX: Polyfill para requestIdleCallback (debe ir PRIMERO antes que cualquier otro import)
import './lib/polyfills.js';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// Sentry deferred: removed direct import to keep SDK out of critical path
import { scheduleSentryInit, captureException } from './lib/sentryDeferred.js';

import App from './app/App.jsx';
import './index.css';

const CHUNK_RELOAD_KEY = '__sellsi_chunk_reload_done__';
let hasReloadedForChunkInMemory = false;

const isDynamicImportChunkError = reason => {
  const message =
    reason?.message || reason?.toString?.() || reason?.error?.message || '';
  const name = reason?.name || '';
  if (typeof message !== 'string') return false;

  const patterns = [
    'Failed to fetch dynamically imported module',
    'Importing a module script failed',
    'Loading chunk',
    'ChunkLoadError',
  ];

  return (
    patterns.some(pattern => message.includes(pattern)) ||
    name === 'ChunkLoadError'
  );
};

const handleStaleChunkReload = () => {
  let canReload = true;
  try {
    const alreadyReloaded = sessionStorage.getItem(CHUNK_RELOAD_KEY) === '1';
    if (alreadyReloaded) {
      sessionStorage.removeItem(CHUNK_RELOAD_KEY);
      canReload = false;
    } else {
      sessionStorage.setItem(CHUNK_RELOAD_KEY, '1');
    }
  } catch (_) {
    if (hasReloadedForChunkInMemory) {
      hasReloadedForChunkInMemory = false;
      canReload = false;
    } else {
      hasReloadedForChunkInMemory = true;
    }
  }
  if (canReload) {
    window.location.reload();
  }
};

window.addEventListener('vite:preloadError', event => {
  event.preventDefault();
  handleStaleChunkReload();
});

window.addEventListener('unhandledrejection', event => {
  if (!isDynamicImportChunkError(event?.reason)) return;
  event.preventDefault();
  handleStaleChunkReload();
});

window.addEventListener(
  'error',
  event => {
    const target = event?.target;
    const isAssetScriptError =
      target?.tagName === 'SCRIPT' &&
      typeof target?.src === 'string' &&
      target.src.includes('/assets/') &&
      target.src.endsWith('.js');

    if (!isAssetScriptError && !isDynamicImportChunkError(event?.error)) return;
    handleStaleChunkReload();
  },
  true
);

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
