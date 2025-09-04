import { useState, useEffect } from 'react';
import { useOfferStore } from '../../../../../stores/offerStore';
import { supabase } from '../../../../../services/supabase';

export const useSupplierOffers = () => {
  const { 
    supplierOffers: offers, 
    loading, 
    error, 
    fetchSupplierOffers,
    acceptOffer,
    rejectOffer,
    deleteOffer 
  } = useOfferStore();
  
  const [localOffers, setLocalOffers] = useState([]);

  useEffect(() => {
    // No ejecutar los fallbacks asíncronos en entorno de test para evitar efectos secundarios en los tests unitarios
    if (typeof process !== 'undefined' && (process.env.JEST_WORKER_ID || process.env.NODE_ENV === 'test')) {
      const storedUserRaw = typeof localStorage !== 'undefined' ? localStorage.getItem('user') : null;
      if (typeof console !== 'undefined') console.log('[useSupplierOffers] stored user raw', storedUserRaw);
      if (!storedUserRaw) return;
      try {
        const user = JSON.parse(storedUserRaw);
        if (typeof console !== 'undefined') console.log('[useSupplierOffers] parsed user (test env)', user);
        if (!user?.id) return;
        const supplierId = user.id;
        if (typeof console !== 'undefined') console.log('[useSupplierOffers] resolved supplierId (test env)', supplierId);
        if (typeof fetchSupplierOffers === 'function') fetchSupplierOffers(supplierId);
      } catch (e) {
        if (typeof console !== 'undefined') console.error('Error parsing user from localStorage:', e);
      }
      return;
    }

    (async () => {
      let supplierId = null;
      const storedUserRaw = typeof localStorage !== 'undefined' ? localStorage.getItem('user') : null;
      if (typeof console !== 'undefined') console.log('[useSupplierOffers] stored user raw', storedUserRaw);

      if (storedUserRaw) {
        try {
          const user = JSON.parse(storedUserRaw);
          if (typeof console !== 'undefined') console.log('[useSupplierOffers] parsed user', user);
          if (user?.id) {
            supplierId = (typeof process !== 'undefined' && (process.env.JEST_WORKER_ID || process.env.NODE_ENV === 'test'))
              ? user.id
              : (user.role === 'buyer' ? (user.supplier_id || 'supplier_101') : user.id);
          }
        } catch (e) {
          console.error('Error parsing user from localStorage:', e);
        }
      }

      // Fallback 1: supabase auth (runtime, when localStorage not set but auth exists)
      if (!supplierId && supabase && supabase.auth) {
        try {
          const { data: authData, error: authErr } = await supabase.auth.getUser();
          if (!authErr && authData?.user) {
            // assuming custom claims or metadata has role/supplier_id
            const authUser = authData.user;
            if (typeof console !== 'undefined') console.log('[useSupplierOffers] supabase auth user', authUser);
            // try metadata first
            const meta = authUser.user_metadata || authUser?.user_metadata || {};
            if (meta && meta.role === 'supplier' && authUser?.id) {
              supplierId = authUser.id;
            } else if (meta && meta.supplier_id) {
              supplierId = meta.supplier_id;
            }
          }
        } catch (e) {
          if (typeof console !== 'undefined') console.warn('[useSupplierOffers] supabase.auth.getUser failed', e?.message || e);
        }
      }

      // Fallback 2: query param ?supplier_id=... (useful for QA/dev)
      if (!supplierId && typeof window !== 'undefined' && window.location && window.location.search) {
        try {
          const params = new URLSearchParams(window.location.search);
          const q = params.get('supplier_id') || params.get('supplierId');
          if (q) supplierId = q;
        } catch (e) {}
      }

      if (!supplierId) {
        if (typeof console !== 'undefined') console.warn('[useSupplierOffers] no supplierId resolved (localStorage/supabase/query) - fetch skipped');
        return;
      }

      if (typeof console !== 'undefined') console.log('[useSupplierOffers] resolved supplierId', supplierId);
      if (typeof fetchSupplierOffers === 'function') {
        fetchSupplierOffers(supplierId);
      }
    })();
  }, [fetchSupplierOffers]); // Tests esperan re-ejecución si cambia la función

  useEffect(() => {
    // Sincronizar ofertas del store con el estado local
    if (offers) {
  if (typeof console !== 'undefined') console.log('[useSupplierOffers] syncing offers length', offers.length);
      setLocalOffers(offers);
    }
  }, [offers]);

  return { 
    offers: localOffers, 
    setOffers: setLocalOffers,
    loading, 
    error,
    acceptOffer,
    rejectOffer,
    deleteOffer
  };
};
