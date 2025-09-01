/**
 * ============================================================================
 * USE PRICE CALCULATION HOOK - CÁLCULOS UNIFICADOS DEL CARRITO
 * ============================================================================
 *
 * Hook personalizado que unifica todos los cálculos de precio del carrito
 * incluyendo subtotal, descuentos, envío y totales finales.
 * 
 * Reemplaza la lógica dispersa en BuyerCart.jsx con una API limpia y memoizada.
 */

import { useMemo } from 'react'
import useCartStore from './cartStore'
import useShipping from './useShipping'
import { calculatePriceForQuantity } from '../../../utils/priceCalculation'
import { calculateProductShippingCost } from '../../../utils/shippingCalculation'
import {
  sumSubtotal,
  sumQuantity,
  computeShippingFromStore,
  computeAdvancedShipping,
  finalizeTotals
} from './priceCalculationUtils'

/**
 * Hook principal para todos los cálculos de precio del carrito
 * @param {Array} items - Items del carrito (opcional, se obtiene del store si no se pasa)
 * @param {Object} options - Opciones adicionales de cálculo
 * @returns {Object} Objeto con todos los cálculos de precio
 */
export const usePriceCalculation = (items = null, options = {}) => {
  // ===== STORES =====
  const cartItems = useCartStore(state => state.items)
  const finalItems = items || cartItems
  
  const shippingStore = useShipping()
  
  // ===== OPCIONES =====
  const {
    includeShipping = true,
    useAdvancedShipping = false,
    productShipping = {},
    realShippingCost = null,
    userRegion = null, // Nueva opción para región del usuario
    // Variables de cupones deshabilitadas
    appliedCoupons = [] // Funcionalidad deshabilitada
  } = options

  // ===== CÁLCULOS MEMOIZADOS =====
  const calculations = useMemo(() => {
  // 1. SUBTOTAL - use pure util
  const subtotal = sumSubtotal(finalItems)

    // 2. DESCUENTOS - Funcionalidad deshabilitada
    const discount = 0

    // 3. SUBTOTAL DESPUÉS DE DESCUENTOS
    const subtotalAfterDiscount = subtotal - discount

    // 4. CÁLCULO DE ENVÍO
    let shipping = 0
    let shippingByProduct = {}
    let isShippingCalculating = false

    if (includeShipping) {
      if (realShippingCost !== null) {
        // Usar costo real calculado externamente (modo avanzado)
        shipping = realShippingCost
      } else if (useAdvancedShipping) {
        // Modo avanzado: cálculo por producto usando datos reales
  const adv = computeAdvancedShipping(finalItems, userRegion, calculateProductShippingCost)
  shipping = adv.shipping
  shippingByProduct = adv.byProduct
  isShippingCalculating = adv.isCalculating
      } else {
        // Modo simple: cálculo unificado
  shipping = computeShippingFromStore(subtotalAfterDiscount, shippingStore)
      }
    }

    // 5. TOTAL FINAL
    const total = subtotalAfterDiscount + shipping

    // 6. ESTADÍSTICAS ADICIONALES
    const stats = {
      totalItems: finalItems.length,
      totalQuantity: sumQuantity(finalItems),
      averagePrice: finalItems.length > 0 ? subtotal / (sumQuantity(finalItems) || 1) : 0,
      isEmpty: finalItems.length === 0
    }

    return {
      // Valores principales
      subtotal,
      discount,
      subtotalAfterDiscount,
      shipping,
      total,
      
      // Estados de cálculo
      isShippingCalculating,
      
      // Detalles de envío
      shippingByProduct,
      
      // Estadísticas
      stats,
      
      // Valores individuales para compatibilidad
      totalItems: stats.totalItems,
      totalQuantity: stats.totalQuantity,
      averagePrice: stats.averagePrice,
      isEmpty: stats.isEmpty
    }
  }, [
    finalItems, 
    shippingStore, 
    includeShipping, 
    useAdvancedShipping, 
    productShipping, 
    realShippingCost, 
    userRegion // Agregar userRegion a las dependencias
  ])

  return calculations
}

/**
 * Hook simplificado para cálculos básicos (backward compatibility)
 * @param {Array} items - Items del carrito
 * @returns {Object} Cálculos básicos del carrito
 */
export const useBasicPriceCalculation = (items = null) => {
  return usePriceCalculation(items, { 
    includeShipping: false 
  })
}

/**
 * Hook para cálculos con envío avanzado
 * @param {Array} items - Items del carrito
 * @param {Object} productShipping - Configuración de envío por producto (DEPRECATED)
 * @param {number} realShippingCost - Costo real calculado externamente
 * @param {string} userRegion - Región del usuario para cálculos reales
 * @returns {Object} Cálculos completos con envío avanzado
 */
export const useAdvancedPriceCalculation = (items = null, productShipping = {}, realShippingCost = null, userRegion = null) => {
  return usePriceCalculation(items, {
    includeShipping: true,
    useAdvancedShipping: true,
    productShipping,
    realShippingCost,
    userRegion
  })
}

/**
 * Hook para solo estadísticas del carrito (sin cálculos de precio)
 * @param {Array} items - Items del carrito
 * @returns {Object} Solo estadísticas del carrito
 */
export const useCartStats = (items = null) => {
  const cartItems = useCartStore(state => state.items)
  const finalItems = items || cartItems
  
  return useMemo(() => ({
    totalItems: finalItems.length,
    totalQuantity: finalItems.reduce((count, item) => count + item.quantity, 0),
    isEmpty: finalItems.length === 0,
    hasItems: finalItems.length > 0
  }), [finalItems])
}

export default usePriceCalculation
