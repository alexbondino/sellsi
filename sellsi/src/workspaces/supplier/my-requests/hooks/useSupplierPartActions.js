import { useState, useCallback } from 'react';
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

  const transition = useCallback(
    async (part, newStatus, extra = {}) => {
      if (!part) return;
      setUpdating(true);
      setError(null);
      try {
        const orderId = part.parent_order_id || part.order_id;

        // 🔥 NUEVA LÓGICA: Detectar mono vs multi-supplier
        // Si no hay supplier_ids en el part, intentamos obtenerlos de la orden original
        let supplierIds = part.supplier_ids;

        if (!supplierIds) {
          // Fallback: obtener supplier_ids desde la base de datos
          const { data: orderData } = await supabase
            .from('orders')
            .select('supplier_ids')
            .eq('id', orderId)
            .single();
          supplierIds = orderData?.supplier_ids || [];
        }

        // Detectar si es mono-supplier (1 proveedor) vs multi-supplier (2+ proveedores)
        if (Array.isArray(supplierIds) && supplierIds.length === 1) {
          // ✅ MONO SUPPLIER: Usar flujo global (UpdateOrderStatus)
          console.log(
            `🎯 Mono-supplier detected for order ${orderId}, using global status update`
          );
          const res = await orderService.updateOrderStatus(
            orderId,
            newStatus,
            extra
          );
          setUpdating(false);
          return res;
        } else {
          // ✅ MULTI SUPPLIER: Usar flujo parcial existente (updateSupplierPartStatus)
          console.log(
            `🎯 Multi-supplier detected for order ${orderId}, using partial status update`
          );
          const res = await orderService.updateSupplierPartStatus(
            orderId,
            part.supplier_id,
            newStatus,
            extra
          );
          setUpdating(false);
          return res;
        }
      } catch (e) {
        setError(e.message || 'Error');
        setUpdating(false);
        throw e;
      }
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
