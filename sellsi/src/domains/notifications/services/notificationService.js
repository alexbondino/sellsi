// Unified Notification Service - Handles both read and create operations
import { supabase } from '../../../services/supabase';
import { parseOrderItems } from '../../orders/shared/parsing';

const PAGE_SIZE = 20;

class NotificationService {
  // ===== READ OPERATIONS (UI-focused) =====
  async fetchInitial(limit = PAGE_SIZE, userId) {
    let query = supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (userId) query = query.eq('user_id', userId);
    const { data, error } = await query;
    if (error) {
      console.error('[notificationService.fetchInitial] error', error);
      throw error;
    }
    return data || [];
  }

  async fetchOlder(beforeCreatedAt, limit = PAGE_SIZE, userId) {
    let query = supabase
      .from('notifications')
      .select('*')
      .lt('created_at', beforeCreatedAt)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (userId) query = query.eq('user_id', userId);
    const { data, error } = await query;
    if (error) {
      console.error('[notificationService.fetchOlder] error', error);
      throw error;
    }
    return data || [];
  }

  async markRead(ids) {
    if (!Array.isArray(ids)) ids = [ids];
    if (!ids.length) return;
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .in('id', ids);
    if (error) {
      console.error('[notificationService.markRead] error', error);
      throw error;
    }
  }

  // ===== CREATE OPERATIONS (Business logic) =====
  async notifyNewOrder(orderRow) {
    console.log('[NotificationService UNIFIED] notifyNewOrder called with:', {
      orderId: orderRow?.id,
      user_id: orderRow?.user_id,
      items_count: Array.isArray(orderRow?.items) ? orderRow.items.length : 'not_array'
    });
    
    if (!orderRow) return;
    const buyerId = orderRow.user_id || orderRow.buyer_id || null;
    let items = [];
    if (orderRow.items) items = parseOrderItems(orderRow.items);
    
    console.log('[NotificationService UNIFIED] Parsed items:', items.map(it => ({
      product_id: it.product_id,
      supplier_id: it.supplier_id,
      name: it.name,
      quantity: it.quantity
    })));
    
    if (!items.length) return;
    
    // Create buyer notifications (one per item)
    for (const it of items) {
      try {
        console.log('[NotificationService UNIFIED] Creating buyer notification:', {
          p_user_id: buyerId,
          p_supplier_id: it.supplier_id || null,
          p_order_id: orderRow.id || orderRow.order_id || null,
          p_product_id: it.product_id || null,
          p_type: 'order_new',
          p_title: 'Se registró tu compra',
          p_body: it.name ? `Producto: ${it.name}` : 'Nuevo producto comprado',
          p_role_context: 'buyer'
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
        
        console.log('[NotificationService UNIFIED] Buyer notification created:', result);
      } catch (error) {
        console.error('[NotificationService UNIFIED] ERROR creating buyer notification:', error);
      }
    }
    
    // Create supplier notifications (one per supplier)
    const supplierSet = new Set(items.map(i => i.supplier_id).filter(Boolean));
    console.log('[NotificationService UNIFIED] Suppliers found:', Array.from(supplierSet));
    
    for (const supplierId of supplierSet) {
      try {
        console.log('[NotificationService UNIFIED] Creating supplier notification:', {
          p_user_id: supplierId,
          p_supplier_id: supplierId,
          p_order_id: orderRow.id || orderRow.order_id || null,
          p_type: 'order_new',
          p_title: 'Nuevo pedido pendiente',
          p_body: 'Revisa y acepta o rechaza los productos.',
          p_role_context: 'supplier'
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
        
        console.log('[NotificationService UNIFIED] Supplier notification created:', result);
      } catch (error) {
        console.error('[NotificationService UNIFIED] ERROR creating supplier notification:', error);
      }
    }
  }
}

export const notificationService = new NotificationService();
export default notificationService;
