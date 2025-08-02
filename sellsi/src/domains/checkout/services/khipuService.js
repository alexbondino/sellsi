// src/services/payment/khipuService.js
// VERSIÓN CORREGIDA PARA PAGO FIJO

import { supabase } from '../../../services/supabase';

class KhipuService {
  async createPaymentOrder(orderDetails) {
    try {
      console.log(`[khipuService] Activando la función de pago fijo.`);

      // <-- CAMBIO CLAVE: Invocamos la función sin un 'body'.
      // La Edge Function ya tiene el monto de $500, así que no necesitamos enviarle nada.
      const { data: khipuResponse, error } = await supabase.functions.invoke(
        'create-payment-khipu'
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

      // El resto de la lógica para devolver los datos es correcta.
      return {
        success: true,
        paymentUrl: khipuResponse.payment_url,
        paymentId: khipuResponse.payment_id,
        transactionId: khipuResponse.transaction_id,
        expiresAt: khipuResponse.expires_date,
      };
    } catch (err) {
      console.error('Error en khipuService.createPaymentOrder:', err);
      throw err; // Re-lanzamos para que CheckoutService lo maneje.
    }
  }

  // Los otros métodos no necesitan cambios.
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
