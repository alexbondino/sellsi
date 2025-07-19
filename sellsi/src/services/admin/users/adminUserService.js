/**
 * 👥 Servicio de Gestión de Usuarios
 * 
 * Gestiona todas las operaciones CRUD y de administración sobre usuarios:
 * - Obtener listas de usuarios con filtros
 * - Sistema de bans/unbans de usuarios
 * - Verificación y desverificación de usuarios
 * - Estadísticas de usuarios
 * - Eliminación de usuarios
 * 
 * @author Panel Administrativo Sellsi
 * @date 17 de Julio de 2025
 */

import { AdminApiService, AUDIT_ACTIONS } from '../core/adminApiService'
import { supabase } from '../../supabase'

// ========================================
// 📋 GESTIÓN DE USUARIOS - CRUD
// ========================================

/**
 * Obtener lista de usuarios con filtros
 * @param {object} filtros - Filtros a aplicar (estado, tipo, búsqueda)
 * @returns {Promise<{success: boolean, data?: array, error?: string}>}
 */
export const getUsers = async (filtros = {}) => {
  return AdminApiService.executeQuery(async () => {
    let query = supabase
      .from('users')
      .select(`
        user_id,
        user_nm,
        email,
        phone_nbr,
        country,
        logo_url,
        main_supplier,
        createdt,
        updatedt,
        banned,
        banned_at,
        banned_reason,
        verified,
        verified_at,
        verified_by,
        last_ip
      `)

    // Aplicar filtros
    if (filtros.userType === 'suppliers') {
      query = query.eq('main_supplier', true)
    } else if (filtros.userType === 'buyers') {
      query = query.eq('main_supplier', false)
    }

    if (filtros.search) {
      query = query.or(`user_nm.ilike.%${filtros.search}%,email.ilike.%${filtros.search}%`)
    }

    if (filtros.banned !== undefined) {
      query = query.eq('banned', filtros.banned)
    }

    if (filtros.verified !== undefined) {
      query = query.eq('verified', filtros.verified)
    }

    const { data, error } = await query.order('createdt', { ascending: false })

    if (error) {
      throw new Error('Error al cargar usuarios')
    }

    // Enriquecer datos con conteo de productos activos
    const processedData = await _enrichUsersWithProductCount(data || [])
    
    return processedData
  }, 'Error al cargar usuarios')
}

/**
 * Obtener estadísticas de usuarios
 * @returns {Promise<{success: boolean, stats?: object, error?: string}>}
 */
export const getUserStats = async () => {
  return AdminApiService.executeQuery(async () => {
    // Obtener todos los usuarios con información de ban y verificación
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('user_id, main_supplier, banned, verified')

    if (usersError) {
      throw new Error('Error al cargar estadísticas de usuarios')
    }

    const users = usersData || []
    const totalUsers = users.length
    const bannedUsers = users.filter(user => user.banned === true).length
    const activeUsers = totalUsers - bannedUsers
    const suppliers = users.filter(user => user.main_supplier === true).length
    const buyers = totalUsers - suppliers
    const verifiedUsers = users.filter(user => user.verified === true).length
    const unverifiedUsers = totalUsers - verifiedUsers

    const stats = {
      totalUsers,
      activeUsers,
      bannedUsers,
      suppliers,
      buyers,
      verifiedUsers,
      unverifiedUsers
    }

    return stats
  }, 'Error al cargar estadísticas de usuarios')
}

