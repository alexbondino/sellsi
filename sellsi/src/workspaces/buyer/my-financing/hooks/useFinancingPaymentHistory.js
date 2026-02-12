/**
 * ============================================================================
 * HOOK: useFinancingPaymentHistory
 * ============================================================================
 * 
 * Hook para obtener el historial de pagos de deuda de un financiamiento.
 * Consulta la tabla financing_payments y devuelve los pagos ordenados por fecha.
 */

import { useState, useEffect } from 'react';
import { supabase } from '../../../../services/supabase';

export const useFinancingPaymentHistory = (financingRequestId, shouldFetch = true) => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!financingRequestId || !shouldFetch) {
      setLoading(false);
      setError(null);
      return;
    }

    const fetchPayments = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data, error: fetchError } = await supabase
          .from('financing_payments')
          .select('*')
          .eq('financing_request_id', financingRequestId)
          .order('created_at', { ascending: false });

        if (fetchError) {
          console.error('[useFinancingPaymentHistory] Error fetching payments:', fetchError);
          setError('Error al cargar el historial de pagos');
          setPayments([]);
        } else {
          setPayments(data || []);
        }
      } catch (err) {
        console.error('[useFinancingPaymentHistory] Unexpected error:', err);
        setError('Error inesperado al cargar el historial');
        setPayments([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, [financingRequestId, shouldFetch]);

  return {
    payments,
    loading,
    error,
  };
};
