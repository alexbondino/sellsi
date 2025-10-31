/**
 * 💰 Servicio de Liberación de Pagos a Proveedores
 * 
 * Gestiona todas las operaciones relacionadas con la liberación de pagos
 * después de que los proveedores confirman entregas:
 * - Consultar payment_releases (pendientes y liberados)
 * - Liberar pagos a proveedores
 * - Obtener estadísticas de pagos
 * - Cancelar liberaciones
 * 
 * @author Panel Administrativo Sellsi
 * @date 28 de Octubre de 2025
 */

import { AdminApiService, AUDIT_ACTIONS } from './adminApiService'
import { supabase } from '../../../services/supabase'

// ========================================
// 🎨 CONSTANTES DE ESTADO
// ========================================

/**
 * Estados posibles de payment_releases
 */
export const STATUS = {
  PENDING: 'pending',
  RELEASED: 'released',
  CANCELLED: 'cancelled'
}

/**
 * Colores de Material-UI para cada estado
 */
export const STATUS_COLORS = {
  pending: 'warning',
  released: 'success',
  cancelled: 'error'
}

/**
 * Labels en español para cada estado
 */
export const STATUS_LABELS = {
  pending: 'Pendiente',
  released: 'Liberado',
  cancelled: 'Cancelado'
}

// ========================================
// 📋 GESTIÓN DE PAYMENT RELEASES - CONSULTA
// ========================================

/**
 * Obtener todas las solicitudes de liberación de pago
 * @param {object} filters - Filtros opcionales (status, supplier, dateFrom, dateTo)
 * @returns {Promise<{success: boolean, data?: array, error?: string}>}
 */
export const getPaymentReleases = async (filters = {}) => {
  return AdminApiService.executeQuery(async () => {
    // Sanitizar filtros
    const allowedFilters = ['status', 'supplier', 'dateFrom', 'dateTo', 'supplier_id']
    const sanitizedFilters = AdminApiService.sanitizeFilters(filters, allowedFilters)
    
    // Consulta usando la vista con detalles enriquecidos
    let query = supabase
      .from('payment_releases_with_details')
      .select('*')
    
    // Aplicar filtros
    if (sanitizedFilters.status && sanitizedFilters.status !== 'all') {
      query = query.eq('status', sanitizedFilters.status)
    }
    
    if (sanitizedFilters.supplier_id) {
      query = query.eq('supplier_id', sanitizedFilters.supplier_id)
    }
    
    if (sanitizedFilters.supplier) {
      query = query.ilike('supplier_name', `%${sanitizedFilters.supplier}%`)
    }
    
    if (sanitizedFilters.dateFrom) {
      query = query.gte('delivery_confirmed_at', sanitizedFilters.dateFrom)
    }
    
    if (sanitizedFilters.dateTo) {
      query = query.lte('delivery_confirmed_at', sanitizedFilters.dateTo)
    }
    
    // Ordenar por fecha de entrega (más recientes primero)
    const { data, error } = await query.order('delivery_confirmed_at', { ascending: false })
    
    if (error) {
      console.error('Error al cargar payment releases:', error)
      throw new Error('Error al cargar solicitudes de liberación')
    }
    
    return data || []
  }, 'Error al cargar solicitudes de liberación de pago')
}

