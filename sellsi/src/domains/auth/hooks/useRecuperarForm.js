// 📁 domains/auth/hooks/useRecuperarForm.js
import { useState, useRef, useEffect, useCallback } from 'react';
import { supabase } from '../../../services/supabase';

/**
 * Hook de recuperación de contraseña basado en Supabase Auth.
 * Supabase envía un ENLACE de recuperación (no código).
 *
 * Estados conservados por compatibilidad:
 * - codigo, timer, showCodigoEnviado, fadeIn, nuevaContrasena, repiteContrasena,
 *   showPassword, showRepeatPassword, cambioExitoso
 *   (no se usan en el flujo con enlace, pero se exponen para no romper imports).
 */
export const useRecuperarForm = () => {
  // Paso del flujo: 'correo' | 'enviado'
  const [paso, setPaso] = useState('correo');

  // Core
  const [correo, setCorreo] = useState('');
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [loading, setLoading] = useState(false);

  // ---- Compatibilidad (no usados en flujo por enlace) -----------------------
  const [codigo, setCodigo] = useState(['', '', '', '', '']); // deprecado
  const [timer, setTimer] = useState(300); // deprecado
  const timerRef = useRef(); // deprecado

  const [nuevaContrasena, setNuevaContrasena] = useState(''); // deprecado
  const [repiteContrasena, setRepiteContrasena] = useState(''); // deprecado
  const [showPassword, setShowPassword] = useState(false); // deprecado
  const [showRepeatPassword, setShowRepeatPassword] = useState(false); // deprecado
  const [cambioExitoso, setCambioExitoso] = useState(false); // deprecado

  const [showCodigoEnviado, setShowCodigoEnviado] = useState(false); // deprecado
  const [fadeIn, setFadeIn] = useState(false); // deprecado
  const fadeTimeout = useRef(); // deprecado
  // --------------------------------------------------------------------------

  // (Compat) Desactiva cualquier timer que hubiera
  useEffect(() => {
    return () => clearInterval(timerRef.current);
  }, []);

  // (Compat) Fade dummy para showCodigoEnviado
  useEffect(() => {
    if (showCodigoEnviado) {
      setFadeIn(true);
      fadeTimeout.current = setTimeout(() => {
        setFadeIn(false);
        setTimeout(() => setShowCodigoEnviado(false), 400);
      }, 15000);
    }
    return () => clearTimeout(fadeTimeout.current);
  }, [showCodigoEnviado]);

  // Validación de email
  const validarCorreo = email => {
    const regexCompleto =
      /^[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+)*@[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?)*$/;

    if (!email) return false;
    if (email.length > 254) return false;
    if (email.includes('..')) return false;
    if (email.startsWith('.') || email.endsWith('.')) return false;
    if (email.includes('@.') || email.includes('.@')) return false;

    const parts = email.split('@');
    if (parts.length !== 2) return false;

    const [localPart, domain] = parts;
    if (localPart.length === 0 || localPart.length > 64) return false;

    if (domain.length === 0 || domain.length > 253) return false;
    if (domain.includes('..')) return false;
    if (!domain.includes('.')) return false;

    const domainParts = domain.split('.');
    if (domainParts.length < 2) return false;
    const lastPart = domainParts[domainParts.length - 1];
    if (lastPart.length < 2) return false;

    return regexCompleto.test(email);
  };

  // Enviar mail de recuperación
  const handleBuscar = useCallback(
    async e => {
      e?.preventDefault?.();

      if (!correo) {
        setError('Por favor, rellena este campo.');
        return;
      }
      if (!validarCorreo(correo)) {
        setError('Correo inválido. Ejemplo: usuario@dominio.com');
        return;
      }

      setError('');
      setMensaje('');
      setLoading(true);

      try {
        const { error: sbError } = await supabase.auth.resetPasswordForEmail(
          correo.trim(),
          { redirectTo: `${window.location.origin}/auth/reset-password` }
        );
        if (sbError) throw sbError;

        setPaso('enviado');
        setMensaje(
          'Te enviamos un enlace para restablecer tu contraseña. Revisa tu bandeja de entrada y el spam.'
        );
      } catch (err) {
        setError(
          err?.message || 'No pudimos enviar el correo. Intenta nuevamente.'
        );
      } finally {
        setLoading(false);
      }
    },
    [correo]
  );

  // Reenviar mail
  const handleResendCode = useCallback(async () => {
    if (!correo || !validarCorreo(correo)) {
      setError('Correo inválido o vacío. Verifícalo e intenta otra vez.');
      return;
    }

    setError('');
    setMensaje('');
    setLoading(true);

    try {
      const { error: sbError } = await supabase.auth.resetPasswordForEmail(
        correo.trim(),
        { redirectTo: `${window.location.origin}/auth/reset-password` }
      );
      if (sbError) throw sbError;

      // (Compat) activar mini “reenviado”
      setShowCodigoEnviado(false);
      setTimeout(() => setShowCodigoEnviado(true), 10);

      setPaso('enviado'); // ya estaba enviado, reafirma
      setMensaje(
        'Reenviamos el enlace a tu correo. Revisa también tu carpeta de spam.'
      );
    } catch (err) {
      setError(
        err?.message || 'No pudimos reenviar el correo. Intenta nuevamente.'
      );
    } finally {
      setLoading(false);
    }
  }, [correo]);

  // (Compat) Ya no hay código que verificar
  const handleVerificarCodigo = () => {
    // Mantener por compatibilidad: en flujo por enlace NO se usa.
    // Podrías redirigir a 'enviado' o no hacer nada.
    setPaso('enviado');
  };

  // (Compat) Cambio de contraseña se hace en /auth/reset-password
  const handleCambiarContrasena = () => {
    setCambioExitoso(true);
    // En este flujo, el cambio real ocurre en la pantalla ResetPassword.jsx
  };

  // Resetear todo
  const resetAllStates = () => {
    setCorreo('');
    setError('');
    setCodigo(['', '', '', '', '']); // compat
    setMensaje('');
    setTimer(300); // compat
    setPaso('correo');
    setNuevaContrasena(''); // compat
    setRepiteContrasena(''); // compat
    setShowPassword(false); // compat
    setShowRepeatPassword(false); // compat
    setCambioExitoso(false); // compat
    setShowCodigoEnviado(false); // compat
    setFadeIn(false); // compat
    setLoading(false);
    clearInterval(timerRef.current);
  };

  return {
    // Estados principales
    paso,
    correo,
    error,
    mensaje,
    loading,

    // Compat
    codigo,
    timer,
    nuevaContrasena,
    repiteContrasena,
    showPassword,
    showRepeatPassword,
    cambioExitoso,
    showCodigoEnviado,
    fadeIn,

    // Setters
    setPaso,
    setCorreo,
    setError,
    setMensaje,
    setCodigo,
    setTimer,
    setNuevaContrasena,
    setRepiteContrasena,
    setShowPassword,
    setShowRepeatPassword,
    setCambioExitoso,
    setShowCodigoEnviado,
    setFadeIn,

    // Métodos
    resetAllStates,
    handleBuscar, // envía el mail
    handleVerificarCodigo, // compat (no usado)
    handleCambiarContrasena, // compat (no usado; se hace en ResetPassword.jsx)
    handleResendCode, // reenvía el mail

    // Refs (compat)
    timerRef,
    fadeTimeout,
  };
};
