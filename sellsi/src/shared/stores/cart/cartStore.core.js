/**
 * ============================================================================
 * CART STORE CORE - ESTADO PRINCIPAL Y OPERACIONES BÁSICAS
 * ============================================================================
 *
 * Core del store del carrito con estado principal y setters simples.
 * Extraído del cartStore.js original para mejor organización.
 */

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import debounce from 'lodash.debounce'

import { CART_CONFIG, PERSIST_CONFIG, CART_VERSION } from './cartStore.constants'

/**
 * Estado inicial del carrito
 */
const initialState = {
  // Estado principal del carrito
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
}

/**
 * Crea función de auto-guardado debounced
 * @param {Function} getState - Función para obtener estado
 * @returns {Function} Función debounced
 */
export const createDebouncedSave = (getState) => {
  return debounce(() => {
    try {
      getState().saveToLocal()
      // En el futuro, también llamar: getState().syncToBackend()
    } catch (error) {
      }
  }, CART_CONFIG.AUTO_SAVE_DELAY)
}

/**
 * Store core del carrito
 */
export const createCartCoreStore = () => {
  return create(
    persist(
      (set, get) => ({
        ...initialState,

        // === SETTERS BÁSICOS ===
        
        /**
         * Establece items en el carrito
         * @param {Array} items - Items a establecer
         */
        setItems: (items) => {
          set({ items, lastModified: Date.now() })
        },

        /**
         * Establece estado de carga
         * @param {boolean} isLoading - Estado de carga
         */
        setLoading: (isLoading) => {
          set({ isLoading })
        },

        /**
         * Establece error
         * @param {string|null} error - Mensaje de error
         */
        setError: (error) => {
          set({ error })
        },

        /**
         * Establece información del usuario y carrito
         * @param {string} userId - ID del usuario
         * @param {string} cartId - ID del carrito
         * @param {boolean} isBackendSynced - Si está sincronizado con backend
         */
        setUserInfo: (userId, cartId, isBackendSynced = false) => {
          set({ 
            userId, 
            cartId, 
            isBackendSynced,
            lastModified: Date.now()
          })
        },

        /**
         * Establece estado de sincronización
         * @param {boolean} isSyncing - Estado de sincronización
         */
        setSyncing: (isSyncing) => {
          set({ isSyncing })
        },

        /**
         * Limpia el estado del carrito
         */
        resetState: () => {
          set({
            ...initialState,
            lastModified: Date.now()
          })
        },

        /**
         * Agrega una notificación
         * @param {Object} notification - Notificación a agregar
         */
        addNotification: (notification) => {
          set(state => ({
            notifications: [...state.notifications, {
              id: Date.now(),
              timestamp: new Date().toISOString(),
              ...notification
            }]
          }))
        },

        /**
         * Remueve una notificación
         * @param {number} id - ID de la notificación
         */
        removeNotification: (id) => {
          set(state => ({
            notifications: state.notifications.filter(n => n.id !== id)
          }))
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
              version: CART_VERSION,
            }
            localStorage.setItem('sellsi-cart-v3-refactored', JSON.stringify(dataToSave))
          } catch (error) {
            }
        },

        /**
         * Carga el carrito desde localStorage
         * @returns {boolean} Éxito de la operación
         */
        loadFromLocal: () => {
          try {
            const saved = localStorage.getItem('sellsi-cart-v3-refactored')
            if (saved) {
              const data = JSON.parse(saved)
              if (data.version === CART_VERSION) {
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
         * @param {string} productId - ID del producto
         * @returns {boolean} Si está en el carrito
         */
        isInCart: (productId) => {
          return get().items.some((item) => item.id === productId)
        },

        /**
         * Obtiene un item del carrito por ID
         * @param {string} productId - ID del producto
         * @returns {Object|undefined} Item del carrito
         */
        getItem: (productId) => {
          return get().items.find((item) => item.id === productId)
        },

        /**
         * Obtiene información básica del carrito
         * @returns {Object} Información del carrito
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
      }),
      PERSIST_CONFIG
    )
  )
}
