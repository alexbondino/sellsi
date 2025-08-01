// ============================================================================
// CHECKOUT HOOK - GESTIÓN DE ESTADO DEL PROCESO DE COMPRA
// ============================================================================

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { CHECKOUT_STEPS, CHECKOUT_FLOW } from '../../../shared/constants/checkout'
import { PAYMENT_STATUS } from '../constants/paymentMethods'
import { trackUserAction } from '../../../services/security'

const useCheckout = create(
  persist(
    (set, get) => ({
      // ===== ESTADO DEL CHECKOUT =====
      currentStep: CHECKOUT_STEPS.CART,
      completedSteps: [],
      paymentMethod: null,
      paymentData: null,
      isProcessing: false,
      error: null,
      
      // Datos del pedido
      orderData: {
        items: [],
        subtotal: 0,
        tax: 0,
        serviceFee: 0,
        shipping: 0,
        total: 0,
        currency: 'CLP'
      },
      
      // Estado del pago
      paymentStatus: PAYMENT_STATUS.PENDING,
      transactionId: null,
      paymentReference: null,

      // ===== ACCIONES DEL CHECKOUT =====
      
      // Inicializar checkout con datos del carrito
      initializeCheckout: (cartData) => {
        set({
          orderData: {
            items: cartData.items || [],
            subtotal: cartData.subtotal || 0,
            tax: cartData.tax || Math.round((cartData.subtotal || 0) * 0.19), // IVA 19%
            serviceFee: cartData.serviceFee || Math.round((cartData.subtotal || 0) * 0.03), // Comisión 3%
            shipping: cartData.shipping || 0,
            total: cartData.total || 0,
            currency: 'CLP'
          },
          currentStep: CHECKOUT_STEPS.PAYMENT_METHOD,
          completedSteps: [CHECKOUT_STEPS.CART],
          error: null
        })
      },

      // Seleccionar método de pago
      selectPaymentMethod: (method) => {
        set(state => ({
          paymentMethod: method,
          error: null,
          // Al seleccionar método, marcar el paso como completado
          completedSteps: state.completedSteps.includes(CHECKOUT_STEPS.PAYMENT_METHOD) 
            ? state.completedSteps 
            : [...state.completedSteps, CHECKOUT_STEPS.PAYMENT_METHOD]
        }))
      },

      // Avanzar al siguiente paso
      nextStep: () => {
        const state = get()
        const currentStepIndex = CHECKOUT_FLOW.findIndex(step => step.id === state.currentStep.id)
        
        if (currentStepIndex < CHECKOUT_FLOW.length - 1) {
          const nextStep = CHECKOUT_FLOW[currentStepIndex + 1]
          set({
            currentStep: nextStep,
            completedSteps: [...state.completedSteps, state.currentStep]
          })
        }
      },

      // Regresar al paso anterior
      previousStep: () => {
        const state = get()
        const currentStepIndex = CHECKOUT_FLOW.findIndex(step => step.id === state.currentStep.id)
        
        if (currentStepIndex > 0) {
          const previousStep = CHECKOUT_FLOW[currentStepIndex - 1]
          set({
            currentStep: previousStep,
            completedSteps: state.completedSteps.filter(step => step.id !== state.currentStep.id)
          })
        }
      },

      // Ir a un paso específico
      goToStep: (stepId) => {
        const step = CHECKOUT_FLOW.find(s => s.id === stepId)
        if (step) {
          set({
            currentStep: step,
            error: null
          })
        }
      },

      // Procesar pago
      processPayment: async (paymentData) => {
        set({
          isProcessing: true,
          error: null,
          paymentStatus: PAYMENT_STATUS.PROCESSING
        })

        try {
          // Registrar IP del usuario al iniciar el proceso de pago
          await trackUserAction(`payment_process_started_${paymentData?.method || 'unknown'}`)
          
          // Aquí se integrará con el servicio de pago real
          // Por ahora simulamos el proceso
          await new Promise(resolve => setTimeout(resolve, 2000))
          
          const transactionId = `TXN_${Date.now()}`
          const paymentReference = `REF_${Math.random().toString(36).substr(2, 9)}`
          
          // Registrar IP del usuario al completar el pago
          await trackUserAction(`payment_completed_${paymentData?.method || 'unknown'}`)
          
          set({
            isProcessing: false,
            paymentStatus: PAYMENT_STATUS.COMPLETED,
            transactionId,
            paymentReference,
            paymentData
          })
          
          return {
            success: true,
            transactionId,
            paymentReference
          }
        } catch (error) {
          // Registrar IP del usuario en caso de fallo de pago
          await trackUserAction(`payment_failed_${paymentData?.method || 'unknown'}`)
          
          set({
            isProcessing: false,
            paymentStatus: PAYMENT_STATUS.FAILED,
            error: error.message
          })
          
          throw error
        }
      },

      // Iniciar procesamiento de pago (ir a Khipu)
      startPaymentProcessing: () => {
        set(state => ({
          currentStep: CHECKOUT_STEPS.PROCESSING,
          completedSteps: [...state.completedSteps, CHECKOUT_STEPS.CONFIRMATION],
          isProcessing: true,
          paymentStatus: PAYMENT_STATUS.PROCESSING,
          error: null
        }))
      },

      // Completar pago exitoso (Khipu confirmó)
      completePayment: (transactionData) => {
        set(state => ({
          currentStep: CHECKOUT_STEPS.SUCCESS,
          completedSteps: [...state.completedSteps, CHECKOUT_STEPS.PROCESSING],
          isProcessing: false,
          paymentStatus: PAYMENT_STATUS.COMPLETED,
          transactionId: transactionData.transactionId,
          paymentReference: transactionData.paymentReference,
          error: null
        }))
      },

      // Fallar pago (Khipu rechazó o error)
      failPayment: (errorMessage) => {
        set({
          currentStep: CHECKOUT_STEPS.PAYMENT_METHOD,
          isProcessing: false,
          paymentStatus: PAYMENT_STATUS.FAILED,
          error: errorMessage
        })
      },

      // Completar checkout
      completeCheckout: () => {
        set({
          currentStep: CHECKOUT_STEPS.SUCCESS,
          completedSteps: CHECKOUT_FLOW.slice(0, -1)
        })
      },

      // Resetear checkout
      resetCheckout: () => {
        set({
          currentStep: CHECKOUT_STEPS.CART,
          completedSteps: [],
          paymentMethod: null,
          paymentData: null,
          isProcessing: false,
          error: null,
          orderData: {
            items: [],
            subtotal: 0,
            tax: 0,
            serviceFee: 0,
            shipping: 0,
            total: 0,
            currency: 'CLP'
          },
          paymentStatus: PAYMENT_STATUS.PENDING,
          transactionId: null,
          paymentReference: null
        })
      },

      // Establecer error
      setError: (error) => {
        set({ error })
      },

      // Limpiar error
      clearError: () => {
        set({ error: null })
      }
    }),
    {
      name: 'sellsi-checkout',
      partialize: (state) => ({
        currentStep: state.currentStep,
        completedSteps: state.completedSteps,
        paymentMethod: state.paymentMethod,
        orderData: state.orderData,
        paymentStatus: state.paymentStatus,
        transactionId: state.transactionId,
        paymentReference: state.paymentReference
      })
    }
  )
)

export default useCheckout
