/**
 * 👤 Servicio de Gestión de Cuentas Administrativas
 * 
 * Gestiona todas las operaciones CRUD sobre cuentas de administradores:
 * - Creación de nuevas cuentas administrativas
 * - Listado y filtrado de administradores
 * - Activación/desactivación de cuentas
 * - Eliminación de cuentas administrativas
 * - Gestión de roles y permisos
 * 
 * @author Panel Administrativo Sellsi
 * @date 17 de Julio de 2025
 */

import { AdminApiService, AUDIT_ACTIONS } from '../core/adminApiService'
import { supabase } from '../../supabase'

// ========================================
// 👤 GESTIÓN DE CUENTAS ADMINISTRATIVAS
// ========================================

/**
 * Crear nueva cuenta de administrador
 * @param {Object} adminData - Datos del nuevo administrador
 * @param {string} adminData.email - Email del admin
 * @param {string} adminData.password - Contraseña del admin
 * @param {string} adminData.fullName - Nombre completo del admin
 * @param {string} adminData.usuario - Usuario del admin
 * @param {string} adminData.role - Rol del admin (default: 'admin')
 * @param {string} adminData.notes - Notas adicionales
 * @param {string} [createdById] - ID del admin que crea la cuenta
 * @returns {Promise<{success: boolean, admin?: object, error?: string}>}
 */
export const createAdminAccount = async (adminData, createdById = null) => {
  return AdminApiService.executeQuery(async () => {
    const { email, password, fullName, usuario, role = 'admin', notes } = adminData

    // Verificar que los datos requeridos están presentes
    if (!email || !password || !fullName || !usuario) {
      throw new Error('Email, contraseña, nombre completo y usuario son requeridos')
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      throw new Error('Formato de email inválido')
    }

    // Validar contraseña
    if (password.length < 8) {
      throw new Error('La contraseña debe tener al menos 8 caracteres')
    }

    // Validar nombre de usuario
    if (usuario.length < 3) {
      throw new Error('El usuario debe tener al menos 3 caracteres')
    }

    if (!/^[a-zA-Z0-9_]+$/.test(usuario)) {
      throw new Error('El usuario solo puede contener letras, números y guiones bajos')
    }

    // Verificar si el email ya existe
    const { data: existingEmailAdmin, error: emailCheckError } = await supabase
      .from('control_panel_users')
      .select('email')
      .eq('email', email)
      .maybeSingle()

    if (emailCheckError && emailCheckError.code !== 'PGRST116') {
      console.error('Error verificando email:', emailCheckError)
      // Continuamos el proceso aunque falle la verificación
    }

    if (existingEmailAdmin) {
      throw new Error('El email ya está registrado')
    }

    // Verificar si el usuario ya existe
    const { data: existingUser, error: userCheckError } = await supabase
      .from('control_panel_users')
      .select('usuario')
      .eq('usuario', usuario)
      .maybeSingle()

    if (userCheckError && userCheckError.code !== 'PGRST116') {
      console.error('Error verificando usuario:', userCheckError)
      // Continuamos el proceso aunque falle la verificación
    }

    if (existingUser) {
      throw new Error('El usuario ya está registrado')
    }

    // Crear hash de la contraseña (en producción usar bcrypt)
    const hashedPassword = btoa(password) // Temporal, cambiar por bcrypt

    // Crear el nuevo administrador
    const { data: newAdmin, error } = await supabase
      .from('control_panel_users')
      .insert([
        {
          usuario,
          email,
          password_hash: hashedPassword,
          full_name: fullName,
          role,
          created_by: createdById,
          is_active: true,
          notes: notes || null,
          created_at: new Date().toISOString()
        }
      ])
      .select()
      .single()

    if (error) {
      console.error('Error creando admin:', error)
      throw new Error('Error al crear la cuenta administrativa')
    }

    // Registrar la acción en el log de auditoría
    if (createdById) {
      await AdminApiService.logAuditAction(createdById, AUDIT_ACTIONS.CREATE_ADMIN, newAdmin.id, {
        created_email: email,
        created_full_name: fullName,
        created_usuario: usuario,
        created_role: role
      })
    }

    // Retornar el admin creado sin la contraseña
    const { password_hash: _, ...adminResponse } = newAdmin
    return adminResponse

  }, 'Error creando cuenta administrativa')
}

/**
 * Obtener lista de cuentas de administrador
 * @param {Object} filters - Filtros para la búsqueda
 * @returns {Promise<{success: boolean, admins?: Array, error?: string}>}
 */
