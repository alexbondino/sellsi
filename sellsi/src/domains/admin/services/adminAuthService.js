/**
 * 🔐 Servicio de Autenticación Administrativa - Dominio Admin
 * 
 * Gestiona todas las operaciones de autenticación y seguridad:
 * - Login de administradores
 * - Autenticación de dos factores (2FA)
 * - Gestión de sesiones
 * - Validación de permisos
 * 
 * @author Panel Administrativo Sellsi
 * @date 21 de Julio de 2025 - Migrado a domains/admin/services/
 */

import { AdminApiService, AUDIT_ACTIONS } from './adminApiService'
import { supabase } from '../../../services/supabase'

// ========================================
// 🔐 AUTENTICACIÓN BÁSICA
// ========================================

/**
 * Autenticar administrador contra tabla control_panel_users
 * @param {string} usuario - Usuario administrativo
 * @param {string} password - Contraseña del admin
 * @returns {Promise<{success: boolean, user?: object, twofaStatus?: object, error?: string}>}
 */
export const loginAdmin = async (usuario, password) => {
  return AdminApiService.executeQuery(async () => {
    // Validar parámetros de entrada
    if (!usuario || !password) {
      throw new Error('Usuario y contraseña son requeridos')
    }

    const { data, error } = await supabase
      .from('control_panel_users')
      .select('*')
      .eq('usuario', usuario)
      .eq('is_active', true)
      .single()
    
    if (error || !data) {
      throw new Error('Usuario no encontrado o inactivo')
    }
    
    // Verificar hash de contraseña (temporal con btoa, cambiar por bcrypt)
    const passwordMatch = data.password_hash === btoa(password)
    if (!passwordMatch) {
      throw new Error('Contraseña incorrecta')
    }
    
    // Actualizar última fecha de login
    await supabase
      .from('control_panel_users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', data.id)
    
    // Configurar estado 2FA
    const twofaStatus = {
      required: data.twofa_required,
      configured: data.twofa_configured,
      hasSecret: !!data.twofa_secret
    }

    // Registrar login en auditoría
    await AdminApiService.logAuditAction(data.id, AUDIT_ACTIONS.LOGIN, data.id, {
      usuario,
      login_time: new Date().toISOString()
    })
    
    return { user: data, twofaStatus }
  }, 'Error en autenticación')
}

/**
 * Verificar sesión de administrador activa
 * @param {string} adminId - ID del administrador
 * @returns {Promise<{success: boolean, admin?: object, error?: string}>}
 */
export const verifyAdminSession = async (adminId) => {
  return AdminApiService.executeSupabaseQuery(
    () => supabase
      .from('control_panel_users')
      .select('id, usuario, email, full_name, role, is_active, twofa_required, twofa_configured')
      .eq('id', adminId)
      .eq('is_active', true)
      .single(),
    'Sesión inválida o expirada'
  )
}

// ========================================
// 🔐 AUTENTICACIÓN DE DOS FACTORES (2FA)
// ========================================

/**
 * Verificar código 2FA
 * @param {string} userId - ID del usuario administrativo
 * @param {string} code - Código 2FA de 6 dígitos
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const verify2FA = async (userId, code) => {
  return AdminApiService.executeQuery(async () => {
    // Validar parámetros
    if (!userId || !code) {
      throw new Error('ID de usuario y código 2FA son requeridos')
    }

    if (!/^\d{6}$/.test(code)) {
      throw new Error('Código 2FA debe tener 6 dígitos')
    }

    // Llamar a la Edge Function para verificar el código
    const { data, error } = await supabase.functions.invoke('admin-2fa', {
      body: {
        action: 'verify_token',
        adminId: userId,
        token: code
      }
    })

    if (error) {
      console.error('Error en verify2FA:', error)
      throw new Error('Error verificando código 2FA')
    }

    if (!data.success) {
      throw new Error('Error interno del servidor')
    }

    if (!data.isValid) {
      throw new Error('Código 2FA inválido o expirado')
    }

    // Registrar verificación exitosa
    await AdminApiService.logAuditAction(userId, 'verify_2fa', userId, {
      verification_time: new Date().toISOString()
    })

    return { verified: true }
  }, 'Error verificando código 2FA')
}

/**
 * Generar secret para 2FA y QR code
 * @param {string} adminId - ID del administrador
 * @param {string} email - Email del administrador
 * @returns {Promise<{success: boolean, secret?: string, qrCode?: string, error?: string}>}
 */
export const generate2FASecret = async (adminId, email) => {
  return AdminApiService.executeQuery(async () => {
    // Validar parámetros
    if (!adminId || !email) {
      throw new Error('ID de administrador y email son requeridos')
    }

    const { data, error } = await supabase.functions.invoke('admin-2fa', {
      body: {
        action: 'generate_secret',
        adminId: adminId
      },
      headers: {
        'admin-email': email
      }
    })

    if (error) {
      console.error('Error en generate2FASecret:', error)
      throw new Error('Error generando código 2FA')
    }

    // Registrar generación de secret
    await AdminApiService.logAuditAction(adminId, 'generate_2fa_secret', adminId, {
      email,
      generation_time: new Date().toISOString()
    })

    return {
      secret: data.secret,
      qrCode: data.qrCode
    }
  }, 'Error generando código 2FA')
}

