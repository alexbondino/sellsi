// Diagnostic log to ensure the client is loading the updated module
console.log('[financingService] loaded - ESM-compatible');

// Use dynamic import to acquire `supabase` at runtime to avoid `require` in browser bundles
let _supabasePromise = null;
async function getSupabase() {
  if (!_supabasePromise) {
    _supabasePromise = import('../../../../services/supabase').then((m) => m.supabase || (m.default && m.default.supabase) || m);
  }
  return _supabasePromise;
}

/**
 * Create an express financing request.
 * Expects formData fields: amount, term, businessName, rut, legalRepresentative, legalRepresentativeRut, legalAddress, legalCommune, legalRegion
 */
async function createExpressRequest({ formData, supplierId = null, metadata = null }) {
  const supabase = await getSupabase();
  const sessionRes = await supabase.auth.getSession();
  const userId = sessionRes?.data?.session?.user?.id || null;

  // Ensure we have a buyer.id for the authenticated user (try SELECT first, then RPC to create)
  let buyerId = null;
  if (userId) {
    // Try to find existing buyer linked to this user
    const buyerRes = await supabase.from('buyer').select('id').eq('user_id', userId).maybeSingle();
    if (buyerRes && buyerRes.data && buyerRes.data.id) {
      buyerId = buyerRes.data.id;
    } else {
      // Fallback to idempotent RPC that ensures buyer exists and returns its id
      try {
        const rpcRes = await supabase.rpc('ensure_buyer_for_user', { p_user_id: userId });
        if (rpcRes && rpcRes.data) buyerId = rpcRes.data;
        if (buyerId && typeof buyerId === 'object' && buyerId.id) buyerId = buyerId.id;
      } catch (e) {
        // Non-fatal: keep buyerId null and let downstream code handle policy errors
        console.warn('[financingService] ensure_buyer_for_user rpc failed', e);
      }
    }
  }

  // Validate supplier existence to avoid FK 23503 (provide clear error to caller)
  if (supplierId) {
    try {
      const supplierCheck = await supabase.rpc('get_supplier_public_info', { p_supplier_id: supplierId });
      if (!supplierCheck || !supplierCheck.data || supplierCheck.data.length === 0) {
        const err = {
          message: 'supplier not found',
          code: 'supplier_not_found',
          details: `supplier_id ${supplierId} does not exist`,
        };
        throw err;
      }
    } catch (rpcError) {
      // Si el RPC lanza exception (ej: UUID inválido), tratarlo como supplier not found
      const err = {
        message: 'supplier not found',
        code: 'supplier_not_found',
        details: `supplier_id ${supplierId} is invalid or does not exist`,
      };
      throw err;
    }
  }

  const payload = {
    buyer_id: buyerId,
    supplier_id: supplierId,
    amount: Number(formData.amount || 0),
    term_days: Number(formData.term || 0),
    legal_name: formData.businessName || null,
    legal_rut: formData.rut || null,
    buyer_legal_representative_rut: formData.legalRepresentativeRut || null,
    buyer_legal_representative_name: formData.legalRepresentative || null,
    legal_address: formData.legalAddress || null,
    legal_commune: formData.legalCommune || null,
    legal_region: formData.legalRegion || null,
    status: 'pending_supplier_review',
    // Also keep representative data inside metadata as a fallback for environments where columns are missing
    metadata: JSON.stringify({
      ...(metadata || {}),
      buyer_legal_representative_name: formData.legalRepresentative || null,
      buyer_legal_representative_rut: formData.legalRepresentativeRut || null,
    }),
  };

  const { data, error } = await supabase.from('financing_requests').insert([payload]).select().single();
  if (error) throw error;
  return data;
}
/**
 * Upload a document to the financing-documents bucket under {financingId}/{filename}
 * and create a record in financing_documents table
 * @param {string} financingId - ID del financing request
 * @param {File} file - Archivo a subir
 * @param {string} filename - Nombre del archivo en storage
 * @param {string} documentType - Tipo de documento (debe ser único por financing_request_id)
 */
