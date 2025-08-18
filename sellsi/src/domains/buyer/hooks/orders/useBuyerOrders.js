import { useState, useEffect, useCallback, useRef } from 'react';
import { orderService } from '../../../../services/user'; // Asegúrate de que la ruta sea correcta

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
  const DEBUG_BUYER_ORDERS = false; // activar para ver logs diagnósticos en consola
  // TTL (debe coincidir con la ventana backend) para expirar payment orders pendientes
  const PAYMENT_PENDING_TTL_MS = 20 * 60 * 1000; // 20 minutos (alineado con backend fallback)
  const nowRef = () => Date.now();

  // Refs / control de realtime + polling
  const subscriptionRef = useRef(null);
  const pollAttemptRef = useRef(0);
  const pollTimeoutRef = useRef(null);
  const pollingDisabledRef = useRef(false); // desactiva polling cuando no hay payment orders pendientes

  const clearPollTimeout = () => {
    if (pollTimeoutRef.current) {
      clearTimeout(pollTimeoutRef.current);
      pollTimeoutRef.current = null;
    }
  };

  const getNextDelay = (attempt) => {
    if (attempt < 5) return 5000; // 0-4
    if (attempt < 10) return 10000; // 5-9
    if (attempt < 15) return 15000; // 10-14
    return 30000; // 15+
  };

  const hasPendingPaymentOrders = useCallback(
    list => (list || []).some(o => o.is_payment_order && o.payment_status === 'pending'),
    []
  );

  const scheduleNextPoll = useCallback(() => {
    if (pollingDisabledRef.current) return; // no programar si está desactivado
    clearPollTimeout();
    const attempt = pollAttemptRef.current;
    const delay = getNextDelay(attempt);
    pollTimeoutRef.current = setTimeout(async () => {
      pollAttemptRef.current += 1;
      try {
        const statuses = await orderService.getPaymentStatusesForBuyer(buyerId);
        if (Array.isArray(statuses) && statuses.length) {
          setOrders(prev => {
            const statusMap = new Map(statuses.map(s => [s.id, s.payment_status]));
            let changed = false;
            const paymentOrders = []; const classicOrders = [];
            prev.forEach(o => {
              if (o.is_payment_order) {
                if (statusMap.has(o.order_id)) {
                  const ns = statusMap.get(o.order_id);
                  if (ns && ns !== o.payment_status) { changed = true; paymentOrders.push({ ...o, payment_status: ns }); } else paymentOrders.push(o);
                } else paymentOrders.push(o);
              } else classicOrders.push(o);
            });
            if (changed) {
              const merged = mergeAndDedupe(paymentOrders, classicOrders);
              evaluatePollingState(merged);
              return merged;
            }
            return prev;
          });
        }
      } catch (_) { /* silencioso */ }
      scheduleNextPoll();
    }, delay);
  }, [buyerId]);

  const evaluatePollingState = useCallback(
    list => {
      const hasPending = hasPendingPaymentOrders(list);
      if (!hasPending && !pollingDisabledRef.current) {
        clearPollTimeout();
        pollingDisabledRef.current = true;
      } else if (hasPending && pollingDisabledRef.current) {
        pollingDisabledRef.current = false;
        pollAttemptRef.current = 0;
        scheduleNextPoll();
      }
    },
    [hasPendingPaymentOrders, scheduleNextPoll]
  );

  // ============= mergeAndDedupe (función pura reutilizable) =============
  const mergeAndDedupe = useCallback((paymentOrders, classicOrders) => {
    const classicBySignature = classicOrders.map(co => {
      const productIds = new Set(co.items.map(i => i.product_id));
      return { created: new Date(co.created_at).getTime(), productIds, cart_id: co.cart_id };
    });
    const isLikelyMaterialized = (payOrd) => {
      if (payOrd.payment_status !== 'paid') return false;
      if (payOrd.cart_id && classicOrders.some(c => c.cart_id === payOrd.cart_id)) return true;
      if (payOrd.cart_id) return false; // tiene cart_id pero el clásico aún no llegó
      const payCreated = new Date(payOrd.created_at).getTime();
      const payProducts = new Set(payOrd.items.map(i => i.product_id));
      const paySize = payProducts.size || 1;
  const WINDOW_MS = 1000 * 60 * 60 * 6; // 6 horas (ampliado para carritos antiguos)
      return classicBySignature.some(sig => {
        if (Math.abs(sig.created - payCreated) > WINDOW_MS) return false;
        let overlap = 0; payProducts.forEach(p => { if (sig.productIds.has(p)) overlap++; });
        return (overlap / paySize) >= 0.6;
      });
    };
    const filteredPayment = paymentOrders
      .map(po => {
        const createdTs = po.created_at ? new Date(po.created_at).getTime() : 0;
        const expiresAt = createdTs ? createdTs + PAYMENT_PENDING_TTL_MS : 0;
        const isStalePending = po.payment_status === 'pending' && createdTs && nowRef() > expiresAt;
        if (isStalePending) return { ...po, payment_status: 'expired', expired_locally: true };
        return po;
      })
      .filter(po => {
        if (po.payment_status === 'pending') return true;
        if (po.payment_status === 'expired') return false;
        return !isLikelyMaterialized(po);
      });
    const merged = [
      ...filteredPayment.filter(o => o.payment_status === 'pending'),
      ...classicOrders,
      ...filteredPayment.filter(o => o.payment_status !== 'pending'),
    ];
    if (DEBUG_BUYER_ORDERS) {
      // eslint-disable-next-line no-console
      console.log('[buyerOrders] mergeAndDedupe', {
        paymentOrders: paymentOrders.length,
        classicOrders: classicOrders.length,
        visible: merged.length,
        pendingPayment: filteredPayment.filter(o => o.payment_status === 'pending').length
      });
    }
    return merged;
  }, [PAYMENT_PENDING_TTL_MS]);

  // Usamos useCallback para memorizar la función y evitar re-renderizados innecesarios.
  const fetchOrders = useCallback(async (filters = {}) => {
    if (!buyerId) {
      setError('ID de comprador no disponible');
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const [classicOrders, paymentOrders] = await Promise.all([
        orderService.getOrdersForBuyer(buyerId, filters),
        orderService.getPaymentOrdersForBuyer(buyerId)
      ]);
      const merged = mergeAndDedupe(paymentOrders, classicOrders);
      if (DEBUG_BUYER_ORDERS) {
        // eslint-disable-next-line no-console
        console.log('[buyerOrders] fetchOrders merged count', merged.length);
      }
      setOrders(merged);
      evaluatePollingState(merged);
    } catch (err) {
      setError(err.message || 'Error al cargar los pedidos');
    } finally {
      setLoading(false);
    }
  }, [buyerId, evaluatePollingState, mergeAndDedupe]);

  // Cargar los pedidos la primera vez que el componente se monta o cuando cambia el buyerId.
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Suscripción realtime a cambios en orders (payment_status)
  useEffect(() => {
    if (!buyerId) return;
    if (subscriptionRef.current) {
      subscriptionRef.current();
    }
    subscriptionRef.current = orderService.subscribeToBuyerPaymentOrders(buyerId, () => {
      pollAttemptRef.current = 0;
      (async () => {
        try {
          const statuses = await orderService.getPaymentStatusesForBuyer(buyerId);
          if (Array.isArray(statuses) && statuses.length) {
            setOrders(prev => {
              const statusMap = new Map(statuses.map(s => [s.id, s.payment_status]));
              let changed = false;
              const paymentOrders = []; const classicOrders = [];
              prev.forEach(o => {
                if (o.is_payment_order) {
                  if (statusMap.has(o.order_id)) {
                    const ns = statusMap.get(o.order_id);
                    if (ns && ns !== o.payment_status) { changed = true; paymentOrders.push({ ...o, payment_status: ns }); } else paymentOrders.push(o);
                  } else paymentOrders.push(o);
                } else classicOrders.push(o);
              });
              if (changed) {
                const merged = mergeAndDedupe(paymentOrders, classicOrders);
                evaluatePollingState(merged);
                return merged;
              }
              return prev;
            });
          }
        } catch (_) {}
      })();
    });
    return () => {
      if (subscriptionRef.current) subscriptionRef.current();
    };
  }, [buyerId, fetchOrders, evaluatePollingState]);

  // Fallback polling escalonado (solo activo mientras existan payment orders pendientes)
  useEffect(() => {
    if (!buyerId) return;
    pollingDisabledRef.current = false; // reset al cambiar buyer
    pollAttemptRef.current = 0;
    scheduleNextPoll();
    return () => {
      clearPollTimeout();
    };
  }, [buyerId, scheduleNextPoll]);

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

  return {
    orders,
    loading,
    error,
    fetchOrders,
    getProductImage,
    getStatusDisplayName,
    getStatusColor,
    formatDate,
    formatCurrency,
  };
};
