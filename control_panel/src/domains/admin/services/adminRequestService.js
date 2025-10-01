/**
 * 📋 Servicio de Gestión de Solicitudes
 * 
 * Gestiona todas las operaciones relacionadas con solicitudes y pagos:
 * - Obtener solicitudes con filtros
 * - Confirmar pagos
 * - Rechazar pagos
 * - Procesar devoluciones
 * - Notificaciones a compradores
 * 
 * @author Panel Administrativo Sellsi
 * @date 21 de Julio de 2025 - Migrado a domains/admin/services/
 */

import { AdminApiService, AUDIT_ACTIONS } from './adminApiService'
import { supabase } from '../../../services/supabase'

// ========================================
// 📋 GESTIÓN DE SOLICITUDES - CONSULTA
// ========================================

/**
 * Obtener todas las solicitudes para el panel administrativo
 * @param {object} filters - Filtros opcionales (estado, fecha, proveedor, etc.)
 * @returns {Promise<{success: boolean, data?: array, error?: string}>}
 */
export const getSolicitudes = async (filters = {}) => {
  return AdminApiService.executeQuery(async () => {
    // Sanitizar filtros
    const allowedFilters = ['estado', 'fechaDesde', 'fechaHasta', 'proveedor', 'comprador']
    const sanitizedFilters = AdminApiService.sanitizeFilters(filters, allowedFilters)
    
    // Consulta real a la base de datos
    let query = supabase
      .from('control_panel')
      .select(`
        *,
        requests:request_id (
          buyer_id,
          total_sale,
          request_dt,
          delivery_dt
        )
      `)
    
    if (sanitizedFilters.estado) {
      query = query.eq('estado', sanitizedFilters.estado)
    }
    
    if (sanitizedFilters.fechaDesde) {
      query = query.gte('fecha_solicitada', sanitizedFilters.fechaDesde)
    }
    
    if (sanitizedFilters.fechaHasta) {
      query = query.lte('fecha_solicitada', sanitizedFilters.fechaHasta)
    }
    
    if (sanitizedFilters.proveedor) {
      query = query.ilike('proveedor', `%${sanitizedFilters.proveedor}%`)
    }
    
    const { data, error } = await query.order('created_at', { ascending: false })
    
    if (error) {
      throw new Error('Error al cargar solicitudes')
    }
    
    return data
    
    // Datos mock eliminados - ahora usando datos reales
    // Los datos vienen de la consulta SQL real arriba
  }, 'Error al cargar solicitudes')
}

