// src/domains/checkout/services/flowService.js
// Flow Payment Service - Integración con Flow.cl

import { supabase } from '../../../services/supabase';
import { calculatePriceForQuantity } from '../../../utils/priceCalculation';

class FlowService {
  /**
   * Crear orden de pago en Flow
   * @param {Object} orderDetails - Datos de la orden
   * @returns {Object} Respuesta con URL de pago
   */
  async createPaymentOrder(orderDetails) {
    const {
      total,
      currency,
      orderId,
      userId,
      userEmail,
      items,
      shippingAddress,
      billingAddress,
    } = orderDetails;

    try {
      // Pre-inyectar precio efectivo por tier (igual que khipuService)
      const normalizedItems = Array.isArray(items)
        ? items.map(it => {
            const priceTiers = it.price_tiers || it.priceTiers || it.tiers || [];
            const basePrice =
              it.originalPrice ||
              it.precioOriginal ||
              it.basePrice ||
              it.price ||
              it.price_at_addition ||
              0;
            let effective = basePrice;
            try {
              if (priceTiers && priceTiers.length) {
                effective = calculatePriceForQuantity(
                  it.quantity || 1,
                  priceTiers,
                  basePrice
                );
              }
            } catch (_) {}
            return { ...it, __effective_price: effective };
          })
        : [];

      // Extraer offer_ids distintos de los items
      const offerIdsDistinct = Array.from(
        new Set(
          (normalizedItems || [])
            .map(
              it =>
                it.offer_id || it.offerId || (it.metadata && it.metadata.offer_id)
            )
            .filter(Boolean)
        )
      );

      const paymentPayload = {
        amount: Math.round(total),
        subject: `Compra Sellsi #${orderId}`,
        currency: currency || 'CLP',
        buyer_id: userId || null,
        order_id: orderId,
        user_email: userEmail,
        offer_ids: offerIdsDistinct.length ? offerIdsDistinct : undefined,
        cart_items: normalizedItems.map(it => {
          const priceBase =
            it.__effective_price ||
            it.price ||
            it.price_at_addition ||
            it.unitPrice ||
            0;
          return {
            product_id:
              it.product_id ||
              it.id ||
              it.productid ||
              (it.product &&
                (it.product.product_id || it.product.id || it.product.productid)) ||
              null,
            quantity: it.quantity || 1,
            price: priceBase,
            price_at_addition: priceBase,
            supplier_id:
              it.supplier_id ||
              it.supplierId ||
              (it.product &&
                (it.product.supplier_id || it.product.supplierId)) ||
              null,
            offer_id:
              it.offer_id ||
              it.offerId ||
              (it.metadata && it.metadata.offer_id) ||
              null,
            document_type: (() => {
              const raw =
                it.document_type ||
                it.documentType ||
                (it.product &&
                  (it.product.document_type || it.product.documentType)) ||
                '';
              const v = String(raw).toLowerCase();
              return v === 'boleta' || v === 'factura' ? v : 'ninguno';
            })(),
          };
        }),
      };

      // Añadir direcciones solo si existen
      if (shippingAddress && typeof shippingAddress === 'object') {
        paymentPayload.shipping_address = shippingAddress;
      }
      if (billingAddress && typeof billingAddress === 'object') {
        paymentPayload.billing_address = billingAddress;
      }

      console.log(
        '[flowService] Invocando create-payment-flow con payload:',
        JSON.stringify(paymentPayload)
      );

      const { data: flowResponse, error } = await supabase.functions.invoke(
        'create-payment-flow',
        { body: paymentPayload }
      );

      // Manejo robusto de errores
      if (error?.context) {
        console.warn('[flowService] Error context:', error.context);
        try {
          const ctx = error.context;
          const possible = ctx.response || ctx.body || ctx.raw || ctx;
          if (typeof possible === 'string') {
            console.warn('[flowService] Error body (string):', possible);
          } else if (possible && typeof possible === 'object') {
            console.warn(
              '[flowService] Error body (json):',
              JSON.stringify(possible, null, 2)
            );
          }
        } catch (parseCtxErr) {
          console.warn(
            '[flowService] No se pudo parsear error.context:',
            parseCtxErr
          );
        }
      }

      if (error) {
        console.error(
          '[flowService] Error bruto supabase.functions.invoke:',
          JSON.stringify(error, null, 2)
        );
        throw new Error(
          `Error al invocar create-payment-flow: ${error.message}`
        );
      }

      if (flowResponse?.error) {
        console.error(
          '[flowService] Edge Function returned error:',
          flowResponse
        );
        throw new Error(
          `Error devuelto por create-payment-flow: ${flowResponse.error}`
        );
      }

      // Log de valores sellados
      if (flowResponse?.sealed_grand_total !== undefined) {
        console.log('[flowService] Sellado recibido:', {
          sealed_grand_total: flowResponse.sealed_grand_total,
          sealed_payment_fee: flowResponse.sealed_payment_fee,
          request_id: flowResponse.request_id,
        });
      }

      if (!flowResponse?.payment_url) {
        console.error(
          '[flowService] Respuesta inesperada de create-payment-flow:',
          flowResponse
        );
        throw new Error('La respuesta no contenía una URL de pago');
      }

      return {
        success: true,
        paymentUrl: flowResponse.payment_url,
        flowOrder: flowResponse.flow_order,
        token: flowResponse.token,
        sealedGrandTotal: flowResponse.sealed_grand_total,
        requestId: flowResponse.request_id,
      };
    } catch (err) {
      console.error('Error en flowService.createPaymentOrder:', err);
      throw err;
    }
  }

  /**
   * Validar monto mínimo para Flow
   * @param {number} amount - Monto a validar
   * @returns {boolean} true si el monto es válido
   */
  validateAmount(amount) {
    return amount >= 350; // Mínimo Flow ~$350 CLP
  }

  /**
   * Verificar estado de pago (placeholder)
   * @param {string} token - Token del pago
   * @returns {Object} Estado del pago
   */
  async verifyPaymentStatus(token) {
    console.warn('flowService.verifyPaymentStatus no está implementado aún.');
    return { success: false, status: 'unknown' };
  }
}

const flowService = new FlowService();
export default flowService;
