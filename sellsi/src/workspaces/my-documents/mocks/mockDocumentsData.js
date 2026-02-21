/**
 * ============================================================================
 * MOCK DATA — /my-documents
 * ============================================================================
 * Datos de prueba para iterar sobre la UI mientras se conecta el backend real.
 * Refleja el esquema real definido en ANALISIS_MY_DOCUMENTS.md.
 *
 * Para deshabilitar mocks y mostrar solo empty states:
 *   export const USE_MOCKS = false;
 * ============================================================================
 */

export const USE_MOCKS = true;

// ---------------------------------------------------------------------------
// FINANCIAMIENTO
// Fuente futura: financing_requests JOIN financing_documents
// ---------------------------------------------------------------------------

export const FINANCING_STATUS_LABELS = {
  pending_supplier_review:   { label: 'Pendiente revisión', color: 'warning' },
  buyer_signature_pending:   { label: 'Firma comprador pendiente', color: 'warning' },
  supplier_signature_pending:{ label: 'Firma proveedor pendiente', color: 'warning' },
  pending_sellsi_approval:   { label: 'En revisión Sellsi', color: 'info' },
  approved_by_sellsi:        { label: 'Vigente', color: 'success' },
  expired:                   { label: 'Vencido', color: 'error' },
  paid:                      { label: 'Pagado', color: 'default' },
  rejected:                  { label: 'Rechazado', color: 'error' },
};

export const DOC_TYPE_LABELS = {
  contrato_marco:                 'Contrato Marco',
  garantia_poderes_certificado:   'Certificado de Poderes',
  garantia_poderes_vigencia:      'Vigencia de Poderes',
  garantia_carpeta_tributaria:    'Carpeta Tributaria',
  garantia_otros_1:               'Documento adicional 1',
  garantia_otros_2:               'Documento adicional 2',
  garantia_otros_3:               'Documento adicional 3',
};

export const FINANCING_TYPE_LABELS = {
  express:  'Express',
  extended: 'Extendida',
};

/**
 * Buyer: `counterpart` es el nombre del proveedor.
 * Supplier: `counterpart` es el nombre del comprador.
 * Solo se muestran solicitudes `approved_by_sellsi`.
 */
