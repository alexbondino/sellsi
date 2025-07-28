/**
 * ============================================================================
 * CART STORE BACKEND OPERATIONS - SINCRONIZACIÓN CON BACKEND
 * ============================================================================
 *
 * Operaciones del carrito que requieren sincronización con el backend.
 * Extraídas del cartStore.js original para mejor organización.
 */

import { cartService } from '../../../services/user'
import { cleanLocalCartItems } from './cartStore.helpers'
import { isQuantityError } from '../../../utils/quantityValidation'

/**
 * Inicializa el carrito con un usuario autenticado
 * @param {string} userId - ID del usuario
 * @param {Function} set - Función set de Zustand
 * @param {Function} get - Función get de Zustand
 * @returns {boolean} Éxito de la operación
 */
export const initializeCartWithUser = async (userId, set, get) => {
  try {
    // ✅ Protección contra inicializaciones múltiples
    const currentState = get()
    if (currentState.isBackendSynced && currentState.userId === userId && currentState.cartId) {
      return true
    }
    
    // ✅ Protección contra inicializaciones concurrentes
    if (currentState.isSyncing) {
      return true
    }
    
    set({ isLoading: true, error: null, isSyncing: true })

    // Obtener carrito local antes de la migración y limpiar datos corruptos
    const rawLocalItems = get().items
    const localItems = cleanLocalCartItems(rawLocalItems)
    
    // Informar si se limpiaron datos corruptos
    if (rawLocalItems.length !== localItems.length) {
      }

    // Obtener o crear carrito en backend
    const backendCart = await cartService.getOrCreateActiveCart(userId)

    // Si hay items locales, migrarlos al backend
    if (localItems.length > 0) {
      await cartService.migrateLocalCart(userId, localItems)
      
      // Obtener solo los items actualizados, no todo el carrito nuevamente
      const updatedItems = await cartService.getCartItems(backendCart.cart_id)
      
      set({
        items: updatedItems || [],
        cartId: backendCart.cart_id,
        userId: userId,
        isBackendSynced: true,
        isLoading: false,
        isSyncing: false
      })
    } else {
      // Solo cargar el carrito del backend
      set({
        items: backendCart.items || [],
        cartId: backendCart.cart_id,
        userId: userId,
        isBackendSynced: true,
        isLoading: false,
        isSyncing: false
      })
    }
    return true
  } catch (error) {
    // Verificar si es un error relacionado con datos corruptos
    const isCorruptedDataError = isQuantityError(error)
    
    if (isCorruptedDataError) {
      // Limpiar carrito corrupto
      set({ items: [] })
      
      // Intentar inicializar de nuevo con carrito limpio
      try {
        const backendCart = await cartService.getOrCreateActiveCart(userId)
        set({
          items: backendCart.items || [],
          cartId: backendCart.cart_id,
          userId: userId,
          isBackendSynced: true,
          isLoading: false,
          isSyncing: false,
          error: null
        })
        return true
      } catch (retryError) {
        }
    }
    
    set({ 
      error: 'No se pudo cargar el carrito', 
      isLoading: false, 
      isSyncing: false 
    })
    return false
  }
}

/**
 * Sincroniza el carrito local con el backend
 * @param {Function} get - Función get de Zustand
 * @param {Object} wishlistStore - Store de wishlist
 * @param {Object} couponsStore - Store de cupones
 * @param {Object} shippingStore - Store de envío
 * @returns {boolean} Éxito de la sincronización
 */
export const syncToBackend = async (get, wishlistStore, couponsStore, shippingStore) => {
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
    return true
  } catch (error) {
    return false
  }
}

/**
 * Agrega un item al carrito con sincronización backend
 * @param {Object} product - Producto a agregar
 * @param {number} quantity - Cantidad a agregar
 * @param {Function} set - Función set de Zustand
 * @param {Function} get - Función get de Zustand
 * @param {Object} historyStore - Store de historial
 * @returns {boolean} Éxito de la operación
 */
export const addItemWithBackend = async (product, quantity, set, get, historyStore) => {
  const state = get()
  
  // Si no hay usuario autenticado, usar función local
  if (!state.userId || !state.cartId) {
    return false
  }

  try {
    set({ isSyncing: true })
    
    // Agregar al backend
    const result = await cartService.addItemToCart(state.cartId, product, quantity)

    // En lugar de recargar todo el carrito, solo obtener los items actualizados
    const updatedItems = await cartService.getCartItems(state.cartId)
    
    set({
      items: updatedItems || [],
      isSyncing: false
    })

    // Delegar al módulo de historial
    setTimeout(() => {
      historyStore.saveToHistory(get(), 'addItem', {
        productName: product.productnm || product.name,
        quantity: quantity,
        isBackend: true
      })
    }, 0)

    return true
  } catch (error) {
    set({ isSyncing: false })
    return false
  }
}

/**
 * Actualiza la cantidad de un item con sincronización backend
 * @param {string} itemId - ID del item
 * @param {number} newQuantity - Nueva cantidad
 * @param {Function} set - Función set de Zustand
 * @param {Function} get - Función get de Zustand
 * @returns {boolean} Éxito de la operación
 */
