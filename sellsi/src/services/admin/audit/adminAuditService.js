/**
 * 📊 Servicio de Auditoría y Logs Administrativos
 * 
 * Gestiona todas las operaciones de auditoría y logging:
 * - Registro de acciones administrativas
 * - Consulta de logs con filtros
 * - Reportes de auditoría
 * - Análisis de actividad
 * - Alertas de seguridad
 * 
 * @author Panel Administrativo Sellsi
 * @date 17 de Julio de 2025
 */

import { AdminApiService, AUDIT_ACTIONS } from '../core/adminApiService'
import { supabase } from '../../supabase'

// ========================================
// 📝 REGISTRO DE ACCIONES
// ========================================

/**
 * Registrar acción administrativa en logs de auditoría
 * @param {string} adminId - ID del administrador que ejecuta la acción
 * @param {string} action - Tipo de acción realizada
 * @param {string} targetId - ID del objeto afectado (opcional)
 * @param {object} details - Detalles adicionales de la acción
 * @param {string} ipAddress - Dirección IP del administrador (opcional)
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const logAction = async (adminId, action, targetId = null, details = {}, ipAddress = null) => {
  return AdminApiService.executeQuery(async () => {
    if (!adminId || !action) {
      throw new Error('ID de administrador y acción son requeridos')
    }

    // Validar que la acción esté en las acciones permitidas
    const validActions = Object.values(AUDIT_ACTIONS)
    if (!validActions.includes(action)) {
      console.warn(`Acción no estándar registrada: ${action}`)
    }

    // Preparar datos del log
    const logData = {
      admin_id: adminId,
      action,
      target_id: targetId,
      details: details || {},
      ip_address: ipAddress,
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
      timestamp: new Date().toISOString()
    }

    // Insertar en la tabla de auditoría
    const { error } = await supabase
      .from('admin_audit_log')
      .insert([logData])

    if (error) {
      console.error('Error registrando acción en auditoría:', error)
      // No lanzar error para evitar que falle la operación principal
      return { logged: false, error: error.message }
    }

    return { logged: true }
  }, 'Error registrando acción')
}

/**
 * Registrar acción con detección automática de IP
 * @param {string} adminId - ID del administrador
 * @param {string} action - Acción a registrar
 * @param {string} targetId - ID del objetivo (opcional)
 * @param {object} details - Detalles adicionales
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const logActionWithAutoIP = async (adminId, action, targetId = null, details = {}) => {
  return AdminApiService.executeQuery(async () => {
    // Intentar obtener IP del cliente (en entorno web)
    let clientIP = null
    try {
      // En el futuro se puede implementar detección de IP del lado cliente
      // Por ahora usar null
      clientIP = null
    } catch (error) {
      console.warn('No se pudo obtener IP del cliente:', error)
    }

    return await logAction(adminId, action, targetId, details, clientIP)
  }, 'Error registrando acción con IP automática')
}

/**
 * Registrar múltiples acciones en lote
 * @param {Array} actions - Array de objetos con datos de acciones
 * @returns {Promise<{success: boolean, logged?: number, errors?: Array, error?: string}>}
 */
export const logMultipleActions = async (actions) => {
  return AdminApiService.executeQuery(async () => {
    if (!actions || actions.length === 0) {
      throw new Error('Array de acciones es requerido')
    }

    let loggedCount = 0
    const errors = []

    // Procesar acciones en lotes de 10
    const batchSize = 10
    for (let i = 0; i < actions.length; i += batchSize) {
      const batch = actions.slice(i, i + batchSize)
      
      try {
        const logData = batch.map(action => ({
          admin_id: action.adminId,
          action: action.action,
          target_id: action.targetId || null,
          details: action.details || {},
          ip_address: action.ipAddress || null,
          user_agent: action.userAgent || null,
          timestamp: new Date().toISOString()
        }))

        const { error } = await supabase
          .from('admin_audit_log')
          .insert(logData)

        if (error) {
          errors.push(`Error en lote ${Math.floor(i/batchSize) + 1}: ${error.message}`)
        } else {
          loggedCount += batch.length
        }
      } catch (error) {
        errors.push(`Error procesando lote ${Math.floor(i/batchSize) + 1}: ${error.message}`)
      }
    }

    return {
      logged: loggedCount,
      errors: errors.length > 0 ? errors : undefined,
      total: actions.length
    }
  }, 'Error registrando acciones múltiples')
}