/**
 * Obtener detalles de un usuario específico
 * @param {string} userId - ID del usuario
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const getUserDetails = async (userId) => {
  return AdminApiService.executeQuery(async () => {
    if (!userId) {
      throw new Error('ID de usuario es requerido')
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) {
      throw new Error('Usuario no encontrado')
    }

    // Obtener productos del usuario
    const { data: products } = await supabase
      .from('products')
      .select('productid, productnm, price, productqty, is_active')
      .eq('supplier_id', userId)

    // Obtener historial de bans si existe
    const banHistory = await getUserBanHistory(userId)

    return {
      ...user,
      products: products || [],
      banHistory: banHistory.data || []
    }
  }, 'Error obteniendo detalles del usuario')
}

// ========================================
// 🚫 SISTEMA DE BANS
// ========================================

/**
 * Banear un usuario
 * @param {string} userId - ID del usuario a banear
 * @param {string} reason - Razón del baneo
 * @param {string} adminId - ID del administrador que ejecuta el ban
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const banUser = async (userId, reason, adminId) => {
  return AdminApiService.executeQuery(async () => {
    if (!userId || !reason || !adminId) {
      throw new Error('Todos los parámetros son requeridos')
    }

    // Verificar que el usuario existe y no está ya baneado
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('user_id, banned, last_ip, user_nm, email')
      .eq('user_id', userId)
      .single()

    if (userError || !userData) {
      throw new Error('Usuario no encontrado')
    }

    if (userData.banned) {
      throw new Error('El usuario ya está baneado')
    }

    // Banear usuario
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        banned: true,
        banned_at: new Date().toISOString(),
        banned_reason: reason,
        updatedt: new Date().toISOString()
      })
      .eq('user_id', userId)

    if (updateError) {
      throw new Error('Error al banear usuario')
    }

    // Si el usuario tiene una IP registrada, también banear la IP
    if (userData.last_ip) {
      await supabase
        .from('banned_ips')
        .upsert({
          ip: userData.last_ip,
          banned_at: new Date().toISOString(),
          banned_reason: reason,
          banned_by: adminId
        })
        .catch(error => {
          console.warn('Error baneando IP:', error)
          // No fallar la operación completa si solo falla el baneo de IP
        })
    }

    // Registrar acción en auditoría
    await AdminApiService.logAuditAction(adminId, AUDIT_ACTIONS.BAN_USER, userId, {
      reason,
      banned_user_name: userData.user_nm,
      banned_user_email: userData.email,
      banned_ip: userData.last_ip
    })

    return { banned: true }
  }, 'Error al banear usuario')
}

/**
 * Desbanear un usuario
 * @param {string} userId - ID del usuario a desbanear
 * @param {string} reason - Razón del desbaneo
 * @param {string} adminId - ID del administrador que ejecuta el unban
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const unbanUser = async (userId, reason, adminId) => {
  return AdminApiService.executeQuery(async () => {
    if (!userId || !adminId) {
      throw new Error('ID de usuario y administrador son requeridos')
    }

    // Verificar que el usuario existe y está baneado
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('user_id, banned, last_ip, user_nm, email')
      .eq('user_id', userId)
      .single()

    if (userError || !userData) {
      throw new Error('Usuario no encontrado')
    }

    if (!userData.banned) {
      throw new Error('El usuario no está baneado')
    }

    // Desbanear usuario
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        banned: false,
        updatedt: new Date().toISOString()
      })
      .eq('user_id', userId)

    if (updateError) {
      throw new Error('Error al desbanear usuario')
    }

    // Si el usuario tiene una IP registrada, también desbanear la IP
    if (userData.last_ip) {
      await supabase
        .from('banned_ips')
        .delete()
        .eq('ip', userData.last_ip)
        .catch(error => {
          console.warn('Error desbaneando IP:', error)
          // No fallar la operación completa si solo falla el desbaneo de IP
        })
    }

    // Registrar acción en auditoría
    await AdminApiService.logAuditAction(adminId, AUDIT_ACTIONS.UNBAN_USER, userId, {
      reason: reason || 'Unban sin razón específica',
      unbanned_user_name: userData.user_nm,
      unbanned_user_email: userData.email,
      unbanned_ip: userData.last_ip
    })

    return { unbanned: true }
  }, 'Error al desbanear usuario')
}

/**
 * Obtener historial de bans de un usuario
 * @param {string} userId - ID del usuario
 * @returns {Promise<{success: boolean, data?: array, error?: string}>}
 */
