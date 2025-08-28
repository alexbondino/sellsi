import { create } from 'zustand';
import { orderService } from '../../../services/user';
import { buildDeliveryAddress } from '../../../domains/orders/shared/parsing';

// Función para calcular si un pedido está atrasado (requiere SLA real)
const calculateIsLate = order => {
  if (!order.estimated_delivery_date) return false; // B5 guard: sólo marcar atraso con SLA real
  const currentDate = new Date();
  const endDate = new Date(order.estimated_delivery_date);
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
  get().subscribeRealtime();
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
  // Obtener pedidos derivados dinámicamente (ya son payment parts virtuales)
  const visibilityFiltered = await orderService.getOrdersForSupplier(supplierId, filters);

      // Procesar y enriquecer los datos
      const processedOrders = visibilityFiltered.map(order => {
        // Derivar dirección: preferir campos shipping_*, luego delivery_*
  const rawAddr = order.shipping_address || order.shippingAddress || order.delivery_address || order.deliveryAddress || order.shippingAddressJson || null;
        const normalizedAddr = buildDeliveryAddress(rawAddr || {});
        // B7 suavizar placeholders
        if (/no especificad/i.test(normalizedAddr.region)) normalizedAddr.region = '';
        if (/no especificad/i.test(normalizedAddr.commune)) normalizedAddr.commune = '';
        // Derivar productos: usar múltiples fallbacks y aceptar items sin product anidado
        const products = (order.items || []).map(item => ({
          name: item.product?.name || item.name || item.productnm || item.title || item.product?.productnm || 'Producto',
          quantity: item.quantity || 0,
          price: Number(item.price_at_addition || item.product?.price || 0)
        }));
        return {
          ...order,
          shipping: order.shipping || order.shipping_amount || 0, // B2 alias asegurado
          status: orderService.getStatusDisplayName(order.status),
          isLate: calculateIsLate(order),
          deliveryAddress: normalizedAddr,
          requestedDate: { start: order.created_at, end: order.created_at },
          accepted_at: order.accepted_at || null,
          products
        };
      });

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

  // Estadísticas simplificadas: omitir por ahora (se pueden derivar luego). Mantener llamada existente.
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

  // Suscripción realtime (orders + supplier_orders) mínima
  subscribeRealtime: () => {
    const { supplierId } = get();
    if (!supplierId) return;
    // Evitar múltiples suscripciones: almacenar en window (simple)
    if (typeof window !== 'undefined' && window.__ordersRealtimeSubscribed) return;
    try {
      const { supabase } = require('../../../services/supabase');
      // Canal uno: cambios en orders donde supplier_ids contiene supplierId (no hay filtro server-side directo, usamos client filter en callback)
      const channelOrders = supabase
        .channel('rt_orders_supplier')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
          try {
            const row = payload.new || payload.old;
            if (!row) return;
            const arr = row.supplier_ids || [];
            if (Array.isArray(arr) && arr.includes(supplierId)) {
              // refrescar con debounce simple
              get().__debouncedRefresh();
            }
          } catch(_) {}
        })
        .subscribe();
      // Canal dos: tabla supplier_orders (más específico)
      const channelSupplierParts = supabase
        .channel('rt_supplier_orders_parts')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'supplier_orders', filter: `supplier_id=eq.${supplierId}` }, () => {
          get().__debouncedRefresh();
        })
        .subscribe();
      // Guardar referencias y debounce
      let t = null;
      const debounced = () => {
        if (t) clearTimeout(t);
        t = setTimeout(() => { get().refreshOrders(); }, 1000);
      };
      // Exponer internamente
      get().__debouncedRefresh = debounced;
      if (typeof window !== 'undefined') window.__ordersRealtimeSubscribed = true;
      // Limpieza (opcional) no implementada aún; se podría agregar método clearRealtime
    } catch(_) {}
  },
  __debouncedRefresh: () => {},
}));