// ========================================
// 📋 CONSULTA DE LOGS
// ========================================

/**
 * Obtener logs de auditoría con filtros
 * @param {object} filters - Filtros opcionales
 * @returns {Promise<{success: boolean, data?: array, error?: string}>}
 */
export const getLogs = async (filters = {}) => {
  return AdminApiService.executeQuery(async () => {
    let query = supabase
      .from('admin_audit_log')
      .select(`
        *,
        admin:admin_id (
          usuario,
          full_name,
          email
        )
      `)

    // Aplicar filtros
    if (filters.adminId) {
      query = query.eq('admin_id', filters.adminId)
    }

    if (filters.action) {
      query = query.eq('action', filters.action)
    }

    if (filters.targetId) {
      query = query.eq('target_id', filters.targetId)
    }

    if (filters.dateFrom) {
      query = query.gte('timestamp', filters.dateFrom)
    }

    if (filters.dateTo) {
      query = query.lte('timestamp', filters.dateTo)
    }

    if (filters.ipAddress) {
      query = query.eq('ip_address', filters.ipAddress)
    }

    // Paginación
    const limit = filters.limit || 50
    const offset = filters.offset || 0
    query = query.range(offset, offset + limit - 1)

    // Ordenamiento
    query = query.order('timestamp', { ascending: false })

    const { data, error } = await query

    if (error) {
      throw new Error('Error al cargar logs de auditoría')
    }

    return data || []
  }, 'Error obteniendo logs')
}

/**
 * Obtener logs de un administrador específico
 * @param {string} adminId - ID del administrador
 * @param {object} options - Opciones de consulta
 * @returns {Promise<{success: boolean, data?: array, error?: string}>}
 */
export const getAdminLogs = async (adminId, options = {}) => {
  return AdminApiService.executeQuery(async () => {
    if (!adminId) {
      throw new Error('ID de administrador es requerido')
    }

    const { limit = 100, days = 30 } = options
    const dateFrom = new Date()
    dateFrom.setDate(dateFrom.getDate() - days)

    return await getLogs({
      adminId,
      dateFrom: dateFrom.toISOString(),
      limit
    })
  }, 'Error obteniendo logs del administrador')
}

/**
 * Obtener logs de una acción específica
 * @param {string} action - Tipo de acción
 * @param {object} options - Opciones de consulta
 * @returns {Promise<{success: boolean, data?: array, error?: string}>}
 */
export const getActionLogs = async (action, options = {}) => {
  return AdminApiService.executeQuery(async () => {
    if (!action) {
      throw new Error('Tipo de acción es requerido')
    }

    const { limit = 100, days = 30 } = options
    const dateFrom = new Date()
    dateFrom.setDate(dateFrom.getDate() - days)

    return await getLogs({
      action,
      dateFrom: dateFrom.toISOString(),
      limit
    })
  }, 'Error obteniendo logs de la acción')
}

/**
 * Buscar logs por texto en detalles
 * @param {string} searchTerm - Término de búsqueda
 * @param {object} options - Opciones de búsqueda
 * @returns {Promise<{success: boolean, data?: array, error?: string}>}
 */
export const searchLogs = async (searchTerm, options = {}) => {
  return AdminApiService.executeQuery(async () => {
    if (!searchTerm || searchTerm.trim().length < 3) {
      throw new Error('Término de búsqueda debe tener al menos 3 caracteres')
    }

    const { limit = 50, days = 30 } = options
    const dateFrom = new Date()
    dateFrom.setDate(dateFrom.getDate() - days)

    // TODO: Implementar búsqueda por texto en JSON de details
    // Por ahora usar consulta básica
    const { data, error } = await supabase
      .from('admin_audit_log')
      .select(`
        *,
        admin:admin_id (
          usuario,
          full_name,
          email
        )
      `)
      .gte('timestamp', dateFrom.toISOString())
      .order('timestamp', { ascending: false })
      .limit(limit)

    if (error) {
      throw new Error('Error buscando en logs')
    }

    // Filtrar del lado cliente por ahora
    const filtered = (data || []).filter(log => {
      const searchableText = JSON.stringify({
        action: log.action,
        details: log.details,
        admin: log.admin?.full_name || log.admin?.usuario
      }).toLowerCase()
      
      return searchableText.includes(searchTerm.toLowerCase())
    })

    return filtered
  }, 'Error buscando logs')
}

