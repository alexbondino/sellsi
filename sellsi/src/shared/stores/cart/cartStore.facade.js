/**
 * ============================================================================
 * CART STORE FACADE - COMPOSITOR DE MÓDULOS
 * ============================================================================
 *
 * Facade que une todos los módulos del carrito y mantiene la API externa.
 * Actúa como punto de entrada unificado para todas las operaciones del carrito.
 */

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import debounce from 'lodash.debounce'
import toast from 'react-hot-toast'

import { PERSIST_CONFIG } from './cartStore.constants'
import { createDebouncedSave } from './cartStore.core'
import { 
  calculateSubtotal, 
  calculateShippingCost, 
  calculateTotal,
  calculateItemCount,
  calculateStats 
} from './cartStore.calculations'
import {
  addItemLocal,
  updateQuantityLocal,
  removeItemLocal,
  clearCartLocal,
  setItemsLocal
} from './cartStore.local'
import {
  initializeCartWithUser,
  syncToBackend,
  addItemWithBackend,
  updateQuantityWithBackend,
  removeItemWithBackend,
  removeItemsBatchWithBackend,
  clearCartWithBackend,
  checkout
} from './cartStore.backend'

// Importar módulos especializados
import useCartHistory from './useCartHistory'
import useShipping from './useShipping'

/**
 * Crea el store facade del carrito que une todos los módulos
 */
