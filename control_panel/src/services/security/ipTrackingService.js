/**
 * 📡 Servicio de IP Tracking
 * 
 * Gestiona la actualización del IP del usuario para fines de auditoría
 * y permite el baneo de IPs problemáticas.
 * 
 * @author Sistema de Auditoría Sellsi
 * @date 16 de Julio de 2025
 */

import { supabase } from '../supabase';

/**
 * Orquestador de batching & throttling
 * - Consolida múltiples acciones en un solo update (session_info.actions_summary)
 * - TTL mínimo entre actualizaciones para reducir llamadas repetitivas
 * - Mantiene compatibilidad de firma en trackLoginIP y trackUserAction
 */
const MIN_INTERVAL_DEFAULT = 15 * 60 * 1000; // 15 minutos
const MAX_ACTIONS_BEFORE_FORCE = 5; // Fuerza flush si se acumulan muchas acciones
const ENV_INTERVAL = parseInt(import.meta.env?.VITE_IP_UPDATE_MIN_INTERVAL_MS || '', 10);
const MIN_UPDATE_INTERVAL_MS = Number.isFinite(ENV_INTERVAL) && ENV_INTERVAL > 0 ? ENV_INTERVAL : MIN_INTERVAL_DEFAULT;

let lastUpdateTs = 0;
let pendingActions = [];
let flushTimer = null;
let flushingPromise = null; // evitar flush simultáneos

// --- Coordinación multi-tab: BroadcastChannel + localStorage lock ---
const instanceId = Math.random().toString(36).slice(2);
const CHANNEL_NAME = 'ip-tracking';
const FLUSH_LOCK_KEY = 'IP_TRACKING_FLUSH_LOCK';
const FLUSH_LOCK_TTL_MS = 10000; // 10s
let bc = null;
try { if (typeof BroadcastChannel !== 'undefined') bc = new BroadcastChannel(CHANNEL_NAME); } catch (_) {}

function acquireFlushLock() {
  if (typeof localStorage === 'undefined') return true;
  const nowMs = Date.now();
  const raw = localStorage.getItem(FLUSH_LOCK_KEY);
  if (raw) {
    const [owner, tsStr] = raw.split(':');
    const ts = parseInt(tsStr, 10) || 0;
    if (owner && ts && (nowMs - ts) < FLUSH_LOCK_TTL_MS) {
      return owner === instanceId; // true si ya soy dueño, false si otro
    }
  }
  try { localStorage.setItem(FLUSH_LOCK_KEY, instanceId + ':' + nowMs); } catch (_) {}
  return true;
}

function releaseFlushLock() {
  if (typeof localStorage === 'undefined') return;
  try {
    const raw = localStorage.getItem(FLUSH_LOCK_KEY);
    if (raw && raw.startsWith(instanceId + ':')) localStorage.removeItem(FLUSH_LOCK_KEY);
  } catch (_) {}
}

function broadcast(message) {
  if (bc) {
    try { bc.postMessage({ ...message, _from: instanceId }); } catch (_) {}
  } else if (typeof localStorage !== 'undefined') {
    try { localStorage.setItem('IP_TRACKING_EVT', JSON.stringify({ ...message, _from: instanceId, ts: Date.now() })); } catch (_) {}
  }
}

function handleIncoming(msg) {
  if (!msg || msg._from === instanceId) return;
  switch (msg.type) {
    case 'enqueue':
      pendingActions.push({ userId: msg.userId, action: msg.action, ts: msg.ts || Date.now() });
      break;
    case 'flushed':
      if (typeof msg.lastUpdateTs === 'number' && msg.lastUpdateTs > lastUpdateTs) {
        lastUpdateTs = msg.lastUpdateTs;
        const cutoff = msg.flushStartedAt || msg.lastUpdateTs;
        pendingActions = pendingActions.filter(a => a.ts > cutoff);
      }
      break;
    case 'request_state':
      broadcast({ type: 'state', lastUpdateTs, pendingCount: pendingActions.length });
      break;
    default:
      break;
  }
}

if (bc) {
  bc.onmessage = ev => handleIncoming(ev.data);
} else if (typeof window !== 'undefined') {
  window.addEventListener('storage', e => {
    if (e.key === 'IP_TRACKING_EVT' && e.newValue) {
      try { handleIncoming(JSON.parse(e.newValue)); } catch (_) {}
    }
  });
}

const now = () => Date.now();

function scheduleFlush(delayMs) {
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    flushPending(false);
  }, delayMs);
}

