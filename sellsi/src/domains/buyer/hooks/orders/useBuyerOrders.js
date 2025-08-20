import { useState, useEffect, useCallback, useRef } from 'react';
import { orderService } from '../../../../services/user';
import { isUUID } from '../../../orders/shared/validation';

/**
 * Hook para manejar los pedidos de un comprador.
 * Este hook obtiene únicamente los pedidos que ya no están en estado 'pending'.
 * @param {string | null} buyerId - ID del comprador.
 * @returns {Object} El estado y las funciones para manejar los pedidos.
 */
export const useBuyerOrders = buyerId => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const DEBUG_BUYER_ORDERS = false; // activar para ver logs diagnósticos

  const SHOW_UNPAID_PAYMENT_ORDERS = true; // feature flag
  const SPLIT_MODE = (import.meta.env?.VITE_SPLIT_MODE || 'virtual').toLowerCase(); // 'off' | 'virtual'
  const POLL_INTERVAL_MS = 15000;
  const pollRef = useRef(null);
  const lastRealtimeRef = useRef(Date.now());

  const SUPPLIER_PARTS_FRONT = (import.meta.env?.VITE_SUPPLIER_PARTS_ENABLED || '').toLowerCase() === 'true';
  // Cuando los supplier parts reales están habilitados, deshabilitamos automáticamente el split virtual
  const EFFECTIVE_SPLIT_MODE = SUPPLIER_PARTS_FRONT ? 'off' : SPLIT_MODE;

  const mergeAndSort = useCallback((legacy, payment) => {
    // Heurística: si existe payment order para mismo cart_id / order_id, ocultar legacy duplicada
    const paymentByCart = new Set(payment.map(p => p.cart_id).filter(Boolean));
    const dedupedLegacy = legacy.filter(l => !paymentByCart.has(l.cart_id));
    // Heurística transitoria de payment_status para legacy (mejora UX chips) si no existe
    const enrichedLegacy = dedupedLegacy.map(l => {
      if (l.payment_status) return l;
      let heuristic = 'pending';
      if (['accepted','in_transit','delivered'].includes(l.status)) heuristic = 'paid';
      else if (['cancelled','rejected'].includes(l.status)) heuristic = 'cancelled';
      return { ...l, payment_status: heuristic };
    });
    const all = [...enrichedLegacy, ...payment];
    const filtered = SHOW_UNPAID_PAYMENT_ORDERS ? all : all.filter(o => !o.is_payment_order || o.payment_status === 'paid');
    const ordered = filtered.sort((a,b)=> new Date(b.created_at) - new Date(a.created_at));

    // ============================
    // VIRTUAL SPLIT POR SUPPLIER
    // ============================
    // Reemplaza una payment order con N suppliers por N "sub-órdenes" virtuales
    // Conserva order_id original para que realtime updates funcionen; añade synthetic_id para key UI.
    const result = [];
    for (const o of ordered) {
      // Sólo aplicar a payment orders (is_payment_order true) con múltiples suppliers en items
  if (EFFECTIVE_SPLIT_MODE === 'off' || !o.is_payment_order || !Array.isArray(o.items) || o.items.length === 0) {
        result.push(o);
        continue;
      }
      // Agrupar por supplier_id (diversos formatos posibles)
      const groups = new Map();
      for (const it of o.items) {
        const sid = it.product?.supplier?.id || it.product?.supplier_id || it.supplier_id || it.product?.supplierId || null;
        if (!sid) {
          // Si no hay supplierId, no se puede dividir de forma confiable; aborta división completa
          groups.clear();
          break;
        }
        if (!groups.has(sid)) groups.set(sid, []);
        groups.get(sid).push(it);
      }
      if (groups.size <= 1 || groups.size === 0) {
        // Nada que dividir
        result.push(o);
        continue;
      }
      // Calcular subtotales por supplier
      const supplierSubtotals = [];
      for (const [sid, items] of groups.entries()) {
        const subtotal = items.reduce((acc, it) => {
          const unit = (typeof it.price_at_addition === 'number' && Number.isFinite(it.price_at_addition))
            ? it.price_at_addition
            : (typeof it.product?.price === 'number' && Number.isFinite(it.product.price)) ? it.product.price : 0;
          return acc + unit * (it.quantity || 0);
        }, 0);
        supplierSubtotals.push({ sid, items, subtotal });
      }
      const totalSubtotal = supplierSubtotals.reduce((s, x) => s + x.subtotal, 0) || 1;
      const shippingTotal = Number(o.shipping_amount || o.shipping || 0);
      // Prorrateo de shipping (último absorbe residuo)
      let accShip = 0;
      supplierSubtotals.forEach((entry, idx) => {
        if (shippingTotal <= 0) entry.shippingAlloc = 0;
        else if (idx === supplierSubtotals.length - 1) entry.shippingAlloc = Math.max(0, shippingTotal - accShip);
        else {
          const alloc = Math.round(shippingTotal * (entry.subtotal / totalSubtotal));
          entry.shippingAlloc = alloc; accShip += alloc;
        }
      });
      // Crear sub-órdenes virtuales
      supplierSubtotals.forEach(entry => {
        const supplierName = entry.items[0]?.product?.supplier?.name || entry.items[0]?.product?.proveedor || null;
        result.push({
          ...o,
          synthetic: true,
            parent_order_id: o.order_id,
          synthetic_id: `${o.order_id}-${entry.sid}`,
          supplier_id: entry.sid,
          supplier_name: supplierName,
          items: entry.items,
          // Sobrescribir montos a nivel sub-orden para UI
          total_amount: entry.subtotal,
          shipping_amount: entry.shippingAlloc,
          // Marcar que no es legacy cart aunque comparta order_id
          is_virtual_split: true,
        });
      });
    }
    return result;
  }, [SHOW_UNPAID_PAYMENT_ORDERS]);

  const fetchOrders = useCallback(async (filters = {}) => {
    if (!buyerId || !isUUID(buyerId)) {
      // Aseguramos que no quede spinner infinito si buyerId aún no está listo.
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const [legacy, payment, supplierParts] = await Promise.all([
        SUPPLIER_PARTS_FRONT ? Promise.resolve([]) : orderService.getOrdersForBuyer(buyerId, filters).catch(()=>[]),
        // No silenciar completamente: loggear para diagnóstico.
        orderService.getPaymentOrdersForBuyer(buyerId, filters).catch(e => {
          console.error('[buyerOrders][paymentOrders] error', e);
          setError(prev => prev || e.message || 'Error cargando payment orders');
          return [];
        }),
        import('../../../../domains/orders/application/queries/GetBuyerSupplierOrders')
          .then(m => m.GetBuyerSupplierOrders(buyerId, filters))
          .catch(()=>[])
      ]);
      if (DEBUG_BUYER_ORDERS) {
        // eslint-disable-next-line no-console
        console.log('[buyerOrders] legacy', legacy.length, 'payment', payment.length, 'supplierParts', supplierParts.length);
      }
      // Diagnóstico precios 0
      legacy.concat(payment).forEach(o => {
        (o.items||[]).forEach(it => {
          if (it.price_at_addition === 0 && it.quantity > 0) {
            // eslint-disable-next-line no-console
            console.warn('[buyerOrders][WARN] price_at_addition=0', { order_id: o.order_id, product_id: it.product_id, quantity: it.quantity, pricing_warning: it.pricing_warning });
          }
        });
      });
      // If real supplier parts exist for certain parent orders, replace corresponding payment order entries with parts (skip virtual split for them)
      let merged = mergeAndSort(legacy, payment);
      if (supplierParts.length) {
        const parentIdsWithParts = new Set(supplierParts.map(p => p.parent_order_id));
        // Remove original payment order rows whose parent has parts (will be replaced by parts list)
        merged = merged.filter(o => !(o.is_payment_order && !o.is_supplier_part && parentIdsWithParts.has(o.order_id)));
        // Insert parts (they'll already have per-supplier amounts)
        merged = [...merged, ...supplierParts];
        // Re-sort by created_at
        merged.sort((a,b)=> new Date(b.created_at) - new Date(a.created_at));
      }
      setOrders(merged);
      if (merged.length === 0 && !error) {
        // Pista diagnóstica rápida en consola.
        console.warn('[buyerOrders] Resultado vacío tras merge. Verificar flags, RLS o errores previos en consola.');
      }
    } catch (err) {
      setError(err.message || 'Error al cargar los pedidos');
    } finally {
      setLoading(false);
    }
  }, [buyerId, mergeAndSort]);

  // Initial load
  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  // Realtime subscription for payment orders (payment_status updates)
  useEffect(() => {
    if (!buyerId || !isUUID(buyerId)) return;
    const unsubscribe = orderService.subscribeToBuyerPaymentOrders(buyerId, payload => {
      lastRealtimeRef.current = Date.now();
      if (payload.eventType === 'UPDATE') {
        const row = payload.new;
        setOrders(prev => prev.map(o => o.order_id === row.id ? { ...o, payment_status: row.payment_status, updated_at: row.updated_at } : o));
      } else if (payload.eventType === 'INSERT') {
        // Podría ser nueva payment order: refetch ligero
        fetchOrders();
      }
    });
    return () => { try { unsubscribe(); } catch(_) {} };
  }, [buyerId, fetchOrders]);

  // Poll fallback if realtime silent and there are pending payments
  useEffect(() => {
    if (!buyerId || !isUUID(buyerId)) return;
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      const hasPending = orders.some(o => o.is_payment_order && o.payment_status !== 'paid');
      if (!hasPending) return; // stop polling until a pending exists
      if (Date.now() - lastRealtimeRef.current < POLL_INTERVAL_MS * 2) return; // recent realtime
      try {
        const statuses = await orderService.getPaymentStatusesForBuyer(buyerId);
        if (Array.isArray(statuses)) {
          setOrders(prev => prev.map(o => {
            const st = statuses.find(s => s.id === o.order_id);
            return st ? { ...o, payment_status: st.payment_status, status: o.status } : o;
          }));
        }
      } catch(_) {}
    }, POLL_INTERVAL_MS);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [buyerId, orders]);

  const getProductImage = product => {
    if (!product) return null;
    if (product.thumbnails) {
      try {
        const thumbnailData =
          typeof product.thumbnails === 'string'
            ? JSON.parse(product.thumbnails)
            : product.thumbnails;
        if (thumbnailData?.mobile) return thumbnailData.mobile;
      } catch (e) {
        console.warn('Error parsing thumbnails:', e);
      }
    }
    return (
      product.thumbnail_url || product.image_url || '/placeholder-product.jpg'
    );
  };

  const getStatusDisplayName = status => {
    const statusMap = {
      pending: 'Pendiente',
      accepted: 'Aceptado',
      rejected: 'Rechazado',
      in_transit: 'En Tránsito',
      delivered: 'Entregado',
      paid: 'Pagado',
      cancelled: 'Cancelado',
      expired: 'Expirado',
    };
    return statusMap[status] || status;
  };

  const getStatusColor = status => {
    const colorMap = {
      pending: 'warning',
      accepted: 'info',
      rejected: 'error',
      in_transit: 'secondary',
      delivered: 'success',
      paid: 'primary',
      cancelled: 'default',
      expired: 'default',
    };
    return colorMap[status] || 'default';
  };

  const formatDate = dateString => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatCurrency = amount => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
    }).format(amount);
  };

  return { orders, loading, error, fetchOrders, getProductImage, getStatusDisplayName, getStatusColor, formatDate, formatCurrency };
};
