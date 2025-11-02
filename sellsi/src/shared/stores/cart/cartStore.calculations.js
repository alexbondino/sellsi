/**
 * ============================================================================
 * CART STORE CALCULATIONS - LÓGICA DE CÁLCULOS
 * ============================================================================
 *
 * Todas las funciones de cálculo del carrito extraídas del cartStore.js original.
 * Maneja subtotales, descuentos, costos de envío y totales.
 */

import { calculatePriceForQuantity } from '../../../utils/priceCalculation';

/**
 * Calcula el subtotal del carrito basado en los items
 * @param {Array} items - Items del carrito
 * @returns {number} Subtotal calculado
 */
export const calculateSubtotal = items => {
  return items.reduce((sum, item) => {
    // Para productos con precio por tramos, usar el precio calculado
    if (item.price_tiers && item.price_tiers.length > 0) {
      const price_tiers = item.price_tiers || [];
      const basePrice =
        item.originalPrice ||
        item.precioOriginal ||
        item.price ||
        item.precio ||
        0;
      const calculatedPrice = calculatePriceForQuantity(
        item.quantity,
        price_tiers,
        basePrice
      );
      return sum + calculatedPrice * item.quantity;
    }

    // Para productos sin precio por tramos, usar el precio normal
    return sum + item.price * item.quantity;
  }, 0);
};

/**
 * Calcula el descuento total (deshabilitado)
 * @param {number} subtotal - Subtotal del carrito
 * @returns {number} Descuento total
 */
export const calculateDiscount = subtotal => {
  return 0;
};

/**
 * Calcula el costo de envío usando el store de envío
 * @param {number} subtotal - Subtotal del carrito
 * @param {Array} appliedCoupons - Cupones aplicados
 * @param {Object} shippingStore - Store de envío
 * @returns {number} Costo de envío
 */
export const calculateShippingCost = (
  subtotal,
  appliedCoupons,
  shippingStore
) => {
  return shippingStore.getShippingCost(subtotal, appliedCoupons);
};

/**
 * Calcula el total final del carrito
 * @param {number} subtotal - Subtotal del carrito
 * @param {number} discount - Descuento aplicado
 * @param {number} shipping - Costo de envío
 * @returns {number} Total final
 */
export const calculateTotal = (subtotal, discount, shipping) => {
  return subtotal - discount + shipping;
};

/**
 * Calcula el número total de items en el carrito
 * @param {Array} items - Items del carrito
 * @returns {number} Cantidad total de items
 */
export const calculateItemCount = items => {
  return items.reduce((count, item) => count + item.quantity, 0);
};

/**
 * Calcula estadísticas del carrito
 * @param {Array} items - Items del carrito
 * @param {number} subtotal - Subtotal del carrito
 * @returns {Object} Estadísticas del carrito
 */
export const calculateStats = (items, subtotal) => {
  const totalItems = items.length;
  const totalQuantity = calculateItemCount(items);
  const averagePrice = totalItems > 0 ? subtotal / totalQuantity : 0;

  return {
    totalItems,
    totalQuantity,
    totalValue: subtotal,
    averagePrice,
  };
};
