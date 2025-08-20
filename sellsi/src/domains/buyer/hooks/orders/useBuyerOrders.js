import { useState, useEffect, useCallback, useRef } from 'react';
import { orderService } from '../../../../services/user';
import { isUUID } from '../../../orders/shared/validation';
import { splitOrderBySupplier } from '../../../orders/shared/splitOrderBySupplier';

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
  const POLL_INTERVAL_MS = 15000;
  const pollRef = useRef(null);
  const lastRealtimeRef = useRef(Date.now());

  const mergeAndSplit = useCallback((payment) => {
    // 1. Ordenar por fecha
    const ordered = payment.sort((a,b)=> new Date(b.created_at) - new Date(a.created_at));
    // 2. Para cada payment order aplicar split derivado.
    const parts = ordered.flatMap(o => splitOrderBySupplier({
      ...o,
      id: o.order_id || o.id // asegurar campo id para util
    }));
    // 3. Rule: Si sólo hay una parte para la order, dejamos esa (sin synthetic flag is_supplier_part=false)
    // splitOrderBySupplier ya maneja esto.
    // 4. Dedupe defensivo (por si llega duplicada la order completa). Clave: parent_order_id+supplier_id (o solo parent).
    const map = new Map();
    for (const p of parts) {
      const key = p.parent_order_id + (p.supplier_id ? `-${p.supplier_id}` : '');
      if (!map.has(key)) map.set(key, p);
    }
    const result = Array.from(map.values()).sort((a,b)=> new Date(b.created_at) - new Date(a.created_at));
    if (DEBUG_BUYER_ORDERS) console.log('[useBuyerOrders] parts', result.length);
    return result;
  }, [DEBUG_BUYER_ORDERS]);

  const fetchOrders = useCallback(async (filters = {}) => {
    if (!buyerId || !isUUID(buyerId)) {
      // Aseguramos que no quede spinner infinito si buyerId aún no está listo.
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const payment = await orderService.getPaymentOrdersForBuyer(buyerId, filters).catch(e => {
          console.error('[buyerOrders][paymentOrders] error', e);
          setError(prev => prev || e.message || 'Error cargando payment orders');
          return [];
        });
      // Diagnóstico precios 0 (sobre payment orders)
      payment.forEach(o => {
        (o.items||[]).forEach(it => {
          if (it.price_at_addition === 0 && it.quantity > 0) {
            // eslint-disable-next-line no-console
            console.warn('[buyerOrders][WARN] price_at_addition=0', { order_id: o.order_id, product_id: it.product_id, quantity: it.quantity, pricing_warning: it.pricing_warning });
          }
        });
      });
      const split = mergeAndSplit(payment);
      setOrders(split);
      if (split.length === 0 && !error) {
        // Pista diagnóstica rápida en consola.
        console.warn('[buyerOrders] Resultado vacío tras merge. Verificar flags, RLS o errores previos en consola.');
      }
    } catch (err) {
      setError(err.message || 'Error al cargar los pedidos');
    } finally {
      setLoading(false);
    }
  }, [buyerId, mergeAndSplit, error]);

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