export const getAdminAccounts = async (filters = {}) => {
  return AdminApiService.executeQuery(async () => {
    let query = supabase
      .from('control_panel_users')
      .select(`
        id, 
        usuario, 
        email, 
        full_name, 
        role, 
        is_active, 
        created_at, 
        updated_at, 
        last_login,
        twofa_configured,
        twofa_required,
        notes,
        created_by_admin:created_by (usuario, full_name)
      `)

    // Aplicar filtros
    if (filters.role) {
      query = query.eq('role', filters.role)
    }
    
    if (filters.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active)
    }
    
    if (filters.email) {
      query = query.ilike('email', `%${filters.email}%`)
    }
    
    if (filters.usuario) {
      query = query.ilike('usuario', `%${filters.usuario}%`)
    }
    
    if (filters.fullName) {
      query = query.ilike('full_name', `%${filters.fullName}%`)
    }

    const { data: admins, error } = await query.order('created_at', { ascending: false })

    if (error) {
      console.error('Error obteniendo admins:', error)
      throw new Error('Error al obtener las cuentas administrativas')
    }

    return admins || []
  }, 'Error obteniendo cuentas administrativas')
}

/**
 * Obtener detalles de una cuenta administrativa específica
 * @param {string} adminId - ID del administrador
 * @returns {Promise<{success: boolean, admin?: object, error?: string}>}
 */
export const getAdminAccountDetails = async (adminId) => {
  return AdminApiService.executeQuery(async () => {
    if (!adminId) {
      throw new Error('ID del administrador es requerido')
    }

    const { data: admin, error } = await supabase
      .from('control_panel_users')
      .select(`
        id, 
        usuario, 
        email, 
        full_name, 
        role, 
        is_active, 
        created_at, 
        updated_at, 
        last_login,
        twofa_configured,
        twofa_required,
        notes,
        created_by_admin:created_by (usuario, full_name)
      `)
      .eq('id', adminId)
      .single()

    if (error) {
      console.error('Error obteniendo detalles del admin:', error)
      throw new Error('Administrador no encontrado')
    }

    return admin
  }, 'Error obteniendo detalles del administrador')
}

