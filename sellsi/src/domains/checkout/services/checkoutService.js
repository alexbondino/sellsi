// ============================================================================
// CHECKOUT SERVICE - INTEGRACIÓN CON BACKEND
// ============================================================================

import { supabase } from '../../../services/supabase';
import { PAYMENT_STATUS } from '../constants/paymentMethods';
import { trackUserAction } from '../../../services/security';
import { default as khipuService } from './khipuService';
// Notificaciones de nueva orden (per-item buyer + supplier aggregate)
import { orderService } from '../../../services/user/orderService';

class CheckoutService {
  // ===== ÓRDENES =====

  /**
   * Crear orden de compra
   * @param {Object} orderData - Datos de la orden
   * @returns {Object} Orden creada
   */
  async createOrder(orderData) {
    try {
      // ✅ VALIDAR que haya dirección de envío
      if (!orderData.shippingAddress || !orderData.shippingAddress.address) {
        console.warn('[CheckoutService] Sin dirección de envío - creando orden sin direcciones');
        // No bloquear la orden, pero loggear para debugging
      }

      // Registrar IP del usuario al crear la orden
      if (orderData?.userId) {
        try {
          await trackUserAction(
            orderData.userId,
            `order_created_${orderData.paymentMethod || 'unknown'}`
          );
        } catch (e) {
          console.warn('[CheckoutService] trackUserAction fallo (createOrder) pero no bloquea flujo:', e?.message);
        }
      }

      // ✅ SERIALIZAR direcciones correctamente
      const shippingAddressJson = orderData.shippingAddress 
        ? JSON.stringify(orderData.shippingAddress) 
        : null;
      const billingAddressJson = orderData.billingAddress 
        ? JSON.stringify(orderData.billingAddress) 
        : null;

      const { data, error } = await supabase
        .from('orders')
        .insert({
          user_id: orderData.userId,
          items: orderData.items,
          subtotal: orderData.subtotal,
          tax: orderData.tax,
          shipping: orderData.shipping,
          total: orderData.total,
          currency: orderData.currency || 'CLP',
          status: 'pending',
          payment_method: orderData.paymentMethod,
          payment_status: 'pending',
          shipping_address: shippingAddressJson,
          billing_address: billingAddressJson,
        })
        .select()
        .single();

      if (error) throw error;

      // Disparar notificaciones de creación (no bloquea el retorno)
      try {
        // Esperamos para asegurar consistencia inicial; si prefieres desvincular completamente, quitar await
        await orderService.notifyNewOrder(data);
      } catch (e) {
        console.error('[CheckoutService] notifyNewOrder failed:', e);
      }

      return data;
    } catch (error) {
      console.error('Error creating order:', error);
      throw new Error(`No se pudo crear la orden: ${error.message}`);
    }
  }

