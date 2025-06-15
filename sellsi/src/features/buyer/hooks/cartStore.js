/**
 * ============================================================================
 * CART STORE - GESTIÓN GLOBAL DEL CARRITO DE COMPRAS (REFACTORIZADO)
 * ============================================================================
 *
 * Store centralizado refactorizado usando módulos independientes.
 * Ahora delega funcionalidades específicas a hooks especializados.
 *
 * CARACTERÍSTICAS:
 * - ✅ Persistencia automática en localStorage
 * - ✅ Módulos independientes para mejor mantenibilidad
 * - ✅ Cálculos automáticos de totales
 * - ✅ Validación de stock
 * - ✅ Integración con notificaciones
 *
 * MÓDULOS SEPARADOS:
 * - 🔄 useCartHistory: Historial y undo/redo
 * - 🔄 useWishlist: Lista de deseos
 * - 🔄 useCoupons: Cupones de descuento
 * - 🔄 useShipping: Opciones de envío
 *
 * TODO FUTURO:
 * - 🔄 Sincronización con Supabase
 * - 🔄 Carrito compartido entre dispositivos
 * - 🔄 Carrito persistente por usuario
 */

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { toast } from 'react-hot-toast'
import debounce from 'lodash.debounce'
import { SAMPLE_ITEMS } from '../../marketplace/hooks/constants'

// Importar módulos especializados
import useCartHistory from './useCartHistory'
import useWishlist from './useWishlist'
import useCoupons from './useCoupons'
import useShipping from './useShipping'

// Auto-guardar debounced (para el enfoque híbrido futuro)
const createDebouncedSave = (getState) => {
  return debounce(() => {
    try {
      getState().saveToLocal()
      // En el futuro, también llamar: getState().syncToBackend()
    } catch (error) {
      console.error('❌ Error en auto-guardado:', error)
    }
  }, 1000) // Guardar después de 1 segundo de inactividad
}

