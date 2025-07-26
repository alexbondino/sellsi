/**
 * ============================================================================
 * WISHLIST HOOK - GESTIÓN DE LISTA DE DESEOS
 * ============================================================================
 *
 * Hook independiente para manejar la lista de deseos (wishlist).
 * Incluye funcionalidades de agregar, remover y mover al carrito.
 *
 * @version 1.0.1
 */

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { showWishlistSuccess, showWishlistInfo, showSuccessToast } from '../../../utils/toastHelpers'

/**
 * Hook para gestión de wishlist
 */
const useWishlist = create(
  persist(
    (set, get) => ({
      // Estado de la wishlist
      wishlist: [],

      // === FUNCIONES DE WISHLIST ===

      /**
       * Agregar producto a wishlist
       * @param {Object} product - Producto a agregar
       */
      addToWishlist: (product) => {
        const state = get()
        const exists = state.wishlist.find((item) => item.id === product.id)

        if (!exists) {
          const productWithTimestamp = {
            ...product,
            addedToWishlistAt: new Date().toISOString(),
          }

          set({
            wishlist: [...state.wishlist, productWithTimestamp],
          })

          showWishlistSuccess(`${product.name} agregado a favoritos`)
          return true
        } else {
          showWishlistInfo(`${product.name} ya está en favoritos`, '💛')
          return false
        }
      },

      /**
       * Remover producto de wishlist
       * @param {string} productId - ID del producto a remover
       */
      removeFromWishlist: (productId) => {
        const state = get()
        const item = state.wishlist.find((item) => item.id === productId)

        if (item) {
          set({
            wishlist: state.wishlist.filter((item) => item.id !== productId),
          })

          showWishlistInfo(`${item.name} removido de favoritos`, '💔')
          return true
        }
        return false
      },

      /**
       * Mover producto de wishlist al carrito
       * @param {string} productId - ID del producto a mover
       * @param {Function} addToCart - Función para agregar al carrito
       */
      moveToCart: (productId, addToCart) => {
        const state = get()
        const item = state.wishlist.find((item) => item.id === productId)

        if (item && addToCart && typeof addToCart === 'function') {
          // Agregar al carrito usando la función provista
          const success = addToCart(item, 1)

          if (success !== false) {
            // Remover de wishlist solo si se agregó exitosamente al carrito
            get().removeFromWishlist(productId)
            showSuccessToast(`${item.name} movido al carrito`, { icon: '🛒' })
            return true
          }
        }
        return false
      },

      /**
       * Verificar si un producto está en wishlist
       * @param {string} productId - ID del producto
       */
      isInWishlist: (productId) => {
        return get().wishlist.some((item) => item.id === productId)
      },

      /**
       * Obtener producto de wishlist por ID
       * @param {string} productId - ID del producto
       */
      getWishlistItem: (productId) => {
        return get().wishlist.find((item) => item.id === productId)
      },

      /**
       * Obtener estadísticas de wishlist
       */
      getWishlistStats: () => {
        const wishlist = get().wishlist
        const totalItems = wishlist.length
        const totalValue = wishlist.reduce(
          (sum, item) => sum + (item.price || 0),
          0
        )
        const averagePrice = totalItems > 0 ? totalValue / totalItems : 0

        // Agrupar por categoría
        const categories = wishlist.reduce((acc, item) => {
          const category = item.category || 'Sin categoría'
          acc[category] = (acc[category] || 0) + 1
          return acc
        }, {})

        return {
          totalItems,
          totalValue,
          averagePrice,
          categories,
          recentItems: wishlist
            .sort(
              (a, b) =>
                new Date(b.addedToWishlistAt) - new Date(a.addedToWishlistAt)
            )
            .slice(0, 5),
        }
      },

      /**
       * Limpiar wishlist completa
       */
      clearWishlist: () => {
        const state = get()
        const itemCount = state.wishlist.length

        set({
          wishlist: [],
        })

        showSuccessToast(`${itemCount} productos removidos de favoritos`, { icon: '🧹' })
      },

      /**
       * Agregar múltiples productos a la wishlist
       * @param {Array} products - Array de productos
       */
      addMultipleToWishlist: (products) => {
        const state = get()
        const newItems = products.filter(
          (product) => !state.wishlist.some((item) => item.id === product.id)
        )

        if (newItems.length > 0) {
          const itemsWithTimestamp = newItems.map((product) => ({
            ...product,
            addedToWishlistAt: new Date().toISOString(),
          }))

          set({
            wishlist: [...state.wishlist, ...itemsWithTimestamp],
          })

          showWishlistSuccess(`${newItems.length} productos agregados a favoritos`)
          return newItems.length
        }
        return 0
      },

      /**
       * Remover múltiples productos de la wishlist
       * @param {Array} productIds - Array de IDs de productos
       */
      removeMultipleFromWishlist: (productIds) => {
        const state = get()
        const removedItems = state.wishlist.filter((item) =>
          productIds.includes(item.id)
        )

        if (removedItems.length > 0) {
          set({
            wishlist: state.wishlist.filter(
              (item) => !productIds.includes(item.id)
            ),
          })

          showWishlistInfo(
            `${removedItems.length} productos removidos de favoritos`,
            '💔'
          )
          return removedItems.length
        }
        return 0
      },

      /**
       * Ordenar wishlist
       * @param {string} sortBy - Criterio de ordenamiento ('name', 'price', 'date')
       * @param {string} order - Orden ('asc' o 'desc')
       */
      sortWishlist: (sortBy = 'date', order = 'desc') => {
        const state = get()

        const sorted = [...state.wishlist].sort((a, b) => {
          let valueA, valueB

          switch (sortBy) {
            case 'name':
              valueA = (a.name || '').toLowerCase()
              valueB = (b.name || '').toLowerCase()
              break
            case 'price':
              valueA = a.price || 0
              valueB = b.price || 0
              break
            case 'date':
              valueA = new Date(a.addedToWishlistAt || 0)
              valueB = new Date(b.addedToWishlistAt || 0)
              break
            default:
              return 0
          }

          if (order === 'asc') {
            return valueA > valueB ? 1 : valueA < valueB ? -1 : 0
          } else {
            return valueA < valueB ? 1 : valueA > valueB ? -1 : 0
          }
        })

        set({ wishlist: sorted })
      },

      /**
       * Resetear wishlist (para demos)
       */
      resetWishlist: () => {
        set({
          wishlist: [],
        })
      },
    }),
    {
      name: 'sellsi-wishlist-v1',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        wishlist: state.wishlist,
        lastModified: Date.now(),
        version: '1.0',
      }),
    }
  )
)

export default useWishlist
