/**
 * 🛡️ Browser Polyfills for Safari Compatibility
 * 
 * Este archivo debe ser importado PRIMERO en main.jsx antes de cualquier otro import
 * para garantizar que los polyfills estén disponibles globalmente.
 */

/**
 * Polyfill para requestIdleCallback (Safari < 18, iOS Safari < 18)
 * 
 * Safari no soporta requestIdleCallback hasta versión 18 (Septiembre 2024).
 * Este polyfill usa setTimeout como fallback manteniendo una API compatible.
 * 
 * Referencias:
 * - https://caniuse.com/requestidlecallback
 * - https://developer.mozilla.org/en-US/docs/Web/API/Window/requestIdleCallback
 */
if (typeof window !== 'undefined' && !('requestIdleCallback' in window)) {
  console.info('[Polyfill] requestIdleCallback no soportado, aplicando polyfill para Safari');
  
  let idCounter = 0;
  const scheduledCallbacks = new Map();

  window.requestIdleCallback = function(callback, options) {
    const timeout = options?.timeout || 2000;
    const id = ++idCounter;
    
    const start = Date.now();
    
    // Simular "idle time" con un timeout corto
    const timeoutId = setTimeout(() => {
      const elapsed = Date.now() - start;
      
      callback({
        didTimeout: elapsed >= timeout,
        timeRemaining: function() {
          // Simular tiempo restante en el frame (50ms es el valor típico de idle)
          return Math.max(0, 50 - (Date.now() - start));
        },
      });
      
      scheduledCallbacks.delete(id);
    }, 1);
    
    scheduledCallbacks.set(id, timeoutId);
    return id;
  };

  window.cancelIdleCallback = function(id) {
    const timeoutId = scheduledCallbacks.get(id);
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
      scheduledCallbacks.delete(id);
    }
  };
  
  console.info('[Polyfill] requestIdleCallback polyfill aplicado exitosamente');
}

/**
 * Opcional: Polyfill para otras APIs faltantes en Safari
 * Agregar aquí según sea necesario
 */

export default {};
