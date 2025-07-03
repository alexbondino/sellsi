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
import debounce from 'lodash.debounce'
import { calculatePriceForQuantity } from '../../../utils/priceCalculation'
import { cartService } from '../../../services/cartService'
import { validateQuantity, sanitizeCartItems, isQuantityError, QUANTITY_LIMITS } from '../../../utils/quantityValidation'

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
  }, 50) // Guardar después de 50ms de inactividad (OPTIMIZADO)
}

// Creación del store utilizando Zustand
const useCartStore = create(
  persist(
    (set, get) => {
      // Crear función de auto-guardado específica para esta instancia
      const debouncedSave = createDebouncedSave(get)      // Instanciar módulos especializados
      const historyStore = useCartHistory.getState()
      const wishlistStore = useWishlist.getState()
      const couponsStore = useCoupons.getState()
      const shippingStore = useShipping.getState()

      return {
        // Estado principal del carrito (vacío por defecto)
        items: [],
        isLoading: false,
        error: null,
        notifications: [],
        
        // === ESTADO PARA INTEGRACIÓN CON BACKEND ===
        cartId: null,
        userId: null,
        isBackendSynced: false,
        isSyncing: false,

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
        },// === ACCIONES DEL CARRITO (REFACTORIZADAS) ===        // Agregar producto al carrito
        addItem: async (product, quantity = 1) => {
          console.log('[cartStore] addItem called', { product, quantity });
          const state = get()
          
          // VALIDACIÓN: Asegurar que la cantidad esté en un rango seguro
          const safeQuantity = validateCartQuantity(quantity);
          
          // DETECCIÓN AUTOMÁTICA: Si hay usuario autenticado, usar backend
          if (state.userId && state.cartId && state.isBackendSynced) {
            return await get().addItemWithBackend(product, safeQuantity)
          }
          
          // Asegurarse de que la imagen principal esté presente
          const image =
            product.imagen || product.image || '/placeholder-product.jpg'

          // Asegurar que el nombre del proveedor esté presente (no el ID)
          const supplier = product.proveedor || product.supplier || 'Proveedor no especificado'

          // ===== REFORZAR CAMPOS price_tiers Y minimum_purchase =====          const basePrice = product.precio || product.price || 0
          // Usar price_tiers solo si es un array válido y no vacío
          const price_tiers = (Array.isArray(product.price_tiers) && product.price_tiers.length > 0)
            ? product.price_tiers
            : (Array.isArray(product.priceTiers) && product.priceTiers.length > 0)
              ? product.priceTiers
              : [{ min_quantity: 1, price: basePrice }]
          const minimum_purchase = product.minimum_purchase || product.compraMinima || 1

          const item = {
            ...product,
            image,
            supplier, // ✅ Asegurar que se use el nombre, no el ID
            quantity: safeQuantity,
            price_tiers,
            minimum_purchase,
          }
          
          const currentState = get()
          const existingItem = currentState.items.find(
            (item) => item.id === product.id
          )

          if (existingItem) {
            // Validar la nueva cantidad total
            const newTotalQuantity = validateCartQuantity(existingItem.quantity + safeQuantity);
            const maxStock = Math.min(product.maxStock || 15000, 15000);
            console.log('[cartStore] existingItem found', { existingItem, newTotalQuantity, maxStock });
            if (newTotalQuantity <= maxStock) {
              set({
                items: currentState.items.map((item) =>
                  item.id === product.id
                    ? { ...item, quantity: newTotalQuantity }
                    : item
                ),
              })
              console.log('[cartStore] updated quantity for existing item', { id: product.id, quantity: newTotalQuantity });
            } else {
              console.warn('[cartStore] No hay suficiente stock')
            }
          } else {
            const newItem = {
              ...item,
              addedAt: new Date().toISOString(),
            }
            set({
              items: [...currentState.items, newItem],
            })
            console.log('[cartStore] added new item to cart', newItem);
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
        },        // Actualizar cantidad con respuesta inmediata
        updateQuantity: async (id, quantity) => {
          const state = get()
          
          // VALIDACIÓN: Asegurar que la cantidad esté en un rango seguro
          const safeInputQuantity = validateCartQuantity(quantity);
          
          // DETECCIÓN AUTOMÁTICA: Si hay usuario autenticado, usar backend
          if (state.userId && state.cartId && state.isBackendSynced) {
            return await get().updateQuantityWithBackend(id, safeInputQuantity)
          }
          
          const currentState = get()
          const item = currentState.items.find((item) => item.id === id)
          if (!item) return
          
          // Forzar mínimo de compra y máximo de stock
          const min = item.minimum_purchase || item.compraMinima || 1
          const maxStock = Math.min(item.maxStock || 15000, 15000); // Limitar también el stock máximo
          
          let safeQuantity = validateCartQuantity(safeInputQuantity, min, maxStock);
          
          if (safeQuantity < min) {
            safeQuantity = min
          }
          if (safeQuantity > maxStock) {
            safeQuantity = maxStock
          }
          // LOG: Mostrar tramos y tramo aplicado
          if (item.price_tiers && item.price_tiers.length > 0) {
            const logTiers = item.price_tiers.map(t => `${t.min_quantity},${t.price}`).join('\n')
            const tramo = item.price_tiers.find(t => safeQuantity >= t.min_quantity)
            if (tramo) {
            }
          }
          if (safeQuantity > 0 && safeQuantity <= item.maxStock) {
            const oldQuantity = item.quantity
            // Obtener price_tiers y precio base
            const price_tiers = item.price_tiers || item.priceTiers || []
            const basePrice = item.originalPrice || item.precioOriginal || item.price || item.precio || 0
            // Calcular nuevo precio unitario
            const newUnitPrice = calculatePriceForQuantity(safeQuantity, price_tiers, basePrice)
            set({
              items: currentState.items.map((cartItem) =>
                cartItem.id === id
                  ? {
                      ...cartItem,
                      quantity: safeQuantity,
                      price: newUnitPrice,
                      precioUnitario: newUnitPrice,
                      precioTotal: newUnitPrice * safeQuantity,
                      cantidadSeleccionada: safeQuantity,
                    }
                  : cartItem
              ),
            })

            // Delegar al módulo de historial
            setTimeout(() => {
              historyStore.saveToHistory(get(), 'updateQuantity', {
                productName: item.name,
                oldQuantity: oldQuantity,
                newQuantity: safeQuantity,
                oldPrice: item.price,
                newPrice: newUnitPrice,
              })
            }, 0)            // Auto-guardar cambios
            debouncedSave()
          }
        },

        // Versión con debounce para casos específicos donde se necesite
        updateQuantityDebounced: debounce((id, quantity) => {
          get().updateQuantity(id, quantity)
        }, 10), // OPTIMIZADO: 10ms en lugar de 100ms

        // Remover item
        removeItem: async (id) => {
          const state = get()
          
          // DETECCIÓN AUTOMÁTICA: Si hay usuario autenticado, usar backend
          if (state.userId && state.cartId && state.isBackendSynced) {
            return await get().removeItemWithBackend(id)
          }
          
          const currentState = get()
          const item = currentState.items.find((item) => item.id === id)
          if (item) {
            set({ items: currentState.items.filter((item) => item.id !== id) })
          } else {
            console.warn('[cartStore] Item no encontrado para remover:', id)
          }

          // Delegar al módulo de historial
          setTimeout(() => {
            historyStore.saveToHistory(get(), 'removeItem', {
              productName: item?.name || 'Producto desconocido',
              quantity: item?.quantity || 0,
            })
          }, 0)

          // Auto-guardar cambios
          debouncedSave()
        },
        
        // Limpiar carrito
        clearCart: async () => {
          const state = get()
          
          // DETECCIÓN AUTOMÁTICA: Si hay usuario autenticado, usar backend
          if (state.userId && state.cartId && state.isBackendSynced) {
            return await get().clearCartWithBackend()
          }
          
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

        // Funciones de cupones (delegadas)
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
        }, // === FUNCIONES DE PERSISTENCIA HÍBRIDA ===

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
              return true
            }
          } catch (error) {
            console.error('❌ Error cargando desde localStorage:', error)
          }
          return false
        },        // Preparación para sincronización con backend
        syncToBackend: async () => {
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
            return true
          } catch (error) {
            console.error('❌ Error en sincronización:', error)
            return false
          }
        },

        // === FUNCIONES DE INTEGRACIÓN CON BACKEND ===        // Inicializar carrito con usuario autenticado
        initializeCartWithUser: async (userId) => {
          try {            // ✅ Protección contra inicializaciones múltiples
            const currentState = get()
            if (currentState.isBackendSynced && currentState.userId === userId && currentState.cartId) {
              return
            }
            
            // ✅ Protección contra inicializaciones concurrentes
            if (currentState.isSyncing) {
              return
            }
            
            set({ isLoading: true, error: null, isSyncing: true })

            // Obtener carrito local antes de la migración y limpiar datos corruptos
            const rawLocalItems = get().items
            const localItems = cleanLocalCartItems(rawLocalItems)
            
            // Informar si se limpiaron datos corruptos
            if (rawLocalItems.length !== localItems.length) {
              console.warn(`[cartStore] 🧹 Limpiados ${rawLocalItems.length - localItems.length} items corruptos del carrito local`);
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
            console.error('[cartStore] ❌ Error inicializando carrito con usuario:', error)
            
            // Verificar si es un error relacionado con datos corruptos
            const isCorruptedDataError = isQuantityError(error);
            
            if (isCorruptedDataError) {
              console.warn('[cartStore] 🚨 Detectados datos corruptos, limpiando carrito...');
              get().clearCorruptedCart();
              // Intentar inicializar de nuevo con carrito limpio
              try {
                const backendCart = await cartService.getOrCreateActiveCart(userId);
                set({
                  items: backendCart.items || [],
                  cartId: backendCart.cart_id,
                  userId: userId,
                  isBackendSynced: true,
                  isLoading: false,
                  isSyncing: false,
                  error: null
                });
                return true;
              } catch (retryError) {
                console.error('[cartStore] ❌ Error en segundo intento:', retryError);
              }
            }
            
            set({ 
              error: 'No se pudo cargar el carrito', 
              isLoading: false, 
              isSyncing: false 
            })
            return false
          }
        },        // Agregar item con sincronización backend
        addItemWithBackend: async (product, quantity = 1) => {
          const state = get()
          
          // Si no hay usuario autenticado, usar función local
          if (!state.userId || !state.cartId) {
            return get().addItem(product, quantity)
          }

          try {
            set({ isSyncing: true })
            
            // Agregar al backend
            const result = await cartService.addItemToCart(state.cartId, product, quantity)

            // En lugar de recargar todo el carrito, solo obtener los items actualizados
            // para evitar crear carritos duplicados
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
            console.error('[cartStore] ❌ Error agregando item al backend:', error)
            set({ isSyncing: false })
            // Fallback a función local
            return get().addItem(product, quantity)
          }
        },        // Actualizar cantidad con sincronización backend
        updateQuantityWithBackend: async (itemId, newQuantity) => {
          const state = get()
            // Si no hay usuario autenticado, usar función local
          if (!state.userId || !state.cartId) {
            return get().updateQuantity(itemId, newQuantity)
          }

          // ✅ Encontrar el product_id correcto del item
          const item = state.items.find(item => 
            item.id === itemId || 
            item.productid === itemId || 
            item.product_id === itemId ||
            item.cart_items_id === itemId
          )          
          if (!item) {
            console.error('[cartStore] ❌ Item no encontrado en carrito local:', itemId)
            return false
          }
          
          const productId = item.product_id || item.productid || item.id

          try {
            set({ isSyncing: true })

            // Actualizar en backend
            if (newQuantity <= 0) {
              await cartService.removeItemFromCart(state.cartId, productId)
            } else {
              await cartService.updateItemQuantity(state.cartId, productId, newQuantity)
            }

            // Recargar carrito desde backend
            const updatedCart = await cartService.getOrCreateActiveCart(state.userId)
            set({
              items: updatedCart.items || [],
              isSyncing: false
            })

            return true} catch (error) {
            console.error('[cartStore] ❌ Error actualizando cantidad en backend:', error)
            set({ isSyncing: false })
            // Fallback a función local
            return get().updateQuantity(itemId, newQuantity)
          }
        },        // Remover item con sincronización backend
        removeItemWithBackend: async (itemId) => {
          const state = get()
            // Si no hay usuario autenticado, usar función local
          if (!state.userId || !state.cartId) {
            return get().removeItem(itemId)
          }

          // ✅ Encontrar el product_id correcto del item
          const item = state.items.find(item => 
            item.id === itemId || 
            item.productid === itemId || 
            item.product_id === itemId ||
            item.cart_items_id === itemId
          )
          
          if (!item) {
            console.error('[cartStore] ❌ Item no encontrado en carrito local:', itemId)
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

            return true} catch (error) {
            console.error('[cartStore] ❌ Error removiendo item del backend:', error)
            set({ isSyncing: false })
            // Fallback a función local
            return get().removeItem(itemId)
          }
        },        // Limpiar carrito con sincronización backend
        clearCartWithBackend: async () => {
          const state = get()
          
          // Si no hay usuario autenticado, usar función local
          if (!state.userId || !state.cartId) {
            console.warn('[cartStore] No userId/cartId, usando clearCart local')
            return get().clearCart()
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
            console.error('[cartStore] ❌ Error limpiando carrito en backend:', error)
            set({ isSyncing: false })
            // Fallback a función local
            return get().clearCart()
          }
        },

        // Proceso de checkout
        checkout: async (checkoutData = {}) => {
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
            console.error('[cartStore] ❌ Error en checkout:', error)
            set({ isLoading: false, error: 'Error en el checkout' })
            throw error
          }
        },

        // Desconectar del backend (logout)
        disconnectFromBackend: () => {
          set({
            cartId: null,
            userId: null,
            isBackendSynced: false,
            isSyncing: false
          })
          // El carrito local se mantiene para migración futura
        },

        // Función de utilidad para limpiar carrito corrupto
        clearCorruptedCart: () => {
          console.warn('[cartStore] 🧹 Limpiando carrito corrupto...');
          
          // Limpiar estado del store
          set({
            items: [],
            totalItems: 0,
            totalPrice: 0,
            cartId: null,
            userId: null,
            isBackendSynced: false,
            error: null,
            isLoading: false,
            isSyncing: false
          });
          
          // Limpiar localStorage
          try {
            localStorage.removeItem('cart-storage');
            localStorage.removeItem('cart-items');
            localStorage.removeItem('carrito');
            console.log('[cartStore] ✅ LocalStorage del carrito limpiado');
          } catch (error) {
            console.error('[cartStore] ❌ Error limpiando localStorage:', error);
          }
        },

        // ============================================================================
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
        // Eliminado log de hidratación
        return (state, error) => {
          if (error) {
            // Eliminado log de error de hidratación
          } else {
            // Eliminado log de éxito de hidratación
          }
        }
      },
      version: 3,
    }
  )
)

// ============================================================================
// FUNCIÓN DE VALIDACIÓN DE CANTIDADES
// ============================================================================

/**
 * Valida y limita cantidades para evitar overflow de base de datos
 * @param {number} quantity - Cantidad a validar
 * @param {number} min - Valor mínimo permitido (default: 1)
 * @param {number} max - Valor máximo permitido (default: 15000)
 * @returns {number} Cantidad validada y limitada
 */
const validateCartQuantity = (quantity, min = 1, max = QUANTITY_LIMITS.MAX) => {
  return validateQuantity(quantity, min, max);
};

/**
 * Limpia y valida items del carrito local para remover datos corruptos
 * @param {Array} items - Items del carrito a validar
 * @returns {Array} Items válidos
 */
const cleanLocalCartItems = (items) => {
  const result = sanitizeCartItems(items);
  
  if (result.summary.removed > 0 || result.summary.corrected > 0) {
    console.warn('[cartStore] 🧹 Limpieza de carrito:', result.summary);
  }
  
  return result.validItems;
};

export default useCartStore
