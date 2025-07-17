/**
 * 🔧 Servicio del Panel de Control Administrativo
 * 
 * Gestiona todas las operaciones CRUD para el panel administrativo:
 * - Autenticación de administradores
 * - Gestión de solicitudes (confirmación, rechazo, devolución)
 * - Subida de comprobantes y adjuntos
 * - Auditoría y logs de acciones
 * 
 * @author Panel Administrativo Sellsi
 * @date 30 de Junio de 2025
 */

import { supabase } from './supabase'

// ========================================
// 🔐 AUTENTICACIÓN DE ADMINISTRADORES
// ========================================

/**
 * Autenticar administrador contra tabla control_panel_users
 * @param {string} usuario - Usuario administrativo
 * @param {string} password - Contraseña del admin
 * @returns {Promise<{success: boolean, user?: object, error?: string}>}
 */
export const loginAdmin = async (usuario, password) => {
  try {
    const { data, error } = await supabase
      .from('control_panel_users')
      .select('*')
      .eq('usuario', usuario)
      .eq('is_active', true)
      .single()
    
    if (error || !data) {
      return { success: false, error: 'Usuario no encontrado o inactivo' }
    }
    
    // Verificar hash de contraseña (temporal con btoa, cambiar por bcrypt)
    const passwordMatch = data.password_hash === btoa(password)
    if (!passwordMatch) {
      return { success: false, error: 'Contraseña incorrecta' }
    }
    
    // Actualizar última fecha de login
    await supabase
      .from('control_panel_users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', data.id)
    
    // ✅ NUEVA LÓGICA 2FA OBLIGATORIO
    const twofaStatus = {
      required: data.twofa_required,
      configured: data.twofa_configured,
      hasSecret: !!data.twofa_secret
    }
    
    return { success: true, user: data, twofaStatus }
  } catch (error) {
    console.error('Error en loginAdmin:', error)
    return { success: false, error: 'Error interno del servidor' }
  }
}

/**
 * Verificar código 2FA
 * @param {string} userId - ID del usuario administrativo
 * @param {string} code - Código 2FA de 6 dígitos
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const verify2FA = async (userId, code) => {
  try {
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
      return { success: false, error: 'Error verificando código 2FA' }
    }

    if (!data.success) {
      return { success: false, error: 'Error interno del servidor' }
    }

    return { 
      success: data.isValid, 
      error: data.isValid ? null : 'Código 2FA inválido o expirado' 
    }
  } catch (error) {
    console.error('Error en verify2FA:', error)
    return { success: false, error: 'Error interno del servidor' }
  }
}

/**
 * Generar secret para 2FA y QR code
 * @param {string} adminId - ID del administrador
 * @param {string} email - Email del administrador
 * @returns {Promise<{success: boolean, secret?: string, qrCode?: string, error?: string}>}
 */
export const generate2FASecret = async (adminId, email) => {
  try {
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
      return { success: false, error: 'Error generando código 2FA' }
    }

    return {
      success: true,
      secret: data.secret,
      qrCode: data.qrCode
    }
  } catch (error) {
    console.error('Error en generate2FASecret:', error)
    return { success: false, error: 'Error interno del servidor' }
  }
}

/**
 * Deshabilitar 2FA para un administrador
 * @param {string} adminId - ID del administrador
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const disable2FA = async (adminId) => {
  try {
    const { data, error } = await supabase.functions.invoke('admin-2fa', {
      body: {
        action: 'disable_2fa',
        adminId: adminId
      }
    })

    if (error) {
      console.error('Error en disable2FA:', error)
      return { success: false, error: 'Error deshabilitando 2FA' }
    }

    return { success: true }
  } catch (error) {
    console.error('Error en disable2FA:', error)
    return { success: false, error: 'Error interno del servidor' }
  }
}

/**
 * Marcar 2FA como configurado después de la primera configuración exitosa
 * @param {string} adminId - ID del administrador
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const mark2FAAsConfigured = async (adminId) => {
  try {
    const { error } = await supabase
      .from('control_panel_users')
      .update({ 
        twofa_configured: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', adminId)
    
    if (error) {
      console.error('Error marcando 2FA como configurado:', error)
      return { success: false, error: 'Error al actualizar estado 2FA' }
    }
    
    return { success: true }
  } catch (error) {
    console.error('Error en mark2FAAsConfigured:', error)
    return { success: false, error: 'Error interno del servidor' }
  }
}

// ========================================
// 📋 GESTIÓN DE SOLICITUDES
// ========================================

/**
 * Obtener todas las solicitudes para el panel administrativo
 * @param {object} filters - Filtros opcionales (estado, fecha, proveedor, etc.)
 * @returns {Promise<{success: boolean, data?: array, error?: string}>}
 */
