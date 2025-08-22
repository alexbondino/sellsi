// Utility to derive supplier parts from a single order row (dynamic virtual split)
// Returns an array of parts (length 1 if only one or zero suppliers found)
// Each part keeps parent order_id in parent_order_id; synthetic_id is stable for React keys.

import { parseOrderItems } from './parsing';

// Prioridad para comparar avance de estados (sin traducir)
const STATUS_PRIORITY = {
  pending: 0,
  accepted: 1,
  in_transit: 2,
  delivered: 3,
  rejected: 4,     // terminal
  cancelled: 4     // terminal
};
function pickMoreAdvanced(baseStatus, overlayStatus) {
  if (!overlayStatus) return baseStatus;
  const b = STATUS_PRIORITY[baseStatus] ?? -1;
  const o = STATUS_PRIORITY[overlayStatus] ?? -1;
  // Solo avanzar, nunca retroceder
  return o > b ? overlayStatus : baseStatus;
}

// Deterministic short code generator (base36 over first 10 hex chars)
// Safe (~40 bits) and stable for display; not meant as secure identifier.
export function shortCode(uuid, prefix = '') {
  if (!uuid) return prefix + 'NA';
  const raw = String(uuid).replace(/-/g, '').slice(0, 10);
  let num = 0;
  try { num = parseInt(raw, 16); } catch { num = 0; }
  return prefix + num.toString(36).toUpperCase();
}

export function splitOrderBySupplier(order) {
  if (!order) return [];
  
  const supplierMeta = order.supplier_parts_meta || order.supplierPartsMeta || null; // JSONB column overlay (Option A 2.0)
  
  const parentDisplayCode = shortCode(order.id, 'K');
  const items = parseOrderItems(order.items);
  if (!Array.isArray(items) || items.length === 0) {
    const singlePart = {
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
    };
    singlePart.display_code = parentDisplayCode;
    singlePart.part_display_code = parentDisplayCode; // identical en mono-supplier
    // Overlay de meta si existe exactamente una clave
    if (supplierMeta && typeof supplierMeta === 'object' && Object.keys(supplierMeta).length === 1) {
      const onlyKey = Object.keys(supplierMeta)[0];
      const node = supplierMeta[onlyKey] || {};
  if (node.status) singlePart.status = pickMoreAdvanced(singlePart.status, node.status);
      if (node.estimated_delivery_date) singlePart.estimated_delivery_date = node.estimated_delivery_date;
    }
    return [singlePart];
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
    const supplierId = groups.size === 1 ? Array.from(groups.keys())[0] : null;
    // Recalcular subtotal a partir de ítems (ya lo hacemos) y robustecer campos de totales
    const subtotalCalc = items.reduce((s,i)=> s + Number(i.price_at_addition || i.price || 0) * (i.quantity || 0),0);
    const shippingVal = Number(order.shipping || order.shipping_amount || 0);
    // Usar total_amount provisto (payment order adaptado) si existe, si no fallback a subtotal calculado
    const totalAmountNormalized = (typeof order.total_amount === 'number' && Number.isFinite(order.total_amount))
      ? order.total_amount
      : (typeof order.total === 'number' && Number.isFinite(order.total))
        ? order.total
        : (typeof order.subtotal === 'number' && Number.isFinite(order.subtotal))
          ? order.subtotal
          : subtotalCalc;
    // final_amount normalmente YA incluye shipping cuando viene de payment order; sólo si viene ausente (null/undefined) lo reconstruimos
    const finalAmountNormalized = (order.final_amount ?? order.finalAmount) != null
      ? (order.final_amount ?? order.finalAmount)
      : (totalAmountNormalized + shippingVal);
    const part = {
      synthetic_id: order.id + (supplierId ? '-' + supplierId : ''),
      order_id: order.id,
      parent_order_id: order.id,
      supplier_id: supplierId,
      items,
      subtotal: subtotalCalc,
      shipping_amount: shippingVal,
      shipping: shippingVal,
      total_amount: totalAmountNormalized,
      final_amount: finalAmountNormalized,
      status: order.status,
      payment_status: order.payment_status,
      is_supplier_part: false,
      is_payment_order: true,
      created_at: order.created_at,
  updated_at: order.updated_at,
  shipping_address: order.shipping_address
    };
    part.display_code = parentDisplayCode;
    part.part_display_code = shortCode(order.id + (supplierId || ''), 'C');
    // Overlay meta single-supplier scenario
    if (supplierMeta && typeof supplierMeta === 'object') {
      const node = supplierId ? supplierMeta[supplierId] : null;
      if (node) {
  if (node.status) part.status = pickMoreAdvanced(part.status, node.status);
        if (node.estimated_delivery_date) part.estimated_delivery_date = node.estimated_delivery_date;
      }
    }
    return [part];
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
    const part = {
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
    };
    part.display_code = parentDisplayCode; // Payment Order code repeated for grouping
    part.part_display_code = shortCode(order.id + entry.sid, 'C');
    // Overlay estado/ETA desde meta si existe
    if (supplierMeta && supplierMeta[entry.sid]) {
      const node = supplierMeta[entry.sid];
  if (node.status) part.status = pickMoreAdvanced(part.status, node.status);
      if (node.estimated_delivery_date) part.estimated_delivery_date = node.estimated_delivery_date;
    }
    parts.push(part);
  });
  return parts;
}

export function splitManyOrders(orders) {
  if (!Array.isArray(orders)) return [];
  return orders.flatMap(o => splitOrderBySupplier(o));
}
