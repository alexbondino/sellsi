import { supabase } from '../supabase';
import { updateUserIP } from './ipTrackingService';
// Reutilizamos el perfil con cache TTL + in-flight dedupe
import { getUserProfile } from '../user/profileService';

// =============================================================
// CACHES LOCALES (evitan fetch duplicados observados en logs)
// =============================================================
// 1. Cache para estado de ban de usuario (derivado del profile cache principal)
//    No necesitamos un Map separado: getUserProfile ya aplica TTL/in-flight.
// 2. Cache para banned_ips (observado doble fetch consecutivo en logs)
const IP_BAN_CACHE_TTL = 5 * 60 * 1000; // 5 minutos (suficientemente largo, poco volátil)
const ipBanCache = new Map(); // ip -> { data, ts }
const ipBanInFlight = new Map(); // ip -> Promise

/**
 * Servicio para verificar el estado de ban de usuarios e IPs
 * Este servicio maneja tanto el banneo por usuario como por IP
 */
class BanService {
  /**
   * Verifica si un usuario está baneado
   * @param {string} userId - ID del usuario
   * @returns {Promise<{isBanned: boolean, reason?: string, bannedAt?: string}>}
   */
  async checkUserBan(userId) {
    try {
      if (!userId) return { isBanned: false };

      // Intento 1: usar perfil cacheado (evita fetch redundante de sólo 3 campos)
      try {
        const { data: profile, error: profileError } = await getUserProfile(userId);
        if (!profileError && profile) {
          return {
            isBanned: profile.banned || false,
            reason: profile.banned_reason,
            bannedAt: profile.banned_at
          };
        }
      } catch (_) {
        // Silencioso: fallback a query mínima
      }

      // Fallback: query mínima (raro que se ejecute si profile funciona)
      const { data, error } = await supabase.from('users')
        .select('banned, banned_reason, banned_at')
        .eq('user_id', userId)
        .maybeSingle();
      if (error || !data) return { isBanned: false };
      return {
        isBanned: data.banned || false,
        reason: data.banned_reason,
        bannedAt: data.banned_at
      };
    } catch (error) {
      return { isBanned: false };
    }
  }

  /**
   * Verifica si una IP está baneada
   * @param {string} ip - Dirección IP a verificar
   * @returns {Promise<{isBanned: boolean, reason?: string, bannedAt?: string}>}
   */
  async checkIPBan(ip) {
    try {
      if (!ip) return { isBanned: false };

      // Cache hit válido
      const cached = ipBanCache.get(ip);
      if (cached && (Date.now() - cached.ts) < IP_BAN_CACHE_TTL) {
        return cached.value;
      }

      // In-flight dedupe
      if (ipBanInFlight.has(ip)) {
        return await ipBanInFlight.get(ip);
      }

      const fetchPromise = (async () => {
        const { data, error } = await supabase
          .from('banned_ips')
          .select('banned_reason, banned_at')
          .eq('ip', ip)
          .maybeSingle();
        if (error) {
          const res = { isBanned: false };
          ipBanCache.set(ip, { value: res, ts: Date.now() });
          return res;
        }
        const res = {
          isBanned: !!data,
            reason: data?.banned_reason,
            bannedAt: data?.banned_at,
        };
        ipBanCache.set(ip, { value: res, ts: Date.now() });
        return res;
      })();

      ipBanInFlight.set(ip, fetchPromise);
      try {
        return await fetchPromise;
      } finally {
        ipBanInFlight.delete(ip);
      }
    } catch (error) {
      return { isBanned: false };
    }
  }

  /**
   * Obtiene la IP del usuario actual usando el servicio de IP tracking
   * @returns {Promise<string>}
   */
  async getCurrentIP() {
    try {
      // Obtener usuario autenticado (envoltura ya cacheada por supabase.js)
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Intentar desde perfil cacheado (incluye last_ip por select '*')
        try {
          const { data: profile } = await getUserProfile(user.id);
          if (profile?.last_ip) {
            return profile.last_ip;
          }
        } catch(_) { /* silencioso */ }

        // Fallback: actualizar IP y usar resultado
        const ipResult = await updateUserIP(user.id);
        if (ipResult.success && ipResult.ip) return ipResult.ip;
      }

      // Último recurso: obtener IP pública directa (sin cache, es poco frecuente)
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch (error) {
      return null;
    }
  }

  /**
   * Verifica el estado completo de ban (usuario e IP)
   * @param {string} userId - ID del usuario (opcional)
   * @returns {Promise<{isBanned: boolean, banType?: 'user'|'ip', reason?: string, bannedAt?: string}>}
   */
  async checkBanStatus(userId = null) {
    try {
      // Si no hay userId, intentamos obtenerlo de la sesión actual
      if (!userId) {
        const { data: { user } } = await supabase.auth.getUser();
        userId = user?.id;
      }

      const currentIP = await this.getCurrentIP();
      
      // Verificamos ban por IP primero (más restrictivo)
      if (currentIP) {
        const ipBan = await this.checkIPBan(currentIP);
        if (ipBan.isBanned) {
          return {
            isBanned: true,
            banType: 'ip',
            reason: ipBan.reason,
            bannedAt: ipBan.bannedAt,
          };
        }
      }

      // Verificamos ban por usuario
      if (userId) {
        const userBan = await this.checkUserBan(userId);
        if (userBan.isBanned) {
          return {
            isBanned: true,
            banType: 'user',
            reason: userBan.reason,
            bannedAt: userBan.bannedAt,
          };
        }
      }

      return { isBanned: false };
    } catch (error) {
      return { isBanned: false };
    }
  }

  /**
   * Verifica si el usuario actual está baneado (función de conveniencia)
   * @returns {Promise<boolean>}
   */
  async isCurrentUserBanned() {
    const banStatus = await this.checkBanStatus();
    return banStatus.isBanned;
  }
}

const banService = new BanService();
export default banService;