export const createCartStoreFacade = () => {
  return create(
    persist(
      (set, get) => {
        // Crear función de auto-guardado
        const debouncedSave = createDebouncedSave(get)
        
        // Instanciar módulos especializados
        const historyStore = useCartHistory.getState()
        const shippingStore = useShipping.getState()

        return {
          // === ESTADO PRINCIPAL ===
          items: [],
          isLoading: false,
          error: null,
          notifications: [],
          
          // Estado para integración con backend
          cartId: null,
          userId: null,
          isBackendSynced: false,
          isSyncing: false,
          lastModified: null,

          // === PROPIEDADES DELEGADAS PARA RETROCOMPATIBILIDAD ===
          get selectedShipping() {
            return shippingStore.selectedShipping
          },

          // === OPERACIONES PRINCIPALES DEL CARRITO ===

          /**
           * Agrega un producto al carrito
           */
          addItem: async (product, quantity = 1) => {
            const state = get()
            
            // DETECCIÓN AUTOMÁTICA: Si hay usuario autenticado, usar backend
            if (state.userId && state.cartId && state.isBackendSynced) {
              return await addItemWithBackend(product, quantity, set, get, historyStore)
            }
            
            // Usar operación local
            return addItemLocal(product, quantity, set, get, historyStore, debouncedSave)
          },

          /**
           * Actualiza la cantidad de un item
           */
          updateQuantity: async (id, quantity) => {
            const state = get()
            
            // DETECCIÓN AUTOMÁTICA: Si hay usuario autenticado, usar backend
            if (state.userId && state.cartId && state.isBackendSynced) {
              return await updateQuantityWithBackend(id, quantity, set, get)
            }
            
            // Usar operación local
            return updateQuantityLocal(id, quantity, set, get, historyStore, debouncedSave)
          },

          /**
           * Versión con debounce para casos específicos
           */
          updateQuantityDebounced: debounce((id, quantity) => {
            get().updateQuantity(id, quantity)
          }, 10),

          /**
           * Remueve un item del carrito
           */
          removeItem: async (id) => {
            const state = get()
            
            // DETECCIÓN AUTOMÁTICA: Si hay usuario autenticado, usar backend
            if (state.userId && state.cartId && state.isBackendSynced) {
              return await removeItemWithBackend(id, set, get)
            }
            
            // Usar operación local
            return removeItemLocal(id, set, get, historyStore, debouncedSave)
          },

          /**
           * Remueve múltiples items (batch). IDs son los item.id/cart_items_id conocidos por la UI.
           */
          removeItemsBatch: async (ids = []) => {
            const state = get()
            if (!Array.isArray(ids) || ids.length === 0) return false
            if (state.userId && state.cartId && state.isBackendSynced) {
              // Backend batch
              return await removeItemsBatchWithBackend(ids, set, get)
            }
            // Fallback local: eliminar todos en un solo set para eficiencia
            const idSet = new Set(ids)
            set(current => ({
              items: current.items.filter(i => !idSet.has(i.id)),
            }))
            debouncedSave()
            return true
          },

          /**
           * Limpia el carrito
           */
          clearCart: async () => {
            const state = get()
            
            // DETECCIÓN AUTOMÁTICA: Si hay usuario autenticado, usar backend
            if (state.userId && state.cartId && state.isBackendSynced) {
              return await clearCartWithBackend(set, get)
            }
            
            // Usar operación local
            clearCartLocal(set, get, historyStore, debouncedSave)
            
            toast.success('Carrito limpiado', { icon: '🧹' })
          },

          /**
           * Establece items en el carrito
           */
          setItems: (items) => {
            setItemsLocal(items, set, debouncedSave)
          },

          // === FUNCIONES DE CÁLCULO ===

          /**
           * Obtiene el subtotal del carrito
           */
          getSubtotal: () => {
            const state = get()
            return calculateSubtotal(state.items)
          },

          /**
           * Obtiene el descuento total (deshabilitado)
           */
          getDiscount: () => {
            return 0
          },

          /**
           * Obtiene el costo de envío
           */
          getShippingCost: () => {
            const subtotal = get().getSubtotal()
            return calculateShippingCost(subtotal, [], shippingStore)
          },

          /**
           * Obtiene el total final
           */
          getTotal: () => {
            const subtotal = get().getSubtotal()
            const discount = 0
            const shipping = get().getShippingCost()
            return calculateTotal(subtotal, discount, shipping)
          },

          /**
           * Obtiene el número total de items
           */
          getItemCount: () => {
            const state = get()
            return calculateItemCount(state.items)
          },

          /**
           * Obtiene estadísticas del carrito
           */
          getStats: () => {
            const state = get()
            const subtotal = get().getSubtotal()
            return calculateStats(state.items, subtotal)
          },

          // === OPERACIONES DE BACKEND ===

          /**
           * Inicializa el carrito con usuario autenticado
           */
          initializeCartWithUser: async (userId) => {
            return await initializeCartWithUser(userId, set, get)
          },

          /**
           * Sincroniza con el backend
           */
          syncToBackend: async () => {
            return await syncToBackend(get, shippingStore)
          },

          /**
           * Realiza el checkout
           */
          checkout: async (checkoutData = {}) => {
            return await checkout(checkoutData, set, get)
          },

          // === FUNCIONES DELEGADAS A MÓDULOS ===

          // Envío
          setShippingOption: (optionId) => {
            const result = shippingStore.setShippingOption(optionId)
            if (result.success) {
              toast.success(result.message, { icon: '🚚' })
            }
            return result
          },
          getShippingInfo: () => {
            return shippingStore.getShippingInfo()
          },

          // Historial
          saveToHistory: (actionType, actionData) => {
            return historyStore.saveToHistory(get(), actionType, actionData)
          },
          getUndoInfo: () => {
            return historyStore.getUndoInfo()
          },
          getRedoInfo: () => {
            return historyStore.getRedoInfo()
          },
          undo: () => {
            const undoState = historyStore.undo()
            if (undoState) {
              set({
                items: undoState.items,
                // Restaurar otros estados si es necesario
              })
              // También restaurar estados de otros módulos
              shippingStore.setShippingOption(
                undoState.selectedShipping || 'standard'
              )
            }
          },
          redo: () => {
            const redoState = historyStore.redo()
            if (redoState) {
              set({
                items: redoState.items,
                // Restaurar otros estados si es necesario
              })
              // También restaurar estados de otros módulos
              shippingStore.setShippingOption(
                redoState.selectedShipping || 'standard'
              )
            }
          },

          // === PERSISTENCIA LOCAL ===

          /**
           * Guarda el carrito en localStorage
           */
          saveToLocal: () => {
            try {
              const state = get()
              const dataToSave = {
                items: state.items,
                lastModified: Date.now(),
                version: '3.0',
              }
              localStorage.setItem('sellsi-cart-v3-refactored', JSON.stringify(dataToSave))
            } catch (error) {
              }
          },

          /**
           * Carga el carrito desde localStorage
           */
          loadFromLocal: () => {
            try {
              const saved = localStorage.getItem('sellsi-cart-v3-refactored')
              if (saved) {
                const data = JSON.parse(saved)
                if (data.version === '3.0') {
                  set({
                    items: data.items || [],
                    lastModified: data.lastModified || Date.now()
                  })
                  return true
                }
              }
            } catch (error) {
              }
            return false
          },

          /**
           * Limpia el localStorage
           */
          clearLocal: () => {
            try {
              localStorage.removeItem('sellsi-cart-v3-refactored')
            } catch (error) {
              }
          },

          // === UTILIDADES ===

          /**
           * Verifica si un producto está en el carrito
           */
          isInCart: (productId) => {
            return get().items.some((item) => item.id === productId)
          },

          /**
           * Obtiene un item del carrito por ID
           */
          getItem: (productId) => {
            return get().items.find((item) => item.id === productId)
          },

          /**
           * Obtiene información básica del carrito
           */
          getCartInfo: () => {
            const state = get()
            return {
              itemCount: state.items.length,
              totalQuantity: state.items.reduce((sum, item) => sum + item.quantity, 0),
              isEmpty: state.items.length === 0,
              isLoading: state.isLoading,
              isBackendSynced: state.isBackendSynced,
              isSyncing: state.isSyncing,
              lastModified: state.lastModified,
            }
          },
        }
      },
      PERSIST_CONFIG
    )
  )
}