/**
 * Deshabilitar 2FA para un administrador
 * @param {string} adminId - ID del administrador
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const disable2FA = async (adminId) => {
  return AdminApiService.executeQuery(async () => {
    if (!adminId) {
      throw new Error('ID de administrador es requerido')
    }

    const { data, error } = await supabase.functions.invoke('admin-2fa', {
      body: {
        action: 'disable_2fa',
        adminId: adminId
      }
    })

    if (error) {
      console.error('Error en disable2FA:', error)
      throw new Error('Error deshabilitando 2FA')
    }

    // Registrar deshabilitación
    await AdminApiService.logAuditAction(adminId, 'disable_2fa', adminId, {
      disabled_time: new Date().toISOString()
    })

    return { disabled: true }
  }, 'Error deshabilitando 2FA')
}

/**
 * Marcar 2FA como configurado después de la primera configuración exitosa
 * @param {string} adminId - ID del administrador
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const mark2FAAsConfigured = async (adminId) => {
  return AdminApiService.executeSupabaseQuery(
    () => supabase
      .from('control_panel_users')
      .update({ 
        twofa_configured: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', adminId),
    'Error al actualizar estado 2FA'
  )
}

// ========================================
// 🔒 GESTIÓN DE SESIONES Y PERMISOS
// ========================================

/**
 * Cerrar sesión de administrador
 * @param {string} adminId - ID del administrador
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const logoutAdmin = async (adminId) => {
  return AdminApiService.executeQuery(async () => {
    if (!adminId) {
      throw new Error('ID de administrador es requerido')
    }

    // Registrar logout en auditoría
    await AdminApiService.logAuditAction(adminId, AUDIT_ACTIONS.LOGOUT, adminId, {
      logout_time: new Date().toISOString()
    })

    // En el futuro, aquí se podría invalidar tokens JWT o sessions
    // await supabase.auth.signOut()

    return { loggedOut: true }
  }, 'Error cerrando sesión')
}

/**
 * Verificar si un administrador tiene permisos específicos
 * @param {string} adminId - ID del administrador
 * @param {Array<string>} requiredRoles - Roles requeridos
 * @param {string} action - Acción que se quiere realizar
 * @returns {Promise<{success: boolean, hasPermission?: boolean, error?: string}>}
 */
export const checkAdminPermissions = async (adminId, requiredRoles = [], action = '') => {
  return AdminApiService.executeQuery(async () => {
    const validation = await AdminApiService.validateAdminPermissions(adminId, requiredRoles)
    
    if (!validation.success) {
      return validation
    }

    // Registrar verificación de permisos para auditoría
    await AdminApiService.logAuditAction(adminId, 'check_permissions', adminId, {
      action,
      required_roles: requiredRoles,
      check_time: new Date().toISOString()
    })

    return { hasPermission: true, admin: validation.data }
  }, 'Error verificando permisos')
}

/**
 * Cambiar contraseña de administrador
 * @param {string} adminId - ID del administrador
 * @param {string} currentPassword - Contraseña actual
 * @param {string} newPassword - Nueva contraseña
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const changeAdminPassword = async (adminId, currentPassword, newPassword) => {
  return AdminApiService.executeQuery(async () => {
    // Validar parámetros
    if (!adminId || !currentPassword || !newPassword) {
      throw new Error('Todos los campos son requeridos')
    }

    if (newPassword.length < 8) {
      throw new Error('La nueva contraseña debe tener al menos 8 caracteres')
    }

    // Verificar contraseña actual
    const { data: admin, error } = await supabase
      .from('control_panel_users')
      .select('password_hash')
      .eq('id', adminId)
      .single()

    if (error || !admin) {
      throw new Error('Administrador no encontrado')
    }

    if (admin.password_hash !== btoa(currentPassword)) {
      throw new Error('Contraseña actual incorrecta')
    }

    // Actualizar contraseña
    const { error: updateError } = await supabase
      .from('control_panel_users')
      .update({ 
        password_hash: btoa(newPassword), // Temporal, cambiar por bcrypt
        updated_at: new Date().toISOString()
      })
      .eq('id', adminId)

    if (updateError) {
      throw new Error('Error actualizando contraseña')
    }

    // Registrar cambio de contraseña
    await AdminApiService.logAuditAction(adminId, 'change_password', adminId, {
      change_time: new Date().toISOString()
    })

    return { passwordChanged: true }
  }, 'Error cambiando contraseña')
}

// ========================================
// 🔧 UTILIDADES DE AUTENTICACIÓN
// ========================================

/**
 * Validar formato de contraseña
 * @param {string} password - Contraseña a validar
 * @returns {{valid: boolean, errors: Array<string>}}
 */
export const validatePasswordFormat = (password) => {
  const errors = []
  
  if (!password) {
    errors.push('Contraseña es requerida')
    return { valid: false, errors }
  }
  
  if (password.length < 8) {
    errors.push('Debe tener al menos 8 caracteres')
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Debe contener al menos una letra mayúscula')
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Debe contener al menos una letra minúscula')
  }
  
  if (!/\d/.test(password)) {
    errors.push('Debe contener al menos un número')
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Debe contener al menos un carácter especial')
  }
  
  return { valid: errors.length === 0, errors }
}

/**
 * Verificar si un administrador requiere configurar 2FA
 * @param {string} adminId - ID del administrador
 * @returns {Promise<{success: boolean, requires2FA?: boolean, error?: string}>}
 */
export const check2FARequirement = async (adminId) => {
  return AdminApiService.executeSupabaseQuery(
    async () => {
      const { data, error } = await supabase
        .from('control_panel_users')
        .select('twofa_required, twofa_configured')
        .eq('id', adminId)
        .single()
      
      if (error) throw error
      
      return { 
        requires2FA: data.twofa_required && !data.twofa_configured 
      }
    },
    'Error verificando requisitos 2FA'
  )
}
