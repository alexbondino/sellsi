/**
 * ============================================================================
 * CART STORE BACKEND OPERATIONS - SINCRONIZACIÓN CON BACKEND
 * ============================================================================
 *
 * Operaciones del carrito que requieren sincronización con el backend.
 * Extraídas del cartStore.js original para mejor organización.
 */

import { cartService } from '../../../services/user';
import { supabase } from '../../../services/supabase';
import { cleanLocalCartItems } from './cartStore.helpers';
import { isQuantityError } from '../../../utils/quantityValidation';

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
    const currentState = get();
    if (
      currentState.isBackendSynced &&
      currentState.userId === userId &&
      currentState.cartId
    ) {
      return true;
    }

    // ✅ Protección contra inicializaciones concurrentes
    if (currentState.isSyncing) {
      return true;
    }

    set({ isLoading: true, error: null, isSyncing: true });

    // Obtener carrito local antes de la migración y limpiar datos corruptos
    const rawLocalItems = get().items;
    const localItems = cleanLocalCartItems(rawLocalItems);

    // Informar si se limpiaron datos corruptos
    if (rawLocalItems.length !== localItems.length) {
    }

    // Obtener SIEMPRE carrito con items para evitar reinsertar líneas eliminadas en otro dispositivo
    const backendCart = await cartService.getOrCreateActiveCart(userId, {
      includeItems: true,
    });

    // ---------------------------------------------------------------------------
    // HOTFIX ANTI-REINSERCIÓN (BACKEND AUTHORITATIVE STRATEGY)
    // Si el backend YA tiene items, tratamos esos como la fuente de verdad y NO
    // migramos los locales ausentes (posiblemente fueron borrados desde otro dispositivo).
    // Sólo migraremos items locales cuando el backend esté vacío (carrito nuevo) para
    // preservar experiencia offline inicial sin provocar "resurrección".
    // ---------------------------------------------------------------------------
    const backendHasItems =
      Array.isArray(backendCart.items) && backendCart.items.length > 0;
    if (backendHasItems) {
      try {
        // eslint-disable-next-line no-console
        console.debug(
          '[cartStore.backend] backend authoritative: ignorando',
          rawLocalItems.length,
          'items locales; backend mantiene',
          backendCart.items.length
        );
      } catch (_) {}
      set({
        items: backendCart.items || [],
        cartId: backendCart.cart_id,
        userId: userId,
        isBackendSynced: true,
        isLoading: false,
        isSyncing: false,
      });
      return true;
    }

    // -------------------------------------------------------------
    // ANTI-RESURRECCIÓN GUARD (backend vacío pero actualizado hace poco)
    // Si el backend está vacío y se actualizó recientemente, asumimos que el usuario
    // LIMPIÓ el carrito en otro dispositivo. En ese caso descartamos items locales
    // para evitar reinsertarlos.
    // -------------------------------------------------------------
    const backendEmpty =
      !backendHasItems &&
      Array.isArray(backendCart.items) &&
      backendCart.items.length === 0;
    if (backendEmpty && localItems.length > 0) {
      const WINDOW_MS = 10 * 60 * 1000; // 10 minutos
      let backendUpdatedAtMs = 0;
      try {
        backendUpdatedAtMs = backendCart.updated_at
          ? new Date(backendCart.updated_at).getTime()
          : 0;
      } catch (_) {}
      const now = Date.now();
      const updatedRecently =
        backendUpdatedAtMs && now - backendUpdatedAtMs < WINDOW_MS;
      if (updatedRecently) {
        try {
          console.debug(
            '[cartStore.backend] backend vacío actualizado recientemente -> no migrar locales (evita resurrección)'
          );
        } catch (_) {}
        set({
          items: backendCart.items || [], // vacío
          cartId: backendCart.cart_id,
          userId: userId,
          isBackendSynced: true,
          isLoading: false,
          isSyncing: false,
        });
        return true;
      }
    }

    // Si backend vacío y hay items locales => migración legítima (primer sync)
    if (localItems.length > 0) {
      // DEBUG: ver qué se migrará
      try {
        // eslint-disable-next-line no-console
        console.log('[cartStore.backend] migrateLocalCart payload:', {
          userId,
          localItems,
        });
      } catch (e) {}
      // Filtrar locales que NO existan ya en backend (clave: product_id + offer_id)
      const backendKeySet = new Set(
        (backendCart.items || []).map(
          it => `${it.product_id}|${it.offer_id || ''}`
        )
      );
      const toMigrate = localItems.filter(
        li =>
          !backendKeySet.has(`${li.product_id || li.id}|${li.offer_id || ''}`)
      );
      let finalItems;
      if (toMigrate.length > 0) {
        // Solo ejecutar migración y refetch completo si realmente hay ítems nuevos que subir
        await cartService.migrateLocalCart(userId, toMigrate, {
          existingCart: backendCart,
          skipFinalFetch: true,
        });
        // Refrescar para incluir inserciones / merges recientes
        finalItems = await cartService.getCartItems(backendCart.cart_id);
      } else {
        // No hubo nada que migrar: reutilizar items ya obtenidos (evita segundo fetch idéntico)
        finalItems = backendCart.items || [];
        try {
          // eslint-disable-next-line no-console
          console.debug(
            '[cartStore.backend] skip second fetch (no migration needed)',
            { cartId: backendCart.cart_id, itemCount: finalItems.length }
          );
        } catch (_) {}
      }

      // DEBUG: registrar items devueltos por backend tras migración
      try {
        // eslint-disable-next-line no-console
        console.log('[cartStore.backend] finalItems after init:', {
          cartId: backendCart.cart_id,
          finalItems,
        });
      } catch (e) {}

      set({
        items: finalItems || [],
        cartId: backendCart.cart_id,
        userId: userId,
        isBackendSynced: true,
        isLoading: false,
        isSyncing: false,
      });
    } else {
      // Solo cargar el carrito del backend
      // DEBUG: registrar items cargados desde backend cuando no hay migración
      try {
        // eslint-disable-next-line no-console
        console.log('[cartStore.backend] initialize from backendCart:', {
          cartId: backendCart.cart_id,
          items: backendCart.items,
        });
      } catch (e) {}

      set({
        items: backendCart.items || [],
        cartId: backendCart.cart_id,
        userId: userId,
        isBackendSynced: true,
        isLoading: false,
        isSyncing: false,
      });
    }
    return true;
  } catch (error) {
    // Verificar si es un error relacionado con datos corruptos
    const isCorruptedDataError = isQuantityError(error);

    if (isCorruptedDataError) {
      // Limpiar carrito corrupto
      set({ items: [] });

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
          error: null,
        });
        return true;
      } catch (retryError) {}
    }

    set({
      error: 'No se pudo cargar el carrito',
      isLoading: false,
      isSyncing: false,
    });
    return false;
  }
};

