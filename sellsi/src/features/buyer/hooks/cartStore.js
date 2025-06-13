/**
 * ============================================================================
 * CART STORE - GESTIÓN GLOBAL DEL CARRITO DE COMPRAS
 * ============================================================================
 *
 * Store centralizado usando Zustand para manejar todo el estado del carrito.
 * Incluye persistencia local, historial de acciones, y gestión de cupones.
 *
 * CARACTERÍSTICAS:
 * - ✅ Persistencia automática en localStorage
 * - ✅ Historial de acciones (undo/redo)
 * - ✅ Gestión de cupones de descuento
 * - ✅ Cálculos automáticos de totales
 * - ✅ Validación de stock
 * - ✅ Integración con notificaciones
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
import {
  DISCOUNT_CODES,
  SHIPPING_OPTIONS,
  SAMPLE_ITEMS,
} from '../../marketplace/hooks/constants'

// Helper function para describir acciones del historial
const getActionDescription = (actionType, actionData) => {
  switch (actionType) {
    case 'addItem':
      return `Agregado: ${actionData.productName || 'Producto'} (${
        actionData.quantity || 1
      })`
    case 'removeItem':
      return `Eliminado: ${actionData.productName || 'Producto'}`
    case 'updateQuantity':
      return `Cantidad cambiada: ${actionData.productName || 'Producto'} (${
        actionData.oldQuantity || '?'
      } → ${actionData.newQuantity || '?'})`
    case 'applyCoupon':
      return `Cupón aplicado: ${actionData.couponCode || 'Desconocido'}`
    case 'removeCoupon':
      return `Cupón removido: ${actionData.couponCode || 'Desconocido'}`
    case 'clearCart':
      return `Carrito limpiado (${actionData.itemCount || 0} productos)`
    case 'setShipping':
      return `Envío cambiado: ${actionData.shippingName || 'Desconocido'}`
    default:
      return 'Acción en el carrito'
  }
}

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

      return {
        // Estado del carrito
        items: SAMPLE_ITEMS,
        wishlist: [],

        // Estado de UI
        isLoading: false,
        error: null,

        // Sistema de descuentos
        appliedCoupons: [],
        couponInput: '',

        // Opciones de envío
        selectedShipping: 'standard',

        // Historial para undo/redo
        history: [],
        historyIndex: -1,

        // Notificaciones
        notifications: [],

        // === ACCIONES DEL CARRITO ===

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

          // Guardar en historial con información detallada
          setTimeout(
            () =>
              get().saveToHistory('addItem', {
                productName: product.name,
                quantity: quantity,
                isExisting: !!existingItem,
              }),
            0
          )

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

            // Guardar en historial con información detallada
            setTimeout(
              () =>
                get().saveToHistory('updateQuantity', {
                  productName: item.name,
                  oldQuantity: oldQuantity,
                  newQuantity: quantity,
                }),
              0
            )

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

            // Guardar en historial con información detallada
            setTimeout(
              () =>
                get().saveToHistory('removeItem', {
                  productName: item.name,
                  quantity: item.quantity,
                }),
              0
            )

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
            appliedCoupons: [],
            couponInput: '',
          })
          toast.success('Carrito limpiado', { icon: '🧹' })

          // Guardar en historial con información detallada
          setTimeout(
            () =>
              get().saveToHistory('clearCart', {
                itemCount: itemCount,
              }),
            0
          )

          // Auto-guardar cambios
          debouncedSave()
        },

        // === SISTEMA DE WISHLIST ===

        // Agregar a wishlist
        addToWishlist: (product) => {
          const currentState = get()
          const exists = currentState.wishlist.find(
            (item) => item.id === product.id
          )
          if (!exists) {
            set({
              wishlist: [...currentState.wishlist, product],
            })
            toast.success(`${product.name} agregado a favoritos`, {
              icon: '❤️',
            })
          }
        },

        // Remover de wishlist
        removeFromWishlist: (id) => {
          const currentState = get()
          const item = currentState.wishlist.find((item) => item.id === id)
          if (item) {
            set({
              wishlist: currentState.wishlist.filter((item) => item.id !== id),
            })
            toast.success(`${item.name} removido de favoritos`, { icon: '💔' })
          }
        },

        // Mover de wishlist al carrito
        moveToCart: (id) => {
          const currentState = get()
          const item = currentState.wishlist.find((item) => item.id === id)
          if (item) {
            get().addItem(item)
            get().removeFromWishlist(id)
          }
        },

        // === SISTEMA DE CUPONES ===

        // Aplicar cupón
        applyCoupon: (code) => {
          const currentState = get()
          const coupon = DISCOUNT_CODES[code.toUpperCase()]
          const subtotal = get().getSubtotal()

          if (!coupon) {
            toast.error('Código de descuento inválido', { icon: '❌' })
            return
          }

          if (subtotal < coupon.minAmount) {
            toast.error(
              `Compra mínima de $${coupon.minAmount.toLocaleString()} requerida`,
              { icon: '⚠️' }
            )
            return
          }

          const alreadyApplied = currentState.appliedCoupons.find(
            (c) => c.code === code.toUpperCase()
          )
          if (alreadyApplied) {
            toast.error('Cupón ya aplicado', { icon: '⚠️' })
            return
          }

          set({
            appliedCoupons: [
              ...currentState.appliedCoupons,
              { ...coupon, code: code.toUpperCase() },
            ],
            couponInput: '',
          })
          toast.success(`Cupón ${code} aplicado correctamente`, { icon: '🎉' })

          // Guardar en historial con información detallada
          setTimeout(
            () =>
              get().saveToHistory('applyCoupon', {
                couponCode: code.toUpperCase(),
                discount: coupon.percentage
                  ? `${coupon.percentage}%`
                  : `$${coupon.amount}`,
              }),
            0
          )
        },

        // Remover cupón
        removeCoupon: (code) => {
          const currentState = get()
          const coupon = currentState.appliedCoupons.find(
            (c) => c.code === code
          )
          set({
            appliedCoupons: currentState.appliedCoupons.filter(
              (c) => c.code !== code
            ),
          })
          toast.success(`Cupón ${code} removido`, { icon: '🗑️' })

          // Guardar en historial con información detallada
          setTimeout(
            () =>
              get().saveToHistory('removeCoupon', {
                couponCode: code,
                discount: coupon
                  ? coupon.percentage
                    ? `${coupon.percentage}%`
                    : `$${coupon.amount}`
                  : 'Desconocido',
              }),
            0
          )
        },

        // === SISTEMA DE ENVÍO ===

        // Seleccionar opción de envío
        setShippingOption: (optionId) => {
          const currentShipping = get().selectedShipping
          const oldOption = SHIPPING_OPTIONS.find(
            (opt) => opt.id === currentShipping
          )
          const newOption = SHIPPING_OPTIONS.find((opt) => opt.id === optionId)

          set({
            selectedShipping: optionId,
          })

          if (newOption) {
            toast.success(`Envío seleccionado: ${newOption.name}`, {
              icon: '🚚',
            })

            // Guardar en historial con información detallada
            setTimeout(
              () =>
                get().saveToHistory('setShipping', {
                  oldShipping: oldOption?.name || 'Desconocido',
                  shippingName: newOption.name,
                }),
              0
            )
          }
        },

        // === CÁLCULOS ===

        // Obtener subtotal
        getSubtotal: () => {
          return get().items.reduce(
            (sum, item) => sum + item.price * item.quantity,
            0
          )
        },

        // Obtener descuento total
        getDiscount: () => {
          const subtotal = get().getSubtotal()
          const coupons = get().appliedCoupons

          return coupons.reduce((total, coupon) => {
            if (coupon.percentage) {
              return total + (subtotal * coupon.percentage) / 100
            }
            return total
          }, 0)
        },

        // Obtener costo de envío
        getShippingCost: () => {
          const selectedOption = SHIPPING_OPTIONS.find(
            (opt) => opt.id === get().selectedShipping
          )
          if (!selectedOption) return 0

          // Verificar cupones de envío gratis
          const freeShippingCoupon = get().appliedCoupons.find(
            (c) => c.shipping === 0
          )
          if (freeShippingCoupon) return 0

          // Envío gratis por compras sobre $100.000
          const subtotal = get().getSubtotal()
          if (subtotal >= 100000) return 0

          return selectedOption.price
        },

        // Obtener total
        getTotal: () => {
          const subtotal = get().getSubtotal()
          const discount = get().getDiscount()
          const shipping = get().getShippingCost()
          return subtotal - discount + shipping
        },

        // Obtener información de envío
        getShippingInfo: () => {
          return SHIPPING_OPTIONS.find(
            (opt) => opt.id === get().selectedShipping
          )
        },

        // === HISTORIAL Y UNDO/REDO MEJORADO ===

        // Guardar estado en historial con información detallada
        saveToHistory: (actionType = 'unknown', actionData = {}) => {
          const currentState = get()
          const newHistory = currentState.history.slice(
            0,
            currentState.historyIndex + 1
          )

          // Crear snapshot con información detallada
          const snapshot = {
            items: [...currentState.items],
            appliedCoupons: [...currentState.appliedCoupons],
            timestamp: Date.now(),
            action: {
              type: actionType,
              data: actionData,
              description: getActionDescription(actionType, actionData),
            },
          }

          newHistory.push(snapshot)

          // Mantener solo los últimos 30 estados (aumentado de 20)
          if (newHistory.length > 30) {
            newHistory.shift()
          }

          set({
            history: newHistory,
            historyIndex: newHistory.length - 1,
          })
        },

        // Obtener información sobre la próxima acción a deshacer
        getUndoInfo: () => {
          const currentState = get()
          if (currentState.historyIndex > 0) {
            const currentSnapshot =
              currentState.history[currentState.historyIndex]
            return {
              canUndo: true,
              action: currentSnapshot.action,
              timestamp: currentSnapshot.timestamp,
            }
          }
          return { canUndo: false }
        },

        // Obtener información sobre la próxima acción a rehacer
        getRedoInfo: () => {
          const currentState = get()
          if (currentState.historyIndex < currentState.history.length - 1) {
            const nextSnapshot =
              currentState.history[currentState.historyIndex + 1]
            return {
              canRedo: true,
              action: nextSnapshot.action,
              timestamp: nextSnapshot.timestamp,
            }
          }
          return { canRedo: false }
        },

        // Obtener historial completo con información
        getHistoryInfo: () => {
          const currentState = get()
          return {
            totalStates: currentState.history.length,
            currentIndex: currentState.historyIndex,
            canUndo: currentState.historyIndex > 0,
            canRedo:
              currentState.historyIndex < currentState.history.length - 1,
            recentActions: currentState.history.slice(-10).map((snapshot) => ({
              description: snapshot.action?.description || 'Acción desconocida',
              timestamp: snapshot.timestamp,
              type: snapshot.action?.type || 'unknown',
            })),
          }
        },

        // Deshacer acción
        undo: () => {
          const currentState = get()
          if (currentState.historyIndex > 0) {
            const previousState =
              currentState.history[currentState.historyIndex - 1]
            set({
              items: [...previousState.items],
              appliedCoupons: [...previousState.appliedCoupons],
              historyIndex: currentState.historyIndex - 1,
            })
            toast.success('Acción deshecha', { icon: '↩️' })
          }
        },

        // Rehacer acción
        redo: () => {
          const currentState = get()
          if (currentState.historyIndex < currentState.history.length - 1) {
            const nextState =
              currentState.history[currentState.historyIndex + 1]
            set({
              items: [...nextState.items],
              appliedCoupons: [...nextState.appliedCoupons],
              historyIndex: currentState.historyIndex + 1,
            })
            toast.success('Acción rehecha', { icon: '↪️' })
          }
        },

        // === FUNCIONES DE UTILIDAD ===

        // Verificar si producto está en carrito
        isInCart: (productId) => {
          return get().items.some((item) => item.id === productId)
        },

        // Verificar si producto está en wishlist
        isInWishlist: (productId) => {
          return get().wishlist.some((item) => item.id === productId)
        },

        // Obtener cantidad de items
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

        // === SETTERS DE UI ===

        // Establecer input de cupón
        setCouponInput: (value) =>
          set({
            couponInput: value,
          }),

        // Establecer estado de carga
        setLoading: (loading) =>
          set({
            isLoading: loading,
          }),

        // Establecer error
        setError: (error) =>
          set({
            error,
          }),

        // === FUNCIONES DE DEMO ===

        // Reiniciar carrito para demo (volver a mostrar productos)
        resetDemoCart: () => {
          set({
            items: SAMPLE_ITEMS,
            wishlist: [],
            appliedCoupons: [],
            couponInput: '',
            selectedShipping: 'standard',
            history: [],
            historyIndex: -1,
            notifications: [],
            isLoading: false,
            error: null,
          })
          toast.success('¡Carrito de demo reiniciado!', {
            icon: '🔄',
            duration: 2000,
          })
        },

        // === FUNCIONES DE PERSISTENCIA HÍBRIDA (PREPARACIÓN PARA BACKEND) ===

        // Guardar en localStorage inmediatamente (frontend)
        saveToLocal: () => {
          try {
            const state = get()
            const cartData = {
              items: state.items,
              wishlist: state.wishlist,
              appliedCoupons: state.appliedCoupons,
              selectedShipping: state.selectedShipping,
              lastModified: Date.now(),
              version: '2.0',
            }
            localStorage.setItem('sellsi-cart-backup', JSON.stringify(cartData))
            console.log('💾 Carrito guardado en localStorage')
          } catch (error) {
            console.error('❌ Error guardando en localStorage:', error)
          }
        },

        // Cargar desde localStorage si existe
        loadFromLocal: () => {
          try {
            const savedCart = localStorage.getItem('sellsi-cart-backup')
            if (savedCart) {
              const cartData = JSON.parse(savedCart)
              set({
                items: cartData.items || [],
                wishlist: cartData.wishlist || [],
                appliedCoupons: cartData.appliedCoupons || [],
                selectedShipping: cartData.selectedShipping || 'standard',
              })
              console.log('📥 Carrito cargado desde localStorage')
              return true
            }
          } catch (error) {
            console.error('❌ Error cargando desde localStorage:', error)
          }
          return false
        },

        // Preparación para sincronización con backend (futuro)
        syncToBackend: async () => {
          // TODO: Implementar cuando el backend esté listo
          console.log(
            '🔄 Sincronización con backend (preparado para implementar)'
          )
          try {
            const state = get()
            const cartData = {
              items: state.items,
              wishlist: state.wishlist,
              appliedCoupons: state.appliedCoupons,
              selectedShipping: state.selectedShipping,
              lastModified: Date.now(),
            }

            // Placeholder para futura implementación
            // const response = await fetch('/api/cart/sync', {
            //   method: 'POST',
            //   headers: { 'Content-Type': 'application/json' },
            //   body: JSON.stringify(cartData)
            // })

            console.log('✅ Listo para sincronizar con backend:', cartData)
            return true
          } catch (error) {
            console.error('❌ Error en sincronización:', error)
            return false
          }
        },

        // Mergear carrito local con carrito remoto (futuro)
        mergeWithRemote: async (remoteCart) => {
          // TODO: Implementar lógica de merge cuando el backend esté listo
          console.log(
            '🔄 Merge con carrito remoto (preparado para implementar)'
          )
          try {
            const localCart = get().items

            // Lógica de merge (ejemplo):
            // 1. Mantener items locales más recientes
            // 2. Agregar items remotos que no existen localmente
            // 3. Para items duplicados, usar la cantidad mayor

            const mergedItems = [...localCart]

            if (remoteCart && remoteCart.items) {
              remoteCart.items.forEach((remoteItem) => {
                const localIndex = mergedItems.findIndex(
                  (item) => item.id === remoteItem.id
                )
                if (localIndex === -1) {
                  // Item no existe localmente, agregarlo
                  mergedItems.push(remoteItem)
                } else {
                  // Item existe, usar la cantidad mayor
                  if (remoteItem.quantity > mergedItems[localIndex].quantity) {
                    mergedItems[localIndex].quantity = remoteItem.quantity
                  }
                }
              })
            }

            set({ items: mergedItems })
            console.log('✅ Merge completado')
            return true
          } catch (error) {
            console.error('❌ Error en merge:', error)
            return false
          }
        },

        // === FUNCIONES DE DEMO EXISTENTES ===

        // Auto-reiniciar carrito si está vacío (para demo)
        autoResetIfEmpty: () => {
          const currentState = get()
          if (currentState.items.length === 0) {
            // Agregar un pequeño delay para mejor UX
            setTimeout(() => {
              set({
                items: SAMPLE_ITEMS,
                wishlist: [],
                appliedCoupons: [],
                couponInput: '',
                selectedShipping: 'standard',
                history: [],
                historyIndex: -1,
                notifications: [],
                isLoading: false,
                error: null,
              })
              toast.success(
                '¡Demo reiniciado! Productos de muestra restaurados',
                {
                  icon: '🎭',
                  duration: 3000,
                }
              )
            }, 1500)
          }
        },

        // Checkout simulado con reinicio automático del demo
        simulateCheckout: async () => {
          const currentState = get()
          if (currentState.items.length === 0) return false

          // Limpiar carrito (simular compra exitosa)
          set({
            items: [],
            appliedCoupons: [],
            couponInput: '',
            selectedShipping: 'standard',
            history: [],
            historyIndex: -1,
            notifications: [],
            isLoading: false,
            error: null,
          })

          // Auto-reiniciar después de un tiempo para mantener el demo funcional
          setTimeout(() => {
            const newState = get()
            if (newState.items.length === 0) {
              set({
                items: SAMPLE_ITEMS,
                wishlist: [],
                appliedCoupons: [],
                couponInput: '',
                selectedShipping: 'standard',
                history: [],
                historyIndex: -1,
                notifications: [],
                isLoading: false,
                error: null,
              })
              toast.success('Demo reiniciado automáticamente', {
                icon: '🔄',
                duration: 2000,
              })
            }
          }, 5000) // Reiniciar después de 5 segundos          return true
        },
      }
    },
    {
      name: 'sellsi-cart-v2', // Nombre mejorado para el localStorage
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Persistir datos esenciales del carrito
        items: state.items,
        wishlist: state.wishlist,
        appliedCoupons: state.appliedCoupons,
        selectedShipping: state.selectedShipping,
        // Metadatos para control de versión y sincronización
        lastModified: Date.now(),
        version: '2.0',
        deviceId:
          typeof navigator !== 'undefined'
            ? navigator.userAgent || 'unknown-device'
            : 'server',
      }),
      // Configuración de hidratación mejorada
      onRehydrateStorage: (state) => {
        console.log('🔄 Hidratando carrito desde localStorage...')
        return (state, error) => {
          if (error) {
            console.error('❌ Error al hidratar carrito:', error)
            // En caso de error, usar valores por defecto
            return {
              items: [],
              wishlist: [],
              appliedCoupons: [],
              selectedShipping: 'standard',
              isLoading: false,
              error: null,
            }
          } else {
            console.log('✅ Carrito hidratado correctamente:', {
              items: state?.items?.length || 0,
              wishlist: state?.wishlist?.length || 0,
              coupons: state?.appliedCoupons?.length || 0,
            })
          }
        }
      },
      // Migración de versiones anteriores
      migrate: (persistedState, version) => {
        console.log('🔄 Migrando carrito desde versión:', version)

        // Migrar de versiones anteriores
        if (version < 2) {
          return {
            ...persistedState,
            version: '2.0',
            lastModified: Date.now(),
            deviceId:
              typeof navigator !== 'undefined'
                ? navigator.userAgent || 'unknown-device'
                : 'server',
          }
        }

        return persistedState
      },
      version: 2, // Versión actual del schema
    }
  )
)

export default useCartStore
