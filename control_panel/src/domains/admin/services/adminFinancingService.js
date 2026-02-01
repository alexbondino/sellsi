// ============================================================================
// ADMIN FINANCING SERVICE - Gestión de Solicitudes de Financiamiento
// ============================================================================

import { supabase } from '../../../shared/services/supabase';
import { AdminApiService, AUDIT_ACTIONS } from './adminApiService'

const TABLE = 'financing_requests';

// Development-only mocks (quick, local in-memory data for Control Panel preview)
const IS_DEV = import.meta.env.DEV;

const MOCK_REQUESTS = [
  {
    id: 'ftx-1',
    created_at: '2026-01-12T10:00:00Z',
    buyer_user_nm: 'Empresa Uno',
    buyer_legal_name: 'Empresa Uno SpA',
    buyer_legal_rut: '76.123.456-7',
    buyer: { user_nm: 'Empresa Uno', email: 'contacto@empresauno.cl' },
    supplier_user_nm: 'Proveedor A',
    supplier: { user_nm: 'Proveedor A', email: 'ventas@proveedora.cl' },
    amount: 500000,
    amount_used: 0,
    amount_paid: 0,
    amount_refunded: 0,
    term_days: 30,
    request_type: 'express',
    status: 'pending_sellsi_approval',
    document_count: 2,
    notes: null,
  },
  {
    id: 'ftx-2',
    created_at: '2026-01-09T12:00:00Z',
    buyer_user_nm: 'Comercial Dos',
    buyer_legal_name: 'Comercial Dos Ltda',
    buyer_legal_rut: '77.987.654-3',
    buyer: { user_nm: 'Comercial Dos', email: 'hola@comercialdos.cl' },
    supplier_user_nm: 'Proveedor B',
    supplier: { user_nm: 'Proveedor B', email: 'ventas@proveedorb.cl' },
    amount: 3000000,
    amount_used: 100000,
    amount_paid: 0,
    amount_refunded: 0,
    term_days: 45,
    request_type: 'express',
    status: 'approved_by_sellsi',
    approved_at: '2026-01-10T12:00:00Z',
    expires_at: '2026-02-24',
    document_count: 3,
    payment_status: 'pending',
  },
  // Dev helper: financiamiento con saldo a favor (reembolso pendiente)
  {
    id: 'ftx-refund-1',
    created_at: '2026-01-18T10:00:00Z',
    buyer_user_nm: 'Empresa Refund',
    buyer_legal_name: 'Empresa Refund SpA',
    buyer_legal_rut: '76.222.333-4',
    buyer: { user_nm: 'Empresa Refund', email: 'refund@empresa.cl' },
    supplier_user_nm: 'Proveedor Refund',
    supplier: { user_nm: 'Proveedor Refund', email: 'ventas@proveedorrefund.cl' },
    amount: 200000,
    amount_used: 0,
    amount_paid: 50000,
    amount_refunded: 0,
    term_days: 30,
    request_type: 'express',
    status: 'approved_by_sellsi',
    approved_at: '2026-01-18T10:05:00Z',
    document_count: 1,
    payment_status: 'paid',
  },
  {
    id: 'ftx-3',
    created_at: '2025-12-01T09:00:00Z',
    buyer_user_nm: 'Cliente Tres',
    buyer_legal_name: 'Cliente Tres S.A.',
    buyer_legal_rut: '78.555.444-K',
    buyer: { user_nm: 'Cliente Tres', email: 'info@clientetres.cl' },
    supplier_user_nm: 'Proveedor C',
    supplier: { user_nm: 'Proveedor C', email: 'ventas@proveedorc.cl' },
    amount: 800000,
    amount_used: 800000,
    // amount_paid increased to create a refund pending for expired case
    amount_paid: 900000,
    amount_refunded: 0,
    term_days: 7,
    request_type: 'extended',
    status: 'expired',
    document_count: 1,
    payment_status: 'paid',
  },

  {
    id: 'ftx-4',
    created_at: '2026-01-05T08:00:00Z',
    buyer: { user_nm: 'Startup Cuatro', email: 'ceo@startupcuatro.cl' },
    supplier: { user_nm: 'Proveedor D', email: 'contacto@proveedord.cl' },
    amount: 1200000,
    amount_used: 200000,
    amount_paid: 0,
    amount_refunded: 0,
    term_days: 15,
    request_type: 'extended',
    status: 'buyer_signature_pending',
    document_count: 0,
  },
  {
    id: 'ftx-5',
    created_at: '2026-01-02T11:00:00Z',
    buyer: { user_nm: 'Comercial Cinco', email: 'hola@comercialcinco.cl' },
    supplier: { user_nm: 'Proveedor E', email: 'ventas@proveedore.cl' },
    amount: 2500000,
    amount_used: 0,
    amount_paid: 0,
    amount_refunded: 0,
    term_days: 30,
    request_type: 'express',
    status: 'pending_sellsi_approval',
    document_count: 1,
  },
  // Extra mocks for debugging UI fields
  {
    id: 'ftx-6',
    created_at: '2026-01-15T09:30:00Z',
    buyer_user_nm: 'Empresa Seis',
    buyer: { user_nm: 'Empresa Seis', email: 'seis@empresa.cl' },
    supplier_user_nm: 'Proveedor Z',
    supplier: { user_nm: 'Proveedor Z', email: 'z@proveedorz.cl' },
    amount: 4200000,
    amount_used: 500000,
    amount_paid: 200000,
    amount_refunded: 0,
    term_days: 60,
    request_type: 'extended',
    status: 'pending_sellsi_approval',
    document_count: 2,
  },
  {
    id: 'ftx-7',
    created_at: '2025-12-20T14:20:00Z',
    buyer_user_nm: 'Empresa Siete',
    buyer: { user_nm: 'Empresa Siete', email: 'siete@empresa.cl' },
    supplier_user_nm: 'Proveedor Y',
    supplier: { user_nm: 'Proveedor Y', email: 'y@proveedory.cl' },
    amount: 750000,
    amount_used: 750000,
    amount_paid: 750000,
    amount_refunded: 0,
    term_days: 30,
    request_type: 'express',
    status: 'approved_by_sellsi',
    approved_at: '2025-12-22T10:00:00Z',
    document_count: 1,
    // example: already paused (for dev testing unpause)
    paused: true,
    paused_at: '2025-12-23T10:00:00Z',
    paused_by: 'dev-admin',
    paused_reason: 'Testing pause',
  },
  // New test cases to cover combined scenarios
  {
    id: 'ftx-8',
    created_at: '2026-01-20T09:00:00Z',
    buyer_user_nm: 'Comercial Ocho',
    buyer: { user_nm: 'Comercial Ocho', email: 'ocho@empresa.cl' },
    supplier_user_nm: 'Proveedor H',
    supplier: { user_nm: 'Proveedor H', email: 'ventas@proveedorh.cl' },
    amount: 1000000,
    amount_used: 200000,
    amount_paid: 300000,
    amount_refunded: 0,
    term_days: 30,
    request_type: 'express',
    status: 'approved_by_sellsi',
    approved_at: '2026-01-20T09:05:00Z',
    document_count: 0,
  },
  {
    id: 'ftx-expired-2',
    created_at: '2025-12-25T10:00:00Z',
    buyer_user_nm: 'Cliente Noveno',
    buyer: { user_nm: 'Cliente Noveno', email: 'noveno@cliente.cl' },
    supplier_user_nm: 'Proveedor J',
    supplier: { user_nm: 'Proveedor J', email: 'j@proveedorj.cl' },
    amount: 500000,
    amount_used: 100000,
    amount_paid: 200000,
    amount_refunded: 0,
    term_days: 15,
    request_type: 'extended',
    status: 'expired',
    document_count: 0,
  },
  // Mora case: expired and balance > 0 (amount_used - amount_paid > 0)
  {
    id: 'ftx-mora-1',
    created_at: '2025-11-15T09:00:00Z',
    buyer_user_nm: 'Mora Cliente',
    buyer: { user_nm: 'Mora Cliente', email: 'mora@cliente.cl' },
    supplier_user_nm: 'Proveedor Mora',
    supplier: { user_nm: 'Proveedor Mora', email: 'mora@proveedor.cl' },
    amount: 600000,
    amount_used: 500000,
    amount_paid: 200000,
    amount_refunded: 0,
    term_days: 30,
    request_type: 'express',
    status: 'expired',
    document_count: 0,
  },

  // Paused example for Buyer view
  {
    id: 'ftx-paused-buyer',
    created_at: '2026-01-22T10:00:00Z',
    buyer_user_nm: 'Buyer Pausado',
    buyer_legal_name: 'Buyer Pausado Ltda',
    buyer_legal_rut: '76.444.555-6',
    buyer: { user_nm: 'Buyer Pausado', email: 'buyer.pausado@cliente.cl' },
    supplier_user_nm: 'Proveedor Pausa',
    supplier: { user_nm: 'Proveedor Pausa', email: 'pausa@proveedor.cl' },
    amount: 750000,
    amount_used: 250000,
    amount_paid: 100000,
    amount_refunded: 0,
    term_days: 30,
    request_type: 'express',
    status: 'approved_by_sellsi',
    approved_at: '2026-01-22T10:05:00Z',
    document_count: 1,
    payment_status: 'pending',
    // Pause metadata (dev mock)
    paused: true,
    paused_at: '2026-01-23T09:00:00Z',
    paused_by: 'dev-admin',
    paused_reason: 'Revisión manual por actividad sospechosa',
  },

  // Paused example for Supplier view
  {
    id: 'ftx-paused-supplier',
    created_at: '2026-01-20T08:30:00Z',
    buyer_user_nm: 'Cliente Pausa',
    buyer_legal_name: 'Cliente Pausa S.A.',
    buyer_legal_rut: '77.333.222-1',
    buyer: { user_nm: 'Cliente Pausa', email: 'cliente.pausa@cliente.cl' },
    supplier_user_nm: 'Proveedor Pausado',
    supplier: { user_nm: 'Proveedor Pausado', email: 'proveedor.pausado@proveedor.cl' },
    amount: 1500000,
    amount_used: 500000,
    amount_paid: 200000,
    amount_refunded: 0,
    term_days: 45,
    request_type: 'extended',
    status: 'approved_by_sellsi',
    approved_at: '2026-01-20T08:45:00Z',
    document_count: 2,
    payment_status: 'pending',
    // Pause metadata (dev mock)
    paused: true,
    paused_at: '2026-01-24T11:15:00Z',
    paused_by: 'dev-admin',
    paused_reason: 'Monto en disputa — retención preventiva',
  }
];