  /**
   * Actualizar estado de orden
   * @param {string} orderId - ID de la orden
   * @param {string} status - Nuevo estado
   * @returns {Object} Orden actualizada
   */
  async updateOrderStatus(orderId, status) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .update({
          status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId)
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error updating order status:', error);
      throw new Error(`No se pudo actualizar la orden: ${error.message}`);
    }
  }

  // ===== PAGOS =====

  /**
   * Procesar pago con Khipu
   * @param {Object} paymentData - Datos del pago
   * @returns {Object} Resultado del pago
   */
  async processKhipuPayment(paymentData) {
    try {
      console.log('[CheckoutService] Iniciando pago con Khipu:', paymentData);

      // Validar monto
      if (!khipuService.validateAmount(paymentData.amount)) {
        console.log(paymentData.amount);
        throw new Error('Monto fuera del rango permitido por Khipu');
      }

      // Crear orden de pago en Khipu
      const khipuResponse = await khipuService.createPaymentOrder({
        orderId: paymentData.orderId,
        userId: paymentData.userId,
        userEmail: paymentData.userEmail,
        total: paymentData.amount,
        currency: paymentData.currency || 'CLP',
        items: paymentData.items,
  // ✔ Forward de direcciones
  shippingAddress: paymentData.shippingAddress || null,
  billingAddress: paymentData.billingAddress || null,
      });

      if (!khipuResponse.success) {
        throw new Error('Error al crear orden de pago en Khipu');
      }

      // Actualizar orden con datos de Khipu
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          khipu_payment_id: khipuResponse.paymentId,
          khipu_transaction_id: khipuResponse.transactionId,
          khipu_payment_url: khipuResponse.paymentUrl,
          khipu_expires_at: khipuResponse.expiresAt,
          payment_status: 'pending',
          updated_at: new Date().toISOString(),
        })
        .eq('id', paymentData.orderId);

      if (updateError) {
        console.error(
          'Error actualizando orden con datos de Khipu:',
          updateError
        );
        throw new Error('Error al actualizar orden con datos de pago');
      }

      // Crear transacción de pago
      const { error: transactionError } = await supabase
        .from('payment_transactions')
        .insert({
          order_id: paymentData.orderId,
          payment_method: 'khipu',
          external_payment_id: khipuResponse.paymentId,
          external_transaction_id: khipuResponse.transactionId,
          amount: paymentData.amount,
          currency: paymentData.currency || 'CLP',
          status: 'pending',
          gateway_response: khipuResponse,
        });

      if (transactionError) {
        console.error('Error creando transacción de pago:', transactionError);
        // No lanzar error aquí, ya que la orden se creó correctamente
      }

      console.log(
        '[CheckoutService] Pago Khipu creado exitosamente:',
        khipuResponse
      );

      return {
        success: true,
        paymentId: khipuResponse.paymentId,
        paymentUrl: khipuResponse.paymentUrl,
        transactionId: khipuResponse.transactionId,
        expiresAt: khipuResponse.expiresAt,
        status: PAYMENT_STATUS.PENDING,
        paymentMethod: 'khipu',
        processedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error processing Khipu payment:', error);
      throw new Error(`Error en el pago: ${error.message}`);
    }
  }

  /**
   * Verificar estado de pago con Khipu
   * @param {string} paymentId - ID del pago en Khipu
   * @returns {Object} Estado del pago
   */
  async verifyKhipuPaymentStatus(paymentId) {
    try {
      const verification = await khipuService.verifyPaymentStatus(paymentId);

      if (!verification.success) {
        throw new Error('Error al verificar estado del pago');
      }

      return {
        success: true,
        paymentId: verification.paymentId,
        transactionId: verification.transactionId,
        status: verification.status,
        amount: verification.amount,
        currency: verification.currency,
        paidAt: verification.paidAt,
        verifiedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error verifying Khipu payment status:', error);
      throw new Error(`Error verificando pago: ${error.message}`);
    }
  }

  // ===== VALIDACIONES =====

  /**
   * Validar datos de checkout
   * @param {Object} checkoutData - Datos del checkout
   * @returns {Object} Resultado de la validación
   */
  validateCheckoutData(checkoutData) {
    const errors = {};

    // Validar items
    if (!checkoutData.items || checkoutData.items.length === 0) {
      errors.items = 'No hay productos en el carrito';
    }

    // Validar método de pago
    if (!checkoutData.paymentMethod) {
      errors.paymentMethod = 'Debe seleccionar un método de pago';
    }

    // Validar montos
    if (!checkoutData.total || checkoutData.total <= 0) {
      errors.total = 'El total debe ser mayor a 0';
    }

    // Validar información del usuario
    if (!checkoutData.userId) {
      errors.userId = 'Usuario no autenticado';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }

  // ===== UTILIDADES =====

  /**
   * Formatear precio
   * @param {number} amount - Monto
   * @param {string} currency - Moneda
   * @returns {string} Precio formateado
   */
  formatPrice(amount, currency = 'CLP') {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency,
    }).format(amount);
  }

  /**
   * Calcular IVA
   * @param {number} subtotal - Subtotal
   * @returns {number} IVA calculado
   */
  calculateTax(subtotal) {
    return Math.round(subtotal * 0.19); // IVA 19%
  }

  /**
   * Generar referencia de pago
   * @returns {string} Referencia única
   */
  generatePaymentReference() {
    return `PAY_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)
      .toUpperCase()}`;
  }
}

// Instancia singleton
const checkoutService = new CheckoutService();
export default checkoutService;
