/**
 * SERVICIO DE INVALIDACIÓN DE CACHE DE THUMBNAILS
 * 
 * Se encarga de invalidar automáticamente el cache cuando:
 * - Se elimina un producto
 * - Se elimina una imagen de un producto
 * - Se actualiza una imagen de un producto
 */

import thumbnailCacheService from './thumbnailCacheService';
import { supabase } from './supabase';
import React from 'react';

class ThumbnailInvalidationService {
  constructor() {
    // Escuchar cambios en la tabla product_images
    this.setupRealtimeListeners();
  }

  /**
   * Configurar listeners de tiempo real para invalidar cache automáticamente
   */
  setupRealtimeListeners() {
    // Listener para cambios en product_images
    supabase
      .channel('product_images_changes')
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'product_images'
        },
        (payload) => {
          this.handleProductImageChange(payload);
        }
      )
      .subscribe();

    // Listener para cambios en products (en caso de eliminación completa)
    supabase
      .channel('products_changes')
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'products'
        },
        (payload) => {
          this.handleProductDeletion(payload);
        }
      )
      .subscribe();
  }

  /**
   * Manejar cambios en la tabla product_images
   */
  handleProductImageChange(payload) {
    const { eventType, new: newRecord, old: oldRecord } = payload;
    
    let productId = null;
    
    switch (eventType) {
      case 'INSERT':
        productId = newRecord?.product_id;
        break;
        
      case 'UPDATE':
        productId = newRecord?.product_id || oldRecord?.product_id;
        break;
        
      case 'DELETE':
        productId = oldRecord?.product_id;
        break;
    }

    if (productId) {
      this.invalidateProductThumbnails(productId);
    }
  }

  /**
   * Manejar eliminación completa de producto
   */
  handleProductDeletion(payload) {
    const productId = payload.old?.id;
    
    if (productId) {
      this.invalidateProductThumbnails(productId);
    }
  }

  /**
   * Invalidar thumbnails de un producto específico
   */
  invalidateProductThumbnails(productId) {
    if (!productId) return;

    try {
      console.log(`🚨 INVALIDATING thumbnails for product ${productId}`);
      
      // Invalidar en el servicio de cache (incluye forceImmediateRefresh)
      thumbnailCacheService.invalidateProductCache(productId);
      
      // Emitir evento personalizado para componentes que lo necesiten
      this.emitInvalidationEvent(productId);

      // 🔥 FORCE ADDITIONAL REFRESH ATTEMPTS
      setTimeout(() => {
        console.log(`🔄 RETRY refresh for product ${productId}`);
        thumbnailCacheService.forceImmediateRefresh(productId);
      }, 100);

      setTimeout(() => {
        console.log(`🔄 FINAL retry refresh for product ${productId}`);
        thumbnailCacheService.forceImmediateRefresh(productId);
      }, 500);
      
    } catch (error) {
      console.error('❌ Error invalidating thumbnails:', error);
    }
  }

  /**
   * Invalidar thumbnails de múltiples productos
   */
  invalidateMultipleProducts(productIds) {
    if (!Array.isArray(productIds)) return;

    productIds.forEach(productId => {
      this.invalidateProductThumbnails(productId);
    });
  }

  /**
   * Emitir evento personalizado de invalidación
   */
  emitInvalidationEvent(productId) {
    const event = new CustomEvent('thumbnailCacheInvalidated', {
      detail: { productId }
    });
    
    window.dispatchEvent(event);
  }

  /**
   * Invalidar cache manualmente (para usar en operaciones CRUD)
   */
  manualInvalidation = {
    /**
     * Invalidar después de eliminar una imagen
     */
    onImageDeleted: (productId) => {
      this.invalidateProductThumbnails(productId);
    },

    /**
     * Invalidar después de subir una nueva imagen
     */
    onImageUploaded: (productId) => {
      this.invalidateProductThumbnails(productId);
    },

    /**
     * Invalidar después de eliminar un producto completo
     */
    onProductDeleted: (productId) => {
      this.invalidateProductThumbnails(productId);
    },

    /**
     * Invalidar múltiples productos (para operaciones en lote)
     */
    onBulkOperation: (productIds) => {
      this.invalidateMultipleProducts(productIds);
    }
  };

  /**
   * Limpiar listeners (para usar en cleanup)
   */
  cleanup() {
    // Remover los canales de Supabase
    supabase.removeAllChannels();
  }

  /**
   * Forzar invalidación total del cache (solo para desarrollo/debug)
   */
  forceInvalidateAll() {
    thumbnailCacheService.clearAllCache();
  }

  /**
   * Obtener estadísticas del servicio
   */
  getStats() {
    return {
      cacheStats: thumbnailCacheService.getCacheStats(),
      isListening: true
    };
  }
}

// Exportar instancia singleton
export default new ThumbnailInvalidationService();

/**
 * Hook para usar en componentes que necesiten reaccionar a invalidaciones
 */
export const useThumbnailInvalidation = (productId, onInvalidate) => {
  React.useEffect(() => {
    if (!productId || !onInvalidate) return;

    const handleInvalidation = (event) => {
      if (event.detail.productId === productId) {
        onInvalidate();
      }
    };

    window.addEventListener('thumbnailCacheInvalidated', handleInvalidation);

    return () => {
      window.removeEventListener('thumbnailCacheInvalidated', handleInvalidation);
    };
  }, [productId, onInvalidate]);
};
