/**
 * HOOK ROBUSTO PARA THUMBNAILS
 * 
 * Reemplaza useResponsiveThumbnail con una versión más robusta que:
 * - Verifica la existencia real de las URLs
 * - Maneja cache inteligente con invalidación
 * - Proporciona fallbacks automáticos
 * - Es compatible con todos los componentes existentes
 */

import { useState, useEffect, useMemo } from 'react';
import { useTheme } from '@mui/material/styles';
import { useMediaQuery } from '@mui/material';
import thumbnailCacheService from '../services/thumbnailCacheService';

/**
 * Hook principal para thumbnails responsivos y robustos
 * @param {Object} product - Producto con información de imágenes
 * @returns {string} URL del thumbnail apropiado para el breakpoint actual
 */
export const useRobustThumbnail = (product) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md')); // xs, sm
  const isTablet = useMediaQuery(theme.breakpoints.between('md', 'lg')); // md
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg')); // lg, xl

  const [thumbnailUrl, setThumbnailUrl] = useState('/placeholder-product.jpg');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Determinar el tamaño de thumbnail necesario basado en breakpoint
  const requiredSize = useMemo(() => {
    if (isMobile) return 'mobile';
    if (isTablet) return 'tablet';
    if (isDesktop) return 'desktop';
    return 'mobile'; // fallback
  }, [isMobile, isTablet, isDesktop]);

  // Efecto principal para obtener thumbnail
  useEffect(() => {
    let isMounted = true;

    const fetchThumbnail = async () => {
      if (!product) {
        setThumbnailUrl('/placeholder-product.jpg');
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const url = await thumbnailCacheService.getBestThumbnailUrl(product, requiredSize);
        
        if (isMounted) {
          setThumbnailUrl(url);
        }
      } catch (err) {
        console.error('[useRobustThumbnail] Error:', err);
        if (isMounted) {
          setError(err);
          setThumbnailUrl('/placeholder-product.jpg');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchThumbnail();

    return () => {
      isMounted = false;
    };
  }, [product, requiredSize]);

  return {
    url: thumbnailUrl,
    isLoading,
    error,
    // Función para forzar recarga
    refetch: () => {
      if (product) {
        const productId = product.id || product.product_id;
        thumbnailCacheService.invalidateProductCache(productId);
        // El useEffect se ejecutará automáticamente
      }
    }
  };
};

/**
 * Hook específico para minithumb (40x40) - Para compatibilidad con código existente
 * @param {Object} product - Producto con información de imágenes
 * @returns {string} URL del minithumb
 */
export const useRobustMinithumb = (product) => {
  const [minithumbUrl, setMinithumbUrl] = useState('/placeholder-product.jpg');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchMinithumb = async () => {
      if (!product) {
        setMinithumbUrl('/placeholder-product.jpg');
        return;
      }

      setIsLoading(true);

      try {
        const url = await thumbnailCacheService.getBestThumbnailUrl(product, 'minithumb');
        
        if (isMounted) {
          setMinithumbUrl(url);
        }
      } catch (err) {
        console.error('[useRobustMinithumb] Error:', err);
        if (isMounted) {
          setMinithumbUrl('/placeholder-product.jpg');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchMinithumb();

    return () => {
      isMounted = false;
    };
  }, [product]);

  return minithumbUrl;
};

/**
 * Hook para obtener todos los tamaños de thumbnail disponibles
 * @param {Object} product - Producto con información de imágenes
 * @returns {Object} Objeto con URLs de todos los tamaños disponibles
 */
export const useAllThumbnails = (product) => {
  const [thumbnails, setThumbnails] = useState({
    minithumb: '/placeholder-product.jpg',
    mobile: '/placeholder-product.jpg',
    tablet: '/placeholder-product.jpg',
    desktop: '/placeholder-product.jpg'
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchAllThumbnails = async () => {
      if (!product) {
        return;
      }

      setIsLoading(true);

      try {
        const sizes = ['minithumb', 'mobile', 'tablet', 'desktop'];
        const results = await Promise.all(
          sizes.map(size => thumbnailCacheService.getBestThumbnailUrl(product, size))
        );

        if (isMounted) {
          const thumbnailObj = {};
          sizes.forEach((size, index) => {
            thumbnailObj[size] = results[index];
          });
          setThumbnails(thumbnailObj);
        }
      } catch (err) {
        console.error('[useAllThumbnails] Error:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchAllThumbnails();

    return () => {
      isMounted = false;
    };
  }, [product]);

  return {
    thumbnails,
    isLoading,
    // Función para forzar recarga de todos los thumbnails
    refetchAll: () => {
      if (product) {
        const productId = product.id || product.product_id;
        thumbnailCacheService.invalidateProductCache(productId);
      }
    }
  };
};

// Re-exportar para compatibilidad con código existente
export const useResponsiveThumbnail = (product) => {
  const { url } = useRobustThumbnail(product);
  return url;
};

export const useMinithumb = (product) => {
  return useRobustMinithumb(product);
};
