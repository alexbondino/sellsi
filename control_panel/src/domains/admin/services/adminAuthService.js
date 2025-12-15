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
    
    // Verificar contraseña usando Edge Function con bcrypt
    const { data: verifyResult, error: verifyError } = await supabase.functions.invoke('admin-2fa', {
      body: {
        action: 'verify_password',
        adminId: data.id,
        password: password
      }
    })
    
    if (verifyError || !verifyResult?.success) {
      throw new Error('Contraseña incorrecta')
    }
    
    // Si la contraseña necesita rehash, marcar en el objeto usuario
    if (verifyResult.needs_rehash) {
      data.needs_password_change = true
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
export const verify2FA = async (userId, code, { remember = false, deviceFingerprint } = {}) => {
  return AdminApiService.executeQuery(async () => {
    // Validar parámetros
    if (!userId || !code) {
      throw new Error('ID de usuario y código 2FA son requeridos')
    }

    if (!/^\d{6}$/.test(code)) {
      throw new Error('Código 2FA debe tener 6 dígitos')
    }

    // Llamar a la Edge Function para verificar el código
    const body = {
      action: 'verify_token',
      adminId: userId,
      token: code
    }
    if (remember && deviceFingerprint) {
      body.remember = true
      body.device_fingerprint = deviceFingerprint
    }
    const { data, error } = await supabase.functions.invoke('admin-2fa', { body })

    if (error) {
      console.error('Error en verify2FA:', error)
      throw new Error('Error verificando código 2FA')
    }

    if (!data.success) {
      if (data.error === 'Invalid token') {
        throw new Error(data.error)
      }
      throw new Error(data.error || 'Error verificando código 2FA')
    }

    // Registrar verificación exitosa
    await AdminApiService.logAuditAction(userId, 'verify_2fa', userId, {
      verification_time: new Date().toISOString()
    })

    return { verified: true, trustToken: data.trust_token }
  }, 'Error verificando código 2FA')
}

// Verificar si el dispositivo ya es de confianza y puede saltar 2FA
export const checkTrustedDevice = async (adminId, deviceFingerprint, trustToken) => {
  return AdminApiService.executeQuery(async () => {
    if (!adminId || !deviceFingerprint) throw new Error('Parámetros requeridos')
    const headers = {}
    if (trustToken) headers['x-trust-token'] = trustToken
    const { data, error } = await supabase.functions.invoke('admin-2fa', {
      body: {
        action: 'check_trust',
        adminId,
        device_fingerprint: deviceFingerprint
      },
      headers
    })
    if (error) throw new Error('Error verificando dispositivo')
    return { trusted: !!data?.trusted }
  }, 'Error verificando dispositivo de confianza')
}

/**
 * Generar secret para 2FA y QR code
 * @param {string} adminId - ID del administrador
 * @param {string} email - Email del administrador
 * @returns {Promise<{success: boolean, secret?: string, qrCode?: string, error?: string}>}
 */
export const generate2FASecret = async (adminId, email, password = null) => {
  return AdminApiService.executeQuery(async () => {
    // Validar parámetros
    if (!adminId || !email) {
      throw new Error('ID de administrador y email son requeridos')
    }

    const { data, error } = await supabase.functions.invoke('admin-2fa', {
      body: {
        action: 'generate_secret',
        adminId: adminId,
        password: password // Enviar password si se proporciona (necesario para setup inicial)
      },
      headers: {
        'admin-email': email
      }
    })

    if (error) {
      console.error('Error en generate2FASecret:', error)
      throw new Error('Error generando código 2FA')
    }

    // Registrar generación de secret (solo si hay sesión activa, para evitar errores de RLS)
    const { data: session } = await supabase.auth.getSession()
    if (session?.session) {
      await AdminApiService.logAuditAction(adminId, 'generate_2fa_secret', adminId, {
        email,
        generation_time: new Date().toISOString()
      })
    }

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
 * ✅ Cambiar contraseña de administrador con bcrypt
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

    // Validar fortaleza de nueva contraseña
    const validation = validatePasswordStrength(newPassword)
    if (!validation.valid) {
      throw new Error(`Contraseña no cumple requisitos: ${validation.errors.join(', ')}`)
    }

    // Llamar a Edge Function para cambiar contraseña con bcrypt
    const { data, error } = await supabase.functions.invoke('admin-2fa', {
      body: {
        action: 'change_password',
        adminId: adminId,
        old_password: currentPassword,
        new_password: newPassword
      }
    })

    if (error || !data?.success) {
      throw new Error(data?.error || 'Error al cambiar contraseña')
    }

    // Registrar cambio en auditoría
    await AdminApiService.logAuditAction(adminId, 'password_changed', adminId, {
      changed_at: new Date().toISOString()
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
