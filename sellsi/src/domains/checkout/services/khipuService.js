// src/services/payment/khipuService.js
// VERSIÓN FINAL Y DINÁMICA

import { supabase } from '../../../services/supabase';

class KhipuService {
  async createPaymentOrder(orderDetails) {
    const { total, currency, orderId } = orderDetails;

    try {
      // <-- CAMBIO 1: Volvemos a preparar el payload con los datos reales de la orden.
      const paymentPayload = {
        amount: Math.round(total),
        currency: currency || 'CLP',
        subject: `Pago de Orden #${orderId}`,
      };

      // <-- CAMBIO 2: Invocamos la función pasándole el 'body' con los datos dinámicos.
      const { data: khipuResponse, error } = await supabase.functions.invoke(
        'create-payment-khipu',
        {
          body: paymentPayload,
        }
      );

      if (error) {
        throw new Error(
          `Error al invocar la función de Supabase: ${error.message}`
        );
      }
      if (khipuResponse.error) {
        throw new Error(
          `Error devuelto por la función de pago: ${khipuResponse.error}`
        );
      }
      if (!khipuResponse.payment_url) {
        throw new Error('La respuesta no contenía una URL de pago.');
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
