import { supabase } from '../../../../services/supabase';

// Repository for supplier_orders (per-supplier decomposition of parent orders)
// NOTE: Filtering by buyer requires joining to parent orders table. For simplicity and to avoid a view,
// we provide a helper to fetch all supplier_orders for parent orders belonging to a buyer via two-step process.
export class SupplierOrdersRepository {
  async listByBuyerParentOrders(buyerId, { limit, offset } = {}) {
    // Step 1: fetch parent order ids for this buyer (bounded by optional limit/offset for outer pagination)
    let base = supabase.from('orders').select('id').eq('user_id', buyerId).order('created_at', { ascending: false });
    if (typeof limit === 'number') {
      if (typeof offset === 'number') base = base.range(offset, offset + limit - 1); else base = base.limit(limit);
    }
    const { data: parentIds, error: parentErr } = await base;
    if (parentErr) return { data: null, error: parentErr };
    if (!parentIds || parentIds.length === 0) return { data: [], error: null };
    const ids = parentIds.map(r => r.id);
    // Step 2: fetch supplier orders for those parents
    const { data, error } = await supabase
      .from('supplier_orders')
      .select(`
        id,
        parent_order_id,
        supplier_id,
        status,
        payment_status,
        estimated_delivery_date,
        subtotal,
        shipping_amount,
        total,
        financing_amount,
        created_at,
        updated_at
      `)
      .in('parent_order_id', ids);
    if (error) return { data: null, error };
    return { data, error: null };
  }

  async listBySupplier(supplierId, { limit, offset } = {}) {
    let query = supabase
      .from('supplier_orders')
      .select(`
        id,
        parent_order_id,
        supplier_id,
        status,
        payment_status,
        estimated_delivery_date,
        subtotal,
        shipping_amount,
        total,
        financing_amount,
        created_at,
        updated_at
      `)
      .eq('supplier_id', supplierId)
      .order('created_at', { ascending: false });
    if (typeof limit === 'number') {
      if (typeof offset === 'number') query = query.range(offset, offset + limit - 1); else query = query.limit(limit);
    }
    return query;
  }

  async getPartById(partId) {
    return supabase
      .from('supplier_orders')
      .select('id, parent_order_id, supplier_id, status, payment_status, estimated_delivery_date')
      .eq('id', partId)
      .maybeSingle();
  }
}

export const supplierOrdersRepository = new SupplierOrdersRepository();
