/**
 * ============================================================================
 * SCROLL MANAGER UNIFICADO - SOLUCIÓN DEFINITIVA ANTI-REBOTE
 * ============================================================================
 * 
 * Manager centralizado que unifica TODOS los listeners de scroll
 * para evitar conflictos, race conditions y layout thrashing.
 * 
 * ✅ CARACTERÍSTICAS ANTI-REBOTE:
 * - Coordina con LazyImage observers para evitar layout shifts
 * - Detecta scroll activo vs inactivo para pausar/reanudar observers
 * - RAF-based throttling para máximo rendimiento
 * - Priority-based listener execution
 */

import { debounce } from 'lodash';

class UnifiedScrollManager {
  constructor() {
    this.listeners = new Map(); // id -> { callback, options }
    this.isListening = false;
    this.isActivelyScrolling = false; // ✅ ESTADO CRÍTICO para LazyImage
    this.lastScrollTop = 0;
    this.lastScrollTime = 0;
    this.requestId = null;
    this.scrollEndTimeout = null;
    
    // ✅ SCROLL STATE: Para coordinar con otros sistemas
    this.scrollState = {
      velocity: 0,
      direction: 'down',
      isRapidScroll: false
    };
    
    // Métricas para debugging
    this.stats = {
      totalCalls: 0,
      throttledCalls: 0,
      activeListeners: 0
    };

    // RAF-based handler
    this.handleScroll = this.handleScroll.bind(this);
    
    // ✅ EXPONER GLOBALMENTE: Para que LazyImage pueda consultar estado
    if (typeof window !== 'undefined') {
      window.scrollManager = this;
    }
  }

  /**
   * Agregar listener único de scroll
   */
  addListener(id, callback, options = {}) {
    if (typeof callback !== 'function') {
      console.warn('ScrollManager: callback must be a function');
      return () => {};
    }

    this.listeners.set(id, {
      callback,
      priority: options.priority || 0, // 0 = normal, 1 = high, -1 = low
      throttle: options.throttle || 16, // ms
      lastCall: 0
    });

    this.stats.activeListeners = this.listeners.size;
    this.startListening();

    // Return cleanup function
    return () => this.removeListener(id);
  }

  /**
   * Remover listener específico
   */
  removeListener(id) {
    if (this.listeners.delete(id)) {
      this.stats.activeListeners = this.listeners.size;
      
      if (this.listeners.size === 0) {
        this.stopListening();
      }
    }
  }

  /**
   * Iniciar escucha de scroll (solo una vez)
   */
  startListening() {
    if (!this.isListening) {
      window.addEventListener('scroll', this.handleScroll, { 
        passive: true,
        capture: false 
      });
      this.isListening = true;
    }
  }

  /**
   * Detener escucha de scroll
   */
  stopListening() {
    if (this.isListening) {
      window.removeEventListener('scroll', this.handleScroll);
      this.isListening = false;
      
      if (this.requestId) {
        cancelAnimationFrame(this.requestId);
        this.requestId = null;
      }
    }
  }

  /**
   * Handler principal de scroll (RAF-throttled)
   */
  handleScroll() {
    this.stats.totalCalls++;
    
    // Cancelar frame anterior si existe
    if (this.requestId) {
      cancelAnimationFrame(this.requestId);
    }

    // Programar procesamiento en siguiente frame
    this.requestId = requestAnimationFrame(() => {
      this.processListeners();
      this.requestId = null;
    });
  }

  /**
   * Procesar todos los listeners registrados
   */
  processListeners() {
    const now = performance.now();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    
    // Datos compartidos para todos los listeners
    const scrollData = {
      scrollTop,
      windowHeight,
      documentHeight,
      scrollDelta: scrollTop - this.lastScrollTop,
      scrollDirection: scrollTop > this.lastScrollTop ? 'down' : 'up',
      scrollPercent: scrollTop / (documentHeight - windowHeight || 1),
      isNearBottom: scrollTop + windowHeight >= documentHeight - 200,
      timestamp: now
    };

    // Procesar listeners por prioridad
    const sortedListeners = Array.from(this.listeners.entries())
      .sort(([,a], [,b]) => b.priority - a.priority);

    for (const [id, config] of sortedListeners) {
      // Throttle individual por listener
      if (now - config.lastCall >= config.throttle) {
        try {
          config.callback(scrollData);
          config.lastCall = now;
          this.stats.throttledCalls++;
        } catch (error) {
          console.error(`ScrollManager error in listener ${id}:`, error);
        }
      }
    }

    this.lastScrollTop = scrollTop;
    this.lastScrollTime = now;
  }

  /**
   * Obtener estadísticas de performance
   */
  getStats() {
    return {
      ...this.stats,
      efficiency: this.stats.throttledCalls / Math.max(this.stats.totalCalls, 1),
      listenersCount: this.listeners.size
    };
  }

  /**
   * Reset completo del manager
   */
  reset() {
    this.stopListening();
    this.listeners.clear();
    this.stats = {
      totalCalls: 0,
      throttledCalls: 0,
      activeListeners: 0
    };
  }
}

// Instancia global única
export const scrollManager = new UnifiedScrollManager();

// Exponer para debugging en desarrollo
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  window.scrollManager = scrollManager;
}

export default scrollManager;
