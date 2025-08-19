import { useState, useEffect, useCallback } from 'react';
import { orderService } from '../../../../services/user';

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

  const fetchOrders = useCallback(async (filters = {}) => {
    if (!buyerId) {
      setError('ID de comprador no disponible');
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      // Solo pedidos materializados (carts != active). Se ocultan payment orders.
      const classicOrders = await orderService.getOrdersForBuyer(buyerId, filters);
      if (DEBUG_BUYER_ORDERS) {
        // eslint-disable-next-line no-console
        console.log('[buyerOrders] loaded classic orders', classicOrders.length);
      }
      setOrders(classicOrders);
    } catch (err) {
      setError(err.message || 'Error al cargar los pedidos');
    } finally {
      setLoading(false);
    }
  }, [buyerId]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

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