/**
 * Actualizar estado de cuenta de administrador
 * @param {string} adminId - ID del administrador a actualizar
 * @param {boolean} isActive - Nuevo estado activo/inactivo
 * @param {string} updatedById - ID del admin que hace la actualización
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const updateAdminStatus = async (adminId, isActive, updatedById) => {
  return AdminApiService.executeQuery(async () => {
    if (!adminId || isActive === undefined || !updatedById) {
      throw new Error('ID del administrador, estado e ID del actualizador son requeridos')
    }

    // Verificar que no se está desactivando a sí mismo
    if (adminId === updatedById && !isActive) {
      throw new Error('No puedes desactivar tu propia cuenta')
    }

    // Obtener información actual para auditoría
    const { data: currentAdmin } = await supabase
      .from('control_panel_users')
      .select('is_active, usuario, full_name')
      .eq('id', adminId)
      .single()

    if (!currentAdmin) {
      throw new Error('Administrador no encontrado')
    }

    const { data: updatedAdmin, error } = await supabase
      .from('control_panel_users')
      .update({ 
        is_active: isActive,
        updated_at: new Date().toISOString()
      })
      .eq('id', adminId)
      .select()
      .single()

    if (error) {
      console.error('Error actualizando estado admin:', error)
      throw new Error('Error al actualizar el estado de la cuenta')
    }

    // Registrar la acción en el log de auditoría
    await AdminApiService.logAuditAction(updatedById, 
      isActive ? AUDIT_ACTIONS.ACTIVATE_ADMIN : AUDIT_ACTIONS.DEACTIVATE_ADMIN, 
      adminId, {
        target_usuario: currentAdmin.usuario,
        target_full_name: currentAdmin.full_name,
        previous_status: currentAdmin.is_active,
        new_status: isActive
      })

    return { updated: true }
  }, 'Error actualizando estado de la cuenta')
}

/**
 * Actualizar información de cuenta administrativa
 * @param {string} adminId - ID del administrador a actualizar
 * @param {object} updateData - Datos a actualizar
 * @param {string} updatedById - ID del admin que hace la actualización
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const updateAdminAccount = async (adminId, updateData, updatedById) => {
  return AdminApiService.executeQuery(async () => {
    if (!adminId || !updateData || !updatedById) {
      throw new Error('ID del administrador, datos e ID del actualizador son requeridos')
    }

    // Validar campos permitidos para actualización
    const allowedFields = ['full_name', 'email', 'role', 'notes']
    const sanitizedData = {}

    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        sanitizedData[field] = updateData[field]
      }
    })

    if (Object.keys(sanitizedData).length === 0) {
      throw new Error('No hay campos válidos para actualizar')
    }

    // Validaciones específicas
    if (sanitizedData.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(sanitizedData.email)) {
        throw new Error('Formato de email inválido')
      }

      // Verificar que el email no esté en uso por otro admin
      const { data: existingEmail } = await supabase
        .from('control_panel_users')
        .select('id')
        .eq('email', sanitizedData.email)
        .neq('id', adminId)
        .maybeSingle()

      if (existingEmail) {
        throw new Error('El email ya está en uso por otro administrador')
      }
    }

    if (sanitizedData.full_name && sanitizedData.full_name.trim().length < 2) {
      throw new Error('El nombre completo debe tener al menos 2 caracteres')
    }

    // Obtener datos actuales para auditoría
    const { data: currentAdmin } = await supabase
      .from('control_panel_users')
      .select('usuario, full_name, email, role, notes')
      .eq('id', adminId)
      .single()

    if (!currentAdmin) {
      throw new Error('Administrador no encontrado')
    }

    // Actualizar campos
    sanitizedData.updated_at = new Date().toISOString()

    const { error } = await supabase
      .from('control_panel_users')
      .update(sanitizedData)
      .eq('id', adminId)

    if (error) {
      console.error('Error actualizando admin:', error)
      throw new Error('Error al actualizar la cuenta administrativa')
    }

    // Registrar cambios en auditoría
    const changes = {}
    Object.keys(sanitizedData).forEach(field => {
      if (field !== 'updated_at' && sanitizedData[field] !== currentAdmin[field]) {
        changes[field] = {
          old: currentAdmin[field],
          new: sanitizedData[field]
        }
      }
    })

    if (Object.keys(changes).length > 0) {
      await AdminApiService.logAuditAction(updatedById, AUDIT_ACTIONS.UPDATE_ADMIN, adminId, {
        target_usuario: currentAdmin.usuario,
        changes
      })
    }

    return { updated: true }
  }, 'Error actualizando cuenta administrativa')
}

/**
 * Eliminar cuenta de administrador
 * @param {string} adminId - ID del administrador a eliminar
 * @param {string} deletedById - ID del admin que hace la eliminación
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const deleteAdminAccount = async (adminId, deletedById) => {
  return AdminApiService.executeQuery(async () => {
    if (!adminId || !deletedById) {
      throw new Error('ID del administrador e ID del eliminador son requeridos')
    }

    // Verificar que no se está eliminando a sí mismo
    if (adminId === deletedById) {
      throw new Error('No puedes eliminar tu propia cuenta')
    }

    // Obtener información del admin antes de eliminarlo
    const { data: adminToDelete } = await supabase
      .from('control_panel_users')
      .select('email, full_name, usuario, role')
      .eq('id', adminId)
      .single()

    if (!adminToDelete) {
      throw new Error('Administrador no encontrado')
    }

    // Verificar si es el último administrador activo
    const { data: activeAdmins } = await supabase
      .from('control_panel_users')
      .select('id')
      .eq('is_active', true)

    if (activeAdmins && activeAdmins.length <= 1) {
      throw new Error('No se puede eliminar el último administrador activo del sistema')
    }

    // Eliminar el administrador
    const { error } = await supabase
      .from('control_panel_users')
      .delete()
      .eq('id', adminId)

    if (error) {
      console.error('Error eliminando admin:', error)
      throw new Error('Error al eliminar la cuenta administrativa')
    }

    // Registrar la acción en el log de auditoría
    await AdminApiService.logAuditAction(deletedById, AUDIT_ACTIONS.DELETE_ADMIN, adminId, {
      deleted_email: adminToDelete.email,
      deleted_full_name: adminToDelete.full_name,
      deleted_usuario: adminToDelete.usuario,
      deleted_role: adminToDelete.role
    })

    return { deleted: true }
  }, 'Error eliminando cuenta administrativa')
}

/**
 * Verificar si el admin actual puede crear nuevos admins
 * @param {string} adminId - ID del administrador actual
 * @returns {Promise<{success: boolean, canCreate?: boolean, error?: string}>}
 */
