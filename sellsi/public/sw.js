/**
 * ============================================================================
 * SELLSI SERVICE WORKER - CACHE OPTIMIZATION
 * ============================================================================
 * 
 * Estrategia de cache multicapa para marketplace B2B:
 * - Cache-First: Assets estáticos (JS, CSS, imágenes)
 * - Network-First: API calls y datos dinámicos
 * - Stale-While-Revalidate: Thumbnails y recursos semi-estáticos
 */

const CACHE_NAME = 'sellsi-v1.0.0';
const CACHE_VERSION = '1.0.0';

// Assets que deben cachearse inmediatamente
const CRITICAL_ASSETS = [
  '/assets/js/react-vendor-',
  '/assets/js/mui-core-',
  '/assets/css/index-',
  '/Logos/sellsi_minilogoLoader.webp',
  '/Logos\sellsi_logo_transparent.webp'
];

// TTL por tipo de recurso (en milisegundos)
const CACHE_STRATEGIES = {
  JS_CHUNKS: 365 * 24 * 60 * 60 * 1000,      // 1 año - immutable
  CSS_FILES: 365 * 24 * 60 * 60 * 1000,      // 1 año - immutable  
  IMAGES: 30 * 24 * 60 * 60 * 1000,          // 30 días
  THUMBNAILS: 7 * 24 * 60 * 60 * 1000,       // 7 días
  API_DATA: 5 * 60 * 1000,                   // 5 minutos
  FONTS: 365 * 24 * 60 * 60 * 1000           // 1 año
};

// Límites de cache para prevenir consumo excesivo
const CACHE_LIMITS = {
  MAX_ENTRIES: 200,
  MAX_SIZE_MB: 100,
  MAX_AGE_DAYS: 30
};

/**
 * Instalar Service Worker y cachear assets críticos
 */
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker v' + CACHE_VERSION);
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching critical assets');
      
      // Pre-cache solo assets críticos (evitar cache todo)
      const criticalUrls = CRITICAL_ASSETS.map(asset => {
        // En instalación solo cacheamos si sabemos las URLs exactas
        return asset;
      });
      
      // Solo cachear si tenemos URLs específicas
      return Promise.resolve(); // Skip initial cache, let runtime handle it
    })
  );
  
  // Activar inmediatamente
  self.skipWaiting();
});

/**
 * Activar SW y limpiar caches antiguos
 */
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker v' + CACHE_VERSION);
  
  event.waitUntil(
    Promise.all([
      // Limpiar caches obsoletos
      cleanupOldCaches(),
      
      // Tomar control de todas las pestañas
      self.clients.claim()
    ])
  );
});

/**
 * Interceptar requests y aplicar estrategias de cache
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Solo manejar GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Determinar estrategia según el tipo de recurso
  if (isStaticAsset(url)) {
    event.respondWith(handleStaticAsset(request));
  } else if (isAPICall(url)) {
    event.respondWith(handleAPICall(request));
  } else if (isThumbnail(url)) {
    event.respondWith(handleThumbnail(request));
  } else if (isNavigationRequest(request)) {
    event.respondWith(handleNavigation(request));
  }
  
  // Para otros recursos, usar la red directamente
});

/**
 * Cache-First strategy para assets estáticos
 */
async function handleStaticAsset(request) {
  try {
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      // Verificar si el cache sigue siendo válido
      const isValid = await isCacheValid(cachedResponse, getAssetTTL(request.url));
      if (isValid) {
        console.log('[SW] Cache HIT:', request.url);
        return cachedResponse;
      }
    }
    
    // Fetch de la red
    console.log('[SW] Cache MISS:', request.url);
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cachear para futuras requests
      const cache = await caches.open(CACHE_NAME);
      await cache.put(request, networkResponse.clone());
      
      // Limpiar cache si es necesario
      await enforCacheLimits();
    }
    
    return networkResponse;
    
  } catch (error) {
    console.error('[SW] Static asset failed:', error);
    
    // Fallback a cache aunque esté stale
    const staleResponse = await caches.match(request);
    if (staleResponse) {
      return staleResponse;
    }
    
    throw error;
  }
}

/**
 * Network-First strategy para API calls
 */
async function handleAPICall(request) {
  try {
    // Intentar red primero
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cachear respuestas exitosas de API
      const cache = await caches.open(CACHE_NAME);
      await cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
    
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', request.url);
    
    // Fallback a cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    throw error;
  }
}

/**
 * Stale-While-Revalidate para thumbnails
 */
async function handleThumbnail(request) {
  const cachedResponse = await caches.match(request);
  
  // Servir desde cache inmediatamente si existe
  if (cachedResponse) {
    // Revalidar en background
    fetch(request).then(async (networkResponse) => {
      if (networkResponse.ok) {
        const cache = await caches.open(CACHE_NAME);
        await cache.put(request, networkResponse);
      }
    }).catch(() => {
      // Ignorar errores de revalidación
    });
    
    return cachedResponse;
  }
  
  // Si no hay cache, fetch de la red
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      await cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
    
  } catch (error) {
    // Para thumbnails, podríamos servir un placeholder
    return new Response('', { status: 204 });
  }
}

/**
 * Manejar requests de navegación (SPA)
 */
async function handleNavigation(request) {
  try {
    return await fetch(request);
  } catch (error) {
    // Para SPA, servir index.html desde cache si está disponible
    const cachedIndex = await caches.match('/index.html');
    if (cachedIndex) {
      return cachedIndex;
    }
    throw error;
  }
}

