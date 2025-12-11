// Command: Actualizar estado de un pedido (orders o carts) con validaciones y notificaciones
import { ordersRepository } from '../../infra/repositories/OrdersRepository';
import { supplierOrdersRepository } from '../../infra/repositories/SupplierOrdersRepository';
import { orderStatusService } from '../../domain/services/OrderStatusService';
import { notificationService } from '../../../notifications/services/notificationService';
import { ORDER_STATUSES, ADVANCE_STATUSES, normalizeStatus, getStatusDisplayName } from '../../shared/constants';
import { supabase } from '../../../../services/supabase';
import { cartService } from '../../../../services/user/cartService';

export async function UpdateOrderStatus(orderId, newStatus, additionalData = {}) {
  const normalizedStatus = normalizeStatus(newStatus);
  if (!ORDER_STATUSES.includes(normalizedStatus)) throw new Error(`Estado no válido: ${newStatus}`);

  const updateData = { status: normalizedStatus, updated_at: new Date().toISOString() };
  if (normalizedStatus === 'in_transit' && additionalData.estimated_delivery_date) {
    updateData.estimated_delivery_date = additionalData.estimated_delivery_date;
  }
  // tax_document_path deprecado: invoices_meta es la fuente de verdad

  // Guardia pago (solo orders)
  if (ADVANCE_STATUSES.has(normalizedStatus)) {
    const { data: existingOrderRow } = await ordersRepository.getPaymentStatus(orderId);
    if (existingOrderRow) {
      const payStatus = existingOrderRow.payment_status || 'pending';
      if (payStatus !== 'paid') {
        throw new Error(
          normalizedStatus === 'accepted'
            ? 'No se puede ACEPTAR el pedido porque el pago aún no está confirmado.'
            : `No se puede cambiar el estado a "${normalizedStatus}" porque el pago no está confirmado (payment_status=${payStatus}).`
        );
      }
    }
  }

  // Estado actual (para validar transición)
  let currentStatus = null;
  let currentPaymentStatus = null;
  const { data: currentOrderMeta } = await ordersRepository.getPaymentStatus(orderId);
  if (currentOrderMeta) {
    currentStatus = currentOrderMeta.status || null;
    currentPaymentStatus = currentOrderMeta.payment_status || null;
  } else {
    const { data: cartStatusRow } = await cartService.fetchCartById(orderId, 'status');
    if (cartStatusRow) currentStatus = cartStatusRow.status;
  }
  const check = orderStatusService.canTransition(currentStatus || 'pending', normalizedStatus, { paymentStatus: currentPaymentStatus });
  if (!check.ok) throw new Error(`Transición inválida: ${check.reason}`);

  // Intentar supplier_orders (part) primero si existe el part id
  try {
    const { data: partMaybe } = await supplierOrdersRepository.getPartById(orderId);
    if (partMaybe) {
      // We are updating a supplier order part
      const { data: updPart, error: updPartErr } = await supabase
        .from('supplier_orders')
        .update(updateData)
        .eq('id', orderId)
        .select('*')
        .single();
      if (updPartErr) throw updPartErr;
      try { await notificationService.notifyStatusChange(updPart, normalizedStatus); } catch(_) {}
      return {
        success: true,
        order: updPart,
        source: 'supplier_orders',
        message: `Pedido (parte proveedor) ${getStatusDisplayName(normalizedStatus)} correctamente`
      };
    }
  } catch(_) {}

  // Intentar orders (parent) luego
  const { data: orderData, error: orderError } = await supabase
    .from('orders')
    .update(updateData)
    .eq('id', orderId)
    .select('*')
    .single();

  if (!orderError && orderData) {
    // 📊 Log específico para rechazos (para debugging de restauración de stock)
    if (normalizedStatus === 'rejected' && orderData.payment_status === 'paid') {
      console.log(`🔄 Order ${orderId} rejected after payment - stock restoration should be triggered automatically by database trigger`);
      console.log(`📋 Order details:`, {
        orderId,
        paymentStatus: orderData.payment_status,
        supplierIds: orderData.supplier_ids,
        itemsCount: Array.isArray(orderData.items) ? orderData.items.length : 'N/A'
      });
    }
    // 🔧 SYNC supplier_parts_meta para mono-supplier (consistencia de datos)
    try {
      const supplierIds = orderData.supplier_ids;
      if (Array.isArray(supplierIds) && supplierIds.length === 1) {
        // Solo para mono-supplier: sincronizar supplier_parts_meta
        const supplierId = supplierIds[0];
        const currentMeta = orderData.supplier_parts_meta || {};
        
        if (currentMeta[supplierId]) {
          const now = new Date().toISOString();
          const updatedMeta = {
            ...currentMeta,
            [supplierId]: {
              ...currentMeta[supplierId],
              status: normalizedStatus,
              history: [
                ...(currentMeta[supplierId].history || []),
                {
                  at: now,
                  from: currentStatus,
                  to: normalizedStatus
                }
              ]
            }
          };
          
          // Actualizar supplier_parts_meta en la base de datos
          await supabase
            .from('orders')
            .update({ supplier_parts_meta: updatedMeta })
            .eq('id', orderId);
            
          console.log(`✅ Sincronizado supplier_parts_meta para mono-supplier ${orderId}: ${normalizedStatus}`);
        }
      }
    } catch (syncError) {
      console.warn(`⚠️ Error sincronizando supplier_parts_meta:`, syncError);
      // No fallar el comando principal por error de sincronización
    }
    
    try { await notificationService.notifyStatusChange(orderData, normalizedStatus); } catch (_) {}
    return {
      success: true,
      order: orderData,
      source: 'orders',
      message: `Pedido ${getStatusDisplayName(normalizedStatus)} correctamente`
    };
  }

  // Fallback carts
  // La tabla legacy 'carts' no tiene columna estimated_delivery_date; remover si existe
  const cartUpdateData = { ...updateData };
  if ('estimated_delivery_date' in cartUpdateData) {
    delete cartUpdateData.estimated_delivery_date;
  }
  // carts (legacy) no soporta tax_document_path; remover si existe para evitar 400
  const cartClone = { ...cartUpdateData };
  if ('tax_document_path' in cartClone) delete cartClone.tax_document_path;
  
  const { data: cartData, error: cartError } = await supabase
    .from('carts')
    .update(cartClone)
    .eq('cart_id', orderId)
    .select('*')
    .single();
  if (cartError) throw new Error(`Pedido no encontrado en ninguna tabla: ${cartError.message}`);
  try { await notificationService.notifyStatusChange(cartData, normalizedStatus); } catch (_) {}
  return {
    success: true,
    order: cartData,
    source: 'carts',
    message: `Pedido ${getStatusDisplayName(normalizedStatus)} correctamente`
  };
}
