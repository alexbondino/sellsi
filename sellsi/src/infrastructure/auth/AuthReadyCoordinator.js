/**
 * ============================================================================
 * AUTH READY COORDINATOR
 * ============================================================================
 * 
 * Sistema centralizado para coordinar la "estabilidad" del estado de autenticación.
 * 
 * Problema que resuelve:
 * - Después de SIGNED_IN, múltiples caches (shipping, billing, region) se invalidan
 * - Cada cache necesita tiempo para refrescarse
 * - Sin coordinación, el UI puede mostrar estados incompletos (race conditions)
 * 
 * Solución:
 * - Los hooks de cache se "registran" como dependencias de auth-ready
 * - Cuando se completa un refresh, notifican al coordinator
 * - El coordinator expone `isAuthStable` que es true solo cuando TODOS están listos
 * 
 * Arquitectura:
 * - Singleton global (no requiere Context, evita dependencias circulares)
 * - Event-based (desacoplado de React lifecycle)
 * - Timeout safety (nunca bloquea indefinidamente)
 */

// ============================================================================
// CONFIGURACIÓN
// ============================================================================
const CONFIG = {
  // Timeout máximo para considerar auth como "estable" aunque falten caches
  STABILITY_TIMEOUT_MS: 3000,
  // Caches que deben estar listos para considerar auth estable
  REQUIRED_CACHES: ['shipping-info', 'billing-info', 'user-region'],
  // Debug logging
  DEBUG: process.env.NODE_ENV === 'development',
};

// ============================================================================
// ESTADO GLOBAL
// ============================================================================
const state = {
  // Estado actual de autenticación
  isAuthenticating: false,
  isAuthStable: true, // true por defecto (no hay login en progreso)
  
  // Registro de caches y su estado de "ready"
  cacheStatus: new Map(), // cache-name -> { ready: boolean, timestamp: number }
  
  // Subscribers que quieren saber cuando cambia isAuthStable
  subscribers: new Set(),
  
  // Timeout handle para stability timeout
  stabilityTimeoutId: null,
  
  // Timestamp del último SIGNED_IN
  lastSignInAt: null,
};

// ============================================================================
// LOGGING
// ============================================================================
const log = (...args) => {
  if (CONFIG.DEBUG) {
    console.log('[AuthReadyCoordinator]', ...args);
  }
};

// ============================================================================
// NOTIFICACIÓN A SUBSCRIBERS
// ============================================================================
const notifySubscribers = () => {
  const snapshot = {
    isAuthStable: state.isAuthStable,
    isAuthenticating: state.isAuthenticating,
    cacheStatus: Object.fromEntries(state.cacheStatus),
  };
  
  state.subscribers.forEach(callback => {
    try {
      callback(snapshot);
    } catch (e) {
      console.error('[AuthReadyCoordinator] Error in subscriber:', e);
    }
  });
};

// ============================================================================
// VERIFICAR SI TODOS LOS CACHES ESTÁN LISTOS
// ============================================================================
const checkAllCachesReady = () => {
  for (const cacheName of CONFIG.REQUIRED_CACHES) {
    const status = state.cacheStatus.get(cacheName);
    if (!status || !status.ready) {
      return false;
    }
  }
  return true;
};

// ============================================================================
// MARCAR AUTH COMO ESTABLE
// ============================================================================
const markAuthStable = (reason) => {
  if (state.isAuthStable) return; // Ya está estable
  
  log(`✅ Auth estable: ${reason}`);
  state.isAuthStable = true;
  state.isAuthenticating = false;
  
  // Limpiar timeout si existe
  if (state.stabilityTimeoutId) {
    clearTimeout(state.stabilityTimeoutId);
    state.stabilityTimeoutId = null;
  }
  
  notifySubscribers();
  
  // Emitir evento global para componentes que no usan el hook
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('auth-stable', { 
      detail: { reason, timestamp: Date.now() } 
    }));
  }
};

// ============================================================================
// API PÚBLICA
// ============================================================================

/**
 * Llamar cuando inicia el proceso de login (SIGNED_IN event)
 * Resetea todos los caches a "not ready" y comienza el timeout
 */
