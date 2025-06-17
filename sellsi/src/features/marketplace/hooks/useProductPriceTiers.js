import { useState, useEffect } from 'react'
import { supabase } from '../../../services/supabase'

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true'

// Mocks de tramos de precios (puedes mover esto a un archivo aparte si lo prefieres)
const MOCK_PRICE_TIERS = [
  // Ejemplo de estructura, debes adaptar a tus productos reales
  { product_id: 1, min_quantity: 1, max_quantity: 9, price: 10000 },
  { product_id: 1, min_quantity: 10, max_quantity: 19, price: 9500 },
  { product_id: 2, min_quantity: 1, max_quantity: 4, price: 5000 },
  { product_id: 2, min_quantity: 5, max_quantity: 10, price: 4500 },
  // ...
]

/**
 * Hook para obtener los tramos de precios de un producto.
 * @param {string|number} productId
 */
export function useProductPriceTiers(productId) {
  const [tiers, setTiers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let isMounted = true
    setLoading(true)
    setError(null)

    if (USE_MOCKS) {
      const filtered = MOCK_PRICE_TIERS.filter(
        (t) => t.product_id === productId
      )
      setTiers(filtered)
      setLoading(false)
    } else {      supabase
        .from('product_quantity_ranges')
        .select('*')
        .eq('product_id', productId)
        .order('min_quantity', { ascending: true })
        .then(({ data, error }) => {
          if (!isMounted) return
          if (error) setError(error.message)
          setTiers(data || [])
          setLoading(false)
        })
    }
    return () => {
      isMounted = false
    }
  }, [productId])

  return { tiers, loading, error }
}