// ========================================
// 📊 REPORTES Y ESTADÍSTICAS
// ========================================

/**
 * Obtener estadísticas de actividad administrativa
 * @param {object} options - Opciones del reporte
 * @returns {Promise<{success: boolean, stats?: object, error?: string}>}
 */
export const getActivityStats = async (options = {}) => {
  return AdminApiService.executeQuery(async () => {
    const { days = 30 } = options
    const dateFrom = new Date()
    dateFrom.setDate(dateFrom.getDate() - days)

    const { data: logs, error } = await supabase
      .from('admin_audit_log')
      .select('action, admin_id, timestamp')
      .gte('timestamp', dateFrom.toISOString())

    if (error) {
      throw new Error('Error obteniendo estadísticas de actividad')
    }

    const logsData = logs || []
    
    // Estadísticas generales
    const totalActions = logsData.length
    const uniqueAdmins = new Set(logsData.map(log => log.admin_id)).size
    
    // Acciones por tipo
    const actionCounts = {}
    logsData.forEach(log => {
      actionCounts[log.action] = (actionCounts[log.action] || 0) + 1
    })

    // Actividad por administrador
    const adminActivity = {}
    logsData.forEach(log => {
      adminActivity[log.admin_id] = (adminActivity[log.admin_id] || 0) + 1
    })

    // Actividad por día
    const dailyActivity = {}
    logsData.forEach(log => {
      const date = log.timestamp.split('T')[0]
      dailyActivity[date] = (dailyActivity[date] || 0) + 1
    })

    return {
      period_days: days,
      total_actions: totalActions,
      unique_admins: uniqueAdmins,
      actions_by_type: actionCounts,
      admin_activity: adminActivity,
      daily_activity: dailyActivity,
      avg_actions_per_day: totalActions / days
    }
  }, 'Error obteniendo estadísticas de actividad')
}

/**
 * Generar reporte de auditoría para un período
 * @param {string} startDate - Fecha de inicio (YYYY-MM-DD)
 * @param {string} endDate - Fecha de fin (YYYY-MM-DD)
 * @param {object} options - Opciones del reporte
 * @returns {Promise<{success: boolean, report?: object, error?: string}>}
 */
export const generateAuditReport = async (startDate, endDate, options = {}) => {
  return AdminApiService.executeQuery(async () => {
    if (!startDate || !endDate) {
      throw new Error('Fechas de inicio y fin son requeridas')
    }

    if (new Date(startDate) > new Date(endDate)) {
      throw new Error('Fecha de inicio no puede ser mayor a fecha de fin')
    }

    const { includeDetails = false } = options

    let selectFields = 'action, admin_id, timestamp, target_id'
    if (includeDetails) {
      selectFields += ', details, ip_address'
    }

    const { data: logs, error } = await supabase
      .from('admin_audit_log')
      .select(`
        ${selectFields},
        admin:admin_id (
          usuario,
          full_name,
          role
        )
      `)
      .gte('timestamp', startDate)
      .lte('timestamp', endDate)
      .order('timestamp', { ascending: false })

    if (error) {
      throw new Error('Error generando reporte de auditoría')
    }

    const logsData = logs || []

    // Análisis del reporte
    const report = {
      period: { start: startDate, end: endDate },
      summary: {
        total_actions: logsData.length,
        unique_admins: new Set(logsData.map(log => log.admin_id)).size,
        date_range_days: Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24))
      },
      actions_breakdown: {},
      admin_breakdown: {},
      timeline: [],
      logs: includeDetails ? logsData : undefined
    }

    // Desglose por tipo de acción
    logsData.forEach(log => {
      const action = log.action
      if (!report.actions_breakdown[action]) {
        report.actions_breakdown[action] = {
          count: 0,
          admins: new Set(),
          first_occurrence: log.timestamp,
          last_occurrence: log.timestamp
        }
      }
      
      report.actions_breakdown[action].count++
      report.actions_breakdown[action].admins.add(log.admin_id)
      
      if (log.timestamp < report.actions_breakdown[action].first_occurrence) {
        report.actions_breakdown[action].first_occurrence = log.timestamp
      }
      if (log.timestamp > report.actions_breakdown[action].last_occurrence) {
        report.actions_breakdown[action].last_occurrence = log.timestamp
      }
    })

    // Convertir Sets a arrays para serialización
    Object.keys(report.actions_breakdown).forEach(action => {
      report.actions_breakdown[action].unique_admins = report.actions_breakdown[action].admins.size
      delete report.actions_breakdown[action].admins
    })

    // Desglose por administrador
    logsData.forEach(log => {
      const adminId = log.admin_id
      if (!report.admin_breakdown[adminId]) {
        report.admin_breakdown[adminId] = {
          admin_info: log.admin,
          total_actions: 0,
          actions_by_type: {},
          first_action: log.timestamp,
          last_action: log.timestamp
        }
      }
      
      report.admin_breakdown[adminId].total_actions++
      report.admin_breakdown[adminId].actions_by_type[log.action] = 
        (report.admin_breakdown[adminId].actions_by_type[log.action] || 0) + 1
      
      if (log.timestamp < report.admin_breakdown[adminId].first_action) {
        report.admin_breakdown[adminId].first_action = log.timestamp
      }
      if (log.timestamp > report.admin_breakdown[adminId].last_action) {
        report.admin_breakdown[adminId].last_action = log.timestamp
      }
    })

    return report
  }, 'Error generando reporte de auditoría')
}

