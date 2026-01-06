// ============================================================================
// PAYMENT METHODS HOOK - GESTIÓN DE MÉTODOS DE PAGO
// ============================================================================

import { create } from 'zustand';
import { PAYMENT_METHODS } from '../constants/paymentMethods';
import { supabase } from '../../../services/supabase';

const usePaymentMethods = create((set, get) => ({
  // ===== ESTADO =====
  availableMethods: [],
  selectedMethod: null,
  isValidating: false,
  validationErrors: {},
  isLoadingMethods: true,

  // ===== ACCIONES =====

  // Cargar métodos de pago desde Supabase
  loadPaymentMethods: async () => {
    try {
      set({ isLoadingMethods: true });
      
      const { data, error } = await supabase
        .from('payment_methods_config')
        .select('*')
        .single();

      if (error) {
        console.error('Error loading payment methods config:', error);
        // Fallback: usar configuración por defecto de PAYMENT_METHODS
        set({
          availableMethods: Object.values(PAYMENT_METHODS).filter(m => m.enabled),
          isLoadingMethods: false,
        });
        return;
      }

      // Filtrar métodos según configuración de la BD
      const enabledMethods = Object.values(PAYMENT_METHODS).filter(method => {
        if (method.id === 'khipu') return data.khipu_enabled;
        if (method.id === 'flow') return data.flow_enabled;
        if (method.id === 'bank_transfer') return data.bank_transfer_enabled;
        return false;
      });

      set({
        availableMethods: enabledMethods,
        isLoadingMethods: false,
      });
    } catch (error) {
      console.error('Error in loadPaymentMethods:', error);
      // Fallback
      set({
        availableMethods: Object.values(PAYMENT_METHODS).filter(m => m.enabled),
        isLoadingMethods: false,
      });
    }
  },

  // Seleccionar método de pago
  selectMethod: methodId => {
    const method = get().availableMethods.find(m => m.id === methodId);
    if (method) {
      set({
        selectedMethod: method,
        validationErrors: {},
      });
    }
  },

  // Validar método de pago
  validateMethod: async (methodId, amount) => {
    const method = get().availableMethods.find(m => m.id === methodId);
    if (!method) return false;

    set({ isValidating: true, validationErrors: {} });

    try {
      const errors = {};

      // Validar monto mínimo
      if (method.minAmount && amount < method.minAmount) {
        errors.amount = `El monto mínimo es ${method.minAmount.toLocaleString(
          'es-CL',
          { style: 'currency', currency: 'CLP' }
        )}`;
      }

      // Validar monto máximo
      if (method.maxAmount && amount > method.maxAmount) {
        errors.amount = `El monto máximo es ${method.maxAmount.toLocaleString(
          'es-CL',
          { style: 'currency', currency: 'CLP' }
        )}`;
      }

      // Validar moneda soportada
      if (
        method.supportedCurrencies &&
        !method.supportedCurrencies.includes('CLP')
      ) {
        errors.currency = 'Moneda no soportada';
      }

      set({
        isValidating: false,
        validationErrors: errors,
      });

      return Object.keys(errors).length === 0;
    } catch (error) {
      set({
        isValidating: false,
        validationErrors: { general: 'Error al validar método de pago' },
      });
      return false;
    }
  },

  // Obtener comisiones del método
  getMethodFees: (methodId, amount) => {
    const method = get().availableMethods.find(m => m.id === methodId);
    if (!method || !method.fees) return { percentage: 0, fixed: 0, total: 0 };

    const percentageFee = (amount * method.fees.percentage) / 100;
    const fixedFee = method.fees.fixed;
    const totalFee = percentageFee + fixedFee;

    return {
      percentage: percentageFee,
      fixed: fixedFee,
      total: totalFee,
    };
  },

  // Calcular total con comisiones
  calculateTotalWithFees: (methodId, amount) => {
    const fees = get().getMethodFees(methodId, amount);
    return amount + fees.total;
  },

  // Resetear estado
  reset: () => {
    set({
      selectedMethod: null,
      isValidating: false,
      validationErrors: {},
    });
  },
}));

export default usePaymentMethods;
