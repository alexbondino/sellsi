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
    if (!orderRow) return;
    const buyerId = orderRow.user_id || orderRow.buyer_id || null;
    let items = [];
    if (orderRow.items) items = parseOrderItems(orderRow.items);
    
    if (!items.length) return;
    
    // Create buyer notifications (one per item)
    for (const it of items) {
      try {
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
        
        if (result.error) {
          console.error('[NotificationService] ERROR creating buyer notification:', result.error);
        }
      } catch (error) {
        console.error('[NotificationService] ERROR creating buyer notification:', error);
      }
    }
    
    // Create supplier notifications (one per supplier)
    const supplierSet = new Set(items.map(i => i.supplier_id).filter(Boolean));
    
    for (const supplierId of supplierSet) {
      try {
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
        
        if (result.error) {
          console.error('[NotificationService] ERROR creating supplier notification:', result.error);
        }
      } catch (error) {
        console.error('[NotificationService] ERROR creating supplier notification:', error);
      }
    }
  }
}

export const notificationService = new NotificationService();
export default notificationService;
