/**
 * Formatters unificados para números
 * Migrado de features/marketplace/utils/formatters.js + landing_page
 */

/**
 * Formatea un número con separadores de miles
 */
export const formatNumber = (number) => {
  if (!number && number !== 0) return '0'

  return new Intl.NumberFormat('es-CL').format(number)
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
