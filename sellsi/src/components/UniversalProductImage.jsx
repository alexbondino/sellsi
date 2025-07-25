/**
 * COMPONENTE UNIVERSAL DE IMAGEN DE PRODUCTO
 * 
 * Componente que maneja todas las necesidades de imágenes de productos:
 * - Thumbnails responsivos verificados
 * - Detección automática de errores 404
 * - Fallbacks inteligentes
 * - Cache invalidation automático
 * - Compatible con todos los tamaños y contextos
 */

import React, { useState, useCallback, useEffect } from 'react';
import { Avatar, Box, Skeleton, CircularProgress } from '@mui/material';
import { BrokenImage as BrokenImageIcon } from '@mui/icons-material';
import { LazyImage } from '../shared/components/display/LazyImage';
import { useResponsiveThumbnail, useMinithumb } from '../hooks/useResponsiveThumbnail';
import { useQueryClient } from '@tanstack/react-query';

const UniversalProductImage = ({
  product,
  size = 'responsive', // 'minithumb', 'mobile', 'tablet', 'desktop', 'responsive'
  width,
  height,
  sx = {},
  alt,
  fallbackIcon = BrokenImageIcon,
  onError,
  onLoad,
  lazy = true,
  aspectRatio,
  objectFit = 'contain',
  borderRadius = 0,
  ...props
}) => {
  const [imageError, setImageError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const queryClient = useQueryClient();

  // Hooks para obtener thumbnails
  const { thumbnailUrl: responsiveThumbnail, isLoading: responsiveLoading } = useResponsiveThumbnail(product);
  const minithumb = useMinithumb(product);

  // Determinar la URL a usar basada en el tamaño solicitado
  const selectedThumbnail = React.useMemo(() => {
    if (!product) return '/placeholder-product.jpg';

    const finalUrl = (() => {
      switch (size) {
        case 'minithumb':
          return minithumb || responsiveThumbnail || '/placeholder-product.jpg';
        case 'responsive':
        default:
          return responsiveThumbnail || '/placeholder-product.jpg';
      }
    })();

    console.log(`[UniversalProductImage] Debug thumbnails para producto ${product?.id || product?.product_id}:`, {
      responsiveThumbnail,
      minithumb,
      size,
      product: product?.nombre || product?.name,
      retryCount,
      finalUrl,
      imageError
    });

    return finalUrl;
  }, [product, size, minithumb, responsiveThumbnail, retryCount]);

  // Manejar errores de carga de imagen
  const handleImageError = useCallback(() => {
    console.warn(`[UniversalProductImage] Error cargando imagen para producto:`, product?.id || product?.product_id);
    console.warn(`[UniversalProductImage] URL que falló:`, selectedThumbnail);

    setImageError(true);

    // FUNCIONALIDAD PRINCIPAL: Invalidar cache cuando hay error 404
    if (product?.id) {
      const cacheKey = ['thumbnails', product.id];
      console.log(`[UniversalProductImage] Invalidando cache para producto:`, product.id);
      
      // Invalidar cache de React Query para este producto
      queryClient.invalidateQueries({
        queryKey: cacheKey,
        exact: false
      });

      // También limpiar cache del navegador forzando reload
      if (selectedThumbnail && selectedThumbnail !== '/placeholder-product.jpg') {
        const img = new Image();
        img.src = selectedThumbnail + '?cache-bust=' + Date.now();
      }

      // Reintentar después de un delay (máximo 2 reintentos)
      if (retryCount < 2) {
        setTimeout(() => {
          console.log(`[UniversalProductImage] Reintentando carga ${retryCount + 1}/2 para producto:`, product.id);
          setRetryCount(prev => prev + 1);
          setImageError(false);
        }, 1000);
      }
    }

    // Callback personalizado de error
    if (onError) {
      onError();
    }
  }, [product, onError, selectedThumbnail, queryClient, retryCount]);

  // Manejar carga exitosa de imagen
  const handleImageLoad = useCallback(() => {
    setImageError(false);
    setRetryCount(0); // Reset retry count cuando carga exitosamente
    if (onLoad) {
      onLoad();
    }
  }, [onLoad]);

  // Nombre alternativo para la imagen
  const imageAlt = alt || `${product?.nombre || product?.name || 'Producto'}`;

  // Estilos base del componente
  const baseStyles = {
    width: width || '100%',
    height: height || 'auto',
    borderRadius,
    ...sx
  };

  // Si hay error o no hay imagen válida, mostrar Avatar con icono CENTRADO
  if (imageError || !selectedThumbnail || selectedThumbnail === '/placeholder-product.jpg') {
    // Mostrar spinner durante los reintentos
    if (imageError && retryCount < 2) {
      let avatarSize = 64;
      if (typeof baseStyles.width === 'number') avatarSize = baseStyles.width;
      else if (typeof baseStyles.height === 'number') avatarSize = baseStyles.height;
      else if (typeof width === 'number') avatarSize = width;
      else if (typeof height === 'number') avatarSize = height;
      return (
        <Avatar
          sx={{
            ...baseStyles,
            bgcolor: 'grey.100',
            color: 'grey.400',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2rem'
          }}
          {...props}
        >
          <CircularProgress color="primary" size={avatarSize * 0.7} thickness={4} />
        </Avatar>
      );
    }
    // Mostrar icono de imagen rota solo si ya se acabaron los intentos
    const FallbackIcon = fallbackIcon;
    return (
      <Avatar
        sx={{
          ...baseStyles,
          bgcolor: 'grey.100',
          color: 'grey.400',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '2rem'
        }}
        {...props}
      >
        <FallbackIcon sx={{ fontSize: 'inherit' }} />
      </Avatar>
    );
  }

  // Renderizar imagen lazy o normal según configuración
  if (lazy) {
    return (
      <LazyImage
        src={selectedThumbnail}
        alt={imageAlt}
        aspectRatio={aspectRatio}
        rootMargin="150px"
        objectFit={objectFit}
        sx={baseStyles}
        onError={() => {
          console.log(`[UniversalProductImage] LazyImage onError disparado para:`, product?.id, selectedThumbnail);
          handleImageError();
        }}
        onLoad={() => {
          console.log(`[UniversalProductImage] LazyImage onLoad disparado para:`, product?.id, selectedThumbnail);
          handleImageLoad();
        }}
        {...props}
      />
    );
  }

  // Imagen normal (no lazy)
  return (
    <Box
      component="img"
      src={selectedThumbnail}
      alt={imageAlt}
      sx={{
        ...baseStyles,
        objectFit,
        display: 'block'
      }}
      onError={() => {
        console.log(`[UniversalProductImage] Box img onError disparado para:`, product?.id, selectedThumbnail);
        handleImageError();
      }}
      onLoad={() => {
        console.log(`[UniversalProductImage] Box img onLoad disparado para:`, product?.id, selectedThumbnail);
        handleImageLoad();
      }}
      {...props}
    />
  );
};

// Componentes especializados para casos de uso específicos

/**
 * Componente específico para minithumb (40x40) - Para usar en listas, carrito, etc.
 */
export const MinithumbImage = ({ product, ...props }) => (
  <UniversalProductImage
    product={product}
    size="minithumb"
    width={40}
    height={40}
    {...props}
  />
);

/**
 * Componente para ProductCard - Usa thumbnail responsivo
 */
export const ProductCardImage = ({ product, type = 'buyer', ...props }) => {
  // Diferentes alturas según el tipo de card
  const getCardHeight = () => {
    switch (type) {
      case 'supplier':
        return { xs: 142, sm: 154, md: 187.5, lg: 243.75, xl: 260 };
      case 'buyer':
      case 'provider':
      default:
        return { xs: 142, sm: 154, md: 187.5, lg: 243.75, xl: 260 };
    }
  };

  return (
    <UniversalProductImage
      product={product}
      size="responsive"
      height={getCardHeight()}
      sx={{
        maxWidth: '100%',
        bgcolor: '#fff',
        p: type === 'supplier' ? 
          { xs: 0.5, sm: 0.8, md: 1, lg: 0 } : 
          { xs: 1, sm: 1.2, md: 1.5, lg: 0},
        display: 'block',
        mx: 'auto',
        mt: 0.5,
      }}
      {...props}
    />
  );
};

/**
 * Componente para CartItem - Usa thumbnail pequeño optimizado
 */
export const CartItemImage = ({ product, ...props }) => (
  <UniversalProductImage
    product={product}
    size="minithumb"
    aspectRatio="1"
    objectFit="cover"
    sx={{
      borderRadius: 1,
      bgcolor: '#fafafa'
    }}
    {...props}
  />
);

/**
 * Componente para CheckoutSummary - Avatar pequeño con minithumb
 */
export const CheckoutSummaryImage = ({ product, ...props }) => (
  <UniversalProductImage
    product={product}
    size="minithumb"
    width={40}
    height={40}
    lazy={false}
    sx={{
      borderRadius: '50%'
    }}
    {...props}
  />
);

/**
 * Componente para tablas administrativas
 */
export const AdminTableImage = ({ product, ...props }) => (
  <UniversalProductImage
    product={product}
    size="minithumb"
    width={40}
    height={40}
    sx={{
      borderRadius: 1
    }}
    {...props}
  />
);

export default UniversalProductImage;