// Creación del store utilizando Zustand
const useCartStore = create(
  persist(
    (set, get) => {
      // Crear función de auto-guardado específica para esta instancia
      const debouncedSave = createDebouncedSave(get)

      // Instanciar módulos especializados
      const historyStore = useCartHistory.getState()
      const wishlistStore = useWishlist.getState()
      const couponsStore = useCoupons.getState()
      const shippingStore = useShipping.getState()

      return {
        // Estado principal del carrito (solo items y UI)
        items: SAMPLE_ITEMS,
        isLoading: false,
        error: null,
        notifications: [],

        // Propiedades delegadas para retrocompatibilidad
        get wishlist() {
          return wishlistStore.wishlist
        },
        get appliedCoupons() {
          return couponsStore.appliedCoupons
        },
        get couponInput() {
          return couponsStore.couponInput
        },
        get selectedShipping() {
          return shippingStore.selectedShipping
        },

        // === ACCIONES DEL CARRITO (REFACTORIZADAS) ===

        // Agregar producto al carrito
        addItem: (product, quantity = 1) => {
          // Asegurarse de que la imagen principal esté presente
          const image =
            product.imagen || product.image || '/placeholder-product.jpg'
          const item = {
            ...product,
            image,
            quantity,
          }
          const currentState = get()
          const existingItem = currentState.items.find(
            (item) => item.id === product.id
          )

          if (existingItem) {
            if (existingItem.quantity + quantity <= product.maxStock) {
              set({
                items: currentState.items.map((item) =>
                  item.id === product.id
                    ? { ...item, quantity: item.quantity + quantity }
                    : item
                ),
              })
              toast.success(
                `Agregado: ${product.name} (${
                  existingItem.quantity + quantity
                })`,
                { icon: '🛒' }
              )
            } else {
              toast.error(`Stock insuficiente para ${product.name}`, {
                icon: '⚠️',
              })
            }
          } else {
            const newItem = {
              ...product,
              quantity,
              addedAt: new Date().toISOString(),
            }
            set({
              items: [...currentState.items, newItem],
            })
            toast.success(`Agregado al carrito: ${product.name}`, {
              icon: '✅',
            })
          }

          // Delegar al módulo de historial
          setTimeout(() => {
            historyStore.saveToHistory(get(), 'addItem', {
              productName: product.name,
              quantity: quantity,
              isExisting: !!existingItem,
            })
          }, 0)

          // Auto-guardar cambios
          debouncedSave()
        },

        // Actualizar cantidad con respuesta inmediata
        updateQuantity: (id, quantity) => {
          const currentState = get()
          const item = currentState.items.find((item) => item.id === id)
          if (item && quantity > 0 && quantity <= item.maxStock) {
            const oldQuantity = item.quantity
            set({
              items: currentState.items.map((item) =>
                item.id === id ? { ...item, quantity } : item
              ),
            })

            // Delegar al módulo de historial
            setTimeout(() => {
              historyStore.saveToHistory(get(), 'updateQuantity', {
                productName: item.name,
                oldQuantity: oldQuantity,
                newQuantity: quantity,
              })
            }, 0)

            // Auto-guardar cambios
            debouncedSave()
          }
        },

        // Versión con debounce para casos específicos donde se necesite
        updateQuantityDebounced: debounce((id, quantity) => {
          get().updateQuantity(id, quantity)
        }, 100),

        // Remover item
        removeItem: (id) => {
          const currentState = get()
          const item = currentState.items.find((item) => item.id === id)
          if (item) {
            set({
              items: currentState.items.filter((item) => item.id !== id),
            })
            toast.success(`${item.name} eliminado del carrito`, { icon: '🗑️' })

            // Delegar al módulo de historial
            setTimeout(() => {
              historyStore.saveToHistory(get(), 'removeItem', {
                productName: item.name,
                quantity: item.quantity,
              })
            }, 0)

            // Auto-guardar cambios
            debouncedSave()
          }
        },

        // Limpiar carrito
        clearCart: () => {
          const currentState = get()
          const itemCount = currentState.items.length
          set({
            items: [],
          })

          // También limpiar los módulos relacionados
          couponsStore.clearCoupons()

          toast.success('Carrito limpiado', { icon: '🧹' })

          // Delegar al módulo de historial
          setTimeout(() => {
            historyStore.saveToHistory(get(), 'clearCart', {
              itemCount: itemCount,
            })
          }, 0)
          toast.success('Carrito limpiado', { icon: '🧹' })

          // Guardar en historial con información detallada          // Delegar al módulo de historial
          setTimeout(() => {
            historyStore.saveToHistory(get(), 'clearCart', {
              itemCount: itemCount,
            })
          }, 0)

          // Auto-guardar cambios
          debouncedSave()
        },

        // === DELEGACIÓN A MÓDULOS ESPECIALIZADOS ===

        // Funciones de wishlist (delegadas)
        addToWishlist: (product) => {
          return wishlistStore.addToWishlist(product)
        },

        removeFromWishlist: (id) => {
          return wishlistStore.removeFromWishlist(id)
        },

        moveToCart: (id) => {
          const item = wishlistStore.wishlist.find((item) => item.id === id)
          if (item) {
            get().addItem(item)
            wishlistStore.removeFromWishlist(id)
          }
        },

        // Obtener wishlist
        getWishlist: () => {
          return wishlistStore.wishlist
        },

        isInWishlist: (productId) => {
          return wishlistStore.isInWishlist(productId)
        },

        // Mover de wishlist al carrito
        moveToCart: (id) => {
          const currentState = get()
          const item = currentState.wishlist.find((item) => item.id === id)
          if (item) {
            get().addItem(item)
            get().removeFromWishlist(id)
          }
        }, // Funciones de cupones (delegadas)
        applyCoupon: (code) => {
          const subtotal = get().getSubtotal()
          const result = couponsStore.applyCoupon(code, subtotal)
          if (result) {
            // Delegar al módulo de historial
            setTimeout(() => {
              historyStore.saveToHistory(get(), 'applyCoupon', {
                couponCode: code.toUpperCase(),
                discount: result.discount,
              })
            }, 0)
          }
          return result
        },

        removeCoupon: (code) => {
          const result = couponsStore.removeCoupon(code)
          if (result) {
            // Delegar al módulo de historial
            setTimeout(() => {
              historyStore.saveToHistory(get(), 'removeCoupon', {
                couponCode: code,
                discount: result.discount,
              })
            }, 0)
          }
          return result
        },

        setCouponInput: (value) => {
          return couponsStore.setCouponInput(value)
        },

        getAppliedCoupons: () => {
          return couponsStore.appliedCoupons
        },

        getCouponInput: () => {
          return couponsStore.couponInput
        },

        // Funciones de envío (delegadas)
        setShippingOption: (optionId) => {
          const result = shippingStore.setShippingOption(optionId)
          if (result) {
            // Delegar al módulo de historial
            setTimeout(() => {
              historyStore.saveToHistory(get(), 'setShipping', {
                oldShipping: result.oldOption?.name || 'Desconocido',
                shippingName: result.newOption.name,
              })
            }, 0)
          }
          return result
        },

        getSelectedShipping: () => {
          return shippingStore.selectedShipping
        }, // === FUNCIONES DE CÁLCULO (REFACTORIZADAS) ===

        // Obtener subtotal
        getSubtotal: () => {
          return get().items.reduce(
            (sum, item) => sum + item.price * item.quantity,
            0
          )
        },

        // Obtener descuento total (delega a módulo de cupones)
        getDiscount: () => {
          const subtotal = get().getSubtotal()
          return couponsStore.getDiscount(subtotal)
        },

        // Obtener costo de envío (delega a módulo de envío)
        getShippingCost: () => {
          const subtotal = get().getSubtotal()
          const appliedCoupons = couponsStore.appliedCoupons
          return shippingStore.getShippingCost(subtotal, appliedCoupons)
        },

        // Obtener total
        getTotal: () => {
          const subtotal = get().getSubtotal()
          const discount = get().getDiscount()
          const shipping = get().getShippingCost()
          return subtotal - discount + shipping
        },

        // Obtener información de envío (delega a módulo de envío)
        getShippingInfo: () => {
          return shippingStore.getShippingInfo()
        },

        // === FUNCIONES DE HISTORIAL (DELEGADAS) ===

        // Todas las funciones de historial delegadas al módulo
        saveToHistory: (actionType, actionData) => {
          return historyStore.saveToHistory(get(), actionType, actionData)
        },

        getUndoInfo: () => {
          return historyStore.getUndoInfo()
        },

        getRedoInfo: () => {
          return historyStore.getRedoInfo()
        },

        getHistoryInfo: () => {
          return historyStore.getHistoryInfo()
        },

        undo: () => {
          return historyStore.undo((restoredState) => {
            set({
              items: restoredState.items,
              // Los módulos manejan su propio estado
            })
            // Sincronizar con módulos
            couponsStore.restoreState(restoredState.appliedCoupons || [])
            shippingStore.restoreState(
              restoredState.selectedShipping || 'standard'
            )
          })
        },

        redo: () => {
          return historyStore.redo((restoredState) => {
            set({
              items: restoredState.items,
              // Los módulos manejan su propio estado
            })
            // Sincronizar con módulos
            couponsStore.restoreState(restoredState.appliedCoupons || [])
            shippingStore.restoreState(
              restoredState.selectedShipping || 'standard'
            )
          })
        },

        // === FUNCIONES DE UTILIDAD ===

        // Verificar si producto está en carrito
        isInCart: (productId) => {
          return get().items.some((item) => item.id === productId)
        },

        // Verificar si producto está en wishlist (delega)
        isInWishlist: (productId) => {
          return wishlistStore.isInWishlist(productId)
        }, // Obtener cantidad de items
        getItemCount: () => {
          return get().items.reduce((count, item) => count + item.quantity, 0)
        },

        // Obtener estadísticas del carrito
        getStats: () => {
          const items = get().items
          const totalItems = items.length
          const totalQuantity = items.reduce(
            (sum, item) => sum + item.quantity,
            0
          )
          const totalValue = get().getSubtotal()
          const averagePrice = totalItems > 0 ? totalValue / totalQuantity : 0

          return {
            totalItems,
            totalQuantity,
            totalValue,
            averagePrice,
          }
        },

        // === SETTERS DE UI (REFACTORIZADOS) ===

        // Los setters de cupones ahora delegan al módulo
        setCouponInput: (value) => {
          return couponsStore.setCouponInput(value)
        },

        // Establecer estado de carga
        setLoading: (loading) => {
          set({ isLoading: loading })
        },

        // Establecer error
        setError: (error) => {
          set({ error })
        },

        // === FUNCIONES DE DEMO (REFACTORIZADAS) ===

        // Reiniciar carrito para demo
        resetDemoCart: () => {
          set({
            items: SAMPLE_ITEMS,
            isLoading: false,
            error: null,
            notifications: [],
          })

          // Resetear módulos
          wishlistStore.clearWishlist()
          couponsStore.clearCoupons()
          shippingStore.resetToStandard()
          historyStore.clearHistory()

          toast.success('¡Carrito de demo reiniciado!', {
            icon: '🔄',
            duration: 2000,
          })
        },

        // === FUNCIONES DE PERSISTENCIA HÍBRIDA ===

        // Guardar en localStorage
        saveToLocal: () => {
          try {
            const state = get()
            const cartData = {
              items: state.items,
              // Los módulos manejan su propia persistencia
              lastModified: Date.now(),
              version: '3.0', // Versión refactorizada
            }
            localStorage.setItem('sellsi-cart-main', JSON.stringify(cartData))
            console.log('💾 Carrito principal guardado en localStorage')
          } catch (error) {
            console.error('❌ Error guardando en localStorage:', error)
          }
        },

        // Cargar desde localStorage
        loadFromLocal: () => {
          try {
            const savedCart = localStorage.getItem('sellsi-cart-main')
            if (savedCart) {
              const cartData = JSON.parse(savedCart)
              set({
                items: cartData.items || [],
              })
              console.log('📥 Carrito principal cargado desde localStorage')
              return true
            }
          } catch (error) {
            console.error('❌ Error cargando desde localStorage:', error)
          }
          return false
        },

        // Preparación para sincronización con backend
        syncToBackend: async () => {
          console.log(
            '🔄 Sincronización con backend (preparado para implementar)'
          )
          // Los módulos también deben sincronizar su estado
          try {
            const state = get()
            const cartData = {
              items: state.items,
              // Obtener datos de módulos
              wishlist: wishlistStore.wishlist,
              coupons: couponsStore.appliedCoupons,
              shipping: shippingStore.selectedShipping,
              lastModified: Date.now(),
            }
            console.log('✅ Listo para sincronizar con backend:', cartData)
            return true
          } catch (error) {
            console.error('❌ Error en sincronización:', error)
            return false
          }
        },
      }
    },
    {
      name: 'sellsi-cart-v3-refactored',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        items: state.items,
        lastModified: Date.now(),
        version: '3.0',
      }),
      onRehydrateStorage: (state) => {
        console.log('🔄 Hidratando carrito refactorizado...')
        return (state, error) => {
          if (error) {
            console.error('❌ Error al hidratar carrito:', error)
          } else {
            console.log('✅ Carrito refactorizado hidratado correctamente')
          }
        }
      },
      version: 3,
    }
  )
)

export default useCartStore
