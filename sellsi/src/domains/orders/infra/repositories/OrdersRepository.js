import { supabase } from '../../../../services/supabase';

// Encapsula queries a tabla 'orders'
export class OrdersRepository {
  async listByBuyer(buyerId, { limit, offset } = {}) {
    let query = supabase
      .from('orders')
      .select(`
          id,
          cart_id,
          payment_order_id,
          supplier_id,
          user_id,
          items,
          subtotal,
          tax,
          shipping,
          shipping_address,
          billing_address,
          total,
          currency,
          status,
          payment_status,
          estimated_delivery_date,
          payment_method,
          created_at,
          updated_at
        `)
      .eq('user_id', buyerId)
      .order('created_at', { ascending: false });
    if (typeof limit === 'number') {
      if (typeof offset === 'number') {
        const to = offset + limit - 1;
        query = query.range(offset, to);
      } else {
        query = query.limit(limit);
      }
    }
    return query;
  }

  async updateStatus(orderId, updateData) {
    return supabase
      .from('orders')
      .update(updateData)
      .eq('id', orderId)
      .select('*')
      .single();
  }

  async getMinimalStatuses(buyerId) {
    return supabase
      .from('orders')
      .select('id, payment_status, status, updated_at')
      .eq('user_id', buyerId)
      .order('updated_at', { ascending: false });
  }

  async getPaymentStatus(orderId) {
    return supabase
      .from('orders')
      .select('id, payment_status')
      .eq('id', orderId)
      .maybeSingle();
  }
}

export const ordersRepository = new OrdersRepository();
