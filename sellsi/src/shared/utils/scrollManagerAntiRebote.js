/**
 * ============================================================================
 * SCROLL MANAGER ANTI-REBOTE - SOLUCIÓN DEFINITIVA
 * ============================================================================
 * 
 * Manager centralizado que unifica TODOS los listeners de scroll
 * y COORDINA con LazyImage observers para evitar layout bouncing
 * 
 * ✅ CARACTERÍSTICAS ANTI-REBOTE:
 * - Pausa IntersectionObservers durante scroll activo
 * - RAF-based throttling para máximo rendimiento  
 * - Priority-based listener execution
 * - Detección de velocidad para scroll agresivo
 * - Eventos personalizados para coordinación
 */

class ScrollManagerAntiRebote {
  constructor() {
    this.listeners = new Map(); // id -> { callback, options }
    this.isListening = false;
    this.isActivelyScrolling = false; // ✅ ESTADO CRÍTICO
    this.lastScrollTop = 0;
    this.lastScrollTime = 0;
    this.requestId = null;
    this.scrollEndTimeout = null;
    
    // ✅ ESTADO DE SCROLL AVANZADO
    this.scrollState = {
      velocity: 0,           // px/ms
      direction: 'down',     // 'up' | 'down'
      isRapidScroll: false,  // > 2px/ms
      distanceTraveled: 0    // px acumulados
    };
    
    // Métricas y debugging
    this.stats = {
      totalCalls: 0,
      throttledCalls: 0,
      activeListeners: 0,
      averageVelocity: 0
    };

    this.handleScroll = this.handleScroll.bind(this);
    
    // ✅ EXPONER GLOBALMENTE para coordinación
    if (typeof window !== 'undefined') {
      window.scrollManagerAntiRebote = this;
    }
  }

