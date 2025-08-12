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

        // Fusionar: si un payment_order ya tiene su equivalente clásico (match por id?), de momento mostramos ambos.
        // Regla simple: mostrar payment orders primero cuando payment_status = pending
        const merged = [
          ...paymentOrders.filter(o => o.payment_status === 'pending'),
          ...classicOrders,
          ...paymentOrders.filter(o => o.payment_status !== 'pending'),
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
      await fetchOrders();
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
      // Refetch rápido ante cualquier cambio y reiniciar estrategia de polling
      pollAttemptRef.current = 0;
      fetchOrders();
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