/**
 * Obtener detalles de una liberación específica
 * @param {string} releaseId - ID de la liberación
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const getPaymentReleaseDetails = async (releaseId) => {
  return AdminApiService.executeQuery(async () => {
    if (!releaseId) {
      throw new Error('ID de liberación es requerido')
    }

    const { data, error } = await supabase
      .from('payment_releases_with_details')
      .select('*')
      .eq('id', releaseId)
      .single()
    
    if (error) {
      console.error('Error al obtener detalles:', error)
      throw new Error('Liberación no encontrada')
    }
    
    return data
  }, 'Error obteniendo detalles de la liberación')
}

// ========================================
// ✅ LIBERACIÓN DE PAGOS
// ========================================

/**
 * Liberar pago a un proveedor
 * @param {string} releaseId - ID de la liberación
 * @param {string} adminId - ID del administrador que libera
 * @param {string} notes - Notas administrativas (opcional)
 * @param {string} proofUrl - URL del comprobante de pago (opcional)
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const releasePayment = async (releaseId, adminId, notes = null, proofUrl = null) => {
  return AdminApiService.executeQuery(async () => {
    if (!releaseId || !adminId) {
      throw new Error('ID de liberación y administrador son requeridos')
    }

    // Validar URL si se proporciona
    if (proofUrl && !_isValidUrl(proofUrl)) {
      throw new Error('URL del comprobante no es válida')
    }

    // Llamar a la RPC function que maneja toda la lógica
    const { data, error } = await supabase.rpc('release_supplier_payment', {
      p_payment_release_id: releaseId,
      p_admin_id: adminId,
      p_admin_notes: notes,
      p_payment_proof_url: proofUrl
    })

    if (error) {
      console.error('Error al liberar pago:', error)
      
      // Manejar errores específicos
      if (error.message?.includes('ADMIN_NOT_FOUND')) {
        throw new Error('Administrador no encontrado o inactivo')
      } else if (error.message?.includes('RELEASE_NOT_FOUND')) {
        throw new Error('Registro de liberación no encontrado')
      } else if (error.message?.includes('INVALID_STATUS')) {
        throw new Error('El pago ya fue procesado')
      } else if (error.message?.includes('CONCURRENT_ACCESS')) {
        throw new Error('Otro admin está procesando esta liberación. Intenta nuevamente.')
      } else if (error.message?.includes('INVALID_URL')) {
        throw new Error('La URL del comprobante no es válida')
      } else {
        throw new Error(error.message || 'Error al liberar pago')
      }
    }

    // data contiene el resultado exitoso del RPC
    return data
  }, 'Error al liberar pago')
}

/**
 * Cancelar una liberación de pago pendiente
 * @param {string} releaseId - ID de la liberación
 * @param {string} adminId - ID del administrador
 * @param {string} reason - Motivo de cancelación
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const cancelPaymentRelease = async (releaseId, adminId, reason) => {
  return AdminApiService.executeQuery(async () => {
    if (!releaseId || !adminId || !reason) {
      throw new Error('Todos los parámetros son requeridos')
    }

    if (reason.trim().length < 10) {
      throw new Error('El motivo debe tener al menos 10 caracteres')
    }

    // Llamar a la RPC function
    const { data, error } = await supabase.rpc('cancel_supplier_payment_release', {
      p_payment_release_id: releaseId,
      p_admin_id: adminId,
      p_cancel_reason: reason.trim()
    })

    if (error) {
      console.error('Error al cancelar liberación:', error)
      throw new Error(error.message || 'Error al cancelar liberación')
    }

    return data
  }, 'Error al cancelar liberación de pago')
}

// ========================================
// 📊 ESTADÍSTICAS Y REPORTES
// ========================================

/**
 * Obtener estadísticas de liberaciones de pago
 * @param {object} filters - Filtros de fecha opcionales
 * @returns {Promise<{success: boolean, stats?: object, error?: string}>}
 */
export const getPaymentReleaseStats = async (filters = {}) => {
  return AdminApiService.executeQuery(async () => {
    // Construir query base
    let query = supabase
      .from('payment_releases')
      .select('status, amount, currency, delivery_confirmed_at, payment_received_at')

    // Aplicar filtros de fecha
    if (filters.dateFrom) {
      query = query.gte('delivery_confirmed_at', filters.dateFrom)
    }
    
    if (filters.dateTo) {
      query = query.lte('delivery_confirmed_at', filters.dateTo)
    }

    const { data: releases, error } = await query

    if (error) {
      console.error('Error al cargar estadísticas:', error)
      throw new Error('Error al cargar estadísticas')
    }

    // Calcular estadísticas
    const stats = {
      total: releases.length,
      pending_release: releases.filter(r => r.status === 'pending_release').length,
      released: releases.filter(r => r.status === 'released').length,
      cancelled: releases.filter(r => r.status === 'cancelled').length,
      disputed: releases.filter(r => r.status === 'disputed').length,
      
      // Montos totales
      total_amount: releases.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0),
      pending_amount: releases
        .filter(r => r.status === 'pending_release')
        .reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0),
      released_amount: releases
        .filter(r => r.status === 'released')
        .reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0),
      
      // Promedios
      avg_amount: releases.length > 0 
        ? releases.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0) / releases.length 
        : 0,
      
      // Tiempo promedio de procesamiento (para liberados)
      avg_days_to_release: (() => {
        const releasedItems = releases.filter(r => r.status === 'released')
        if (releasedItems.length === 0) return 0
        
        const totalDays = releasedItems.reduce((sum, r) => {
          const delivered = new Date(r.delivery_confirmed_at)
          const released = new Date(r.released_at || delivered)
          const days = Math.floor((released - delivered) / (1000 * 60 * 60 * 24))
          return sum + days
        }, 0)
        
        return Math.round(totalDays / releasedItems.length)
      })()
    }
    
    return stats
  }, 'Error al cargar estadísticas de liberaciones')
}

