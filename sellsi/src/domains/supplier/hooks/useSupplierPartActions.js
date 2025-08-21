import { useState, useCallback } from 'react';
import { orderService } from '../../../services/user';

/**
 * Hook para acciones de estado por parte de proveedor (Opción A 2.0)
 * Requiere supplierId (auth user) y objeto part (order split) con parent_order_id y supplier_id
 */
export function useSupplierPartActions(supplierId) {
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);

  const transition = useCallback(async (part, newStatus, extra = {}) => {
    if (!part) return;
    setUpdating(true); setError(null);
    try {
      const orderId = part.parent_order_id || part.order_id;
      const res = await orderService.updateSupplierPartStatus(orderId, part.supplier_id, newStatus, extra);
      setUpdating(false);
      return res;
    } catch (e) {
      setError(e.message || 'Error');
      setUpdating(false);
      throw e;
    }
  }, [supplierId]);

  return {
    updating,
    error,
    accept: (part) => transition(part, 'accepted'),
    reject: (part, reason) => transition(part, 'rejected', { rejected_reason: reason }),
    dispatch: (part, eta) => transition(part, 'in_transit', eta ? { estimated_delivery_date: eta } : {}),
    deliver: (part) => transition(part, 'delivered'),
    cancel: (part) => transition(part, 'cancelled'),
  };
}
