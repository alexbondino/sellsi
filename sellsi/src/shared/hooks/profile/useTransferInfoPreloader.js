/**
 * ============================================================================
 * TRANSFER INFO PRELOADER HOOK - PRE-CARGA AUTOMÁTICA
 * ============================================================================
 * 
 * Hook especializado para pre-cargar automáticamente la información bancaria
 * cuando el usuario se autentica, evitando demoras en la primera validación.
 * 
 * Características:
 * - Se ejecuta automáticamente al autenticar
 * - No bloquea la UI con states reactivos
 * - Solo llena el cache en background
 * - Compatible con el sistema de validación existente
 */

import { useEffect, useRef } from 'react';
import { useAuth } from '../../../infrastructure/providers/AuthProvider';
import { useTransferInfoValidation } from './useTransferInfoValidation';

/**
 * Hook para pre-cargar información bancaria en background
 * Se usa típicamente en el AuthProvider o componentes de alto nivel
 */
export const useTransferInfoPreloader = () => {
  const { session, loadingUserStatus } = useAuth();
  const preloadExecutedRef = useRef(false);
  
  // No exponemos estados reactivos para evitar re-renders innecesarios
  const { refresh } = useTransferInfoValidation();

  useEffect(() => {
    const preloadTransferInfo = async () => {
      // Solo ejecutar una vez por sesión y cuando el usuario esté autenticado
      if (
        !loadingUserStatus && 
        session?.user && 
        !preloadExecutedRef.current
      ) {
        try {
          preloadExecutedRef.current = true;
          
          // Pre-cargar información bancaria sin bloquear UI
          await refresh();
          
        } catch (error) {
          // Silenciar errores de pre-carga para no afectar la experiencia
          console.warn('Pre-carga de información bancaria falló:', error.message);
        }
      }
    };

    preloadTransferInfo();
  }, [session, loadingUserStatus, refresh]);

  // Limpiar flag al cerrar sesión
  useEffect(() => {
    if (!session) {
      preloadExecutedRef.current = false;
    }
  }, [session]);

  // Este hook no retorna nada intencionalmente
  // Su único propósito es pre-cargar el cache
};

export default useTransferInfoPreloader;
