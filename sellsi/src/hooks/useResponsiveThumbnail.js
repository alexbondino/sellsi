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
import { getProductImageUrl } from '../utils/getProductImageUrl';

/**
 * Hook optimizado para thumbnails con React Query
 */
export const useResponsiveThumbnail = product => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.between('md', 'xl'));
  const isDesktop = useMediaQuery(theme.breakpoints.up('xl'));

  // Aceptar múltiples variantes de id para mayor compatibilidad (post refactors)
  const productId =
    product?.id ||
    product?.productid ||
    product?.product_id ||
    product?.productId;

  // Query si no hay objeto thumbnails cargado o si sólo tenemos thumbnail_url sin el JSON completo
  const hasLocalThumbnailsObject = !!(
    product &&
    product.thumbnails &&
    typeof product.thumbnails === 'object'
  );
  const needsQuery = !!productId && !hasLocalThumbnailsObject; // siempre intentar completar el JSON si falta

  const {
    data: dbThumbnails,
    isLoading: isLoadingThumbnails,
    error: thumbnailError,
  } = useThumbnailQuery(productId, {
    enabled: needsQuery,
    // Usar configuración optimizada menos agresiva
    ...CACHE_CONFIGS.THUMBNAILS,
  });

  const thumbnailUrl = useMemo(() => {
    if (!product) return '/placeholder-product.jpg';

    let selectedUrl = null;

    // Prioridad 1: Thumbnails del producto
    if (product.thumbnails && typeof product.thumbnails === 'object') {
      if (isMobile && product.thumbnails.mobile) {
        selectedUrl = product.thumbnails.mobile;
      } else if (isTablet && product.thumbnails.tablet) {
        selectedUrl = product.thumbnails.tablet;
      } else if (isDesktop && product.thumbnails.desktop) {
        selectedUrl = product.thumbnails.desktop;
      }
    }

    // Prioridad 2: Thumbnails de la base de datos (React Query)
    if (
      !selectedUrl &&
      dbThumbnails?.thumbnails &&
      typeof dbThumbnails.thumbnails === 'object'
    ) {
      const thumbs = dbThumbnails.thumbnails;
      if (isMobile && thumbs.mobile) {
        selectedUrl = thumbs.mobile;
      } else if (isTablet && thumbs.tablet) {
        selectedUrl = thumbs.tablet;
      } else if (isDesktop && thumbs.desktop) {
        selectedUrl = thumbs.desktop;
      }
    }

    // Prioridad 3: Construir URL responsive desde thumbnail_url existente
    if (
      !selectedUrl &&
      (dbThumbnails?.thumbnail_url ||
        product.thumbnail_url ||
        product.thumbnailUrl)
    ) {
      const baseUrl =
        dbThumbnails?.thumbnail_url ||
        product.thumbnail_url ||
        product.thumbnailUrl;

      // Construir URL responsive basándose en el patrón de nomenclatura
      if (baseUrl.includes('_desktop_320x260.jpg')) {
        if (isMobile) {
          selectedUrl = baseUrl.replace(
            '_desktop_320x260.jpg',
            '_mobile_190x153.jpg'
          );
        } else if (isTablet) {
          selectedUrl = baseUrl.replace(
            '_desktop_320x260.jpg',
            '_tablet_300x230.jpg'
          );
        } else if (isDesktop) {
          selectedUrl = baseUrl; // Ya es desktop
        }
      } else {
        // Si no coincide con el patrón esperado, usar como está
        selectedUrl = baseUrl;
      }
    }

    // Prioridad 4: FALLBACK A IMAGEN PRINCIPAL - NUEVA FUNCIONALIDAD
    if (!selectedUrl) {
      const mainImage = product.imagen || product.image;
      if (mainImage && mainImage !== '/placeholder-product.jpg') {
        selectedUrl = getProductImageUrl(mainImage, product, false);
      }
    }

    // Prioridad 5: Imagen original como último fallback
    if (!selectedUrl && product.imagen) {
      selectedUrl = product.imagen;
    }

    return selectedUrl || '/placeholder-product.jpg';
  }, [product, isMobile, isTablet, isDesktop, dbThumbnails]);

  return {
    thumbnailUrl,
    isLoading: isLoadingThumbnails,
    error: thumbnailError,
    // Considerar también presencia de thumbnail_url como indicador parcial
    hasResponsiveThumbnails: !!(
      product?.thumbnails ||
      dbThumbnails?.thumbnails ||
      product?.thumbnail_url ||
      product?.thumbnailUrl ||
      dbThumbnails?.thumbnail_url
    ),
  };
};

