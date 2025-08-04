/**
 * ============================================================================
 * THUMBNAIL QUERIES - REACT QUERY HOOKS PARA THUMBNAILS
 * ============================================================================
 */

import { useQuery, useQueries, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../services/supabase';
import { QUERY_KEYS, CACHE_CONFIGS } from '../utils/queryClient';

/**
 * Query individual para thumbnails de un producto
 */
export const useThumbnailQuery = (productId, options = {}) => {
  return useQuery({
    queryKey: QUERY_KEYS.THUMBNAIL(productId),
    queryFn: async () => {
      if (!productId) throw new Error('Product ID is required');

      const { data, error } = await supabase
        .from('product_images')
        .select('thumbnails, thumbnail_url')
        .eq('product_id', productId)
        .order('image_order', { ascending: true })
        .limit(1);

      if (error) throw error;

      const firstRow = data?.[0];
      return firstRow || null;
    },
    enabled: !!productId,
    ...CACHE_CONFIGS.THUMBNAILS,
    ...options,
  });
};

/**
 * Query batch para múltiples thumbnails
 * Optimizado para cargar muchos productos a la vez
 */
export const useThumbnailsBatch = (productIds = [], options = {}) => {
  return useQuery({
    queryKey: QUERY_KEYS.THUMBNAIL_LIST(productIds),
    queryFn: async () => {
      if (!productIds.length) return {};

      const { data, error } = await supabase
        .from('product_images')
        .select('product_id, thumbnails, thumbnail_url')
        .in('product_id', productIds)
        .order('product_id, image_order');

      if (error) throw error;

      // Agrupar por product_id y tomar el primero de cada uno
      const thumbnailsMap = {};
      data.forEach(row => {
        if (!thumbnailsMap[row.product_id]) {
          thumbnailsMap[row.product_id] = row;
        }
      });

      return thumbnailsMap;
    },
    enabled: productIds.length > 0,
    ...CACHE_CONFIGS.THUMBNAILS,
    ...options,
  });
};

/**
 * Hook para múltiples queries independientes
 * Cuando necesitas queries separadas para cada producto
 */
export const useThumbnailsIndependent = (productIds = []) => {
  return useQueries({
    queries: productIds.map(productId => ({
      queryKey: QUERY_KEYS.THUMBNAIL(productId),
      queryFn: async () => {
        const { data, error } = await supabase
          .from('product_images')
          .select('thumbnails, thumbnail_url')
          .eq('product_id', productId)
          .order('image_order', { ascending: true })
          .limit(1);

        if (error) throw error;
        return data?.[0] || null;
      },
      enabled: !!productId,
      ...CACHE_CONFIGS.THUMBNAILS,
    })),
  });
};

/**
 * Invalidación específica de cache de thumbnails
 */
export const useInvalidateThumbnails = () => {
  const queryClient = useQueryClient();
  
  return {
    invalidateProduct: (productId) => {
      queryClient.invalidateQueries({ 
        queryKey: QUERY_KEYS.THUMBNAIL(productId) 
      });
    },
    
    invalidateAll: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['thumbnail'] 
      });
    },
    
    removeProduct: (productId) => {
      queryClient.removeQueries({ 
        queryKey: QUERY_KEYS.THUMBNAIL(productId) 
      });
    },
  };
};
