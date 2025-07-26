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
import useCoupons from './useCoupons'
import useShipping from './useShipping'
import { calculatePriceForQuantity } from '../../../utils/priceCalculation'
import { calculateProductShippingCost } from '../../../utils/shippingCalculation'

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
  
  const couponsStore = useCoupons()
  const shippingStore = useShipping()
  
  // ===== OPCIONES =====
  const {
    includeShipping = true,
    useAdvancedShipping = false,
    productShipping = {},
    realShippingCost = null,
    userRegion = null, // Nueva opción para región del usuario
    appliedCoupons = couponsStore.appliedCoupons || []
  } = options

  // ===== CÁLCULOS MEMOIZADOS =====
  const calculations = useMemo(() => {
    // 1. SUBTOTAL - Con soporte para price tiers
    const subtotal = finalItems.reduce((sum, item) => {
      // Para productos con precio por tramos
      if (item.price_tiers && item.price_tiers.length > 0) {
        const price_tiers = item.price_tiers || []
        const basePrice = item.originalPrice || item.precioOriginal || item.price || item.precio || 0
        const calculatedPrice = calculatePriceForQuantity(item.quantity, price_tiers, basePrice)
        return sum + calculatedPrice * item.quantity
      }
      
      // Para productos sin precio por tramos
      return sum + (item.price || 0) * item.quantity
    }, 0)

    // 2. DESCUENTOS - Usando store de cupones
    const discount = couponsStore.getDiscount ? couponsStore.getDiscount(subtotal) : 0

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
        if (userRegion) {
          // Con región del usuario: calcular normalmente
          finalItems.forEach(item => {
            const itemShipping = calculateProductShippingCost(item, userRegion)
            shippingByProduct[item.id] = itemShipping
            shipping += itemShipping
          })
        } else {
          // Sin región del usuario: calcular lo que se pueda y marcar como calculando si es necesario
          let hasProductsNeedingRegion = false
          
          finalItems.forEach(item => {
            // Verificar si el producto tiene información de regiones de envío
            const shippingRegions = item.shippingRegions || 
                                   item.delivery_regions || 
                                   item.shipping_regions || 
                                   item.product_delivery_regions || 
                                   [];
            
            if (!shippingRegions || shippingRegions.length === 0) {
              // Sin información de envío: costo 0
              shippingByProduct[item.id] = 0
              shipping += 0
            } else {
              // Tiene información de envío pero no sabemos la región del usuario
              hasProductsNeedingRegion = true
              shippingByProduct[item.id] = 0 // Temporal hasta obtener región
              shipping += 0
            }
          })
          
          // Solo mostrar "calculando" si hay productos que necesitan la región
          isShippingCalculating = hasProductsNeedingRegion
        }
      } else {
        // Modo simple: cálculo unificado
        shipping = shippingStore.getShippingCost ? 
          shippingStore.getShippingCost(subtotalAfterDiscount, appliedCoupons) : 0
      }
    }

    // 5. TOTAL FINAL
    const total = subtotalAfterDiscount + shipping

    // 6. ESTADÍSTICAS ADICIONALES
    const stats = {
      totalItems: finalItems.length,
      totalQuantity: finalItems.reduce((count, item) => count + item.quantity, 0),
      averagePrice: finalItems.length > 0 ? subtotal / finalItems.reduce((count, item) => count + item.quantity, 0) : 0,
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
    couponsStore, 
    shippingStore, 
    includeShipping, 
    useAdvancedShipping, 
    productShipping, 
    realShippingCost, 
    userRegion, // Agregar userRegion a las dependencias
    appliedCoupons
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
