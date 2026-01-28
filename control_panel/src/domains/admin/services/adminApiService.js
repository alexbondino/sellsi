/**
 * 🔧 Cliente Base para Servicios Administrativos - Dominio Admin
 * 
 * Maneja patrones comunes de Supabase, respuestas estándar y logging
 * Reduce duplicación de código entre servicios administrativos
 * 
 * @author Panel Administrativo Sellsi
 * @date 21 de Julio de 2025 - Migrado a domains/admin/services/
 */

import { supabase } from '../../../services/supabase'

export class AdminApiService {
  /**
   * Patrón estándar para queries de Supabase con manejo de errores
   * @param {Function} queryFn - Función que ejecuta la query de Supabase
   * @param {string} errorMessage - Mensaje de error personalizado
   * @returns {Promise<{success: boolean, data?: any, error?: string}>}
   */
  static async executeQuery(queryFn, errorMessage = 'Error interno del servidor') {
    try {
      const result = await queryFn()
      
      // Si la función retorna directamente un objeto con success
      if (typeof result === 'object' && 'success' in result) {
        return result
      }
      
      // Si la función retorna data directamente
      return this.successResponse(result)
    } catch (error) {
      console.error(`Error ejecutando query:`, error)
      return this.errorResponse(error.message || errorMessage)
    }
  }

  /**
   * Patrón estándar para queries de Supabase con estructura {data, error}
   * @param {Function} supabaseQueryFn - Función que retorna {data, error}
   * @param {string} errorMessage - Mensaje de error personalizado
   * @returns {Promise<{success: boolean, data?: any, error?: string}>}
   */
  static async executeSupabaseQuery(supabaseQueryFn, errorMessage = 'Error interno del servidor') {
    try {
      const { data, error } = await supabaseQueryFn()
      
      if (error) {
        console.error(`Error en query Supabase:`, error)
        return this.errorResponse(errorMessage)
      }
      
      return this.successResponse(data)
    } catch (error) {
      console.error(`Error ejecutando query Supabase:`, error)
      return this.errorResponse(errorMessage)
    }
  }

  /**
   * Respuesta estándar de éxito
   * @param {any} data - Datos a retornar
   * @returns {{success: true, data?: any}}
   */
  static successResponse(data = null) {
    const response = { success: true }
    if (data !== null && data !== undefined) {
      response.data = data
    }
    return response
  }

  /**
   * Respuesta estándar de error
   * @param {string} error - Mensaje de error
   * @returns {{success: false, error: string}}
   */
  static errorResponse(error = 'Error interno del servidor') {
    return { success: false, error }
  }

  /**
   * Ejecutar múltiples queries en paralelo con manejo de errores
   * @param {Array<Function>} queryFunctions - Array de funciones de query
   * @returns {Promise<Array>} Array de resultados
   */
  static async executeParallelQueries(queryFunctions) {
    try {
      const results = await Promise.allSettled(queryFunctions.map(fn => fn()))
      
      return results.map((result, index) => {
        if (result.status === 'fulfilled') {
          return this.successResponse(result.value)
        } else {
          console.error(`Error en query paralela ${index}:`, result.reason)
          return this.errorResponse(`Error en operación ${index + 1}`)
        }
      })
    } catch (error) {
      console.error('Error ejecutando queries paralelas:', error)
      return [this.errorResponse('Error en operaciones paralelas')]
    }
  }

  /**
   * Validar permisos de administrador
   * @param {string} adminId - ID del administrador
   * @param {Array<string>} requiredRoles - Roles requeridos
   * @returns {Promise<{success: boolean, admin?: object, error?: string}>}
   */
  static async validateAdminPermissions(adminId, requiredRoles = []) {
    try {
      const { data: admin, error } = await supabase
        .from('control_panel_users')
        .select('id, role, is_active')
        .eq('id', adminId)
        .eq('is_active', true)
        .single()

      if (error || !admin) {
        return this.errorResponse('Administrador no encontrado o inactivo')
      }

      if (requiredRoles.length > 0 && !requiredRoles.includes(admin.role)) {
        return this.errorResponse('Permisos insuficientes')
      }

      return this.successResponse(admin)
    } catch (error) {
      console.error('Error validando permisos:', error)
      return this.errorResponse('Error validando permisos')
    }
  }