  /**
   * ✅ MÉTODO PRINCIPAL: Agregar listener con opciones
   */
  addListener(id, callback, options = {}) {
    if (typeof callback !== 'function') {
      console.warn('ScrollManager: callback must be a function');
      return () => {};
    }

    this.listeners.set(id, {
      callback,
      priority: options.priority || 0,     // -1=low, 0=normal, 1=high
      throttle: options.throttle || 16,    // ms between calls
      lastCall: 0,
      onlyWhenQuiet: options.onlyWhenQuiet || false // ✅ NUEVO: solo ejecutar cuando no hay scroll activo
    });

    this.stats.activeListeners = this.listeners.size;
    this.startListening();

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
   * ✅ HANDLER PRINCIPAL con detección avanzada
   */
  handleScroll() {
    this.stats.totalCalls++;
    
    // RAF throttling
    if (this.requestId) {
      this.stats.throttledCalls++;
      return;
    }

    this.requestId = requestAnimationFrame(() => {
      const now = performance.now();
      const currentScrollTop = window.pageYOffset || document.documentElement.scrollTop;
      
      // ✅ CALCULAR MÉTRICAS DE SCROLL
      const timeDelta = now - this.lastScrollTime;
      const scrollDelta = currentScrollTop - this.lastScrollTop;
      
      if (timeDelta > 0) {
        this.scrollState.velocity = Math.abs(scrollDelta) / timeDelta;
        this.scrollState.direction = scrollDelta > 0 ? 'down' : 'up';
        this.scrollState.isRapidScroll = this.scrollState.velocity > 2;
        this.scrollState.distanceTraveled += Math.abs(scrollDelta);
        
        // Actualizar promedio de velocidad
        this.stats.averageVelocity = (this.stats.averageVelocity + this.scrollState.velocity) / 2;
      }

      // ✅ ESTADO ACTIVO: Pausar LazyImage observers
      const wasScrolling = this.isActivelyScrolling;
      this.isActivelyScrolling = true;
      
      // ✅ NOTIFICAR INICIO DE SCROLL (solo la primera vez)
      if (!wasScrolling) {
        this.notifyScrollStart();
      }

      this.lastScrollTop = currentScrollTop;
      this.lastScrollTime = now;

      // ✅ EJECUTAR LISTENERS
      this.processListeners();
      
      // ✅ DETECCIÓN DE FIN DE SCROLL con timeout dinámico
      const scrollEndDelay = this.scrollState.isRapidScroll ? 200 : 150;
      clearTimeout(this.scrollEndTimeout);
      this.scrollEndTimeout = setTimeout(() => {
        this.isActivelyScrolling = false;
        this.notifyScrollEnd();
      }, scrollEndDelay);

      this.requestId = null;
    });
  }

  /**
   * ✅ NOTIFICAR INICIO DE SCROLL: Pausar observers
   */
  notifyScrollStart() {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('scrollManagerActive', {
        detail: { 
          scrollTop: this.lastScrollTop,
          velocity: this.scrollState.velocity,
          direction: this.scrollState.direction
        }
      }));
    }
  }

  /**
   * ✅ NOTIFICAR FIN DE SCROLL: Reactivar observers
   */
  notifyScrollEnd() {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('scrollManagerQuiet', {
        detail: { 
          scrollTop: this.lastScrollTop,
          totalDistance: this.scrollState.distanceTraveled,
          averageVelocity: this.stats.averageVelocity
        }
      }));
    }
    
    // Reset distance traveled
    this.scrollState.distanceTraveled = 0;
  }

  /**
   * ✅ PROCESAR LISTENERS con filtros avanzados
   */
  processListeners() {
    if (this.listeners.size === 0) return;

    const scrollData = {
      scrollTop: this.lastScrollTop,
      windowHeight: window.innerHeight,
      documentHeight: Math.max(
        document.documentElement.scrollHeight,
        document.body.scrollHeight
      ),
      isActivelyScrolling: this.isActivelyScrolling,
      velocity: this.scrollState.velocity,
      direction: this.scrollState.direction,
      isRapidScroll: this.scrollState.isRapidScroll
    };

    // ✅ ORDENAR POR PRIORIDAD
    const sortedListeners = Array.from(this.listeners.entries())
      .sort(([,a], [,b]) => (b.priority || 0) - (a.priority || 0));

    const now = performance.now();

    sortedListeners.forEach(([id, listener]) => {
      try {
        // ✅ FILTRO: Solo ejecutar si no requiere quietud O si está quiet
        const shouldExecute = !listener.onlyWhenQuiet || !this.isActivelyScrolling;
        
        // ✅ THROTTLING PER-LISTENER
        const canExecute = now - listener.lastCall >= listener.throttle;
        
        if (shouldExecute && canExecute) {
          listener.callback(scrollData);
          listener.lastCall = now;
        }
      } catch (error) {
        console.warn(`ScrollManager error in listener ${id}:`, error);
      }
    });
  }

  /**
   * Iniciar escucha
   */
  startListening() {
    if (!this.isListening && typeof window !== 'undefined') {
      window.addEventListener('scroll', this.handleScroll, { 
        passive: true,
        capture: false 
      });
      this.isListening = true;
    }
  }

  /**
   * Detener escucha
   */
  stopListening() {
    if (this.isListening && typeof window !== 'undefined') {
      window.removeEventListener('scroll', this.handleScroll);
      this.isListening = false;
      
      if (this.requestId) {
        cancelAnimationFrame(this.requestId);
        this.requestId = null;
      }
      
      clearTimeout(this.scrollEndTimeout);
    }
  }

  /**
   * ✅ API PÚBLICA: Consultar estado
   */
  isScrollingActive() {
    return this.isActivelyScrolling;
  }

  getScrollState() {
    return { ...this.scrollState };
  }

  getStats() {
    return { ...this.stats };
  }

  /**
   * ✅ CLEANUP COMPLETO
   */
  destroy() {
    this.stopListening();
    this.listeners.clear();
    this.stats.activeListeners = 0;
    
    if (typeof window !== 'undefined') {
      delete window.scrollManagerAntiRebote;
    }
  }
}

// ✅ INSTANCIA GLOBAL
export const scrollManagerAntiRebote = new ScrollManagerAntiRebote();
export default scrollManagerAntiRebote;