/**
 * Obtener detalles de una solicitud específica
 * @param {string} solicitudId - ID de la solicitud
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const getSolicitudDetails = async (solicitudId) => {
  return AdminApiService.executeQuery(async () => {
    if (!solicitudId) {
      throw new Error('ID de solicitud es requerido')
    }

    // Consulta real a la base de datos
    const { data, error } = await supabase
      .from('control_panel')
      .select(`
        *,
        requests:request_id (*)
      `)
      .eq('id', solicitudId)
      .single()
    
    if (error) {
      throw new Error('Solicitud no encontrada')
    }
    
    return data
  }, 'Error obteniendo detalles de la solicitud')
}

// ========================================
// ✅ CONFIRMACIÓN DE PAGOS
// ========================================

/**
 * Confirmar pago de una solicitud
 * @param {string} solicitudId - ID de la solicitud
 * @param {object} datos - Datos de confirmación (comprobante, etc.)
 * @param {string} adminId - ID del administrador que confirma
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const confirmarPago = async (solicitudId, datos, adminId) => {
  return AdminApiService.executeQuery(async () => {
    if (!solicitudId || !adminId) {
      throw new Error('ID de solicitud y administrador son requeridos')
    }

    // Validar datos de entrada
    if (datos.comprobante_url && !_isValidUrl(datos.comprobante_url)) {
      throw new Error('URL del comprobante no es válida')
    }

    // Actualizar en la base de datos
    const { error } = await supabase
      .from('control_panel')
      .update({
        estado: 'confirmado',
        comprobante_pago: datos.comprobante_url,
        updated_at: new Date().toISOString(),
        procesado_por: adminId
      })
      .eq('id', solicitudId)
    
    if (error) {
      throw new Error('Error al confirmar pago')
    }

    // Registrar acción en auditoría
    await AdminApiService.logAuditAction(adminId, AUDIT_ACTIONS.CONFIRM_REQUEST, solicitudId, {
      comprobante_url: datos.comprobante_url,
      notes: datos.notes || null,
      confirmation_time: new Date().toISOString()
    })

    // Enviar notificación al comprador (si está implementado)
    if (datos.notifyBuyer && datos.compradorEmail) {
      try {
        await _sendPaymentConfirmationNotification(datos.compradorEmail, solicitudId, datos)
      } catch (error) {
        console.warn('Error enviando notificación:', error)
        // No fallar la operación principal por error de notificación
      }
    }

    return { confirmed: true }
  }, 'Error al confirmar pago')
}

// ========================================
// ❌ RECHAZO DE PAGOS
// ========================================

/**
 * Rechazar pago de una solicitud
 * @param {string} solicitudId - ID de la solicitud
 * @param {object} datos - Datos de rechazo (motivo, adjuntos, etc.)
 * @param {string} adminId - ID del administrador que rechaza
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const rechazarPago = async (solicitudId, datos, adminId) => {
  return AdminApiService.executeQuery(async () => {
    if (!solicitudId || !adminId) {
      throw new Error('ID de solicitud y administrador son requeridos')
    }

    if (!datos.motivo || datos.motivo.trim().length < 5) {
      throw new Error('Motivo de rechazo es requerido (mínimo 5 caracteres)')
    }

    // Validar URLs de adjuntos si existen
    if (datos.adjuntos_urls && Array.isArray(datos.adjuntos_urls)) {
      for (const url of datos.adjuntos_urls) {
        if (!_isValidUrl(url)) {
          throw new Error('Una o más URLs de adjuntos no son válidas')
        }
      }
    }

    // Actualizar en la base de datos
    const { error } = await supabase
      .from('control_panel')
      .update({
        estado: 'rechazado',
        notas_admin: datos.motivo.trim(),
        updated_at: new Date().toISOString(),
        procesado_por: adminId
      })
      .eq('id', solicitudId)
    
    if (error) {
      throw new Error('Error al rechazar pago')
    }

    // Registrar acción en auditoría
    await AdminApiService.logAuditAction(adminId, AUDIT_ACTIONS.REJECT_REQUEST, solicitudId, {
      motivo: datos.motivo.trim(),
      adjuntos_urls: datos.adjuntos_urls || [],
      rejection_time: new Date().toISOString()
    })

    // Enviar notificación al comprador (si está implementado)
    if (datos.notifyBuyer && datos.compradorEmail) {
      try {
        await _sendPaymentRejectionNotification(datos.compradorEmail, solicitudId, datos)
      } catch (error) {
        console.warn('Error enviando notificación:', error)
      }
    }

    return { rejected: true }
  }, 'Error al rechazar pago')
}

// ========================================
// 🔄 DEVOLUCIONES
// ========================================

/**
 * Procesar devolución de una solicitud
 * @param {string} solicitudId - ID de la solicitud
 * @param {object} datos - Datos de devolución (monto, comprobante, etc.)
 * @param {string} adminId - ID del administrador que procesa la devolución
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const devolverPago = async (solicitudId, datos, adminId) => {
  return AdminApiService.executeQuery(async () => {
    if (!solicitudId || !adminId) {
      throw new Error('ID de solicitud y administrador son requeridos')
    }

    if (!datos.monto || datos.monto <= 0) {
      throw new Error('Monto de devolución debe ser mayor a 0')
    }

    if (datos.comprobante_devolucion_url && !_isValidUrl(datos.comprobante_devolucion_url)) {
      throw new Error('URL del comprobante de devolución no es válida')
    }

    // Actualizar en la base de datos
    const { error } = await supabase
      .from('control_panel')
      .update({
        estado: 'devuelto',
        notas_admin: datos.motivo || null,
        updated_at: new Date().toISOString(),
        procesado_por: adminId
      })
      .eq('id', solicitudId)
    
    if (error) {
      throw new Error('Error al procesar devolución')
    }

    // Registrar acción en auditoría
    await AdminApiService.logAuditAction(adminId, AUDIT_ACTIONS.REFUND_REQUEST, solicitudId, {
      monto_devuelto: datos.monto,
      comprobante_devolucion_url: datos.comprobante_devolucion_url,
      motivo: datos.motivo || null,
      refund_time: new Date().toISOString()
    })

    // Enviar notificación al comprador (si está implementado)
    if (datos.notifyBuyer && datos.compradorEmail) {
      try {
        await _sendRefundNotification(datos.compradorEmail, solicitudId, datos)
      } catch (error) {
        console.warn('Error enviando notificación:', error)
      }
    }

    return { refunded: true }
  }, 'Error al procesar devolución')
}

// ========================================
// 📊 ESTADÍSTICAS Y REPORTES
// ========================================

/**
 * Obtener estadísticas de solicitudes
 * @param {object} filters - Filtros de fecha opcionales
 * @returns {Promise<{success: boolean, stats?: object, error?: string}>}
 */
