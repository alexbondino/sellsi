// src/services/payment/khipuService.js
// VERSIÓN FINAL Y DINÁMICA

import { supabase } from '../../../services/supabase';
import { calculatePriceForQuantity } from '../../../utils/priceCalculation';

class KhipuService {
  async createPaymentOrder(orderDetails) {
  const { total, currency, orderId, userId, items, shippingAddress, billingAddress } = orderDetails;

    try {
      // <-- CAMBIO 1: Volvemos a preparar el payload con los datos reales de la orden.
      // Pre-inyectar precio efectivo por tier
      const normalizedItems = Array.isArray(items) ? items.map(it => {
        const priceTiers = it.price_tiers || it.priceTiers || it.tiers || [];
        const basePrice = it.originalPrice || it.precioOriginal || it.basePrice || it.price || it.price_at_addition || 0;
        let effective = basePrice;
        try { if (priceTiers && priceTiers.length) effective = calculatePriceForQuantity(it.quantity || 1, priceTiers, basePrice); } catch(_) {}
        return { ...it, __effective_price: effective };
      }) : [];

      // Extraer offer_ids distintos de los items (si existen)
      const offerIdsDistinct = Array.from(new Set((normalizedItems || [])
        .map(it => it.offer_id || it.offerId || (it.metadata && it.metadata.offer_id))
        .filter(Boolean)));

      const paymentPayload = {
        amount: Math.round(total),
        currency: currency || 'CLP',
        subject: `Pago de Orden #${orderId}`,
        buyer_id: userId || null,
        cart_id: orderId || null,
        order_id: orderId,
        // Pasar lista de ofertas explícitamente para que el Edge Function pueda validar y aplicar descuentos
        offer_ids: offerIdsDistinct.length ? offerIdsDistinct : undefined,
        cart_items: normalizedItems.map(it => {
              const priceBase = it.__effective_price || it.price || it.price_at_addition || it.unitPrice || 0;
              return {
                product_id: it.product_id || it.id || it.productid || (it.product && (it.product.product_id || it.product.id || it.product.productid)) || null,
                quantity: it.quantity || 1,
                price: priceBase,
                price_at_addition: priceBase,
                supplier_id: it.supplier_id || it.supplierId || (it.product && (it.product.supplier_id || it.product.supplierId)) || null,
                offer_id: it.offer_id || it.offerId || (it.metadata && it.metadata.offer_id) || null,
                document_type: (() => {
                  const raw = it.document_type || it.documentType || (it.product && (it.product.document_type || it.product.documentType)) || '';
                  const v = String(raw).toLowerCase();
                  return v === 'boleta' || v === 'factura' ? v : 'ninguno';
                })(),
              };
            }),
      };

      // Añadir direcciones solo si existen (evita claves null que provocarían intentos de downgrade)
      if (shippingAddress && typeof shippingAddress === 'object') {
        paymentPayload.shipping_address = shippingAddress;
      }
      if (billingAddress && typeof billingAddress === 'object') {
        paymentPayload.billing_address = billingAddress;
      }

      // <-- CAMBIO 2: Invocamos la función pasándole el 'body' con los datos dinámicos.
      console.log('[khipuService] Invocando create-payment-khipu con payload:', JSON.stringify(paymentPayload));
      const { data: khipuResponse, error } = await supabase.functions.invoke('create-payment-khipu', {
        body: paymentPayload,
      });

      if (error && error.context) {
        console.warn('[khipuService] Error context (posible body función):', error.context);
        try {
          // Supabase v2 Functions error suele traer el body en error.context.response o error.context.raw
          const ctx = error.context;
          const possible = ctx.response || ctx.body || ctx.raw || ctx;
          if (typeof possible === 'string') {
            console.warn('[khipuService] Error body (string):', possible);
          } else if (possible && typeof possible === 'object') {
            console.warn('[khipuService] Error body (json):', JSON.stringify(possible, null, 2));
          }
        } catch (parseCtxErr) {
          console.warn('[khipuService] No se pudo parsear error.context:', parseCtxErr);
        }
      }

      if (error) {
        console.error('[khipuService] Error bruto supabase.functions.invoke (detalle completo):', JSON.stringify(error, null, 2));
        throw new Error(
          `Error al invocar la función de Supabase: ${error.message}`
        );
      }
      if (khipuResponse?.error) {
        console.error('[khipuService] Edge Function returned error payload:', khipuResponse);
        throw new Error(
          `Error devuelto por la función de pago: ${khipuResponse.error}`
        );
      }
      if (!khipuResponse?.payment_url) {
        console.error('[khipuService] Respuesta inesperada de create-payment-khipu:', khipuResponse);
        const raw = khipuResponse?.raw ? ` Detalle: ${JSON.stringify(khipuResponse.raw)}` : '';
        throw new Error('La respuesta no contenía una URL de pago.' + raw);
      }

      return {
        success: true,
        paymentUrl: khipuResponse.payment_url,
        paymentId: khipuResponse.payment_id,
        transactionId: khipuResponse.transaction_id,
        expiresAt: khipuResponse.expires_date,
      };
    } catch (err) {
      console.error('Error en khipuService.createPaymentOrder:', err);
      throw err;
    }
  }

  validateAmount(amount) {
    return amount >= 1;
  }

  async verifyPaymentStatus(paymentId) {
    console.warn('khipuService.verifyPaymentStatus no está implementado.');
    return { success: false, status: 'unknown' };
  }
}

const khipuService = new KhipuService();
export default khipuService;
