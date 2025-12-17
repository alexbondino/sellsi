/**
 * useAuthenticatedBuyer hook
 * Extracted from BuyerOrders.jsx for reusability across buyer workspace
 * 
 * Resolves and manages authenticated buyer ID from Supabase Auth
 */

import { useState, useEffect } from 'react'
import { supabase } from '../../../services/supabase'

/**
 * Hook para obtener y resolver el buyer ID autenticado
 * @returns {Object} { buyerId, authResolved, authError, isAuthenticated }
 */
export const useAuthenticatedBuyer = () => {
  const [buyerId, setBuyerId] = useState(null)
  const [authResolved, setAuthResolved] = useState(false)
  const [authError, setAuthError] = useState(null)

  useEffect(() => {
    let isMounted = true

    const resolveBuyerId = async () => {
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser()
        
        if (error) throw error
        
        const authUid = user?.id || null
        
        if (!isMounted) return
        
        setBuyerId(authUid)
        setAuthResolved(true)
        setAuthError(null)
      } catch (e) {
        console.error('[useAuthenticatedBuyer] Error obteniendo usuario Supabase:', e)
        
        if (!isMounted) return
        
        setBuyerId(null)
        setAuthResolved(true)
        setAuthError(e.message || 'Error de autenticación')
      }
    }

    resolveBuyerId()

    return () => {
      isMounted = false
    }
  }, [])

  return {
    buyerId,
    authResolved,
    authError,
    isAuthenticated: !!buyerId
  }
}
