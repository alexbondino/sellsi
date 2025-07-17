import { useState, useEffect } from 'react';
import banService from '../services/banService';

/**
 * Hook personalizado para verificar el estado de ban del usuario
 * @param {string} userId - ID del usuario (opcional)
 * @param {boolean} enabled - Si debe verificar automáticamente el ban
 * @returns {object} Estado de ban y funciones de control
 */
export const useBanStatus = (userId = null, enabled = true) => {
  const [banStatus, setBanStatus] = useState({
    isBanned: false,
    banType: null,
    reason: null,
    bannedAt: null,
  });
  const [isLoading, setIsLoading] = useState(enabled);
  const [error, setError] = useState(null);

  /**
   * Verifica el estado de ban
   */
  const checkBanStatus = async () => {
    if (!enabled) return;

    try {
      setIsLoading(true);
      setError(null);
      
      const status = await banService.checkBanStatus(userId);
      setBanStatus(status);
    } catch (err) {
      console.error('Error verificando estado de ban:', err);
      setError(err);
      setBanStatus({
        isBanned: false,
        banType: null,
        reason: null,
        bannedAt: null,
      });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Recarga el estado de ban
   */
  const reloadBanStatus = () => {
    checkBanStatus();
  };

  useEffect(() => {
    checkBanStatus();
  }, [userId, enabled]);

  return {
    banStatus,
    isLoading,
    error,
    reloadBanStatus,
  };
};

/**
 * Hook simplificado que solo retorna si el usuario está baneado
 * @param {string} userId - ID del usuario (opcional)
 * @returns {boolean} True si el usuario está baneado
 */
export const useIsBanned = (userId = null) => {
  const { banStatus } = useBanStatus(userId);
  return banStatus.isBanned;
};

export default useBanStatus;
