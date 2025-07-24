/**
 * ============================================================================
 * COUPONS HOOK - GESTIÓN DE CUPONES DE DESCUENTO
 * ============================================================================
 *
 * Hook independiente para manejar cupones de descuento.
 * Incluye validación, aplicación y cálculos de descuentos.
 */

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { showSuccessToast, showErrorToast, showWarningToast } from '../../../utils/toastHelpers'
import { DISCOUNT_CODES } from '../../constants/discounts' // ✅ MIGRADO: Era domains/marketplace/hooks/constants

/**
 * Hook para gestión de cupones
 */
const useCoupons = create(
  persist(
    (set, get) => ({
      // Estado de cupones
      appliedCoupons: [],
      couponInput: '',

      // === FUNCIONES DE CUPONES ===

      /**
       * Aplicar cupón de descuento
       * @param {string} code - Código del cupón
       * @param {number} subtotal - Subtotal actual del carrito
       */
      applyCoupon: (code, subtotal = 0) => {
        const state = get()
        const coupon = DISCOUNT_CODES[code.toUpperCase()]

        // Validaciones
        if (!coupon) {
          showErrorToast('Código de descuento inválido', { icon: '❌' })
          return false
        }

        if (subtotal < coupon.minAmount) {
          showWarningToast(
            `Compra mínima de $${coupon.minAmount.toLocaleString()} requerida`,
            { icon: '⚠️' }
          )
          return false
        }

        const alreadyApplied = state.appliedCoupons.find(
          (c) => c.code === code.toUpperCase()
        )
        if (alreadyApplied) {
          showWarningToast('Cupón ya aplicado', { icon: '⚠️' })
          return false
        }

        // Validar compatibilidad de cupones
        if (!get().isCouponCompatible(coupon)) {
          showWarningToast(
            'Este cupón no es compatible con otros cupones aplicados',
            { icon: '⚠️' }
          )
          return false
        }

        // Aplicar cupón
        const couponWithMetadata = {
          ...coupon,
          code: code.toUpperCase(),
          appliedAt: new Date().toISOString(),
        }

        set({
          appliedCoupons: [...state.appliedCoupons, couponWithMetadata],
          couponInput: '',
        })

        showSuccessToast(`Cupón ${code} aplicado correctamente`, { icon: '🎉' })
        return true
      },

      /**
       * Remover cupón de descuento
       * @param {string} code - Código del cupón a remover
       */
      removeCoupon: (code) => {
        const state = get()
        const coupon = state.appliedCoupons.find((c) => c.code === code)

        if (coupon) {
          set({
            appliedCoupons: state.appliedCoupons.filter((c) => c.code !== code),
          })

          showSuccessToast(`Cupón ${code} removido`, { icon: '🗑️' })
          return true
        }
        return false
      },

      /**
       * Verificar si un cupón es compatible con los ya aplicados
       * @param {Object} newCoupon - Cupón a verificar
       */
      isCouponCompatible: (newCoupon) => {
        const state = get()

        // Reglas de compatibilidad (puede expandirse según necesidades)
        for (const appliedCoupon of state.appliedCoupons) {
          // No permitir múltiples cupones de porcentaje
          if (newCoupon.percentage && appliedCoupon.percentage) {
            return false
          }

          // No permitir múltiples cupones de envío gratis
          if (newCoupon.shipping === 0 && appliedCoupon.shipping === 0) {
            return false
          }
        }

        return true
      },

      /**
       * Calcular descuento total basado en cupones aplicados
       * @param {number} subtotal - Subtotal del carrito
       */
      getDiscount: (subtotal = 0) => {
        const state = get()

        return state.appliedCoupons.reduce((total, coupon) => {
          if (coupon.percentage) {
            return total + (subtotal * coupon.percentage) / 100
          }
          if (coupon.amount) {
            return total + coupon.amount
          }
          return total
        }, 0)
      },

      /**
       * Verificar si hay cupones de envío gratis
       */
      hasFreeShipping: () => {
        const state = get()
        return state.appliedCoupons.some((c) => c.shipping === 0)
      },

      /**
       * Obtener información detallada de descuentos
       * @param {number} subtotal - Subtotal del carrito
       */
      getDiscountBreakdown: (subtotal = 0) => {
        const state = get()

        return state.appliedCoupons.map((coupon) => {
          let discountAmount = 0
          let discountType = 'unknown'

          if (coupon.percentage) {
            discountAmount = (subtotal * coupon.percentage) / 100
            discountType = 'percentage'
          } else if (coupon.amount) {
            discountAmount = coupon.amount
            discountType = 'fixed'
          }

          return {
            code: coupon.code,
            name: coupon.name || coupon.code,
            type: discountType,
            amount: discountAmount,
            original: coupon,
            appliedAt: coupon.appliedAt,
          }
        })
      },

      /**
       * Validar cupón sin aplicarlo
       * @param {string} code - Código del cupón
       * @param {number} subtotal - Subtotal actual
       */
      validateCoupon: (code, subtotal = 0) => {
        const coupon = DISCOUNT_CODES[code.toUpperCase()]

        if (!coupon) {
          return { valid: false, reason: 'Código inválido' }
        }

        if (subtotal < coupon.minAmount) {
          return {
            valid: false,
            reason: `Compra mínima de $${coupon.minAmount.toLocaleString()} requerida`,
          }
        }

        const state = get()
        const alreadyApplied = state.appliedCoupons.find(
          (c) => c.code === code.toUpperCase()
        )
        if (alreadyApplied) {
          return { valid: false, reason: 'Cupón ya aplicado' }
        }

        if (!get().isCouponCompatible(coupon)) {
          return {
            valid: false,
            reason: 'No compatible con otros cupones aplicados',
          }
        }

        return { valid: true, coupon }
      },

      /**
       * Obtener estadísticas de cupones
       */
      getCouponStats: () => {
        const state = get()
        const totalCoupons = state.appliedCoupons.length

        const stats = {
          totalApplied: totalCoupons,
          percentageCoupons: state.appliedCoupons.filter((c) => c.percentage)
            .length,
          fixedCoupons: state.appliedCoupons.filter((c) => c.amount).length,
          freeShippingCoupons: state.appliedCoupons.filter(
            (c) => c.shipping === 0
          ).length,
          mostRecentCoupon:
            totalCoupons > 0
              ? state.appliedCoupons.sort(
                  (a, b) => new Date(b.appliedAt) - new Date(a.appliedAt)
                )[0]
              : null,
        }

        return stats
      },

      /**
       * Limpiar todos los cupones
       */
      clearAllCoupons: () => {
        const state = get()
        const couponCount = state.appliedCoupons.length

        if (couponCount > 0) {
          set({
            appliedCoupons: [],
            couponInput: '',
          })

          toast.success(`${couponCount} cupón(es) removido(s)`, { icon: '🧹' })
          return couponCount
        }
        return 0
      },

      /**
       * Establecer input de cupón
       * @param {string} value - Valor del input
       */
      setCouponInput: (value) => {
        set({ couponInput: value })
      },

      /**
       * Obtener cupones disponibles (para mostrar sugerencias)
       */
      getAvailableCoupons: () => {
        return Object.keys(DISCOUNT_CODES).map((code) => ({
          code,
          ...DISCOUNT_CODES[code],
        }))
      },

      /**
       * Resetear cupones (para demos)
       */
      resetCoupons: () => {
        set({
          appliedCoupons: [],
          couponInput: '',
        })
      },
    }),
    {
      name: 'sellsi-coupons-v1',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        appliedCoupons: state.appliedCoupons,
        lastModified: Date.now(),
        version: '1.0',
      }),
    }
  )
)

export default useCoupons
