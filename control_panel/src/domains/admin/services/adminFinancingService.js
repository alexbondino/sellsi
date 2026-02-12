// ============================================================================
// ADMIN FINANCING SERVICE - Gestión de Solicitudes de Financiamiento
// ============================================================================

import { supabase, supabaseAdmin } from '../../../services/supabase';
import { AdminApiService, AUDIT_ACTIONS } from './adminApiService'

const TABLE = 'financing_requests';

/**
 * Obtiene todas las solicitudes de financiamiento pendientes de aprobación por Sellsi
 * @returns {Promise<Array>} Lista de solicitudes con información de buyer y supplier
 */
export async function getPendingFinancingRequests() {
  const { data, error } = await supabase
    .from(TABLE)
    .select(`
      *,
      buyer:buyer!financing_requests_buyer_id_fkey(id, user_id, name, email),
      supplier:supplier!financing_requests_supplier_id_fkey(id, user_id, name, legal_rut)
    `)
    .eq('status', 'pending_sellsi_approval')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

/**
 * Obtiene todas las solicitudes de financiamiento aprobadas
 * @returns {Promise<Array>} Lista de solicitudes aprobadas
 */
export async function getApprovedFinancingRequests() {
  const { data, error } = await supabase
    .from(TABLE)
    .select(`
      *,
      buyer:buyer!financing_requests_buyer_id_fkey(id, user_id, name, email),
      supplier:supplier!financing_requests_supplier_id_fkey(id, user_id, name, legal_rut)
    `)
    .in('status', ['approved', 'approved_by_sellsi'])  // ✅ FIX: Aceptar ambos por inconsistencia trigger vs código
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

/**
 * Obtiene todas las solicitudes de financiamiento (para vista completa)
 * @returns {Promise<Array>} Lista de todas las solicitudes
 */
export async function getAllFinancingRequests() {
  // Usar RPC que bypasea RLS con SECURITY DEFINER
  const { data, error } = await supabase.rpc('admin_get_all_financing_requests');

  console.log('[adminFinancingService] getAllFinancingRequests - error:', error);
  console.log('[adminFinancingService] getAllFinancingRequests - data length:', data?.length ?? 0);
  if (data && data.length > 0) {
    console.log('[adminFinancingService] First item:', data[0]);
  }

  if (error) throw error;
  
  // Transformar datos para formato esperado (buyer/supplier como objetos nested)
  const transformed = (data || []).map(item => ({
    ...item,
    buyer: item.buyer_user_id ? {
      id: item.buyer_id,
      user_id: item.buyer_user_id,
      name: item.buyer_name,
      email: item.buyer_email
    } : null,
    supplier: item.supplier_user_id ? {
      id: item.supplier_id,
      user_id: item.supplier_user_id,
      name: item.supplier_name,
      legal_rut: item.supplier_legal_rut
    } : null
  }));
  
  return transformed;
}

/**
 * Aprueba una solicitud de financiamiento
 * @param {string} requestId - ID de la solicitud
 * @param {string} adminId - ID del administrador que aprueba
 * @returns {Promise<Object>} Solicitud actualizada
 */
export async function approveFinancingRequest(requestId, adminId) {
  console.log('[approveFinancingRequest] Starting approval...');
  console.log('[approveFinancingRequest] requestId:', requestId);
  console.log('[approveFinancingRequest] adminId:', adminId);
  
  const { data, error } = await supabase.rpc('admin_approve_financing_request', {
    p_financing_id: requestId,
    p_admin_id: adminId
  });

  console.log('[approveFinancingRequest] RPC result:', { data, error });
  
  if (error) {
    console.error('[approveFinancingRequest] RPC error:', error);
    throw error;
  }
  
  console.log('[approveFinancingRequest] Approval completed successfully');
  return data;
}

/**
 * Pausar un financiamiento
 * ✅ FIX: Usar RPC admin_pause_financing en lugar de UPDATE directo (evita RLS)
 */
export async function pauseFinancing(requestId, adminId, reason = null) {
  const { data, error } = await supabase
    .rpc('admin_pause_financing', { 
      p_financing_id: requestId, 
      p_reason: reason,
      p_admin_id: adminId
    });

  if (error) throw error;
  
  // La función devuelve jsonb con success/error
  if (data && !data.success) {
    throw new Error(data.error || 'No se pudo pausar el financiamiento');
  }
  
  return data;
}

/**
 * Reanudar un financiamiento pausado
 * ✅ FIX: Usar RPC admin_unpause_financing en lugar de UPDATE directo (evita RLS)
 */
export async function unpauseFinancing(requestId, adminId, reason = null) {
  const { data, error } = await supabase
    .rpc('admin_unpause_financing', { 
      p_financing_id: requestId,
      p_admin_id: adminId
    });

  if (error) throw error;
  
  // La función devuelve jsonb con success/error
  if (data && !data.success) {
    throw new Error(data.error || 'No se pudo reanudar el financiamiento');
  }
  
  return data;
}

/**
 * Rechaza una solicitud de financiamiento
 * @param {string} requestId - ID de la solicitud
 * @param {string} reason - Motivo del rechazo
 * @returns {Promise<Object>} Solicitud actualizada
 */
export async function rejectFinancingRequest(requestId, reason) {
  // Usar RPC con SECURITY DEFINER para bypassear RLS
  const { data, error } = await supabase
    .rpc('admin_reject_financing_request', {
      p_financing_id: requestId,
      p_reject_reason: reason
    })
    .single();

  if (error) throw error;
  return data;
}

/**
 * Descarga documentos de una solicitud de financiamiento
 * @param {string} requestId - ID de la solicitud
 * @returns {Promise<Array>} Lista de documentos
 */
export async function getFinancingDocuments(requestId) {
  console.log('[adminFinancingService] getFinancingDocuments - requestId:', requestId);
  
  // Usar RPC que bypasea RLS con SECURITY DEFINER
  const { data, error } = await supabase.rpc('admin_get_financing_documents', {
    p_financing_id: requestId
  });

  console.log('[adminFinancingService] getFinancingDocuments - error:', error);
  console.log('[adminFinancingService] getFinancingDocuments - data:', data);

  if (error) throw error;
  return data ?? [];
}

/**
 * Descarga un documento específico
 * @param {string} storagePath - Ruta del archivo en storage
 * @returns {Promise<Blob>} Archivo descargado
 */
export async function downloadDocument(storagePath) {
  console.log('[adminFinancingService] downloadDocument - storagePath:', storagePath);
  console.log('[adminFinancingService] downloadDocument - using supabaseAdmin:', !!supabaseAdmin);
  
  // Test: listar buckets primero para verificar acceso
  const { data: buckets, error: bucketsError } = await supabaseAdmin.storage.listBuckets();
  console.log('[adminFinancingService] downloadDocument - TEST listBuckets error:', bucketsError);
  console.log('[adminFinancingService] downloadDocument - TEST listBuckets data:', buckets);
  
  // Usar .download() directo con service_role - bypasea RLS completamente
  const { data: blob, error } = await supabaseAdmin.storage
    .from('financing-documents')
    .download(storagePath);
  
  console.log('[adminFinancingService] downloadDocument - error:', error);
  console.log('[adminFinancingService] downloadDocument - blob:', blob);
  
  if (error) {
    console.error('[adminFinancingService] downloadDocument - error.message:', error.message);
    console.error('[adminFinancingService] downloadDocument - error.statusCode:', error.statusCode);
    throw new Error(`Error descargando archivo: ${error.message}`);
  }
  
  if (!blob) {
    throw new Error('No se recibió el archivo');
  }
  
  console.log('[adminFinancingService] downloadDocument - blob size:', blob.size);
  
  return blob;
}

/**
 * Upload a financing document (used by admin approve flow)
 */
export async function uploadFinancingDocument(requestId, file) {
  console.log('[uploadFinancingDocument] Starting upload...');
  console.log('[uploadFinancingDocument] requestId:', requestId);
  console.log('[uploadFinancingDocument] file:', file);
  console.log('[uploadFinancingDocument] file.name:', file.name);
  console.log('[uploadFinancingDocument] file.size:', file.size);
  console.log('[uploadFinancingDocument] file.type:', file.type);
  
  if (!file) throw new Error('No file provided');

  const filePath = `${requestId}/${file.name}`;
  console.log('[uploadFinancingDocument] filePath:', filePath);
  console.log('[uploadFinancingDocument] Using supabaseAdmin for Storage upload...');
  
  const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
    .from('financing-documents')
    .upload(filePath, file, {
      contentType: file.type || 'application/pdf',
      upsert: true
    });

  console.log('[uploadFinancingDocument] Storage upload result:', { uploadData, uploadError });
  if (uploadError) {
    console.error('[uploadFinancingDocument] Storage upload error:', uploadError);
    throw uploadError;
  }

  console.log('[uploadFinancingDocument] Inserting record into financing_documents table using RPC...');
  const { data, error } = await supabase.rpc('admin_insert_financing_document', {
    p_financing_id: requestId,
    p_file_path: filePath,
    p_document_type: 'contrato_marco',
    p_document_name: file.name,
    p_storage_path: filePath,
    p_file_size: file.size,
    p_mime_type: file.type || 'application/pdf'
  });

  console.log('[uploadFinancingDocument] RPC insert result:', { data, error });
  if (error) {
    console.error('[uploadFinancingDocument] RPC insert error:', error);
    throw error;
  }
  
  console.log('[uploadFinancingDocument] Upload completed successfully');
  return data;
}

/**
 * Obtiene la URL pública de un documento
 * @param {string} storagePath - Ruta del archivo en storage
 * @returns {string} URL pública del documento
 */
export function getDocumentUrl(storagePath) {
  const { data } = supabase.storage
    .from('financing-documents')
    .getPublicUrl(storagePath);

  return data?.publicUrl ?? null;
}

/**
 * Obtiene transacciones (consumo, pago, reposición) de un financiamiento
 * ✅ FIX: Incluir JOIN con supplier_orders para información de orden
 * ✅ FIX2: Evitar JOIN a users (RLS bloquea acceso desde control panel anon)
 * ✅ FIX3: Solo traer campos reales de supplier_orders (NO tiene order_number)
 */
export async function getFinancingTransactions(requestId) {
  const { data, error } = await supabase.rpc('admin_get_financing_transactions', {
    p_financing_id: requestId
  });

  if (error) throw error;

  return (data ?? []).map((item) => ({
    ...item,
    order: item.supplier_order_id
      ? {
          id: item.supplier_order_id,
          total: item.order_total,
          created_at: item.order_created_at,
          parent_order_id: item.order_parent_order_id,
          status: item.order_status
        }
      : null
  }));
}

/**
 * Reposición manual (admin)
 */
export async function restoreFinancingAmount(requestId, amount, adminId, reason) {
  const { data, error } = await supabase
    .rpc('admin_restore_financing_amount', { p_financing_id: requestId, p_amount: amount, p_reason: reason, p_admin_id: adminId });

  if (error) throw error;

  // Registrar auditoría de la reposición (no bloquear la operación si falla la auditoría)
  try {
    await AdminApiService.logAuditAction(adminId, AUDIT_ACTIONS.FINANCING_RESTORE, requestId, { amount, reason });
  } catch (err) {
    console.warn('Error registrando auditoría de reposición:', err);
  }

  return data;
}

/**
 * Procesar devolución (admin)
 */
export async function processRefund(requestId, amount, adminId) {
  const { data, error } = await supabase
    .rpc('admin_process_refund', { p_financing_id: requestId, p_amount: amount, p_admin_id: adminId });

  if (error) throw error;

  // Registrar auditoría (solo monto, no paymentReference/adminNote)
  try {
    await AdminApiService.logAuditAction(adminId, AUDIT_ACTIONS.FINANCING_REFUND, requestId, { amount });
  } catch (err) {
    console.warn('Error registrando auditoría de devolución:', err);
  }

  return data;
}

/**
 * Generar contrato (invoca edge function y descarga el PDF)
 */
export async function generateFinancingContract(requestId) {
  try {
    console.log('[adminFinancingService] generateFinancingContract - requestId:', requestId);
    
    const res = await supabase.functions.invoke('generate-financing-contract', {
      body: { financing_id: requestId }
    });
    
    console.log('[adminFinancingService] generateFinancingContract - response:', res);
    
    if (res.error) {
      console.error('[adminFinancingService] generateFinancingContract - error:', res.error);
      throw res.error;
    }
    
    // La edge function retorna {success: true, path: "...", pdf_base64: "...", filename: "..."}
    const { success, path, pdf_base64, filename } = res.data || {};
    
    if (!success) {
      console.error('[adminFinancingService] generateFinancingContract - invalid response:', res.data);
      throw new Error('La edge function no retornó success');
    }
    
    console.log('[adminFinancingService] generateFinancingContract - converting base64 to blob');
    
    // Convertir base64 a blob
    const binaryString = atob(pdf_base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: 'application/pdf' });
    
    console.log('[adminFinancingService] generateFinancingContract - blob created, size:', blob.size);
    
    // Descargar automáticamente
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `contrato_marco_${requestId}.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
    return { success: true, blob, path };
  } catch (err) {
    console.error('[adminFinancingService] generateFinancingContract - catch error:', err);
    throw err;
  }
}

/**
 * Obtiene estadísticas de financiamientos
 * @returns {Promise<Object>} Estadísticas
 */
export async function getFinancingStats() {
  const { data, error } = await supabase
    .rpc('get_financing_stats');

  if (error) {
    console.error('Error getting financing stats:', error);
    return {
      total: 0,
      pending: 0,
      approved: 0,
      rejected: 0,
      expired: 0,
    };
  }

  return data;
}
