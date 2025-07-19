/**
 * 👤 Servicio de Gestión de Cuentas Administrativas
 * 
 * Funcionalidades para crear, gestionar y administrar cuentas de administradores
 * del sistema de panel de control.
 * 
 * @author Panel Administrativo Sellsi
 * @date 17 de Julio de 2025
 */

import { supabase } from '../../supabase'

/**
 * Crear nueva cuenta de administrador
 * @param {Object} adminData - Datos del nuevo administrador
 * @param {string} adminData.email - Email del admin
 * @param {string} adminData.password - Contraseña del admin
 * @param {string} adminData.fullName - Nombre completo del admin
 * @param {string} adminData.usuario - Usuario del admin
 * @param {string} adminData.role - Rol del admin (default: 'admin')
 * @param {string} [createdById] - ID del admin que crea la cuenta
 * @returns {Promise<{success: boolean, admin?: object, error?: string}>}
 */
export const createAdminAccount = async (adminData, createdById = null) => {
  try {
    const { email, password, fullName, usuario, role = 'admin', notes } = adminData;

    // Verificar que los datos requeridos están presentes
    if (!email || !password || !fullName || !usuario) {
      return { success: false, error: 'Datos incompletos' };
    }

    // Verificar si el email ya existe
    const { data: existingAdmin, error: emailCheckError } = await supabase
      .from('control_panel_users')
      .select('email')
      .eq('email', email)
      .maybeSingle();

    if (emailCheckError) {
      console.error('Error verificando email:', emailCheckError);
      // Continuamos el proceso aunque falle la verificación
    }

    if (existingAdmin) {
      return { success: false, error: 'El email ya está registrado' };
    }

    // Verificar si el usuario ya existe
    const { data: existingUser, error: userCheckError } = await supabase
      .from('control_panel_users')
      .select('usuario')
      .eq('usuario', usuario)
      .maybeSingle();

    if (userCheckError) {
      console.error('Error verificando usuario:', userCheckError);
      // Continuamos el proceso aunque falle la verificación
    }

    if (existingUser) {
      return { success: false, error: 'El usuario ya está registrado' };
    }

    // Crear hash de la contraseña (en producción usar bcrypt)
    const hashedPassword = btoa(password); // Temporal, cambiar por bcrypt

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
          notes
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creando admin:', error);
      return { success: false, error: 'Error al crear la cuenta' };
    }

    // Registrar la acción en el log de auditoría
    if (createdById) {
      await supabase
        .from('admin_audit_log')
        .insert([
          {
            admin_id: createdById,
            action: 'create_admin',
            target_id: newAdmin.id,
            details: {
              email,
              full_name: fullName,
              role
            }
          }
        ]);
    }

    // Retornar el admin creado sin la contraseña
    const { password_hash, ...adminResponse } = newAdmin;
    return { success: true, admin: adminResponse };

  } catch (error) {
    console.error('Error en createAdminAccount:', error);
    return { success: false, error: 'Error interno del servidor' };
  }
};

/**
 * Obtener lista de cuentas de administrador
 * @param {Object} filters - Filtros para la búsqueda
 * @returns {Promise<{success: boolean, admins?: Array, error?: string}>}
 */
export const getAdminAccounts = async (filters = {}) => {
  try {
    let query = supabase
      .from('control_panel_users')
      .select('id, usuario, email, full_name, role, is_active, created_at, updated_at');

    // Aplicar filtros
    if (filters.role) {
      query = query.eq('role', filters.role);
    }
    if (filters.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active);
    }
    if (filters.email) {
      query = query.ilike('email', `%${filters.email}%`);
    }

    const { data: admins, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error obteniendo admins:', error);
      return { success: false, error: 'Error al obtener las cuentas' };
    }

    return { success: true, admins };
  } catch (error) {
    console.error('Error en getAdminAccounts:', error);
    return { success: false, error: 'Error interno del servidor' };
  }
};

/**
 * Actualizar estado de cuenta de administrador
 * @param {string} adminId - ID del administrador a actualizar
 * @param {boolean} isActive - Nuevo estado activo/inactivo
 * @param {string} updatedById - ID del admin que hace la actualización
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const updateAdminStatus = async (adminId, isActive, updatedById) => {
  try {
    const { data: updatedAdmin, error } = await supabase
      .from('control_panel_users')
      .update({ 
        is_active: isActive,
        updated_at: new Date().toISOString()
      })
      .eq('id', adminId)
      .select()
      .single();

    if (error) {
      console.error('Error actualizando estado admin:', error);
      return { success: false, error: 'Error al actualizar el estado' };
    }

    // Registrar la acción en el log de auditoría
    await supabase
      .from('admin_audit_log')
      .insert([
        {
          admin_id: updatedById,
          action: isActive ? 'activate_admin' : 'deactivate_admin',
          target_id: adminId,
          details: {
            previous_status: !isActive,
            new_status: isActive
          }
        }
      ]);

    return { success: true };
  } catch (error) {
    console.error('Error en updateAdminStatus:', error);
    return { success: false, error: 'Error interno del servidor' };
  }
};

/**
 * Eliminar cuenta de administrador
 * @param {string} adminId - ID del administrador a eliminar
 * @param {string} deletedById - ID del admin que hace la eliminación
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const deleteAdminAccount = async (adminId, deletedById) => {
  try {
    // Verificar que no se está eliminando a sí mismo
    if (adminId === deletedById) {
      return { success: false, error: 'No puedes eliminar tu propia cuenta' };
    }

    // Obtener información del admin antes de eliminarlo
    const { data: adminToDelete } = await supabase
      .from('control_panel_users')
      .select('email, full_name')
      .eq('id', adminId)
      .single();

    // Eliminar el administrador
    const { error } = await supabase
      .from('control_panel_users')
      .delete()
      .eq('id', adminId);

    if (error) {
      console.error('Error eliminando admin:', error);
      return { success: false, error: 'Error al eliminar la cuenta' };
    }

    // Registrar la acción en el log de auditoría
    await supabase
      .from('admin_audit_log')
      .insert([
        {
          admin_id: deletedById,
          action: 'delete_admin',
          target_id: adminId,
          details: {
            deleted_email: adminToDelete?.email,
            deleted_name: adminToDelete?.full_name
          }
        }
      ]);

    return { success: true };
  } catch (error) {
    console.error('Error en deleteAdminAccount:', error);
    return { success: false, error: 'Error interno del servidor' };
  }
};

/**
 * Verificar si el admin actual puede crear nuevos admins
 * @param {string} adminId - ID del administrador actual
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const canCreateAdmins = async (adminId) => {
  try {
    // Verificar que el admin está autenticado
    const { data: admin, error } = await supabase
      .from('control_panel_users')
      .select('id, role, is_active')
      .eq('id', adminId)
      .eq('is_active', true)
      .single();

    if (error || !admin) {
      return { success: false, error: 'Admin no encontrado o inactivo' };
    }

    // En tu caso, todos los admins pueden crear otros admins
    // Si quisieras restricción adicional, podrías agregar lógica aquí
    return { success: true };
  } catch (error) {
    console.error('Error verificando permisos:', error);
    return { success: false, error: 'Error interno del servidor' };
  }
};
