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
      console.warn('[ThumbnailSystem] Sistema ya inicializado');
      return;
    }

    try {
      console.log('[ThumbnailSystem] 🚀 Inicializando sistema de thumbnails...');

      // 1. Cache service ya se inicializa automáticamente (singleton)
      console.log('[ThumbnailSystem] ✅ Cache service iniciado');

      // 2. Invalidation service ya se inicializa automáticamente
      console.log('[ThumbnailSystem] ✅ Invalidation service iniciado');

      // 3. Configurar listeners de desarrollo (solo en dev)
      if (process.env.NODE_ENV === 'development') {
        this.setupDevelopmentListeners();
      }

      this.isInitialized = true;
      console.log('[ThumbnailSystem] ✅ Sistema de thumbnails inicializado correctamente');

      // Mostrar estadísticas iniciales
      this.logInitialStats();

    } catch (error) {
      console.error('[ThumbnailSystem] ❌ Error inicializando sistema de thumbnails:', error);
    }
  }

  /**
   * Configurar listeners para desarrollo
   */
  setupDevelopmentListeners() {
    // Listener para eventos de invalidación (debug)
    window.addEventListener('thumbnailCacheInvalidated', (event) => {
      console.log('[ThumbnailSystem] 🔄 Cache invalidado para producto:', event.detail.productId);
    });

    // Comandos globales para debugging
    window.thumbnailSystem = {
      clearCache: () => {
        thumbnailInvalidationService.forceInvalidateAll();
        console.log('[ThumbnailSystem] 🧹 Cache limpiado manualmente');
      },
      getStats: () => {
        const stats = thumbnailInvalidationService.getStats();
        console.table(stats.cacheStats);
        return stats;
      },
      invalidateProduct: (productId) => {
        thumbnailInvalidationService.manualInvalidation.onProductDeleted(productId);
        console.log(`[ThumbnailSystem] 🔄 Producto ${productId} invalidado manualmente`);
      }
    };

    console.log('[ThumbnailSystem] 🛠️ Comandos de desarrollo disponibles en window.thumbnailSystem');
  }

  /**
   * Mostrar estadísticas iniciales
   */
  logInitialStats() {
    const stats = thumbnailInvalidationService.getStats();
    console.log('[ThumbnailSystem] 📊 Estadísticas iniciales:', {
      cacheSize: stats.cacheStats.size,
      maxCacheSize: stats.cacheStats.maxSize,
      isListening: stats.isListening
    });
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
      console.log('[ThumbnailSystem] 🧹 Sistema de thumbnails limpiado');

    } catch (error) {
      console.error('[ThumbnailSystem] ❌ Error limpiando sistema de thumbnails:', error);
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
