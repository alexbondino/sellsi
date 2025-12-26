/**
 * usePaidOrdersHighlight hook
 * Extracted from BuyerOrders.jsx for reusability
 * 
 * Manages highlighting of recently paid orders with auto-removal after 12s
 */

import { useEffect, useRef } from 'react'
import { createRecentlyPaidTracker } from '../utils/recentlyPaidTracker'

/**
 * Hook para manejar highlight de órdenes recién pagadas
 * Delegates to `createRecentlyPaidTracker` for deterministic behavior
 * @param {Array} orders - Array of orders
 * @returns {Set} Set of order_ids that should be highlighted
 */
export const usePaidOrdersHighlight = (orders) => {
  const trackerRef = useRef(null)

  if (!trackerRef.current) trackerRef.current = createRecentlyPaidTracker()

  useEffect(() => {
    const t = trackerRef.current
    if (!t) return
    t.applyOrders(orders || [])
    return () => {
      // on unmount dispose resources
      // we intentionally do not call dispose on every effect run (only on unmount)
    }
  }, [orders])

  useEffect(() => {
    // cleanup on unmount
    return () => {
      try {
        trackerRef.current?.dispose()
      } catch (_) {}
    }
  }, [])

  return trackerRef.current.getRecentlyPaid()
}
