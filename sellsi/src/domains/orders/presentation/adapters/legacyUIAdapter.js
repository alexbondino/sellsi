// Adapter para mantener compatibilidad con la UI actual (supplier & buyer)
// Fase 1.5: genera alias y campos legacy sin alterar el DTO base.

import { getStatusDisplayName } from '../../../orders/shared/constants';
import { normalizeDocumentType } from '../../../orders/shared/parsing';
import { FLAGS } from '../../config/flags';

export function toSupplierUIOrder(domainOrder, { includeAliases = true } = {}) {
  if (!domainOrder) return null;
  const o = { ...domainOrder };
  const items = (o.items || []).map(it => ({
    ...it,
    document_type: normalizeDocumentType(it.document_type || it.documentType)
  }));
  const base = {
    order_id: o.id || o.order_id,
    buyer_id: o.buyerId || o.buyer_id,
    status: o.status, // se mantendrá en inglés, store hace display
    payment_status: o.paymentStatus || o.payment_status,
    created_at: o.createdAt || o.created_at,
    updated_at: o.updatedAt || o.updated_at,
    estimated_delivery_date: o.estimatedDeliveryDate || o.estimated_delivery_date || null,
    items,
    delivery_address: o.deliveryAddress || o.delivery_address || null,
    total_items: items.length,
    total_quantity: items.reduce((s,i)=>s + (i.quantity||0),0),
    total_amount: o.totals?.amount || o.total_amount || 0,
    // ✅ FIX: Mapear campos de shipping desde domain order
    shipping: o.shipping || 0,
    shipping_amount: o.shipping_amount || 0,
    shipping_cost: o.shipping_cost || 0,
    // ✅ FIX: NO recalcular final_amount, usar el que viene del domain (ya incluye shipping)
    final_amount: o.totals?.final || o.final_amount || (o.totals?.amount || o.total_amount || 0),
  supplier_parts_meta: o.supplier_parts_meta || null,
    source: o.source || 'orders'
  };
  if (includeAliases && FLAGS.ORDERS_EMIT_LEGACY_ALIASES) {
    base.deliveryAddress = base.delivery_address; // camelCase alias
  }
  // Control de aliases de producto deprecados
  // @deprecated proveedor, verified, supplierVerified, imagen
  if (!FLAGS.ORDERS_EMIT_DEPRECATED_PRODUCT_ALIASES) {
    for (const it of base.items) {
      if (it && it.product) {
        delete it.product.proveedor;
        delete it.product.verified;
        delete it.product.supplierVerified;
        delete it.product.imagen;
      }
    }
  }
  return base;
}

export function toBuyerUIOrder(domainOrder, opts) {
  // Reutilizamos supplier adapter (misma estructura base)
  return toSupplierUIOrder(domainOrder, opts);
}

// Utilidad para debug de diferencias (opcional)
export function diffKeys(a, b) {
  const ak = a ? Object.keys(a) : [];
  const bk = b ? Object.keys(b) : [];
  return {
    onlyInA: ak.filter(k => !bk.includes(k)),
    onlyInB: bk.filter(k => !ak.includes(k))
  };
}