export const getSolicitudesStats = async (filters = {}) => {
  return AdminApiService.executeQuery(async () => {
    // Consulta real a la base de datos para estadísticas
    let query = supabase
      .from('control_panel')
      .select('estado, venta, created_at')

    if (filters.fechaDesde) {
      query = query.gte('created_at', filters.fechaDesde)
    }
    
    if (filters.fechaHasta) {
      query = query.lte('created_at', filters.fechaHasta)
    }

    const { data: solicitudes, error } = await query

    if (error) {
      throw new Error('Error al cargar estadísticas')
    }

    const stats = {
      total: solicitudes.length,
      pendientes: solicitudes.filter(s => s.estado === 'pendiente').length,
      confirmados: solicitudes.filter(s => s.estado === 'confirmado').length,
      rechazados: solicitudes.filter(s => s.estado === 'rechazado').length,
      devueltos: solicitudes.filter(s => s.estado === 'devuelto').length,
      entregados: solicitudes.filter(s => s.estado === 'entregado').length,
      monto_total: solicitudes.reduce((sum, s) => sum + (s.venta || 0), 0),
      monto_confirmado: solicitudes
        .filter(s => s.estado === 'confirmado')
        .reduce((sum, s) => sum + (s.venta || 0), 0)
    }
    
    return stats
  }, 'Error al cargar estadísticas de solicitudes')
}

/**
 * Obtener reporte de solicitudes por período
 * @param {string} startDate - Fecha de inicio (YYYY-MM-DD)
 * @param {string} endDate - Fecha de fin (YYYY-MM-DD)
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const getSolicitudesReport = async (startDate, endDate) => {
  return AdminApiService.executeQuery(async () => {
    if (!startDate || !endDate) {
      throw new Error('Fechas de inicio y fin son requeridas')
    }

    if (new Date(startDate) > new Date(endDate)) {
      throw new Error('Fecha de inicio no puede ser mayor a fecha de fin')
    }

    // Consulta real para generar reporte
    const { data: solicitudes, error } = await supabase
      .from('control_panel')
      .select('estado, venta, created_at')
      .gte('created_at', startDate)
      .lte('created_at', endDate)

    if (error) {
      throw new Error('Error generando reporte')
    }

    // Calcular estadísticas del reporte
    const total_requests = solicitudes.length
    const total_amount = solicitudes.reduce((sum, s) => sum + (s.venta || 0), 0)
    const avg_amount = total_requests > 0 ? total_amount / total_requests : 0

    // Agrupar por estado
    const by_status = {}
    const estados = ['pendiente', 'confirmado', 'rechazado', 'devuelto', 'entregado']
    
    estados.forEach(estado => {
      const filtradas = solicitudes.filter(s => s.estado === estado)
      by_status[estado] = {
        count: filtradas.length,
        amount: filtradas.reduce((sum, s) => sum + (s.venta || 0), 0)
      }
    })

    // Encontrar estado más común
    const most_common_status = estados.reduce((a, b) => 
      by_status[a].count > by_status[b].count ? a : b
    )

    return {
      period: { start: startDate, end: endDate },
      summary: {
        total_requests,
        total_amount,
        avg_amount: Math.round(avg_amount),
        most_common_status
      },
      by_status,
      by_day: [] // Se puede implementar más tarde si se necesita
    }
  }, 'Error generando reporte de solicitudes')
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
    new URL(url)
    return true
  } catch {
    return false
  }
}

/**
 * Enviar notificación de confirmación de pago
 * @private
 * @param {string} email - Email del comprador
 * @param {string} solicitudId - ID de la solicitud
 * @param {object} datos - Datos adicionales
 */
async function _sendPaymentConfirmationNotification(email, solicitudId, datos) {
  // TODO: Implementar sistema de notificaciones
  console.log(`Enviando notificación de confirmación a ${email} para solicitud ${solicitudId}`)
}

/**
 * Enviar notificación de rechazo de pago
 * @private
 * @param {string} email - Email del comprador
 * @param {string} solicitudId - ID de la solicitud
 * @param {object} datos - Datos adicionales
 */
