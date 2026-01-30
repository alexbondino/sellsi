/**
 * ============================================================================
 * USE SUPPLIER FINANCINGS HOOK
 * ============================================================================
 * 
 * Hook para gestionar las solicitudes de financiamiento recibidas por el proveedor.
 * Similar a useSupplierOffers pero adaptado al contexto de financiamiento.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../../../../services/supabase';
import { STATE_CONFIG } from '../../../../shared/utils/financing/financingStates';

// Re-exportar configuración de estados para compatibilidad
export const STATUS_MAP = STATE_CONFIG;

/**
 * Hook principal para gestionar financiamientos del proveedor
 */
export const useSupplierFinancings = () => {
  const [financings, setFinancings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(true);
  const [error, setError] = useState(null);
  const fetchStartedRef = useRef(false);

  /**
   * Obtener solicitudes de financiamiento
   * TODO: Conectar con Supabase cuando exista la tabla
   */
  const fetchFinancings = useCallback(async () => {
    if (fetchStartedRef.current) return;
    fetchStartedRef.current = true;
    
    setLoading(true);
    setError(null);

    try {
      // Intentar obtener datos reales desde Supabase
      const { data, error } = await supabase
        .from('financing_requests')
        .select('id, buyer_id, supplier_id, amount, available_amount, status, due_date, created_at, updated_at, buyer(name,email,created_at), supplier(name,legal_rut)')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        // Map DB rows to UI shape (allow empty list)
        const processed = (data || []).map(f => {
          const buyer = f.buyer || {};
          const supplier = f.supplier || {};
          return {
            id: f.id,
            buyer_user_nm: buyer.name || buyer.email || '',
            buyer_legal_name: buyer.name || '',
            buyer_legal_rut: buyer.legal_rut || null,
            buyer_legal_representative_name: null,
            buyer_legal_representative_rut: null,
            buyer_legal_address: null,
            buyer_legal_commune: null,
            buyer_legal_region: null,
            amount: parseFloat(f.amount),
            term_days: null,
            documents: [],
            status: f.status,
            created_at: f.created_at,
            request_type: 'unknown',
            document_count: 0,
            buyer_id: f.buyer_id,
            supplier_id: f.supplier_id,
          };
        });

        setFinancings(processed);

        // If the table exists but returned no rows, leave an empty array (no mocks)
      } else {
        // No data available from Supabase (table missing or query failed). Don't inject mock data.
        setFinancings([]);
        if (error) setError(error.message || 'Error fetching financings');
      }
    } catch (err) {
      console.error('[useSupplierFinancings] Error fetching:', err);
      setError(err.message);
      // Fallback minimal
      setFinancings([]);
    } finally {
      setLoading(false);
      setInitializing(false);
    }
  }, []);

  /**
   * Aprobar solicitud de financiamiento
   */
  const approveFinancing = useCallback(async (financingId) => {
    try {
      // Intentar actualizar en Supabase
      try {
        const { error } = await supabase.from('financing_requests').update({ status: 'buyer_signature_pending' }).eq('id', financingId);
        if (error) throw error;
      } catch (e) {
        // Si falla la actualización en DB, loggear y seguir con el fallback en memoria
        console.error('[useSupplierFinancings] DB update failed for approve:', e.message || e);
      }

      setFinancings(prev => 
        prev.map(f => f.id === financingId ? { ...f, status: 'buyer_signature_pending' } : f)
      );
      return { success: true };
    } catch (err) {
      console.error('[useSupplierFinancings] Error approving:', err);
      return { success: false, error: err.message };
    }
  }, []);

  /**
   * Rechazar solicitud de financiamiento
   */
  const rejectFinancing = useCallback(async (financingId, reason = null) => {
    try {
      // Intentar actualizar status en Supabase (solo status para evitar columnas inexistentes)
      try {
        const { error } = await supabase.from('financing_requests').update({ status: 'rejected_by_supplier' }).eq('id', financingId);
        if (error) throw error;
      } catch (e) {
        console.error('[useSupplierFinancings] DB update failed for reject:', e.message || e);
      }

      setFinancings(prev => 
        prev.map(f => f.id === financingId 
          ? { ...f, status: 'rejected_by_supplier', rejection_reason: reason } 
          : f
        )
      );
      return { success: true };
    } catch (err) {
      console.error('[useSupplierFinancings] Error rejecting:', err);
      return { success: false, error: err.message };
    }
  }, []);

  /**
   * Firmar solicitud de financiamiento
   */
  const signFinancing = useCallback(async (financingId) => {
    try {
      try {
        const { error } = await supabase.from('financing_requests').update({ status: 'pending_sellsi_approval' }).eq('id', financingId);
        if (error) throw error;
      } catch (e) {
        console.error('[useSupplierFinancings] DB update failed for sign:', e.message || e);
      }

      setFinancings(prev => 
        prev.map(f => f.id === financingId ? { ...f, status: 'pending_sellsi_approval' } : f)
      );
      return { success: true };
    } catch (err) {
      console.error('[useSupplierFinancings] Error signing:', err);
      return { success: false, error: err.message };
    }
  }, []);

  /**
   * Cancelar solicitud de financiamiento
   */
  const cancelFinancing = useCallback(async (financingId, reason = null) => {
    try {
      try {
        const { error } = await supabase.from('financing_requests').update({ status: 'cancelled_by_supplier' }).eq('id', financingId);
        if (error) throw error;
      } catch (e) {
        console.error('[useSupplierFinancings] DB update failed for cancel:', e.message || e);
      }

      setFinancings(prev => 
        prev.map(f => f.id === financingId 
          ? { ...f, status: 'cancelled_by_supplier', cancellation_reason: reason } 
          : f
        )
      );
      return { success: true };
    } catch (err) {
      console.error('[useSupplierFinancings] Error cancelling:', err);
      return { success: false, error: err.message };
    }
  }, []);

  // Fetch inicial
  useEffect(() => {
    fetchFinancings();
  }, [fetchFinancings]);

  return {
    financings,
    setFinancings,
    loading,
    initializing,
    error,
    fetchFinancings,
    approveFinancing,
    rejectFinancing,
    signFinancing,
    cancelFinancing,
  };
};

export default useSupplierFinancings;
