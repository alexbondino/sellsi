import { supabase } from '../supabase';
import { updateUserIP } from './ipTrackingService';

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
      const { data, error } = await supabase
        .from('users')
        .select('banned, banned_reason, banned_at')
        .eq('user_id', userId)
        .single();

      if (error) {
        return { isBanned: false };
      }

      return {
        isBanned: data?.banned || false,
        reason: data?.banned_reason,
        bannedAt: data?.banned_at,
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
      const { data, error } = await supabase
        .from('banned_ips')
        .select('banned_reason, banned_at')
        .eq('ip', ip)
        .maybeSingle(); // Cambiamos de .single() a .maybeSingle()

      if (error) {
        return { isBanned: false };
      }

      return {
        isBanned: !!data,
        reason: data?.banned_reason,
        bannedAt: data?.banned_at,
      };
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
      // Primero intentamos obtener la IP del usuario desde la base de datos
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: userData } = await supabase
          .from('users')
          .select('last_ip')
          .eq('user_id', user.id)
          .single();
        
        if (userData?.last_ip) {
          return userData.last_ip;
        }

        // Si no hay IP en la base de datos, actualizamos la IP del usuario
        const ipResult = await updateUserIP(user.id);
        if (ipResult.success && ipResult.ip) {
          return ipResult.ip;
        }
      }

      // Si no hay usuario o falla la actualización, obtenemos la IP actual
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
