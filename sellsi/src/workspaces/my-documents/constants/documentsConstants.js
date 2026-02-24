export const FINANCING_STATUS_LABELS = {
  pending_supplier_review: { label: 'Pendiente revisión', color: 'warning' },
  buyer_signature_pending: { label: 'Firma comprador pendiente', color: 'warning' },
  supplier_signature_pending: { label: 'Firma proveedor pendiente', color: 'warning' },
  pending_sellsi_approval: { label: 'En revisión Sellsi', color: 'info' },
  approved_by_sellsi: { label: 'Vigente', color: 'success' },
  expired: { label: 'Vencido', color: 'error' },
  paid: { label: 'Pagado', color: 'default' },
  rejected: { label: 'Rechazado', color: 'error' },
};

export const DOC_TYPE_LABELS = {
  contrato_marco: 'Contrato Marco',
  garantia_poderes_certificado: 'Certificado de Poderes',
  garantia_poderes_vigencia: 'Vigencia de Poderes',
  garantia_carpeta_tributaria: 'Carpeta Tributaria',
  garantia_otros_1: 'Documento adicional 1',
  garantia_otros_2: 'Documento adicional 2',
  garantia_otros_3: 'Documento adicional 3',
};

export const FINANCING_TYPE_LABELS = {
  express: 'Express',
  extended: 'Extendida',
};