async function _sendPaymentRejectionNotification(email, solicitudId, datos) {
  // TODO: Implementar sistema de notificaciones
  console.log(`Enviando notificación de rechazo a ${email} para solicitud ${solicitudId}`)
}

/**
 * Enviar notificación de devolución
 * @private
 * @param {string} email - Email del comprador
 * @param {string} solicitudId - ID de la solicitud
 * @param {object} datos - Datos adicionales
 */
async function _sendRefundNotification(email, solicitudId, datos) {
  // TODO: Implementar sistema de notificaciones
  console.log(`Enviando notificación de devolución a ${email} para solicitud ${solicitudId}`)
}

// ========================================
// 📧 NOTIFICACIONES (FUTURO)
// ========================================

/**
 * Enviar notificación a comprador sobre estado de solicitud
 * @param {string} compradorEmail - Email del comprador
 * @param {string} tipoNotificacion - Tipo: 'confirmado', 'rechazado', 'devuelto'
 * @param {object} datos - Datos adicionales para la notificación
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const enviarNotificacion = async (compradorEmail, tipoNotificacion, datos) => {
  return AdminApiService.executeQuery(async () => {
    if (!compradorEmail || !tipoNotificacion) {
      throw new Error('Email y tipo de notificación son requeridos')
    }

    const validTypes = ['confirmado', 'rechazado', 'devuelto']
    if (!validTypes.includes(tipoNotificacion)) {
      throw new Error('Tipo de notificación no válido')
    }

    // TODO: Implementar sistema de notificaciones
    // Podría usar Supabase Functions, SendGrid, o similar
    
    console.log(`Enviando notificación tipo ${tipoNotificacion} a ${compradorEmail}`)
    
    return { sent: true }
  }, 'Error enviando notificación')
}

// ========================================
// 🔍 UTILIDADES Y VALIDACIONES
// ========================================

/**
 * Validar datos de confirmación de pago
 * @param {object} datos - Datos a validar
 * @returns {{valid: boolean, errors: Array<string>}}
 */
export const validateConfirmationData = (datos) => {
  const errors = []
  
  if (!datos) {
    errors.push('Datos de confirmación son requeridos')
    return { valid: false, errors }
  }
  
  if (datos.comprobante_url && !_isValidUrl(datos.comprobante_url)) {
    errors.push('URL del comprobante no es válida')
  }
  
  if (datos.notes && datos.notes.length > 500) {
    errors.push('Las notas no pueden exceder 500 caracteres')
  }
  
  return { valid: errors.length === 0, errors }
}

/**
 * Validar datos de rechazo de pago
 * @param {object} datos - Datos a validar
 * @returns {{valid: boolean, errors: Array<string>}}
 */
export const validateRejectionData = (datos) => {
  const errors = []
  
  if (!datos) {
    errors.push('Datos de rechazo son requeridos')
    return { valid: false, errors }
  }
  
  if (!datos.motivo || datos.motivo.trim().length < 5) {
    errors.push('Motivo de rechazo es requerido (mínimo 5 caracteres)')
  }
  
  if (datos.motivo && datos.motivo.length > 1000) {
    errors.push('El motivo no puede exceder 1000 caracteres')
  }
  
  if (datos.adjuntos_urls && Array.isArray(datos.adjuntos_urls)) {
    for (const url of datos.adjuntos_urls) {
      if (!_isValidUrl(url)) {
        errors.push('Una o más URLs de adjuntos no son válidas')
        break
      }
    }
  }
  
  return { valid: errors.length === 0, errors }
}

/**
 * Validar datos de devolución
 * @param {object} datos - Datos a validar
 * @returns {{valid: boolean, errors: Array<string>}}
 */
export const validateRefundData = (datos) => {
  const errors = []
  
  if (!datos) {
    errors.push('Datos de devolución son requeridos')
    return { valid: false, errors }
  }
  
  if (!datos.monto || datos.monto <= 0) {
    errors.push('Monto de devolución debe ser mayor a 0')
  }
  
  if (datos.monto > 99999999) {
    errors.push('Monto de devolución excede el máximo permitido')
  }
  
  if (datos.comprobante_devolucion_url && !_isValidUrl(datos.comprobante_devolucion_url)) {
    errors.push('URL del comprobante de devolución no es válida')
  }
  
  if (datos.motivo && datos.motivo.length > 500) {
    errors.push('El motivo no puede exceder 500 caracteres')
  }
  
  return { valid: errors.length === 0, errors }
}
