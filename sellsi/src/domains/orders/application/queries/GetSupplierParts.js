// DEPRECATED: Use dynamic derivation (splitOrderBySupplier) instead of persisted supplier_orders.
import { supplierOrdersRepository } from '../../infra/repositories/SupplierOrdersRepository';
import { parseOrderItems } from '../../shared/parsing';
import { isUUID } from '../../shared/validation';
import { supabase } from '../../../../services/supabase';

export async function GetSupplierParts(supplierId, filters = {}) {
  if (!isUUID(supplierId)) throw new Error('ID proveedor inválido');
  const { data: parts, error } = await supplierOrdersRepository.listBySupplier(supplierId, filters);
  if (error) throw error;
  if (!parts || parts.length === 0) return [];
  const parentIds = Array.from(new Set(parts.map(p => p.parent_order_id)));
  let parentMap = new Map();
  if (parentIds.length) {
    const { data: parents } = await supabase
      .from('orders')
      .select('id, items, payment_status, status, estimated_delivery_date, created_at, updated_at')
      .in('id', parentIds);
    (parents || []).forEach(p => parentMap.set(p.id, p));
  }
  return parts.map(part => {
    const parent = parentMap.get(part.parent_order_id) || {};
    const items = parseOrderItems(parent.items).filter(it => (it.supplier_id || it.supplierId) === part.supplier_id).map((it, idx) => ({
      cart_items_id: it.id || `${part.id}-itm-${idx}`,
      product_id: it.product_id || it.productid || it.id,
      quantity: it.quantity || 1,
      price_at_addition: Number(it.price_at_addition || it.price || 0),
      document_type: it.document_type || 'ninguno',
      product: { id: it.product_id || it.productid || it.id, name: it.name || 'Producto', price: Number(it.price_at_addition || it.price || 0) }
    }));
    return {
      order_id: part.id,
      parent_order_id: part.parent_order_id,
      supplier_id: part.supplier_id,
      status: part.status,
      payment_status: part.payment_status || parent.payment_status,
      created_at: part.created_at,
      updated_at: part.updated_at,
      estimated_delivery_date: part.estimated_delivery_date || parent.estimated_delivery_date,
      items,
      total_amount: Number(part.subtotal || 0),
      shipping_amount: Number(part.shipping_amount || 0),
      final_amount: Number(part.total || 0),
      is_supplier_part: true,
      is_payment_order: true
    };
  });
}
