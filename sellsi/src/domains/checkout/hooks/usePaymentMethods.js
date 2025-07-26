// ============================================================================
// PAYMENT METHODS HOOK - GESTIÓN DE MÉTODOS DE PAGO
// ============================================================================

import { create } from 'zustand'
import { PAYMENT_METHODS } from '../constants/paymentMethods'

const usePaymentMethods = create((set, get) => ({
  // ===== ESTADO =====
  availableMethods: Object.values(PAYMENT_METHODS).filter(method => method.enabled),
  selectedMethod: null,
  isValidating: false,
  validationErrors: {},

  // ===== ACCIONES =====
  
  // Seleccionar método de pago
  selectMethod: (methodId) => {
    const method = get().availableMethods.find(m => m.id === methodId)
    if (method) {
      set({
        selectedMethod: method,
        validationErrors: {}
      })
    }
  },

  // Validar método de pago
  validateMethod: async (methodId, amount) => {
    const method = get().availableMethods.find(m => m.id === methodId)
    if (!method) return false

    set({ isValidating: true, validationErrors: {} })

    try {
      const errors = {}

      // Validar monto mínimo
      if (method.minAmount && amount < method.minAmount) {
        errors.amount = `El monto mínimo es ${method.minAmount.toLocaleString('es-CL', { style: 'currency', currency: 'CLP' })}`
      }

      // Validar monto máximo
      if (method.maxAmount && amount > method.maxAmount) {
        errors.amount = `El monto máximo es ${method.maxAmount.toLocaleString('es-CL', { style: 'currency', currency: 'CLP' })}`
      }

      // Validar moneda soportada
      if (method.supportedCurrencies && !method.supportedCurrencies.includes('CLP')) {
        errors.currency = 'Moneda no soportada'
      }

      set({
        isValidating: false,
        validationErrors: errors
      })

      return Object.keys(errors).length === 0
    } catch (error) {
      set({
        isValidating: false,
        validationErrors: { general: 'Error al validar método de pago' }
      })
      return false
    }
  },

  // Obtener comisiones del método
  getMethodFees: (methodId, amount) => {
    const method = get().availableMethods.find(m => m.id === methodId)
    if (!method || !method.fees) return { percentage: 0, fixed: 0, total: 0 }

    const percentageFee = (amount * method.fees.percentage) / 100
    const fixedFee = method.fees.fixed
    const totalFee = percentageFee + fixedFee

    return {
      percentage: percentageFee,
      fixed: fixedFee,
      total: totalFee
    }
  },

  // Calcular total con comisiones
  calculateTotalWithFees: (methodId, amount) => {
    const fees = get().getMethodFees(methodId, amount)
    return amount + fees.total
  },

  // Resetear estado
  reset: () => {
    set({
      selectedMethod: null,
      isValidating: false,
      validationErrors: {}
    })
  }
}))

export default usePaymentMethods
