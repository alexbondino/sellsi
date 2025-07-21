/**
 * ============================================================================
 * OBSERVER POOL MANAGER - GESTIÓN DE INTERSECTION OBSERVERS
 * ============================================================================
 *
 * Sistema para limitar y reutilizar IntersectionObservers para prevenir
 * memory leaks y optimizar performance.
 */

class ObserverPoolManager {
  constructor(options = {}) {
    this.maxObservers = options.maxObservers || 10;
    this.defaultOptions = options.defaultOptions || {
      threshold: 0.1,
      rootMargin: '50px'
    };
    
    this.observers = new Map(); // key: optionsHash, value: observer
    this.targets = new Map();   // key: element, value: { observer, callbacks }
    this.stats = {
      activeObservers: 0,
      observedElements: 0,
      reusedObservers: 0,
      createdObservers: 0
    };

    // Exponer para debugging
    if (typeof window !== 'undefined') {
      window.observerPool = this;
    }
  }

  /**
   * Crear hash único para opciones del observer
   */
  createOptionsHash(options) {
    return JSON.stringify(options);
  }

  /**
   * Obtener o crear observer para opciones específicas
   */
  getObserver(options = this.defaultOptions) {
    const hash = this.createOptionsHash(options);
    
    if (this.observers.has(hash)) {
      this.stats.reusedObservers++;
      return this.observers.get(hash);
    }

    // Verificar límite de observers
    if (this.observers.size >= this.maxObservers) {
      console.warn(`[ObserverPool] Límite de observers alcanzado (${this.maxObservers}). Reusando observer existente.`);
      // Retornar el primer observer disponible
      return this.observers.values().next().value;
    }

    // Crear nuevo observer
    const observer = new IntersectionObserver((entries) => {
      this.handleIntersection(entries);
    }, options);

    this.observers.set(hash, observer);
    this.stats.createdObservers++;
    this.stats.activeObservers = this.observers.size;
    
    console.log(`[ObserverPool] Nuevo observer creado. Total: ${this.observers.size}`);
    return observer;
  }

  /**
   * Observar elemento con callback específico
   */
  observe(element, callback, options = this.defaultOptions) {
    if (!element || typeof callback !== 'function') {
      console.warn('[ObserverPool] Elemento o callback inválido');
      return () => {}; // Retornar unobserve dummy
    }

    const observer = this.getObserver(options);
    
    // Si el elemento ya está siendo observado, agregar callback
    if (this.targets.has(element)) {
      const target = this.targets.get(element);
      target.callbacks.push(callback);
    } else {
      // Observar nuevo elemento
      this.targets.set(element, {
        observer,
        callbacks: [callback]
      });
      
      observer.observe(element);
      this.stats.observedElements = this.targets.size;
    }

    // Retornar función de cleanup
    return () => this.unobserve(element, callback);
  }

  /**
   * Dejar de observar elemento o callback específico
   */
  unobserve(element, callback = null) {
    const target = this.targets.get(element);
    if (!target) return;

    if (callback) {
      // Remover callback específico
      const index = target.callbacks.indexOf(callback);
      if (index > -1) {
        target.callbacks.splice(index, 1);
      }

      // Si no quedan callbacks, dejar de observar el elemento
      if (target.callbacks.length === 0) {
        target.observer.unobserve(element);
        this.targets.delete(element);
        this.stats.observedElements = this.targets.size;
      }
    } else {
      // Remover observación completa del elemento
      target.observer.unobserve(element);
      this.targets.delete(element);
      this.stats.observedElements = this.targets.size;
    }
  }

  /**
   * Manejar intersecciones
   */
  handleIntersection(entries) {
    entries.forEach(entry => {
      const target = this.targets.get(entry.target);
      if (target) {
        target.callbacks.forEach(callback => {
          try {
            callback(entry);
          } catch (error) {
            console.error('[ObserverPool] Error en callback:', error);
          }
        });
      }
    });
  }

  /**
   * Cleanup completo
   */
  cleanup() {
    // Disconnect todos los observers
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
    this.targets.clear();
    
    this.stats = {
      activeObservers: 0,
      observedElements: 0,
      reusedObservers: this.stats.reusedObservers,
      createdObservers: this.stats.createdObservers
    };
    
    console.log('[ObserverPool] Cleanup completo realizado');
  }

  /**
   * Obtener estadísticas
   */
  getStats() {
    return {
      ...this.stats,
      efficiency: this.stats.reusedObservers / Math.max(this.stats.createdObservers, 1)
    };
  }
}

// Instancia global del pool de observers
export const globalObserverPool = new ObserverPoolManager({
  maxObservers: 10,
  defaultOptions: {
    threshold: 0.1,
    rootMargin: '50px'
  }
});

export default ObserverPoolManager;
