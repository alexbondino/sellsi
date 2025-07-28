/**
 * INICIALIZADOR DEL SISTEMA DE THUMBNAILS
 * 
 * Punto de entrada que inicializa todos los servicios de thumbnails
 * y debe ser llamado una vez en la aplicación (en main.jsx o App.jsx)
 */

import thumbnailCacheService from './thumbnailCacheService';
import thumbnailInvalidationService from './thumbnailInvalidationService';

class ThumbnailSystemInitializer {
  constructor() {
    this.isInitialized = false;
  }

  /**
   * Inicializar el sistema completo de thumbnails
   */
  init() {
    if (this.isInitialized) {
      return;
    }

    try {
      // 1. Cache service ya se inicializa automáticamente (singleton)
      // 2. Invalidation service ya se inicializa automáticamente
      // 3. Configurar listeners de desarrollo (solo en dev)
      if (process.env.NODE_ENV === 'development') {
        this.setupDevelopmentListeners();
      }

      this.isInitialized = true;
      // Mostrar estadísticas iniciales
      this.logInitialStats();

    } catch (error) {
    }
  }

  /**
   * Configurar listeners para desarrollo
   */
  setupDevelopmentListeners() {
    // Listener para eventos de invalidación (debug)
    window.addEventListener('thumbnailCacheInvalidated', (event) => {
    });

    // Comandos globales para debugging
    window.thumbnailSystem = {
      clearCache: () => {
        thumbnailInvalidationService.forceInvalidateAll();
      },
      getStats: () => {
        const stats = thumbnailInvalidationService.getStats();
        console.table(stats.cacheStats);
        return stats;
      },
      invalidateProduct: (productId) => {
        thumbnailInvalidationService.manualInvalidation.onProductDeleted(productId);
      }
    };
  }

  /**
   * Mostrar estadísticas iniciales
   */
  logInitialStats() {
    const stats = thumbnailInvalidationService.getStats();
  }

  /**
   * Limpiar el sistema (para usar en cleanup de la app)
   */
  cleanup() {
    if (!this.isInitialized) return;

    try {
      thumbnailInvalidationService.cleanup();
      
      // Remover comandos de desarrollo
      if (window.thumbnailSystem) {
        delete window.thumbnailSystem;
      }

      this.isInitialized = false;
    } catch (error) {
    }
  }

  /**
   * Verificar si el sistema está inicializado
   */
  isReady() {
    return this.isInitialized;
  }
}

// Exportar instancia singleton
const thumbnailSystem = new ThumbnailSystemInitializer();

export default thumbnailSystem;

// Re-exportar servicios para facilitar el uso
export { default as thumbnailCacheService } from './thumbnailCacheService';
export { default as thumbnailInvalidationService } from './thumbnailInvalidationService';
