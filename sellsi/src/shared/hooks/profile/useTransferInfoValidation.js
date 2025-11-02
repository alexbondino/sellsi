/**
 * ============================================================================
 * TRANSFER INFO VALIDATION HOOK - SISTEMA DE CACHE Y VALIDACIÓN
 * ============================================================================
 *
 * Hook especializado para validar información bancaria del perfil con cache
 * optimizado y actualización automática.
 *
 * Características:
 * - Cache de 20 minutos (más duradero que shipping)
 * - Validación completa de campos requeridos
 * - Invalidación automática al actualizar perfil
 * - API consistente para uso en diferentes componentes
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { getUserProfile } from '../../../services/user';
import { validateRut, validateEmail } from '../../../utils/validators';
import { mapUserProfileToFormData } from '../../../utils/profileHelpers'; // ✅ Usar el mapeo correcto
import { supabase } from '../../../services/supabase'; // ✅ Para obtener el userId actual

/**
 * Estados de validación de información bancaria
 */
export const TRANSFER_INFO_STATES = {
  COMPLETE: 'complete',
  INCOMPLETE: 'incomplete',
  LOADING: 'loading',
  ERROR: 'error',
};

/**
 * Cache global para información bancaria
 */
const globalTransferInfoCache = {
  data: null,
  timestamp: null,
  isLoading: false,
  cachedUserId: null,
  CACHE_DURATION: 20 * 60 * 1000, // 20 minutos

  get: () => {
    // Si no hay datos base, salir rápido
    if (!globalTransferInfoCache.data || !globalTransferInfoCache.timestamp) {
      return null;
    }

    // Blindaje por expiración
    const isExpired =
      Date.now() - globalTransferInfoCache.timestamp >
      globalTransferInfoCache.CACHE_DURATION;
    if (isExpired) {
      globalTransferInfoCache.clear();
      return null;
    }

    // Blindaje por cambio de usuario (multi login / cambio rápido de cuenta)
    let currentUserId = null;
    try {
      currentUserId = localStorage.getItem('user_id');
    } catch (e) {}
    if (
      currentUserId &&
      globalTransferInfoCache.cachedUserId &&
      currentUserId !== globalTransferInfoCache.cachedUserId
    ) {
      // Usuario cambió: invalidar para evitar contaminación cruzada
      globalTransferInfoCache.clear();
      return null;
    }

    return globalTransferInfoCache.data;
  },

  set: transferInfo => {
    globalTransferInfoCache.data = transferInfo;
    globalTransferInfoCache.timestamp = Date.now();
    try {
      globalTransferInfoCache.cachedUserId =
        localStorage.getItem('user_id') || null;
    } catch (e) {
      globalTransferInfoCache.cachedUserId = null;
    }
  },

  clear: () => {
    globalTransferInfoCache.data = null;
    globalTransferInfoCache.timestamp = null;
    globalTransferInfoCache.cachedUserId = null;
  },

  invalidate: () => {
    globalTransferInfoCache.clear();
  },
};

/**
 * Hook principal para validación de información bancaria
 */