/**
 * Utilidades de clasificación de recursos
 */
function isStaticAsset(url) {
  return /\/assets\/(js|css|svg|images?)\//.test(url.pathname) ||
         /\.(js|css|png|jpg|jpeg|webp|svg|gif|ico|woff2?|ttf|eot)(\?|$)/.test(url.pathname);
}

function isAPICall(url) {
  return url.hostname.includes('supabase.co') ||
         url.pathname.startsWith('/api/') ||
         url.pathname.startsWith('/functions/');
}

function isThumbnail(url) {
  return url.pathname.includes('thumbnails') ||
         url.searchParams.has('thumbnail') ||
         url.pathname.includes('product-images');
}

function isNavigationRequest(request) {
  return request.mode === 'navigate' ||
         (request.method === 'GET' && request.headers.get('accept').includes('text/html'));
}

/**
 * Obtener TTL apropiado según el tipo de asset
 */
function getAssetTTL(url) {
  if (/\.(js|css)/.test(url)) return CACHE_STRATEGIES.JS_CHUNKS;
  if (/\.(png|jpg|jpeg|webp|gif|ico)/.test(url)) return CACHE_STRATEGIES.IMAGES;
  if (/\.(woff2?|ttf|eot)/.test(url)) return CACHE_STRATEGIES.FONTS;
  if (url.includes('thumbnail')) return CACHE_STRATEGIES.THUMBNAILS;
  
  return CACHE_STRATEGIES.IMAGES; // Default
}

/**
 * Verificar si una respuesta cacheada sigue siendo válida
 */
async function isCacheValid(response, ttl) {
  const dateHeader = response.headers.get('date');
  if (!dateHeader) return true; // Si no hay fecha, asumir válido
  
  const cacheAge = Date.now() - new Date(dateHeader).getTime();
  return cacheAge < ttl;
}

/**
 * Limpiar caches antiguos
 */
async function cleanupOldCaches() {
  const cacheNames = await caches.keys();
  
  return Promise.all(
    cacheNames.map((cacheName) => {
      if (cacheName !== CACHE_NAME) {
        console.log('[SW] Deleting old cache:', cacheName);
        return caches.delete(cacheName);
      }
    })
  );
}

/**
 * Enforcar límites de cache
 */
async function enforCacheLimits() {
  const cache = await caches.open(CACHE_NAME);
  const requests = await cache.keys();
  
  // Límite por número de entradas
  if (requests.length > CACHE_LIMITS.MAX_ENTRIES) {
    console.log('[SW] Cache limit exceeded, cleaning up');
    
    // Eliminar las entradas más antiguas
    const entriesToDelete = requests.length - CACHE_LIMITS.MAX_ENTRIES;
    for (let i = 0; i < entriesToDelete; i++) {
      await cache.delete(requests[i]);
    }
  }
  
  // Limpiar entradas demasiado antiguas
  const maxAge = CACHE_LIMITS.MAX_AGE_DAYS * 24 * 60 * 60 * 1000;
  for (const request of requests) {
    const response = await cache.match(request);
    const dateHeader = response.headers.get('date');
    
    if (dateHeader) {
      const age = Date.now() - new Date(dateHeader).getTime();
      if (age > maxAge) {
        await cache.delete(request);
      }
    }
  }
}

/**
 * Manejar mensajes desde el cliente
 */
self.addEventListener('message', (event) => {
  const { data } = event;
  
  switch (data.type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'GET_CACHE_STATS':
      getCacheStats().then((stats) => {
        event.ports[0].postMessage(stats);
      });
      break;
      
    case 'CLEAR_CACHE':
      clearAllCaches().then(() => {
        event.ports[0].postMessage({ success: true });
      });
      break;
      
    case 'INVALIDATE_THUMBNAIL':
      invalidateThumbnail(data.productId);
      break;
  }
});

/**
 * Obtener estadísticas de cache
 */
async function getCacheStats() {
  const cache = await caches.open(CACHE_NAME);
  const requests = await cache.keys();
  
  let totalSize = 0;
  const typeStats = {
    js: 0,
    css: 0, 
    images: 0,
    api: 0,
    other: 0
  };
  
  for (const request of requests) {
    const response = await cache.match(request);
    const size = parseInt(response.headers.get('content-length') || '0');
    totalSize += size;
    
    // Clasificar por tipo
    const url = request.url;
    if (url.includes('.js')) typeStats.js++;
    else if (url.includes('.css')) typeStats.css++;
    else if (/\.(png|jpg|jpeg|webp|gif)/.test(url)) typeStats.images++;
    else if (isAPICall(new URL(url))) typeStats.api++;
    else typeStats.other++;
  }
  
  return {
    totalEntries: requests.length,
    totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
    typeBreakdown: typeStats,
    cacheVersion: CACHE_VERSION
  };
}

/**
 * Limpiar todos los caches
 */
async function clearAllCaches() {
  const cacheNames = await caches.keys();
  return Promise.all(cacheNames.map(name => caches.delete(name)));
}

/**
 * Invalidar cache de thumbnail específico
 */
async function invalidateThumbnail(productId) {
  const cache = await caches.open(CACHE_NAME);
  const requests = await cache.keys();
  
  for (const request of requests) {
    if (request.url.includes(productId) && request.url.includes('thumbnail')) {
      await cache.delete(request);
    }
  }
}

console.log('[SW] Service Worker loaded v' + CACHE_VERSION);
