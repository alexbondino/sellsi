/**
 * Pure utilities for price calculations used by usePriceCalculation
 */
import { calculatePriceForQuantity } from '../../../utils/priceCalculation'

export const sumSubtotal = (items = []) => {
  return items.reduce((sum, item) => {
    if (!item) return sum
    if (item.price_tiers && item.price_tiers.length > 0) {
      const price_tiers = item.price_tiers || []
      // ⚠️ CRÍTICO: Convertir a Number para evitar bypass con valores falsy
      const basePrice = Number(item.originalPrice || item.precioOriginal || item.price || item.precio) || 0
      const calculatedPrice = calculatePriceForQuantity(item.quantity, price_tiers, basePrice)
      return sum + calculatedPrice * (item.quantity || 0)
    }
    return sum + (Number(item.price) || 0) * (item.quantity || 0)
  }, 0)
}

export const sumQuantity = (items = []) => items.reduce((c, i) => c + (i?.quantity || 0), 0)

export const computeShippingFromStore = (subtotalAfterDiscount, shippingStore) => {
  if (!shippingStore) return 0
  const fn = shippingStore.getShippingCost
  if (typeof fn === 'function') return fn(subtotalAfterDiscount, [])
  return 0
}

export const computeAdvancedShipping = (items = [], userRegion = null, calculateProductShippingCost) => {
  let shipping = 0
  const byProduct = {}
  let isCalculating = false

  items.forEach(item => {
    const shippingRegions = item.shippingRegions || item.delivery_regions || item.shipping_regions || item.product_delivery_regions || []
    if (userRegion) {
      // If we have user region, compute shipping using the provided calculator for all items
      const itemShipping = calculateProductShippingCost ? calculateProductShippingCost(item, userRegion) : 0
      byProduct[item.id] = Number(itemShipping) || 0
      shipping += Number(itemShipping) || 0
    } else {
      if (!shippingRegions || shippingRegions.length === 0) {
        byProduct[item.id] = 0
        shipping += 0
      } else {
        isCalculating = true
        byProduct[item.id] = 0
        shipping += 0
      }
    }
  })

  return { shipping, byProduct, isCalculating }
}

export const finalizeTotals = ({ subtotalAfterDiscount, shipping = 0, fees = 0, taxes = 0 }) => {
  const total = Number(subtotalAfterDiscount || 0) + Number(shipping || 0) + Number(fees || 0) + Number(taxes || 0)
  return { total }
}

/**
 * Pure compute function that mirrors usePriceCalculation's internal logic.
 * Allows unit testing of pricing calculations without React hooks.
 */
export const computePriceCalculation = (finalItems = [], options = {}, shippingStore = null, calculateProductShippingCost = null) => {
  const {
    includeShipping = true,
    useAdvancedShipping = false,
    productShipping = {},
    realShippingCost = null,
    userRegion = null
  } = options || {}

  const subtotal = sumSubtotal(finalItems)
  const discount = 0
  const subtotalAfterDiscount = subtotal - discount

  let shipping = 0
  let shippingByProduct = {}
  let isShippingCalculating = false

  if (includeShipping) {
    if (realShippingCost !== null) {
      shipping = realShippingCost
    } else if (useAdvancedShipping) {
      const adv = computeAdvancedShipping(finalItems, userRegion, calculateProductShippingCost)
      shipping = adv.shipping
      shippingByProduct = adv.byProduct
      isShippingCalculating = adv.isCalculating
    } else {
      shipping = computeShippingFromStore(subtotalAfterDiscount, shippingStore)
    }
  }

  const total = subtotalAfterDiscount + shipping

  const stats = {
    totalItems: finalItems.length,
    totalQuantity: sumQuantity(finalItems),
    averagePrice: finalItems.length > 0 ? subtotal / (sumQuantity(finalItems) || 1) : 0,
    isEmpty: finalItems.length === 0
  }

  return {
    subtotal,
    discount,
    subtotalAfterDiscount,
    shipping,
    total,
    isShippingCalculating,
    shippingByProduct,
    stats,
    totalItems: stats.totalItems,
    totalQuantity: stats.totalQuantity,
    averagePrice: stats.averagePrice,
    isEmpty: stats.isEmpty
  }
}

export default {
  sumSubtotal,
  sumQuantity,
  computeShippingFromStore,
  computeAdvancedShipping,
  finalizeTotals
}