/**
 * Obtener reporte de liberaciones por período
 * @param {string} startDate - Fecha de inicio (YYYY-MM-DD)
 * @param {string} endDate - Fecha de fin (YYYY-MM-DD)
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const getPaymentReleasesReport = async (startDate, endDate) => {
  return AdminApiService.executeQuery(async () => {
    if (!startDate || !endDate) {
      throw new Error('Fechas de inicio y fin son requeridas')
    }

    if (new Date(startDate) > new Date(endDate)) {
      throw new Error('Fecha de inicio no puede ser mayor a fecha de fin')
    }

    // Obtener datos con la vista enriquecida
    const { data: releases, error } = await supabase
      .from('payment_releases_with_details')
      .select('*')
      .gte('delivery_confirmed_at', startDate)
      .lte('delivery_confirmed_at', endDate)
      .order('delivery_confirmed_at', { ascending: true })

    if (error) {
      console.error('Error generando reporte:', error)
      throw new Error('Error generando reporte')
    }

    // Calcular resumen
    const summary = {
      total_releases: releases.length,
      total_amount: releases.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0),
      avg_amount: releases.length > 0 
        ? releases.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0) / releases.length 
        : 0,
      
      by_status: {
        pending_release: releases.filter(r => r.status === 'pending_release').length,
        released: releases.filter(r => r.status === 'released').length,
        cancelled: releases.filter(r => r.status === 'cancelled').length,
        disputed: releases.filter(r => r.status === 'disputed').length
      },
      
      by_supplier: (() => {
        const supplierMap = {}
        releases.forEach(r => {
          const key = r.supplier_id
          if (!supplierMap[key]) {
            supplierMap[key] = {
              supplier_id: r.supplier_id,
              supplier_name: r.supplier_name || 'Desconocido',
              count: 0,
              total_amount: 0
            }
          }
          supplierMap[key].count++
          supplierMap[key].total_amount += parseFloat(r.amount) || 0
        })
        return Object.values(supplierMap).sort((a, b) => b.total_amount - a.total_amount)
      })()
    }

    return {
      period: { start: startDate, end: endDate },
      summary,
      releases
    }
  }, 'Error generando reporte de liberaciones')
}

// ========================================
// 🔧 FUNCIONES AUXILIARES PRIVADAS
// ========================================

/**
 * Validar si una URL es válida
 * @private
 * @param {string} url - URL a validar
 * @returns {boolean}
 */
function _isValidUrl(url) {
  try {
    const urlObj = new URL(url)
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:'
  } catch {
    return false
  }
}

/**
 * Formatear monto en CLP
 * @param {number} amount - Monto a formatear
 * @returns {string}
 */
export const formatCLP = (amount) => {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0
  }).format(amount)
}

/**
 * Formatear fecha en formato local
 * @param {string|Date} date - Fecha a formatear
 * @returns {string}
 */
export const formatDate = (date) => {
  if (!date) return 'N/A'
  return new Date(date).toLocaleDateString('es-CL', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * Calcular días entre dos fechas
 * @param {string|Date} startDate - Fecha de inicio
 * @param {string|Date} endDate - Fecha de fin
 * @returns {number}
 */
export const daysBetween = (startDate, endDate) => {
  if (!startDate || !endDate) return 0
  const start = new Date(startDate)
  const end = new Date(endDate)
  return Math.floor((end - start) / (1000 * 60 * 60 * 24))
}

// ========================================
// 🔍 VALIDACIONES
// ========================================

/**
 * Validar datos de liberación de pago
 * @param {object} data - Datos a validar
 * @returns {{valid: boolean, errors: Array<string>}}
 */
export const validateReleaseData = (data) => {
  const errors = []
  
  if (!data) {
    errors.push('Datos de liberación son requeridos')
    return { valid: false, errors }
  }
  
  if (!data.releaseId) {
    errors.push('ID de liberación es requerido')
  }
  
  if (!data.adminId) {
    errors.push('ID de administrador es requerido')
  }
  
  if (data.proofUrl && !_isValidUrl(data.proofUrl)) {
    errors.push('URL del comprobante no es válida')
  }
  
  if (data.notes && data.notes.length > 1000) {
    errors.push('Las notas no pueden exceder 1000 caracteres')
  }
  
  return { valid: errors.length === 0, errors }
}

/**
 * Validar filtros de búsqueda
 * @param {object} filters - Filtros a validar
 * @returns {{valid: boolean, errors: Array<string>}}
 */
export const validateFilters = (filters) => {
  const errors = []
  
  if (!filters) {
    return { valid: true, errors: [] }
  }
  
  const validStatuses = ['pending_release', 'released', 'cancelled', 'disputed', 'all']
  if (filters.status && !validStatuses.includes(filters.status)) {
    errors.push(`Estado inválido. Debe ser uno de: ${validStatuses.join(', ')}`)
  }
  
  if (filters.dateFrom && filters.dateTo) {
    const from = new Date(filters.dateFrom)
    const to = new Date(filters.dateTo)
    if (from > to) {
      errors.push('Fecha de inicio no puede ser mayor a fecha de fin')
    }
  }
  
  return { valid: errors.length === 0, errors }
}
