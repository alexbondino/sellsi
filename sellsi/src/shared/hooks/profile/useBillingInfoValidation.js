/**
 * ============================================================================
 * BILLING INFO VALIDATION HOOK - CACHE Y VALIDACIÓN DE FACTURACIÓN
 * ============================================================================
 * Valida que la información de facturación esté completa antes de permitir
 * operaciones que requieren documento tributario "factura".
 * Campos requeridos si el usuario selecciona factura:
 *  - business_name
 *  - billing_rut
 *  - business_line
 *  - billing_address
 *  - billing_region
 *  - billing_commune
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import { getUserProfile } from '../../../services/user';
import { supabase } from '../../../services/supabase';
import { validateRut } from '../../../utils/validators';
import { mapUserProfileToFormData } from '../../../utils/profileHelpers';

export const BILLING_INFO_STATES = {
  COMPLETE: 'complete',
  INCOMPLETE: 'incomplete',
  LOADING: 'loading',
  ERROR: 'error',
};

// Cache simple en memoria (similar a transfer) - 20 min
const globalBillingInfoCache = {
  data: null,
  timestamp: null,
  isLoading: false,
  cachedUserId: null,
  lastInvalidatedAt: 0, // ✅ Timestamp de última invalidación (elimina race condition)
  CACHE_DURATION: 20 * 60 * 1000,
  get() {
    if (!this.data || !this.timestamp) return null;
    const expired = Date.now() - this.timestamp > this.CACHE_DURATION;
    if (expired) {
      this.clear();
      return null;
    }

    // Blindaje multi-usuario: si cambia el user_id, invalidar
    let currentUserId = null;
    try {
      currentUserId = localStorage.getItem('user_id');
    } catch (e) {}
    if (
      currentUserId &&
      this.cachedUserId &&
      currentUserId !== this.cachedUserId
    ) {
      this.clear();
      return null;
    }
    return this.data;
  },
  set(payload) {
    this.data = payload;
    this.timestamp = Date.now();
    try {
      this.cachedUserId = localStorage.getItem('user_id') || null;
    } catch (e) {
      this.cachedUserId = null;
    }
  },
  clear() {
    this.data = null;
    this.timestamp = null;
    this.cachedUserId = null;
  },
  invalidate() {
    this.lastInvalidatedAt = Date.now(); // ✅ Marcar timestamp ANTES de limpiar
    this.clear();
    // Emitir evento para que instancias montadas se enteren de la invalidación
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('billing-info-invalidated'));
    }
  },
  // ✅ Verifica si hubo invalidación desde la última carga del hook
  wasInvalidatedSince(hookMountTime) {
    return this.lastInvalidatedAt > hookMountTime;
  },
};

export const invalidateBillingInfoCache = () =>
  globalBillingInfoCache.invalidate();

// Exponer invalidador global para eventos de autenticación (similar a shipping)
try {
  if (typeof window !== 'undefined' && !window.invalidateBillingInfoCache) {
    window.invalidateBillingInfoCache = () =>
      globalBillingInfoCache.invalidate();
  }
} catch (e) {}

export const useBillingInfoValidation = () => {
  const [state, setState] = useState(BILLING_INFO_STATES.LOADING);
  const [billingInfo, setBillingInfo] = useState(null);
  const [missingFields, setMissingFields] = useState([]);
  const [error, setError] = useState(null);
  
  // ✅ Timestamp de cuando el hook cargó datos por última vez
  const [lastLoadedAt, setLastLoadedAt] = useState(0);

  const validateBillingInfo = useCallback(data => {
    if (!data) {
      return {
        isComplete: false,
        missing: [
          'businessName',
          'billingRut',
          'businessLine',
          'billingAddress',
          'billingRegion',
          'billingCommune',
        ],
        errors: [],
      };
    }
    const required = [
      {
        field: 'businessName',
        value: data.businessName,
        label: 'Razón Social',
      },
      { field: 'billingRut', value: data.billingRut, label: 'RUT Facturación' },
      { field: 'businessLine', value: data.businessLine, label: 'Giro' },
      {
        field: 'billingAddress',
        value: data.billingAddress,
        label: 'Dirección Facturación',
      },
      {
        field: 'billingRegion',
        value: data.billingRegion,
        label: 'Región Facturación',
      },
      {
        field: 'billingCommune',
        value: data.billingCommune,
        label: 'Comuna Facturación',
      },
    ];
    const missing = [];
    const errors = [];
    required.forEach(r => {
      if (!r.value || (typeof r.value === 'string' && r.value.trim() === ''))
        missing.push(r);
    });
    if (
      data.billingRut &&
      data.billingRut.trim() !== '' &&
      !validateRut(data.billingRut)
    ) {
      errors.push({ field: 'billingRut', message: 'RUT facturación inválido' });
    }
    return {
      isComplete: missing.length === 0 && errors.length === 0,
      missing,
      errors,
    };
  }, []);

  const load = useCallback(
    async (force = false) => {
      if (!force) {
        const cached = globalBillingInfoCache.get();
        if (cached) {
          setBillingInfo(cached.data);
          const validation = validateBillingInfo(cached.data);
          setMissingFields(validation.missing);
          setState(
            validation.isComplete
              ? BILLING_INFO_STATES.COMPLETE
              : BILLING_INFO_STATES.INCOMPLETE
          );
          return cached;
        }
      }
      if (globalBillingInfoCache.isLoading) {
        return new Promise(resolve => {
          const wait = () => {
            if (!globalBillingInfoCache.isLoading)
              resolve(globalBillingInfoCache.get());
            else setTimeout(wait, 80);
          };
          wait();
        });
      }
      try {
        globalBillingInfoCache.isLoading = true;
        setState(BILLING_INFO_STATES.LOADING);
        // Blindaje: en entornos de test el mock de `supabase` puede no exponer `auth.getUser`.
        // En ese caso, evitar lanzar TypeError y salir de forma segura (no fatal para renderizado).
        let user = null;
        if (
          supabase &&
          supabase.auth &&
          typeof supabase.auth.getUser === 'function'
        ) {
          const authResp = await supabase.auth.getUser();
          const authError = authResp?.error || null;
          user = authResp?.data?.user || null;
          if (authError || !user) {
            // Mantener comportamiento previo cuando existe la API de auth: considerar no autenticado
            throw new Error('Usuario no autenticado');
          }
        } else {
          // Sin API de auth (tests): no continuar con la carga de perfil, devolver null de forma segura
          globalBillingInfoCache.isLoading = false;
          setState(BILLING_INFO_STATES.INCOMPLETE);
          setBillingInfo(null);
          setMissingFields([]);
          return null;
        }
        const profileResp = await getUserProfile(user.id, { force });
        if (!profileResp?.data) throw new Error('Perfil no disponible');
        const formData = mapUserProfileToFormData(profileResp.data);
        const billingData = {
          businessName: formData.businessName || '',
          billingRut: formData.billingRut || '',
          businessLine: formData.businessLine || '',
          billingAddress: formData.billingAddress || '',
          billingRegion: formData.billingRegion || '',
          billingCommune: formData.billingCommune || '',
        };
        const validation = validateBillingInfo(billingData);
        setBillingInfo(billingData);
        setMissingFields(validation.missing);
        setState(
          validation.isComplete
            ? BILLING_INFO_STATES.COMPLETE
            : BILLING_INFO_STATES.INCOMPLETE
        );
        const cachePayload = { data: billingData, validation };
        globalBillingInfoCache.set(cachePayload);
        setLastLoadedAt(Date.now()); // ✅ Marcar cuándo cargamos
        return cachePayload;
      } catch (err) {
        console.error('[useBillingInfoValidation] Error:', err);
        setError(err.message);
        setState(BILLING_INFO_STATES.ERROR);
        setBillingInfo(null);
        setMissingFields([]);
        return null;
      } finally {
        globalBillingInfoCache.isLoading = false;
      }
    },
    [validateBillingInfo]
  );

  useEffect(() => {
    load();
  }, [load]);

  // ✅ FIX: Escuchar evento de invalidación para recargar datos (Solución A del análisis)
  // Esto cubre el caso donde AddToCartModal está siempre montado y Profile invalida el cache
  useEffect(() => {
    const handleInvalidation = () => {
      load(true);
    };
    
    window.addEventListener('billing-info-invalidated', handleInvalidation);
    return () => {
      window.removeEventListener('billing-info-invalidated', handleInvalidation);
    };
  }, [load]);

  const refresh = useCallback(() => load(true), [load]);
  
  // ✅ MEJORA: Solo recarga si hubo invalidación desde la última carga
  // Evita llamadas innecesarias a DB cuando el modal se abre múltiples veces
  const refreshIfStale = useCallback(() => {
    if (globalBillingInfoCache.wasInvalidatedSince(lastLoadedAt)) {
      return load(true);
    }
    // Si no hubo invalidación, los datos actuales son válidos
    return Promise.resolve(null);
  }, [load, lastLoadedAt]);
  
  const invalidateCache = useCallback(
    () => globalBillingInfoCache.invalidate(),
    []
  );

  const isComplete = useMemo(
    () => state === BILLING_INFO_STATES.COMPLETE,
    [state]
  );
  const isLoading = useMemo(
    () => state === BILLING_INFO_STATES.LOADING,
    [state]
  );
  const missingFieldLabels = useMemo(
    () => missingFields.map(m => m.label || m.field),
    [missingFields]
  );

  return {
    state,
    isComplete,
    isLoading,
    error,
    billingInfo,
    missingFields,
    missingFieldLabels,
    refresh,
    refreshIfStale, // ✅ Nueva función optimizada para usar en modal
    invalidateCache,
    validateBillingInfo,
  };
};

export default useBillingInfoValidation;
