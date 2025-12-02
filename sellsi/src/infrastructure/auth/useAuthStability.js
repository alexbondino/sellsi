/**
 * ============================================================================
 * USE AUTH STABILITY HOOK
 * ============================================================================
 * 
 * Hook de React para consumir el estado de AuthReadyCoordinator.
 * Provee acceso reactivo a `isAuthStable` y `isAuthenticating`.
 */

import { useState, useEffect, useCallback } from 'react';
import { subscribe, getAuthState, waitForAuthStable as waitFn } from './AuthReadyCoordinator';

/**
 * Hook para obtener el estado de estabilidad de autenticación
 * @returns {{
 *   isAuthStable: boolean,
 *   isAuthenticating: boolean,
 *   waitForAuthStable: () => Promise<boolean>
 * }}
 */
export const useAuthStability = () => {
  const [authState, setAuthState] = useState(getAuthState);
  
  useEffect(() => {
    // Suscribirse a cambios
    const unsubscribe = subscribe((newState) => {
      setAuthState(newState);
    });
    
    return unsubscribe;
  }, []);
  
  const waitForAuthStable = useCallback((timeoutMs) => {
    return waitFn(timeoutMs);
  }, []);
  
  return {
    isAuthStable: authState.isAuthStable,
    isAuthenticating: authState.isAuthenticating,
    waitForAuthStable,
  };
};

export default useAuthStability;