async function flushPending(force = false) {
  if (flushingPromise) return flushingPromise;
  if (!pendingActions.length && !force) return { success: true, skipped: true, reason: 'empty_queue' };

  const elapsed = now() - lastUpdateTs;
  if (!force && elapsed < MIN_UPDATE_INTERVAL_MS) {
    // Aún dentro de la ventana: reprogramar si no hay timer
    scheduleFlush(MIN_UPDATE_INTERVAL_MS - elapsed + 50);
    return { success: true, skipped: true, reason: 'ttl_active' };
  }

  // Consolidar acciones
  const batch = pendingActions.slice();
  pendingActions = [];
  const actions_summary = batch.reduce((acc, a) => {
    acc[a.action] = (acc[a.action] || 0) + 1;
    return acc;
  }, {});

  const sessionInfo = {
    event: 'batch_actions',
    actions_summary,
    total_actions: batch.length,
    first_ts: batch[0]?.ts,
    last_ts: batch[batch.length - 1]?.ts,
    user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown'
  };

  // Necesitamos cualquier userId presente (todas entradas deberían compartir userId)
  const userId = batch[0]?.userId || sessionInfo.user_id_override;
  if (!userId) return { success: true, skipped: true, reason: 'no_user' };

  if (!acquireFlushLock()) {
    // Otro tab hará el flush, reinsertar batch y reintentar
    pendingActions = batch.concat(pendingActions);
    scheduleFlush(500);
    return { success: true, skipped: true, reason: 'lock_busy', requeued: batch.length };
  }

  const flushStartedAt = now();
  broadcast({ type: 'flushed', lastUpdateTs, flushStartedAt, status: 'starting', batchSize: batch.length });

  flushingPromise = updateUserIP(userId, sessionInfo)
    .then(res => {
      if (!res.skipped) {
        lastUpdateTs = now();
      }
      broadcast({ type: 'flushed', lastUpdateTs, flushStartedAt, status: 'done', updated: !res.skipped, batchSize: batch.length });
      return { ...res, batched: true };
    })
    .catch(e => ({ success: true, skipped: true, error: e?.message, batched: true }))
    .finally(() => { flushingPromise = null; releaseFlushLock(); });

  return flushingPromise;
}

// Flush en eventos de cierre/ocultación de pestaña
if (typeof window !== 'undefined') {
  const visibilityHandler = () => {
    if (document.hidden && pendingActions.length) {
      flushPending(true);
    }
  };
  window.addEventListener('visibilitychange', visibilityHandler);
  window.addEventListener('beforeunload', () => {
    if (!pendingActions.length) return;
    try {
      // Enviar síncrono usando navigator.sendBeacon si está disponible
      const userId = pendingActions[0]?.userId;
      const actions_summary = pendingActions.reduce((acc, a) => { acc[a.action] = (acc[a.action] || 0) + 1; return acc; }, {});
      const payload = JSON.stringify({ user_id: userId, session_info: { event: 'batch_actions_unload', actions_summary } });
      if (navigator.sendBeacon) {
        navigator.sendBeacon(`${SUPABASE_URL}/functions/v1/update-lastip`, payload);
      }
    } catch (_) { /* silencioso */ }
  });
}

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
      // Si la función Edge no existe (404), manejar silenciosamente
      if (response.status === 404) {
        return { success: true, skipped: true };
      }
      throw new Error(data.error || 'Error actualizando IP');
    }

    return { 
      success: true, 
      ip: data.ip,
      updated: data.updated,
      previous_ip: data.previous_ip 
    };
  } catch (error) {
    // En lugar de fallar, devolver success: true para no afectar el flujo principal
    return { 
      success: true, 
      error: error.message,
      skipped: true
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
    user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown'
  };
  // Login se considera crítico: forzar aunque TTL no haya expirado
  const res = await updateUserIP(userId, sessionInfo);
  if (!res.skipped) lastUpdateTs = now();
  return res;
};

/**
 * Actualizar IP del usuario en interacciones importantes
 * @param {string} userId - ID del usuario
 * @param {string} action - Acción realizada (checkout, update_profile, etc.)
 * @returns {Promise<{success: boolean, ip?: string, error?: string}>}
 */
export const trackUserAction = async (userId, action) => {
  // Encolar acción y decidir flush
  pendingActions.push({ userId, action, ts: now() });
  broadcast({ type: 'enqueue', userId, action, ts: now() });

  // Criterios para flush inmediato:
  // 1. Demasiadas acciones acumuladas
  // 2. TTL expirado
  const elapsed = now() - lastUpdateTs;
  const ttlExpired = elapsed >= MIN_UPDATE_INTERVAL_MS;
  if (pendingActions.length >= MAX_ACTIONS_BEFORE_FORCE || ttlExpired) {
    return await flushPending(true);
  }

  // Programar flush si no existe timer
  if (!flushTimer) {
    scheduleFlush(MIN_UPDATE_INTERVAL_MS - elapsed + 50);
  }

  return { success: true, queued: true, pending: pendingActions.length };
};

/**
 * Función helper para debugging - mostrar IP actual en consola
 */
export const debugCurrentIP = async () => {
  const result = await getCurrentUserIP();
  if (result.success) {

  } else {
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
  trackRouteVisit,
  // util opcional para forzar flush manual (no documentado públicamente aún)
  __flushIPTrackingQueue: () => flushPending(true)
};
