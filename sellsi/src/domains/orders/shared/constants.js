// Order domain constants (Phase 1 extracted)
export const ORDER_STATUSES = ['pending','accepted','rejected','in_transit','delivered','cancelled'];
export const ADVANCE_STATUSES = new Set(['accepted','in_transit','delivered']);
export const DOCUMENT_TYPES = ['boleta','factura','ninguno'];

export const STATUS_DISPLAY_MAP = {
  pending: 'Pendiente',
  accepted: 'Aceptado',
  rejected: 'Rechazado',
  in_transit: 'En Transito',
  delivered: 'Entregado',
  cancelled: 'Cancelado'
};

export function normalizeStatus(raw) {
  if (!raw) return 'pending';
  const s = String(raw).toLowerCase();
  if (ORDER_STATUSES.includes(s)) return s;
  // Map display -> internal
  const reverse = Object.entries(STATUS_DISPLAY_MAP).find(([, disp]) => disp.toLowerCase() === s);
  return reverse ? reverse[0] : s;
}

export function getStatusDisplayName(status) {
  return STATUS_DISPLAY_MAP[status] || status;
}
