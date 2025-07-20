/**
 * ============================================================================
 * CART STORE HELPERS - FUNCIONES PURAS Y UTILITARIAS
 * ============================================================================
 *
 * Funciones puras extraídas del cartStore.js original.
 * No dependen del estado del store y pueden ser testeadas independientemente.
 */

import { validateQuantity, sanitizeCartItems, QUANTITY_LIMITS } from '../../../utils/quantityValidation'
import { CART_CONFIG } from './cartStore.constants'

/**
 * Valida y limita cantidades para evitar overflow de base de datos
 * @param {number} quantity - Cantidad a validar
 * @param {number} min - Valor mínimo permitido (default: 1)
 * @param {number} max - Valor máximo permitido (default: 15000)
 * @returns {number} Cantidad validada y limitada
 */
export const validateCartQuantity = (quantity, min = CART_CONFIG.MIN_QUANTITY, max = QUANTITY_LIMITS.MAX) => {
  return validateQuantity(quantity, min, max);
}

/**
 * Prepara un item del carrito con todos los campos necesarios
 * @param {Object} product - Producto a agregar
 * @param {number} quantity - Cantidad a agregar
 * @returns {Object} Item preparado para el carrito
 */
export const prepareCartItem = (product, quantity) => {
  const safeQuantity = validateCartQuantity(quantity)
  
  // Asegurarse de que la imagen principal esté presente
  const image = product.imagen || product.image || '/placeholder-product.jpg'
  
  // Asegurar que el nombre del proveedor esté presente (no el ID)
  const supplier = product.proveedor || product.supplier || 'Proveedor no especificado'
  
  // ===== REFORZAR CAMPOS price_tiers Y minimum_purchase =====
  const basePrice = product.precio || product.price || 0
  
  // Usar price_tiers solo si es un array válido y no vacío
  const price_tiers = (Array.isArray(product.price_tiers) && product.price_tiers.length > 0)
    ? product.price_tiers
    : (Array.isArray(product.priceTiers) && product.priceTiers.length > 0)
      ? product.priceTiers
      : [{ min_quantity: 1, price: basePrice }]
      
  const minimum_purchase = product.minimum_purchase || product.compraMinima || 1

  return {
    ...product,
    image,
    supplier, // ✅ Asegurar que se use el nombre, no el ID
    quantity: safeQuantity,
    price_tiers,
    minimum_purchase,
    addedAt: new Date().toISOString(),
  }
}

/**
 * Limpia y valida items del carrito local para remover datos corruptos
 * @param {Array} items - Items del carrito a validar
 * @returns {Array} Items válidos
 */
export const cleanLocalCartItems = (items) => {
  const result = sanitizeCartItems(items);
  
  // Log removido para producción
  
  return result.validItems;
}
