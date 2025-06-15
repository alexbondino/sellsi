/**
 * ============================================================================
 * USE LAZY PRODUCTS - HOOK PARA LAZY LOADING AVANZADO
 * ============================================================================
 *
 * Hook que implementa lazy loading, paginación e infinite scroll
 * para una experiencia de usuario profesional.
 */

import { useState, useEffect, useCallback, useRef } from 'react'

const DEFAULT_PAGE_SIZE = 12
const LOAD_THRESHOLD = 0.8 // Cargar más cuando se llega al 80% del scroll

/**
 * Hook para lazy loading de productos con infinite scroll
 */
export const useLazyProducts = (
  products = [],
  pageSize = DEFAULT_PAGE_SIZE
) => {
  const [displayedProducts, setDisplayedProducts] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const observerRef = useRef()
  const loadingTriggerRef = useRef()

  // Función para cargar más productos
  const loadMore = useCallback(() => {
    if (isLoadingMore || !hasMore) return

    setIsLoadingMore(true)

    // Simular delay de loading para UX suave
    setTimeout(() => {
      const nextPage = currentPage + 1
      const startIndex = 0
      const endIndex = nextPage * pageSize
      const newProducts = products.slice(startIndex, endIndex)

      setDisplayedProducts(newProducts)
      setCurrentPage(nextPage)
      setHasMore(endIndex < products.length)
      setIsLoadingMore(false)
    }, 300)
  }, [products, currentPage, pageSize, isLoadingMore, hasMore])

  // Intersection Observer para infinite scroll
  useEffect(() => {
    const target = loadingTriggerRef.current
    if (!target) return

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        if (entry.isIntersecting && hasMore && !isLoadingMore) {
          loadMore()
        }
      },
      {
        threshold: 0.1,
        rootMargin: '100px',
      }
    )

    observer.observe(target)
    observerRef.current = observer

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [loadMore, hasMore, isLoadingMore])

  // Reset cuando cambian los productos base
  useEffect(() => {
    const initialProducts = products.slice(0, pageSize)
    setDisplayedProducts(initialProducts)
    setCurrentPage(1)
    setHasMore(products.length > pageSize)
    setIsLoadingMore(false)
  }, [products, pageSize])

  // Función para scroll suave al top
  const scrollToTop = useCallback(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }, [])

  return {
    displayedProducts,
    isLoadingMore,
    hasMore,
    loadingTriggerRef,
    totalCount: products.length,
    displayedCount: displayedProducts.length,
    loadMore,
    scrollToTop,
    progress:
      products.length > 0
        ? (displayedProducts.length / products.length) * 100
        : 0,
  }
}

/**
 * Hook para animaciones staggered de productos
 */
export const useProductAnimations = (productCount) => {
  const [animatedItems, setAnimatedItems] = useState(new Set())
  const [isAnimating, setIsAnimating] = useState(false)

  const triggerAnimation = useCallback(
    (startIndex = 0) => {
      setIsAnimating(true)
      setAnimatedItems(new Set())

      // Animar items con delay escalonado
      for (
        let i = startIndex;
        i < Math.min(startIndex + 8, productCount);
        i++
      ) {
        setTimeout(() => {
          setAnimatedItems((prev) => new Set([...prev, i]))

          if (i === Math.min(startIndex + 7, productCount - 1)) {
            setTimeout(() => setIsAnimating(false), 100)
          }
        }, i * 50)
      }
    },
    [productCount]
  )

  const shouldAnimate = useCallback(
    (index) => {
      return animatedItems.has(index)
    },
    [animatedItems]
  )

  return {
    triggerAnimation,
    shouldAnimate,
    isAnimating,
    animatedItems: animatedItems.size,
  }
}
