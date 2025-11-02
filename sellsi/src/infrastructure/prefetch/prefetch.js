// Lightweight route prefetch utility
// - caches in-memory to avoid duplicate imports
// - checks network conditions and schedules using requestIdleCallback when available
const PREFETCH_CACHE = new Map();

function idle(fn) {
  if (typeof window === 'undefined') return fn();
  if ('requestIdleCallback' in window) {
    return window.requestIdleCallback(fn, { timeout: 2000 });
  }
  return setTimeout(fn, 200);
}

function shouldPrefetch() {
  if (typeof navigator === 'undefined') return true;
  try {
    const conn =
      navigator.connection ||
      navigator.mozConnection ||
      navigator.webkitConnection;
    if (conn && typeof conn.downlink === 'number') {
      // skip heavy prefetch on very slow connections
      if (conn.downlink < 1.5) return false;
    }
  } catch (e) {
    // ignore
  }
  return true;
}

export function prefetch(importFn, key) {
  if (!shouldPrefetch()) return;
  const cacheKey = key || importFn.toString();
  if (PREFETCH_CACHE.has(cacheKey)) return;
  PREFETCH_CACHE.set(cacheKey, true);
  try {
    idle(() => {
      // trigger dynamic import; tolerate factories that don't return a Promise
      try {
        const res = importFn();
        if (res && typeof res.catch === 'function') {
          res.catch(() => {});
        }
      } catch (err) {
        // swallow any synchronous errors
      }
    });
  } catch (e) {
    // best-effort only
  }
}

// helper to map route paths to import functions used in AppRouter lazy boundaries
export function prefetchForPath(path) {
  if (!path) return;
  // normalize
  const p = path.split('?')[0];
  return prefetch(() => importForPath(p), p);
}

export function importForPath(path) {
  if (!path) return Promise.resolve();
  const p = path.split('?')[0];
  switch (p) {
    case '/supplier/addproduct':
    case '/supplier/add':
      return import(
        '../../workspaces/supplier/create-product/components/AddProduct'
      );
    case '/buyer/paymentmethod':
    case '/buyer/payment':
      return import('../../domains/checkout/pages/PaymentMethod');
    case '/onboarding':
      return import('../../workspaces/auth/onboarding').then(
        module => module.Onboarding
      );
    case '/buyer/profile':
    case '/supplier/profile':
    case '/profile':
      return import('../../domains/profile/pages/Profile');
    default:
      return Promise.resolve();
  }
}

export function prefetchOnHover(factory, key, hoverDelay = 50) {
  let timer = null;
  return {
    onMouseEnter() {
      timer = setTimeout(() => prefetch(factory, key), hoverDelay);
    },
    onMouseLeave() {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
    },
    onFocus() {
      // keyboard users
      prefetch(factory, key);
    },
  };
}

export default prefetch;
