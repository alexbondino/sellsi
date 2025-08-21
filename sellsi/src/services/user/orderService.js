import { supabase } from '../supabase';
import { normalizeStatus, getStatusDisplayName } from '../../domains/orders/shared/constants';
import { isUUID } from '../../domains/orders/shared/validation';
import { ordersRepository } from '../../domains/orders/infra/repositories/OrdersRepository';
import { notificationService } from '../../domains/notifications/services/notificationService';

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
      if (!supplierId) return [];
      const limit = Number(filters.limit) || 100;
      const { data: recent, error: recErr } = await supabase
        .from('orders')
        .select('id, items, status, payment_status, estimated_delivery_date, created_at, updated_at, shipping, total, subtotal, shipping_address')
        .eq('payment_status', 'paid')
        .contains('supplier_ids', [supplierId]) // nuevo filtro server-side (B1)
        .order('created_at', { ascending: false })
        .limit(limit);
      if (recErr || !Array.isArray(recent)) return [];
      // === B3 ENRICHMENT: completar supplier_id en items legacy faltantes ===
      const missingProductIds = new Set();
      for (const row of recent) {
        let itemsRaw = row.items;
        if (typeof itemsRaw === 'string') { try { itemsRaw = JSON.parse(itemsRaw); } catch { itemsRaw = []; } }
        if (!Array.isArray(itemsRaw)) continue;
        for (const it of itemsRaw) {
          const hasSupplier = !!(it?.supplier_id || it?.supplierId || it?.product?.supplier_id || it?.product?.supplierId);
          const pid = it?.product_id || it?.productid || it?.id || it?.product?.productid;
            if (!hasSupplier && pid) missingProductIds.add(pid);
        }
      }
      let productMap = new Map();
      if (missingProductIds.size > 0) {
        const ids = Array.from(missingProductIds);
        const { data: prodRows } = await supabase
          .from('products')
          .select('productid, supplier_id')
          .in('productid', ids);
        if (Array.isArray(prodRows)) productMap = new Map(prodRows.map(r => [r.productid, r]));
      }
      for (const row of recent) {
        if (typeof row.items === 'string') { try { row.items = JSON.parse(row.items); } catch { row.items = []; } }
        if (!Array.isArray(row.items)) row.items = [];
        for (const it of row.items) {
          const pid = it?.product_id || it?.productid || it?.id;
          const hasSupplier = !!(it?.supplier_id || it?.supplierId || it?.product?.supplier_id || it?.product?.supplierId);
          if (!hasSupplier && pid) {
            const info = productMap.get(pid);
            if (info?.supplier_id) {
              if (!it.product) it.product = {};
              it.product.supplier_id = info.supplier_id; // no sobreescribe existente
            }
          }
        }
      }
      const { splitOrderBySupplier } = await import('../../domains/orders/shared/splitOrderBySupplier');
      const { calculateEstimatedDeliveryDate } = await import('../../domains/orders/shared/delivery');
      const parts = [];
      for (const row of recent) {
        const derived = splitOrderBySupplier({ ...row, id: row.id });
        for (const p of derived) {
          if (p.supplier_id === supplierId) {
            // Calcular fecha estimada solo si falta y tenemos items
            let est = row.estimated_delivery_date || p.estimated_delivery_date || null;
            if (!est) {
              try {
                // Buscar region del comprador dentro de la dirección si existe
                const buyerRegion = (row.shipping_address && (row.shipping_address.shipping_region || row.shipping_address.region)) || null;
                est = calculateEstimatedDeliveryDate(row.created_at, p.items, buyerRegion, (pid)=> null);
              } catch(_) {}
            }
            parts.push({
              ...p,
              order_id: row.id,
              parent_order_id: row.id,
              estimated_delivery_date: est,
              total_amount: p.subtotal,
              final_amount: p.final_amount || p.subtotal + (p.shipping_amount || 0),
              is_supplier_part: true,
              is_payment_order: true,
              is_virtual_part: true
            });
          }
        }
      }
      return parts.sort((a,b)=> new Date(b.created_at) - new Date(a.created_at));
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
   * Actualiza estado parcial por supplier (Opción A 2.0) contra edge function.
   * @param {string} orderId
   * @param {string} supplierId
   * @param {string} newStatus
   * @param {object} opts { estimated_delivery_date?, rejected_reason? }
   */
  async updateSupplierPartStatus(orderId, supplierId, newStatus, opts = {}) {
    if (!orderId || !supplierId || !newStatus) throw new Error('orderId, supplierId y newStatus requeridos');
  const baseFnUrl = import.meta.env?.VITE_SUPABASE_FUNCTIONS_URL || import.meta.env?.VITE_SUPABASE_EDGE_URL || '';
  if (!baseFnUrl) throw new Error('Faltan vars: VITE_SUPABASE_FUNCTIONS_URL o VITE_SUPABASE_EDGE_URL');
  const url = `${baseFnUrl.replace(/\/$/, '')}/update-supplier-part-status`;
    const token = (await supabase.auth.getSession()).data?.session?.access_token;
    if (!token) throw new Error('No autenticado');
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ order_id: orderId, supplier_id: supplierId, new_status: newStatus, ...opts })
    });
    const json = await res.json().catch(()=>({}));
    if (!res.ok || json.error) throw new Error(json.error || 'Error actualizando parte');
    return json;
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
