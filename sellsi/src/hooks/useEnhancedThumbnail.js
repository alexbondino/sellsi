/**
 * ============================================================================
 * ENHANCED THUMBNAIL HOOK - FALLBACK INTELIGENTE A IMAGEN PRINCIPAL
 * ============================================================================
 */

import { useMemo } from 'react';
import { useTheme } from '@mui/material/styles';
import { useMediaQuery } from '@mui/material';
import { useThumbnailQuery } from './useThumbnailQueries';
import { CACHE_CONFIGS } from '../utils/queryClient';
import { getProductImageUrl } from '../utils/getProductImageUrl';

/**
 * Hook mejorado para thumbnails con fallback automático a imagen principal
 */
export const useEnhancedThumbnail = (product) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.between('md', 'xl'));
  const isDesktop = useMediaQuery(theme.breakpoints.up('xl'));

  // Aceptar múltiples variantes de id para mayor compatibilidad
  const productId = product?.id || product?.productid || product?.product_id || product?.productId;

  // Query si no hay objeto thumbnails cargado
  const hasLocalThumbnailsObject = !!(product && product.thumbnails && typeof product.thumbnails === 'object');
  const needsQuery = !!productId && !hasLocalThumbnailsObject;
  
  const { 
    data: dbThumbnails, 
    isLoading: isLoadingThumbnails,
    error: thumbnailError 
  } = useThumbnailQuery(
    productId,
    { 
      enabled: needsQuery,
      ...CACHE_CONFIGS.THUMBNAILS,
    }
  );

  const thumbnailResult = useMemo(() => {
    if (!product) {
      return {
        thumbnailUrl: '/placeholder-product.jpg',
        isLoading: isLoadingThumbnails,
        error: thumbnailError,
        hasResponsiveThumbnails: false,
        fallbackUsed: false,
        source: 'placeholder'
      };
    }

    let thumbnailUrl = null;
    let source = 'none';
    let fallbackUsed = false;

    // Prioridad 1: Thumbnails del producto
    if (product.thumbnails && typeof product.thumbnails === 'object') {
      if (isMobile && product.thumbnails.mobile) {
        thumbnailUrl = product.thumbnails.mobile;
        source = 'product_thumbnails_mobile';
      } else if (isTablet && product.thumbnails.tablet) {
        thumbnailUrl = product.thumbnails.tablet;
        source = 'product_thumbnails_tablet';
      } else if (isDesktop && product.thumbnails.desktop) {
        thumbnailUrl = product.thumbnails.desktop;
        source = 'product_thumbnails_desktop';
      }
    }

    // Prioridad 2: Thumbnails de la base de datos
    if (!thumbnailUrl && dbThumbnails?.thumbnails && typeof dbThumbnails.thumbnails === 'object') {
      const thumbs = dbThumbnails.thumbnails;
      if (isMobile && thumbs.mobile) {
        thumbnailUrl = thumbs.mobile;
        source = 'db_thumbnails_mobile';
      } else if (isTablet && thumbs.tablet) {
        thumbnailUrl = thumbs.tablet;
        source = 'db_thumbnails_tablet';
      } else if (isDesktop && thumbs.desktop) {
        thumbnailUrl = thumbs.desktop;
        source = 'db_thumbnails_desktop';
      }
    }

    // Prioridad 3: Construir URL responsive desde thumbnail_url existente
    if (!thumbnailUrl) {
      const baseUrl = dbThumbnails?.thumbnail_url || product.thumbnail_url || product.thumbnailUrl;
      
      if (baseUrl && baseUrl.includes('_desktop_320x260.jpg')) {
        if (isMobile) {
          thumbnailUrl = baseUrl.replace('_desktop_320x260.jpg', '_mobile_190x153.jpg');
          source = 'constructed_mobile';
        } else if (isTablet) {
          thumbnailUrl = baseUrl.replace('_desktop_320x260.jpg', '_tablet_300x230.jpg');
          source = 'constructed_tablet';
        } else if (isDesktop) {
          thumbnailUrl = baseUrl;
          source = 'base_thumbnail_url';
        }
      } else if (baseUrl) {
        thumbnailUrl = baseUrl;
        source = 'base_thumbnail_url';
      }
    }

    // Prioridad 4: FALLBACK A IMAGEN PRINCIPAL - NUEVA FUNCIONALIDAD PRINCIPAL
    if (!thumbnailUrl) {
      const mainImage = product.imagen || product.image;
      if (mainImage && mainImage !== '/placeholder-product.jpg') {
        thumbnailUrl = getProductImageUrl(mainImage, product, false);
        source = 'main_image_fallback';
        fallbackUsed = true;
      }
    }

    // Prioridad 5: Placeholder como último recurso
    if (!thumbnailUrl) {
      thumbnailUrl = '/placeholder-product.jpg';
      source = 'placeholder';
    }

    return {
      thumbnailUrl,
      isLoading: isLoadingThumbnails,
      error: thumbnailError,
      hasResponsiveThumbnails: !!(product?.thumbnails || dbThumbnails?.thumbnails || product?.thumbnail_url || product?.thumbnailUrl || dbThumbnails?.thumbnail_url),
      fallbackUsed,
      source
    };
  }, [product, isMobile, isTablet, isDesktop, dbThumbnails, isLoadingThumbnails, thumbnailError]);

  return thumbnailResult;
};

