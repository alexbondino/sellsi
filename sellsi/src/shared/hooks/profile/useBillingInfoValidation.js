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
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { getUserProfile } from '../../../services/user';
import { supabase } from '../../../services/supabase';
import { validateRut } from '../../../utils/validators';
import { mapUserProfileToFormData } from '../../../utils/profileHelpers';
import { onCacheReady } from '../../../infrastructure/auth/AuthReadyCoordinator';

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
    // ✅ Bug 1 - Fix: usar !== simple (si cachedUserId es null también limpia)
    if (this.cachedUserId !== currentUserId) {
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

// DEBUG: Contador de instancias del hook (detectar memory leaks)
let hookInstanceCount = 0;

export const useBillingInfoValidation = () => {
  // ✅ CRITICAL FIX: Inicializar estado desde cache global (evita flash LOADING → COMPLETE)
  // Antes: siempre iniciaba con LOADING → flash visible
  // Ahora: si hay cache, inicia con datos del cache → sin flash
  const getInitialState = () => {
    const cached = globalBillingInfoCache.get();
    if (cached && cached.validation) {
      return {
        state: cached.validation.isComplete 
          ? BILLING_INFO_STATES.COMPLETE 
          : BILLING_INFO_STATES.INCOMPLETE,
        billingInfo: cached.data,
        missingFields: cached.validation.missing || [],
      };
    }
    return {
      state: BILLING_INFO_STATES.LOADING,
      billingInfo: null,
      missingFields: [],
    };
  };

  const initial = getInitialState();
  const [state, setState] = useState(initial.state);
  const [billingInfo, setBillingInfo] = useState(initial.billingInfo);
  const [missingFields, setMissingFields] = useState(initial.missingFields);
  const [error, setError] = useState(null);
  
  // ✅ Timestamp de cuando el hook cargó datos por última vez
  const [lastLoadedAt, setLastLoadedAt] = useState(0);

  // DEBUG: Detectar montajes múltiples
  React.useEffect(() => {
    hookInstanceCount++;
    const currentInstance = hookInstanceCount;
    try {
      // Evitar ruido en CI/tests: no mostrar estos warnings en NODE_ENV === 'test'
      if (process?.env?.NODE_ENV !== 'production' && process?.env?.NODE_ENV !== 'test') {
        console.warn(`[useBillingInfoValidation] 🔴 HOOK MOUNTED #${currentInstance} | Total activos: ${hookInstanceCount}`);
        return () => {
          hookInstanceCount--;
          console.warn(`[useBillingInfoValidation] 🔴 HOOK UNMOUNTED #${currentInstance} | Total activos: ${hookInstanceCount}`);
        };
      }
    } catch (e) {}
  }, []);

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

  // ✅ CRITICAL FIX: Usar useRef para estabilizar load y evitar loop infinito
  // Problema: load en deps de useEffect causaba re-ejecuciones infinitas
  const loadRef = React.useRef();
  
  const load = useCallback(
    async (force = false) => {
      // Diagnostic log (dev only)
      const callStack = new Error().stack?.split('\n')[2]?.trim() || 'unknown';
      try {
        if (process && process.env && process.env.NODE_ENV !== 'production') {
          // eslint-disable-next-line no-console
          console.debug('[useBillingInfoValidation] 🔵 load() called. force=', !!force, 'from:', callStack);
        }
      } catch (e) {}
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
      // ✅ FIX: Si force=true, NO esperar a isLoading (evita deadlock en F5 race condition)
      if (!force && globalBillingInfoCache.isLoading) {
        return new Promise(resolve => {
          const wait = () => {
            if (!globalBillingInfoCache.isLoading) {
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
              }
              resolve(cached);
            } else setTimeout(wait, 80);
          };
          wait();
        });
      }
      try {
        globalBillingInfoCache.isLoading = true;
        // ✅ SOLO poner LOADING si NO hay cache (evita flash)
        const hasCache = globalBillingInfoCache.get() !== null;
        if (!hasCache) {
          setState(BILLING_INFO_STATES.LOADING);
        }
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
        // ✅ Notificar al AuthReadyCoordinator que billing cache está listo
        try { onCacheReady('billing-info'); } catch(e) {}
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
    [] // ✅ Sin deps - usa validateBillingInfo del closure (estable con [])
  );

  // Actualizar ref para que siempre apunte a la última versión de load
  loadRef.current = load;

  // ✅ CRITICAL FIX: Solo ejecutar load() una vez al montar el hook
  // El useEffect anterior con [load] causaba loop infinito porque load se recrea
  useEffect(() => {
    try {
      if (process?.env?.NODE_ENV !== 'production') {
        console.debug('[useBillingInfoValidation] 🟢 useEffect mount - calling loadRef.current()');
      }
    } catch (e) {}
    loadRef.current();

    // Escuchar invalidaciones globales para recargar automáticamente las instancias montadas
    // Esto permite que Profile invalidando cache cause que componentes montados (p. ej. modal) se actualicen.
    const handler = () => {
      try {
        if (process?.env?.NODE_ENV !== 'production') {
          console.debug('[useBillingInfoValidation] 🔔 received billing-info-invalidated event - forcing reload');
        }
      } catch (e) {}
      try {
        if (loadRef && loadRef.current) loadRef.current(true);
      } catch (err) {}
    };

    if (typeof window !== 'undefined' && window.addEventListener) {
      window.addEventListener('billing-info-invalidated', handler);
    }

    // Suscribirse a cambios de auth si la API está disponible (p. ej. supabase)
    let authSubUnsubscribe = null;
    try {
      if (
        supabase &&
        supabase.auth &&
        typeof supabase.auth.onAuthStateChange === 'function'
      ) {
        const res = supabase.auth.onAuthStateChange((event, session) => {
          try {
            // Si user cambia, forzar reload en instancias montadas
            const newUserId = session?.user?.id || null;
            const cachedUserId = globalBillingInfoCache.cachedUserId || null;
            if (newUserId !== cachedUserId) {
              try {
                if (process?.env?.NODE_ENV !== 'production') {
                  console.debug('[useBillingInfoValidation] 🔔 auth state changed - forcing reload');
                }
              } catch (e) {}
              if (loadRef && loadRef.current) loadRef.current(true);
            }
          } catch (e) {}
        });
        // Compatibilidad con la forma que devuelve supabase: { data: { subscription } }
        if (res && res.data && res.data.subscription && typeof res.data.subscription.unsubscribe === 'function') {
          authSubUnsubscribe = () => res.data.subscription.unsubscribe();
        } else if (typeof res === 'function') {
          // Algunas implementaciones devuelven la función de unsubscribe directamente
          authSubUnsubscribe = res;
        }
      }
    } catch (e) {}

    return () => {
      if (typeof window !== 'undefined' && window.removeEventListener) {
        window.removeEventListener('billing-info-invalidated', handler);
      }
      try {
        if (authSubUnsubscribe) authSubUnsubscribe();
      } catch (e) {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Solo al montar

  // ✅ DETECCIÓN MANUAL: No hay polling ni event listeners
  // El modal llama refreshIfStale() al abrirse → detecta invalidaciones inmediatamente
  // Esto evita: loops infinitos, acumulación de listeners, overhead de CPU
  // Ver AddToCartModal.jsx línea 378: useEffect(() => { if (open) refreshIfStale(); }, [open])

  const refresh = useCallback(() => loadRef.current(true), []);
  
  // ✅ MEJORA: Solo recarga si hubo invalidación desde la última carga
  // Evita llamadas innecesarias a DB cuando el modal se abre múltiples veces
  const refreshIfStale = useCallback(() => {
    // ✅ FIX RACE CONDITION POST-F5: Si cache está vacío, forzar carga
    // Escenario: Usuario hace F5 → cache limpio → modal abre → necesita cargar datos
    const cached = globalBillingInfoCache.get();
    if (!cached) {
      return loadRef.current(true);
    }
    
    if (globalBillingInfoCache.wasInvalidatedSince(lastLoadedAt)) {
      return loadRef.current(true);
    }
    // Si no hubo invalidación, los datos actuales son válidos
    return Promise.resolve(null);
  }, [lastLoadedAt]); // Solo depende de lastLoadedAt (estable)
  
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
