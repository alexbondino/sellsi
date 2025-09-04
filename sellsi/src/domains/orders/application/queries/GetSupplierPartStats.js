import { supplierOrdersRepository } from '../../infra/repositories/SupplierOrdersRepository';
import { isUUID } from '../../shared/validation';

// Estadísticas basadas en supplier_orders (modelo nuevo)
export async function GetSupplierPartStats(supplierId, period = {}) {
  if (!isUUID(supplierId)) throw new Error('ID proveedor inválido');
  const filters = { ...period };
  const { data, error } = await supplierOrdersRepository.listBySupplier(supplierId, filters);
  if (error) throw error;
  const rows = data || [];
  const deliveredFilter = r => r.status === 'delivered';
  const revenueStatuses = new Set(['accepted','in_transit','delivered']);
  return {
    total_orders: rows.length,
    pending: rows.filter(r => r.status === 'pending').length,
    accepted: rows.filter(r => r.status === 'accepted').length,
    rejected: rows.filter(r => r.status === 'rejected').length,
    in_transit: rows.filter(r => r.status === 'in_transit').length,
    delivered: rows.filter(deliveredFilter).length,
    cancelled: rows.filter(r => r.status === 'cancelled').length,
    total_revenue: rows.filter(r => revenueStatuses.has(r.status)).reduce((s,r)=> s + Number(r.total || 0), 0),
    total_items_sold: rows.filter(deliveredFilter).reduce((s,r)=> s + Number(r.total_items || 0), 0)
  };
}
