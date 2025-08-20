// Servicio para notificaciones de órdenes
import { supabase } from '../../../../services/supabase';
import { parseOrderItems } from '../../shared/parsing';

class NotificationService {
  async notifyStatusChange(orderRow, status) {
    if (!orderRow) return;
    const buyerId = orderRow.user_id || orderRow.buyer_id || orderRow.userId || null;
    if (!buyerId) return;
    let items = [];
    if (orderRow.items) items = parseOrderItems(orderRow.items);
    if (!items.length) return;
    const statusTitles = {
      pending: 'Pedido registrado',
      accepted: 'Producto aceptado',
      rejected: 'Producto rechazado',
      in_transit: 'Producto despachado',
      delivered: 'Producto entregado',
      cancelled: 'Pedido cancelado'
    };
    const statusBodies = {
      accepted: 'El proveedor aceptó tu compra de este producto.',
      rejected: (it) => `El proveedor rechazó tu compra${it?.rejection_reason ? ': ' + it.rejection_reason : ''}.`,
      in_transit: 'El producto fue despachado.',
      delivered: 'El producto fue entregado.',
      pending: 'Tu pedido fue registrado correctamente.',
      cancelled: 'El pedido fue cancelado.'
    };
    for (const it of items) {
      const productId = it.product_id || it.productid || null;
      const supplierId = it.supplier_id || it.supplierid || null;
      const title = statusTitles[status] || 'Actualización de pedido';
      const bodyTemplate = statusBodies[status];
      const body = typeof bodyTemplate === 'function' ? bodyTemplate(it) : bodyTemplate;
      try {
        await supabase.rpc('create_notification', {
          p_user_id: buyerId,
            p_supplier_id: supplierId,
            p_order_id: orderRow.id || orderRow.order_id || orderRow.cart_id || null,
            p_product_id: productId,
            p_type: 'order_status',
            p_order_status: status,
            p_role_context: 'buyer',
            p_context_section: 'buyer_orders',
            p_title: title,
            p_body: body,
            p_metadata: {
              quantity: it.quantity,
              price_at_addition: it.price_at_addition,
              rejection_reason: it.rejection_reason || null,
              estimated_delivery: orderRow.estimated_delivery_date || orderRow.estimated_delivery || null
            }
        });
      } catch (_) {}
    }
  }

  async notifyNewOrder(orderRow) {
    console.log('[NotificationService] notifyNewOrder called with:', {
      orderId: orderRow?.id,
      user_id: orderRow?.user_id,
      items_count: Array.isArray(orderRow?.items) ? orderRow.items.length : 'not_array'
    });
    if (!orderRow) return;
    const buyerId = orderRow.user_id || orderRow.buyer_id || null;
    let items = [];
    if (orderRow.items) items = parseOrderItems(orderRow.items);
    console.log('[NotificationService] Parsed items:', items.map(it => ({
      product_id: it.product_id,
      supplier_id: it.supplier_id,
      name: it.name,
      quantity: it.quantity
    })));
    if (!items.length) return;
    for (const it of items) {
      try {
        console.log('[NotificationService v2.0 FIXED] Creating buyer notification:', {
          p_user_id: buyerId,
          p_supplier_id: it.supplier_id || null,
          p_order_id: orderRow.id || orderRow.order_id || null,
          p_product_id: it.product_id || null,
          p_type: 'order_new',
          p_role_context: 'buyer',
          product_name: it.name,
          p_title: 'Se registró tu compra',
          p_body: it.name ? `Producto: ${it.name}` : 'Nuevo producto comprado'
        });
        const result = await supabase.rpc('create_notification', {
          p_user_id: buyerId,
          p_supplier_id: it.supplier_id || null,
          p_order_id: orderRow.id || orderRow.order_id || null,
          p_product_id: it.product_id || null,
          p_type: 'order_new',
          p_order_status: 'pending',
          p_role_context: 'buyer',
          p_context_section: 'buyer_orders',
          p_title: 'Se registró tu compra',
          p_body: it.name ? `Producto: ${it.name}` : 'Nuevo producto comprado',
          p_metadata: { quantity: it.quantity, price_at_addition: it.price_at_addition }
        });
        console.log('[NotificationService] Buyer notification created:', result);
      } catch (error) {
        console.error('[NotificationService] ERROR creating buyer notification:', error);
      }
    }
    const supplierSet = new Set(items.map(i => i.supplier_id).filter(Boolean));
    console.log('[NotificationService] Suppliers found:', Array.from(supplierSet));
    for (const supplierId of supplierSet) {
      try {
        console.log('[NotificationService v2.0 FIXED] Creating supplier notification:', {
          p_user_id: supplierId,
          p_supplier_id: supplierId,
          p_order_id: orderRow.id || orderRow.order_id || null,
          p_type: 'order_new',
          p_role_context: 'supplier',
          buyer_id: buyerId,
          p_title: 'Nuevo pedido pendiente',
          p_body: 'Revisa y acepta o rechaza los productos.'
        });
        const result = await supabase.rpc('create_notification', {
          p_user_id: supplierId,
          p_supplier_id: supplierId,
          p_order_id: orderRow.id || orderRow.order_id || null,
          p_product_id: null,
          p_type: 'order_new',
          p_order_status: 'pending',
          p_role_context: 'supplier',
          p_context_section: 'supplier_orders',
          p_title: 'Nuevo pedido pendiente',
          p_body: 'Revisa y acepta o rechaza los productos.',
          p_metadata: { buyer_id: buyerId }
        });
        console.log('[NotificationService] Supplier notification created:', result);
      } catch (error) {
        console.error('[NotificationService] ERROR creating supplier notification:', error);
      }
    }
  }
}

export const notificationService = new NotificationService();
