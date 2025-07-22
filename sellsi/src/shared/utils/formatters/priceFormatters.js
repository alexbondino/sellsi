/**
 * Formatters unificados para precios y monedas
 * Migrado de features/marketplace/utils/formatters.js
 */

/**
 * Formatea un precio a la moneda local (CLP)
 */
export const formatPrice = (price) => {
  if (!price && price !== 0) return 'Precio no disponible'

  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price)
}

/**
 * Alias para formatPrice - usado en contextos de currency
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
