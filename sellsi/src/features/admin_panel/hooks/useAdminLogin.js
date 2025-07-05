/**
 * 🔐 Hook para manejo del Login Administrativo
 * 
 * Hook personalizado que maneja el estado del formulario de login
 * administrativo, validaciones y lógica de autenticación.
 * 
 * @author Panel Administrativo Sellsi
 * @date 30 de Junio de 2025
 */

import { useState, useCallback } from 'react';

export const useAdminLogin = () => {
  // ========================================
  // 🔧 ESTADO INICIAL
  // ========================================
  
  const [formState, setFormState] = useState({
    usuario: '',
    password: '',
    code2FA: '',
    errors: {
      usuario: '',
      password: '',
      code2FA: ''
    },
    touched: {
      usuario: false,
      password: false,
      code2FA: false
    }
  });

  // ========================================
  // 🔧 HANDLERS
  // ========================================

  /**
   * Manejar cambios en los inputs del formulario
   */
  const handleInputChange = useCallback((field, value) => {
    setFormState(prev => ({
      ...prev,
      [field]: value,
      errors: {
        ...prev.errors,
        [field]: '' // Limpiar error al escribir
      },
      touched: {
        ...prev.touched,
        [field]: true
      }
    }));
  }, []);

  /**
   * Validar campo individual
   */
  const validateField = useCallback((field, value) => {
    switch (field) {
      case 'usuario':
        if (!value) return 'Usuario administrativo es requerido';
        if (value.length < 3) return 'Usuario debe tener al menos 3 caracteres';
        if (!/^[a-zA-Z0-9_]+$/.test(value)) return 'Solo se permiten letras, números y guiones bajos';
        return '';

      case 'password':
        if (!value) return 'Contraseña es requerida';
        if (value.length < 8) return 'Contraseña debe tener al menos 8 caracteres';
        return '';

      case 'code2FA':
        if (!value) return 'Código 2FA es requerido';
        if (!/^\d{6}$/.test(value)) return 'Código debe ser 6 dígitos numéricos';
        return '';

      default:
        return '';
    }
  }, []);

  /**
   * Validar todo el formulario
   */
  const validateForm = useCallback((step = 0) => {
    const newErrors = {};
    let isValid = true;

    if (step === 0) {
      // Validar credenciales
      const usuarioError = validateField('usuario', formState.usuario);
      const passwordError = validateField('password', formState.password);

      if (usuarioError) {
        newErrors.usuario = usuarioError;
        isValid = false;
      }

      if (passwordError) {
        newErrors.password = passwordError;
        isValid = false;
      }
    } else if (step === 1) {
      // Validar 2FA
      const code2FAError = validateField('code2FA', formState.code2FA);

      if (code2FAError) {
        newErrors.code2FA = code2FAError;
        isValid = false;
      }
    }

    setFormState(prev => ({
      ...prev,
      errors: { ...prev.errors, ...newErrors }
    }));

    return isValid;
  }, [formState.usuario, formState.password, formState.code2FA, validateField]);

  /**
   * Resetear formulario
   */
  const resetForm = useCallback(() => {
    setFormState({
      usuario: '',
      password: '',
      code2FA: '',
      errors: {
        usuario: '',
        password: '',
        code2FA: ''
      },
      touched: {
        usuario: false,
        password: false,
        code2FA: false
      }
    });
  }, []);

  /**
   * Validar en tiempo real mientras el usuario escribe
   */
  const handleBlur = useCallback((field) => {
    const error = validateField(field, formState[field]);
    setFormState(prev => ({
      ...prev,
      errors: {
        ...prev.errors,
        [field]: error
      },
      touched: {
        ...prev.touched,
        [field]: true
      }
    }));
  }, [formState, validateField]);

  // ========================================
  // 🔧 UTILIDADES DE SEGURIDAD
  // ========================================

  /**
   * Generar salt para hash de contraseñas (futuro uso)
   */
  const generateSalt = useCallback(() => {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }, []);

  /**
   * Detectar intentos de fuerza bruta
   */
  const checkBruteForce = useCallback((usuario) => {
    const attemptKey = `admin_login_attempts_${usuario}`;
    const attempts = JSON.parse(localStorage.getItem(attemptKey) || '[]');
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;

    // Filtrar intentos de la última hora
    const recentAttempts = attempts.filter(attempt => now - attempt < oneHour);

    if (recentAttempts.length >= 5) {
      return {
        blocked: true,
        timeRemaining: Math.ceil((recentAttempts[0] + oneHour - now) / 1000 / 60)
      };
    }

    return { blocked: false };
  }, []);

  /**
   * Registrar intento fallido
   */
  const recordFailedAttempt = useCallback((usuario) => {
    const attemptKey = `admin_login_attempts_${usuario}`;
    const attempts = JSON.parse(localStorage.getItem(attemptKey) || '[]');
    
    attempts.push(Date.now());
    localStorage.setItem(attemptKey, JSON.stringify(attempts));
  }, []);

  /**
   * Limpiar intentos fallidos después de login exitoso
   */
  const clearFailedAttempts = useCallback((usuario) => {
    const attemptKey = `admin_login_attempts_${usuario}`;
    localStorage.removeItem(attemptKey);
  }, []);

  // ========================================
  // 🔧 VALIDACIONES ESPECÍFICAS ADMIN
  // ========================================

  /**
   * Validar fortaleza de contraseña administrativa
   */
  const validatePasswordStrength = useCallback((password) => {
    const checks = {
      length: password.length >= 12,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      numbers: /\d/.test(password),
      symbols: /[!@#$%^&*(),.?":{}|<>]/.test(password),
      noCommon: !['admin', 'password', '123456', 'sellsi'].some(common => 
        password.toLowerCase().includes(common)
      )
    };

    const strength = Object.values(checks).filter(Boolean).length;
    
    return {
      strength: strength / 6,
      checks,
      isStrong: strength >= 5
    };
  }, []);

  /**
   * Verificar si el usuario está en lista negra
   */
  const checkBlacklist = useCallback((usuario) => {
    const blacklistedUsers = ['admin', 'root', 'administrator', 'test', 'demo'];
    return blacklistedUsers.includes(usuario.toLowerCase());
  }, []);

  // ========================================
  // 🔧 ESTADO Y MÉTODOS EXPUESTOS
  // ========================================

  return {
    // Estado
    formState,
    
    // Handlers principales
    handleInputChange,
    handleBlur,
    validateForm,
    resetForm,
    
    // Validaciones específicas
    validateField,
    validatePasswordStrength,
    
    // Seguridad
    checkBruteForce,
    recordFailedAttempt,
    clearFailedAttempts,
    checkBlacklist,
    
    // Utilidades
    generateSalt,
    
    // Getters computados
    isFormValid: (step = 0) => {
      if (step === 0) {
        return formState.usuario && 
               formState.password && 
               !formState.errors.usuario && 
               !formState.errors.password;
      } else if (step === 1) {
        return formState.code2FA && 
               !formState.errors.code2FA &&
               /^\d{6}$/.test(formState.code2FA);
      }
      return false;
    },
    
    hasErrors: Object.values(formState.errors).some(error => error !== ''),
    
    touchedFields: Object.keys(formState.touched).filter(field => formState.touched[field])
  };
};

export default useAdminLogin;
