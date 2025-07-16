// ============================================================================
// CHECKOUT SERVICE - INTEGRACIÓN CON BACKEND
// ============================================================================

import { supabase } from '../../../services/supabase'
import { PAYMENT_STATUS } from '../constants/paymentMethods'
import { trackUserAction } from '../../../services/ipTrackingService'

class CheckoutService {
  
  // ===== ÓRDENES =====
  
  /**
   * Crear orden de compra
   * @param {Object} orderData - Datos de la orden
   * @returns {Object} Orden creada
   */
  async createOrder(orderData) {
    try {
      // Registrar IP del usuario al crear la orden
      await trackUserAction(`order_created_${orderData.paymentMethod || 'unknown'}`)
      
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
          shipping_address: orderData.shippingAddress,
          billing_address: orderData.billingAddress
        })
        .select()
        .single()

      if (error) throw error

      return data
    } catch (error) {
      console.error('Error creating order:', error)
      throw new Error(`No se pudo crear la orden: ${error.message}`)
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
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)
        .select()
        .single()

      if (error) throw error

      return data
    } catch (error) {
      console.error('Error updating order status:', error)
      throw new Error(`No se pudo actualizar la orden: ${error.message}`)
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
      // TODO: Integrar con API de Khipu
      // Por ahora simulamos el proceso
      
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      const transactionId = `KHIPU_${Date.now()}`
      const paymentReference = `REF_${Math.random().toString(36).substr(2, 9).toUpperCase()}`
      
      // Simular respuesta exitosa
      return {
        success: true,
        transactionId,
        paymentReference,
        status: PAYMENT_STATUS.COMPLETED,
        amount: paymentData.amount,
        currency: paymentData.currency || 'CLP',
        paymentMethod: 'khipu',
        processedAt: new Date().toISOString()
      }
    } catch (error) {
      console.error('Error processing Khipu payment:', error)
      throw new Error(`Error en el pago: ${error.message}`)
    }
  }

  /**
   * Verificar estado de pago
   * @param {string} transactionId - ID de la transacción
   * @returns {Object} Estado del pago
   */
  async verifyPaymentStatus(transactionId) {
    try {
      // TODO: Consultar estado real del pago
      // Por ahora simulamos
      
      return {
        transactionId,
        status: PAYMENT_STATUS.COMPLETED,
        verifiedAt: new Date().toISOString()
      }
    } catch (error) {
      console.error('Error verifying payment status:', error)
      throw new Error(`Error verificando pago: ${error.message}`)
    }
  }

  // ===== VALIDACIONES =====

  /**
   * Validar datos de checkout
   * @param {Object} checkoutData - Datos del checkout
   * @returns {Object} Resultado de la validación
   */
  validateCheckoutData(checkoutData) {
    const errors = {}

    // Validar items
    if (!checkoutData.items || checkoutData.items.length === 0) {
      errors.items = 'No hay productos en el carrito'
    }

    // Validar método de pago
    if (!checkoutData.paymentMethod) {
      errors.paymentMethod = 'Debe seleccionar un método de pago'
    }

    // Validar montos
    if (!checkoutData.total || checkoutData.total <= 0) {
      errors.total = 'El total debe ser mayor a 0'
    }

    // Validar información del usuario
    if (!checkoutData.userId) {
      errors.userId = 'Usuario no autenticado'
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    }
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
      currency
    }).format(amount)
  }

  /**
   * Calcular IVA
   * @param {number} subtotal - Subtotal
   * @returns {number} IVA calculado
   */
  calculateTax(subtotal) {
    return Math.round(subtotal * 0.19) // IVA 19%
  }

  /**
   * Generar referencia de pago
   * @returns {string} Referencia única
   */
  generatePaymentReference() {
    return `PAY_${Date.now()}_${Math.random().toString(36).substr(2, 9).toUpperCase()}`
  }
}

// Instancia singleton
const checkoutService = new CheckoutService()
export default checkoutService
