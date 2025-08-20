import { supplierOrdersRepository } from '../../infra/repositories/SupplierOrdersRepository';
import { ordersRepository } from '../../infra/repositories/OrdersRepository';
import { parseOrderItems } from '../../shared/parsing';

// Fetch real supplier_orders (order parts) for a buyer if any parent orders have parts.
export async function GetBuyerSupplierOrders(buyerId, { limit, offset } = {}) {
  const { data: parts, error } = await supplierOrdersRepository.listByBuyerParentOrders(buyerId, { limit, offset });
  if (error) throw error;
  if (!parts || parts.length === 0) return [];
  const { data: parents, error: parentErr } = await ordersRepository.listByBuyer(buyerId, {});
  if (parentErr) throw parentErr;
  const parentMap = new Map((parents||[]).map(p => [p.id, p]));
  const results = [];
  for (const p of parts) {
    const parent = parentMap.get(p.parent_order_id);
    if (!parent) continue;
    const itemsRaw = parseOrderItems(parent.items);
    const items = itemsRaw.filter(it => (it.supplier_id || it.supplierId) === p.supplier_id)
      .map((it, idx) => ({
        cart_items_id: it.cart_items_id || it.id || `${p.id}-itm-${idx}`,
        product_id: it.product_id || it.productid || it.id,
        quantity: it.quantity || 1,
        price_at_addition: Number(it.price_at_addition || it.price || 0),
        document_type: it.document_type || it.documentType || 'ninguno',
        product: {
          id: it.product_id || it.productid || it.id,
          name: it.name || it.productnm || 'Producto',
          price: Number(it.price_at_addition || it.price || 0),
          supplier_id: it.supplier_id || null,
          supplier: { name: it.supplier_name || 'Proveedor', verified: !!it.supplierVerified },
          proveedor: it.supplier_name || 'Proveedor'
        }
      }));
    results.push({
      order_id: parent.id,
      parent_order_id: parent.id,
      supplier_order_id: p.id,
      supplier_id: p.supplier_id,
      status: p.status,
      payment_status: p.payment_status || parent.payment_status,
      created_at: p.created_at,
      updated_at: p.updated_at,
      estimated_delivery_date: p.estimated_delivery_date || parent.estimated_delivery_date || null,
      items,
      total_amount: Number(p.subtotal || 0),
      subtotal: Number(p.subtotal || 0),
      shipping_amount: Number(p.shipping_amount || 0),
      final_amount: Number(p.total || (p.subtotal + p.shipping_amount) || 0),
      is_payment_order: true,
      is_supplier_part: true
    });
  }
  return results;
}
