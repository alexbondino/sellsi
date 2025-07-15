import { supabase } from './supabase';

/**
 * OrderService - Servicio para manejar todas las operaciones de pedidos con Supabase
 * 
 * Este servicio centraliza toda la lógica de comunicación con el backend para:
 * - Obtener pedidos por proveedor
 * - Actualizar estados de pedidos
 * - Gestionar acciones de proveedores (aceptar, rechazar, despachar, entregar)
 * - Mantener sincronía con el flujo de carrito a pedido
 */

class OrderService {
  /**
   * Obtiene todos los pedidos para un proveedor específico
   * @param {string} supplierId - ID del proveedor
   * @param {Object} filters - Filtros opcionales (status, fechas, etc.)
   * @returns {Array} Lista de pedidos con sus items
   */  async getOrdersForSupplier(supplierId, filters = {}) {
    try {
      // Validate supplierId is a valid UUID
      if (!supplierId) {
        throw new Error('ID de proveedor es requerido');
      }
      
      // Basic UUID format validation
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(supplierId)) {
        throw new Error('ID de proveedor no tiene formato UUID válido');
      }

      // First, get the products for this supplier to filter carts
      const { data: supplierProducts, error: productsError } = await supabase
        .from('products')
        .select('productid')
        .eq('supplier_id', supplierId);

      if (productsError) {
        throw new Error(`Error obteniendo productos del proveedor: ${productsError.message}`);
      }

      if (!supplierProducts || supplierProducts.length === 0) {
        // No products for this supplier, return empty array
        return [];
      }

      const productIds = supplierProducts.map(p => p.productid);      // Now get carts that contain items from this supplier's products
      let query = supabase
        .from('carts')
        .select(`
          cart_id,
          user_id,
          status,
          created_at,
          updated_at,
          users!carts_user_id_fkey (
            user_id,
            user_nm,
            email,
            phone_nbr
          ),
          cart_items!inner (
            cart_items_id,
            product_id,
            quantity,
            price_at_addition,
            price_tiers,
            added_at,
            updated_at,
            products!inner (
              productid,
              productnm,
              price,
              category,
              description,
              supplier_id,
              product_images (image_url)
            )
          )
        `)
        .neq('status', 'active') // Solo pedidos (no carritos activos)
        .in('cart_items.product_id', productIds)
        .order('created_at', { ascending: false });

      // Aplicar filtros de estado
      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      // Aplicar filtros de fecha
      if (filters.dateFrom) {
        query = query.gte('created_at', filters.dateFrom);
      }
      if (filters.dateTo) {
        query = query.lte('created_at', filters.dateTo);
      }

      const { data, error } = await query;      if (error) {
        console.error('Error querying carts for supplier:', error);
        throw error;
      }

      // Handle case where no data is returned
      if (!data || data.length === 0) {
        return [];
      }

      // Transformar los datos para el formato esperado por MyOrders
      const orders = data
        .filter(cart => cart.cart_items && cart.cart_items.length > 0) // Solo carritos con items del proveedor
        .map(cart => {
          // Filter items that belong to this supplier
          const supplierItems = cart.cart_items.filter(item => 
            item.products && item.products.supplier_id === supplierId
          );

          // Skip carts that don't have items for this supplier
          if (supplierItems.length === 0) return null;

          return {
            order_id: cart.cart_id,
            cart_id: cart.cart_id,
            buyer_id: cart.user_id,
            status: cart.status,
            created_at: cart.created_at,
            updated_at: cart.updated_at,
            
            // Información del comprador
            buyer: {
              user_id: cart.users?.user_id || cart.user_id,
              name: cart.users?.user_nm || 'Usuario desconocido',
              email: cart.users?.email || 'Email no disponible',
              phone: cart.users?.phone_nbr || 'Teléfono no disponible'
            },

            // Items del pedido (solo los del proveedor)
            items: supplierItems.map(item => ({
              cart_items_id: item.cart_items_id,
              product_id: item.product_id,
              quantity: item.quantity,
              price_at_addition: item.price_at_addition,
              price_tiers: item.price_tiers,
              
              // Información del producto
              product: {
                productid: item.products.productid,
                name: item.products.productnm,
                price: item.products.price,
                category: item.products.category,
                description: item.products.description,
                image_url: item.products.product_images?.[0]?.image_url,
                thumbnail_url: item.products.product_images?.[0]?.thumbnail_url // ✅ NUEVO: Agregar thumbnail_url
              }
            })),

            // Cálculos del pedido
            total_items: supplierItems.length,
            total_quantity: supplierItems.reduce((sum, item) => sum + item.quantity, 0),
            total_amount: supplierItems.reduce((sum, item) => sum + (item.price_at_addition * item.quantity), 0)
          };
        })
        .filter(order => order !== null) // Remove null entries
        .filter(order => order.items.length > 0); // Solo órdenes con items del proveedor

      return orders;

    } catch (error) {
      console.error('Error fetching orders for supplier:', error);
      throw new Error(`No se pudieron obtener los pedidos: ${error.message}`);
    }
  }

  /**
   * Actualiza el estado de un pedido
   * @param {string} orderId - ID del pedido (cart_id)
   * @param {string} newStatus - Nuevo estado del pedido
   * @param {Object} additionalData - Datos adicionales (mensajes, fechas, etc.)
   * @returns {Object} Pedido actualizado
   */
  async updateOrderStatus(orderId, newStatus, additionalData = {}) {
    try {
      // Validar estados permitidos
      const validStatuses = [
        'pending',     // Pendiente (recién creado)
        'accepted',    // Aceptado por proveedor
        'rejected',    // Rechazado por proveedor
        'in_transit',  // En tránsito / despachado
        'delivered',   // Entregado
        'cancelled'    // Cancelado
      ];

      const normalizedStatus = this.normalizeStatus(newStatus);
      
      if (!validStatuses.includes(normalizedStatus)) {
        throw new Error(`Estado no válido: ${newStatus}`);
      }

      // Preparar datos para actualizar
      const updateData = {
        status: normalizedStatus,
        updated_at: new Date().toISOString(),
        ...additionalData
      };

      // Actualizar en la base de datos
      const { data, error } = await supabase
        .from('carts')
        .update(updateData)
        .eq('cart_id', orderId)
        .select('*')
        .single();

      if (error) throw error;

      // Registrar la acción en logs (opcional - para auditoria futura)
      await this.logOrderAction(orderId, newStatus, additionalData);

      return {
        success: true,
        order: data,
        message: `Pedido ${this.getStatusDisplayName(normalizedStatus)} correctamente`
      };

    } catch (error) {
      console.error('Error updating order status:', error);
      throw new Error(`No se pudo actualizar el estado del pedido: ${error.message}`);
    }
  }

  /**
   * Normaliza el estado del pedido para la base de datos
   * @param {string} status - Estado en español o formato UI
   * @returns {string} Estado normalizado para BD
   */
  normalizeStatus(status) {
    const statusMap = {
      'Pendiente': 'pending',
      'Aceptado': 'accepted',
      'Rechazado': 'rejected',
      'En Ruta': 'in_transit',
      'Entregado': 'delivered',
      'Cancelado': 'cancelled',
      // También manejar estados en inglés
      'pending': 'pending',
      'accepted': 'accepted',
      'rejected': 'rejected',
      'in_transit': 'in_transit',
      'delivered': 'delivered',
      'cancelled': 'cancelled'
    };

    return statusMap[status] || status.toLowerCase();
  }

  /**
   * Obtiene el nombre de visualización del estado
   * @param {string} status - Estado de la BD
   * @returns {string} Nombre para mostrar
   */
  getStatusDisplayName(status) {
    const displayMap = {
      'pending': 'Pendiente',
      'accepted': 'Aceptado',
      'rejected': 'Rechazado',
      'in_transit': 'En Ruta',
      'delivered': 'Entregado',
      'cancelled': 'Cancelado'
    };

    return displayMap[status] || status;
  }

  /**
   * Obtiene estadísticas de pedidos para el proveedor
   * @param {string} supplierId - ID del proveedor
   * @param {Object} period - Período de tiempo (opcional)
   * @returns {Object} Estadísticas de pedidos
   */
  async getOrderStats(supplierId, period = {}) {
    try {
      let query = supabase
        .from('carts')
        .select(`
          status,
          created_at,
          cart_items!inner (
            quantity,
            price_at_addition,
            products!inner (
              supplier_id
            )
          )
        `)
        .neq('status', 'active')
        .eq('cart_items.products.supplier_id', supplierId);

      // Aplicar filtros de período
      if (period.from) {
        query = query.gte('created_at', period.from);
      }
      if (period.to) {
        query = query.lte('created_at', period.to);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Calcular estadísticas
      const stats = {
        total_orders: data.length,
        pending: data.filter(order => order.status === 'pending').length,
        accepted: data.filter(order => order.status === 'accepted').length,
        rejected: data.filter(order => order.status === 'rejected').length,
        in_transit: data.filter(order => order.status === 'in_transit').length,
        delivered: data.filter(order => order.status === 'delivered').length,
        cancelled: data.filter(order => order.status === 'cancelled').length,
        
        total_revenue: data
          .filter(order => ['accepted', 'in_transit', 'delivered'].includes(order.status))
          .reduce((sum, order) => {
            return sum + order.cart_items.reduce((itemSum, item) => {
              return itemSum + (item.price_at_addition * item.quantity);
            }, 0);
          }, 0),

        total_items_sold: data
          .filter(order => ['delivered'].includes(order.status))
          .reduce((sum, order) => {
            return sum + order.cart_items.reduce((itemSum, item) => {
              return itemSum + item.quantity;
            }, 0);
          }, 0)
      };

      return stats;

    } catch (error) {
      console.error('Error getting order stats:', error);
      throw new Error(`No se pudieron obtener las estadísticas: ${error.message}`);
    }
  }

  /**
   * Registra una acción realizada en un pedido (para auditoría)
   * @param {string} orderId - ID del pedido
   * @param {string} action - Acción realizada
   * @param {Object} data - Datos adicionales
   */
  async logOrderAction(orderId, action, data = {}) {
    try {
      // Esta función puede expandirse en el futuro para crear una tabla de logs
      // Acción en pedido
      
      // En el futuro, se puede implementar una tabla order_logs:
      // const { error } = await supabase
      //   .from('order_logs')
      //   .insert({
      //     order_id: orderId,
      //     action: action,
      //     data: data,
      //     timestamp: new Date().toISOString()
      //   });

    } catch (error) {
      console.error('Error logging order action:', error);
      // No lanzar error aquí porque es una función auxiliar
    }
  }

  /**
   * Busca pedidos por texto (nombre del comprador, ID, etc.)
   * @param {string} supplierId - ID del proveedor
   * @param {string} searchText - Texto a buscar
   * @returns {Array} Pedidos que coinciden con la búsqueda
   */
  async searchOrders(supplierId, searchText) {
    try {
      const { data, error } = await supabase
        .from('carts')
        .select(`
          cart_id,
          user_id,
          status,
          created_at,
          updated_at,
          users!carts_user_id_fkey (
            user_nm,
            email
          ),
          cart_items (
            products (
              supplier_id,
              productnm
            )
          )
        `)
        .neq('status', 'active')
        .eq('cart_items.products.supplier_id', supplierId)
        .or(`
          cart_id.ilike.%${searchText}%,
          users.user_nm.ilike.%${searchText}%,
          users.email.ilike.%${searchText}%
        `);

      if (error) throw error;

      return data || [];

    } catch (error) {
      console.error('Error searching orders:', error);
      throw new Error(`Error en la búsqueda: ${error.message}`);
    }
  }
}

// Exportar una instancia singleton del servicio
export const orderService = new OrderService();
export default orderService;