export const updateQuantityWithBackend = async (itemId, newQuantity, set, get) => {
  const state = get()
  
  // Si no hay usuario autenticado, usar función local
  if (!state.userId || !state.cartId) {
    return false
  }

  // ✅ Encontrar el product_id correcto del item
  const item = state.items.find(item => 
    item.id === itemId || 
    item.productid === itemId || 
    item.product_id === itemId ||
    item.cart_items_id === itemId
  )
  
  if (!item) {
    return false
  }
  
  const productId = item.product_id || item.productid || item.id

  // 🚀 UPDATE OPTIMISTA: Actualizar UI inmediatamente
  const oldQuantity = item.quantity
  
  // Actualizar localmente primero para respuesta inmediata
  if (newQuantity <= 0) {
    // Remover item optimísticamente
    set({
      items: state.items.filter(i => i.id !== itemId),
      isSyncing: true
    })
  } else {
    // Actualizar cantidad optimísticamente
    set({
      items: state.items.map(i => 
        i.id === itemId 
          ? { ...i, quantity: newQuantity }
          : i
      ),
      isSyncing: true
    })
  }

  try {
    // Luego sincronizar con backend en segundo plano
    
    // Actualizar en backend
    if (newQuantity <= 0) {
      await cartService.removeItemFromCart(state.cartId, productId)
    } else {
      await cartService.updateItemQuantity(state.cartId, productId, newQuantity)
    }

    // ✅ NO RECARGAR TODO EL CARRITO - Solo confirmar que todo está bien
    set({ isSyncing: false })
    
    return true
  } catch (error) {
    // Revertir cambio optimista si falla
    if (newQuantity <= 0) {
      // Restaurar item removido
      set({
        items: [...state.items, item],
        isSyncing: false
      })
    } else {
      // Restaurar cantidad anterior
      set({
        items: state.items.map(i => 
          i.id === itemId 
            ? { ...i, quantity: oldQuantity }
            : i
        ),
        isSyncing: false
      })
    }
    
    return false
  }
}

/**
 * Remueve un item del carrito con sincronización backend
 * @param {string} itemId - ID del item a remover
 * @param {Function} set - Función set de Zustand
 * @param {Function} get - Función get de Zustand
 * @returns {boolean} Éxito de la operación
 */
export const removeItemWithBackend = async (itemId, set, get) => {
  const state = get()
  
  // Si no hay usuario autenticado, usar función local
  if (!state.userId || !state.cartId) {
    return false
  }

  // ✅ Encontrar el product_id correcto del item
  const item = state.items.find(item => 
    item.id === itemId || 
    item.productid === itemId || 
    item.product_id === itemId ||
    item.cart_items_id === itemId
  )
  
  if (!item) {
    return false
  }
  
  const productId = item.product_id || item.productid || item.id

  try {
    set({ isSyncing: true })

    // Remover del backend
    await cartService.removeItemFromCart(state.cartId, productId)

    // Recargar carrito desde backend
    const updatedCart = await cartService.getOrCreateActiveCart(state.userId)
    set({
      items: updatedCart.items || [],
      isSyncing: false
    })

    return true
  } catch (error) {
    set({ isSyncing: false })
    return false
  }
}

/**
 * Limpia el carrito con sincronización backend
 * @param {Function} set - Función set de Zustand
 * @param {Function} get - Función get de Zustand
 * @returns {boolean} Éxito de la operación
 */
export const clearCartWithBackend = async (set, get) => {
  const state = get()
  
  // Si no hay usuario autenticado, usar función local
  if (!state.userId || !state.cartId) {
    return false
  }

  try {
    set({ isSyncing: true })

    // Limpiar en backend
    await cartService.clearCart(state.cartId)

    // Actualizar estado local
    set({
      items: [],
      isSyncing: false
    })

    return true
  } catch (error) {
    set({ isSyncing: false })
    return false
  }
}

/**
 * Realiza el checkout del carrito
 * @param {Object} checkoutData - Datos del checkout
 * @param {Function} set - Función set de Zustand
 * @param {Function} get - Función get de Zustand
 * @param {Object} couponsStore - Store de cupones
 * @returns {Object} Orden creada
 */
export const checkout = async (checkoutData, set, get, couponsStore) => {
  const state = get()
  
  if (!state.userId || !state.cartId) {
    throw new Error('Usuario no autenticado')
  }

  try {
    set({ isLoading: true })

    // Realizar checkout en backend
    const order = await cartService.checkout(state.cartId, checkoutData)

    // Crear nuevo carrito activo para futuras compras
    const newCart = await cartService.getOrCreateActiveCart(state.userId)

    // Actualizar estado local
    set({
      items: [],
      cartId: newCart.cart_id,
      isLoading: false
    })

    // Limpiar módulos relacionados
    couponsStore.clearCoupons()

    return order
  } catch (error) {
    set({ isLoading: false, error: 'Error en el checkout' })
    throw error
  }
}