export const getUserBanHistory = async (userId) => {
  return AdminApiService.executeQuery(async () => {
    if (!userId) {
      throw new Error('ID de usuario es requerido')
    }

    // TODO: Implementar cuando se cree la tabla user_ban_audit
    // Por ahora retornamos array vacío
    return []
  }, 'Error obteniendo historial de bans')
}

// ========================================
// ✅ SISTEMA DE VERIFICACIÓN
// ========================================

/**
 * Verificar un usuario
 * @param {string} userId - ID del usuario a verificar
 * @param {string} reason - Razón de la verificación
 * @param {string} adminId - ID del administrador que ejecuta la verificación
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const verifyUser = async (userId, reason, adminId) => {
  return AdminApiService.executeQuery(async () => {
    if (!userId || !adminId) {
      throw new Error('ID de usuario y administrador son requeridos')
    }

    // Verificar que el usuario existe
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('user_id, verified, user_nm, email')
      .eq('user_id', userId)
      .single()

    if (userError || !userData) {
      throw new Error('Usuario no encontrado')
    }

    if (userData.verified) {
      throw new Error('El usuario ya está verificado')
    }

    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        verified: true,
        verified_at: new Date().toISOString(),
        verified_by: adminId,
        updatedt: new Date().toISOString()
      })
      .eq('user_id', userId)

    if (updateError) {
      throw new Error('Error al verificar usuario')
    }

    // Registrar acción en auditoría
    await AdminApiService.logAuditAction(adminId, AUDIT_ACTIONS.VERIFY_USER, userId, {
      reason: reason || 'Verificación manual',
      verified_user_name: userData.user_nm,
      verified_user_email: userData.email
    })

    return { verified: true }
  }, 'Error al verificar usuario')
}

/**
 * Desverificar un usuario
 * @param {string} userId - ID del usuario a desverificar
 * @param {string} reason - Razón de la desverificación
 * @param {string} adminId - ID del administrador que ejecuta la desverificación
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const unverifyUser = async (userId, reason, adminId) => {
  return AdminApiService.executeQuery(async () => {
    if (!userId || !adminId) {
      throw new Error('ID de usuario y administrador son requeridos')
    }

    // Verificar que el usuario existe
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('user_id, verified, user_nm, email')
      .eq('user_id', userId)
      .single()

    if (userError || !userData) {
      throw new Error('Usuario no encontrado')
    }

    if (!userData.verified) {
      throw new Error('El usuario no está verificado')
    }

    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        verified: false,
        verified_at: null,
        verified_by: null,
        updatedt: new Date().toISOString()
      })
      .eq('user_id', userId)

    if (updateError) {
      throw new Error('Error al desverificar usuario')
    }

    // Registrar acción en auditoría
    await AdminApiService.logAuditAction(adminId, AUDIT_ACTIONS.UNVERIFY_USER, userId, {
      reason: reason || 'Desverificación manual',
      unverified_user_name: userData.user_nm,
      unverified_user_email: userData.email
    })

    return { unverified: true }
  }, 'Error al desverificar usuario')
}

// ========================================
// 🗑️ ELIMINACIÓN DE USUARIOS
// ========================================

/**
 * Eliminar un usuario del sistema
 * @param {string} userId - ID del usuario a eliminar
 * @param {string} adminId - ID del administrador que ejecuta la eliminación
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const deleteUser = async (userId, adminId) => {
  return AdminApiService.executeQuery(async () => {
    if (!userId || !adminId) {
      throw new Error('ID de usuario y administrador son requeridos')
    }

    // Obtener información del usuario antes de eliminarlo
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('user_id, user_nm, email, main_supplier')
      .eq('user_id', userId)
      .single()

    if (userError || !userData) {
      throw new Error('Usuario no encontrado')
    }

    // Eliminar usuario
    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .eq('user_id', userId)

    if (deleteError) {
      throw new Error('Error al eliminar usuario')
    }

    // Registrar acción en auditoría
    await AdminApiService.logAuditAction(adminId, AUDIT_ACTIONS.DELETE_USER, userId, {
      deleted_user_name: userData.user_nm,
      deleted_user_email: userData.email,
      was_supplier: userData.main_supplier
    })

    return { deleted: true }
  }, 'Error al eliminar usuario')
}

/**
 * Eliminar múltiples usuarios del sistema
 * @param {string[]} userIds - Array de IDs de usuarios a eliminar
 * @param {string} adminId - ID del administrador que ejecuta la eliminación
 * @returns {Promise<{success: boolean, deleted: number, errors: string[], deletedIds: string[], error?: string}>}
 */
