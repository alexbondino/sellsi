/**
 * SISTEMA CENTRALIZADO DE THUMBNAILS - PUNTO DE ENTRADA PRINCIPAL
 * 
 * Este archivo inicializa todo el sistema de thumbnails robusto:
 * - Cache service con invalidación automática
 * - Hooks robustos para componentes
 * - Servicios de invalidación
 * - Componentes universales
 */

import thumbnailCacheService from './thumbnailCacheService';
import cacheInvalidationService from './cacheInvalidationService';

class RobustThumbnailSystem {
  constructor() {
    this.isInitialized = false;
    this.cacheService = thumbnailCacheService;
    this.invalidationService = cacheInvalidationService;
  }

  /**
   * Inicializar el sistema de thumbnails
   * Se debe llamar una vez al inicio de la aplicación
   */
  initialize() {
    if (this.isInitialized) {
      console.warn('[RobustThumbnailSystem] Sistema ya inicializado');
      return;
    }

    console.log('[RobustThumbnailSystem] 🚀 Inicializando sistema robusto de thumbnails...');
    
    // Configurar listeners para desarrollo (opcional)
    if (process.env.NODE_ENV === 'development') {
      this.setupDevelopmentHelpers();
    }

    this.isInitialized = true;
    console.log('[RobustThumbnailSystem] ✅ Sistema inicializado correctamente');
  }

  /**
   * Configurar helpers para desarrollo
   */
  setupDevelopmentHelpers() {
    // Exponer servicios globalmente para debugging
    if (typeof window !== 'undefined') {
      window.thumbnailCache = this.cacheService;
      window.thumbnailInvalidation = this.invalidationService;
      
      console.log('[RobustThumbnailSystem] 🔧 Servicios expuestos globalmente:');
      console.log('- window.thumbnailCache');
      console.log('- window.thumbnailInvalidation');
    }
  }

  /**
   * Obtener estadísticas del sistema
   */
  getSystemStats() {
    return {
      isInitialized: this.isInitialized,
      cacheStats: this.cacheService.getCacheStats(),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Obtener instancia singleton
   */
  static getInstance() {
    if (!RobustThumbnailSystem.instance) {
      RobustThumbnailSystem.instance = new RobustThumbnailSystem();
    }
    return RobustThumbnailSystem.instance;
  }
}

// Crear instancia singleton
const robustThumbnailSystem = RobustThumbnailSystem.getInstance();

// Exportar sistema y servicios individuales
export default robustThumbnailSystem;
export { thumbnailCacheService, cacheInvalidationService };

// Auto-inicializar si estamos en el navegador
if (typeof window !== 'undefined') {
  robustThumbnailSystem.initialize();
}
