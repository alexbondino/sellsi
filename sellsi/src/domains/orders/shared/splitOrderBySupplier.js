// Utility to derive supplier parts from a single order row (dynamic virtual split)
// Returns an array of parts (length 1 if only one or zero suppliers found)
// Each part keeps parent order_id in parent_order_id; synthetic_id is stable for React keys.

import { parseOrderItems } from './parsing';

export function splitOrderBySupplier(order) {
  if (!order) return [];
  const items = parseOrderItems(order.items);
  if (!Array.isArray(items) || items.length === 0) {
    return [{
      synthetic_id: order.id,
      order_id: order.id,
      parent_order_id: order.id,
      supplier_id: null,
      items: [],
      subtotal: 0,
      shipping_amount: Number(order.shipping || order.shipping_amount || 0),
      shipping: Number(order.shipping || order.shipping_amount || 0), // alias para UI
      total_amount: Number(order.subtotal || order.total || 0),
      final_amount: order.final_amount || Number(order.total || 0),
      status: order.status,
      payment_status: order.payment_status,
      is_supplier_part: false,
      is_payment_order: true,
      created_at: order.created_at,
  updated_at: order.updated_at,
  // Propagar dirección de envío cruda para que capas superiores la normalicen
  shipping_address: order.shipping_address
    }];
  }
  // Build groups keyed by supplier id (multiple potential field names for robustness)
  const groups = new Map();
  for (const it of items) {
    const sid = it.product?.supplier_id || it.product?.supplier?.id || it.supplier_id || it.supplierId || it.product?.supplierId || null;
    if (!sid) continue; // skip items without supplier id (won't break global grouping)
    if (!groups.has(sid)) groups.set(sid, []);
    groups.get(sid).push(it);
  }
  if (groups.size <= 1) {
    return [{
      synthetic_id: order.id,
      order_id: order.id,
      parent_order_id: order.id,
      supplier_id: groups.size === 1 ? Array.from(groups.keys())[0] : null,
      items,
      subtotal: items.reduce((s,i)=> s + Number(i.price_at_addition || i.price || 0) * (i.quantity || 0),0),
      shipping_amount: Number(order.shipping || order.shipping_amount || 0),
      shipping: Number(order.shipping || order.shipping_amount || 0),
      total_amount: Number(order.subtotal || order.total || 0),
      final_amount: order.final_amount || Number(order.total || 0),
      status: order.status,
      payment_status: order.payment_status,
      is_supplier_part: false,
      is_payment_order: true,
      created_at: order.created_at,
  updated_at: order.updated_at,
  shipping_address: order.shipping_address
    }];
  }
  // Multi-supplier: allocate shipping prorata on subtotal (last part absorbs rounding diff)
  const shippingTotal = Number(order.shipping || order.shipping_amount || 0);
  const parts = [];
  const entries = Array.from(groups.entries()).map(([sid, arr]) => ({ sid, arr, subtotal: arr.reduce((s,i)=> s + Number(i.price_at_addition || i.price || 0) * (i.quantity || 0),0) }));
  const totalSubtotal = entries.reduce((s,x)=> s + x.subtotal, 0) || 1;
  let accShip = 0;
  entries.forEach((entry, idx) => {
    let shipAlloc = 0;
    if (shippingTotal > 0) {
      if (idx === entries.length - 1) shipAlloc = Math.max(0, shippingTotal - accShip);
      else { shipAlloc = Math.round(shippingTotal * (entry.subtotal / totalSubtotal)); accShip += shipAlloc; }
    }
    parts.push({
      synthetic_id: `${order.id}-${entry.sid}`,
      order_id: order.id,
      parent_order_id: order.id,
      supplier_id: entry.sid,
      items: entry.arr,
      subtotal: entry.subtotal,
      shipping_amount: shipAlloc,
      shipping: shipAlloc,
      total_amount: entry.subtotal,
      final_amount: entry.subtotal + shipAlloc,
      status: order.status,
      payment_status: order.payment_status,
      is_supplier_part: true,
      is_payment_order: true,
      created_at: order.created_at,
  updated_at: order.updated_at,
  shipping_address: order.shipping_address
    });
  });
  return parts;
}

export function splitManyOrders(orders) {
  if (!Array.isArray(orders)) return [];
  return orders.flatMap(o => splitOrderBySupplier(o));
}
