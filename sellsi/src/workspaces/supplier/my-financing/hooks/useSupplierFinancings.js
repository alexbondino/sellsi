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
      // TODO: Implementar consulta real a Supabase
      // const { data, error } = await supabase
      //   .from('financing_requests')
      //   .select('*')
      //   .eq('supplier_id', supplierId)
      //   .order('created_at', { ascending: false });

      // Datos de ejemplo para desarrollo
      const mockData = [
        {
          id: '1',
          requested_by: 'Distribuidora ABC Ltda.',
          amount: 15000000,
          term_days: 30,
          business_data: 'RUT: 76.123.456-7',
          documents: ['contrato.pdf', 'pagare.pdf'],
          status: 'pending_supplier_review',
          created_at: new Date().toISOString(),
        },
        {
          id: '2',
          requested_by: 'Comercial XYZ SpA',
          amount: 8500000,
          term_days: 60,
          business_data: 'RUT: 77.987.654-3',
          documents: ['contrato.pdf'],
          status: 'buyer_signature_pending',
          created_at: new Date(Date.now() - 86400000).toISOString(),
        },
        {
          id: '3',
          requested_by: 'Importadora Delta',
          amount: 25000000,
          term_days: 90,
          business_data: 'RUT: 78.555.444-K',
          documents: ['contrato.pdf', 'pagare.pdf', 'garantia.pdf'],
          status: 'supplier_signature_pending',
          created_at: new Date(Date.now() - 172800000).toISOString(),
        },
        {
          id: '4',
          requested_by: 'Empresa Gamma',
          buyer_name: 'Empresa Gamma',
          amount: 12000000,
          amount_used: 4500000, // Ha usado 4.5M de 12M
          term_days: 45,
          business_data: 'RUT: 79.111.222-3',
          documents: ['contrato.pdf'],
          status: 'approved_by_sellsi',
          created_at: new Date(Date.now() - 259200000).toISOString(),
          approved_at: new Date(Date.now() - 172800000).toISOString(), // Aprobado hace 2 días
        },
        {
          id: '5',
          requested_by: 'Comercio Beta',
          amount: 5000000,
          term_days: 30,
          business_data: 'RUT: 80.333.444-5',
          documents: ['contrato.pdf'],
          status: 'rejected_by_supplier',
          rejection_reason: 'Monto excede límite de crédito disponible',
          created_at: new Date(Date.now() - 345600000).toISOString(),
        },
        {
          id: '6',
          requested_by: 'Distribuidora Omega',
          amount: 18000000,
          term_days: 60,
          business_data: 'RUT: 81.555.666-7',
          documents: ['contrato.pdf', 'pagare.pdf'],
          status: 'cancelled_by_buyer',
          cancellation_reason: 'Cliente decidió usar otra fuente de financiamiento',
          created_at: new Date(Date.now() - 432000000).toISOString(),
        },
        {
          id: '7',
          requested_by: 'Comercial Sigma',
          amount: 9500000,
          term_days: 45,
          business_data: 'RUT: 82.777.888-9',
          documents: ['contrato.pdf'],
          status: 'pending_sellsi_approval',
          created_at: new Date(Date.now() - 518400000).toISOString(),
        },
        {
          id: '8',
          requested_by: 'Importaciones Theta',
          amount: 7200000,
          term_days: 30,
          business_data: 'RUT: 83.999.000-K',
          documents: ['contrato.pdf', 'pagare.pdf'],
          status: 'cancelled_by_supplier',
          cancellation_reason: 'Cambio en las condiciones de crédito del proveedor',
          created_at: new Date(Date.now() - 604800000).toISOString(),
        },
        {
          id: '9',
          requested_by: 'Distribuidora Kappa',
          amount: 22000000,
          term_days: 90,
          business_data: 'RUT: 84.111.222-3',
          documents: ['contrato.pdf'],
          status: 'rejected_by_sellsi',
          rejection_reason: 'Documentación incompleta - falta garantía bancaria',
          created_at: new Date(Date.now() - 691200000).toISOString(),
        },
      ];

      setFinancings(mockData);
    } catch (err) {
      console.error('[useSupplierFinancings] Error fetching:', err);
      setError(err.message);
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
      // TODO: Implementar llamada a Supabase
      // await supabase.from('financing_requests')
      //   .update({ status: 'buyer_signature_pending' })
      //   .eq('id', financingId);
      
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
      // TODO: Implementar llamada a Supabase
      // await supabase.from('financing_requests')
      //   .update({ 
      //     status: 'rejected_by_supplier',
      //     rejection_reason: reason 
      //   })
      //   .eq('id', financingId);
      
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
      // TODO: Implementar llamada a Supabase
      // await supabase.from('financing_requests')
      //   .update({ status: 'pending_sellsi_approval' })
      //   .eq('id', financingId);
      
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
      // TODO: Implementar llamada a Supabase
      // await supabase.from('financing_requests')
      //   .update({ 
      //     status: 'cancelled_by_supplier',
      //     cancellation_reason: reason 
      //   })
      //   .eq('id', financingId);
      
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
