/**
 * 📡 Servicio de IP Tracking
 * 
 * Gestiona la actualización del IP del usuario para fines de auditoría
 * y permite el baneo de IPs problemáticas.
 * 
 * @author Sistema de Auditoría Sellsi
 * @date 16 de Julio de 2025
 */

import { supabase } from './supabase';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

/**
 * Actualizar la IP del usuario al hacer login o interacciones importantes
 * @param {string} userId - ID del usuario
 * @param {object} sessionInfo - Información adicional de sesión (opcional)
 * @returns {Promise<{success: boolean, ip?: string, error?: string}>}
 */
export const updateUserIP = async (userId, sessionInfo = null) => {
  try {
    if (!userId) {
      throw new Error('userId es requerido');
    }

    const response = await fetch(`${SUPABASE_URL}/functions/v1/update-lastip`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        user_id: userId,
        session_info: sessionInfo
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Error actualizando IP');
    }

    return { 
      success: true, 
      ip: data.ip,
      updated: data.updated,
      previous_ip: data.previous_ip 
    };
  } catch (error) {
    console.error('Error en updateUserIP:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
};

/**
 * Obtener la IP actual del usuario sin actualizar la base de datos
 * Útil para mostrar información sin side effects
 * @returns {Promise<{success: boolean, ip?: string, error?: string}>}
 */
export const getCurrentUserIP = async () => {
  try {
    // Usar un servicio externo para obtener la IP del cliente
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    
    return {
      success: true,
      ip: data.ip
    };
  } catch (error) {
    console.error('Error obteniendo IP actual:', error);
    return {
      success: false,
      error: 'No se pudo obtener la IP actual'
    };
  }
};

/**
 * Verificar si una IP está baneada
 * @param {string} ip - IP a verificar
 * @returns {Promise<{success: boolean, isBanned: boolean, banInfo?: object, error?: string}>}
 */
export const checkIPBanStatus = async (ip) => {
  try {
    const { data, error } = await supabase
      .from('banned_ips')
      .select('*')
      .eq('ip', ip)
      .maybeSingle(); // Cambiamos de .single() a .maybeSingle()

    if (error) {
      throw error;
    }

    return {
      success: true,
      isBanned: !!data,
      banInfo: data || null
    };
  } catch (error) {
    console.error('Error verificando estado de IP:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Actualizar IP del usuario al hacer login
 * Se llama automáticamente después de login exitoso
 * @param {string} userId - ID del usuario
 * @param {string} loginMethod - Método de login (email, google, etc.)
 * @returns {Promise<{success: boolean, ip?: string, error?: string}>}
 */
export const trackLoginIP = async (userId, loginMethod = 'email') => {
  const sessionInfo = {
    event: 'login',
    method: loginMethod,
    timestamp: new Date().toISOString(),
    user_agent: navigator.userAgent
  };

  return await updateUserIP(userId, sessionInfo);
};

/**
 * Actualizar IP del usuario en interacciones importantes
 * @param {string} userId - ID del usuario
 * @param {string} action - Acción realizada (checkout, update_profile, etc.)
 * @returns {Promise<{success: boolean, ip?: string, error?: string}>}
 */
export const trackUserAction = async (userId, action) => {
  const sessionInfo = {
    event: 'user_action',
    action: action,
    timestamp: new Date().toISOString(),
    user_agent: navigator.userAgent
  };

  return await updateUserIP(userId, sessionInfo);
};

/**
 * Función helper para debugging - mostrar IP actual en consola
 */
export const debugCurrentIP = async () => {
  const result = await getCurrentUserIP();
  if (result.success) {
    console.log('🌐 IP actual del usuario:', result.ip);
  } else {
    console.error('❌ Error obteniendo IP:', result.error);
  }
  return result;
};

/**
 * Middleware para tracking automático de IP en rutas protegidas
 * @param {string} userId - ID del usuario
 * @param {string} route - Ruta visitada
 */
export const trackRouteVisit = async (userId, route) => {
  // Solo trackear rutas importantes, no todas
  const importantRoutes = [
    '/supplier/profile',
    '/buyer/profile', 
    '/marketplace',
    '/checkout',
    '/supplier/products',
    '/admin-panel'
  ];

  if (importantRoutes.some(r => route.startsWith(r))) {
    return await trackUserAction(userId, `route_visit:${route}`);
  }

  return { success: true, skipped: true };
};

export default {
  updateUserIP,
  getCurrentUserIP,
  checkIPBanStatus,
  trackLoginIP,
  trackUserAction,
  debugCurrentIP,
  trackRouteVisit
};
