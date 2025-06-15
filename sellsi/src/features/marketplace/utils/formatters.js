/**
 * Utilidades para formateo de datos en el marketplace
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
 * Formatea un número con separadores de miles
 */
export const formatNumber = (number) => {
  if (!number && number !== 0) return '0'

  return new Intl.NumberFormat('es-CL').format(number)
}

/**
 * Formatea una fecha de forma legible
 */
export const formatDate = (date, options = {}) => {
  if (!date) return 'Fecha no disponible'

  const defaultOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }

  return new Date(date).toLocaleDateString('es-CL', {
    ...defaultOptions,
    ...options,
  })
}

/**
 * Formatea una fecha de forma relativa (hace X tiempo)
 */
export const formatRelativeDate = (date) => {
  if (!date) return 'Fecha no disponible'

  const now = new Date()
  const targetDate = new Date(date)
  const diffInSeconds = Math.floor((now - targetDate) / 1000)

  if (diffInSeconds < 60) return 'hace unos segundos'
  if (diffInSeconds < 3600)
    return `hace ${Math.floor(diffInSeconds / 60)} minutos`
  if (diffInSeconds < 86400)
    return `hace ${Math.floor(diffInSeconds / 3600)} horas`
  if (diffInSeconds < 2592000)
    return `hace ${Math.floor(diffInSeconds / 86400)} días`
  if (diffInSeconds < 31536000)
    return `hace ${Math.floor(diffInSeconds / 2592000)} meses`

  return `hace ${Math.floor(diffInSeconds / 31536000)} años`
}

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
