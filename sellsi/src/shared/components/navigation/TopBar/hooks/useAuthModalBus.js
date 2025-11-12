// Fase 2: Hook para encapsular apertura/cierre de modales de autenticación
// Reemplaza window events ad-hoc (openLogin/openRegister) con una API opcional namespaced.
// Mantiene layer de compatibilidad opcional exponiendo window.sellsiAuth.*

import { useEffect, useCallback, useState } from 'react';

// Legacy layer (window openLogin/openRegister events) eliminado 2025-08-29
export function useAuthModalBus({ enableGlobalBridge = true, enableLegacyEventListeners = false } = {}) {
  const [loginOpen, setLoginOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);

  const openLogin = useCallback(() => setLoginOpen(true), []);
  const closeLogin = useCallback(() => setLoginOpen(false), []);
  const openRegister = useCallback(() => setRegisterOpen(true), []);
  const closeRegister = useCallback(() => setRegisterOpen(false), []);

  // Transition sin setTimeout mágico: cerrar login y abrir register cuando login cierre
  const transitionLoginToRegister = useCallback(() => {
    setLoginOpen(false);
    // Pequeña sincronización en microtask
    queueMicrotask(() => setRegisterOpen(true));
  }, []);

  // Global bridge compatible (evitar colisiones: prefijo sellsi)
  useEffect(() => {
    if (!enableGlobalBridge) return;
    const bridge = {
      openLogin,
      openRegister,
      closeLogin,
      closeRegister,
      transitionLoginToRegister,
    };
    // Attach una sola vez
    if (!window.sellsiAuth) window.sellsiAuth = bridge;
    return () => {
      // No removemos para compat; si se quisiera limpieza: delete window.sellsiAuth
    };
  }, [enableGlobalBridge, openLogin, openRegister, closeLogin, closeRegister, transitionLoginToRegister]);

  // Legacy event listeners (CustomEvent) para retrocompatibilidad
  useEffect(() => {
    if (!enableLegacyEventListeners) return;
    
    const handleOpenLogin = () => {
      console.log('🔓 [useAuthModalBus] openLogin event received');
      setLoginOpen(true);
    };
    
    const handleOpenRegister = () => {
      console.log('📝 [useAuthModalBus] openRegister event received');
      setRegisterOpen(true);
    };
    
    window.addEventListener('openLogin', handleOpenLogin);
    window.addEventListener('openRegister', handleOpenRegister);
    
    console.log('🎧 [useAuthModalBus] Legacy event listeners registered');
    
    return () => {
      window.removeEventListener('openLogin', handleOpenLogin);
      window.removeEventListener('openRegister', handleOpenRegister);
      console.log('🔇 [useAuthModalBus] Legacy event listeners removed');
    };
  }, [enableLegacyEventListeners]);

  return {
    loginOpen,
    registerOpen,
    openLogin,
    closeLogin,
    openRegister,
    closeRegister,
    transitionLoginToRegister,
  };
}
