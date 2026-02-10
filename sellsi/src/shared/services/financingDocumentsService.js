// Diagnostic log to ensure the client is loading the updated module
console.log('[financingDocumentsService] loaded');

// Use dynamic import to acquire `supabase` at runtime to avoid `require` in browser bundles
let _supabasePromise = null;
async function getSupabase() {
  if (!_supabasePromise) {
    _supabasePromise = import('../../services/supabase').then(mod => mod.supabase);
  }
  return await _supabasePromise;
}

/**
 * Get all documents for a financing request
 * @param {string} financingId - ID del financing request
 * @returns {Promise<Array>} Lista de documentos
 */
async function getFinancingDocuments(financingId) {
  if (!financingId) {
    console.warn('[financingDocumentsService] getFinancingDocuments: no financingId provided');
    return [];
  }

  const supabase = await getSupabase();
  
  const { data, error } = await supabase
    .from('financing_documents')
    .select('*')
    .eq('financing_id', financingId)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('[financingDocumentsService] Error obteniendo documentos:', error);
    throw error;
  }
  
  console.log('[financingDocumentsService] Documentos obtenidos:', data?.length || 0);
  return data || [];
}

/**
 * Download a specific document from storage
 * @param {string} storagePath - Path in financing-documents bucket
 * @returns {Promise<Blob>} Document blob
 */
async function downloadFinancingDocument(storagePath) {
  if (!storagePath) {
    throw new Error('storagePath is required');
  }

  const supabase = await getSupabase();
  
  console.log('[financingDocumentsService] Descargando documento desde:', storagePath);
  
  const { data, error } = await supabase.storage
    .from('financing-documents')
    .download(storagePath);
  
  if (error) {
    console.error('[financingDocumentsService] Error descargando documento:', error);
    throw error;
  }
  
  console.log('[financingDocumentsService] Documento descargado exitosamente');
  return data;
}

export {
  getFinancingDocuments,
  downloadFinancingDocument,
};

export default {
  getFinancingDocuments,
  downloadFinancingDocument,
};
