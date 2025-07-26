import { useState, useEffect } from 'react';
import { orderService } from '../../../../services/user';

/**
 * Hook para manejar pedidos del comprador
 * @param {string} buyerId - ID del comprador
 * @returns {Object} Estado y funciones para manejar pedidos
 */
export const useBuyerOrders = (buyerId) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Función para obtener pedidos
  const fetchOrders = async (filters = {}) => {
    if (!buyerId) {
      setError('ID de comprador no disponible');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const ordersData = await orderService.getOrdersForBuyer(buyerId, filters);
      setOrders(ordersData);
    } catch (err) {
      console.error('Error fetching buyer orders:', err);
      setError(err.message || 'Error al cargar los pedidos');
    } finally {
      setLoading(false);
    }
  };

  // Función para obtener la imagen del producto (prioriza thumbnail mobile)
  const getProductImage = (product) => {
    if (!product) return null;
    
    // Priorizar thumbnail mobile
    if (product.thumbnails) {
      try {
        const thumbnailData = typeof product.thumbnails === 'string' 
          ? JSON.parse(product.thumbnails) 
          : product.thumbnails;
        
        if (thumbnailData?.mobile) {
          return thumbnailData.mobile;
        }
      } catch (e) {
        console.warn('Error parsing thumbnails:', e);
      }
    }
    
    // Fallback a thumbnail_url
    if (product.thumbnail_url) {
      return product.thumbnail_url;
    }
    
    // Fallback a image_url
    if (product.image_url) {
      return product.image_url;
    }
    
    // Placeholder si no hay imagen
    return '/placeholder-product.jpg';
  };

  // Función para formatear el estado del pedido
  const getStatusDisplayName = (status) => {
    const statusMap = {
      'pending': 'Pendiente',
      'accepted': 'Aceptado',
      'rejected': 'Rechazado',
      'in_transit': 'En Tránsito',
      'delivered': 'Entregado',
      'cancelled': 'Cancelado'
    };
    return statusMap[status] || status;
  };

  // Función para obtener el color del estado
  const getStatusColor = (status) => {
    const colorMap = {
      'pending': 'warning',
      'accepted': 'info',
      'rejected': 'error',
      'in_transit': 'secondary',
      'delivered': 'success',
      'cancelled': 'default'
    };
    return colorMap[status] || 'default';
  };

  // Función para formatear fecha
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Función para formatear moneda
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(amount);
  };

  // Cargar pedidos al montar el componente
  useEffect(() => {
    fetchOrders();
  }, [buyerId]);

  return {
    orders,
    loading,
    error,
    fetchOrders,
    getProductImage,
    getStatusDisplayName,
    getStatusColor,
    formatDate,
    formatCurrency
  };
};
