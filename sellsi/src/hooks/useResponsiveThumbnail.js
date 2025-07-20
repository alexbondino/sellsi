import { useMemo, useState, useEffect } from 'react';
import { useTheme } from '@mui/material/styles';
import { useMediaQuery } from '@mui/material';
import { supabase } from '../services/supabase';

// Cache global para thumbnails para evitar consultas repetidas
const thumbnailCache = new Map();

// Función para limpiar el cache (útil para debugging)
const clearThumbnailCache = () => {
  thumbnailCache.clear();
};

// Exponer función para debug
window.clearThumbnailCache = clearThumbnailCache;

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
 * Si no está disponible en el producto, consulta la base de datos
 * @param {Object} product - Producto con información de imágenes
 * @returns {string} URL del minithumb (40x40)
 */
export const useMinithumb = (product) => {
  const [dbThumbnails, setDbThumbnails] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Función para construir URL del minithumb basándose en la imagen original
  const buildMinithumbUrl = (originalImageUrl) => {
    if (!originalImageUrl) return null;
    
    try {
      // Extraer información de la URL original
      const url = new URL(originalImageUrl);
      
      // Verificar si es una URL de Supabase con el bucket de imágenes
      if (url.pathname.includes('/storage/v1/object/public/product-images/')) {
        // Cambiar el bucket de product-images a product-images-thumbnails
        const thumbnailPath = url.pathname.replace('/storage/v1/object/public/product-images/', '/storage/v1/object/public/product-images-thumbnails/');
        
        // Obtener el nombre del archivo original y extraer timestamp
        const pathParts = thumbnailPath.split('/');
        const fileName = pathParts[pathParts.length - 1];
        
        // Extraer timestamp del nombre del archivo original
        const timestampMatch = fileName.match(/^(\d+)_/);
        if (timestampMatch) {
          const timestamp = timestampMatch[1];
          const minithumbFileName = `${timestamp}_minithumb_40x40.jpg`;
          
          // Construir URL del minithumb
          const minithumbUrl = `${url.origin}${pathParts.slice(0, -1).join('/')}/${minithumbFileName}`;
          
          return minithumbUrl;
        }
      }
    } catch (error) {
      console.warn('[useMinithumb] Error construyendo URL del minithumb:', error);
    }
    
    return null;
  };

  // Función para obtener thumbnails desde la base de datos
  const fetchThumbnailsFromDB = async (productId) => {
    if (!productId || isLoading) return;

    // Verificar cache primero
    const cacheKey = `minithumb_first_${productId}`;
    if (thumbnailCache.has(cacheKey)) {
      const cachedData = thumbnailCache.get(cacheKey);
      setDbThumbnails(cachedData);
      return;
    }

    try {
      setIsLoading(true);

      // Consultar la tabla product_images para obtener thumbnails
      const { data, error } = await supabase
        .from('product_images')
        .select('thumbnails, thumbnail_url')
        .eq('product_id', productId)
        .order('image_url', { ascending: true }) // Ordenar por image_url ascendente para tomar la primera
        .limit(1);

      if (error) {
        console.warn('[useMinithumb] Error consultando BD:', error);
        thumbnailCache.set(cacheKey, null);
        return;
      }

      const firstRow = data?.[0];
      
      if (firstRow?.thumbnails) {
        setDbThumbnails(firstRow.thumbnails);
        thumbnailCache.set(cacheKey, firstRow.thumbnails);
      } else if (firstRow?.thumbnail_url) {
        
        // Construir minithumb desde thumbnail_url
        const minithumbUrl = firstRow.thumbnail_url.replace(
          '_desktop_320x260.jpg',
          '_minithumb_40x40.jpg'
        );
        
        if (minithumbUrl !== firstRow.thumbnail_url) {
          
          // Verificar si el minithumb existe, si no, usar el desktop como fallback
          const constructedThumbnails = { 
            minithumb: minithumbUrl,
            fallback: firstRow.thumbnail_url // Usar desktop como fallback
          };
          
          setDbThumbnails(constructedThumbnails);
          thumbnailCache.set(cacheKey, constructedThumbnails);
        } else {
          thumbnailCache.set(cacheKey, null);
        }
      } else {
        thumbnailCache.set(cacheKey, null);
      }
    } catch (error) {
      console.error('[useMinithumb] Error inesperado:', error);
      thumbnailCache.set(cacheKey, null);
    } finally {
      setIsLoading(false);
    }
  };

  // Efecto para consultar BD cuando no hay thumbnails en el producto
  useEffect(() => {
    const needsDbLookup = product && 
                         product.id && 
                         !product.thumbnails;

    if (needsDbLookup) {
      fetchThumbnailsFromDB(product.id);
    }
  }, [product?.id, product?.thumbnails]);

  return useMemo(() => {
    if (!product) return '/placeholder-product.jpg';

    // 🎯 PRIORIDAD 1: Buscar el minithumb específico (40x40) en el producto
    if (product.thumbnails && typeof product.thumbnails === 'object') {
      if (product.thumbnails.minithumb) {
        return product.thumbnails.minithumb;
      }
    }

    // 🎯 PRIORIDAD 2: Buscar en thumbnails de la base de datos
    if (dbThumbnails) {
      if (typeof dbThumbnails === 'object' && dbThumbnails.minithumb) {
        return dbThumbnails.minithumb;
      }
      // Si minithumb falla, usar fallback
      if (typeof dbThumbnails === 'object' && dbThumbnails.fallback) {
        return dbThumbnails.fallback;
      }
      if (typeof dbThumbnails === 'string') {
        try {
          const parsed = JSON.parse(dbThumbnails);
          if (parsed.minithumb) {
            return parsed.minithumb;
          }
        } catch (e) {
          console.warn('[useMinithumb] Error parseando thumbnails BD JSON:', e);
        }
      }
    }

    // 🎯 PRIORIDAD 3: Construir URL del minithumb basándose en la imagen original
    if (product.imagen) {
      const constructedUrl = buildMinithumbUrl(product.imagen);
      if (constructedUrl) {
        return constructedUrl;
      }
    }

    // 🎯 PRIORIDAD 4: Fallback a thumbnails principales
    if (product.thumbnailUrl) {
      return product.thumbnailUrl;
    }
    
    if (product.thumbnail_url) {
      return product.thumbnail_url;
    }

    // 🎯 PRIORIDAD 5: Último fallback a la imagen principal
    if (product.imagen) {
      return product.imagen;
    }

    return '/placeholder-product.jpg';
  }, [product, dbThumbnails]);
};
