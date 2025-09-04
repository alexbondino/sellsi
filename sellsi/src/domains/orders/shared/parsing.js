import { DOCUMENT_TYPES } from './constants';

export function normalizeDocumentType(val) {
  if (!val) return 'ninguno';
  const v = String(val).toLowerCase();
  return DOCUMENT_TYPES.includes(v) ? v : 'ninguno';
}

// Accepts: array | stringified JSON | object (maybe with items key)
export function parseOrderItems(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string') {
    try { const arr = JSON.parse(raw); return Array.isArray(arr) ? arr : []; } catch { return []; }
  }
  if (typeof raw === 'object') {
    if (Array.isArray(raw.items)) return raw.items;
    return [raw];
  }
  return [];
}

export function buildDeliveryAddress(shippingInfo) {
  const s = shippingInfo || {};
  return {
    region: s.shipping_region || s.region || 'Región no especificada',
    commune: s.shipping_commune || s.commune || 'Comuna no especificada',
    address: s.shipping_address || s.address || 'Dirección no especificada',
    number: s.shipping_number || s.number || '',
    department: s.shipping_dept || s.department || '',
    fullAddress: `${s.shipping_address || s.address || 'Dirección no especificada'} ${s.shipping_number || s.number || ''} ${s.shipping_dept || s.department || ''}`.trim()
  };
}