async function uploadFinancingDocument(financingId, file, filename, documentType) {
  if (!file) return null;
  
  const supabase = await getSupabase();
  const path = `${financingId}/${filename}`;
  
  console.log('[uploadFinancingDocument] Subiendo:', { path, documentType });
  
  // 1. Obtener auth.uid() para uploaded_by
  const sessionRes = await supabase.auth.getSession();
  const userId = sessionRes?.data?.session?.user?.id || null;
  
  // 2. Subir al bucket
  const { error: uploadError } = await supabase.storage
    .from('financing-documents')
    .upload(path, file, {
      upsert: true
    });
  
  if (uploadError) {
    console.error('[uploadFinancingDocument] Error subiendo archivo:', uploadError);
    throw uploadError;
  }
  
  console.log('[uploadFinancingDocument] ✅ Archivo subido a bucket');
  
  // 3. Crear registro en financing_documents
  const { error: dbError } = await supabase
    .from('financing_documents')
    .insert({
      financing_id: financingId,
      financing_request_id: financingId,
      document_type: documentType,
      document_name: filename,
      storage_path: path,
      file_path: path,
      file_size: file.size,
      mime_type: file.type || 'application/pdf',
      uploaded_by: userId
    });
  
  if (dbError) {
    console.error('[uploadFinancingDocument] ❌ Error registrando en BD:', dbError);
    throw dbError; // Lanzar error para que el usuario sepa que falló
  }
  
  console.log('[uploadFinancingDocument] ✅ Documento registrado en BD');
  
  // 4. Obtener URL pública (opcional)
  const { data: urlData } = await supabase.storage
    .from('financing-documents')
    .getPublicUrl(path);
  
  return urlData?.publicUrl || null;
}

/**
 * Create an extended financing request and upload provided files.
 * formData may include file objects: powersCertificate, powersValidityCertificate, simplifiedTaxFolder, others (array)
 */
async function createExtendedRequest({ formData, supplierId = null, metadata = null }) {
  // Construir metadata con flags de documentos para detectar tipo "extended"
  const othersCount = Array.isArray(formData.others) ? formData.others.length : 0;
  const extendedMetadata = {
    ...(metadata || {}),
    has_powers_certificate: !!formData.powersCertificate,
    has_powers_validity: !!formData.powersValidityCertificate,
    has_tax_folder: !!formData.simplifiedTaxFolder,
    has_others: othersCount > 0,
    others_count: othersCount,
    document_count: [
      formData.powersCertificate,
      formData.powersValidityCertificate,
      formData.simplifiedTaxFolder,
    ].filter(Boolean).length + othersCount,
  };
  
  const created = await createExpressRequest({ formData, supplierId, metadata: extendedMetadata });
  const financingId = created?.id;
  if (!financingId) return created;

  // Subir cada documento con document_type único (cumple constraint UNIQUE)
  const uploads = [];
  if (formData.powersCertificate) {
    uploads.push(
      uploadFinancingDocument(
        financingId,
        formData.powersCertificate,
        `powers_certificate_${formData.powersCertificate.name}`,
        'garantia_poderes_certificado'
      )
    );
  }
  if (formData.powersValidityCertificate) {
    uploads.push(
      uploadFinancingDocument(
        financingId,
        formData.powersValidityCertificate,
        `powers_validity_${formData.powersValidityCertificate.name}`,
        'garantia_poderes_vigencia'
      )
    );
  }
  if (formData.simplifiedTaxFolder) {
    uploads.push(
      uploadFinancingDocument(
        financingId,
        formData.simplifiedTaxFolder,
        `tax_folder_${formData.simplifiedTaxFolder.name}`,
        'garantia_carpeta_tributaria'
      )
    );
  }
  
  // Subir array de "otros documentos" (hasta 3)
  if (Array.isArray(formData.others) && formData.others.length > 0) {
    formData.others.forEach((otherFile, index) => {
      if (otherFile) {
        uploads.push(
          uploadFinancingDocument(
            financingId,
            otherFile,
            `others_${index + 1}_${otherFile.name}`,
            `garantia_otros_${index + 1}` // garantia_otros_1, garantia_otros_2, garantia_otros_3
          )
        );
      }
    });
  }

  await Promise.all(uploads);
  return created;
}

