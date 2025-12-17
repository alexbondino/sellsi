// ============================================================================
// CHECKOUT SERVICE - INTEGRACIÓN CON BACKEND
// ============================================================================

import { supabase } from '../../../services/supabase';
import { PAYMENT_STATUS } from '../constants/paymentMethods';
import { trackUserAction } from '../../../services/security';
import { default as khipuService } from './khipuService';
import { default as flowService } from './flowService';

class CheckoutService {
  // ===== ÓRDENES =====

  /**
   * Genera hash de items para comparación (solo product_id y quantity)
   * @param {Array} items - Items del carrito/orden
   * @returns {string} Hash string para comparación
   */
  _hashItems(items) {
    return (items || [])
      .map(it => `${it.product_id || it.productid || it.id}:${it.quantity}`)
      .sort()
      .join('|');
  }

  /**
   * Busca orden pending existente para el cart_id.
   * Si existe, válida y con items iguales → la reutiliza.
   * Si existe pero expiró o items cambiaron → la marca expired.
   * Patrón FAIL-OPEN: si hay error, retorna null para intentar INSERT normal.
   * @param {string} cartId - ID del carrito
   * @param {Array} currentItems - Items actuales del carrito
   * @returns {Object|null} Orden existente o null para crear nueva
   */
  async getOrReuseExistingOrder(cartId, currentItems) {
    if (!cartId) return null;

    try {
      const { data: existing, error } = await supabase
        .from('orders')
        .select('id, items, total, payment_method, khipu_expires_at, flow_expires_at, payment_status, created_at')
        .eq('cart_id', cartId)
        .eq('payment_status', 'pending')
        .maybeSingle();

      // Si hay error de red/DB, fallar silenciosamente y dejar que el INSERT decida
      if (error) {
        console.warn('[CheckoutService] Error buscando orden existente (continuando con INSERT):', error.message);
        return null;
      }

      if (!existing) return null;

      // Verificar expiración según payment_method
      let isExpired = false;
      let reason = '';

      if (existing.payment_method === 'khipu') {
        // Khipu: verificar khipu_expires_at (TTL 20 min)
        const isKhipuExpired = existing.khipu_expires_at && 
          new Date(existing.khipu_expires_at) <= new Date();
        
        // Caso especial: orden sin khipu_expires_at pero muy vieja (>5 min) = "zombie"
        const ZOMBIE_THRESHOLD_MS = 5 * 60 * 1000;
        const isZombie = !existing.khipu_expires_at && 
          existing.created_at && 
          (Date.now() - new Date(existing.created_at).getTime()) > ZOMBIE_THRESHOLD_MS;
        
        if (isKhipuExpired || isZombie) {
          isExpired = true;
          reason = isKhipuExpired ? 'payment window expired (reuse check)' : 'zombie order (no khipu_expires_at after 5min)';
        }
      } else if (existing.payment_method === 'flow') {
        // Flow: verificar flow_expires_at (TTL 30 min)
        const isFlowExpired = existing.flow_expires_at && 
          new Date(existing.flow_expires_at) <= new Date();
        
        // Caso especial: orden Flow sin flow_expires_at pero muy vieja (>5 min) = "zombie"
        const ZOMBIE_THRESHOLD_MS = 5 * 60 * 1000;
        const isZombie = !existing.flow_expires_at && 
          existing.created_at && 
          (Date.now() - new Date(existing.created_at).getTime()) > ZOMBIE_THRESHOLD_MS;
        
        if (isFlowExpired || isZombie) {
          isExpired = true;
          reason = isFlowExpired ? 'payment window expired (reuse check)' : 'zombie order (no flow_expires_at after 5min)';
        }
      }
      
      if (isExpired) {
        console.log('[CheckoutService] Orden existente expirada/zombie, marcando expired:', existing.id, reason);
        try {
          await supabase.from('orders')
            .update({ payment_status: 'expired', status: 'cancelled', cancellation_reason: reason })
            .eq('id', existing.id);
        } catch (expireErr) {
          console.warn('[CheckoutService] Error marcando orden expired (ignorando):', expireErr.message);
        }
        return null;
      }

      // Verificar que items coincidan
      const existingHash = this._hashItems(existing.items);
      const currentHash = this._hashItems(currentItems);

      if (existingHash !== currentHash) {
        console.log('[CheckoutService] Items cambiaron, expirando orden anterior:', existing.id);
        try {
          await supabase.from('orders')
            .update({ payment_status: 'expired', status: 'cancelled', cancellation_reason: 'cart items changed' })
            .eq('id', existing.id);
        } catch (expireErr) {
          console.warn('[CheckoutService] Error marcando orden expired por items (ignorando):', expireErr.message);
        }
        return null;
      }

      // Reutilizar orden existente
      console.log('[CheckoutService] Reutilizando orden existente:', existing.id);
      return existing;
      
    } catch (err) {
      // Error general en la verificación - fail-open
      console.warn('[CheckoutService] Error en getOrReuseExistingOrder (continuando con INSERT):', err.message);
      return null;
    }
  }

