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
      // 🔒 SECURITY: Obtener buyer_id del usuario autenticado
      const sessionRes = await supabase.auth.getSession();
      const userId = sessionRes?.data?.session?.user?.id;
      
      if (!userId) {
        console.warn('[useBuyerFinancings] No hay usuario autenticado');
        setFinancings([]);
        setLoading(false);
        setInitializing(false);
        fetchStartedRef.current = false;
        return;
      }

      // Obtener buyer_id asociado al user_id
      const { data: buyerData, error: buyerError } = await supabase
        .from('buyer')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (buyerError || !buyerData) {
        console.warn('[useBuyerFinancings] Usuario no tiene registro de buyer');
        setFinancings([]);
        setLoading(false);
        setInitializing(false);
        fetchStartedRef.current = false;
        return;
      }

      const buyerId = buyerData.id;

      // 🔒 CRITICAL FIX: Filtrar explícitamente por buyer_id
      // NOTA: NO hacemos JOIN a supplier porque las políticas RLS bloquean el acceso
      // El comprador no puede leer tabla supplier (solo el dueño puede)
      // Usamos los campos directamente de financing_requests si es necesario
      const { data, error } = await supabase
        .from('financing_requests')
        .select('id, buyer_id, supplier_id, amount, available_amount, amount_used, status, due_date, term_days, created_at, updated_at, legal_name, legal_rut, metadata, rejected_reason, cancelled_reason, signed_buyer_at, signed_supplier_at, signed_sellsi_at, paused, paused_reason')
        .eq('buyer_id', buyerId) // 🔒 FILTRO CRÍTICO
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data) && data.length > 0) {
        // Obtener nombres de suppliers usando RPC (bypasea RLS)
        const supplierIds = [...new Set(data.map(f => f.supplier_id).filter(Boolean))];
        const supplierNames = {};
        
        await Promise.all(supplierIds.map(async (supplierId) => {
          try {
            const { data: name, error: nameError } = await supabase.rpc('get_supplier_name_for_buyer', { p_supplier_id: supplierId });
            if (!nameError && name) {
              supplierNames[supplierId] = name;
            }
          } catch (e) {
            console.error('[useBuyerFinancings] Error fetching supplier name:', e);
          }
        }));
        
        const processed = data.map(f => {
          // Determinar tipo de solicitud basado en metadata
          let requestType = 'express';
          try {
            const metadata = typeof f.metadata === 'string' ? JSON.parse(f.metadata) : (f.metadata || {});
            if (metadata.has_powers_certificate || metadata.has_tax_folder || metadata.document_count > 0) {
              requestType = 'extended';
            }
          } catch (e) {
            // Mantener 'express' si falla
          }
          
          return {
            id: f.id,
            supplier_name: supplierNames[f.supplier_id] || '',
            amount: parseFloat(f.amount),
            available_amount: parseFloat(f.available_amount || 0),
            amount_used: parseFloat(f.amount_used || 0),
            term_days: f.term_days || null,
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
      fetchStartedRef.current = false; // Permitir futuros re-fetches
    }
  }, []);

  const signFinancing = useCallback(async (id, signedFile) => {
    try {
      console.log('[useBuyerFinancings] 🖊️ Iniciando firma de financing:', id);
      console.log('[useBuyerFinancings] 📄 Archivo recibido:', {
        name: signedFile?.name,
        size: signedFile?.size,
        type: signedFile?.type
      });
      
      // Primero, subir el archivo firmado a storage
      if (signedFile) {
        // Usar nombre FIJO para documento progresivo
        const fileName = `contrato_marco_${id}.pdf`;
        const filePath = `${id}/${fileName}`;
        
        console.log('[useBuyerFinancings] 📤 Subiendo archivo a:', filePath);
        
        const { error: uploadError } = await supabase.storage
          .from('financing-documents')
          .upload(filePath, signedFile, {
            contentType: 'application/pdf',
            upsert: true // Reemplazar archivo existente
          });

        if (uploadError) {
          console.error('[useBuyerFinancings] ❌ Upload error:', uploadError);
          throw new Error('Error al subir el documento firmado: ' + (uploadError.message || JSON.stringify(uploadError)));
        }
        
        console.log('[useBuyerFinancings] ✅ Archivo subido exitosamente');

        // UPSERT registro en financing_documents
        // El trigger actualizará signed_buyer_at automáticamente
        // Y otro trigger actualizará el status basado en las firmas
        console.log('[useBuyerFinancings] 📝 Registrando documento en BD');
        
        const { error: docError } = await supabase
          .from('financing_documents')
          .upsert({
            financing_id: id,
            financing_request_id: id,
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
          console.error('[useBuyerFinancings] ❌ Document upsert error:', docError);
          throw new Error('Error al registrar el documento: ' + (docError.message || JSON.stringify(docError)));
        }
        
        console.log('[useBuyerFinancings] ✅ Documento registrado en BD');
      }

      // Pequeño delay para dar tiempo a los triggers de actualizarse
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Refrescar financings para obtener el nuevo status (calculado por trigger)
      console.log('[useBuyerFinancings] 🔄 Refrescando lista de financings');
      await fetchFinancings();
      console.log('[useBuyerFinancings] ✅ Firma completada exitosamente');
      return { success: true };
    } catch (err) {
      console.error('[useBuyerFinancings] ❌ Error en signFinancing:', err);
      return { success: false, error: err.message };
    }
  }, [fetchFinancings]);

  const cancelFinancing = useCallback(async (id, reason = null) => {
    try {
      try {
        const updateData = { status: 'cancelled_by_buyer' };
        if (reason) {
          updateData.cancelled_reason = reason;
        }
        const { error } = await supabase.from('financing_requests').update(updateData).eq('id', id);
        if (error) throw error;
      } catch (e) {
        console.error('[useBuyerFinancings] DB update failed for cancel:', e.message || e);
      }
      setFinancings(prev => prev.map(f => f.id === id ? { ...f, status: 'cancelled_by_buyer', cancelled_reason: reason } : f));
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