// ========================================
// 🚨 ALERTAS Y MONITOREO
// ========================================

/**
 * Detectar actividad sospechosa
 * @param {object} options - Opciones de detección
 * @returns {Promise<{success: boolean, alerts?: array, error?: string}>}
 */
export const detectSuspiciousActivity = async (options = {}) => {
  return AdminApiService.executeQuery(async () => {
    const { hours = 24, thresholds = {} } = options
    const dateFrom = new Date()
    dateFrom.setHours(dateFrom.getHours() - hours)

    const {
      maxActionsPerHour = 100,
      maxFailedLogins = 5,
      maxDeletionsPerHour = 10
    } = thresholds

    const { data: recentLogs, error } = await supabase
      .from('admin_audit_log')
      .select('*')
      .gte('timestamp', dateFrom.toISOString())
      .order('timestamp', { ascending: false })

    if (error) {
      throw new Error('Error detectando actividad sospechosa')
    }

    const logs = recentLogs || []
    const alerts = []

    // Detectar exceso de acciones por administrador
    const adminActionCounts = {}
    logs.forEach(log => {
      adminActionCounts[log.admin_id] = (adminActionCounts[log.admin_id] || 0) + 1
    })

    Object.entries(adminActionCounts).forEach(([adminId, count]) => {
      const actionsPerHour = count / hours
      if (actionsPerHour > maxActionsPerHour) {
        alerts.push({
          type: 'high_activity',
          severity: 'medium',
          admin_id: adminId,
          message: `Administrador con ${count} acciones en ${hours} horas (${actionsPerHour.toFixed(1)}/hora)`,
          threshold: maxActionsPerHour
        })
      }
    })

    // Detectar múltiples eliminaciones
    const deletionActions = ['delete_user', 'delete_product', 'delete_admin']
    const deletions = logs.filter(log => deletionActions.includes(log.action))
    
    const adminDeletions = {}
    deletions.forEach(log => {
      adminDeletions[log.admin_id] = (adminDeletions[log.admin_id] || 0) + 1
    })

    Object.entries(adminDeletions).forEach(([adminId, count]) => {
      const deletionsPerHour = count / hours
      if (deletionsPerHour > maxDeletionsPerHour) {
        alerts.push({
          type: 'high_deletions',
          severity: 'high',
          admin_id: adminId,
          message: `Administrador con ${count} eliminaciones en ${hours} horas`,
          threshold: maxDeletionsPerHour
        })
      }
    })

    // Detectar acciones fuera de horario normal (opcional)
    const offHoursActions = logs.filter(log => {
      const hour = new Date(log.timestamp).getHours()
      return hour < 6 || hour > 22 // Fuera de 6 AM - 10 PM
    })

    if (offHoursActions.length > 10) {
      const adminOffHours = {}
      offHoursActions.forEach(log => {
        adminOffHours[log.admin_id] = (adminOffHours[log.admin_id] || 0) + 1
      })

      Object.entries(adminOffHours).forEach(([adminId, count]) => {
        if (count > 5) {
          alerts.push({
            type: 'off_hours_activity',
            severity: 'low',
            admin_id: adminId,
            message: `Administrador con ${count} acciones fuera de horario normal`,
            threshold: 5
          })
        }
      })
    }

    return {
      period_hours: hours,
      total_logs_analyzed: logs.length,
      alerts_count: alerts.length,
      alerts
    }
  }, 'Error detectando actividad sospechosa')
}

