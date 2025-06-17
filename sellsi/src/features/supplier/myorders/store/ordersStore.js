import { create } from 'zustand';

// Mock data completo según las especificaciones
const mockOrders = [
  {
    order_id: '1',
    products: [
      { name: 'Torta de cangrejo', quantity: 50 },
      { name: 'Torta Pastrami', quantity: 80 },
      { name: 'Torta Café', quantity: 30 }
    ],
    deliveryAddress: { street: 'Avda. Los Maples 404', city: 'Valparaíso', region: 'Valparaíso' },
    requestedDate: { start: '2025-12-24', end: '2026-01-01' },
    estimated_delivery_date: null,
    total_amount: 150000000,
    status: 'Pendiente',
  },
  {
    order_id: '2',
    products: [{ name: '90 x Iphone 4', quantity: 90 }],
    deliveryAddress: { street: 'Rosario Norte 522', city: 'Santiago', region: 'Metropolitana' },
    requestedDate: { start: '2025-05-01', end: '2025-05-15' }, // Fecha pasada -> Debería marcarse como ATRASADO
    estimated_delivery_date: null,
    total_amount: 150000,
    status: 'Aceptado',
  },
  {
    order_id: '3',
    products: [{ name: '90 x Cous Cous', quantity: 90 }],
    deliveryAddress: { street: 'Avda. Alemania 123', city: 'Concepción', region: 'Biobío' },
    requestedDate: { start: '2025-12-01', end: '2025-12-10' },
    estimated_delivery_date: '2025-12-08',
    total_amount: 85000,
    status: 'En Ruta',
  },
  {
    order_id: '4',
    products: [{ name: '90 x Torta de Cangrejo', quantity: 90 }],
    deliveryAddress: { street: 'Calle Falsa 123', city: 'Temuco', region: 'Araucanía' },
    requestedDate: { start: '2025-11-20', end: '2025-11-25' },
    estimated_delivery_date: '2025-11-24',
    total_amount: 150000,
    status: 'Entregado',
  },
  {
    order_id: '5',
    products: [{ name: '90 x Torta de palta con piña', quantity: 90 }],
    deliveryAddress: { street: 'Avda. del Mar 4500', city: 'La Serena', region: 'Coquimbo' },
    requestedDate: { start: '2025-11-01', end: '2025-11-05' },
    estimated_delivery_date: '2025-11-04',
    total_amount: 120000,
    status: 'Pagado',
  },
  {
    order_id: '6',
    products: [{ name: '90 x Waffles', quantity: 90 }],
    deliveryAddress: { street: 'Plaza de Armas 1', city: 'Arica', region: 'Arica y Parinacota' },
    requestedDate: { start: '2025-10-10', end: '2025-10-15' },
    estimated_delivery_date: null,
    total_amount: 75000,
    status: 'Rechazado',
  },
];

// Función para calcular si un pedido está atrasado
const calculateIsLate = (order) => {
  const currentDate = new Date();
  const endDate = new Date(order.requestedDate.end);
  const excludedStatuses = ['Entregado', 'Pagado', 'Rechazado'];
  
  return currentDate > endDate && !excludedStatuses.includes(order.status);
};

// Store de Zustand
export const useOrdersStore = create((set, get) => ({
  // Estado
  orders: [],
  loading: true,
  statusFilter: 'Todos',
  error: null,

  // Acciones
  fetchOrders: async () => {
    set({ loading: true, error: null });
    
    try {
      // Simular retraso de red
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      // Calcular isLate para cada pedido
      const ordersWithLateStatus = mockOrders.map(order => ({
        ...order,
        isLate: calculateIsLate(order)
      }));
      
      set({ 
        orders: ordersWithLateStatus, 
        loading: false 
      });
    } catch (error) {
      set({ 
        error: 'Error al cargar los pedidos', 
        loading: false 
      });
    }
  },

  setStatusFilter: (filter) => {
    set({ statusFilter: filter });
  },

  updateOrderStatus: (orderId, newStatus, additionalData = {}) => {
    console.log('Simulando actualización:', { orderId, newStatus, additionalData });
    
    set((state) => {
      const updatedOrders = state.orders.map(order => {
        if (order.order_id === orderId) {
          const updatedOrder = {
            ...order,
            status: newStatus,
            ...additionalData
          };
          
          // Si el nuevo status es 'En Ruta', actualizar estimated_delivery_date
          if (newStatus === 'En Ruta' && additionalData.estimated_delivery_date) {
            updatedOrder.estimated_delivery_date = additionalData.estimated_delivery_date;
          }
          
          // Recalcular isLate con el nuevo estado
          updatedOrder.isLate = calculateIsLate(updatedOrder);
          
          return updatedOrder;
        }
        return order;
      });
      
      return { orders: updatedOrders };
    });
  },

  // Selectores
  getFilteredOrders: () => {
    const { orders, statusFilter } = get();
    
    if (statusFilter === 'Todos') {
      return orders;
    }
    
    if (statusFilter === 'Atrasado') {
      return orders.filter(order => order.isLate);
    }
    
    return orders.filter(order => order.status === statusFilter);
  }
}));
