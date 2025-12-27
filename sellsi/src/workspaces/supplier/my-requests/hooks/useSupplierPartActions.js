import { useState, useCallback, useRef } from 'react';
import { orderService } from '../../../../services/user';
import { supabase } from '../../../../services/supabase';

/**
 * Hook para acciones de estado por parte de proveedor (Opción A 2.0)
 * Requiere supplierId (auth user) y objeto part (order split) con parent_order_id y supplier_id
 *
 * FIXED: Ahora detecta mono vs multi-supplier para usar el flujo correcto
 */
export function useSupplierPartActions(supplierId) {
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);
  // Track in-flight promises per order to dedupe concurrent transitions
  const inFlightRef = useRef(new Map());

  const transition = useCallback(
    (part, newStatus, extra = {}) => {
      if (!part) return;
      const orderId = part.parent_order_id || part.order_id;

      // If there's already an in-flight operation for this order, return the same promise (dedupe)
      if (inFlightRef.current.has(orderId)) {
        return inFlightRef.current.get(orderId);
      }

      const p = (async () => {
        setUpdating(true);
        setError(null);
        try {
          // If supplier_ids are missing, fetch them from DB
          let supplierIds = part.supplier_ids;

          if (!supplierIds) {
            const { data: orderData } = await supabase
              .from('orders')
              .select('supplier_ids')
              .eq('id', orderId)
              .single();
            supplierIds = orderData?.supplier_ids || [];
          }

          if (Array.isArray(supplierIds) && supplierIds.length === 1) {
            console.log(
              `🎯 Mono-supplier detected for order ${orderId}, using global status update`
            );
            const res = await orderService.updateOrderStatus(orderId, newStatus, extra);
            return res;
          } else {
            console.log(
              `🎯 Multi-supplier detected for order ${orderId}, using partial status update`
            );
            const res = await orderService.updateSupplierPartStatus(
              orderId,
              part.supplier_id,
              newStatus,
              extra
            );
            return res;
          }
        } catch (e) {
          setError(e.message || 'Error');
          throw e;
        } finally {
          setUpdating(false);
          inFlightRef.current.delete(orderId);
        }
      })();

      inFlightRef.current.set(orderId, p);
      return p;
    },
    [supplierId]
  );

  return {
    updating,
    error,
    accept: part => transition(part, 'accepted'),
    reject: (part, reason) =>
      transition(part, 'rejected', { rejected_reason: reason }),
    dispatch: (part, eta) =>
      transition(
        part,
        'in_transit',
        eta ? { estimated_delivery_date: eta } : {}
      ),
    deliver: part => transition(part, 'delivered'),
    cancel: (part, reason) =>
      transition(part, 'cancelled', reason ? { cancel_reason: reason } : {}),
  };
}
