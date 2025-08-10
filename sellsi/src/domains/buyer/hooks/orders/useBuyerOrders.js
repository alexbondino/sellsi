import { useState, useEffect, useCallback } from 'react';
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
      // Si no hay un buyerId, no hacemos nada.
      if (!buyerId) {
        setError('ID de comprador no disponible');
        setLoading(false);
        return;
      }

      try {
        console.log('useBuyerOrders: Iniciando la búsqueda de pedidos...');
        setLoading(true);
        setError(null);

        // ======================================================================
        // PUNTO CLAVE DEL PASO 2
        // ======================================================================
        // Llamamos al servicio. El servicio es el responsable de aplicar
        // el filtro .neq('status', 'pending') en la consulta a la base de datos.
        // Por lo tanto, 'ordersData' ya vendrá con los pedidos correctos.
        const ordersData = await orderService.getOrdersForBuyer(
          buyerId,
          filters
        );

        console.log(
          `useBuyerOrders: Se encontraron ${ordersData.length} pedidos.`
        );
        setOrders(ordersData);
      } catch (err) {
        console.error('useBuyerOrders: Error al cargar los pedidos:', err);
        setError(err.message || 'Error al cargar los pedidos');
      } finally {
        setLoading(false);
      }
    },
    [buyerId]
  ); // La función se recalculará solo si el buyerId cambia.

  // Cargar los pedidos la primera vez que el componente se monta o cuando cambia el buyerId.
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]); // fetchOrders ya depende de buyerId gracias a useCallback.

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
