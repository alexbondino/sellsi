/**
 * Formatters unificados para fechas
 * Migrado de features/marketplace/utils/formatters.js
 */

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
 * Formatea fecha y hora completa
 */
export const formatDateTime = (date) => {
  if (!date) return 'Fecha no disponible'
  
  return new Date(date).toLocaleDateString('es-CL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