export const getSolicitudes = async (filters = {}) => {
  try {
    // TODO: Implementar cuando se creen las tablas
    /*
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
    
    if (filters.estado) {
      query = query.eq('estado', filters.estado)
    }
    
    if (filters.fechaDesde) {
      query = query.gte('fecha_solicitada', filters.fechaDesde)
    }
    
    if (filters.fechaHasta) {
      query = query.lte('fecha_solicitada', filters.fechaHasta)
    }
    
    if (filters.proveedor) {
      query = query.ilike('proveedor', `%${filters.proveedor}%`)
    }
    
    const { data, error } = await query.order('created_at', { ascending: false })
    
    if (error) {
      return { success: false, error: error.message }
    }
    
    return { success: true, data }
    */
    
    // Datos mock para desarrollo
    const mockData = [
      {
        id: '1',
        proveedor: 'Proveedor Demo 1',
        comprador: 'Comprador Demo 1',
        ticket: 'TKT-001',
        direccion_entrega: 'Av. Providencia 123, Santiago',
        fecha_solicitada: '2025-06-30',
        fecha_entrega: null,
        venta: 150000,
        estado: 'pendiente',
        acciones: 'confirmar,rechazar',
        comprobante_pago: null,
        created_at: '2025-06-30T10:00:00Z'
      },
      {
        id: '2',
        proveedor: 'Proveedor Demo 2',
        comprador: 'Comprador Demo 2',
        ticket: 'TKT-002',
        direccion_entrega: 'Av. Las Condes 456, Santiago',
        fecha_solicitada: '2025-06-29',
        fecha_entrega: '2025-06-30',
        venta: 75000,
        estado: 'entregado',
        acciones: 'devolver',
        comprobante_pago: 'comprobante_001.pdf',
        created_at: '2025-06-29T15:30:00Z'
      }
    ]
    
    return { success: true, data: mockData }
  } catch (error) {
    console.error('Error en getSolicitudes:', error)
    return { success: false, error: 'Error interno del servidor' }
  }
}

/**
 * Confirmar pago de una solicitud
 * @param {string} solicitudId - ID de la solicitud
 * @param {object} datos - Datos de confirmación (comprobante, etc.)
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const confirmarPago = async (solicitudId, datos) => {
  try {
    // TODO: Implementar cuando se creen las tablas
    /*
    const { error } = await supabase
      .from('control_panel')
      .update({
        estado: 'confirmado',
        comprobante_pago: datos.comprobante_url,
        updated_at: new Date().toISOString()
      })
      .eq('id', solicitudId)
    
    if (error) {
      return { success: false, error: error.message }
    }
    
    // Registrar acción en logs de auditoría
    await registrarAccion('confirmar_pago', solicitudId, datos)
    
    return { success: true }
    */
    
    // Confirmar pago
    return { success: true }
  } catch (error) {
    console.error('Error en confirmarPago:', error)
    return { success: false, error: 'Error interno del servidor' }
  }
}

/**
 * Rechazar pago de una solicitud
 * @param {string} solicitudId - ID de la solicitud
 * @param {object} datos - Datos de rechazo (motivo, adjuntos, etc.)
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const rechazarPago = async (solicitudId, datos) => {
  try {
    // TODO: Implementar cuando se creen las tablas
    /*
    const { error } = await supabase
      .from('control_panel')
      .update({
        estado: 'rechazado',
        motivo_rechazo: datos.motivo,
        adjuntos: datos.adjuntos_urls,
        updated_at: new Date().toISOString()
      })
      .eq('id', solicitudId)
    
    if (error) {
      return { success: false, error: error.message }
    }
    
    // Registrar acción en logs de auditoría
    await registrarAccion('rechazar_pago', solicitudId, datos)
    
    return { success: true }
    */
    
    // Rechazar pago
    return { success: true }
  } catch (error) {
    console.error('Error en rechazarPago:', error)
    return { success: false, error: 'Error interno del servidor' }
  }
}

