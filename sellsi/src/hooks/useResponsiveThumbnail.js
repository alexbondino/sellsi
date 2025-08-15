/**
 * ============================================================================
 * USE RESPONSIVE THUMBNAIL V2 - CON REACT QUERY Y CACHE TTL
 * ============================================================================
 */

import { useMemo } from 'react';
import { useTheme } from '@mui/material/styles';
import { useMediaQuery } from '@mui/material';
import { useThumbnailQuery } from './useThumbnailQueries';
import { CACHE_CONFIGS } from '../utils/queryClient';

/**
 * Hook optimizado para thumbnails con React Query
 */
export const useResponsiveThumbnail = (product) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.between('md', 'xl'));
  const isDesktop = useMediaQuery(theme.breakpoints.up('xl'));

  // Aceptar múltiples variantes de id para mayor compatibilidad (post refactors)
  const productId = product?.id || product?.productid || product?.product_id || product?.productId;

  // Query si no hay objeto thumbnails cargado o si sólo tenemos thumbnail_url sin el JSON completo
  const hasLocalThumbnailsObject = !!(product && product.thumbnails && typeof product.thumbnails === 'object');
  const needsQuery = !!productId && !hasLocalThumbnailsObject; // siempre intentar completar el JSON si falta
  
  const { 
    data: dbThumbnails, 
    isLoading: isLoadingThumbnails,
    error: thumbnailError 
  } = useThumbnailQuery(
    productId,
    { 
      enabled: needsQuery,
      // Usar configuración optimizada menos agresiva
      ...CACHE_CONFIGS.THUMBNAILS,
    }
  );

  const thumbnailUrl = useMemo(() => {
    if (!product) return '/placeholder-product.jpg';

    // Prioridad 1: Thumbnails del producto
    if (product.thumbnails && typeof product.thumbnails === 'object') {
      if (isMobile && product.thumbnails.mobile) {
        return product.thumbnails.mobile;
      }
      if (isTablet && product.thumbnails.tablet) {
        return product.thumbnails.tablet;
      }
      if (isDesktop && product.thumbnails.desktop) {
        return product.thumbnails.desktop;
      }
    }

    // Prioridad 2: Thumbnails de la base de datos (React Query)
    if (dbThumbnails?.thumbnails && typeof dbThumbnails.thumbnails === 'object') {
      const thumbs = dbThumbnails.thumbnails;
      if (isMobile && thumbs.mobile) return thumbs.mobile;
      if (isTablet && thumbs.tablet) return thumbs.tablet;
      if (isDesktop && thumbs.desktop) return thumbs.desktop;
    }

    // Prioridad 3: Construir URL responsive desde thumbnail_url existente
    if (dbThumbnails?.thumbnail_url || product.thumbnail_url || product.thumbnailUrl) {
      const baseUrl = dbThumbnails?.thumbnail_url || product.thumbnail_url || product.thumbnailUrl;
      
      // Construir URL responsive basándose en el patrón de nomenclatura
      if (baseUrl.includes('_desktop_320x260.jpg')) {
        if (isMobile) {
          return baseUrl.replace('_desktop_320x260.jpg', '_mobile_190x153.jpg');
        }
        if (isTablet) {
          return baseUrl.replace('_desktop_320x260.jpg', '_tablet_300x230.jpg');
        }
        if (isDesktop) {
          return baseUrl; // Ya es desktop
        }
      }
      
      // Si no coincide con el patrón esperado, usar como está
      return baseUrl;
    }

    // Prioridad 4: Imagen original
    if (product.imagen) {
      return product.imagen;
    }

    return '/placeholder-product.jpg';
  }, [product, isMobile, isTablet, isDesktop, dbThumbnails]);

  return {
    thumbnailUrl,
    isLoading: isLoadingThumbnails,
    error: thumbnailError,
    // Considerar también presencia de thumbnail_url como indicador parcial
    hasResponsiveThumbnails: !!(product?.thumbnails || dbThumbnails?.thumbnails || product?.thumbnail_url || product?.thumbnailUrl || dbThumbnails?.thumbnail_url),
  };
};

/**
 * Hook para minithumb con React Query
 */
export const useMinithumb = (product) => {
  const productId = product?.id || product?.productid || product?.product_id || product?.productId;
  const needsQuery = !!productId && !(product?.thumbnails?.minithumb);
  
  const { 
    data: dbThumbnails,
    isLoading 
  } = useThumbnailQuery(
    productId,
    { enabled: needsQuery }
  );

  return useMemo(() => {
    if (!product) return '/placeholder-product.jpg';

    // Prioridad 1: Minithumb del producto
    if (product.thumbnails?.minithumb) {
      return product.thumbnails.minithumb;
    }

    // Prioridad 2: Minithumb de la BD
    if (dbThumbnails?.thumbnails?.minithumb) {
      return dbThumbnails.thumbnails.minithumb;
    }

    // Construir desde thumbnail_url si es posible
    if (dbThumbnails?.thumbnail_url) {
      const constructedUrl = dbThumbnails.thumbnail_url.replace(
        '_desktop_320x260.jpg',
        '_minithumb_40x40.jpg'
      );
      if (constructedUrl !== dbThumbnails.thumbnail_url) {
        return constructedUrl;
      }
    }

    // Fallbacks
    if (product.thumbnailUrl) return product.thumbnailUrl;
    if (product.thumbnail_url) return product.thumbnail_url;
    if (product.imagen) return product.imagen;

    return '/placeholder-product.jpg';
  }, [product, dbThumbnails]);
};

/**
 * Hook para información completa con React Query
 */
export const useThumbnailInfo = (product) => {
  const { thumbnailUrl, isLoading, hasResponsiveThumbnails } = useResponsiveThumbnail(product);
  const minithumb = useMinithumb(product);

  return useMemo(() => ({
    current: thumbnailUrl,
    minithumb,
    mobile: product?.thumbnails?.mobile || thumbnailUrl,
    tablet: product?.thumbnails?.tablet || thumbnailUrl,
    desktop: product?.thumbnails?.desktop || thumbnailUrl,
    original: product?.imagen || '/placeholder-product.jpg',
    hasResponsiveThumbnails,
    isLoading,
  }), [thumbnailUrl, minithumb, product, hasResponsiveThumbnails, isLoading]);
};
