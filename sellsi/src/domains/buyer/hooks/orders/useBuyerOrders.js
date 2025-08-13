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

  // Usamos useCallback para memorizar la función y evitar re-renderizados innecesarios.
  const fetchOrders = useCallback(
    async (filters = {}) => {
      if (!buyerId) {
        setError('ID de comprador no disponible');
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError(null);

        // Pedidos tradicionales (carts ya convertidos en pedidos)
        const classicOrders = await orderService.getOrdersForBuyer(buyerId, filters);
        // Payment orders (tabla orders) incluyendo payment_status pending
        const paymentOrders = await orderService.getPaymentOrdersForBuyer(buyerId);

        // ================== DEDUPLICACIÓN DE ÓRDENES ==================
        // Objetivo: Mostrar SOLO 1 card. Mientras el pago está pendiente, se muestra la orden de pago.
        // Cuando el pago pasa a 'paid' y se materializa un pedido clásico (carts), ocultamos la orden de pago duplicada.
        // Sin columna de enlace (cart_id) en tabla orders, usamos heurísticas:
        //  - buyer_id igual
        //  - total_amount igual
        //  - overlap significativo de product_ids (>= 80%)
        //  - el pedido clásico creado después (o muy cerca) del payment order

        const classicBySignature = classicOrders.map(co => {
          const productIds = new Set(co.items.map(i => i.product_id));
          return {
            ref: co,
            total: co.total_amount,
            created: new Date(co.created_at).getTime(),
            productIds,
            size: productIds.size,
          };
        });

        const isLikelyMaterialized = (payOrd) => {
          if (payOrd.payment_status !== 'paid') return false; // solo deduplicar pagados
          const payCreated = new Date(payOrd.created_at).getTime();
            const payProducts = new Set(payOrd.items.map(i => i.product_id));
          const paySize = payProducts.size || 1;
          const WINDOW_MS = 1000 * 60 * 30; // 30 minutos ventana temporal

          return classicBySignature.some(sig => {
            if (Math.abs(sig.total - payOrd.total_amount) > 0.0001) return false;
            // tiempo: el clásico debe ser igual o posterior (o unos minutos antes si se reutilizó cart) dentro de ventana
            if (sig.created + WINDOW_MS < payCreated && payCreated - sig.created > WINDOW_MS) return false;
            // overlap de productos
            let overlap = 0;
            payProducts.forEach(p => { if (sig.productIds.has(p)) overlap++; });
            const overlapRatio = overlap / paySize;
            return overlapRatio >= 0.8; // heurística
          });
        };

        const filteredPayment = paymentOrders.filter(po => {
          if (po.payment_status === 'pending') return true; // siempre mostrar mientras procesa
          // si está pagado y NO encontramos aún un clásico similar, seguir mostrando hasta materialización
          return !isLikelyMaterialized(po);
        });

        // Orden final: pending payment orders primero, luego clásicos, luego payment orders pagados que aún no se materializan
        const merged = [
          ...filteredPayment.filter(o => o.payment_status === 'pending'),
          ...classicOrders,
          ...filteredPayment.filter(o => o.payment_status !== 'pending'),
        ];

        setOrders(merged);
      } catch (err) {
        setError(err.message || 'Error al cargar los pedidos');
      } finally {
        setLoading(false);
      }
    },
    [buyerId]
  );

  // Realtime subscription ref
  const subscriptionRef = useRef(null);
  // Polling control refs
  const pollAttemptRef = useRef(0);
  const pollTimeoutRef = useRef(null);

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
    return 30000; // 15+ forever
  };

  const scheduleNextPoll = () => {
    clearPollTimeout();
    const attempt = pollAttemptRef.current;
    const delay = getNextDelay(attempt);
    pollTimeoutRef.current = setTimeout(async () => {
      pollAttemptRef.current += 1;
      // Poll ligero: obtener solo estados y aplicar diffs
      try {
        const statuses = await orderService.getPaymentStatusesForBuyer(buyerId);
        if (Array.isArray(statuses) && statuses.length) {
          setOrders(prev => {
            // Map para rápido lookup
            const statusMap = new Map(statuses.map(s => [s.id, s.payment_status]));
            let changed = false;
            const next = prev.map(ord => {
              if (ord.is_payment_order && statusMap.has(ord.order_id)) {
                const newStatus = statusMap.get(ord.order_id);
                if (newStatus && newStatus !== ord.payment_status) {
                  changed = true;
                  return { ...ord, payment_status: newStatus };
                }
              }
              return ord;
            });
            return changed ? next : prev;
          });
        }
      } catch (_) {
        // Silencio: polling no debe romper UX
      }
      scheduleNextPoll();
    }, delay);
  };

  // Cargar los pedidos la primera vez que el componente se monta o cuando cambia el buyerId.
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Suscripción realtime a cambios en orders (payment_status)
  useEffect(() => {
    if (!buyerId) return;
    // Limpiar suscripción anterior
    if (subscriptionRef.current) {
      subscriptionRef.current();
    }
    subscriptionRef.current = orderService.subscribeToBuyerPaymentOrders(buyerId, () => {
      // Recalcular estados sin afectar loading global
      pollAttemptRef.current = 0;
      (async () => {
        try {
          const statuses = await orderService.getPaymentStatusesForBuyer(buyerId);
          if (Array.isArray(statuses) && statuses.length) {
            setOrders(prev => {
              const statusMap = new Map(statuses.map(s => [s.id, s.payment_status]));
              let changed = false;
              const next = prev.map(ord => {
                if (ord.is_payment_order && statusMap.has(ord.order_id)) {
                  const newStatus = statusMap.get(ord.order_id);
                  if (newStatus && newStatus !== ord.payment_status) {
                    changed = true;
                    return { ...ord, payment_status: newStatus };
                  }
                }
                return ord;
              });
              return changed ? next : prev;
            });
          }
        } catch (_) {}
      })();
    });
    return () => {
      if (subscriptionRef.current) subscriptionRef.current();
    };
  }, [buyerId, fetchOrders]);

  // Fallback polling escalonado (se ejecuta siempre; realtime reduce necesidad pero no la elimina)
  useEffect(() => {
    if (!buyerId) return;
    pollAttemptRef.current = 0;
    scheduleNextPoll();
    return () => {
      clearPollTimeout();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buyerId]);

  // --- El resto de tus funciones auxiliares no necesitan cambios ---

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

  // Devolvemos el estado y las funciones para que el componente las pueda usar.
  return {
    orders,
    loading,
    error,
    fetchOrders, // Exponemos la función por si se necesita recargar manualmente
    getProductImage,
    getStatusDisplayName,
    getStatusColor,
    formatDate,
    formatCurrency,
  };
};