const MOCK_DOCS = {
  'ftx-1': [
    { id: 'doc-1', document_name: 'contrato.pdf', document_type: 'contract', uploaded_at: '2026-01-12T10:01:00Z', storage_path: 'ftx-1/contrato.pdf' },
    { id: 'doc-1-2', document_name: 'pagare.pdf', document_type: 'pagare', uploaded_at: '2026-01-12T10:02:00Z', storage_path: 'ftx-1/pagare.pdf' },
  ],
  'ftx-2': [
    { id: 'doc-2', document_name: 'pagare.pdf', document_type: 'pagare', uploaded_at: '2026-01-10T12:01:00Z', storage_path: 'ftx-2/pagare.pdf' },
    { id: 'doc-2-2', document_name: 'contrato.pdf', document_type: 'contract', uploaded_at: '2026-01-10T12:02:00Z', storage_path: 'ftx-2/contrato.pdf' },
  ],
  'ftx-4': [
    { id: 'doc-4-1', document_name: 'resumen.pdf', document_type: 'summary', uploaded_at: '2026-01-05T08:05:00Z', storage_path: 'ftx-4/resumen.pdf', size: 45678 },
  ],
  'ftx-3': [
    { id: 'doc-3-1', document_name: 'contrato_respaldo.pdf', document_type: 'contract', uploaded_at: '2025-12-01T09:05:00Z', storage_path: 'ftx-3/contrato_respaldo.pdf', size: 245678 },
  ],
  'ftx-5': [
    { id: 'doc-5-1', document_name: 'documento_fiscal.pdf', document_type: 'garantia', uploaded_at: '2026-01-02T11:05:00Z', storage_path: 'ftx-5/documento_fiscal.pdf', size: 98765 },
  ],
  'ftx-6': [
    { id: 'doc-6-1', document_name: 'contrato_ftx6.pdf', document_type: 'contract', uploaded_at: '2026-01-15T09:31:00Z', storage_path: 'ftx-6/contrato.pdf', size: 200123 },
    { id: 'doc-6-2', document_name: 'pagare_ftx6.pdf', document_type: 'pagare', uploaded_at: '2026-01-15T09:32:00Z', storage_path: 'ftx-6/pagare.pdf', size: 120456 },
  ],
  'ftx-7': [
    { id: 'doc-7-1', document_name: 'contrato_ftx7_signed.pdf', document_type: 'contract', uploaded_at: '2025-12-22T10:05:00Z', storage_path: 'ftx-7/contrato_signed.pdf', size: 345678 },
  ],
};