  /**
   * Crear orden de compra
   * @param {Object} orderData - Datos de la orden
   * @returns {Object} Orden creada
   */
  async createOrder(orderData) {
    try {
      // ===== VERIFICAR SI EXISTE ORDEN PENDING REUTILIZABLE =====
      const existingOrder = await this.getOrReuseExistingOrder(
        orderData.cartId, 
        orderData.items
      );
      
      if (existingOrder) {
        // Retornar orden existente (no crear nueva)
        return existingOrder;
      }

      // ===== HOTFIX DEFENSIVO DIRECCIONES =====
      // Si el caller no adjuntó shipping/billing pero el usuario podría tenerlas en perfil,
      // hacemos un fetch rápido antes del insert para no nacer NULL.
      if (orderData?.userId && (!orderData.shippingAddress || !orderData.shippingAddress.address)) {
        try {
          const { getUserProfile } = await import('../../../services/user/profileService');
          const profResp = await getUserProfile(orderData.userId);
          const prof = profResp?.data || profResp || {};
          if (!orderData.shippingAddress && prof.shipping_address && String(prof.shipping_address).trim() !== '') {
            orderData.shippingAddress = {
              address: prof.shipping_address,
              region: prof.shipping_region || '',
              commune: prof.shipping_commune || '',
              number: prof.shipping_number || '',
              department: prof.shipping_dept || ''
            };
          }
          if (!orderData.billingAddress && (prof.billing_address || prof.business_name || prof.business_line)) {
            if ([prof.billing_address, prof.business_name, prof.business_line, prof.billing_region, prof.billing_commune]
              .some(v => v && String(v).trim() !== '')) {
              orderData.billingAddress = {
                business_name: prof.business_name || '',
                billing_rut: prof.billing_rut || '',
                business_line: prof.business_line || '',
                giro: prof.business_line || '', // alias
                billing_address: prof.billing_address || '',
                billing_region: prof.billing_region || '',
                billing_commune: prof.billing_commune || '',
                // aliases normalizados
                address: prof.billing_address || '',
                region: prof.billing_region || '',
                commune: prof.billing_commune || ''
              };
              const requiredBilling = orderData.billingAddress.business_name.trim() !== '' && orderData.billingAddress.billing_address.trim() !== '';
              if (!requiredBilling) orderData.billingAddress.incomplete = true;
            }
          }
        } catch (pfErr) {
          console.warn('[CheckoutService] No se pudo recuperar perfil para enriquecer direcciones:', pfErr?.message);
        }
      }
      // =========================================
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

      // ✅ Pasar objetos JSON directamente (Supabase cliente serializa a jsonb)
      const shippingAddressObj = orderData.shippingAddress && typeof orderData.shippingAddress === 'object'
        ? orderData.shippingAddress
        : null;
      const billingAddressObj = orderData.billingAddress && typeof orderData.billingAddress === 'object'
        ? orderData.billingAddress
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
          shipping_address: shippingAddressObj,
          billing_address: billingAddressObj,
          cart_id: orderData.cartId || null, // ✅ Vincular con carrito para limpieza server-side
        })
        .select()
        .single();

      if (error) throw error;

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
      console.log('[CheckoutService] Iniciando pago con Khipu - paymentData (pre-seal):', paymentData);

