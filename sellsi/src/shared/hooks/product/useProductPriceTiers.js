/**
 * ============================================================================
 * USE PRODUCT PRICE TIERS HOOK - HOOK COMPARTIDO PARA TRAMOS DE PRECIOS
 * ============================================================================
 * 
 * Hook migrado desde domains/marketplace para uso compartido.
 * Evita cross-imports de shared components hacia domains específicos.
 */

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../../services/supabase'
import { QUERY_KEYS } from '../../../utils/queryClient'

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
  const queryClient = useQueryClient()
  const query = useQuery({
    queryKey: ['productPriceTiers', productId],
    enabled: !!productId,
    staleTime: 5 * 60 * 1000, // 5 minutos
    queryFn: async () => {
      if (USE_MOCKS) {
        return MOCK_PRICE_TIERS.filter(t => t.product_id === productId)
      }
      const { data, error } = await supabase
        .from('product_quantity_ranges')
        .select('*')
        .eq('product_id', productId)
        .order('min_quantity', { ascending: true })
      if (error) throw new Error(error.message)
      return data || []
    },
  })

  // Backward compatibility shape expected by existing components:
  // { tiers, loading, error } in addition to full React Query result
  return {
    ...query,
    tiers: query.data || [],
    loading: query.isLoading,
    error: query.error,
  }
}

// Helper para invalidar desde otros módulos
export const invalidateProductPriceTiers = (queryClient, productId) => {
  if (!queryClient) return
  queryClient.invalidateQueries({ queryKey: ['productPriceTiers', productId] })
}

export default useProductPriceTiers
