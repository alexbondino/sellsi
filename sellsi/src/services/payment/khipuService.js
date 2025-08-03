// ============================================================================
// KHIPU SERVICE - INTEGRACIÓN CON API DE KHIPU
// ============================================================================

import { supabase } from '../supabase'

class KhipuService {
  constructor() {
    // URLs de la API de Khipu
    this.apiUrl = 'https://api.khipu.com/v3'
    
    // URLs de retorno y notificación (cambiar por las URLs reales de producción)
    this.baseUrl = import.meta.env.VITE_APP_URL || 'http://localhost:5173'
    this.returnUrl = `${this.baseUrl}/checkout/success`
    this.cancelUrl = `${this.baseUrl}/checkout/cancel`
    this.notifyUrl = `${this.baseUrl}/api/webhooks/khipu-confirmation`
  }

  /**
   * Crear orden de pago en Khipu
   * @param {Object} orderData - Datos de la orden
   * @returns {Object} Respuesta de Khipu con URL de pago
   */
  async createPaymentOrder(orderData) {
    try {
      // Obtener las credenciales de Khipu desde variables de entorno
      const receiverId = import.meta.env.VITE_KHIPU_RECEIVER_ID
      const secret = import.meta.env.VITE_KHIPU_SECRET

      if (!receiverId || !secret) {
        throw new Error('Credenciales de Khipu no configuradas')
      }

      // Preparar datos para Khipu
      const khipuData = {
        subject: `Orden de compra Sellsi #${orderData.orderId}`,
        amount: Math.round(orderData.total), // Khipu requiere enteros
        currency: orderData.currency || 'CLP',
        transaction_id: `SELLSI-${orderData.orderId}-${Date.now()}`,
        return_url: this.returnUrl,
        cancel_url: this.cancelUrl,
        notify_url: this.notifyUrl,
        // Información adicional
        custom: JSON.stringify({
          orderId: orderData.orderId,
          userId: orderData.userId,
          items: orderData.items?.length || 0
        }),
        expires_date: this.getExpirationDate(), // 24 horas para completar el pago
        send_email: false, // No enviar email automático
        payer_email: orderData.userEmail || ''
      }

      // Llamar a la función Edge de Supabase que maneja la API de Khipu
      const { data, error } = await supabase.functions.invoke('create-khipu-payment', {
        body: {
          khipuData,
          receiverId,
          secret
        }
      })

      if (error) {
        throw new Error(error.message || 'Error al crear orden de pago')
      }

      if (!data.success) {
        throw new Error(data.error || 'Error al procesar orden de pago')
      }

      return {
        success: true,
        paymentId: data.payment_id,
        paymentUrl: data.payment_url,
        transactionId: khipuData.transaction_id,
        expiresAt: khipuData.expires_date
      }

    } catch (error) {
      throw new Error(`Error al crear orden de pago: ${error.message}`)
    }
  }

  /**
   * Verificar estado de pago
   * @param {string} paymentId - ID del pago en Khipu
   * @returns {Object} Estado del pago
   */
  async verifyPaymentStatus(paymentId) {
    try {
      const receiverId = import.meta.env.VITE_KHIPU_RECEIVER_ID
      const secret = import.meta.env.VITE_KHIPU_SECRET

      if (!receiverId || !secret) {
        throw new Error('Credenciales de Khipu no configuradas')
      }

      const { data, error } = await supabase.functions.invoke('verify-khipu-payment', {
        body: {
          paymentId,
          receiverId,
          secret
        }
      })

      if (error) {
        throw new Error(error.message || 'Error al verificar pago')
      }

      return {
        success: true,
        status: data.status,
        paymentId: data.payment_id,
        transactionId: data.transaction_id,
        amount: data.amount,
        currency: data.currency,
        paidAt: data.paid_at
      }

    } catch (error) {
      throw new Error(`Error al verificar pago: ${error.message}`)
    }
  }

  /**
   * Procesar notificación webhook de Khipu
   * @param {Object} webhookData - Datos del webhook
   * @param {string} signature - Firma del webhook
   * @returns {Object} Resultado del procesamiento
   */
  async processWebhookNotification(webhookData, signature) {
    try {
      const secret = import.meta.env.VITE_KHIPU_SECRET

      if (!secret) {
        throw new Error('Secret de Khipu no configurado')
      }

      // Verificar firma del webhook
      const { data, error } = await supabase.functions.invoke('process-khipu-webhook', {
        body: {
          webhookData,
          signature,
          secret
        }
      })

      if (error) {
        throw new Error(error.message || 'Error al procesar webhook')
      }

      return data

    } catch (error) {
      throw new Error(`Error al procesar notificación: ${error.message}`)
    }
  }

  /**
   * Obtener fecha de expiración (24 horas desde ahora)
   * @returns {string} Fecha en formato ISO
   */
  getExpirationDate() {
    const now = new Date()
    const expiration = new Date(now.getTime() + (24 * 60 * 60 * 1000)) // 24 horas
    return expiration.toISOString()
  }

  /**
   * Generar ID de transacción único
   * @param {string} orderId - ID de la orden
   * @returns {string} ID de transacción
   */
  generateTransactionId(orderId) {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substr(2, 5).toUpperCase()
    return `SELLSI-${orderId}-${timestamp}-${random}`
  }

  /**
   * Formatear monto para Khipu (entero sin decimales)
   * @param {number} amount - Monto con decimales
   * @returns {number} Monto entero
   */
  formatAmount(amount) {
    return Math.round(amount)
  }

  /**
   * Validar monto mínimo y máximo
   * @param {number} amount - Monto a validar
   * @returns {boolean} Es válido
   */
  validateAmount(amount) {
    const MIN_AMOUNT = 10 // CLP 10
    const MAX_AMOUNT = 10000000 // CLP 10M
    
    return amount >= MIN_AMOUNT && amount <= MAX_AMOUNT
  }
}

// Instancia singleton
const khipuService = new KhipuService()
export default khipuService
