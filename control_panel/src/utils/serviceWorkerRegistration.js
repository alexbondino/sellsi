/**
 * ============================================================================
 * SERVICE WORKER REGISTRATION & INTEGRATION
 * ============================================================================
 * 
 * Registro e integración del Service Worker con la aplicación React.
 * Incluye manejo de updates, notificaciones y métricas de cache.
 */

import toast from 'react-hot-toast';

const SW_URL = '/sw.js';
const UPDATE_CHECK_INTERVAL = 60 * 60 * 1000; // 1 hora

let registration = null;
let updateAvailable = false;

/**
 * Registrar Service Worker
 */
export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service Worker not supported');
    return false;
  }

  try {
    registration = await navigator.serviceWorker.register(SW_URL, {
      scope: '/',
      updateViaCache: 'none' // Always check for updates
    });

    console.log('✅ Service Worker registered successfully');

    // Setup update handling
    setupUpdateHandling(registration);
    
    // Setup periodic update checks
    setupPeriodicUpdateChecks(registration);
    
    // Setup cache metrics tracking
    setupCacheMetrics();

    return true;

  } catch (error) {
    console.error('❌ Service Worker registration failed:', error);
    return false;
  }
}

/**
 * Manejar actualizaciones del Service Worker
 */
function setupUpdateHandling(registration) {
  // Listen for waiting worker (update available)
  registration.addEventListener('updatefound', () => {
    const newWorker = registration.installing;
    
    newWorker.addEventListener('statechange', () => {
      switch (newWorker.state) {
        case 'installed':
          if (navigator.serviceWorker.controller) {
            // Update available
            updateAvailable = true;
            showUpdateNotification();
          } else {
            // First install
            console.log('🎉 Service Worker installed for the first time');
            showInstallNotification();
          }
          break;
        
        case 'activated':
          console.log('✅ Service Worker activated');
          window.location.reload();
          break;
      }
    });
  });

  // Listen for controller changes
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    console.log('🔄 Service Worker controller changed');
    if (updateAvailable) {
      window.location.reload();
    }
  });
}

/**
 * Verificaciones periódicas de actualizaciones
 */
function setupPeriodicUpdateChecks(registration) {
  setInterval(async () => {
    try {
      await registration.update();
      console.log('🔍 Checked for Service Worker updates');
    } catch (error) {
      console.error('Failed to check for updates:', error);
    }
  }, UPDATE_CHECK_INTERVAL);
}

/**
 * Mostrar notificación de actualización disponible
 */