/**
 * Hook para minithumb con fallback a imagen principal
 */
export const useEnhancedMinithumb = (product) => {
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
    if (!product) {
      return {
        minithumbUrl: '/placeholder-product.jpg',
        isLoading,
        fallbackUsed: false,
        source: 'placeholder'
      };
    }

    let minithumbUrl = null;
    let source = 'none';
    let fallbackUsed = false;

    // Prioridad 1: Minithumb del producto
    let localThumbs = product.thumbnails;
    if (localThumbs && typeof localThumbs === 'string') {
      try { 
        localThumbs = JSON.parse(localThumbs); 
      } catch (_) { 
        localThumbs = null; 
      }
    }
    if (localThumbs?.minithumb) {
      minithumbUrl = localThumbs.minithumb;
      source = 'product_thumbnails';
    }

    // Prioridad 2: Minithumb de la BD
    if (!minithumbUrl && dbThumbnails?.thumbnails?.minithumb) {
      minithumbUrl = dbThumbnails.thumbnails.minithumb;
      source = 'db_thumbnails';
    }

    // Prioridad 3: Construir desde thumbnail_url si es posible
    if (!minithumbUrl) {
      const maybeConstructFrom = dbThumbnails?.thumbnail_url || product.thumbnail_url || product.thumbnailUrl;
      if (maybeConstructFrom && typeof maybeConstructFrom === 'string') {
        const re = /_(desktop|tablet|mobile)_[0-9]+x[0-9]+(\.[a-zA-Z0-9]+)$/;
        const m = maybeConstructFrom.match(re);
        if (m) {
          const ext = m[2] || '.jpg';
          const constructed = maybeConstructFrom.replace(re, `_minithumb_40x40${ext}`);
          if (constructed !== maybeConstructFrom) {
            minithumbUrl = constructed;
            source = 'constructed_from_thumbnail';
          }
        }
        // Fallback adicional: reemplazo simple si coincide el sufijo desktop específico
        if (!minithumbUrl) {
          const simple = maybeConstructFrom.replace('_desktop_320x260.jpg', '_minithumb_40x40.jpg');
          if (simple !== maybeConstructFrom) {
            minithumbUrl = simple;
            source = 'simple_constructed';
          }
        }
      }
    }

    // Prioridad 4: FALLBACK A IMAGEN PRINCIPAL - NUEVA FUNCIONALIDAD PRINCIPAL
    if (!minithumbUrl) {
      const mainImage = product.imagen || product.image;
      if (mainImage && mainImage !== '/placeholder-product.jpg') {
        minithumbUrl = getProductImageUrl(mainImage, product, false);
        source = 'main_image_fallback';
        fallbackUsed = true;
      }
    }

    // Prioridad 5: Otros fallbacks
    if (!minithumbUrl) {
      if (product.thumbnailUrl) {
        minithumbUrl = product.thumbnailUrl;
        source = 'product_thumbnailUrl';
      } else if (product.thumbnail_url) {
        minithumbUrl = product.thumbnail_url;
        source = 'product_thumbnail_url';
      } else {
        minithumbUrl = '/placeholder-product.jpg';
        source = 'placeholder';
      }
    }

    return {
      minithumbUrl,
      isLoading,
      fallbackUsed,
      source
    };
  }, [product, dbThumbnails, isLoading]);
};

/**
 * Hook para información completa con fallbacks mejorados
 */
export const useEnhancedThumbnailInfo = (product) => {
  const { thumbnailUrl, isLoading, hasResponsiveThumbnails, fallbackUsed: thumbnailFallbackUsed, source: thumbnailSource } = useEnhancedThumbnail(product);
  const { minithumbUrl, fallbackUsed: minithumbFallbackUsed, source: minithumbSource } = useEnhancedMinithumb(product);

  return useMemo(() => ({
    current: thumbnailUrl,
    minithumb: minithumbUrl,
    mobile: product?.thumbnails?.mobile || thumbnailUrl,
    tablet: product?.thumbnails?.tablet || thumbnailUrl,
    desktop: product?.thumbnails?.desktop || thumbnailUrl,
    original: product?.imagen || product?.image || '/placeholder-product.jpg',
    hasResponsiveThumbnails,
    isLoading,
    fallbackInfo: {
      thumbnail: {
        used: thumbnailFallbackUsed,
        source: thumbnailSource
      },
      minithumb: {
        used: minithumbFallbackUsed,
        source: minithumbSource
      }
    }
  }), [thumbnailUrl, minithumbUrl, product, hasResponsiveThumbnails, isLoading, thumbnailFallbackUsed, thumbnailSource, minithumbFallbackUsed, minithumbSource]);
};
