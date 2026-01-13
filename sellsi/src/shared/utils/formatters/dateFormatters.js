/**
 * Formatters unificados para fechas
 * Migrado de features/marketplace/utils/formatters.js
 * Optimizado con singletons Intl para mejor performance
 */

// Singleton Intl.DateTimeFormat para fechas (elimina creaciones repetidas)
const dateFormatter = new Intl.DateTimeFormat('es-CL', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
})

/**
 * Formatea una fecha de forma legible
 * @param {Date|string|null|undefined} date - La fecha a formatear
 * @param {object} [options] - Opciones de formateo (sobrescribe defaults)
 * @returns {string} Fecha formateada o fallback
 * @example
 * formatDate(new Date()) // '10 de enero de 2026'
 * formatDate('2026-01-10') // '10 de enero de 2026'
 * formatDate(null) // 'Fecha no disponible'
 */
export const formatDate = (date, options = {}) => {
  if (!date) return 'Fecha no disponible'

  // Si hay opciones custom, crear formatter específico
  if (Object.keys(options).length > 0) {
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

  // Usar singleton para caso común (optimizado)
  return dateFormatter.format(new Date(date))
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

// Singleton para fecha y hora completa
const dateTimeFormatter = new Intl.DateTimeFormat('es-CL', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
})

/**
 * Formatea fecha y hora completa
 * @param {Date|string|null|undefined} date - La fecha a formatear
 * @returns {string} Fecha y hora formateada o fallback
 * @example
 * formatDateTime(new Date()) // '10 de enero de 2026, 14:30'
 */
export const formatDateTime = (date) => {
  if (!date) return 'Fecha no disponible'
  return dateTimeFormatter.format(new Date(date))
}