function showUpdateNotification() {
  toast.custom(
    (t) => (
      <div className={`
        bg-blue-50 border border-blue-200 rounded-lg p-4 shadow-lg
        ${t.visible ? 'animate-enter' : 'animate-leave'}
      `}>
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium text-blue-800">
              Nueva versión disponible
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>Hay una nueva versión de Sellsi disponible con mejoras de rendimiento.</p>
            </div>
            <div className="mt-4">
              <div className="flex space-x-2">
                <button
                  type="button"
                  className="bg-blue-100 px-2 py-1.5 rounded-md text-sm font-medium text-blue-800 hover:bg-blue-200"
                  onClick={() => {
                    applyUpdate();
                    toast.dismiss(t.id);
                  }}
                >
                  Actualizar ahora
                </button>
                <button
                  type="button"
                  className="bg-white px-2 py-1.5 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 border border-gray-300"
                  onClick={() => toast.dismiss(t.id)}
                >
                  Más tarde
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
    {
      duration: Infinity,
      position: 'top-right',
    }
  );
}

/**
 * Mostrar notificación de primera instalación
 */
function showInstallNotification() {
  toast.success(
    'Sellsi ahora funciona offline y carga más rápido',
    {
      duration: 5000,
      icon: '🚀',
    }
  );
}

/**
 * Aplicar actualización del Service Worker
 */
export async function applyUpdate() {
  if (!registration || !registration.waiting) {
    console.warn('No update waiting to apply');
    return;
  }

  // Tell the waiting worker to become active
  registration.waiting.postMessage({ type: 'SKIP_WAITING' });
}

/**
 * Configurar tracking de métricas de cache
 */
function setupCacheMetrics() {
  // Track page load performance
  window.addEventListener('load', () => {
    setTimeout(() => {
      trackCachePerformance();
    }, 1000);
  });

  // Track navigation performance
  let navigationStart = performance.now();
  window.addEventListener('beforeunload', () => {
    navigationStart = performance.now();
  });

  window.addEventListener('pageshow', () => {
    if (performance.now() - navigationStart > 100) {
      trackCachePerformance();
    }
  });
}

/**
 * Trackear performance de cache
 */
async function trackCachePerformance() {
  try {
    // Get performance entries
    const navigation = performance.getEntriesByType('navigation')[0];
    const resources = performance.getEntriesByType('resource');
    
    // Calculate cache metrics
    const cachedResources = resources.filter(resource => 
      resource.transferSize === 0 && resource.decodedBodySize > 0
    );
    
    const metrics = {
      totalResources: resources.length,
      cachedResources: cachedResources.length,
      cacheHitRatio: cachedResources.length / resources.length,
      loadTime: navigation.loadEventEnd - navigation.navigationStart,
      domContentLoaded: navigation.domContentLoadedEventEnd - navigation.navigationStart,
      transferSize: resources.reduce((sum, r) => sum + (r.transferSize || 0), 0),
      timestamp: Date.now()
    };
    
    // Log metrics for analysis
    console.log('📊 Cache Performance Metrics:', metrics);
    
    // Send to analytics if available
    if (typeof gtag === 'function') {
      gtag('event', 'cache_performance', {
        cache_hit_ratio: Math.round(metrics.cacheHitRatio * 100),
        load_time: Math.round(metrics.loadTime),
        cached_count: metrics.cachedResources,
        total_count: metrics.totalResources
      });
    }

    // Get SW cache stats if available
    if (registration && registration.active) {
      const cacheStats = await getServiceWorkerCacheStats();
      console.log('🗄️ Service Worker Cache Stats:', cacheStats);
    }

  } catch (error) {
    console.error('Error tracking cache performance:', error);
  }
}

/**
 * Obtener estadísticas de cache del Service Worker
 */
export async function getServiceWorkerCacheStats() {
  if (!registration || !registration.active) {
    return null;
  }

  return new Promise((resolve, reject) => {
    const channel = new MessageChannel();
    
    channel.port1.onmessage = (event) => {
      resolve(event.data);
    };

    registration.active.postMessage(
      { type: 'GET_CACHE_STATS' },
      [channel.port2]
    );

    // Timeout after 5 seconds
    setTimeout(() => {
      reject(new Error('Timeout getting cache stats'));
    }, 5000);
  });
}

/**
 * Limpiar todos los caches
 */
export async function clearAllCaches() {
  if (!registration || !registration.active) {
    throw new Error('Service Worker not available');
  }

  return new Promise((resolve, reject) => {
    const channel = new MessageChannel();
    
    channel.port1.onmessage = (event) => {
      if (event.data.success) {
        resolve();
        toast.success('Cache limpiado exitosamente');
      } else {
        reject(new Error('Failed to clear cache'));
      }
    };

    registration.active.postMessage(
      { type: 'CLEAR_CACHE' },
      [channel.port2]
    );

    setTimeout(() => {
      reject(new Error('Timeout clearing cache'));
    }, 10000);
  });
}

/**
 * Invalidar cache de thumbnail específico
 */
export function invalidateThumbnailCache(productId) {
  if (!registration || !registration.active) {
    console.warn('Service Worker not available for cache invalidation');
    return;
  }

  registration.active.postMessage({
    type: 'INVALIDATE_THUMBNAIL',
    productId: productId
  });
}

/**
 * Verificar si Service Worker está activo
 */
export function isServiceWorkerActive() {
  return !!(registration && registration.active);
}

/**
 * Obtener información del Service Worker
 */
export function getServiceWorkerInfo() {
  if (!registration) {
    return { status: 'not_registered' };
  }

  let status = 'unknown';
  if (registration.installing) status = 'installing';
  else if (registration.waiting) status = 'waiting';
  else if (registration.active) status = 'active';

  return {
    status,
    scope: registration.scope,
    updateAvailable,
    scriptURL: registration.active?.scriptURL
  };
}

/**
 * Hook React para Service Worker
 */
export function useServiceWorker() {
  const [swInfo, setSwInfo] = React.useState(getServiceWorkerInfo());
  const [cacheStats, setCacheStats] = React.useState(null);

  React.useEffect(() => {
    // Update SW info when registration changes
    const updateInfo = () => setSwInfo(getServiceWorkerInfo());
    
    if (registration) {
      registration.addEventListener('updatefound', updateInfo);
      return () => registration.removeEventListener('updatefound', updateInfo);
    }
  }, []);

  React.useEffect(() => {
    // Get initial cache stats
    getServiceWorkerCacheStats()
      .then(setCacheStats)
      .catch(() => setCacheStats(null));
  }, []);

  return {
    ...swInfo,
    cacheStats,
    applyUpdate,
    clearAllCaches,
    invalidateThumbnailCache,
    refreshCacheStats: () => {
      getServiceWorkerCacheStats()
        .then(setCacheStats)
        .catch(() => setCacheStats(null));
    }
  };
}

// Auto-register if in production
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
  registerServiceWorker();
}