/**
 * Procesar devolución de una solicitud
 * @param {string} solicitudId - ID de la solicitud
 * @param {object} datos - Datos de devolución (monto, comprobante, etc.)
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const devolverPago = async (solicitudId, datos) => {
  try {
    // TODO: Implementar cuando se creen las tablas
    /*
    const { error } = await supabase
      .from('control_panel')
      .update({
        estado: 'devuelto',
        comprobante_pago: datos.comprobante_devolucion_url,
        updated_at: new Date().toISOString()
      })
      .eq('id', solicitudId)
    
    if (error) {
      return { success: false, error: error.message }
    }
    
    // Registrar acción en logs de auditoría
    await registrarAccion('devolver_pago', solicitudId, datos)
    
    return { success: true }
    */
    
    // Devolver pago
    return { success: true }
  } catch (error) {
    console.error('Error en devolverPago:', error)
    return { success: false, error: 'Error interno del servidor' }
  }
}

// ========================================
// 📎 GESTIÓN DE ARCHIVOS
// ========================================

/**
 * Subir comprobante de pago al storage
 * @param {File} file - Archivo a subir
 * @param {string} solicitudId - ID de la solicitud relacionada
 * @returns {Promise<{success: boolean, url?: string, error?: string}>}
 */
export const subirComprobante = async (file, solicitudId) => {
  try {
    const fileName = `comprobantes/${solicitudId}/${Date.now()}_${file.name}`
    
    const { data, error } = await supabase.storage
      .from('admin-documents')
      .upload(fileName, file)
    
    if (error) {
      return { success: false, error: error.message }
    }
    
    const { data: urlData } = supabase.storage
      .from('admin-documents')
      .getPublicUrl(fileName)
    
    return { success: true, url: urlData.publicUrl }
  } catch (error) {
    console.error('Error en subirComprobante:', error)
    return { success: false, error: 'Error interno del servidor' }
  }
}

/**
 * Subir adjuntos (para rechazos u otros)
 * @param {FileList} files - Archivos a subir
 * @param {string} solicitudId - ID de la solicitud relacionada
 * @returns {Promise<{success: boolean, urls?: array, error?: string}>}
 */
export const subirAdjuntos = async (files, solicitudId) => {
  try {
    const urls = []
    
    for (const file of files) {
      const fileName = `adjuntos/${solicitudId}/${Date.now()}_${file.name}`
      
      const { data, error } = await supabase.storage
        .from('admin-documents')
        .upload(fileName, file)
      
      if (error) {
        return { success: false, error: error.message }
      }
      
      const { data: urlData } = supabase.storage
        .from('admin-documents')
        .getPublicUrl(fileName)
      
      urls.push(urlData.publicUrl)
    }
    
    return { success: true, urls }
  } catch (error) {
    console.error('Error en subirAdjuntos:', error)
    return { success: false, error: 'Error interno del servidor' }
  }
}

// ========================================
// 📊 AUDITORÍA Y LOGS
// ========================================

/**
 * Registrar acción administrativa en logs de auditoría
 * @param {string} accion - Tipo de acción realizada
 * @param {string} solicitudId - ID de la solicitud afectada
 * @param {object} detalles - Detalles adicionales de la acción
 * @returns {Promise<{success: boolean, error?: string}>}
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

/**
 * Obtener logs de auditoría
 * @param {object} filters - Filtros opcionales
 * @returns {Promise<{success: boolean, data?: array, error?: string}>}
 */
export const getLogs = async (filters = {}) => {
  try {
    // TODO: Implementar cuando se creen las tablas
    /*
    let query = supabase
      .from('admin_logs')
      .select('*')
    
    if (filters.usuario) {
      query = query.eq('usuario', filters.usuario)
    }
    
    if (filters.accion) {
      query = query.eq('accion', filters.accion)
    }
    
    if (filters.fechaDesde) {
      query = query.gte('fecha', filters.fechaDesde)
    }
    
    const { data, error } = await query.order('fecha', { ascending: false })
    
    if (error) {
      return { success: false, error: error.message }
    }
    
    return { success: true, data }
    */
    
    return { success: true, data: [] }
  } catch (error) {
    console.error('Error en getLogs:', error)
    return { success: false, error: 'Error interno del servidor' }
  }
}

// ========================================
// 🔧 UTILIDADES
// ========================================

/**
 * Obtener estadísticas del panel administrativo
 * @returns {Promise<{success: boolean, stats?: object, error?: string}>}
 */
