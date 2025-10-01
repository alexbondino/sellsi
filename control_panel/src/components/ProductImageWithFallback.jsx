/**
 * ============================================================================
 * PRODUCT IMAGE WITH FALLBACK - COMPONENTE CON FALLBACK AUTOMÁTICO
 * ============================================================================
 * 
 * Componente que envuelve LazyImage y maneja automáticamente el fallback
 * a la imagen principal cuando los thumbnails no están disponibles.
 */

import React from 'react';
import { LazyImage } from '../shared/components/display/LazyImage';
import { useEnhancedThumbnail, useEnhancedMinithumb } from '../hooks/useEnhancedThumbnail';
import { getProductImageUrl } from '../utils/getProductImageUrl';

/**
 * Componente de imagen de producto con fallback automático
 */
const ProductImageWithFallback = ({
  product,
  size = 'responsive', // 'minithumb', 'mobile', 'tablet', 'desktop', 'responsive'
  useMainImageAsFallback = true,
  ...lazyImageProps
}) => {
  // Obtener URL del thumbnail dependiendo del tamaño
  const { thumbnailUrl, isLoading: responsiveLoading, fallbackUsed: responsiveFallback } = useEnhancedThumbnail(product);
  const { minithumbUrl, isLoading: minithumbLoading, fallbackUsed: minithumbFallback } = useEnhancedMinithumb(product);

  // Determinar qué URL usar según el tamaño solicitado
  const imageUrl = React.useMemo(() => {
    if (size === 'minithumb') {
      return minithumbUrl;
    }
    return thumbnailUrl;
  }, [size, minithumbUrl, thumbnailUrl]);

  // Determinar la imagen de fallback si está habilitada
  const fallbackSrc = React.useMemo(() => {
    if (!useMainImageAsFallback || !product) return null;
    
    const mainImage = product.imagen || product.image;
    if (mainImage && mainImage !== '/placeholder-product.jpg') {
      return getProductImageUrl(mainImage, product, false);
    }
    
    return null;
  }, [useMainImageAsFallback, product]);

  // Determinar si está cargando
  const isLoading = size === 'minithumb' ? minithumbLoading : responsiveLoading;

  return (
    <LazyImage
      src={imageUrl}
      fallbackSrc={fallbackSrc}
      {...lazyImageProps}
      // Pasar información de debugging en development
      {...(process.env.NODE_ENV === 'development' && {
        'data-fallback-used': size === 'minithumb' ? minithumbFallback : responsiveFallback,
        'data-loading': isLoading,
        'data-size': size
      })}
    />
  );
};

/**
 * Variantes específicas para diferentes contextos
 */
export const ProductCardImage = ({ product, ...props }) => (
  <ProductImageWithFallback 
    product={product} 
    size="responsive" 
    {...props} 
  />
);

export const MinithumbImage = ({ product, ...props }) => (
  <ProductImageWithFallback 
    product={product} 
    size="minithumb" 
    {...props} 
  />
);

export const CartItemImage = ({ product, ...props }) => (
  <ProductImageWithFallback 
    product={product} 
    size="responsive" 
    {...props} 
  />
);

export const CheckoutSummaryImage = ({ product, ...props }) => (
  <ProductImageWithFallback 
    product={product} 
    size="minithumb" 
    {...props} 
  />
);

export const AdminTableImage = ({ product, ...props }) => (
  <ProductImageWithFallback 
    product={product} 
    size="minithumb" 
    {...props} 
  />
);

export default ProductImageWithFallback;
