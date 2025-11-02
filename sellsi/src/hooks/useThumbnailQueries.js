/**
 * ============================================================================
 * THUMBNAIL QUERIES - REACT QUERY HOOKS PARA THUMBNAILS
 * ============================================================================
 */

import { useQuery, useQueries, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../services/supabase'; // keep for fallback if flag off
import { QUERY_KEYS, CACHE_CONFIGS } from '../utils/queryClient.js';
// Importar como named export para evitar problemas de detección de default export en build
// Intento de import nombrado; si tree-shake falla, se hará fallback en runtime
import * as Phase1ETAGModule from '../services/phase1ETAGThumbnailService.js';
const phase1ETAGService =
  Phase1ETAGModule.phase1ETAGService || Phase1ETAGModule.default;
import { getOrFetchManyMainThumbnails } from '../services/phase1ETAGThumbnailService.js';
import { FeatureFlags } from '../workspaces/supplier/shared-utils/featureFlags.js';

/**
 * Query individual para thumbnails de un producto - FASE 1 OPTIMIZADO con ETag
 */
export const useThumbnailQuery = (productId, options = {}) => {
  return useQuery({
    queryKey: QUERY_KEYS.THUMBNAIL(productId),
    queryFn: async () => {
      if (!productId) throw new Error('Product ID is required');

      const data = await phase1ETAGService.fetchThumbnailWithETag(productId);

      if (!data) return null;

      // Adaptar formato para compatibilidad con hooks existentes
      return {
        product_id: data.product_id,
        thumbnails: data.thumbnails,
        thumbnail_url: data.thumbnail_url,
        thumbnail_signature: data.thumbnail_signature,
      };
    },
    enabled: !!productId,
    ...CACHE_CONFIGS.THUMBNAILS,
    ...options,
  });
};

/**
 * Query batch para múltiples thumbnails - FASE 1 OPTIMIZADO
 * Optimizado para cargar muchos productos a la vez
 */
export const useThumbnailsBatch = (productIds = [], options = {}) => {
  return useQuery({
    queryKey: QUERY_KEYS.THUMBNAIL_LIST(productIds),
    queryFn: async () => {
      if (!productIds.length) return {};
      if (FeatureFlags.FEATURE_PHASE1_THUMBS) {
        // Usar batch interno del servicio (short-circuit + 1 query)
        return await getOrFetchManyMainThumbnails(productIds, { silent: true });
      }
      // Fallback legacy directo a DB (solo si flag off)
      const { data, error } = await supabase
        .from('product_images')
        .select('product_id, thumbnails, thumbnail_url, thumbnail_signature')
        .in('product_id', productIds)
        .eq('image_order', 0)
        .order('product_id');
      if (error) throw error;
      const map = {};
      data.forEach(r => {
        if (!map[r.product_id]) map[r.product_id] = r;
      });
      return map;
    },
    enabled: productIds.length > 0,
    ...CACHE_CONFIGS.THUMBNAILS,
    ...options,
  });
};

/**
 * Hook para múltiples queries independientes - FASE 1 OPTIMIZADO con ETag
 * Cuando necesitas queries separadas para cada producto
 */
export const useThumbnailsIndependent = (productIds = []) => {
  return useQueries({
    queries: productIds.map(productId => ({
      queryKey: QUERY_KEYS.THUMBNAIL(productId),
      queryFn: async () => phase1ETAGService.fetchThumbnailWithETag(productId),
      enabled: !!productId,
      ...CACHE_CONFIGS.THUMBNAILS,
    })),
  });
};

/**
 * Invalidación específica de cache de thumbnails - FASE 1 ENHANCED con ETag
 */
export const useInvalidateThumbnails = () => {
  const queryClient = useQueryClient();

  return {
    invalidateProduct: productId => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.THUMBNAIL(productId),
      });

      phase1ETAGService.invalidateProduct(productId);
    },

    invalidateAll: () => {
      queryClient.invalidateQueries({
        queryKey: ['thumbnail'],
      });

      phase1ETAGService.clearAll();
    },

    removeProduct: productId => {
      queryClient.removeQueries({
        queryKey: QUERY_KEYS.THUMBNAIL(productId),
      });

      phase1ETAGService.invalidateProduct(productId);
    },

    // NUEVO: Obtener estadísticas del ETag service
    getETagStats: () => {
      return phase1ETAGService.getStats();
    },
  };
};
