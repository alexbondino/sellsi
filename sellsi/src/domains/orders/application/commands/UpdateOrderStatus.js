// Command: Actualizar estado de un pedido (orders o carts) con validaciones y notificaciones
import { ordersRepository } from '../../infra/repositories/OrdersRepository';
import { supplierOrdersRepository } from '../../infra/repositories/SupplierOrdersRepository';
import { orderStatusService } from '../../domain/services/OrderStatusService';
import { notificationService } from '../../../notifications/services/notificationService';
import { ORDER_STATUSES, ADVANCE_STATUSES, normalizeStatus, getStatusDisplayName } from '../../shared/constants';
import { supabase } from '../../../../services/supabase';

export async function UpdateOrderStatus(orderId, newStatus, additionalData = {}) {
  const normalizedStatus = normalizeStatus(newStatus);
  if (!ORDER_STATUSES.includes(normalizedStatus)) throw new Error(`Estado no válido: ${newStatus}`);

  const updateData = { status: normalizedStatus, updated_at: new Date().toISOString() };
  if (normalizedStatus === 'in_transit' && additionalData.estimated_delivery_date) {
    updateData.estimated_delivery_date = additionalData.estimated_delivery_date;
  }
  if (additionalData.tax_document_path) {
    updateData.tax_document_path = additionalData.tax_document_path; // will be ignored if column not present
  }

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
    const { data: cartStatusRow } = await supabase
      .from('carts')
      .select('status')
      .eq('cart_id', orderId)
      .maybeSingle();
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
  const { data: cartData, error: cartError } = await supabase
    .from('carts')
    .update(cartUpdateData)
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