      // Seguridad: pedir al servidor que selle el pricing y use su grand_total
      let sealedAmount = null;
      try {
        const { data: sealed, error: sealErr } = await supabase.rpc('finalize_order_pricing', { p_order_id: paymentData.orderId });
        if (sealErr) {
          console.error('[CheckoutService] finalize_order_pricing error:', sealErr);
          throw sealErr;
        }
        // sealed puede venir como objeto o como array según supabase client; normalizar
        const sealedOrder = Array.isArray(sealed) ? sealed[0] : sealed;
        const sealedTotalBase = Math.round(Number(sealedOrder?.total || 0));
        const sealedPaymentFee = Math.round(Number(sealedOrder?.payment_fee || 0));
        sealedAmount = Math.round(Number(sealedOrder?.grand_total ?? (sealedTotalBase + sealedPaymentFee)));
        console.log('[CheckoutService] Sealed pricing received', { sealedTotalBase, sealedPaymentFee, sealedAmount, request_id: sealedOrder?.request_id });
      } catch (sealEx) {
        console.error('[CheckoutService] No se pudo sellar el precio antes de invocar Khipu:', sealEx);
        throw new Error('No se pudo verificar el precio sellado');
      }

      // Validar monto sellado
      if (!khipuService.validateAmount(sealedAmount)) {
        console.error('[CheckoutService] Monto sellado inválido:', sealedAmount);
        throw new Error('Monto sellado inválido para Khipu');
      }

      // Crear orden de pago en Khipu usando monto sellado por el servidor
      const khipuResponse = await khipuService.createPaymentOrder({
        orderId: paymentData.orderId,
        userId: paymentData.userId,
        userEmail: paymentData.userEmail,
        total: sealedAmount,
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
   * Procesar pago con Flow
   * @param {Object} paymentData - Datos del pago
   * @returns {Object} Resultado del pago
   */
  async processFlowPayment(paymentData) {
    try {
      console.log('[CheckoutService] Iniciando pago con Flow - paymentData (pre-seal):', paymentData);

      // Seguridad: pedir al servidor que selle el pricing y use su grand_total
      let sealedAmount = null;
      try {
        const { data: sealed, error: sealErr } = await supabase.rpc('finalize_order_pricing', { p_order_id: paymentData.orderId });
        if (sealErr) {
          console.error('[CheckoutService] finalize_order_pricing error (Flow):', sealErr);
          throw sealErr;
        }
        const sealedOrder = Array.isArray(sealed) ? sealed[0] : sealed;
        const sealedTotalBase = Math.round(Number(sealedOrder?.total || 0));
        const sealedPaymentFee = Math.round(Number(sealedOrder?.payment_fee || 0));
        sealedAmount = Math.round(Number(sealedOrder?.grand_total ?? (sealedTotalBase + sealedPaymentFee)));
        console.log('[CheckoutService] Flow sealed pricing received', { sealedTotalBase, sealedPaymentFee, sealedAmount });
      } catch (sealEx) {
        console.error('[CheckoutService] No se pudo sellar el precio antes de invocar Flow:', sealEx);
        throw new Error('No se pudo verificar el precio sellado');
      }

      // Validar monto sellado
      if (!flowService.validateAmount(sealedAmount)) {
        console.error('[CheckoutService] Monto sellado inválido para Flow:', sealedAmount);
        throw new Error('Monto inválido para Flow (mínimo $350 CLP)');
      }

      // Crear orden de pago en Flow usando monto sellado
      const flowResponse = await flowService.createPaymentOrder({
        orderId: paymentData.orderId,
        userId: paymentData.userId,
        userEmail: paymentData.userEmail,
        total: sealedAmount,
        currency: paymentData.currency || 'CLP',
        items: paymentData.items,
        shippingAddress: paymentData.shippingAddress || null,
        billingAddress: paymentData.billingAddress || null,
      });

      if (!flowResponse.success) {
        throw new Error('Error al crear orden de pago en Flow');
      }

      // Crear transacción de pago
      const { error: transactionError } = await supabase
        .from('payment_transactions')
        .insert({
          order_id: paymentData.orderId,
          payment_method: 'flow',
          external_payment_id: flowResponse.flowOrder?.toString() || flowResponse.token,
          external_transaction_id: flowResponse.token,
          amount: sealedAmount,
          currency: paymentData.currency || 'CLP',
          status: 'pending',
          gateway_response: flowResponse,
        });

      if (transactionError) {
        console.error('[CheckoutService] Error creando transacción Flow:', transactionError);
        // No lanzar error, la orden ya se creó correctamente
      }

      console.log('[CheckoutService] Pago Flow creado exitosamente:', flowResponse);

      return {
        success: true,
        flowOrder: flowResponse.flowOrder,
        paymentUrl: flowResponse.paymentUrl,
        token: flowResponse.token,
        status: PAYMENT_STATUS.PENDING,
        paymentMethod: 'flow',
        processedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error processing Flow payment:', error);
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
