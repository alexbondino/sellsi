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
  const isTablet = useMediaQuery(theme.breakpoints.between('md', 'lg'));
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg'));

  // Query solo si no tenemos thumbnails en el producto
  const needsQuery = product && product.id && !product.thumbnails;
  
  const { 
    data: dbThumbnails, 
    isLoading: isLoadingThumbnails,
    error: thumbnailError 
  } = useThumbnailQuery(
    product?.id,
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

    // Prioridad 3: Thumbnail_url de la BD
    if (dbThumbnails?.thumbnail_url) {
      return dbThumbnails.thumbnail_url;
    }

    // Prioridad 4: Thumbnails principales del producto
    if (product.thumbnailUrl || product.thumbnail_url) {
      return product.thumbnailUrl || product.thumbnail_url;
    }

    // Prioridad 5: Imagen original
    if (product.imagen) {
      return product.imagen;
    }

    return '/placeholder-product.jpg';
  }, [product, isMobile, isTablet, isDesktop, dbThumbnails]);

  return {
    thumbnailUrl,
    isLoading: isLoadingThumbnails,
    error: thumbnailError,
    hasResponsiveThumbnails: !!(product?.thumbnails || dbThumbnails?.thumbnails),
  };
};

/**
 * Hook para minithumb con React Query
 */
export const useMinithumb = (product) => {
  const needsQuery = product && product.id && 
    !(product.thumbnails?.minithumb);
  
  const { 
    data: dbThumbnails,
    isLoading 
  } = useThumbnailQuery(
    product?.id,
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
