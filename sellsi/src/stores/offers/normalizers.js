import { OFFER_STATES, normalizeStatus } from './constants';

/**
 * Asegura forma consistente de product dentro de una oferta.
 */
function normalizeProduct(o) {
  if (o.product) return {
    ...o.product,
    id: o.product.id ?? o.product_id,
    product_id: o.product.product_id ?? o.product_id
  };
  return {
    name: o.product_name || 'Producto',
    thumbnail: o.product_thumbnail || null,
    id: o.product_id,
    product_id: o.product_id
  };
}

export function normalizeBuyerOffer(o) {
  // Pasar purchase_deadline para validar ofertas approved que hayan caducado
  const status = normalizeStatus(o.status, o.expires_at, o.purchase_deadline);
  return {
    ...o,
    status,
    price: o.price ?? o.offered_price ?? o.p_price,
    quantity: o.quantity ?? o.offered_quantity ?? o.p_quantity,
    product: normalizeProduct(o)
  };
}

export function normalizeSupplierOffer(o) {
  // Para proveedor no evaluamos expiración de pending aquí (se mantiene lógica actual)
  let status = o.status === 'accepted' ? OFFER_STATES.APPROVED : o.status;
  return {
    ...o,
    status,
    price: o.price ?? o.offered_price ?? o.p_price,
    quantity: o.quantity ?? o.offered_quantity ?? o.p_quantity,
    product: o.product || {
      name: o.product_name || 'Producto',
      thumbnail: o.product_thumbnail || null,
      stock: (o.current_stock != null) ? o.current_stock : ((o.product && o.product.stock != null) ? o.product.stock : null),
      productqty: (o.product && o.product.productqty != null) ? o.product.productqty : (o.productqty ?? null),
      previousPrice: (o.base_price_at_offer != null) ? Number(o.base_price_at_offer) : (o.current_product_price != null ? Number(o.current_product_price) : null),
      id: o.product_id,
      product_id: o.product_id,
      price_tiers: o.price_tiers
    },
    buyer: o.buyer || { name: o.buyer_name || 'Comprador' }
  };
}
