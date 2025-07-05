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
    // TODO: Implementar cuando se creen las tablas
    // Por ahora retornamos estructura de respuesta
    
    /*
    const { data, error } = await supabase
      .from('control_panel_users')
      .select('*')
      .eq('usuario', usuario)
      .eq('is_active', true)
      .single()
    
    if (error || !data) {
      return { success: false, error: 'Usuario no encontrado o inactivo' }
    }
    
    // Verificar hash de contraseña (usar bcrypt en producción)
    const passwordMatch = await verifyPassword(password, data.password_hash)
    if (!passwordMatch) {
      return { success: false, error: 'Contraseña incorrecta' }
    }
    
    // Actualizar última fecha de login
    await supabase
      .from('control_panel_users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', data.id)
    
    return { success: true, user: data }
    */
    
    return { success: false, error: 'Tablas de administración no creadas aún' }
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
    // TODO: Implementar verificación 2FA con speakeasy
    /*
    const { data } = await supabase
      .from('control_panel_users')
      .select('twofa_secret')
      .eq('id', userId)
      .single()
    
    if (!data?.twofa_secret) {
      return { success: false, error: '2FA no configurado' }
    }
    
    const verified = speakeasy.totp.verify({
      secret: data.twofa_secret,
      encoding: 'base32',
      token: code,
      window: 2
    })
    
    return { success: verified, error: verified ? null : 'Código 2FA inválido' }
    */
    
    return { success: false, error: '2FA no implementado aún' }
  } catch (error) {
    console.error('Error en verify2FA:', error)
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
    
    console.log('Confirmar pago:', { solicitudId, datos })
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
    
    console.log('Rechazar pago:', { solicitudId, datos })
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
    
    console.log('Devolver pago:', { solicitudId, datos })
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
    
    console.log('Registrar acción:', { accion, solicitudId, detalles })
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
    
    console.log('Enviar notificación:', { compradorEmail, tipoNotificacion, datos })
    return { success: true }
  } catch (error) {
    console.error('Error en enviarNotificacion:', error)
    return { success: false, error: 'Error interno del servidor' }
  }
}