/**
 * Hook para minithumb con React Query
 */
export const useMinithumb = product => {
  const productId =
    product?.id ||
    product?.productid ||
    product?.product_id ||
    product?.productId;
  const needsQuery = !!productId && !product?.thumbnails?.minithumb;

  const { data: dbThumbnails, isLoading } = useThumbnailQuery(productId, {
    enabled: needsQuery,
  });

  return useMemo(() => {
    if (!product) return '/placeholder-product.jpg';

    // Prioridad 1: Minithumb del producto
    // Si thumbnails viene como string intentar parsearlo
    let localThumbs = product.thumbnails;
    if (localThumbs && typeof localThumbs === 'string') {
      try {
        localThumbs = JSON.parse(localThumbs);
      } catch (_) {
        localThumbs = null;
      }
    }
    if (localThumbs?.minithumb) {
      return localThumbs.minithumb;
    }

    // Prioridad 2: Minithumb de la BD
    if (dbThumbnails?.thumbnails?.minithumb) {
      return dbThumbnails.thumbnails.minithumb;
    }

    // Construir desde thumbnail_url si es posible
    const maybeConstructFrom =
      dbThumbnails?.thumbnail_url ||
      product.thumbnail_url ||
      product.thumbnailUrl ||
      null;
    if (maybeConstructFrom && typeof maybeConstructFrom === 'string') {
      // Reemplazar patrones comunes de tamaño por la variante minithumb
      // Ej: _desktop_320x260.jpg, _tablet_300x230.jpg, _mobile_190x153.jpg -> _minithumb_40x40.jpg
      const re = /_(desktop|tablet|mobile)_[0-9]+x[0-9]+(\.[a-zA-Z0-9]+)$/;
      const m = maybeConstructFrom.match(re);
      if (m) {
        const ext = m[2] || '.jpg';
        const constructed = maybeConstructFrom.replace(
          re,
          `_minithumb_40x40${ext}`
        );
        if (constructed !== maybeConstructFrom) return constructed;
      }
      // Fallback adicional: reemplazo simple si coincide el sufijo desktop específico
      const simple = maybeConstructFrom.replace(
        '_desktop_320x260.jpg',
        '_minithumb_40x40.jpg'
      );
      if (simple !== maybeConstructFrom) return simple;
    }

    // Fallbacks
    if (product.thumbnailUrl) return product.thumbnailUrl;
    if (product.thumbnail_url) return product.thumbnail_url;

    // FALLBACK A IMAGEN PRINCIPAL - NUEVA FUNCIONALIDAD
    const mainImage = product.imagen || product.image;
    if (mainImage && mainImage !== '/placeholder-product.jpg') {
      return getProductImageUrl(mainImage, product, false);
    }

    return '/placeholder-product.jpg';
  }, [product, dbThumbnails]);
};

/**
 * Hook para información completa con React Query
 */
export const useThumbnailInfo = product => {
  const { thumbnailUrl, isLoading, hasResponsiveThumbnails } =
    useResponsiveThumbnail(product);
  const minithumb = useMinithumb(product);

  return useMemo(
    () => ({
      current: thumbnailUrl,
      minithumb,
      mobile: product?.thumbnails?.mobile || thumbnailUrl,
      tablet: product?.thumbnails?.tablet || thumbnailUrl,
      desktop: product?.thumbnails?.desktop || thumbnailUrl,
      original: product?.imagen || '/placeholder-product.jpg',
      hasResponsiveThumbnails,
      isLoading,
    }),
    [thumbnailUrl, minithumb, product, hasResponsiveThumbnails, isLoading]
  );
};
