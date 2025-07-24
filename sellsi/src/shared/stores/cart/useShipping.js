/**
 * ============================================================================
 * SHIPPING HOOK - GESTIÓN DE OPCIONES DE ENVÍO
 * ============================================================================
 *
 * Hook independiente para manejar las opciones de envío.
 * Incluye selección, cálculos de costos y validaciones.
 */

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { showSuccessToast, showErrorToast } from '../../../utils/toastHelpers'
import { SHIPPING_OPTIONS } from '../../../domains/marketplace/hooks/constants'

/**
 * Hook para gestión de envío
 */
const useShipping = create(
  persist(
    (set, get) => ({
      // Estado de envío
      selectedShipping: 'standard',

      // === FUNCIONES DE ENVÍO ===

      /**
       * Seleccionar opción de envío
       * @param {string} optionId - ID de la opción de envío
       */
      setShippingOption: (optionId) => {
        const state = get()
        const currentShipping = state.selectedShipping
        const oldOption = SHIPPING_OPTIONS.find(
          (opt) => opt.id === currentShipping
        )
        const newOption = SHIPPING_OPTIONS.find((opt) => opt.id === optionId)

        if (!newOption) {
          showErrorToast('Opción de envío no válida', { icon: '❌' })
          return false
        }

        set({
          selectedShipping: optionId,
        })

        showSuccessToast(`Envío seleccionado: ${newOption.name}`, { icon: '🚚' })

        return {
          oldOption,
          newOption,
          changed: currentShipping !== optionId,
        }
      },

      /**
       * Obtener costo de envío
       * @param {number} subtotal - Subtotal del carrito
       * @param {boolean} hasFreeShipping - Si hay cupones de envío gratis
       */
      getShippingCost: (subtotal = 0, hasFreeShipping = false) => {
        const state = get()
        const selectedOption = SHIPPING_OPTIONS.find(
          (opt) => opt.id === state.selectedShipping
        )

        if (!selectedOption) return 0

        // Verificar cupones de envío gratis
        if (hasFreeShipping) return 0

        // Envío gratis por compras sobre $100.000
        if (subtotal >= 100000) return 0

        return selectedOption.price
      },

      /**
       * Obtener información completa de envío
       */
      getShippingInfo: () => {
        const state = get()
        return SHIPPING_OPTIONS.find((opt) => opt.id === state.selectedShipping)
      },

      /**
       * Obtener todas las opciones de envío disponibles
       */
      getAvailableShippingOptions: () => {
        return SHIPPING_OPTIONS.map((option) => ({
          ...option,
          selected: option.id === get().selectedShipping,
        }))
      },

      /**
       * Verificar si el envío es elegible para descuentos
       * @param {number} subtotal - Subtotal del carrito
       */
      isEligibleForFreeShipping: (subtotal = 0) => {
        return subtotal >= 100000
      },

      /**
       * Calcular tiempo de entrega estimado
       * @param {Date} orderDate - Fecha de la orden (por defecto hoy)
       */
      getEstimatedDelivery: (orderDate = new Date()) => {
        const state = get()
        const shippingInfo = get().getShippingInfo()

        if (!shippingInfo || !shippingInfo.deliveryDays) {
          return null
        }

        const deliveryDate = new Date(orderDate)
        deliveryDate.setDate(deliveryDate.getDate() + shippingInfo.deliveryDays)

        return {
          option: shippingInfo,
          orderDate,
          estimatedDelivery: deliveryDate,
          businessDays: shippingInfo.deliveryDays,
          formattedDate: deliveryDate.toLocaleDateString('es-CL', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }),
        }
      },

      /**
       * Obtener resumen de costos de envío
       * @param {number} subtotal - Subtotal del carrito
       * @param {boolean} hasFreeShipping - Si hay cupones de envío gratis
       */
      getShippingSummary: (subtotal = 0, hasFreeShipping = false) => {
        const state = get()
        const shippingInfo = get().getShippingInfo()
        const cost = get().getShippingCost(subtotal, hasFreeShipping)
        const isFree = cost === 0

        let freeReason = null
        if (isFree) {
          if (hasFreeShipping) {
            freeReason = 'Cupón de envío gratis aplicado'
          } else if (subtotal >= 100000) {
            freeReason = 'Envío gratis por compras sobre $100.000'
          }
        }

        return {
          option: shippingInfo,
          cost,
          isFree,
          freeReason,
          originalCost: shippingInfo?.price || 0,
          savings: isFree ? shippingInfo?.price || 0 : 0,
          deliveryEstimate: get().getEstimatedDelivery(),
        }
      },

      /**
       * Validar disponibilidad de envío para ubicación
       * @param {Object} location - Información de ubicación
       */
      validateShippingLocation: (location) => {
        // TODO: Implementar validación de ubicación cuando sea necesario
        // Por ahora, asumir que todas las ubicaciones son válidas
        return {
          valid: true,
          availableOptions: SHIPPING_OPTIONS,
          restrictions: [],
        }
      },

      /**
       * Obtener estadísticas de envío
       */
      getShippingStats: () => {
        const state = get()
        const currentOption = get().getShippingInfo()

        return {
          selectedOption: currentOption,
          totalOptions: SHIPPING_OPTIONS.length,
          fastestOption: SHIPPING_OPTIONS.reduce((fastest, option) =>
            (option.deliveryDays || 999) < (fastest.deliveryDays || 999)
              ? option
              : fastest
          ),
          cheapestOption: SHIPPING_OPTIONS.reduce((cheapest, option) =>
            (option.price || 999999) < (cheapest.price || 999999)
              ? option
              : cheapest
          ),
        }
      },

      /**
       * Resetear envío a opción por defecto
       */
      resetShipping: () => {
        set({
          selectedShipping: 'standard',
        })
      },

      /**
       * Obtener recomendación de envío basada en criterios
       * @param {Object} criteria - Criterios de recomendación
       */
      getShippingRecommendation: (criteria = {}) => {
        const {
          prioritizeSpeed = false,
          prioritizeCost = true,
          subtotal = 0,
        } = criteria

        if (prioritizeSpeed) {
          return SHIPPING_OPTIONS.reduce((fastest, option) =>
            (option.deliveryDays || 999) < (fastest.deliveryDays || 999)
              ? option
              : fastest
          )
        }

        if (prioritizeCost) {
          // Si es elegible para envío gratis, recomendar la opción más rápida
          if (get().isEligibleForFreeShipping(subtotal)) {
            return SHIPPING_OPTIONS.reduce((fastest, option) =>
              (option.deliveryDays || 999) < (fastest.deliveryDays || 999)
                ? option
                : fastest
            )
          }

          // Sino, recomendar la más barata
          return SHIPPING_OPTIONS.reduce((cheapest, option) =>
            (option.price || 999999) < (cheapest.price || 999999)
              ? option
              : cheapest
          )
        }

        // Por defecto, envío estándar
        return (
          SHIPPING_OPTIONS.find((opt) => opt.id === 'standard') ||
          SHIPPING_OPTIONS[0]
        )
      },
    }),
    {
      name: 'sellsi-shipping-v1',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        selectedShipping: state.selectedShipping,
        lastModified: Date.now(),
        version: '1.0',
      }),
    }
  )
)

export default useShipping
