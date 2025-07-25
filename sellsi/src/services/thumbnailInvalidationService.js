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
          console.log('[ThumbnailInvalidation] Cambio detectado en product_images:', payload);
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
          console.log('[ThumbnailInvalidation] Producto eliminado:', payload);
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
        console.log(`[ThumbnailInvalidation] Nueva imagen añadida para producto ${productId}`);
        break;
        
      case 'UPDATE':
        productId = newRecord?.product_id || oldRecord?.product_id;
        console.log(`[ThumbnailInvalidation] Imagen actualizada para producto ${productId}`);
        break;
        
      case 'DELETE':
        productId = oldRecord?.product_id;
        console.log(`[ThumbnailInvalidation] Imagen eliminada para producto ${productId}`);
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
      console.log(`[ThumbnailInvalidation] Invalidando cache por eliminación de producto ${productId}`);
      this.invalidateProductThumbnails(productId);
    }
  }

  /**
   * Invalidar thumbnails de un producto específico
   */
  invalidateProductThumbnails(productId) {
    if (!productId) return;

    try {
      // Invalidar en el servicio de cache
      thumbnailCacheService.invalidateProductCache(productId);
      
      // Emitir evento personalizado para componentes que lo necesiten
      this.emitInvalidationEvent(productId);
      
      console.log(`[ThumbnailInvalidation] ✅ Cache invalidado para producto ${productId}`);
    } catch (error) {
      console.error(`[ThumbnailInvalidation] ❌ Error invalidando cache para producto ${productId}:`, error);
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
      console.log(`[ThumbnailInvalidation] Invalidación manual: imagen eliminada de producto ${productId}`);
      this.invalidateProductThumbnails(productId);
    },

    /**
     * Invalidar después de subir una nueva imagen
     */
    onImageUploaded: (productId) => {
      console.log(`[ThumbnailInvalidation] Invalidación manual: nueva imagen para producto ${productId}`);
      this.invalidateProductThumbnails(productId);
    },

    /**
     * Invalidar después de eliminar un producto completo
     */
    onProductDeleted: (productId) => {
      console.log(`[ThumbnailInvalidation] Invalidación manual: producto eliminado ${productId}`);
      this.invalidateProductThumbnails(productId);
    },

    /**
     * Invalidar múltiples productos (para operaciones en lote)
     */
    onBulkOperation: (productIds) => {
      console.log(`[ThumbnailInvalidation] Invalidación manual en lote:`, productIds);
      this.invalidateMultipleProducts(productIds);
    }
  };

  /**
   * Limpiar listeners (para usar en cleanup)
   */
  cleanup() {
    // Remover los canales de Supabase
    supabase.removeAllChannels();
    
    console.log('[ThumbnailInvalidation] 🧹 Listeners limpiados');
  }

  /**
   * Forzar invalidación total del cache (solo para desarrollo/debug)
   */
  forceInvalidateAll() {
    thumbnailCacheService.clearAllCache();
    console.log('[ThumbnailInvalidation] 🔥 Cache total invalidado (modo desarrollo)');
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
