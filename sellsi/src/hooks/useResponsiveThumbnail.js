import { useMemo } from 'react';
import { useTheme } from '@mui/material/styles';
import { useMediaQuery } from '@mui/material';

/**
 * Hook para obtener la URL del thumbnail apropiado según el breakpoint actual
 * @param {Object} product - Producto con información de imágenes
 * @param {string} product.imagen - URL de la imagen principal
 * @param {string} product.thumbnailUrl - URL del thumbnail principal (desktop)
 * @param {Object} product.thumbnails - Objeto con URLs de thumbnails responsivos
 * @returns {string} URL del thumbnail apropiado para el breakpoint actual
 */
export const useResponsiveThumbnail = (product) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md')); // xs, sm
  const isTablet = useMediaQuery(theme.breakpoints.between('md', 'lg')); // md
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg')); // lg, xl

  const thumbnailUrl = useMemo(() => {
    if (!product) return '/placeholder-product.jpg';

    // Si el producto tiene thumbnails responsivos, usar el apropiado
    if (product.thumbnails && typeof product.thumbnails === 'object') {
      let selectedThumbnail = null;
      
      if (isMobile && product.thumbnails.mobile) {
        selectedThumbnail = product.thumbnails.mobile;
        return selectedThumbnail;
      }
      if (isTablet && product.thumbnails.tablet) {
        selectedThumbnail = product.thumbnails.tablet;
        return selectedThumbnail;
      }
      if (isDesktop && product.thumbnails.desktop) {
        selectedThumbnail = product.thumbnails.desktop;
        return selectedThumbnail;
      }
    }

    // Fallback al thumbnail principal si existe (verificar ambos formatos)
    if (product.thumbnailUrl || product.thumbnail_url) {
      const thumbnailUrl = product.thumbnailUrl || product.thumbnail_url;
      return thumbnailUrl;
    }

    // Último fallback a la imagen principal
    if (product.imagen) {
      return product.imagen;
    }

    return '/placeholder-product.jpg';
  }, [product, isMobile, isTablet, isDesktop]);

  return thumbnailUrl;
};

/**
 * Hook para obtener información completa de thumbnails
 * @param {Object} product - Producto con información de imágenes
 * @returns {Object} Objeto con todas las URLs de thumbnails y información adicional
 */
export const useThumbnailInfo = (product) => {
  const currentThumbnail = useResponsiveThumbnail(product);
  
  return useMemo(() => ({
    current: currentThumbnail,
    minithumb: product?.thumbnails?.minithumb || product?.thumbnailUrl || product?.thumbnail_url || product?.imagen || '/placeholder-product.jpg',
    mobile: product?.thumbnails?.mobile || product?.thumbnailUrl || product?.thumbnail_url || product?.imagen || '/placeholder-product.jpg',
    tablet: product?.thumbnails?.tablet || product?.thumbnailUrl || product?.thumbnail_url || product?.imagen || '/placeholder-product.jpg',
    desktop: product?.thumbnails?.desktop || product?.thumbnailUrl || product?.thumbnail_url || product?.imagen || '/placeholder-product.jpg',
    original: product?.imagen || '/placeholder-product.jpg',
    hasResponsiveThumbnails: !!(product?.thumbnails && typeof product.thumbnails === 'object')
  }), [currentThumbnail, product]);
};

/**
 * Hook para obtener el minithumb específicamente (40x40)
 * Siempre devuelve el minithumb sin importar el breakpoint
 * @param {Object} product - Producto con información de imágenes
 * @returns {string} URL del minithumb (40x40)
 */
export const useMinithumb = (product) => {
  return useMemo(() => {
    if (!product) return '/placeholder-product.jpg';

    // Buscar el minithumb específico
    if (product.thumbnails && product.thumbnails.minithumb) {
      return product.thumbnails.minithumb;
    }

    // Fallback al thumbnail principal si existe
    if (product.thumbnailUrl || product.thumbnail_url) {
      const thumbnailUrl = product.thumbnailUrl || product.thumbnail_url;
      return thumbnailUrl;
    }

    // Último fallback a la imagen principal
    if (product.imagen) {
      return product.imagen;
    }

    return '/placeholder-product.jpg';
  }, [product]);
};
