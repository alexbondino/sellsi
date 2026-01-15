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
          buyer_user_nm: 'Juan Pérez',
          buyer_legal_name: 'Distribuidora ABC Ltda.',
          buyer_legal_rut: '76.123.456-7',
          buyer_legal_representative_name: 'Juan Pérez González',
          buyer_legal_representative_rut: '12.345.678-9',
          buyer_legal_address: 'Av. Libertador Bernardo O\'Higgins 1234',
          buyer_legal_commune: 'Santiago',
          buyer_legal_region: 'Metropolitana de Santiago',
          amount: 15000000,
          term_days: 30,
          documents: ['contrato.pdf', 'pagare.pdf'],
          status: 'pending_supplier_review',
          created_at: new Date().toISOString(),
          request_type: 'express',
          document_count: 3,
        },
        {
          id: '2',
          buyer_user_nm: 'María González',
          buyer_legal_name: 'Comercial XYZ SpA',
          buyer_legal_rut: '77.987.654-3',
          buyer_legal_representative_name: 'María González Silva',
          buyer_legal_representative_rut: '15.678.901-2',
          buyer_legal_address: 'Av. Providencia 2500',
          buyer_legal_commune: 'Providencia',
          buyer_legal_region: 'Metropolitana de Santiago',
          amount: 8500000,
          term_days: 60,
          documents: ['contrato.pdf'],
          status: 'buyer_signature_pending',
          created_at: new Date(Date.now() - 86400000).toISOString(),
          request_type: 'express',
          document_count: 4,
        },
        {
          id: '3',
          buyer_user_nm: 'Carlos Rodríguez',
          buyer_legal_name: 'Importadora Delta',
          buyer_legal_rut: '78.555.444-K',
          buyer_legal_representative_name: 'Carlos Rodríguez Muñoz',
          buyer_legal_representative_rut: '18.234.567-8',
          buyer_legal_address: 'Calle Estado 456',
          buyer_legal_commune: 'Santiago Centro',
          buyer_legal_region: 'Metropolitana de Santiago',
          amount: 25000000,
          term_days: 90,
          documents: ['contrato.pdf', 'pagare.pdf', 'garantia.pdf'],
          status: 'supplier_signature_pending',
          created_at: new Date(Date.now() - 172800000).toISOString(),
          request_type: 'extended',
          document_count: 5,
        },
        {
          id: '4',
          buyer_user_nm: 'Andrea López',
          buyer_name: 'Andrea López',
          buyer_legal_name: 'Empresa Gamma',
          buyer_legal_rut: '79.111.222-3',
          buyer_legal_representative_name: 'Andrea López Castillo',
          buyer_legal_representative_rut: '19.876.543-2',
          buyer_legal_address: 'Av. Apoquindo 3000',
          buyer_legal_commune: 'Las Condes',
          buyer_legal_region: 'Metropolitana de Santiago',
          amount: 12000000,
          amount_used: 4500000, // Ha usado 4.5M de 12M
          term_days: 45,
          documents: ['contrato.pdf'],
          status: 'approved_by_sellsi',
          created_at: new Date(Date.now() - 259200000).toISOString(),
          approved_at: new Date(Date.now() - 172800000).toISOString(), // Aprobado hace 2 días
          request_type: 'extended',
          document_count: 6,
        },
        {
          id: '5',
          buyer_user_nm: 'Roberto Soto',
          buyer_legal_name: 'Comercio Beta',
          buyer_legal_rut: '80.333.444-5',
          buyer_legal_representative_name: 'Roberto Soto Vargas',
          buyer_legal_representative_rut: '20.123.456-7',
          buyer_legal_address: 'Calle Huérfanos 789',
          buyer_legal_commune: 'Santiago',
          buyer_legal_region: 'Metropolitana de Santiago',
          amount: 5000000,
          term_days: 30,
          documents: ['contrato.pdf'],
          status: 'rejected_by_supplier',
          rejection_reason: 'Monto excede límite de crédito disponible',
          created_at: new Date(Date.now() - 345600000).toISOString(),
          request_type: 'extended',
          document_count: 7,
        },
        {
          id: '6',
          buyer_user_nm: 'Patricia Morales',
          buyer_legal_name: 'Distribuidora Omega',
          buyer_legal_rut: '81.555.666-7',
          buyer_legal_representative_name: 'Patricia Morales Torres',
          buyer_legal_representative_rut: '21.234.567-8',
          buyer_legal_address: 'Av. Las Condes 5678',
          buyer_legal_commune: 'Las Condes',
          buyer_legal_region: 'Metropolitana de Santiago',
          amount: 18000000,
          term_days: 60,
          documents: ['contrato.pdf', 'pagare.pdf'],
          status: 'cancelled_by_buyer',
          cancellation_reason: 'Cliente decidió usar otra fuente de financiamiento',
          created_at: new Date(Date.now() - 432000000).toISOString(),
        },
        {
          id: '7',
          buyer_user_nm: 'Fernando Silva',
          buyer_legal_name: 'Comercial Sigma',
          buyer_legal_rut: '82.777.888-9',
          buyer_legal_representative_name: 'Fernando Silva Araya',
          buyer_legal_representative_rut: '22.345.678-9',
          buyer_legal_address: 'Av. Vicuña Mackenna 1234',
          buyer_legal_commune: 'Ñuñoa',
          buyer_legal_region: 'Metropolitana de Santiago',
          amount: 9500000,
          term_days: 45,
          documents: ['contrato.pdf'],
          status: 'pending_sellsi_approval',
          created_at: new Date(Date.now() - 518400000).toISOString(),
        },
        {
          id: '8',
          buyer_user_nm: 'Claudia Ramírez',
          buyer_legal_name: 'Importaciones Theta',
          buyer_legal_rut: '83.999.000-K',
          buyer_legal_representative_name: 'Claudia Ramírez Díaz',
          buyer_legal_representative_rut: '23.456.789-0',
          buyer_legal_address: 'Calle San Diego 2345',
          buyer_legal_commune: 'Santiago',
          buyer_legal_region: 'Metropolitana de Santiago',
          amount: 7200000,
          term_days: 30,
          documents: ['contrato.pdf', 'pagare.pdf'],
          status: 'cancelled_by_supplier',
          cancellation_reason: 'Cambio en las condiciones de crédito del proveedor',
          created_at: new Date(Date.now() - 604800000).toISOString(),
        },
        {
          id: '9',
          buyer_user_nm: 'Sergio Fuentes',
          buyer_legal_name: 'Distribuidora Kappa',
          buyer_legal_rut: '84.111.222-3',
          buyer_legal_representative_name: 'Sergio Fuentes Ponce',
          buyer_legal_representative_rut: '24.567.890-1',
          buyer_legal_address: 'Av. Matta 3456',
          buyer_legal_commune: 'Santiago',
          buyer_legal_region: 'Metropolitana de Santiago',
          amount: 22000000,
          term_days: 90,
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
