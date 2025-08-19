// Use case: Estadísticas de pedidos para un supplier (legacy carts)
import { cartsRepository } from '../../infra/repositories/CartsRepository';

export async function GetSupplierOrderStats(supplierId, period = {}) {
  const { data, error } = await cartsRepository.listSupplierCartsForStats(supplierId, period);
  if (error) throw error;
  const rows = data || [];
  return {
    total_orders: rows.length,
    pending: rows.filter(o => o.status === 'pending').length,
    accepted: rows.filter(o => o.status === 'accepted').length,
    rejected: rows.filter(o => o.status === 'rejected').length,
    in_transit: rows.filter(o => o.status === 'in_transit').length,
    delivered: rows.filter(o => o.status === 'delivered').length,
    cancelled: rows.filter(o => o.status === 'cancelled').length,
    total_revenue: rows
      .filter(o => ['accepted', 'in_transit', 'delivered'].includes(o.status))
      .reduce((sum, order) => sum + order.cart_items.reduce((s,i)=> s + (i.price_at_addition * i.quantity),0), 0),
    total_items_sold: rows
      .filter(o => o.status === 'delivered')
      .reduce((sum, order) => sum + order.cart_items.reduce((s,i)=> s + i.quantity,0), 0)
  };
}
