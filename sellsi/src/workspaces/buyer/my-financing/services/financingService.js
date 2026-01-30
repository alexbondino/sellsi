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
    const supplierCheck = await supabase.from('supplier').select('id').eq('id', supplierId).maybeSingle();
    if (!supplierCheck || !supplierCheck.data || !supplierCheck.data.id) {
      const err = {
        message: 'supplier not found',
        code: 'supplier_not_found',
        details: `supplier_id ${supplierId} does not exist`,
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
    status: 'pending_sellsi_approval',
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
 */
async function uploadFinancingDocument(financingId, file, filename) {
  if (!file) return null;
  const supabase = await getSupabase();
  const path = `${financingId}/${filename}`;
  const { error: uploadError } = await supabase.storage.from('financing-documents').upload(path, file);
  if (uploadError) throw uploadError;
  const { data: urlData } = await supabase.storage.from('financing-documents').getPublicUrl(path);
  return urlData?.publicUrl || null;
}

/**
 * Create an extended financing request and upload provided files.
 * formData may include file objects: powersCertificate, powersValidityCertificate, simplifiedTaxFolder, others
 */
async function createExtendedRequest({ formData, supplierId = null, metadata = null }) {
  const created = await createExpressRequest({ formData, supplierId, metadata });
  const financingId = created?.id;
  if (!financingId) return created;

  const uploads = [];
  if (formData.powersCertificate) {
    uploads.push(uploadFinancingDocument(financingId, formData.powersCertificate, `powers_certificate_${formData.powersCertificate.name}`));
  }
  if (formData.powersValidityCertificate) {
    uploads.push(uploadFinancingDocument(financingId, formData.powersValidityCertificate, `powers_validity_${formData.powersValidityCertificate.name}`));
  }
  if (formData.simplifiedTaxFolder) {
    uploads.push(uploadFinancingDocument(financingId, formData.simplifiedTaxFolder, `tax_folder_${formData.simplifiedTaxFolder.name}`));
  }
  if (formData.others) {
    uploads.push(uploadFinancingDocument(financingId, formData.others, `others_${formData.others.name}`));
  }

  await Promise.all(uploads);
  return created;
}

async function getAvailableFinancingsForSupplier(supplierId) {
  // Returns financings approved by Sellsi and not paused for a given supplier
  if (!supplierId) return [];
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from('financing_requests')
    .select('*')
    .eq('supplier_id', supplierId)
    .eq('status', 'approved_by_sellsi')
    .eq('paused', false);
  if (error) throw error;
  return data || [];
}

export {
  createExpressRequest,
  createExtendedRequest,
  uploadFinancingDocument,
  getAvailableFinancingsForSupplier,
};

export default {
  createExpressRequest,
  createExtendedRequest,
  uploadFinancingDocument,
  getAvailableFinancingsForSupplier,
};

// CommonJS compatibility for legacy consumers (guard to avoid ReferenceError in browser)
try {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      createExpressRequest,
      createExtendedRequest,
      uploadFinancingDocument,
      getAvailableFinancingsForSupplier,
    };
  }
} catch (e) { /* ignore */ }