async function getAvailableFinancingsForSupplier(supplierId) {
  // Returns financings approved by Sellsi and not paused for a given supplier
  // NOTA: supplierId puede ser users.user_id O supplier.id (por compatibilidad)
  // Intentamos primero como supplier.id, si no encuentra, buscamos como users.user_id
  if (!supplierId) return [];
  const supabase = await getSupabase();
  
  // Intentar primero como supplier.id (FK directo)
  let { data, error } = await supabase
    .from('financing_requests')
    .select('*')
    .eq('supplier_id', supplierId)
    .eq('status', 'approved_by_sellsi')
    .eq('paused', false);
  
  // Si no encontró resultados, intentar como users.user_id
  if ((!data || data.length === 0) && !error) {
    try {
      // Obtener supplier.id desde users.user_id usando RPC pública
      const { data: supplierData, error: supplierError } = await supabase
        .rpc('get_supplier_public_info', { p_user_id: supplierId });
      
      const supplierRecord = supplierData && supplierData.length > 0 ? supplierData[0] : null;
      
      if (!supplierError && supplierRecord) {
        // Reintentar con el supplier.id real
        const retry = await supabase
          .from('financing_requests')
          .select('*')
          .eq('supplier_id', supplierRecord.id)
          .eq('status', 'approved_by_sellsi')
          .eq('paused', false);
        
        data = retry.data;
        error = retry.error;
      }
    } catch (rpcError) {
      // Si el RPC lanza exception, ignorar y retornar data actual (probablemente vacío)
      console.warn('[financingService] get_supplier_public_info RPC error:', rpcError);
    }
  }
  
  if (error) throw error;
  return data || [];
}

/**
 * Get the last financing configuration from the most recent financing request
 * Used to pre-fill forms when "autoFillModal" checkbox is enabled
 */
async function getLastFinancingConfig() {
  const supabase = await getSupabase();
  const sessionRes = await supabase.auth.getSession();
  const userId = sessionRes?.data?.session?.user?.id || null;

  if (!userId) {
    return null;
  }

  // Get buyer_id for current user
  const buyerRes = await supabase.from('buyer').select('id').eq('user_id', userId).maybeSingle();
  const buyerId = buyerRes?.data?.id;

  if (!buyerId) {
    return null;
  }

  // Get most recent financing request with all legal/personal data
  const { data, error } = await supabase
    .from('financing_requests')
    .select(`
      legal_name,
      legal_rut,
      buyer_legal_representative_name,
      buyer_legal_representative_rut,
      legal_address,
      legal_commune,
      legal_region,
      term_days
    `)
    .eq('buyer_id', buyerId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.warn('[financingService] Error fetching last config:', error);
    return null;
  }

  if (!data) {
    return null;
  }

  // Map database fields to form fields
  return {
    businessName: data.legal_name || '',
    rut: data.legal_rut || '',
    legalRepresentative: data.buyer_legal_representative_name || '',
    legalRepresentativeRut: data.buyer_legal_representative_rut || '',
    legalAddress: data.legal_address || '',
    legalCommune: data.legal_commune || '',
    legalRegion: data.legal_region || '',
    term: data.term_days ? String(data.term_days) : '',
  };
}

/**
 * Get all documents for a financing request
 * @param {string} financingId - ID del financing request
 * @returns {Promise<Array>} Lista de documentos
 */
async function getFinancingDocuments(financingId) {
  if (!financingId) {
    console.warn('[financingService] getFinancingDocuments: no financingId provided');
    return [];
  }

  const supabase = await getSupabase();
  
  const { data, error } = await supabase
    .from('financing_documents')
    .select('*')
    .eq('financing_id', financingId)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('[financingService] Error obteniendo documentos:', error);
    throw error;
  }
  
  console.log('[financingService] Documentos obtenidos:', data?.length || 0);
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
  
  console.log('[financingService] Descargando documento desde:', storagePath);
  
  const { data, error } = await supabase.storage
    .from('financing-documents')
    .download(storagePath);
  
  if (error) {
    console.error('[financingService] Error descargando documento:', error);
    throw error;
  }
  
  console.log('[financingService] Documento descargado exitosamente');
  return data;
}

export {
  createExpressRequest,
  createExtendedRequest,
  uploadFinancingDocument,
  getAvailableFinancingsForSupplier,
  getLastFinancingConfig,
  getFinancingDocuments,
  downloadFinancingDocument,
};

export default {
  createExpressRequest,
  createExtendedRequest,
  uploadFinancingDocument,
  getAvailableFinancingsForSupplier,
  getLastFinancingConfig,
  getFinancingDocuments,
  downloadFinancingDocument,
};

// CommonJS compatibility for legacy consumers (guard to avoid ReferenceError in browser)
try {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      createExpressRequest,
      createExtendedRequest,
      uploadFinancingDocument,
      getAvailableFinancingsForSupplier,
      getLastFinancingConfig,
      getFinancingDocuments,
      downloadFinancingDocument,
    };
  }
} catch (e) { /* ignore */ }