export const deleteMultipleUsers = async (userIds, adminId) => {
  return AdminApiService.executeQuery(async () => {
    if (!userIds || userIds.length === 0) {
      throw new Error('No se proporcionaron usuarios para eliminar')
    }

    if (!adminId) {
      throw new Error('ID del administrador es requerido')
    }

    let deletedCount = 0
    const errors = []
    const deletedIds = []

    // Eliminar usuarios uno por uno para mejor control de errores
    for (const userId of userIds) {
      try {
        const result = await deleteUser(userId, adminId)
        if (result.success) {
          deletedIds.push(userId)
          deletedCount++
        } else {
          errors.push(`Error eliminando usuario ${userId}: ${result.error}`)
        }
      } catch (error) {
        errors.push(`Error eliminando usuario ${userId}: ${error.message}`)
      }
    }

    return { 
      deleted: deletedCount, 
      errors,
      deletedIds,
      totalRequested: userIds.length
    }
  }, 'Error en eliminación múltiple')
}

// ========================================
// 🔧 FUNCIONES AUXILIARES PRIVADAS
// ========================================

/**
 * Enriquecer usuarios con conteo de productos activos
 * @private
 * @param {Array} users - Lista de usuarios
 * @returns {Promise<Array>} Usuarios enriquecidos
 */
async function _enrichUsersWithProductCount(users) {
  const processedData = []
  
  for (const user of users) {
    try {
      // Obtener productos del usuario que están marcados como activos en BD
      const { data: userProducts } = await supabase
        .from('products')
        .select('productqty, minimum_purchase, is_active')
        .eq('supplier_id', user.user_id)
        .eq('is_active', true)

      // Aplicar filtro de productos realmente activos (stock >= compra mínima)
      const activeProductsCount = (userProducts || []).filter(product => {
        const stock = product.productqty || 0
        const minimumPurchase = product.minimum_purchase || 1
        return stock >= minimumPurchase
      }).length

      processedData.push({
        ...user,
        active_products_count: activeProductsCount,
        banned: user.banned || false,
        banned_at: user.banned_at || null,
        banned_reason: user.banned_reason || null
      })
    } catch (error) {
      console.warn(`Error enriqueciendo usuario ${user.user_id}:`, error)
      // Agregar usuario sin enriquecimiento si hay error
      processedData.push({
        ...user,
        active_products_count: 0,
        banned: user.banned || false,
        banned_at: user.banned_at || null,
        banned_reason: user.banned_reason || null
      })
    }
  }
  
  return processedData
}

// ========================================
// 📊 UTILIDADES Y VALIDACIONES
// ========================================

/**
 * Validar formato de email
 * @param {string} email - Email a validar
 * @returns {{valid: boolean, error?: string}}
 */
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  
  if (!email) {
    return { valid: false, error: 'Email es requerido' }
  }
  
  if (!emailRegex.test(email)) {
    return { valid: false, error: 'Formato de email inválido' }
  }
  
  return { valid: true }
}

/**
 * Validar formato de nombre de usuario
 * @param {string} userName - Nombre de usuario a validar
 * @returns {{valid: boolean, error?: string}}
 */
export const validateUserName = (userName) => {
  if (!userName || userName.trim().length === 0) {
    return { valid: false, error: 'Nombre de usuario es requerido' }
  }
  
  if (userName.trim().length < 2) {
    return { valid: false, error: 'Nombre debe tener al menos 2 caracteres' }
  }
  
  if (userName.trim().length > 50) {
    return { valid: false, error: 'Nombre no puede exceder 50 caracteres' }
  }
  
  return { valid: true }
}
