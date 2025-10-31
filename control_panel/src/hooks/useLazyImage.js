/**
 * ============================================================================
 * USE LAZY IMAGE - HOOK PARA LAZY LOADING AVANZADO DE IMÁGENES
 * ============================================================================
 *
 * Hook profesional para lazy loading de imágenes con placeholders,
 * progressive loading y optimización para marketplaces.
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { globalObserverPool } from '../utils/observerPoolManager';

export const useLazyImage = (src, options = {}) => {
  const {
    placeholder = '/placeholder-product.jpg',
    threshold = 0.1,
    rootMargin = '50px',
    enableProgressiveLoading = true,
  } = options

  const [imageSrc, setImageSrc] = useState(placeholder)
  const [isLoaded, setIsLoaded] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(false)
  const imgRef = useRef()

  const loadImage = useCallback(() => {
    const img = new Image()

    img.onload = () => {
      setImageSrc(src)
      setIsLoaded(true)
      setIsLoading(false)
      setError(false)
    }

    img.onerror = () => {
      setError(true)
      setIsLoading(false)
      setImageSrc(placeholder)
    }

    // Progressive loading: cargar una versión de baja calidad primero
    if (enableProgressiveLoading && src && src.includes('supabase')) {
      // Para imágenes de Supabase, podríamos implementar diferentes calidades
      img.src = src
    } else {
      img.src = src
    }
  }, [src, placeholder, enableProgressiveLoading])

  useEffect(() => {
    if (!src || !imgRef.current) return;

    const handleIntersection = (entry) => {
      if (entry.isIntersecting && !isLoaded && !isLoading) {
        setIsLoading(true);
        loadImage();
      }
    };

    const unobserveFunc = globalObserverPool.observe(
      imgRef.current,
      handleIntersection,
      { threshold, rootMargin }
    );

    return unobserveFunc;
  }, [src, threshold, rootMargin, loadImage, isLoaded, isLoading]);

  return {
    imageSrc,
    isLoaded,
    isLoading,
    error,
    imgRef,
  }
}

/**
 * Hook para precargar imágenes críticas
 */
export const useImagePreloader = (images = []) => {
  const [preloadedImages, setPreloadedImages] = useState(new Set())
  const [isPreloading, setIsPreloading] = useState(false)

  useEffect(() => {
    if (images.length === 0) return

    // Evitar loops infinitos creando una key estable
    const imagesKey = images.join(',')

    setIsPreloading(true)

    const preloadPromises = images.slice(0, 3).map((src) => {
      return new Promise((resolve) => {
        const img = new Image()
        img.onload = () => {
          setPreloadedImages((prev) => {
            const newSet = new Set(prev)
            newSet.add(src)
            return newSet
          })
          resolve()
        }
        img.onerror = () => resolve() // Continue even if some images fail
        img.src = src
      })
    })

    Promise.all(preloadPromises).then(() => {
      setIsPreloading(false)
    })
  }, [images.join(',')]) // Usar join para crear una dependencia estable

  return { preloadedImages, isPreloading }
}