export const useTransferInfoValidation = (userId = null) => {
  const [state, setState] = useState(TRANSFER_INFO_STATES.LOADING);
  const [transferInfo, setTransferInfo] = useState(null);
  const [missingFields, setMissingFields] = useState([]);
  const [error, setError] = useState(null);

  /**
   * Función para validar si la información bancaria está completa
   */
  const validateTransferInfo = useCallback(data => {
    if (!data) {
      return {
        isComplete: false,
        missingFields: [
          'accountHolder',
          'bank',
          'accountNumber',
          'transferRut',
          'confirmationEmail',
        ],
        errors: [],
      };
    }

    const requiredFields = [
      {
        field: 'accountHolder',
        value: data.accountHolder,
        label: 'Nombre Titular',
      },
      { field: 'bank', value: data.bank, label: 'Banco' },
      {
        field: 'accountNumber',
        value: data.accountNumber,
        label: 'Número de Cuenta',
      },
      { field: 'transferRut', value: data.transferRut, label: 'RUT' },
      {
        field: 'confirmationEmail',
        value: data.confirmationEmail,
        label: 'Correo de Confirmación',
      },
    ];

    const missing = [];
    const errors = [];

    requiredFields.forEach(({ field, value, label }) => {
      // Verificar si el campo está vacío o es null/undefined
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        missing.push({ field, label });
      }
    });

    // Validaciones específicas para campos que tienen valor
    if (
      data.transferRut &&
      data.transferRut.trim() !== '' &&
      !validateRut(data.transferRut)
    ) {
      errors.push({ field: 'transferRut', message: 'Formato de RUT inválido' });
    }

    if (
      data.confirmationEmail &&
      data.confirmationEmail.trim() !== '' &&
      !validateEmail(data.confirmationEmail)
    ) {
      errors.push({
        field: 'confirmationEmail',
        message: 'Formato de email inválido',
      });
    }

    return {
      isComplete: missing.length === 0 && errors.length === 0,
      missingFields: missing,
      errors,
    };
  }, []);

  /**
   * Función para cargar información bancaria del usuario
   */
  const loadTransferInfo = useCallback(
    async (forceRefresh = false) => {
      // Verificar cache primero si no es refresh forzado
      if (!forceRefresh) {
        const cached = globalTransferInfoCache.get();
        if (cached) {
          setTransferInfo(cached.data);
          const validation = validateTransferInfo(cached.data);
          setState(
            validation.isComplete
              ? TRANSFER_INFO_STATES.COMPLETE
              : TRANSFER_INFO_STATES.INCOMPLETE
          );
          setMissingFields(validation.missingFields);
          setError(null);
          return cached;
        }
      }

      // Evitar múltiples llamadas simultáneas
      if (globalTransferInfoCache.isLoading) {
        return new Promise(resolve => {
          const checkLoading = () => {
            if (!globalTransferInfoCache.isLoading) {
              const result = globalTransferInfoCache.get();
              resolve(result);
            } else {
              setTimeout(checkLoading, 100);
            }
          };
          checkLoading();
        });
      }

      try {
        globalTransferInfoCache.isLoading = true;
        setState(TRANSFER_INFO_STATES.LOADING);
        setError(null);

        // ✅ CORRECCIÓN: Obtener el userId actual desde Supabase
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();
        if (authError || !user) {
          throw new Error('Usuario no autenticado');
        }

        const profileResponse = await getUserProfile(user.id); // ✅ Pasar el userId

        if (!profileResponse || !profileResponse.data) {
          throw new Error('No se pudo obtener el perfil del usuario');
        }

        const profileData = profileResponse.data; // ✅ CORRECCIÓN: Extraer data del response

        // ✅ CORRECCIÓN: Usar el mapeo correcto para obtener datos en formato de formulario
        const formData = mapUserProfileToFormData(profileData);

        const transferData = {
          accountHolder: formData.accountHolder || '',
          bank: formData.bank || '',
          accountNumber: formData.accountNumber || '',
          transferRut: formData.transferRut || '',
          confirmationEmail: formData.confirmationEmail || '',
        };

        // Validar y actualizar estado
        const validation = validateTransferInfo(transferData);

        setTransferInfo(transferData);
        setState(
          validation.isComplete
            ? TRANSFER_INFO_STATES.COMPLETE
            : TRANSFER_INFO_STATES.INCOMPLETE
        );
        setMissingFields(validation.missingFields);

        // Guardar en cache
        const cacheData = { data: transferData, validation };
        globalTransferInfoCache.set(cacheData);

        return cacheData;
      } catch (err) {
        console.error('❌ Error al cargar información bancaria:', err);
        setState(TRANSFER_INFO_STATES.ERROR);
        setError(err.message);
        setTransferInfo(null);
        setMissingFields([]);
        return null;
      } finally {
        globalTransferInfoCache.isLoading = false;
      }
    },
    [validateTransferInfo]
  );

  /**
   * Función para invalidar cache (llamar después de actualizar perfil)
   */
  const invalidateCache = useCallback(() => {
    globalTransferInfoCache.invalidate();
  }, []);

  /**
   * Función para refrescar información
   */
  const refresh = useCallback(() => {
    return loadTransferInfo(true);
  }, [loadTransferInfo]);

  /**
   * Cargar información al montar el componente
   */
  useEffect(() => {
    loadTransferInfo();
  }, [loadTransferInfo]);

  /**
   * Estado computado para facilitar el uso
   */
  const isComplete = useMemo(
    () => state === TRANSFER_INFO_STATES.COMPLETE,
    [state]
  );
  const isLoading = useMemo(
    () => state === TRANSFER_INFO_STATES.LOADING,
    [state]
  );
  const hasError = useMemo(() => state === TRANSFER_INFO_STATES.ERROR, [state]);

  /**
   * Lista de campos faltantes con labels amigables
   */
  const missingFieldLabels = useMemo(() => {
    return missingFields.map(field => field.label || field.field);
  }, [missingFields]);

  return {
    // Estados principales
    state,
    isComplete,
    isLoading,
    hasError,
    error,

    // Datos
    transferInfo,
    missingFields,
    missingFieldLabels,

    // Acciones
    refresh,
    invalidateCache,

    // Función de validación para uso externo
    validateTransferInfo,
  };
};

