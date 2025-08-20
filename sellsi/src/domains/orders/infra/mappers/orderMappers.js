// Canonical mappers (DB/service objects -> Domain Order DTO)
// Objetivo: centralizar normalización antes de pasar a adapters UI.
import { normalizeDocumentType } from '../../shared/parsing';

/**
 * @typedef {Object} DomainOrderItem
 * @property {string} id
 * @property {string|null} productId
 * @property {number} quantity
 * @property {number} priceAtAddition
 * @property {string} document_type
 * @property {Object} product
 */

function mapItem(raw, fallbackOrderId, idx = 0) {
  return {
    id: raw.cart_items_id || raw.id || `${fallbackOrderId}-itm-${idx}`,
    productId: raw.product_id || raw.productid || raw.id || null,
    quantity: raw.quantity || 1,
    priceAtAddition: raw.price_at_addition || raw.price || 0,
    document_type: normalizeDocumentType(raw.document_type || raw.documentType),
    product: raw.product || raw.products || raw.product_data || {}
  };
}

export function mapSupplierOrderFromServiceObject(o) {
  if (!o) return null;
  const items = (o.items || []).map((it, idx) => mapItem(it, o.order_id || o.id, idx));
  return {
    id: o.order_id || o.id,
    source: o.is_payment_order ? 'orders' : (o.source || 'carts'),
    buyerId: o.buyer_id || o.buyerId,
    supplierId: o.supplier_id || null,
    status: o.status,
    paymentStatus: o.payment_status || null,
    createdAt: o.created_at,
    updatedAt: o.updated_at,
    estimatedDeliveryDate: o.estimated_delivery_date || null,
    items,
    totals: {
      items: items.length,
      quantity: items.reduce((s, i) => s + (i.quantity || 0), 0),
      amount: o.total_amount || 0,
      final: o.final_amount || o.total_amount || 0
    },
    // ✅ FIX: Mapear campos de shipping que se perdían en la transformación
    shipping: o.shipping || 0,
    shipping_amount: o.shipping_amount || 0,
    shipping_cost: o.shipping_cost || 0,
    deliveryAddress: o.delivery_address || o.deliveryAddress || null
  };
}

export function mapBuyerOrderFromServiceObject(o) {
  return mapSupplierOrderFromServiceObject(o);
}
