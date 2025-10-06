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
  const status = (orderRow.payment_status || orderRow.paymentStatus || orderRow.status || '').toLowerCase();
  if (status !== 'paid') return;
    const buyerId = orderRow.user_id || orderRow.buyer_id || null;
    let items = [];
    if (orderRow.items) items = parseOrderItems(orderRow.items);
    
    if (!items.length) return;
    
    // Create buyer notifications (one per item)
    for (const it of items) {
      try {
        const result = await supabase.rpc('create_notification', {
          p_payload: {
            p_user_id: buyerId,
            p_supplier_id: it.supplier_id || null,
            p_order_id: orderRow.id || orderRow.order_id || null,
            p_product_id: it.product_id || null,
            p_type: 'order_new',
            p_order_status: 'paid',
            p_role_context: 'buyer',
            p_context_section: 'buyer_orders',
            p_title: 'Se registró tu compra',
            p_body: 'Pago confirmado',
            p_metadata: { quantity: it.quantity, price_at_addition: it.price_at_addition }
          }
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
          p_payload: {
            p_user_id: supplierId,
            p_supplier_id: supplierId,
            p_order_id: orderRow.id || orderRow.order_id || null,
            p_product_id: null,
            p_type: 'order_new',
            p_order_status: 'paid',
            p_role_context: 'supplier',
            p_context_section: 'supplier_orders',
            p_title: 'Nuevo pedido pagado',
            p_body: 'Revisa y prepara el despacho.',
            p_metadata: { buyer_id: buyerId }
          }
        });
        
        if (result.error) {
          console.error('[NotificationService] ERROR creating supplier notification:', result.error);
        }
      } catch (error) {
        console.error('[NotificationService] ERROR creating supplier notification:', error);
      }
    }
  }

  // ===== OFFER NOTIFICATIONS =====
  
  /**
   * Notificar nueva oferta al proveedor
   */
  async notifyOfferReceived(offerData) {
    try {
      // Adaptar distintas formas de datos de oferta (legacy / nueva)
      const buyerName = offerData.buyer_name || offerData.buyer?.name || 'Comprador';
      const productName = offerData.product_name || offerData.product?.name || 'Producto';
      const offerId = offerData.offer_id || offerData.id;
      const offeredPrice = offerData.offered_price || offerData.price;
      const offeredQuantity = offerData.offered_quantity || offerData.quantity;

      const result = await supabase.rpc('create_notification', {
        p_payload: {
          p_user_id: offerData.supplier_id,
          p_supplier_id: offerData.supplier_id,
          p_order_id: null,
          p_product_id: offerData.product_id,
          p_type: 'offer_received',
          p_order_status: null,
          p_role_context: 'supplier',
          p_context_section: 'supplier_offers',
          p_title: 'Nueva oferta recibida',
          p_body: `${buyerName} hizo una oferta por ${productName}`,
          // Campos legacy
          p_message: `${buyerName} ha realizado una oferta`,
          p_related_id: offerId,
          p_action_url: '/supplier/offers',
          p_metadata: { 
            offer_id: offerId,
            offered_price: offeredPrice,
            offered_quantity: offeredQuantity,
            expires_at: offerData.expires_at
          }
        }
      });
      
      if (result.error) {
        console.error('[NotificationService] ERROR creating offer notification:', result.error);
        return { error: result.error };
      }
      // Devolver estructura extendida (legacy)
      return {
        success: true,
        body: `${offerData.buyer_name} hizo una oferta por ${offerData.product_name}`,
        message: `${offerData.buyer_name} hizo una oferta por ${offerData.product_name}`,
        action_url: `/offers/${offerData.offer_id}`,
        related_id: offerData.offer_id,
        metadata: {
          offer_id: offerData.offer_id,
          offered_price: offerData.offered_price,
          offered_quantity: offerData.offered_quantity,
          expires_at: offerData.expires_at
        }
      };
    } catch (error) {
      console.error('[NotificationService] ERROR creating offer notification:', error);
      return { error };
    }
  }

  /**
   * Notificar respuesta de oferta al comprador
   */
  async notifyOfferResponse(offerData, accepted = true) {
    try {
      // Manejar parámetro status string ('accepted'/'rejected') o boolean
      let isAccepted = accepted;
      if (typeof accepted === 'string') {
        if (accepted === 'accepted') isAccepted = true;
        else if (accepted === 'rejected') isAccepted = false;
        else return; // status inválido -> no llamar
      }
      const supplierName = offerData.supplier_name || offerData.supplier?.name || 'Proveedor';
      const productName = offerData.product_name || offerData.product?.name || 'Producto';
      const offerId = offerData.offer_id || offerData.id;
      const offeredPrice = offerData.offered_price || offerData.price;
      const offeredQuantity = offerData.offered_quantity || offerData.quantity;
      const result = await supabase.rpc('create_notification', {
        p_payload: {
          p_user_id: offerData.buyer_id,
          p_supplier_id: offerData.supplier_id,
          p_order_id: null,
          p_product_id: offerData.product_id,
          p_type: isAccepted ? 'offer_accepted' : 'offer_rejected',
          p_order_status: null,
          p_role_context: 'buyer',
          p_context_section: 'buyer_offers',
          p_title: isAccepted ? 'Oferta aceptada' : 'Oferta rechazada',
          p_body: isAccepted 
            ? `${supplierName} aceptó tu oferta por ${productName}`
            : `${supplierName} rechazó tu oferta por ${productName}`,
          // Campos legacy
          p_message: isAccepted 
            ? `${supplierName} ha aceptado tu oferta`
            : `${supplierName} ha rechazado tu oferta`,
          p_related_id: offerId,
          p_action_url: '/buyer/offers',
          p_metadata: { 
            offer_id: offerId,
            offered_price: offeredPrice,
            offered_quantity: offeredQuantity,
            rejection_reason: offerData.rejection_reason || null,
            purchase_deadline: offerData.purchase_deadline || null
          }
        }
      });
      
      if (result.error) {
        console.error('[NotificationService] ERROR creating offer response notification:', result.error);
        return { error: result.error };
      }
      return {
        success: true,
        body: accepted 
          ? `${offerData.supplier_name} aceptó tu oferta por ${offerData.product_name}`
          : `${offerData.supplier_name} rechazó tu oferta por ${offerData.product_name}`,
        message: accepted 
          ? `${offerData.supplier_name} aceptó tu oferta por ${offerData.product_name}`
          : `${offerData.supplier_name} rechazó tu oferta por ${offerData.product_name}`,
        action_url: `/offers/${offerData.offer_id}`,
        related_id: offerData.offer_id,
        metadata: {
          offer_id: offerData.offer_id,
          offered_price: offerData.offered_price,
          offered_quantity: offerData.offered_quantity,
          status: accepted ? 'accepted' : 'rejected'
        }
      };
    } catch (error) {
      console.error('[NotificationService] ERROR creating offer response notification:', error);
      return { error };
    }
  }

  /**
   * Notificar oferta expirada
   */
  async notifyOfferExpired(offerData, role = 'buyer') {
    try {
      if (!offerData.buyer_id) return; // tests esperan no llamar sin buyer_id
      const productName = offerData.product_name || offerData.product?.name || 'Producto';
      const offerId = offerData.offer_id || offerData.id;
      const offeredPrice = offerData.offered_price || offerData.price;
      const offeredQuantity = offerData.offered_quantity || offerData.quantity;
      const userId = role === 'buyer' ? offerData.buyer_id : offerData.supplier_id;
      const contextSection = role === 'buyer' ? 'buyer_offers' : 'supplier_offers';
      const title = role === 'buyer' ? 'Tu oferta expiró' : 'Oferta recibida expiró';
      const body = role === 'buyer' 
        ? `Tu oferta por ${productName} ha expirado`
        : `La oferta de ${offerData.buyer_name || offerData.buyer?.name || 'Comprador'} por ${productName} expiró`;

      const result = await supabase.rpc('create_notification', {
        p_payload: {
          p_user_id: userId,
          p_supplier_id: offerData.supplier_id,
          p_order_id: null,
          p_product_id: offerData.product_id,
          p_type: 'offer_expired',
          p_order_status: null,
          p_role_context: role,
          p_context_section: contextSection,
          p_title: role === 'buyer' ? 'Oferta expirada' : title,
          p_body: body,
          p_message: body,
          p_related_id: offerId,
          p_action_url: '/buyer/offers',
          p_metadata: { 
            offer_id: offerId,
            offered_price: offeredPrice,
            offered_quantity: offeredQuantity,
            expired_at: new Date().toISOString()
          }
        }
      });
      
      if (result.error) {
        console.error('[NotificationService] ERROR creating offer expiration notification:', result.error);
        return { error: result.error };
      }
      return {
        success: true,
        body,
        message: body,
        action_url: `/offers/${offerData.offer_id}`,
        related_id: offerData.offer_id,
        metadata: {
          offer_id: offerData.offer_id,
          expired_at: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('[NotificationService] ERROR creating offer expiration notification:', error);
      return { error };
    }
  }
}

export const notificationService = new NotificationService();
export default notificationService;

// Exportaciones individuales para compatibilidad con tests
export const notifyOfferReceived = (offerData) => notificationService.notifyOfferReceived(offerData);
export const notifyOfferResponse = (offerData, accepted) => notificationService.notifyOfferResponse(offerData, accepted);
export const notifyOfferExpired = (offerData, role) => notificationService.notifyOfferExpired(offerData, role);