function findMockRequest(id) {
  return MOCK_REQUESTS.find(r => String(r.id) === String(id));
}

/**
 * Obtiene todas las solicitudes de financiamiento pendientes de aprobación por Sellsi
 * @returns {Promise<Array>} Lista de solicitudes con información de buyer y supplier
 */
export async function getPendingFinancingRequests() {
  if (IS_DEV) {
    return MOCK_REQUESTS.filter(r => r.status === 'pending_sellsi_approval');
  }

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
  if (IS_DEV) {
    return MOCK_REQUESTS.filter(r => r.status === 'approved_by_sellsi');
  }

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
  if (IS_DEV) {
    return MOCK_REQUESTS;
  }

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
  if (IS_DEV) {
    const req = findMockRequest(requestId);
    if (!req) throw new Error('Solicitud no encontrada (mock)');
    const today = new Date().toISOString().split('T')[0];
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + req.term_days);
    const expiresAt = expirationDate.toISOString().split('T')[0];

    req.status = 'approved_by_sellsi';
    req.approved_by_admin_id = adminId;
    req.activated_at = today;
    req.expires_at = expiresAt;
    req.updated_at = new Date().toISOString();
    return req;
  }

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
 * Pausar o reanudar un financiamiento (dev/mock)
 */
export async function pauseFinancing(requestId, adminId, reason = null) {
  if (IS_DEV) {
    const req = findMockRequest(requestId);
    if (!req) throw new Error('Solicitud no encontrada (mock)');
    if (req.status !== 'approved_by_sellsi') throw new Error('Solo se puede pausar un financiamiento aprobado');
    req.paused = true;
    req.paused_at = new Date().toISOString();
    req.paused_by = adminId || 'mock-admin';
    req.paused_reason = reason;
    req.updated_at = new Date().toISOString();
    return req;
  }

  const { data, error } = await supabase
    .from(TABLE)
    .update({ paused: true, paused_at: new Date().toISOString(), paused_by: adminId, paused_reason: reason, updated_at: new Date().toISOString() })
    .eq('id', requestId)
    .eq('status', 'approved_by_sellsi')
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function unpauseFinancing(requestId, adminId, reason = null) {
  if (IS_DEV) {
    const req = findMockRequest(requestId);
    if (!req) throw new Error('Solicitud no encontrada (mock)');
    if (!req.paused) throw new Error('El financiamiento no está pausado');
    req.paused = false;
    req.paused_at = null;
    req.paused_by = adminId || null;
    req.paused_reason = reason || null;
    req.updated_at = new Date().toISOString();
    return req;
  }

  const { data, error } = await supabase
    .from(TABLE)
    .update({ paused: false, paused_at: null, paused_by: null, paused_reason: null, updated_at: new Date().toISOString() })
    .eq('id', requestId)
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
  if (IS_DEV) {
    const req = findMockRequest(requestId);
    if (!req) throw new Error('Solicitud no encontrada (mock)');
    req.status = 'rejected_by_sellsi';
    req.rejection_reason = reason;
    req.rejected_at = new Date().toISOString();
    req.updated_at = new Date().toISOString();
    return req;
  }

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
  if (IS_DEV) {
    return MOCK_DOCS[String(requestId)] ?? [];
  }

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
  if (IS_DEV) {
    // Return a small dummy Blob so Download flow can be tested in dev
    const blob = new Blob(['Mock PDF content'], { type: 'application/pdf' });
    return blob;
  }

  const { data, error } = await supabase.storage
    .from('financing-documents')
    .download(storagePath);

  if (error) throw error;
  return data;
}

/**
 * Upload a financing document (used by admin approve flow)
 * In DEV we just store it in MEMORY (MOCK_DOCS) so the UI can show it.
 */
export async function uploadFinancingDocument(requestId, file) {
  if (IS_DEV) {
    if (!file) throw new Error('No file provided');
    const id = `doc-${Date.now()}`;
    const doc = {
      id,
      document_name: file.name || 'document.pdf',
      document_type: 'contract',
      uploaded_at: new Date().toISOString(),
      storage_path: `${requestId}/${id}.pdf`,
    };
    MOCK_DOCS[String(requestId)] = MOCK_DOCS[String(requestId)] || [];
    MOCK_DOCS[String(requestId)].unshift(doc);
    return doc;
  }

  // Production: not implemented in control panel mocks
  throw new Error('uploadFinancingDocument is not implemented in production in this control_panel build.');
}

/**
 * Obtiene la URL pública de un documento
 * @param {string} storagePath - Ruta del archivo en storage
 * @returns {string} URL pública del documento
 */
export function getDocumentUrl(storagePath) {
  if (IS_DEV) {
    // Not hosting real files in dev mocks; return null so UI uses download flow
    return null;
  }

  const { data } = supabase.storage
    .from('financing-documents')
    .getPublicUrl(storagePath);

  return data?.publicUrl ?? null;
}

// -----------------------------
// MOCK TRANSACTIONS & HELPERS
// -----------------------------
const MOCK_TRANSACTIONS = {
  'ftx-2': [
    { id: 't-1', financing_id: 'ftx-2', type: 'consumo', amount: 100000, supplier_order_id: 'sup-1', created_at: '2026-01-11T10:00:00Z', created_by: null },
    { id: 't-2', financing_id: 'ftx-2', type: 'reposicion', amount: 100000, supplier_order_id: 'sup-1', created_at: '2026-01-12T09:00:00Z', restoration_reason: 'Pedido cancelado por proveedor', is_automatic: true, created_by: 'supplier-1' },
  ],
  'ftx-6': [
    { id: 't-3', financing_id: 'ftx-6', type: 'consumo', amount: 500000, supplier_order_id: 'sup-9', created_at: '2026-01-16T09:00:00Z', created_by: null },
    { id: 't-4', financing_id: 'ftx-6', type: 'pago', amount: 200000, created_at: '2026-01-20T15:00:00Z', payment_method: 'khipu', payment_reference: 'pay-123', created_by: 'buyer-1' },
  ],
  'ftx-refund-1': [
    { id: 't-r1', financing_id: 'ftx-refund-1', type: 'pago', amount: 50000, payment_method: 'transfer', payment_reference: 'REF-R1', created_at: '2026-01-18T10:06:00Z', created_by: 'buyer-refund-1' },
  ],
};

/**
 * Obtiene transacciones (consumo, pago, reposición) de un financiamiento
 */
export async function getFinancingTransactions(requestId) {
  if (IS_DEV) {
    return (MOCK_TRANSACTIONS[String(requestId)] || []).slice().sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
  }

  const { data, error } = await supabase
    .from('financing_transactions')
    .select('*')
    .eq('financing_id', requestId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

/**
 * Reposición manual (admin)
 */
export async function restoreFinancingAmount(requestId, amount, adminId, reason) {
  if (IS_DEV) {
    const req = MOCK_REQUESTS.find(r => String(r.id) === String(requestId));
    if (!req) throw new Error('Financiamiento no encontrado (mock)');
    if (amount > (req.amount_used || 0)) throw new Error('El monto excede amount_used');

    req.amount_used = (req.amount_used || 0) - amount;
    req.updated_at = new Date().toISOString();

    MOCK_TRANSACTIONS[String(requestId)] = MOCK_TRANSACTIONS[String(requestId)] || [];
    MOCK_TRANSACTIONS[String(requestId)].unshift({
      id: `t-${Date.now()}`,
      financing_id: requestId,
      type: 'reposicion',
      amount,
      supplier_order_id: null,
      restoration_reason: reason || 'Reposición manual admin',
      restored_by: adminId,
      is_automatic: false,
      created_at: new Date().toISOString(),
      created_by: adminId,
    });

    return req;
  }

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
  if (IS_DEV) {
    const req = MOCK_REQUESTS.find(r => String(r.id) === String(requestId));
    if (!req) throw new Error('Financiamiento no encontrado (mock)');

    // amount_refunded tracking in mock
    req.amount_refunded = (req.amount_refunded || 0) + amount;
    req.updated_at = new Date().toISOString();

    MOCK_TRANSACTIONS[String(requestId)] = MOCK_TRANSACTIONS[String(requestId)] || [];
    MOCK_TRANSACTIONS[String(requestId)].unshift({
      id: `t-${Date.now()}`,
      financing_id: requestId,
      type: 'devolucion',
      amount,
      restoration_reason: 'Devolución procesada por admin',
      created_at: new Date().toISOString(),
      created_by: adminId,
    });

    // Registrar auditoría (dev) — solo monto
    try {
      await AdminApiService.logAuditAction(adminId, AUDIT_ACTIONS.FINANCING_REFUND, requestId, { amount });
    } catch (err) {
      console.warn('Error registrando auditoría de devolución (dev):', err);
    }

    return { success: true, refund_processed: amount };
  }

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
 * Generar contrato (invoca edge function)
 */
export async function generateFinancingContract(requestId) {
  if (IS_DEV) {
    const doc = {
      id: `doc-gen-${Date.now()}`,
      document_name: `contrato_template_${requestId}.pdf`,
      document_type: 'contract_template',
      uploaded_at: new Date().toISOString(),
      storage_path: `${requestId}/contrato_template.pdf`,
    };
    MOCK_DOCS[String(requestId)] = MOCK_DOCS[String(requestId)] || [];
    MOCK_DOCS[String(requestId)].unshift(doc);
    return { success: true, doc };
  }

  // Production: invoke Supabase Edge Function
  try {
    const res = await supabase.functions.invoke('generate-financing-contract', {
      body: JSON.stringify({ financing_id: requestId })
    });
    if (res.error) throw res.error;
    return { success: true, data: res.data };
  } catch (err) {
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
