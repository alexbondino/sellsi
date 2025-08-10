/**
 * ============================================================================
 * TRANSFER INFO MANAGER - GESTOR DE PRE-CARGA
 * ============================================================================
 * 
 * Componente especializado para gestionar la pre-carga automática de 
 * información bancaria en el ciclo de vida de la aplicación.
 * 
 * Se integra en el AuthProvider para asegurar que la información bancaria
 * esté disponible desde el momento en que el usuario se autentica.
 */

import { useTransferInfoPreloader } from '../../hooks/profile/useTransferInfoPreloader';

/**
 * Componente que maneja la pre-carga de información bancaria
 * No renderiza nada, solo ejecuta la lógica de pre-carga
 */
export const TransferInfoManager = () => {
  useTransferInfoPreloader();
  return null;
};

export default TransferInfoManager;