/**
 * Sincroniza el carrito local con el backend
 * @param {Function} get - Función get de Zustand
 * @param {Object} shippingStore - Store de envío
 * @returns {boolean} Éxito de la sincronización
 */
export const syncToBackend = async (get, shippingStore) => {
  try {
    const state = get();
    const cartData = {
      items: state.items,
      // Obtener datos de módulos
      shipping: shippingStore.selectedShipping,
      lastModified: Date.now(),
    };
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Agrega un item al carrito con sincronización backend
 * @param {Object} product - Producto a agregar
 * @param {number} quantity - Cantidad a agregar
 * @param {Function} set - Función set de Zustand
 * @param {Function} get - Función get de Zustand
 * @param {Object} historyStore - Store de historial
 * @returns {boolean} Éxito de la operación
 */
export const addItemWithBackend = async (
  product,
  quantity,
  set,
  get,
  historyStore
) => {
  const state = get();

  // Si no hay usuario autenticado, usar función local
  if (!state.userId || !state.cartId) {
    return false;
  }

  try {
    set({ isSyncing: true });

    // DEBUG: registrar payload enviado al backend
    try {
      // eslint-disable-next-line no-console
      console.log('[cartStore.backend] addItemWithBackend payload:', {
        cartId: state.cartId,
        product,
        quantity,
      });
    } catch (e) {}

    // Ensure we are using the correct cart_id for the authenticated user to satisfy RLS.
    let userIdForRequest = state.userId;
    // If supabase.auth.getUser is available in the environment, prefer it.
    const authApiAvailable = !!(
      supabase &&
      supabase.auth &&
      typeof supabase.auth.getUser === 'function'
    );
    if (authApiAvailable) {
      try {
        const session = await supabase.auth.getUser();
        const user = session?.data?.user;
        if (user) {
          userIdForRequest = user.id;
        } else {
          // No session -> prompt login and abort (only when auth API exists)
          try {
            window.dispatchEvent(new CustomEvent('openLogin'));
          } catch (e) {}
          set({
            isSyncing: false,
            error:
              'Necesitas iniciar sesión para agregar este producto al carrito',
          });
          return false;
        }
      } catch (e) {
        // On auth API error, fallback to existing state.userId
      }
    }

    // Resolve or create the active cart for this user (server-side ownership enforced)
    const backendCart = await cartService.getOrCreateActiveCart(
      userIdForRequest,
      { includeItems: false }
    );
    const cartIdToUse = backendCart?.cart_id || state.cartId;

    try {
      // eslint-disable-next-line no-console
      console.log('[cartStore.backend] addItemWithBackend authUid vs cartId', {
        authUid: userIdForRequest,
        stateCartId: state.cartId,
        resolvedCartId: cartIdToUse,
      });
    } catch (e) {}

    // Persist resolved cartId into state so future ops use it
    try {
      set({ cartId: cartIdToUse, userId: userIdForRequest });
    } catch (e) {}

    // === NORMALIZACIÓN OFERTAS (hardening) ===
    try {
      const looksOffered = !!(
        product.isOffered ||
        product.offer_id ||
        product.offered_price ||
        product.metadata?.isOffered
      );
      if (looksOffered) {
        // Si falta offer_id u offered_price, abortar para evitar merges ambiguos
        if (!product.offer_id || !product.offered_price) {
          console.warn(
            '[cartStore.backend] Producto marcado como ofertado pero falta offer_id u offered_price. Abortando add.',
            { offer_id: product.offer_id, offered_price: product.offered_price }
          );
          set({
            isSyncing: false,
            error:
              'Oferta incompleta: faltan datos (offer_id / offered_price).',
          });
          return false;
        }
        // Normalizar bandera isOffered consistente
        product = { ...product, isOffered: true };
      }
    } catch (offerNormErr) {
      try {
        console.warn(
          '[cartStore.backend] error normalizando oferta:',
          offerNormErr?.message || offerNormErr
        );
      } catch (e) {}
    }

    // Agregar al backend usando cartIdToUse
    const result = await cartService.addItemToCart(
      cartIdToUse,
      product,
      quantity
    );

    // Obtener línea enriquecida (si existe) y fusionarla sin refetch total
    let enriched = null;
    if (result && result.cart_items_id) {
      // Preferir API puntual si existe, pero en tests puede no estar mockeada.
      if (typeof cartService.getCartItemEnriched === 'function') {
        try {
          enriched = await cartService.getCartItemEnriched(
            result.cart_items_id
          );
        } catch (e) {
          // ignore and fallback
        }
      }
      if (!enriched && typeof cartService.getCartItems === 'function') {
        try {
          const items = await cartService.getCartItems(cartIdToUse);
          enriched = Array.isArray(items)
            ? items.find(
                it =>
                  it.cart_items_id === result.cart_items_id ||
                  it.id === result.cart_items_id
              )
            : null;
        } catch (e) {
          // ignore fallback error
        }
      }
    }

    set(current => {
      const items = Array.isArray(current.items) ? [...current.items] : [];
      if (result) {
        // Buscar si ya existía (mergeCandidate) por cart_items_id
        const idx = items.findIndex(
          i =>
            i.cart_items_id === result.cart_items_id ||
            i.id === result.cart_items_id
        );
        if (idx !== -1) {
          items[idx] = {
            ...items[idx],
            ...(enriched || result),
            quantity: enriched?.quantity || result.quantity,
          };
        } else if (enriched) {
          items.unshift(enriched);
        } else {
          items.unshift({
            id: result.cart_items_id,
            cart_items_id: result.cart_items_id,
            product_id: result.product_id,
            quantity: result.quantity,
            offer_id: result.offer_id,
            offered_price: result.offered_price,
            metadata: result.metadata || {},
            document_type: result.document_type || 'ninguno',
          });
        }
      }
      return { items, isSyncing: false };
    });

    // Delegar al módulo de historial
    setTimeout(() => {
      historyStore.saveToHistory(get(), 'addItem', {
        productName: product.productnm || product.name,
        quantity: quantity,
        isBackend: true,
      });
    }, 0);

    return true;
  } catch (error) {
    set({ isSyncing: false });
    return false;
  }
};

/**
 * Actualiza la cantidad de un item con sincronización backend
 * @param {string} itemId - ID del item
 * @param {number} newQuantity - Nueva cantidad
 * @param {Function} set - Función set de Zustand
 * @param {Function} get - Función get de Zustand
 * @returns {boolean} Éxito de la operación
 */
export const updateQuantityWithBackend = async (
  itemId,
  newQuantity,
  set,
  get
) => {
  const state = get();

  // Si no hay usuario autenticado, usar función local
  if (!state.userId || !state.cartId) {
    return false;
  }

  // ✅ Encontrar el product_id correcto del item
  const item = state.items.find(
    item =>
      item.id === itemId ||
      item.productid === itemId ||
      item.product_id === itemId ||
      item.cart_items_id === itemId
  );

  if (!item) {
    return false;
  }

  const productId = item.product_id || item.productid || item.id;

  // 🚀 UPDATE OPTIMISTA: Actualizar UI inmediatamente
  const oldQuantity = item.quantity;

  // Actualizar localmente primero para respuesta inmediata
  if (newQuantity <= 0) {
    // Remover item optimísticamente
    set({
      items: state.items.filter(i => i.id !== itemId),
      isSyncing: true,
    });
  } else {
    // Actualizar cantidad optimísticamente
    set({
      items: state.items.map(i =>
        i.id === itemId ? { ...i, quantity: newQuantity } : i
      ),
      isSyncing: true,
    });
  }

  try {
    // Luego sincronizar con backend en segundo plano

    // Actualizar en backend
    if (newQuantity <= 0) {
      await cartService.removeItemFromCart(state.cartId, productId);
    } else {
      await cartService.updateItemQuantity(
        state.cartId,
        productId,
        newQuantity
      );
    }

    // ✅ NO RECARGAR TODO EL CARRITO - Solo confirmar que todo está bien
    set({ isSyncing: false });

    return true;
  } catch (error) {
    // Revertir cambio optimista si falla
    if (newQuantity <= 0) {
      // Restaurar item removido
      set({
        items: [...state.items, item],
        isSyncing: false,
      });
    } else {
      // Restaurar cantidad anterior
      set({
        items: state.items.map(i =>
          i.id === itemId ? { ...i, quantity: oldQuantity } : i
        ),
        isSyncing: false,
      });
    }

    return false;
  }
};

/**
 * Remueve un item del carrito con sincronización backend
 * @param {string} itemId - ID del item a remover
 * @param {Function} set - Función set de Zustand
 * @param {Function} get - Función get de Zustand
 * @returns {boolean} Éxito de la operación
 */
export const removeItemWithBackend = async (itemId, set, get) => {
  const state = get();

  // Si no hay usuario autenticado, usar función local
  if (!state.userId || !state.cartId) {
    return false;
  }

  // ✅ Encontrar el product_id correcto del item
  const item = state.items.find(
    item =>
      item.id === itemId ||
      item.productid === itemId ||
      item.product_id === itemId ||
      item.cart_items_id === itemId
  );

  if (!item) {
    return false;
  }

  // Usar siempre cart_items_id para evitar borrar líneas hermanas (ofertas vs regular)
  const lineId = item.cart_items_id || item.id;
  try {
    set({ isSyncing: true });
    await cartService.removeLineFromCart(state.cartId, lineId);
    set({
      items: state.items.filter(
        i => i.cart_items_id !== lineId && i.id !== lineId
      ),
      isSyncing: false,
    });
    return true;
  } catch (error) {
    set({ isSyncing: false });
    return false;
  }
};

/**
 * Elimina múltiples items (cart_items_id) en batch
 */
export const removeItemsBatchWithBackend = async (itemIds, set, get) => {
  const state = get();
  if (
    !state.userId ||
    !state.cartId ||
    !Array.isArray(itemIds) ||
    itemIds.length === 0
  )
    return false;
  // Mapear a cart_items_id reales presentes
  const lineIds = state.items
    .filter(i => itemIds.includes(i.id) || itemIds.includes(i.cart_items_id))
    .map(i => i.cart_items_id || i.id);
  if (lineIds.length === 0) return false;
  try {
    set({ isSyncing: true });
    await cartService.removeItemsFromCart(state.cartId, lineIds);
    const toRemove = new Set(lineIds);
    set({
      items: state.items.filter(
        i => !toRemove.has(i.cart_items_id) && !toRemove.has(i.id)
      ),
      isSyncing: false,
    });
    return true;
  } catch (e) {
    set({ isSyncing: false });
    return false;
  }
};

/**
 * Limpia el carrito con sincronización backend
 * @param {Function} set - Función set de Zustand
 * @param {Function} get - Función get de Zustand
 * @returns {boolean} Éxito de la operación
 */
export const clearCartWithBackend = async (set, get) => {
  const state = get();

  // Si no hay usuario autenticado, usar función local
  if (!state.userId || !state.cartId) {
    return false;
  }

  try {
    set({ isSyncing: true });

    // Limpiar en backend
    await cartService.clearCart(state.cartId);

    // Actualizar estado local
    set({
      items: [],
      isSyncing: false,
    });

    return true;
  } catch (error) {
    set({ isSyncing: false });
    return false;
  }
};

/**
 * Limpia el carrito SOLO si la orden está pagada (payment_status='paid').
 * Puede recibir un objeto `order` o directamente el string de estado.
 */
export const clearCartIfPaid = async (orderOrStatus, set, get) => {
  try {
    const state = get();
    const isObject = orderOrStatus && typeof orderOrStatus === 'object';
    const paymentStatus = isObject
      ? orderOrStatus.payment_status
      : orderOrStatus;
    const isPaid = paymentStatus === 'paid';
    if (!isPaid) return false;

    // Si viene una orden, opcionalmente verificar correspondencia con el carrito actual
    if (isObject) {
      const matchesCart =
        !orderOrStatus.cart_id || orderOrStatus.cart_id === state.cartId;
      if (!matchesCart) return false;
    }

    return await clearCartWithBackend(set, get);
  } catch (_) {
    return false;
  }
};

/**
 * Realiza el checkout del carrito
 * @param {Object} checkoutData - Datos del checkout
 * @param {Function} set - Función set de Zustand
 * @param {Function} get - Función get de Zustand
 * @returns {Object} Orden creada
 */
export const checkout = async (checkoutData, set, get) => {
  const state = get();

  if (!state.userId || !state.cartId) {
    throw new Error('Usuario no autenticado');
  }

  try {
    set({ isLoading: true });

    // Realizar checkout en backend
    const order = await cartService.checkout(state.cartId, checkoutData);

    // Regla nueva: NO vaciar carrito en checkout.
    // Se vaciará solo cuando payment_status sea 'paid'.
    set({ isLoading: false, lastOrder: order });
    return order;
  } catch (error) {
    set({ isLoading: false, error: 'Error en el checkout' });
    throw error;
  }
};
