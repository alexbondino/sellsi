import { create } from 'zustand';
import { orderService } from '../../../services/user';

// Función para calcular si un pedido está atrasado
const calculateIsLate = order => {
  const currentDate = new Date();
  const endDate = new Date(order.estimated_delivery_date || order.created_at);
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
      // Obtener pedidos desde ambas fuentes
      const [legacyOrders, paymentOrders] = await Promise.all([
        orderService.getOrdersForSupplier(supplierId, filters),
        orderService.getPaymentOrdersForSupplier(supplierId)
      ]);

      // Combinar y deduplicar pedidos
      const allOrders = [...legacyOrders, ...paymentOrders];

      // Regla de negocio: solo mostrar pedidos de flujo de pago cuyo payment_status = 'paid'.
      // (Pedidos legacy sin campo payment_status no se filtran.)
      const visibilityFiltered = allOrders.filter(o => (
        o.payment_status === undefined || o.payment_status === null || o.payment_status === 'paid'
      ));

      // Procesar y enriquecer los datos
  const processedOrders = visibilityFiltered.map(order => ({
        ...order,
        // Convertir status del backend al formato de UI
        status: orderService.getStatusDisplayName(order.status),
        // Calcular si está atrasado
        isLate: calculateIsLate(order),
        // Usar la dirección de entrega desde shipping_info
        deliveryAddress: order.delivery_address || order.deliveryAddress || {
          street: 'Dirección no especificada',
          city: 'Ciudad no especificada',
          region: 'Región no especificada',
        },
        // requestedDate: solo fecha de solicitud/compra
        requestedDate: {
          start: order.created_at,
          end: order.created_at,
        },
        // Mapear productos al formato esperado por la UI
        products:
          order.items?.map(item => ({
            name: item.product?.name || item.product?.productnm || 'Producto',
            quantity: item.quantity,
            price: item.price_at_addition,
          })) || [],
  }));

      const sorted = [...processedOrders].sort((a, b) => {
        const da = new Date(a.created_at || a.requestedDate?.start || 0).getTime();
        const db = new Date(b.created_at || b.requestedDate?.start || 0).getTime();
        return db - da; // descendente
      });
      set({
        orders: sorted,
        loading: false,
        lastFetch: new Date().toISOString(),
      });

      // Obtener estadísticas también
      get().fetchStats();
    } catch (error) {
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
      // No mostrar error aquí porque las estadísticas son secundarias
    }
  },

  // Actualizar estado de pedido con backend
  updateOrderStatus: async (orderId, newStatus, additionalData = {}) => {
    try {
      // Convertir el estado de backend a display antes del optimistic update
      const getDisplayStatus = (backendStatus) => {
        const displayMap = {
          'pending': 'Pendiente',
          'accepted': 'Aceptado',
          'rejected': 'Rechazado',
          'in_transit': 'En Transito',
          'delivered': 'Entregado',
          'cancelled': 'Cancelado'
        };
        return displayMap[backendStatus] || backendStatus;
      };

      const displayStatus = getDisplayStatus(newStatus);

      // Optimistic update - actualizar UI inmediatamente
      set(state => {
        const updatedOrders = state.orders.map(order => {
          if (order.order_id === orderId) {
            const updatedOrder = {
              ...order,
              status: displayStatus, // Usar el status de display
              ...additionalData,
            };

            // Si el nuevo status es 'in_transit', actualizar estimated_delivery_date
            if (
              newStatus === 'in_transit' &&
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
      // Aplicar mismo filtro de visibilidad tras búsqueda.
      const visibilityFiltered = searchResults.filter(o => (
        o.payment_status === undefined || o.payment_status === null || o.payment_status === 'paid'
      ));
      const processed = visibilityFiltered.map(order => ({
        ...order,
        status: orderService.getStatusDisplayName(order.status),
        isLate: calculateIsLate(order),
      }));
      const sorted = processed.sort((a, b) => {
        const da = new Date(a.created_at || a.requestedDate?.start || 0).getTime();
        const db = new Date(b.created_at || b.requestedDate?.start || 0).getTime();
        return db - da;
      });
      set({
        orders: sorted,
        loading: false,
      });
    } catch (error) {
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

    const sorted = [...orders]; // ya deberían estar ordenadas, pero copiamos por seguridad
    if (statusFilter === 'Todos') {
      return sorted;
    }

    if (statusFilter === 'Atrasado') {
      return sorted.filter(order => order.isLate);
    }

    // Mapear filtros de UI a estados de backend
    const statusMap = {
      Pendiente: 'pending',
      Aceptado: 'accepted',
      Rechazado: 'rejected',
      'En Transito': 'in_transit',
      Entregado: 'delivered',
      Cancelado: 'cancelled',
    };

    // Convertir el filtro de UI a estado de backend
    const backendStatus = statusMap[statusFilter] || statusFilter;

    // Filtrar órdenes por estado de backend directamente
  return sorted.filter(order => {
      // order.status ya debe estar en formato de display ('Pendiente', 'En Transito', etc.)
      // Necesitamos convertirlo a backend status para comparar
      const orderBackendStatus = statusMap[order.status] || order.status;
      return orderBackendStatus === backendStatus;
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
  en_ruta: orders.filter(o => o.status === 'En Transito').length,
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
