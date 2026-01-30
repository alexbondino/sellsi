import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../../../../services/supabase';

export const useBuyerFinancings = () => {
  const [financings, setFinancings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(true);
  const [error, setError] = useState(null);
  const fetchStartedRef = useRef(false);

  const fetchFinancings = useCallback(async () => {
    if (fetchStartedRef.current) return;
    fetchStartedRef.current = true;

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('financing_requests')
        .select('id, buyer_id, supplier_id, amount, available_amount, status, due_date, created_at, updated_at, buyer(name,email), supplier(name,legal_rut)')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data) && data.length > 0) {
        const processed = data.map(f => {
          const supplier = f.supplier || {};
          const buyer = f.buyer || {};
          return {
            id: f.id,
            supplier_name: supplier.name || '',
            amount: parseFloat(f.amount),
            term_days: null,
            status: f.status,
            created_at: f.created_at,
            request_type: 'unknown',
            document_count: 0,
            buyer_id: f.buyer_id,
            supplier_id: f.supplier_id,
          };
        });
        setFinancings(processed);
      } else {
        // fallback: empty list
        setFinancings([]);
      }
    } catch (err) {
      console.error('[useBuyerFinancings] Error fetching:', err);
      setError(err.message);
      setFinancings([]);
    } finally {
      setLoading(false);
      setInitializing(false);
    }
  }, []);

  const signFinancing = useCallback(async (id) => {
    try {
      try {
        const { error } = await supabase.from('financing_requests').update({ status: 'pending_sellsi_approval' }).eq('id', id);
        if (error) throw error;
      } catch (e) {
        console.error('[useBuyerFinancings] DB update failed for sign:', e.message || e);
      }
      setFinancings(prev => prev.map(f => f.id === id ? { ...f, status: 'pending_sellsi_approval' } : f));
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, []);

  const cancelFinancing = useCallback(async (id, reason = null) => {
    try {
      try {
        const { error } = await supabase.from('financing_requests').update({ status: 'cancelled_by_buyer' }).eq('id', id);
        if (error) throw error;
      } catch (e) {
        console.error('[useBuyerFinancings] DB update failed for cancel:', e.message || e);
      }
      setFinancings(prev => prev.map(f => f.id === id ? { ...f, status: 'cancelled_by_buyer', cancellation_reason: reason } : f));
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, []);

  const payOnline = useCallback(async (financing) => {
    // This would open a payment flow; for now just log and return success
    console.log('[useBuyerFinancings] payOnline:', financing.id);
    return { success: true };
  }, []);

  useEffect(() => {
    fetchFinancings();
  }, [fetchFinancings]);

  return {
    financings,
    loading,
    initializing,
    error,
    signFinancing,
    cancelFinancing,
    payOnline,
  };
};
