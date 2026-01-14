/**
 * Formatters unificados para números
 * Migrado de features/marketplace/utils/formatters.js + landing_page
 * Optimizado con singletons Intl para mejor performance
 */

// Singleton Intl.NumberFormat para números (elimina creaciones repetidas)
const numberFormatter = new Intl.NumberFormat('es-CL')

/**
 * Formatea un número con separadores de miles
 * @param {number|null|undefined} number - El número a formatear
 * @returns {string} Número formateado o fallback
 * @example
 * formatNumber(150000) // '150.000'
 * formatNumber(0) // '0'
 * formatNumber(null) // '0'
 */
export const formatNumber = (number) => {
  if (!number && number !== 0) return '0'
  return numberFormatter.format(number)
}

/**
 * Formatea el estado del stock
 */
export const formatStockStatus = (stock) => {
  if (stock === 0) return { label: 'Agotado', color: 'error', severity: 'high' }
  if (stock < 5)
    return { label: 'Stock crítico', color: 'error', severity: 'high' }
  if (stock < 10)
    return { label: 'Stock bajo', color: 'warning', severity: 'medium' }
  if (stock < 50)
    return { label: 'Stock disponible', color: 'info', severity: 'low' }

  return { label: 'En stock', color: 'success', severity: 'none' }
}
