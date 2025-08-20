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
  const POLL_INTERVAL_MS = 15000;
  const pollRef = useRef(null);
  const lastRealtimeRef = useRef(Date.now());

  const mergeAndSort = useCallback((legacy, payment) => {
    const all = [...legacy, ...payment];
    // Opcional: ocultar payment no pagadas
    const filtered = SHOW_UNPAID_PAYMENT_ORDERS ? all : all.filter(o => !o.is_payment_order || o.payment_status === 'paid');
    return filtered.sort((a,b)=> new Date(b.created_at) - new Date(a.created_at));
  }, [SHOW_UNPAID_PAYMENT_ORDERS]);

  const fetchOrders = useCallback(async (filters = {}) => {
    if (!buyerId || !isUUID(buyerId)) {
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const [legacy, payment] = await Promise.all([
        orderService.getOrdersForBuyer(buyerId, filters).catch(()=>[]),
        orderService.getPaymentOrdersForBuyer(buyerId, filters).catch(()=>[])
      ]);
      if (DEBUG_BUYER_ORDERS) {
        // eslint-disable-next-line no-console
        console.log('[buyerOrders] legacy', legacy.length, 'payment', payment.length);
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
      setOrders(mergeAndSort(legacy, payment));
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
