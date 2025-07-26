/**
 * ============================================================================
 * REACT QUERY CLIENT - CONFIGURACIÓN PARA SERVER STATE
 * ============================================================================
 */

import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache por 15 minutos por defecto
      staleTime: 15 * 60 * 1000,
      cacheTime: 30 * 60 * 1000,
      
      // Retry configuration
      retry: (failureCount, error) => {
        // No retry para errores 404, 401, 403
        if (error?.status && [404, 401, 403].includes(error.status)) {
          return false;
        }
        // Retry hasta 3 veces para otros errores
        return failureCount < 3;
      },
      
      // Refetch behavior
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      refetchOnMount: false,
    },
    mutations: {
      // Retry mutations una vez por defecto
      retry: 1,
    },
  },
});

// 🌐 GLOBAL ACCESS: Hacer queryClient disponible globalmente para servicios
if (typeof window !== 'undefined') {
  window.queryClient = queryClient;
}

// Configuración específica para diferentes tipos de queries
export const QUERY_KEYS = {
  // Thumbnails
  THUMBNAIL: (productId) => ['thumbnail', productId],
  THUMBNAIL_LIST: (productIds) => ['thumbnails', 'list', ...productIds],
  
  // Products
  PRODUCT: (productId) => ['product', productId],
  PRODUCTS_BY_SUPPLIER: (supplierId) => ['products', 'supplier', supplierId],
  
  // Images
  PRODUCT_IMAGES: (productId) => ['product_images', productId],
};

// Configuraciones de cache específicas por tipo
export const CACHE_CONFIGS = {
  THUMBNAILS: {
    staleTime: 5 * 60 * 1000,  // 5 minutos (reducido de 15min)
    cacheTime: 15 * 60 * 1000, // 15 minutos (reducido de 1h)
  },
  
  PRODUCT_DATA: {
    staleTime: 5 * 60 * 1000,  // 5 minutos
    cacheTime: 30 * 60 * 1000, // 30 minutos
  },
  
  CRITICAL_DATA: {
    staleTime: 1 * 60 * 1000,  // 1 minuto
    cacheTime: 5 * 60 * 1000,  // 5 minutos
  },
};
