/**
 * usePaidOrdersHighlight hook
 * Extracted from BuyerOrders.jsx for reusability
 * 
 * Manages highlighting of recently paid orders with auto-removal after 12s
 */

import { useState, useEffect, useRef } from 'react'

/**
 * Hook para manejar highlight de órdenes recién pagadas
 * Auto-elimina el highlight después de 12 segundos
 * @param {Array} orders - Array of orders
 * @returns {Set} Set of order_ids that should be highlighted
 */
export const usePaidOrdersHighlight = (orders) => {
  const [recentlyPaid, setRecentlyPaid] = useState(new Set())
  const prevPaidRef = useRef(new Set())

  useEffect(() => {
    const nextPrev = new Set(prevPaidRef.current)
    
    ;(orders || []).forEach((o) => {
      if (o.payment_status === 'paid' && !prevPaidRef.current.has(o.order_id)) {
        // Nuevo pago confirmado: agregar a highlight set
        setRecentlyPaid((prev) => {
          const clone = new Set(prev)
          clone.add(o.order_id)
          return clone
        })
        
        // Remover highlight tras 12s
        setTimeout(() => {
          setRecentlyPaid((prev) => {
            if (!prev.has(o.order_id)) return prev
            const clone = new Set(prev)
            clone.delete(o.order_id)
            return clone
          })
        }, 12000)
      }
      
      if (o.payment_status === 'paid') nextPrev.add(o.order_id)
    })
    
    prevPaidRef.current = nextPrev
  }, [orders])

  return recentlyPaid
}