  /**
   * Registrar acción en log de auditoría
   * @param {string} adminId - ID del administrador que ejecuta la acción
   * @param {string} action - Tipo de acción
   * @param {string} targetId - ID del objeto afectado
   * @param {object} details - Detalles adicionales
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  static async logAuditAction(adminId, action, targetId = null, details = {}) {
    try {
      // IMPORTANTE: Usamos RPC con SECURITY DEFINER para bypasear RLS
      // Esto permite que el frontend con token ANON registre auditoría durante el login
      // cuando el admin aún no está autenticado en Supabase Auth
      const { error } = await supabase.rpc('log_admin_audit', {
        p_admin_id: adminId,
        p_action: action,
        p_target_id: targetId,
        p_details: details || {},
        p_ip_address: null,  // TODO: Capturar IP del cliente si es necesario
        p_user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null
      })

      if (error) {
        console.warn('Error registrando auditoría:', error)
        // No fallar la operación principal por error de auditoría
      }

      return this.successResponse()
    } catch (error) {
      console.warn('Error en log de auditoría:', error)
      return this.successResponse() // No fallar por errores de auditoría
    }
  }

  /**
   * Sanitizar filtros de entrada
   * @param {object} filters - Filtros de entrada
   * @param {Array<string>} allowedFields - Campos permitidos
   * @returns {object} Filtros sanitizados
   */
  static sanitizeFilters(filters = {}, allowedFields = []) {
    const sanitized = {}
    
    allowedFields.forEach(field => {
      if (filters[field] !== undefined && filters[field] !== null && filters[field] !== '') {
        sanitized[field] = filters[field]
      }
    })
    
    return sanitized
  }

  /**
   * Construir query de Supabase con filtros dinámicos
   * @param {string} table - Nombre de la tabla
   * @param {string} select - Campos a seleccionar
   * @param {object} filters - Filtros a aplicar
   * @returns {object} Query de Supabase
   */
  static buildFilteredQuery(table, select = '*', filters = {}) {
    let query = supabase.from(table).select(select)

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (typeof value === 'string' && key.includes('search')) {
          query = query.ilike(key.replace('_search', ''), `%${value}%`)
        } else {
          query = query.eq(key, value)
        }
      }
    })

    return query
  }
}

/**
 * Constantes para tipos de respuesta comunes
 */
export const ADMIN_RESPONSE_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  UNAUTHORIZED: 'unauthorized',
  FORBIDDEN: 'forbidden',
  NOT_FOUND: 'not_found',
  VALIDATION_ERROR: 'validation_error'
}

/**
 * Constantes para acciones de auditoría
 */
export const AUDIT_ACTIONS = {
  // Autenticación
  LOGIN: 'login',
  LOGOUT: 'logout',
  
  // Usuarios
  CREATE_USER: 'create_user',
  UPDATE_USER: 'update_user',
  DELETE_USER: 'delete_user',
  BAN_USER: 'ban_user',
  UNBAN_USER: 'unban_user',
  VERIFY_USER: 'verify_user',
  UNVERIFY_USER: 'unverify_user',
  
  // Productos
  CREATE_PRODUCT: 'create_product',
  UPDATE_PRODUCT: 'update_product',
  DELETE_PRODUCT: 'delete_product',
  
  // Administradores
  CREATE_ADMIN: 'create_admin',
  UPDATE_ADMIN: 'update_admin',
  DELETE_ADMIN: 'delete_admin',
  ACTIVATE_ADMIN: 'activate_admin',
  DEACTIVATE_ADMIN: 'deactivate_admin',
  
  // Solicitudes
  CONFIRM_REQUEST: 'confirm_request',
  REJECT_REQUEST: 'reject_request',
  REFUND_REQUEST: 'refund_request',

  // Financiamiento (admin manual actions)
  FINANCING_RESTORE: 'financing_restore',
  FINANCING_REFUND: 'financing_refund'
}