/**
 * Obtener resumen de actividad reciente
 * @param {number} hours - Horas hacia atrás a analizar
 * @returns {Promise<{success: boolean, summary?: object, error?: string}>}
 */
export const getRecentActivitySummary = async (hours = 24) => {
  return AdminApiService.executeQuery(async () => {
    const dateFrom = new Date()
    dateFrom.setHours(dateFrom.getHours() - hours)

    const { data: logs, error } = await supabase
      .from('admin_audit_log')
      .select(`
        action,
        admin_id,
        timestamp,
        admin:admin_id (usuario, full_name)
      `)
      .gte('timestamp', dateFrom.toISOString())

    if (error) {
      throw new Error('Error obteniendo resumen de actividad')
    }

    const logsData = logs || []

    return {
      period_hours: hours,
      total_actions: logsData.length,
      unique_admins: new Set(logsData.map(log => log.admin_id)).size,
      most_active_admin: _getMostActiveAdmin(logsData),
      most_common_action: _getMostCommonAction(logsData),
      recent_critical_actions: _getCriticalActions(logsData)
    }
  }, 'Error obteniendo resumen de actividad')
}

// ========================================
// 🔧 FUNCIONES AUXILIARES PRIVADAS
// ========================================

/**
 * Obtener administrador más activo
 * @private
 */
function _getMostActiveAdmin(logs) {
  const adminCounts = {}
  logs.forEach(log => {
    adminCounts[log.admin_id] = (adminCounts[log.admin_id] || 0) + 1
  })

  let mostActive = null
  let maxCount = 0

  Object.entries(adminCounts).forEach(([adminId, count]) => {
    if (count > maxCount) {
      maxCount = count
      const adminLog = logs.find(log => log.admin_id === adminId)
      mostActive = {
        admin_id: adminId,
        admin_info: adminLog?.admin,
        action_count: count
      }
    }
  })

  return mostActive
}

/**
 * Obtener acción más común
 * @private
 */
function _getMostCommonAction(logs) {
  const actionCounts = {}
  logs.forEach(log => {
    actionCounts[log.action] = (actionCounts[log.action] || 0) + 1
  })

  let mostCommon = null
  let maxCount = 0

  Object.entries(actionCounts).forEach(([action, count]) => {
    if (count > maxCount) {
      maxCount = count
      mostCommon = { action, count }
    }
  })

  return mostCommon
}

/**
 * Obtener acciones críticas recientes
 * @private
 */
function _getCriticalActions(logs) {
  const criticalActions = [
    'delete_admin', 'create_admin', 'delete_user', 
    'ban_user', 'delete_product'
  ]

  return logs
    .filter(log => criticalActions.includes(log.action))
    .slice(0, 10) // Últimas 10 acciones críticas
    .map(log => ({
      action: log.action,
      admin_info: log.admin,
      timestamp: log.timestamp
    }))
}

// ========================================
// 🔧 ALIASES PARA COMPATIBILIDAD
// ========================================

/**
 * @deprecated Usar logAction en su lugar
 * Alias para compatibilidad con código legacy
 */
export const registrarAccion = async (accion, solicitudId, detalles = {}) => {
  try {
    // TODO: Implementar cuando se creen las tablas
    /*
    const { error } = await supabase
      .from('admin_logs')
      .insert({
        usuario: getCurrentAdminUser(), // Función para obtener usuario actual
        accion,
        request_id: solicitudId,
        detalles: JSON.stringify(detalles),
        ip_address: await getUserIP(),
        user_agent: navigator.userAgent
      })
    
    if (error) {
      console.error('Error registrando acción:', error)
      return { success: false, error: error.message }
    }
    
    return { success: true }
    */
    
    // Registrar acción
    return { success: true }
  } catch (error) {
    console.error('Error en registrarAccion:', error)
    return { success: false, error: 'Error interno del servidor' }
  }
}
