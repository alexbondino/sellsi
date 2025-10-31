// Hook: useProgressiveProducts
// Unifica paginación + infinite scroll + batching thumbnails (flag) preservando comportamiento actual.
// Fase 3 refactor. Mantiene semántica previa.

import React from 'react';
import { paginationResponsiveConfig } from '../constants/layoutTokens';

/**
 * @param {Array} items Lista derivada final (productos o proveedores)
 * @param {{
 *   responsive: { isXs:boolean,isSm:boolean,isMd:boolean,isLg:boolean,isXl:boolean },
 *   featureFlags?: { enableViewportThumbs?: boolean },
 *   strategy?: 'hybrid' | 'paged' | 'infinite'
 * }} options
 */
export function useProgressiveProducts(items, options) {
  const {
    responsive: { isXs, isSm, isMd, isLg, isXl },
    featureFlags = {},
    strategy = 'hybrid',
  } = options;

  // 1. Responsive config (replica exacta de lógica anterior)
  const responsiveConfig = React.useMemo(() => {
    if (isXs) return paginationResponsiveConfig.xs;
    if (isSm) return paginationResponsiveConfig.sm;
    if (isMd) return paginationResponsiveConfig.md;
    if (isLg) return paginationResponsiveConfig.lg;
    if (isXl) return paginationResponsiveConfig.xl;
    return paginationResponsiveConfig.fallback;
  }, [isXs, isSm, isMd, isLg, isXl]);

  const { PRODUCTS_PER_PAGE, INITIAL_PRODUCTS, LOAD_MORE_BATCH, PRELOAD_TRIGGER } = responsiveConfig;

  // 2. Page state
  const [page, setPage] = React.useState(1);

  // 3. Infinite scroll visible count (for current page) when hybrid/infinite and flag off
  const [visibleProductsCount, setVisibleProductsCount] = React.useState(INITIAL_PRODUCTS);
  const [isLoadingMore, setIsLoadingMore] = React.useState(false);

  // 4. Thumbnail batching (flag) replicating original
  const [thumbBatchSize] = React.useState(featureFlags.enableViewportThumbs ? 24 : 1000);
  const [visibleThumbCount, setVisibleThumbCount] = React.useState(thumbBatchSize);

  // --- Stable change detection to avoid false resets (referential churn) ---
  const itemsSignature = React.useMemo(() => {
    if (!Array.isArray(items) || items.length === 0) return 'len:0';
    // Sample first & last few ids (or stringify fallback) to detect meaningful changes without deep compare
    const pickId = (o) => o?.id || o?.productId || o?.sku || o?.supplierId || JSON.stringify(o).slice(0,40);
    const head = items.slice(0,3).map(pickId).join('|');
    const tail = items.slice(-3).map(pickId).join('|');
    return `len:${items.length}|h:${head}|t:${tail}`;
  }, [items]);

  const prevSignatureRef = React.useRef(null);

  // Reset only when breakpoint initial window changes OR page changes explicitly
  React.useEffect(() => {
    setVisibleProductsCount(INITIAL_PRODUCTS);
  }, [INITIAL_PRODUCTS, page]);

  // Reset for REAL item changes (signature diff) – avoids bouncing when array identity changes but contents don't
  React.useEffect(() => {
    if (prevSignatureRef.current === itemsSignature) return; // no meaningful change
    prevSignatureRef.current = itemsSignature;
    // Preserve current page if length shrink still covers it; otherwise clamp
    setPage((p) => {
      const totalPagesNext = Math.max(1, Math.ceil(items.length / PRODUCTS_PER_PAGE));
      return p > totalPagesNext ? totalPagesNext : p; 
    });
    setVisibleProductsCount(INITIAL_PRODUCTS);
    setVisibleThumbCount(thumbBatchSize);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemsSignature, INITIAL_PRODUCTS, thumbBatchSize, PRODUCTS_PER_PAGE]);

  // Batching effect (original escalonado)
  React.useEffect(() => {
    if (!featureFlags.enableViewportThumbs) return;
    if (visibleThumbCount >= items.length) return;
    const handle = setTimeout(() => {
      setVisibleThumbCount(v => Math.min(v + 24, items.length));
    }, 400);
    return () => clearTimeout(handle);
  }, [visibleThumbCount, items.length, featureFlags.enableViewportThumbs]);

  // 5. Paging slices
  const totalPages = Math.ceil(items.length / PRODUCTS_PER_PAGE) || 1;
  const startIndex = (page - 1) * PRODUCTS_PER_PAGE;
  const endIndex = startIndex + PRODUCTS_PER_PAGE;
  const currentPageItems = items.slice(startIndex, endIndex);

  // 6. Infinite scroll slice (only when flag off)
  const infiniteVisibleItems = React.useMemo(() => {
    if (featureFlags.enableViewportThumbs) return currentPageItems; // ignored later
    if (strategy === 'paged') return currentPageItems;
    return currentPageItems.slice(0, visibleProductsCount);
  }, [currentPageItems, visibleProductsCount, featureFlags.enableViewportThumbs, strategy]);

  // 7. Infinite scroll activity condition
  const isInfiniteScrollActive = !featureFlags.enableViewportThumbs && (strategy === 'hybrid' || strategy === 'infinite') &&
    currentPageItems.length <= PRODUCTS_PER_PAGE &&
    visibleProductsCount < currentPageItems.length;

  // 8. loadMore (infinite scroll) replicating original delay
  const loadMore = React.useCallback(() => {
    if (isLoadingMore || !isInfiniteScrollActive) return;
    setIsLoadingMore(true);
    setTimeout(() => {
      setVisibleProductsCount(prev => Math.min(prev + LOAD_MORE_BATCH, currentPageItems.length));
      setIsLoadingMore(false);
    }, 300);
  }, [isLoadingMore, isInfiniteScrollActive, LOAD_MORE_BATCH, currentPageItems.length]);

  // 9. Scroll listener (only when infinite active)
  React.useEffect(() => {
    if (!isInfiniteScrollActive) return;

    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollPercent = scrollTop / (documentHeight - windowHeight || 1);
      const aproxIndex = Math.floor(scrollPercent * visibleProductsCount);
      const shouldPreload = aproxIndex >= PRELOAD_TRIGGER - 2;
      const nearBottom = scrollTop + windowHeight >= documentHeight - 200;
      if (shouldPreload || nearBottom) {
        loadMore();
      }
    };

    let throttleHandle = null;
    const throttled = () => {
      if (throttleHandle) return;
      throttleHandle = setTimeout(() => {
        handleScroll();
        throttleHandle = null;
      }, 150);
    };

    window.addEventListener('scroll', throttled);
    return () => {
      window.removeEventListener('scroll', throttled);
      if (throttleHandle) clearTimeout(throttleHandle);
    };
  }, [isInfiniteScrollActive, PRELOAD_TRIGGER, visibleProductsCount, loadMore]);

  // 10. Page change
  const changePage = React.useCallback((next) => {
    setPage(next);
    setVisibleProductsCount(INITIAL_PRODUCTS);
    setIsLoadingMore(false);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [INITIAL_PRODUCTS]);

  // 11. Final render items selection (replicates (batchedProducts || visibleProducts))
  let renderItems;
  if (featureFlags.enableViewportThumbs) {
    // Batching thumbnails path ignored infinite visible slice
    renderItems = items.slice(0, Math.min(visibleThumbCount, items.length));
  } else {
    renderItems = infiniteVisibleItems;
  }

  const canLoadMore = isInfiniteScrollActive && !isLoadingMore;

  return {
    page,
    totalPages,
    pageItems: currentPageItems,
    renderItems,
    changePage,
    loadMore,
    canLoadMore,
    isLoadingMore,
    isInfiniteScrollActive,
    paginationMeta: { startIndex, endIndex, PRODUCTS_PER_PAGE }
  };
}
