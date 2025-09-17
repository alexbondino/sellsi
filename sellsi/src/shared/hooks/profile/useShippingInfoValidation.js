/**
 * ============================================================================
 * SHIPPING INFO VALIDATION HOOK - CACHE Y VALIDACIÓN DE DESPACHO
 * ============================================
 * Valida que la información de despacho (dirección) del usuario esté completa.
 * Campos requeridos:
 *  - shippingRegion
 *  - shippingCommune
 *  - shippingAddress
 *  - shippingNumber
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../../../services/supabase';
import { getUserProfile } from '../../../services/user';
import { mapUserProfileToFormData } from '../../../utils/profileHelpers';

export const SHIPPING_INFO_STATES = {
  COMPLETE: 'complete',
  INCOMPLETE: 'incomplete',
  LOADING: 'loading',
  ERROR: 'error'
};

// Cache simple (similar a billing)
const globalShippingInfoCache = {
  data: null,
  timestamp: null,
  isLoading: false,
  cachedUserId: null,
  CACHE_DURATION: 10 * 60 * 1000, // 10 min
  get() {
    if (!this.data || !this.timestamp) return null;
    const expired = Date.now() - this.timestamp > this.CACHE_DURATION;
    if (expired) { this.clear(); return null; }
    let currentUserId = null;
    try { currentUserId = localStorage.getItem('user_id'); } catch(e) {}
    // 🔥 FIX: Mejorar detección de cambio de usuario
    if (this.cachedUserId !== currentUserId) {
      this.clear();
      return null;
    }
    return this.data;
  },
  set(payload) {
    this.data = payload;
    this.timestamp = Date.now();
    try { this.cachedUserId = localStorage.getItem('user_id') || null; } catch(e) { this.cachedUserId = null; }
  },
  clear() { 
    this.data = null; 
    this.timestamp = null; 
    this.cachedUserId = null;
    this.isLoading = false;  // 🔥 FIX: También limpiar flag de loading
  },
  invalidate() { 
    this.clear(); 
  }
};

export const invalidateShippingInfoCache = () => globalShippingInfoCache.invalidate();

// 🔥 FIX: Exponer función global para invalidación
if (typeof window !== 'undefined') {
  window.invalidateShippingInfoCache = () => {
    globalShippingInfoCache.invalidate();
    
    // También invalidar cache de región
    try { 
      window.invalidateUserShippingRegionCache?.(); 
    } catch(e) {
      console.error('Error invalidating UserShippingRegionCache:', e);
    }
  };
}

// 🔥 FIX: Sistema simplificado de instancias
let hookInstanceCounter = 0;

export const useShippingInfoValidation = () => {
  const [state, setState] = useState(SHIPPING_INFO_STATES.LOADING);
  const [shippingInfo, setShippingInfo] = useState(null);
  const [missingFields, setMissingFields] = useState([]);
  const [error, setError] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [instanceId] = useState(() => ++hookInstanceCounter);



  // 🔥 FIX: Función para resetear completamente el estado
  const resetState = useCallback(() => {
    setShippingInfo(null);
    setMissingFields([]);
    setState(SHIPPING_INFO_STATES.LOADING);
    setError(null);
    setCurrentUserId(null);
  }, [instanceId]);

  const validateShippingInfo = useCallback((data) => {
    // Regla relajada: consideramos "completo" si hay región + comuna
    // Dirección y número son opcionales para permitir guest checkout viable.
    if (!data) {
      return {
        isComplete: false,
        missing: [
          { field: 'shippingRegion', label: 'Región de Despacho' },
          { field: 'shippingCommune', label: 'Comuna de Despacho' },
        ],
        optional: [
          { field: 'shippingAddress', label: 'Dirección de Despacho' },
          { field: 'shippingNumber', label: 'Número de Dirección' },
        ],
        errors: []
      };
    }
    const required = [
      { field: 'shippingRegion', value: data.shippingRegion, label: 'Región de Despacho' },
      { field: 'shippingCommune', value: data.shippingCommune, label: 'Comuna de Despacho' },
    ];
    const optional = [
      { field: 'shippingAddress', value: data.shippingAddress, label: 'Dirección de Despacho' },
      { field: 'shippingNumber', value: data.shippingNumber, label: 'Número de Dirección' },
    ];
    const missing = [];
    required.forEach(r => {
      if (!r.value || (typeof r.value === 'string' && r.value.trim() === '')) missing.push({ field: r.field, label: r.label });
    });
    // No forzamos los opcionales; solo se informan como "optionalMissing" si hiciera falta mostrarlos en UI
    return { isComplete: missing.length === 0, missing, optionalMissing: optional.filter(r => !r.value || (typeof r.value === 'string' && r.value.trim() === '')), errors: [] };
  }, []);

  const load = useCallback(async (force = false) => {
    if (!force) {
      const cached = globalShippingInfoCache.get();
      if (cached) {
        setShippingInfo(cached.data);
        const validation = validateShippingInfo(cached.data);
        setMissingFields(validation.missing);
        setState(validation.isComplete ? SHIPPING_INFO_STATES.COMPLETE : SHIPPING_INFO_STATES.INCOMPLETE);
        return cached;
      }
    }
    if (globalShippingInfoCache.isLoading) {
      return new Promise(resolve => {
        const wait = () => {
          if (!globalShippingInfoCache.isLoading) resolve(globalShippingInfoCache.get()); else setTimeout(wait, 80);
        }; wait();
      });
    }
    try {
  globalShippingInfoCache.isLoading = true;
      setState(SHIPPING_INFO_STATES.LOADING);
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error('Usuario no autenticado');
      const profileResp = await getUserProfile(user.id);
      if (!profileResp?.data) throw new Error('Perfil no disponible');
      const formData = mapUserProfileToFormData(profileResp.data);
      const shippingData = {
        shippingRegion: formData.shippingRegion || '',
        shippingCommune: formData.shippingCommune || '',
        shippingAddress: formData.shippingAddress || '',
        shippingNumber: formData.shippingNumber || ''
      };
      const validation = validateShippingInfo(shippingData);
      setShippingInfo(shippingData);
      setMissingFields(validation.missing);
      setState(validation.isComplete ? SHIPPING_INFO_STATES.COMPLETE : SHIPPING_INFO_STATES.INCOMPLETE);
      const cachePayload = { data: shippingData, validation };
      globalShippingInfoCache.set(cachePayload);
      return cachePayload;
    } catch (err) {
      setError(err.message);
      setState(SHIPPING_INFO_STATES.ERROR);
      setShippingInfo(null);
      setMissingFields([]);
      return null;
    } finally {
      globalShippingInfoCache.isLoading = false;
    }
  }, [validateShippingInfo]);

  useEffect(() => { load(); }, [load]);

  // 🔥 FIX: Inicialización simple una sola vez
  useEffect(() => {
    const initUserId = (() => {
      try { return localStorage.getItem('user_id'); } catch(e) { return null; }
    })();
    
    if (currentUserId === null && initUserId !== null) {
      setCurrentUserId(initUserId);
    }
  }, []); // Solo ejecutar una vez al montar

  // Separate effect for handling user changes from auth events
  useEffect(() => {
    const handleAuthChange = (event) => {
      const eventUserId = event.detail?.userId;
      // Procesar cambio de usuario
      if (eventUserId !== currentUserId) {
        // Invalidar cache
        globalShippingInfoCache.invalidate();
        if (eventUserId) {
          setCurrentUserId(eventUserId);
          setTimeout(() => { load(true); }, 100); // Force reload with delay
        } else {
          resetState();
        }
      }
    };

    // Listen to specific auth events instead of polling
    window.addEventListener('user-changed', handleAuthChange);

    
    return () => {

      window.removeEventListener('user-changed', handleAuthChange);
    };
  }, [currentUserId, load, resetState, instanceId]);

  // Removed storage listener - using custom auth events instead

  const refresh = useCallback(() => load(true), [load]);
  const invalidateCache = useCallback(() => globalShippingInfoCache.invalidate(), []);

  const isComplete = useMemo(() => state === SHIPPING_INFO_STATES.COMPLETE, [state]);
  const isLoading = useMemo(() => state === SHIPPING_INFO_STATES.LOADING, [state]);
  const missingFieldLabels = useMemo(() => missingFields.map(m => m.label || m.field), [missingFields]);

  return {
    state,
    isComplete,
    isLoading,
    error,
    shippingInfo,
    missingFields,
    missingFieldLabels,
    refresh,
    invalidateCache,
    validateShippingInfo
  };
};

export default useShippingInfoValidation;