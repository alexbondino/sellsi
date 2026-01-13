/**
 * Formatters unificados para precios y monedas
 * Migrado de features/marketplace/utils/formatters.js
 * Optimizado con singletons Intl para mejor performance
 */

// Singleton Intl.NumberFormat para reutilización (elimina 500+ creaciones de instancias)
const currencyFormatter = new Intl.NumberFormat('es-CL', {
  style: 'currency',
  currency: 'CLP',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

/**
 * Formatea un precio a la moneda local (CLP)
 * @param {number|null|undefined} price - El valor a formatear
 * @returns {string} Precio formateado o fallback
 * @example
 * formatPrice(150000) // '$150.000'
 * formatPrice(0) // '$0'
 * formatPrice(null) // 'Precio no disponible'
 */
export const formatPrice = (price) => {
  if (!price && price !== 0) return 'Precio no disponible'
  return currencyFormatter.format(price)
}

/**
 * Alias para formatPrice - usado en contextos de currency
 * @param {number|null|undefined} price - El valor a formatear
 * @returns {string} Precio formateado o fallback
 */
export const formatCurrency = formatPrice

/**
 * Formatea el porcentaje de descuento
 */
export const formatDiscount = (originalPrice, discountedPrice) => {
  if (!originalPrice || !discountedPrice || discountedPrice >= originalPrice) {
    return 0
  }

  const discount = ((originalPrice - discountedPrice) / originalPrice) * 100
  return Math.round(discount)
}
