import { supabase } from '../supabase';
import { normalizeStatus, getStatusDisplayName } from '../../domains/orders/shared/constants';
import { isUUID } from '../../domains/orders/shared/validation';
import { ordersRepository } from '../../domains/orders/infra/repositories/OrdersRepository';
import { notificationService } from '../../domains/orders/domain/services/NotificationService';

// Normalizador único para document_type -> 'boleta' | 'factura' | 'ninguno'
// (Se removió helper local normalizeDocumentType; ahora todo se resuelve en los use cases)

// DEBUG deshabilitado (se removieron los console.logs); cambiar a true y reintroducir prints manualmente si se necesita diagnóstico.
const DEBUG_ORDERS = false; // Mantener bandera por compatibilidad futura

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
  // TODO: Implementar flujo de payment orders para supplier si aplica. Placeholder para compatibilidad.
  async getPaymentOrdersForSupplier(supplierId, opts = {}) { return []; }
  async getPaymentOrdersForBuyer(buyerId, { limit, offset } = {}) {
    if (!buyerId) throw new Error('ID de comprador es requerido');
    if (!isUUID(buyerId)) throw new Error('ID de comprador no tiene formato UUID válido');
    try {
      const { GetBuyerPaymentOrders } = await import('../../domains/orders/application/queries/GetBuyerPaymentOrders');
      return await GetBuyerPaymentOrders(buyerId, { limit, offset });
    } catch (error) {
      throw new Error(`No se pudieron obtener payment orders: ${error.message}`);
    }
  }

  /**
   * Suscripción realtime a cambios en 'orders' para un comprador.
   * Llama al callback con payload Supabase.
   * Retorna función para desuscribir.
   */
  subscribeToBuyerPaymentOrders(buyerId, onChange) {
    if (!buyerId) return () => {};
    const channel = supabase
      .channel(`orders_changes_${buyerId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `user_id=eq.${buyerId}` }, (payload) => {
        try { onChange && onChange(payload); } catch (_) {}
      })
      .subscribe();
    return () => { try { supabase.removeChannel(channel); } catch (_) {} };
  }

  /**
   * Obtiene solo estados mínimos de orders para un comprador (para polling liviano)
   */
  async getPaymentStatusesForBuyer(buyerId) {
    if (!buyerId) throw new Error('ID de comprador es requerido');
  if (!isUUID(buyerId)) throw new Error('ID de comprador no tiene formato UUID válido');
  const { data, error } = await ordersRepository.getMinimalStatuses(buyerId);
    if (error) throw error;
    return data || [];
  }
  /**
   * Obtiene todos los pedidos para un proveedor específico
   * @param {string} supplierId - ID del proveedor
   * @param {Object} filters - Filtros opcionales (status, fechas, etc.)
   * @returns {Array} Lista de pedidos con sus items
  */
  async getOrdersForSupplier(supplierId, filters = {}) {
    try {
      const SUPPLIER_PARTS_ENABLED = (import.meta.env?.VITE_SUPPLIER_PARTS_ENABLED || '').toLowerCase() === 'true';
      const SUPPLIER_PARTS_VIRTUAL_FALLBACK = (import.meta.env?.VITE_SUPPLIER_PARTS_VIRTUAL_FALLBACK || '').toLowerCase() === 'true';
      // 1. Intentar parts reales si la feature está activada
      if (SUPPLIER_PARTS_ENABLED) {
        try {
          const { GetSupplierParts } = await import('../../domains/orders/application/queries/GetSupplierParts');
          const parts = await GetSupplierParts(supplierId, filters);
          if (Array.isArray(parts) && parts.length) return parts;
        } catch (e) {
          // Ignorar error y evaluar fallback
        }
      }

      // 2. Fallback virtual (también si parts desactivado) cuando la tabla supplier_orders aún no tiene datos
      if (SUPPLIER_PARTS_VIRTUAL_FALLBACK && supplierId) {
        try {
          const limit = Number(filters.limit) || 100; // limitar para evitar sobrecarga accidental
          const { data: recent, error: recErr } = await supabase
            .from('orders')
            .select('id, items, status, payment_status, estimated_delivery_date, created_at, updated_at, shipping, total, subtotal')
            .order('created_at', { ascending: false })
            .limit(limit);
          if (!recErr && Array.isArray(recent)) {
            const { parseOrderItems } = await import('../../domains/orders/shared/parsing');
            const virtual = [];
            for (const row of recent) {
              const parsed = parseOrderItems(row.items);
              if (!Array.isArray(parsed) || !parsed.length) continue;
              const items = parsed.filter(it => (it.supplier_id || it.supplierId) === supplierId);
              if (!items.length) continue;
              const normItems = items.map((it, idx) => ({
                cart_items_id: it.id || `${row.id}-virt-${idx}`,
                product_id: it.product_id || it.productid || it.id,
                quantity: it.quantity || 1,
                price_at_addition: Number(it.price_at_addition || it.price || it.basePrice || 0),
                document_type: it.document_type || it.documentType || 'ninguno',
                product: {
                  id: it.product_id || it.productid || it.id,
                  name: it.name || it.productnm || 'Producto',
                  price: Number(it.price_at_addition || it.price || it.basePrice || 0),
                  supplier_id: it.supplier_id || supplierId
                }
              }));
              const subtotal = normItems.reduce((s,i)=> s + (i.price_at_addition * i.quantity),0);
              virtual.push({
                order_id: row.id,
                parent_order_id: row.id,
                supplier_id: supplierId,
                status: row.status || 'pending',
                payment_status: row.payment_status || 'pending',
                created_at: row.created_at,
                updated_at: row.updated_at,
                estimated_delivery_date: row.estimated_delivery_date || null,
                items: normItems,
                total_amount: subtotal,
                shipping_amount: 0,
                final_amount: row.total || subtotal,
                is_supplier_part: true,
                is_payment_order: true,
                is_virtual_part: true
              });
            }
            if (virtual.length) {
              console.warn('[orderService][virtualSupplierParts] fallback activo (SUPPLIER_PARTS_ENABLED=' + SUPPLIER_PARTS_ENABLED + ').', { count: virtual.length });
              return virtual;
            }
          }
        } catch (vfErr) {
          console.error('[orderService][virtualSupplierParts] error fallback', vfErr);
        }
      }

      // 3. Sin parts y sin fallback => retornar [] (contrato estable)
      return [];
    } catch (error) {
      throw new Error(`No se pudieron obtener los pedidos: ${error.message}`);
    }
  }

  /**
   * Actualiza el estado de un pedido - maneja tanto órdenes legacy (carts) como nuevas (orders)
   * @param {string} orderId - ID del pedido
   * @param {string} newStatus - Nuevo estado del pedido
   * @param {Object} additionalData - Datos adicionales (mensajes, fechas, etc.)
   * @returns {Object} Pedido actualizado
   */
  async updateOrderStatus(orderId, newStatus, additionalData = {}) {
    try {
      const { UpdateOrderStatus } = await import('../../domains/orders/application/commands/UpdateOrderStatus');
      return await UpdateOrderStatus(orderId, newStatus, additionalData);
    } catch (error) {
      throw new Error(`No se pudo actualizar el estado del pedido: ${error.message}`);
    }
  }

  /**
   * Normaliza el estado del pedido para la base de datos
   * @param {string} status - Estado en español o formato UI
   * @returns {string} Estado normalizado para BD
   */
  normalizeStatus(status) { return normalizeStatus(status); }

  /**
   * Obtiene el nombre de visualización del estado
   * @param {string} status - Estado de la BD
   * @returns {string} Nombre para mostrar
   */
  getStatusDisplayName(status) { return getStatusDisplayName(status); }

  /**
   * Obtiene estadísticas de pedidos para el proveedor
   * @param {string} supplierId - ID del proveedor
   * @param {Object} period - Período de tiempo (opcional)
   * @returns {Object} Estadísticas de pedidos
   */
  async getOrderStats(supplierId, period = {}) {
    try {
      const SUPPLIER_PARTS_ENABLED = (import.meta.env?.VITE_SUPPLIER_PARTS_ENABLED || '').toLowerCase() === 'true';
      if (SUPPLIER_PARTS_ENABLED) {
        try {
          const { GetSupplierPartStats } = await import('../../domains/orders/application/queries/GetSupplierPartStats');
          return await GetSupplierPartStats(supplierId, period);
        } catch (e) { /* fallback abajo */ }
      }
  // Legacy stats eliminadas; sin parts activos devolvemos estructura vacía.
  return { total_orders: 0, pending:0, accepted:0, rejected:0, in_transit:0, delivered:0, cancelled:0, total_revenue:0, total_items_sold:0 };
    } catch (error) {
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
      const SUPPLIER_PARTS_ENABLED = (import.meta.env?.VITE_SUPPLIER_PARTS_ENABLED || '').toLowerCase() === 'true';
      if (SUPPLIER_PARTS_ENABLED) {
        try {
          const { SearchSupplierParts } = await import('../../domains/orders/application/queries/SearchSupplierParts');
          return await SearchSupplierParts(supplierId, searchText);
        } catch (e) { /* fallback abajo */ }
      }
  // Legacy search eliminada; sin parts activos retornamos []
  return [];
    } catch (error) {
      throw new Error(`Error en la búsqueda: ${error.message}`);
    }
  }

  /**
   * Obtiene todos los pedidos para un comprador específico
   * @param {string} buyerId - ID del comprador
   * @param {Object} filters - Filtros opcionales (status, fechas, etc.)
   * @returns {Array} Lista de pedidos con sus items
   */
  async getOrdersForBuyer(buyerId, filters = {}) {
    try {
  // Legacy buyer carts removidos: retornamos siempre [] (buyer UI usa payment orders + supplier_parts)
  return [];
    } catch (error) {
      throw new Error(`No se pudieron obtener los pedidos: ${error.message}`);
    }
  }

  /**
   * Crea notificaciones de cambio de estado para el comprador (por item) usando RPC create_notification.
   * @param {Object} orderRow - Datos del pedido (orders o carts row)
   * @param {string} status - Estado normalizado
   * @private
   */
  async _notifyOrderStatusChange() { /* deprecated - use notificationService */ }

  /**
   * Crear notificaciones de nuevo pedido para supplier y buyer (por item) tras checkout.
   * Llamar desde el flujo de creación de order.
   */
  async notifyNewOrder(orderRow) {
    try {
      // Prefer command if available (encapsula dominio); fallback directa.
      try {
        const { NotifyNewOrder } = await import('../../domains/orders/application/commands/NotifyNewOrder');
        return await NotifyNewOrder(orderRow);
      } catch (e) {
        await notificationService.notifyNewOrder(orderRow);
      }
    } catch (_) {}
  }
}

// Exportar una instancia singleton del servicio
export const orderService = new OrderService();
export default orderService;