/**
 * Hook simplificado para solo verificar si está completa (sin cargar datos)
 * Útil para validaciones rápidas
 */
export const useTransferInfoCheck = () => {
  const [isComplete, setIsComplete] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkInfo = async () => {
      setIsLoading(true);

      // Verificar cache primero
      const cached = globalTransferInfoCache.get();
      if (cached) {
        setIsComplete(cached.validation.isComplete);
        setIsLoading(false);
        return;
      }

      // Si no hay cache, hacer una carga rápida
      try {
        // ✅ CORRECCIÓN: Obtener el userId actual también aquí
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();
        if (authError || !user) {
          throw new Error('Usuario no autenticado para verificación rápida');
        }

        const profileResponse = await getUserProfile(user.id); // ✅ Pasar el userId

        if (!profileResponse || !profileResponse.data) {
          throw new Error(
            'No se pudo obtener el perfil del usuario para verificación'
          );
        }

        const profileData = profileResponse.data; // ✅ CORRECCIÓN: Extraer data del response

        // ✅ CORRECCIÓN: Usar el mapeo correcto aquí también
        const formData = mapUserProfileToFormData(profileData);

        const transferData = {
          accountHolder: formData.accountHolder || '',
          bank: formData.bank || '',
          accountNumber: formData.accountNumber || '',
          transferRut: formData.transferRut || '',
          confirmationEmail: formData.confirmationEmail || '',
        };

        const requiredFields = [
          'accountHolder',
          'bank',
          'accountNumber',
          'transferRut',
          'confirmationEmail',
        ];
        const missing = requiredFields.filter(
          field => !transferData[field] || transferData[field].trim() === ''
        );

        const complete =
          missing.length === 0 &&
          validateRut(transferData.transferRut) &&
          validateEmail(transferData.confirmationEmail);

        setIsComplete(complete);
      } catch (err) {
        console.error('Error al verificar información bancaria:', err);
        setIsComplete(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkInfo();
  }, []);

  return { isComplete, isLoading };
};

/**
 * Función utilitaria para invalidar cache desde cualquier lugar
 */
export const invalidateTransferInfoCache = () => {
  globalTransferInfoCache.invalidate();
};

// Exponer invalidador global (similar a shipping) para eventos de auth
try {
  if (typeof window !== 'undefined' && !window.invalidateTransferInfoCache) {
    window.invalidateTransferInfoCache = () =>
      globalTransferInfoCache.invalidate();
  }
} catch (e) {}

export default useTransferInfoValidation;
