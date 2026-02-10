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
      // 🔒 SECURITY: Obtener supplier_id del usuario autenticado
      const sessionRes = await supabase.auth.getSession();
      const userId = sessionRes?.data?.session?.user?.id;
      
      if (!userId) {
        console.warn('[useSupplierFinancings] No hay usuario autenticado');
        setFinancings([]);
        setLoading(false);
        setInitializing(false);
        fetchStartedRef.current = false;
        return;
      }

      // Obtener supplier_id asociado al user_id
      const { data: supplierData, error: supplierError } = await supabase
        .from('supplier')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (supplierError || !supplierData) {
        console.warn('[useSupplierFinancings] Usuario no tiene registro de supplier');
        setFinancings([]);
        setLoading(false);
        setInitializing(false);
        fetchStartedRef.current = false;
        return;
      }

      const supplierId = supplierData.id;

      // 🔒 CRITICAL FIX: Filtrar explícitamente por supplier_id
      // Intentar obtener datos reales desde Supabase
      // NOTA: NO hacemos JOIN a buyer porque las políticas RLS bloquean el acceso
      // En su lugar, usamos los campos legal_name, legal_rut directamente de financing_requests
      const { data, error } = await supabase
        .from('financing_requests')
        .select('id, buyer_id, supplier_id, amount, available_amount, status, due_date, term_days, created_at, updated_at, legal_name, legal_rut, buyer_legal_representative_name, buyer_legal_representative_rut, legal_address, legal_commune, legal_region, metadata, rejected_reason, cancelled_reason, signed_buyer_at, signed_supplier_at, signed_sellsi_at, paused, paused_reason')
        .eq('supplier_id', supplierId) // 🔒 FILTRO CRÍTICO
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        // IMPORTANTE: No podemos hacer JOIN a buyer ni leer tabla buyer directamente
        // porque las políticas RLS solo permiten que el dueño (user_id = auth.uid()) vea sus datos
        // Por ahora, usamos legal_name como nombre del comprador
        // TODO: Crear función RPC o ajustar políticas RLS para permitir lectura limitada
        
        // Map DB rows to UI shape (allow empty list)
        const processed = (data || []).map(f => {
          // Usar legal_name como nombre del comprador (razón social)
          // Si en el futuro queremos user_nm, necesitaríamos una función RPC
          const buyerUserName = f.legal_name || 'Comprador';
          
          // Determinar tipo de solicitud basado en metadata/documentos
          // Express: Sin documentos adicionales, solo datos básicos
          // Extended: Con documentos (powers_certificate, tax_folder, etc)
          let requestType = 'express'; // Por defecto express
          try {
            const metadata = typeof f.metadata === 'string' ? JSON.parse(f.metadata) : (f.metadata || {});
            // Si tiene metadata con documentos, es extendida
            if (metadata.has_powers_certificate || metadata.has_tax_folder || metadata.document_count > 0) {
              requestType = 'extended';
            }
          } catch (e) {
            // Mantener 'express' si falla el parse
          }
          
          return {
            id: f.id,
            buyer_user_nm: buyerUserName,
            buyer_name: buyerUserName, // Alias para tablas
            requested_by: buyerUserName, // Alias para modales
            buyer_legal_name: f.legal_name || '',
            buyer_legal_rut: f.legal_rut || null,
            buyer_legal_representative_name: f.buyer_legal_representative_name || null,
            buyer_legal_representative_rut: f.buyer_legal_representative_rut || null,
            buyer_legal_address: f.legal_address || null,
            buyer_legal_commune: f.legal_commune || null,
            buyer_legal_region: f.legal_region || null,
            amount: parseFloat(f.amount),
            term_days: f.term_days || null,
            documents: [],
            status: f.status,
            created_at: f.created_at,
            request_type: requestType,
            document_count: 0,
            buyer_id: f.buyer_id,
            supplier_id: f.supplier_id,
            rejected_reason: f.rejected_reason || null,
            cancelled_reason: f.cancelled_reason || null,
            signed_buyer_at: f.signed_buyer_at || null,
            signed_supplier_at: f.signed_supplier_at || null,
            signed_sellsi_at: f.signed_sellsi_at || null,
            paused: f.paused || false,
            paused_reason: f.paused_reason || null,
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
      fetchStartedRef.current = false; // Permitir futuros re-fetches
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
      // Actualizar status y rejected_reason en Supabase
      try {
        const updateData = { status: 'rejected_by_supplier' };
        if (reason) {
          updateData.rejected_reason = reason;
        }
        const { error } = await supabase.from('financing_requests').update(updateData).eq('id', financingId);
        if (error) throw error;
      } catch (e) {
        console.error('[useSupplierFinancings] DB update failed for reject:', e.message || e);
      }

      setFinancings(prev => 
        prev.map(f => f.id === financingId 
          ? { ...f, status: 'rejected_by_supplier', rejected_reason: reason } 
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
  const signFinancing = useCallback(async (financingId, signedFile) => {
    try {
      // Subir el archivo firmado a storage
      if (signedFile) {
        // Usar nombre FIJO para documento progresivo
        const fileName = `contrato_marco_${financingId}.pdf`;
        const filePath = `${financingId}/${fileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from('financing-documents')
          .upload(filePath, signedFile, {
            contentType: 'application/pdf',
            upsert: true // Reemplazar archivo existente
          });

        if (uploadError) {
          console.error('[useSupplierFinancings] Upload error:', uploadError);
          throw new Error('Error al subir el documento firmado');
        }

        // UPSERT registro en financing_documents
        // El trigger actualizará signed_supplier_at automáticamente
        // Y otro trigger actualizará el status basado en las firmas
        const { error: docError } = await supabase
          .from('financing_documents')
          .upsert({
            financing_id: financingId,
            financing_request_id: financingId,
            file_path: filePath,
            document_type: 'contrato_marco',
            document_name: fileName,
            storage_path: filePath,
            file_size: signedFile.size,
            mime_type: 'application/pdf',
            uploaded_by: null,
          }, {
            onConflict: 'financing_request_id,document_type',
          });

        if (docError) {
          console.error('[useSupplierFinancings] Document upsert error:', docError);
          throw new Error('Error al registrar el documento');
        }
      }

      // Pequeño delay para dar tiempo a los triggers de actualizarse
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Refrescar financings para obtener el nuevo status (calculado por trigger)
      await fetchFinancings();
      return { success: true };
    } catch (err) {
      console.error('[useSupplierFinancings] Error signing:', err);
      return { success: false, error: err.message };
    }
  }, [fetchFinancings]);

  /**
   * Cancelar solicitud de financiamiento
   */
  const cancelFinancing = useCallback(async (financingId, reason = null) => {
    try {
      try {
        const updateData = { status: 'cancelled_by_supplier' };
        if (reason) {
          updateData.cancelled_reason = reason;
        }
        const { error } = await supabase.from('financing_requests').update(updateData).eq('id', financingId);
        if (error) throw error;
      } catch (e) {
        console.error('[useSupplierFinancings] DB update failed for cancel:', e.message || e);
      }

      setFinancings(prev => 
        prev.map(f => f.id === financingId 
          ? { ...f, status: 'cancelled_by_supplier', cancelled_reason: reason } 
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