export const MOCK_FINANCING_GROUPS = [
  {
    id: 'a1b2c3d4-0001-0000-0000-000000000001',
    short_id: 'FIN-2891',
    counterpart: 'Distribuciones Del Sur SpA',
    type: 'extended',
    status: 'approved_by_sellsi',
    amount: 4_500_000,
    created_at: '2026-01-15T10:30:00Z',
    activated_at: '2026-01-25T09:00:00Z',
    term_days: 60,
    expires_at: '2026-03-26T09:00:00Z',
    documents: [
      {
        id: 'doc-001',
        document_type: 'contrato_marco',
        document_name: 'contrato_marco_fin2891.pdf',
        file_size: 245_000,
        uploaded_at: '2026-01-20T14:22:00Z',
      },
      {
        id: 'doc-002',
        document_type: 'garantia_poderes_certificado',
        document_name: 'certificado_poderes_fin2891.pdf',
        file_size: 120_500,
        uploaded_at: '2026-01-15T10:35:00Z',
      },
      {
        id: 'doc-003',
        document_type: 'garantia_poderes_vigencia',
        document_name: 'vigencia_poderes_fin2891.pdf',
        file_size: 98_200,
        uploaded_at: '2026-01-15T10:38:00Z',
      },
      {
        id: 'doc-004',
        document_type: 'garantia_carpeta_tributaria',
        document_name: 'carpeta_tributaria_2026.pdf',
        file_size: 412_800,
        uploaded_at: '2026-01-15T10:40:00Z',
      },
    ],
  },
  {
    id: 'a1b2c3d4-0002-0000-0000-000000000002',
    short_id: 'FIN-3104',
    counterpart: 'Insumos Industriales Norte Ltda.',
    type: 'express',
    status: 'approved_by_sellsi',
    amount: 1_200_000,
    created_at: '2026-02-01T09:00:00Z',
    activated_at: '2026-02-10T11:00:00Z',
    term_days: 30,
    expires_at: '2026-03-12T11:00:00Z',
    documents: [
      {
        id: 'doc-005',
        document_type: 'contrato_marco',
        document_name: 'contrato_marco_fin3104.pdf',
        file_size: 238_000,
        uploaded_at: '2026-02-05T11:00:00Z',
      },
      {
        id: 'doc-006',
        document_type: 'garantia_poderes_certificado',
        document_name: 'cert_poderes_norte.pdf',
        file_size: 115_000,
        uploaded_at: '2026-02-01T09:05:00Z',
      },
      {
        id: 'doc-007',
        document_type: 'garantia_otros_1',
        document_name: 'anexo_garantia_norte.pdf',
        file_size: 88_300,
        uploaded_at: '2026-02-01T09:08:00Z',
      },
    ],
  },
  {
    id: 'a1b2c3d4-0003-0000-0000-000000000003',
    short_id: 'FIN-3301',
    counterpart: 'Materiales y Suministros Rápido S.A.',
    type: 'extended',
    status: 'approved_by_sellsi',
    amount: 8_900_000,
    created_at: '2026-02-12T14:00:00Z',
    activated_at: '2026-02-18T10:00:00Z',
    term_days: 90,
    expires_at: '2026-05-19T10:00:00Z',
    documents: [
      {
        id: 'doc-008',
        document_type: 'garantia_poderes_certificado',
        document_name: 'cert_poderes_rapido.pdf',
        file_size: 134_000,
        uploaded_at: '2026-02-12T14:05:00Z',
      },
      {
        id: 'doc-009',
        document_type: 'garantia_carpeta_tributaria',
        document_name: 'carpeta_tributaria_rapido.pdf',
        file_size: 398_500,
        uploaded_at: '2026-02-12T14:10:00Z',
      },
    ],
  },
  {
    id: 'a1b2c3d4-0004-0000-0000-000000000004',
    short_id: 'FIN-2644',
    counterpart: 'Ferretería Central Ltda.',
    type: 'express',
    status: 'expired',
    amount: 950_000,
    created_at: '2025-10-01T08:00:00Z',
    activated_at: '2025-10-10T09:00:00Z',
    term_days: 30,
    expires_at: '2025-11-09T09:00:00Z',
    documents: [
      {
        id: 'doc-010',
        document_type: 'contrato_marco',
        document_name: 'contrato_marco_fin2644.pdf',
        file_size: 210_000,
        uploaded_at: '2025-10-05T09:00:00Z',
      },
    ],
  },
  {
    id: 'a1b2c3d4-0005-0000-0000-000000000005',
    short_id: 'FIN-2213',
    counterpart: 'Importaciones del Pacífico S.A.',
    type: 'extended',
    status: 'paid',
    amount: 6_200_000,
    created_at: '2025-08-15T10:00:00Z',
    activated_at: '2025-09-01T10:00:00Z',
    term_days: 90,
    expires_at: '2025-11-30T10:00:00Z',
    documents: [
      {
        id: 'doc-011',
        document_type: 'contrato_marco',
        document_name: 'contrato_marco_fin2213.pdf',
        file_size: 250_000,
        uploaded_at: '2025-08-20T11:00:00Z',
      },
      {
        id: 'doc-012',
        document_type: 'garantia_carpeta_tributaria',
        document_name: 'carpeta_tributaria_pacifico.pdf',
        file_size: 380_000,
        uploaded_at: '2025-08-20T11:05:00Z',
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// FACTURAS
// Fuente futura: invoices_meta JOIN orders
// category: 'emitidas' (supplier) | 'recibidas' (buyer)
// ---------------------------------------------------------------------------

export const MOCK_INVOICES = [
  {
    id: 'inv-001',
    category: 'emitidas',
    order_id: '45b0bc5e-1001-4a2f-b3c9-d8e7f6a091b2',
    counterpart: 'Empresa Compradora ABC S.A.',
    document_name: 'factura_19481.pdf',
    file_size: 185_000,
    amount: 1_248_400,
    uploaded_at: '2026-02-10T08:30:00Z',
  },
  {
    id: 'inv-002',
    category: 'emitidas',
    order_id: 'a3c91fd2-2002-48bc-9e14-57f083210dd4',
    counterpart: 'Comercial González y Cía. Ltda.',
    document_name: 'boleta_elect_8921.pdf',
    file_size: 92_500,
    amount: 345_000,
    uploaded_at: '2026-02-03T16:45:00Z',
  },
  {
    id: 'inv-003',
    category: 'emitidas',
    order_id: 'f7e24b80-3003-4d61-a0f5-1c6b29084e77',
    counterpart: 'Constructora Pacífico S.A.',
    document_name: 'factura_17883.pdf',
    file_size: 210_000,
    amount: 3_780_900,
    uploaded_at: '2026-01-28T11:20:00Z',
  },
  {
    id: 'inv-004',
    category: 'recibidas',
    order_id: 'c2d58af1-4004-4e73-b812-9a0f37652c33',
    counterpart: 'Distribuciones Del Sur SpA',
    document_name: 'factura_22019.pdf',
    file_size: 204_000,
    amount: 892_000,
    uploaded_at: '2026-01-28T12:00:00Z',
  },
  {
    id: 'inv-005',
    category: 'recibidas',
    order_id: '8b31e6d9-5005-4f84-c923-0e1a48763b55',
    counterpart: 'Insumos Industriales Norte Ltda.',
    document_name: 'factura_5503.pdf',
    file_size: 148_000,
    amount: 512_500,
    uploaded_at: '2026-01-20T09:15:00Z',
  },
];

// ---------------------------------------------------------------------------
// COTIZACIONES
// Fuente futura: quotation_documents (tabla a crear)
// expires_at = created_at + 15 días
// ---------------------------------------------------------------------------

export const MOCK_QUOTATIONS = [
  {
    id: 'quot-001',
    product_name: 'Cinta aislante 3M 1600 negra (pack x10)',
    supplier_name: 'Insumos Industriales Norte Ltda.',
    amount: 42_500,
    document_name: 'cotizacion_quot001.pdf',
    file_size: 67_000,
    created_at: '2026-02-14T10:00:00Z',
    expires_at: '2026-03-01T10:00:00Z',
  },
  {
    id: 'quot-002',
    product_name: 'Taladro percutor DeWalt DCD796 800W',
    supplier_name: 'Distribuciones Del Sur SpA',
    amount: 198_990,
    document_name: 'cotizacion_quot002.pdf',
    file_size: 71_500,
    created_at: '2026-02-08T14:30:00Z',
    expires_at: '2026-02-23T14:30:00Z',
  },
  {
    id: 'quot-003',
    product_name: 'Cable eléctrico THW 1.5mm² (rollo 100m)',
    supplier_name: 'Materiales Eléctricos Rápido S.A.',
    amount: 84_900,
    document_name: 'cotizacion_quot003.pdf',
    file_size: 58_000,
    created_at: '2026-01-25T09:00:00Z',
    expires_at: '2026-02-09T09:00:00Z', // vencida
  },
];