export const getEstadisticas = async () => {
  try {
    // TODO: Implementar cuando se creen las tablas
    /*
    const { data: solicitudes } = await supabase
      .from('control_panel')
      .select('estado')
    
    const stats = {
      total: solicitudes.length,
      pendientes: solicitudes.filter(s => s.estado === 'pendiente').length,
      confirmados: solicitudes.filter(s => s.estado === 'confirmado').length,
      rechazados: solicitudes.filter(s => s.estado === 'rechazado').length,
      devueltos: solicitudes.filter(s => s.estado === 'devuelto').length
    }
    
    return { success: true, stats }
    */
    
    // Stats mock para desarrollo
    const mockStats = {
      total: 25,
      pendientes: 8,
      confirmados: 12,
      rechazados: 3,
      devueltos: 2
    }
    
    return { success: true, stats: mockStats }
  } catch (error) {
    console.error('Error en getEstadisticas:', error)
    return { success: false, error: 'Error interno del servidor' }
  }
}

/**
 * Validar formato de archivos permitidos
 * @param {File} file - Archivo a validar
 * @returns {boolean}
 */
export const validarArchivo = (file) => {
  const tiposPermitidos = ['image/jpeg', 'image/png', 'application/pdf', 'image/webp']
  const tamañoMaximo = 5 * 1024 * 1024 // 5MB
  
  if (!tiposPermitidos.includes(file.type)) {
    return { valido: false, error: 'Tipo de archivo no permitido' }
  }
  
  if (file.size > tamañoMaximo) {
    return { valido: false, error: 'Archivo demasiado grande (máx. 5MB)' }
  }
  
  return { valido: true }
}

// ========================================
// 📧 NOTIFICACIONES
// ========================================

/**
 * Enviar notificación a comprador sobre estado de solicitud
 * @param {string} compradorEmail - Email del comprador
 * @param {string} tipoNotificacion - Tipo: 'confirmado', 'rechazado', 'devuelto'
 * @param {object} datos - Datos adicionales para la notificación
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const enviarNotificacion = async (compradorEmail, tipoNotificacion, datos) => {
  try {
    // TODO: Implementar sistema de notificaciones
    // Podría usar Supabase Functions, SendGrid, o similar
    
    // Enviar notificación
    return { success: true }
  } catch (error) {
    console.error('Error en enviarNotificacion:', error)
    return { success: false, error: 'Error interno del servidor' }
  }
}

// ========================================
// 👥 GESTIÓN DE USUARIOS
// ========================================

/**
 * Obtener lista de usuarios con filtros
 * @param {object} filtros - Filtros a aplicar (estado, tipo, búsqueda)
 * @returns {Promise<{success: boolean, data?: array, error?: string}>}
 */