export const onAuthStarted = () => {
  // ✅ DEBOUNCE: Si acabamos de iniciar auth (< 2s), ignorar llamadas duplicadas
  // Esto previene el bug donde al minimizar navegador, Supabase dispara SIGNED_IN de nuevo
  const timeSinceLastStart = Date.now() - (state.lastSignInAt || 0);
  if (timeSinceLastStart < 2000) {
    log('🔄 Auth iniciado IGNORADO - debounce activo (llamada duplicada en < 2s)');
    return;
  }
  
  log('🔄 Auth iniciado - reseteando estado de caches');
  
  state.isAuthenticating = true;
  state.isAuthStable = false;
  state.lastSignInAt = Date.now();
  
  // Resetear todos los caches requeridos a "not ready"
  for (const cacheName of CONFIG.REQUIRED_CACHES) {
    state.cacheStatus.set(cacheName, { ready: false, timestamp: null });
  }
  
  // Limpiar timeout anterior si existe
  if (state.stabilityTimeoutId) {
    clearTimeout(state.stabilityTimeoutId);
  }
  
  // Configurar timeout de seguridad
  state.stabilityTimeoutId = setTimeout(() => {
    log('⏱️ Timeout alcanzado - forzando auth estable');
    markAuthStable('timeout');
  }, CONFIG.STABILITY_TIMEOUT_MS);
  
  notifySubscribers();
};

/**
 * Llamar cuando un cache termina de refrescarse post-login
 * @param {string} cacheName - Nombre del cache ('shipping-info', 'billing-info', 'user-region')
 */
export const onCacheReady = (cacheName) => {
  // Solo procesar si estamos en proceso de autenticación
  if (!state.isAuthenticating) {
    log(`📦 Cache ${cacheName} ready (ignorado - no hay auth en progreso)`);
    return;
  }
  
  log(`📦 Cache ${cacheName} ready`);
  state.cacheStatus.set(cacheName, { ready: true, timestamp: Date.now() });
  
  // Verificar si todos los caches están listos
  if (checkAllCachesReady()) {
    markAuthStable('all-caches-ready');
  }
};

/**
 * Llamar cuando ocurre logout (SIGNED_OUT event)
 * Resetea todo el estado
 */
export const onAuthCleared = () => {
  log('🚪 Auth cleared');
  
  state.isAuthenticating = false;
  state.isAuthStable = true; // Sin auth = estable (nada que esperar)
  state.lastSignInAt = null;
  state.cacheStatus.clear();
  
  if (state.stabilityTimeoutId) {
    clearTimeout(state.stabilityTimeoutId);
    state.stabilityTimeoutId = null;
  }
  
  notifySubscribers();
};

/**
 * Obtener estado actual de auth stability
 * @returns {{ isAuthStable: boolean, isAuthenticating: boolean }}
 */
export const getAuthState = () => ({
  isAuthStable: state.isAuthStable,
  isAuthenticating: state.isAuthenticating,
  cacheStatus: Object.fromEntries(state.cacheStatus),
});

/**
 * Suscribirse a cambios de estado
 * @param {Function} callback - Función llamada cuando cambia el estado
 * @returns {Function} Función para desuscribirse
 */
export const subscribe = (callback) => {
  state.subscribers.add(callback);
  
  // Notificar inmediatamente con el estado actual
  callback(getAuthState());
  
  // Retornar función de cleanup
  return () => {
    state.subscribers.delete(callback);
  };
};

/**
 * Esperar a que auth sea estable (Promise-based)
 * @param {number} timeoutMs - Timeout máximo (default: CONFIG.STABILITY_TIMEOUT_MS)
 * @returns {Promise<boolean>} - Resuelve con true si se estabilizó, false si timeout
 */
export const waitForAuthStable = (timeoutMs = CONFIG.STABILITY_TIMEOUT_MS) => {
  return new Promise((resolve) => {
    // Si ya está estable, resolver inmediatamente
    if (state.isAuthStable) {
      resolve(true);
      return;
    }
    
    let timeoutId;
    let unsubscribe;
    
    const cleanup = () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (unsubscribe) unsubscribe();
    };
    
    // Suscribirse a cambios
    unsubscribe = subscribe((snapshot) => {
      if (snapshot.isAuthStable) {
        cleanup();
        resolve(true);
      }
    });
    
    // Timeout de seguridad
    timeoutId = setTimeout(() => {
      cleanup();
      resolve(false);
    }, timeoutMs);
  });
};

// ============================================================================
// EXPOSICIÓN GLOBAL (para debugging y uso desde DevTools)
// ============================================================================
if (typeof window !== 'undefined') {
  window.__authReadyCoordinator = {
    getState: getAuthState,
    onCacheReady,
    onAuthStarted,
    onAuthCleared,
    waitForAuthStable,
  };
}

export default {
  onAuthStarted,
  onCacheReady,
  onAuthCleared,
  getAuthState,
  subscribe,
  waitForAuthStable,
};
