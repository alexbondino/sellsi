/**
 * ============================================================================
 * SHIPPING INFO VALIDATION HOOK - CACHE Y VALIDACIÓN DE DESPACHO
 * ============================================================================
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
    if (currentUserId && this.cachedUserId && currentUserId !== this.cachedUserId) {
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
  clear() { this.data = null; this.timestamp = null; this.cachedUserId = null; },
  invalidate() { this.clear(); }
};

export const invalidateShippingInfoCache = () => globalShippingInfoCache.invalidate();

try {
  if (typeof window !== 'undefined' && !window.invalidateShippingInfoCache) {
    window.invalidateShippingInfoCache = () => globalShippingInfoCache.invalidate();
  }
} catch (e) {}

export const useShippingInfoValidation = () => {
  const [state, setState] = useState(SHIPPING_INFO_STATES.LOADING);
  const [shippingInfo, setShippingInfo] = useState(null);
  const [missingFields, setMissingFields] = useState([]);
  const [error, setError] = useState(null);

  const validateShippingInfo = useCallback((data) => {
    if (!data) {
      return {
        isComplete: false,
        missing: [
          { field: 'shippingRegion', label: 'Región de Despacho' },
          { field: 'shippingCommune', label: 'Comuna de Despacho' },
          { field: 'shippingAddress', label: 'Dirección de Despacho' },
          { field: 'shippingNumber', label: 'Número de Dirección' },
        ],
        errors: []
      };
    }
    const required = [
      { field: 'shippingRegion', value: data.shippingRegion, label: 'Región de Despacho' },
      { field: 'shippingCommune', value: data.shippingCommune, label: 'Comuna de Despacho' },
      { field: 'shippingAddress', value: data.shippingAddress, label: 'Dirección de Despacho' },
      { field: 'shippingNumber', value: data.shippingNumber, label: 'Número de Dirección' },
    ];
    const missing = [];
    required.forEach(r => { if (!r.value || (typeof r.value === 'string' && r.value.trim() === '')) missing.push({ field: r.field, label: r.label }); });
    return { isComplete: missing.length === 0, missing, errors: [] };
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
      console.error('[useShippingInfoValidation] Error:', err);
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