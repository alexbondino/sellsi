// ============================================================================
// ADMIN FINANCING SERVICE - Gestión de Solicitudes de Financiamiento
// ============================================================================

import { supabase } from '../../../shared/services/supabase';

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
      buyer:users!financing_requests_buyer_id_fkey(user_id, user_nm, email),
      supplier:users!financing_requests_supplier_id_fkey(user_id, user_nm, email)
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
      buyer:users!financing_requests_buyer_id_fkey(user_id, user_nm, email),
      supplier:users!financing_requests_supplier_id_fkey(user_id, user_nm, email)
    `)
    .eq('status', 'approved_by_sellsi')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

/**
 * Obtiene todas las solicitudes de financiamiento (para vista completa)
 * @returns {Promise<Array>} Lista de todas las solicitudes
 */
export async function getAllFinancingRequests() {
  const { data, error } = await supabase
    .from(TABLE)
    .select(`
      *,
      buyer:users!financing_requests_buyer_id_fkey(user_id, user_nm, email),
      supplier:users!financing_requests_supplier_id_fkey(user_id, user_nm, email),
      admin:control_panel.control_panel_users(id, username)
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

/**
 * Aprueba una solicitud de financiamiento
 * @param {string} requestId - ID de la solicitud
 * @param {string} adminId - ID del administrador que aprueba
 * @returns {Promise<Object>} Solicitud actualizada
 */
export async function approveFinancingRequest(requestId, adminId) {
  const today = new Date().toISOString().split('T')[0];
  
  // Primero obtener la solicitud para calcular expires_at
  const { data: request, error: fetchError } = await supabase
    .from(TABLE)
    .select('term_days')
    .eq('id', requestId)
    .single();

  if (fetchError) throw fetchError;

  // Calcular fecha de expiración
  const expirationDate = new Date();
  expirationDate.setDate(expirationDate.getDate() + request.term_days);
  const expiresAt = expirationDate.toISOString().split('T')[0];

  const { data, error } = await supabase
    .from(TABLE)
    .update({
      status: 'approved_by_sellsi',
      approved_by_admin_id: adminId,
      activated_at: today,
      expires_at: expiresAt,
      updated_at: new Date().toISOString(),
    })
    .eq('id', requestId)
    .eq('status', 'pending_sellsi_approval')
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Rechaza una solicitud de financiamiento
 * @param {string} requestId - ID de la solicitud
 * @param {string} reason - Motivo del rechazo
 * @returns {Promise<Object>} Solicitud actualizada
 */
export async function rejectFinancingRequest(requestId, reason) {
  const { data, error } = await supabase
    .from(TABLE)
    .update({
      status: 'rejected_by_sellsi',
      rejection_reason: reason,
      rejected_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', requestId)
    .eq('status', 'pending_sellsi_approval')
    .select()
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
  const { data, error } = await supabase
    .from('financing_documents')
    .select('*')
    .eq('financing_id', requestId)
    .order('uploaded_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

/**
 * Descarga un documento específico
 * @param {string} storagePath - Ruta del archivo en storage
 * @returns {Promise<Blob>} Archivo descargado
 */
export async function downloadDocument(storagePath) {
  const { data, error } = await supabase.storage
    .from('financing-documents')
    .download(storagePath);

  if (error) throw error;
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