export const canCreateAdmins = async (adminId) => {
  return AdminApiService.executeQuery(async () => {
    if (!adminId) {
      throw new Error('ID del administrador es requerido')
    }

    // Verificar que el admin está autenticado y activo
    const { data: admin, error } = await supabase
      .from('control_panel_users')
      .select('id, role, is_active')
      .eq('id', adminId)
      .eq('is_active', true)
      .single()

    if (error || !admin) {
      throw new Error('Administrador no encontrado o inactivo')
    }

    // En este sistema, todos los admins activos pueden crear otros admins
    // Si se quisiera restricción por rol, se agregaría lógica aquí
    return { canCreate: true }
  }, 'Error verificando permisos de creación')
}

/**
 * Obtener estadísticas de cuentas administrativas
 * @returns {Promise<{success: boolean, stats?: object, error?: string}>}
 */
export const getAdminAccountStats = async () => {
  return AdminApiService.executeQuery(async () => {
    const { data: admins, error } = await supabase
      .from('control_panel_users')
      .select('id, role, is_active, twofa_configured, created_at')

    if (error) {
      console.error('Error obteniendo estadísticas de admins:', error)
      throw new Error('Error al cargar estadísticas')
    }

    const adminsData = admins || []
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000))

    const stats = {
      total_admins: adminsData.length,
      active_admins: adminsData.filter(admin => admin.is_active).length,
      inactive_admins: adminsData.filter(admin => !admin.is_active).length,
      with_2fa: adminsData.filter(admin => admin.twofa_configured).length,
      without_2fa: adminsData.filter(admin => !admin.twofa_configured).length,
      created_last_30_days: adminsData.filter(admin => 
        new Date(admin.created_at) > thirtyDaysAgo
      ).length,
      by_role: {}
    }

    // Estadísticas por rol
    adminsData.forEach(admin => {
      const role = admin.role || 'unknown'
      if (!stats.by_role[role]) {
        stats.by_role[role] = { total: 0, active: 0 }
      }
      stats.by_role[role].total++
      if (admin.is_active) {
        stats.by_role[role].active++
      }
    })

    return stats
  }, 'Error obteniendo estadísticas de cuentas administrativas')
}

// ========================================
// 🔧 UTILIDADES Y VALIDACIONES
// ========================================

/**
 * Validar datos de creación de administrador
 * @param {object} adminData - Datos a validar
 * @returns {{valid: boolean, errors: Array<string>}}
 */
export const validateAdminCreationData = (adminData) => {
  const errors = []
  
  if (!adminData) {
    errors.push('Datos del administrador son requeridos')
    return { valid: false, errors }
  }
  
  // Validar email
  if (!adminData.email) {
    errors.push('Email es requerido')
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(adminData.email)) {
      errors.push('Formato de email inválido')
    }
  }
  
  // Validar contraseña
  if (!adminData.password) {
    errors.push('Contraseña es requerida')
  } else if (adminData.password.length < 8) {
    errors.push('La contraseña debe tener al menos 8 caracteres')
  }
  
  // Validar nombre completo
  if (!adminData.fullName) {
    errors.push('Nombre completo es requerido')
  } else if (adminData.fullName.trim().length < 2) {
    errors.push('El nombre completo debe tener al menos 2 caracteres')
  }
  
  // Validar usuario
  if (!adminData.usuario) {
    errors.push('Usuario es requerido')
  } else {
    if (adminData.usuario.length < 3) {
      errors.push('El usuario debe tener al menos 3 caracteres')
    }
    if (!/^[a-zA-Z0-9_]+$/.test(adminData.usuario)) {
      errors.push('El usuario solo puede contener letras, números y guiones bajos')
    }
  }
  
  // Validar rol
  const validRoles = ['admin', 'super_admin', 'moderator']
  if (adminData.role && !validRoles.includes(adminData.role)) {
    errors.push('Rol no válido')
  }
  
  return { valid: errors.length === 0, errors }
}

/**
 * Generar contraseña temporal segura
 * @param {number} length - Longitud de la contraseña
 * @returns {string} Contraseña generada
 */
export const generateTemporaryPassword = (length = 12) => {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
  let password = ''
  
  // Asegurar al menos un carácter de cada tipo
  password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)] // minúscula
  password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)] // mayúscula
  password += '0123456789'[Math.floor(Math.random() * 10)] // número
  password += '!@#$%^&*'[Math.floor(Math.random() * 8)] // especial
  
  // Completar con caracteres aleatorios
  for (let i = password.length; i < length; i++) {
    password += charset[Math.floor(Math.random() * charset.length)]
  }
  
  // Mezclar caracteres
  return password.split('').sort(() => Math.random() - 0.5).join('')
}