export const getUsers = async (filtros = {}) => {
  try {
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
      `);

    // Aplicar filtros
    if (filtros.userType === 'suppliers') {
      query = query.eq('main_supplier', true);
    } else if (filtros.userType === 'buyers') {
      query = query.eq('main_supplier', false);
    }

    if (filtros.search) {
      query = query.or(`user_nm.ilike.%${filtros.search}%,email.ilike.%${filtros.search}%`);
    }

    const { data, error } = await query.order('createdt', { ascending: false });

    if (error) {
      console.error('Error obteniendo usuarios:', error);
      return { success: false, error: 'Error al cargar usuarios' };
    }

    // Obtener conteo de productos activos para cada usuario
    const processedData = [];
    for (const user of data || []) {
      // Obtener productos del usuario que están marcados como activos en BD
      const { data: userProducts } = await supabase
        .from('products')
        .select('productqty, minimum_purchase, is_active')
        .eq('supplier_id', user.user_id)
        .eq('is_active', true);

      // Aplicar filtro de productos realmente activos (stock >= compra mínima)
      const activeProductsCount = (userProducts || []).filter(product => {
        const stock = product.productqty || 0;
        const minimumPurchase = product.minimum_purchase || 1;
        return stock >= minimumPurchase;
      }).length;

      processedData.push({
        ...user,
        active_products_count: activeProductsCount,
        banned: user.banned || false,
        banned_at: user.banned_at || null,
        banned_reason: user.banned_reason || null
      });
    }

    return { success: true, data: processedData };
  } catch (error) {
    console.error('Error en getUsers:', error);
    return { success: false, error: 'Error interno del servidor' };
  }
};

/**
 * Obtener estadísticas de usuarios
 * @returns {Promise<{success: boolean, stats?: object, error?: string}>}
 */
export const getUserStats = async () => {
  try {
    // Obtener todos los usuarios con información de ban y verificación
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('user_id, main_supplier, banned, verified');

    if (usersError) {
      console.error('Error obteniendo usuarios:', usersError);
      return { success: false, error: 'Error al cargar estadísticas de usuarios' };
    }

    const users = usersData || [];
    const totalUsers = users.length;
    const bannedUsers = users.filter(user => user.banned === true).length;
    const activeUsers = totalUsers - bannedUsers;
    const suppliers = users.filter(user => user.main_supplier === true).length;
    const buyers = totalUsers - suppliers;
    const verifiedUsers = users.filter(user => user.verified === true).length;
    const unverifiedUsers = totalUsers - verifiedUsers;

    const stats = {
      totalUsers,
      activeUsers,
      bannedUsers,
      suppliers,
      buyers,
      verifiedUsers,
      unverifiedUsers
    };

    return { success: true, stats };
  } catch (error) {
    console.error('Error en getUserStats:', error);
    return { success: false, error: 'Error interno del servidor' };
  }
};

/**
 * Banear un usuario
 * @param {string} userId - ID del usuario a banear
 * @param {string} reason - Razón del baneo
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const banUser = async (userId, reason) => {
  try {
    // Primero obtenemos la información del usuario, incluyendo su última IP
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('last_ip')
      .eq('user_id', userId)
      .single();

    if (userError) {
      console.error('Error obteniendo datos del usuario:', userError);
      return { success: false, error: 'Error obteniendo datos del usuario' };
    }

    // Usar las nuevas columnas implementadas en el SQL
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        banned: true,
        banned_at: new Date().toISOString(),
        banned_reason: reason || null,
        updatedt: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (updateError) {
      console.error('Error baneando usuario:', updateError);
      return { success: false, error: 'Error al banear usuario' };
    }

    // Si el usuario tiene una IP registrada, también banear la IP
    if (userData.last_ip) {
      const { error: ipBanError } = await supabase
        .from('banned_ips')
        .upsert({
          ip: userData.last_ip,
          banned_at: new Date().toISOString(),
          banned_reason: reason || 'Baneado junto con usuario',
          banned_by: null // TODO: Usar ID del admin actual cuando esté implementado
        });

      if (ipBanError) {
        console.warn('Error baneando IP:', ipBanError);
        // No fallar la operación completa si solo falla el baneo de IP
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Error en banUser:', error);
    return { success: false, error: 'Error interno del servidor' };
  }
};

/**
 * Desbanear un usuario
 * @param {string} userId - ID del usuario a desbanear
 * @param {string} reason - Razón del desbaneo
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const unbanUser = async (userId, reason) => {
  try {
    // Primero obtenemos la información del usuario, incluyendo su última IP
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('last_ip')
      .eq('user_id', userId)
      .single();

    if (userError) {
      console.error('Error obteniendo datos del usuario:', userError);
      return { success: false, error: 'Error obteniendo datos del usuario' };
    }

    // Actualizar el estado de baneo del usuario
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        banned: false,
        updatedt: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (updateError) {
      console.error('Error desbaneando usuario:', updateError);
      return { success: false, error: 'Error al desbanear usuario' };
    }

    // Si el usuario tiene una IP registrada, también desbanear la IP
    if (userData.last_ip) {
      const { error: ipUnbanError } = await supabase
        .from('banned_ips')
        .delete()
        .eq('ip', userData.last_ip);

      if (ipUnbanError) {
        console.warn('Error desbaneando IP:', ipUnbanError);
        // No fallar la operación completa si solo falla el desbaneo de IP
      }
    }

    // TODO: Crear registro de auditoría cuando se implemente la tabla user_ban_audit
    /*
    const { error: auditError } = await supabase
      .from('user_ban_audit')
      .insert({
        user_id: userId,
        action: 'unban',
        reason: reason,
        admin_id: 'admin', // TODO: Usar ID del admin actual
        created_at: new Date().toISOString()
      });

    if (auditError) {
      console.warn('Error creando log de auditoría:', auditError);
    }
    */

    return { success: true };
  } catch (error) {
    console.error('Error en unbanUser:', error);
    return { success: false, error: 'Error interno del servidor' };
  }
};

/**
 * Verificar un usuario
 * @param {string} userId - ID del usuario a verificar
 * @param {string} reason - Razón de la verificación
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const verifyUser = async (userId, reason) => {
  try {
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        verified: true,
        verified_at: new Date().toISOString(),
        updatedt: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (updateError) {
      console.error('Error verificando usuario:', updateError);
      return { success: false, error: 'Error al verificar usuario' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error en verifyUser:', error);
    return { success: false, error: 'Error interno del servidor' };
  }
};

/**
 * Desverificar un usuario
 * @param {string} userId - ID del usuario a desverificar
 * @param {string} reason - Razón de la desverificación
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const unverifyUser = async (userId, reason) => {
  try {
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        verified: false,
        verified_at: null,
        verified_by: null,
        updatedt: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (updateError) {
      console.error('Error desverificando usuario:', updateError);
      return { success: false, error: 'Error al desverificar usuario' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error en unverifyUser:', error);
    return { success: false, error: 'Error interno del servidor' };
  }
};

/**
 * Obtener historial de bans de un usuario
 * @param {string} userId - ID del usuario
 * @returns {Promise<{success: boolean, data?: array, error?: string}>}
 */
export const getUserBanHistory = async (userId) => {
  try {
    // TODO: Implementar cuando se cree la tabla user_ban_audit
    
    /*
    const { data, error } = await supabase
      .from('user_ban_audit')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error obteniendo historial de bans:', error);
      return { success: false, error: 'Error al cargar historial' };
    }

    return { success: true, data: data || [] };
    */

    // Por ahora retornamos array vacío
    return { success: true, data: [] };
  } catch (error) {
    console.error('Error en getUserBanHistory:', error);
    return { success: false, error: 'Error interno del servidor' };
  }
};

// ========================================
// 🛒 GESTIÓN DE PRODUCTOS MARKETPLACE
// ========================================

/**
 * Obtener productos del marketplace disponibles
 * @returns {Promise<{success: boolean, data?: Array, error?: string}>}
 */
export const getMarketplaceProducts = async () => {
  try {
    // Obtener productos básicos con nombres de campo correctos
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select(`
        productid,
        productnm,
        price,
        productqty,
        minimum_purchase,
        is_active,
        supplier_id,
        createddt,
        product_images (image_url, thumbnail_url, thumbnails)
      `)
      .eq('is_active', true)
      .order('createddt', { ascending: false });

    if (productsError) {
      console.error('Error obteniendo productos:', productsError);
      return { success: false, error: 'Error al cargar productos' };
    }

    if (!products || products.length === 0) {
      return { success: true, data: [] };
    }

    // Filtrar productos que cumplen la condición: stock >= compra_minima
    const availableProducts = products.filter(product => {
      const stock = product.productqty || 0;
      const minPurchase = product.minimum_purchase || 1;
      return stock >= minPurchase;
    });

    // Obtener información de los proveedores
    const supplierIds = [...new Set(availableProducts.map(p => p.supplier_id))];
    
    let suppliersData = {};
    if (supplierIds.length > 0) {
      const { data: suppliers, error: suppliersError } = await supabase
        .from('users')
        .select('user_id, user_nm, email')
        .in('user_id', supplierIds);

      if (!suppliersError && suppliers) {
        suppliersData = suppliers.reduce((acc, supplier) => {
          acc[supplier.user_id] = supplier;
          return acc;
        }, {});
      }
    }

    // Formatear datos para el componente
    const formattedData = availableProducts.map(product => {
      // Obtener imagen principal
      let imagenPrincipal = null;
      let thumbnailUrl = null;
      let thumbnails = null;
      
      if (product.product_images && Array.isArray(product.product_images) && product.product_images.length > 0) {
        imagenPrincipal = product.product_images[0].image_url;
        thumbnailUrl = product.product_images[0].thumbnail_url;
        thumbnails = product.product_images[0].thumbnails;
      }

      return {
        product_id: product.productid,
        product_name: product.productnm || 'Producto sin nombre',
        price: product.price || 0,
        stock: product.productqty || 0,
        min_purchase: product.minimum_purchase || 1,
        supplier_name: suppliersData[product.supplier_id]?.user_nm || 'Proveedor no encontrado',
        user_id: product.supplier_id || 'N/A',
        imagen: imagenPrincipal,
        thumbnail_url: thumbnailUrl,
        thumbnails: thumbnails
      };
    });

    return { success: true, data: formattedData };
  } catch (error) {
    console.error('Error en getMarketplaceProducts:', error);
    return { success: false, error: 'Error interno del servidor' };
  }
};

/**
 * Eliminar un producto del marketplace (UX optimizada)
 * @param {string} productId - ID del producto a eliminar
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const deleteProduct = async (productId) => {
  try {
    // 1. Obtener información del producto para background cleanup
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('supplier_id')
      .eq('productid', productId)
      .single();

    if (productError) {
      console.error('Error obteniendo producto:', productError);
      return { success: false, error: 'Error al obtener información del producto' };
    }

    // 2. Eliminar producto de la BD PRIMERO (respuesta rápida)
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('productid', productId);

    if (error) {
      console.error('Error eliminando producto:', error);
      return { success: false, error: 'Error al eliminar producto' };
    }

    // 3. Limpiar imágenes en background (no bloquea la respuesta)
    const folderPrefix = `${product.supplier_id}/${productId}/`;
    
    // Ejecutar limpieza en background sin esperar
    Promise.all([
      // Limpiar bucket principal
      supabase.storage.from('product-images').list(folderPrefix, { limit: 100 })
        .then(({ data: bucketFiles }) => {
          if (bucketFiles?.length > 0) {
            const toDeleteFromBucket = bucketFiles.map(file => folderPrefix + file.name);
            return supabase.storage.from('product-images').remove(toDeleteFromBucket);
          }
        }),
      
      // Limpiar bucket de thumbnails
      supabase.storage.from('product-images-thumbnails').list(folderPrefix, { limit: 100 })
        .then(({ data: thumbnailFiles }) => {
          if (thumbnailFiles?.length > 0) {
            const toDeleteFromThumbnails = thumbnailFiles.map(file => folderPrefix + file.name);
            return supabase.storage.from('product-images-thumbnails').remove(toDeleteFromThumbnails);
          }
        }),
      
      // Limpiar referencias en BD
      supabase.from('product_images').delete().eq('product_id', productId)
    ]).catch(error => {
      console.warn('⚠️ Error limpiando imágenes en background:', error);
      // El producto ya fue eliminado, este error no es crítico para el usuario
    });

    return { success: true };
  } catch (error) {
    console.error('Error en deleteProduct:', error);
    return { success: false, error: 'Error interno del servidor' };
  }
};

/**
 * Eliminar múltiples productos del marketplace
 * @param {string[]} productIds - Array de IDs de productos a eliminar
 * @returns {Promise<{success: boolean, deleted: number, errors: string[], error?: string}>}
 */
export const deleteMultipleProducts = async (productIds) => {
  try {
    if (!productIds || productIds.length === 0) {
      return { success: false, error: 'No se proporcionaron productos para eliminar' };
    }

    let deletedCount = 0;
    const errors = [];

    // Eliminar productos uno por uno para mejor control de errores
    for (const productId of productIds) {
      const result = await deleteProduct(productId);
      if (result.success) {
        deletedCount++;
      } else {
        errors.push(`Error eliminando producto ${productId}: ${result.error}`);
      }
    }

    return {
      success: deletedCount > 0,
      deleted: deletedCount,
      errors,
      error: errors.length > 0 ? `Se eliminaron ${deletedCount} de ${productIds.length} productos` : undefined
    };
  } catch (error) {
    console.error('Error en deleteMultipleProducts:', error);
    return { success: false, error: 'Error interno del servidor', deleted: 0, errors: [] };
  }
};

/**
 * Actualizar nombre de producto
 * @param {string} productId - ID del producto
 * @param {string} newName - Nuevo nombre del producto
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const updateProductName = async (productId, newName) => {
  try {
    if (!productId || !newName) {
      return { success: false, error: 'ID del producto y nuevo nombre son requeridos' };
    }

    if (newName.trim().length < 3) {
      return { success: false, error: 'El nombre del producto debe tener al menos 3 caracteres' };
    }

    if (newName.trim().length > 100) {
      return { success: false, error: 'El nombre del producto no puede exceder 100 caracteres' };
    }

    const { error } = await supabase
      .from('products')
      .update({ 
        productnm: newName.trim(),
        updateddt: new Date().toISOString()
      })
      .eq('productid', productId);

    if (error) {
      console.error('Error actualizando nombre del producto:', error);
      return { success: false, error: 'Error al actualizar el nombre del producto' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error en updateProductName:', error);
    return { success: false, error: 'Error interno del servidor' };
  }
};

/**
 * Obtener estadísticas de productos del marketplace
 * @returns {Promise<{success: boolean, stats?: object, error?: string}>}
 */
export const getProductStats = async () => {
  try {
    // Consultar todos los productos activos con nombres de campo correctos
    const { data: allProducts, error: allError } = await supabase
      .from('products')
      .select('productid, productqty, minimum_purchase, is_active, supplier_id')
      .eq('is_active', true);

    if (allError) {
      console.error('Error obteniendo estadísticas de productos:', allError);
      return { success: false, error: 'Error al cargar estadísticas' };
    }

    const products = allProducts || [];

    // Calcular estadísticas
    const totalProducts = products.length;
    
    // Productos realmente activos: stock >= compra_minima (nueva lógica de productos activos)
    const availableProducts = products.filter(p => {
      const stock = p.productqty || 0;
      const minPurchase = p.minimum_purchase || 1;
      return stock >= minPurchase;
    }).length;
    
    // Productos con stock bajo (stock < compra_minima)
    const lowStockProducts = products.filter(p => {
      const stock = p.productqty || 0;
      const minPurchase = p.minimum_purchase || 1;
      return stock < minPurchase && stock > 0;
    }).length;
    
    // Productos sin stock
    const outOfStockProducts = products.filter(p => (p.productqty || 0) === 0).length;
    
    // Proveedores activos únicos
    const activeSuppliers = new Set(products.map(p => p.supplier_id).filter(id => id)).size;

    const stats = {
      totalProducts,
      availableProducts,
      lowStockProducts,
      outOfStockProducts,
      activeSuppliers
    };

    return { success: true, stats };
  } catch (error) {
    console.error('Error en getProductStats:', error);
    return { success: false, error: 'Error interno del servidor' };
  }
};

/**
 * Eliminar un usuario del sistema
 * @param {string} userId - ID del usuario a eliminar
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const deleteUser = async (userId) => {
  try {
    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .eq('user_id', userId);

    if (deleteError) {
      console.error('Error eliminando usuario:', deleteError);
      return { success: false, error: 'Error al eliminar usuario' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error en deleteUser:', error);
    return { success: false, error: 'Error interno del servidor' };
  }
};

/**
 * Eliminar múltiples usuarios del sistema
 * @param {string[]} userIds - Array de IDs de usuarios a eliminar
 * @returns {Promise<{success: boolean, deleted: number, errors: string[], error?: string}>}
 */
export const deleteMultipleUsers = async (userIds) => {
  try {
    if (!userIds || userIds.length === 0) {
      return { success: false, error: 'No se proporcionaron usuarios para eliminar' };
    }

    let deletedCount = 0;
    const errors = [];
    const deleted = [];

    // Eliminar usuarios uno por uno para mejor control de errores
    for (const userId of userIds) {
      const result = await deleteUser(userId);
      if (!result.success) {
        errors.push(`Error eliminando usuario ${userId}: ${result.error}`);
      } else {
        deleted.push(userId);
        deletedCount++;
      }
    }

    return { 
      success: true, 
      deleted: deletedCount, 
      errors,
      deletedIds: deleted
    };
  } catch (error) {
    console.error('Error en deleteMultipleUsers:', error);
    return { success: false, error: 'Error interno del servidor' };
  }
};

/**
 * Crear nueva cuenta de administrador
 * @param {Object} adminData - Datos del nuevo administrador
 * @param {string} adminData.email - Email del admin
 * @param {string} adminData.password - Contraseña del admin
 * @param {string} adminData.fullName - Nombre completo del admin
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
          password_hash: hashedPassword, // Usar password_hash en lugar de password
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
    const { password: _, ...adminResponse } = newAdmin;
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
      .select('id, email, full_name, role, is_active, created_at, updated_at');

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
    const sessionCheck = await verifyAdminSession(adminId);
    if (!sessionCheck.success) {
      return sessionCheck;
    }

    // En tu caso, todos los admins pueden crear otros admins
    // Si quisieras restricción adicional, podrías agregar lógica aquí
    return { success: true };
  } catch (error) {
    console.error('Error verificando permisos:', error);
    return { success: false, error: 'Error interno del servidor' };
  }
};
