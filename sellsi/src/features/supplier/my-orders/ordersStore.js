import { create } from 'zustand';
import { orderService } from '../../../services/orderService';

// Función para calcular si un pedido está atrasado
const calculateIsLate = order => {
  const currentDate = new Date();
  const endDate = new Date(order.requestedDate?.end || order.created_at);
  const excludedStatuses = ['delivered', 'cancelled', 'rejected'];

  return currentDate > endDate && !excludedStatuses.includes(order.status);
};

// Store de Zustand con integración completa al backend
export const useOrdersStore = create((set, get) => ({
  // Estado
  orders: [],
  loading: true,
  statusFilter: 'Todos',
  error: null,
  supplierId: null,
  stats: null,

  // Estado adicional para sincronización
  lastFetch: null,
  isRefreshing: false,

  // === CONFIGURACIÓN INICIAL ===

  // Inicializar con ID del proveedor
  initializeWithSupplier: supplierId => {
    set({ supplierId });
    get().fetchOrders();
  },

  // === ACCIONES PRINCIPALES ===

  // Obtener pedidos desde el backend
  fetchOrders: async (filters = {}) => {
    const { supplierId } = get();

    if (!supplierId) {
      set({ error: 'ID de proveedor no configurado', loading: false });
      return;
    }

    set({ loading: true, error: null });

    try {
      // Obtener pedidos desde el backend
      const backendOrders = await orderService.getOrdersForSupplier(
        supplierId,
        filters
      );

      // Procesar y enriquecer los datos
      const processedOrders = backendOrders.map(order => ({
        ...order,
        // Convertir status del backend al formato de UI
        status: orderService.getStatusDisplayName(order.status),
        // Calcular si está atrasado
        isLate: calculateIsLate(order),
        // Asegurar formato de dirección
        deliveryAddress: order.delivery_address || {
          street: 'Dirección no especificada',
          city: 'Ciudad no especificada',
          region: 'Región no especificada',
        },
        // Asegurar formato de fecha de entrega
        requestedDate: order.requested_date || {
          start: order.created_at,
          end: order.created_at,
        },
        // Mapear productos al formato esperado por la UI
        products:
          order.items?.map(item => ({
            name: item.product.name,
            quantity: item.quantity,
            price: item.price_at_addition,
          })) || [],
      }));

      set({
        orders: processedOrders,
        loading: false,
        lastFetch: new Date().toISOString(),
      });

      // Obtener estadísticas también
      get().fetchStats();
    } catch (error) {
      console.error('❌ Error fetching orders:', error);
      set({
        error: `Error al cargar los pedidos: ${error.message}`,
        loading: false,
      });
    }
  },

  // Refrescar pedidos
  refreshOrders: async () => {
    set({ isRefreshing: true });
    await get().fetchOrders();
    set({ isRefreshing: false });
  },

  // Obtener estadísticas del proveedor
  fetchStats: async (period = {}) => {
    const { supplierId } = get();

    if (!supplierId) return;

    try {
      const stats = await orderService.getOrderStats(supplierId, period);
      set({ stats });
    } catch (error) {
      console.error('❌ Error fetching stats:', error);
      // No mostrar error aquí porque las estadísticas son secundarias
    }
  },

  // Actualizar estado de pedido con backend
  updateOrderStatus: async (orderId, newStatus, additionalData = {}) => {
    try {
      // Optimistic update - actualizar UI inmediatamente
      set(state => {
        const updatedOrders = state.orders.map(order => {
          if (order.order_id === orderId) {
            const updatedOrder = {
              ...order,
              status: newStatus,
              ...additionalData,
            };

            // Si el nuevo status es 'En Ruta', actualizar estimated_delivery_date
            if (
              newStatus === 'En Ruta' &&
              additionalData.estimated_delivery_date
            ) {
              updatedOrder.estimated_delivery_date =
                additionalData.estimated_delivery_date;
            }

            // Recalcular isLate con el nuevo estado
            updatedOrder.isLate = calculateIsLate(updatedOrder);

            return updatedOrder;
          }
          return order;
        });

        return { orders: updatedOrders };
      });

      // Actualizar en el backend
      const result = await orderService.updateOrderStatus(
        orderId,
        newStatus,
        additionalData
      );

      if (!result.success) {
        throw new Error(result.message || 'Error actualizando pedido');
      }

      // Refrescar datos para asegurar sincronización
      setTimeout(() => {
        get().refreshOrders();
      }, 1000);

      return result;
    } catch (error) {
      console.error('❌ Error updating order status:', error);

      // Revertir cambio optimista en caso de error
      await get().fetchOrders();

      throw new Error(`Error actualizando pedido: ${error.message}`);
    }
  },

  // === FILTROS Y BÚSQUEDA ===

  setStatusFilter: filter => {
    set({ statusFilter: filter });
  },

  // Buscar pedidos por texto
  searchOrders: async searchText => {
    const { supplierId } = get();

    if (!supplierId || !searchText.trim()) {
      get().fetchOrders();
      return;
    }

    set({ loading: true });

    try {
      const searchResults = await orderService.searchOrders(
        supplierId,
        searchText.trim()
      );
      set({
        orders: searchResults.map(order => ({
          ...order,
          status: orderService.getStatusDisplayName(order.status),
          isLate: calculateIsLate(order),
        })),
        loading: false,
      });
    } catch (error) {
      console.error('❌ Error searching orders:', error);
      set({
        error: `Error en la búsqueda: ${error.message}`,
        loading: false,
      });
    }
  },

  // === SELECTORES ===

  // Obtener pedidos filtrados
  getFilteredOrders: () => {
    const { orders, statusFilter } = get();

    if (statusFilter === 'Todos') {
      return orders;
    }

    if (statusFilter === 'Atrasado') {
      return orders.filter(order => order.isLate);
    }

    // Mapear filtros de UI a estados de backend
    const statusMap = {
      Pendiente: 'pending',
      Aceptado: 'accepted',
      Rechazado: 'rejected',
      'En Ruta': 'in_transit',
      Entregado: 'delivered',
      Cancelado: 'cancelled',
    };

    const backendStatus = statusMap[statusFilter] || statusFilter;

    return orders.filter(order => {
      const orderBackendStatus =
        Object.keys(statusMap).find(key => statusMap[key] === order.status) ||
        order.status;
      return orderBackendStatus === statusFilter;
    });
  },

  // Obtener pedido por ID
  getOrderById: orderId => {
    const { orders } = get();
    return orders.find(order => order.order_id === orderId);
  },

  // Obtener resumen de estados
  getStatusSummary: () => {
    const { orders } = get();

    return {
      total: orders.length,
      pendiente: orders.filter(o => o.status === 'Pendiente').length,
      aceptado: orders.filter(o => o.status === 'Aceptado').length,
      rechazado: orders.filter(o => o.status === 'Rechazado').length,
      en_ruta: orders.filter(o => o.status === 'En Ruta').length,
      entregado: orders.filter(o => o.status === 'Entregado').length,
      atrasado: orders.filter(o => o.isLate).length,
    };
  },

  // === UTILIDADES ===

  // Limpiar estado
  clearOrders: () => {
    set({
      orders: [],
      loading: false,
      error: null,
      statusFilter: 'Todos',
      stats: null,
      lastFetch: null,
    });
  },

  // Verificar si hay datos recientes
  hasRecentData: (maxAgeMinutes = 5) => {
    const { lastFetch } = get();
    if (!lastFetch) return false;

    const lastFetchTime = new Date(lastFetch);
    const now = new Date();
    const diffMinutes = (now - lastFetchTime) / (1000 * 60);

    return diffMinutes < maxAgeMinutes;
  },
}));
