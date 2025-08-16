// src/services/payment/khipuService.js
// VERSIÓN FINAL Y DINÁMICA

import { supabase } from '../../../services/supabase';

class KhipuService {
  async createPaymentOrder(orderDetails) {
  const { total, currency, orderId, userId, items } = orderDetails;

    try {
      // <-- CAMBIO 1: Volvemos a preparar el payload con los datos reales de la orden.
      const paymentPayload = {
        amount: Math.round(total),
        currency: currency || 'CLP',
        subject: `Pago de Orden #${orderId}`,
        buyer_id: userId || null,
        cart_id: orderId || null,
        order_id: orderId, // NUEVO: para que la función actualice la orden existente
        cart_items: Array.isArray(items)
          ? items.map(it => {
              const priceBase = it.price || it.price_at_addition || it.unitPrice || 0;
              return {
                product_id: it.product_id || it.id || it.productid || (it.product && (it.product.product_id || it.product.id || it.product.productid)) || null,
                quantity: it.quantity || 1,
                price: priceBase,
                price_at_addition: it.price_at_addition || priceBase,
                supplier_id: it.supplier_id || it.supplierId || (it.product && (it.product.supplier_id || it.product.supplierId)) || null,
                document_type: (() => {
                  const raw = it.document_type || it.documentType || (it.product && (it.product.document_type || it.product.documentType)) || '';
                  const v = String(raw).toLowerCase();
                  return v === 'boleta' || v === 'factura' ? v : 'ninguno';
                })(),
              };
            })
          : [],
      };

      // <-- CAMBIO 2: Invocamos la función pasándole el 'body' con los datos dinámicos.
      const { data: khipuResponse, error } = await supabase.functions.invoke('create-payment-khipu', {
        body: paymentPayload,
      });

      if (error) {
        throw new Error(
          `Error al invocar la función de Supabase: ${error.message}`
        );
      }
      if (khipuResponse?.error) {
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
