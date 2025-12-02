/**
 * ============================================================================
 * CART STORE LOCAL OPERATIONS - OPERACIONES SIN BACKEND
 * ============================================================================
 *
 * Operaciones del carrito que se ejecutan solo localmente.
 * Extraídas del cartStore.js original para mejor organización.
 */

import { validateCartQuantity, prepareCartItem } from './cartStore.helpers';
import { calculatePriceForQuantity } from '../../../utils/priceCalculation';
import { CART_CONFIG } from './cartStore.constants';

/**
 * Agrega un item al carrito localmente
 * @param {Object} product - Producto a agregar
 * @param {number} quantity - Cantidad a agregar
 * @param {Function} set - Función set de Zustand
 * @param {Function} get - Función get de Zustand
 * @param {Object} historyStore - Store de historial
 * @param {Function} debouncedSave - Función de guardado automático
 */
export const addItemLocal = (
  product,
  quantity,
  set,
  get,
  historyStore,
  debouncedSave
) => {
  const item = prepareCartItem(product, quantity);
  const currentState = get();
  const existingItem = currentState.items.find(item => item.id === product.id);

  if (existingItem) {
    // Validar la nueva cantidad total
    const newTotalQuantity = validateCartQuantity(
      existingItem.quantity + item.quantity
    );
    const maxStock = Math.min(
      product.maxStock || CART_CONFIG.DEFAULT_STOCK,
      CART_CONFIG.DEFAULT_STOCK
    );

    if (newTotalQuantity <= maxStock) {
      set({
        items: currentState.items.map(cartItem =>
          cartItem.id === product.id
            ? { ...cartItem, quantity: newTotalQuantity }
            : cartItem
        ),
      });
    } else {
    }
  } else {
    set({
      items: [...currentState.items, item],
    });
  }

  // Delegar al módulo de historial
  setTimeout(() => {
    historyStore.saveToHistory(get(), 'addItem', {
      productName: product.name,
      quantity: quantity,
      isExisting: !!existingItem,
    });
  }, 0);

  // Auto-guardar cambios
  debouncedSave();
};

/**
 * Actualiza la cantidad de un item en el carrito localmente
 * @param {string} id - ID del producto
 * @param {number} quantity - Nueva cantidad
 * @param {Function} set - Función set de Zustand
 * @param {Function} get - Función get de Zustand
 * @param {Object} historyStore - Store de historial
 * @param {Function} debouncedSave - Función de guardado automático
 */
export const updateQuantityLocal = (
  id,
  quantity,
  set,
  get,
  historyStore,
  debouncedSave
) => {
  const safeInputQuantity = validateCartQuantity(quantity);
  const currentState = get();
  const item = currentState.items.find(item => item.id === id);

  if (!item) {
    return;
  }

  // Forzar mínimo de compra y máximo de stock
  const min = item.minimum_purchase || item.compraMinima || 1;
  const maxStock = Math.min(
    item.maxStock || CART_CONFIG.DEFAULT_STOCK,
    CART_CONFIG.DEFAULT_STOCK
  );

  let safeQuantity = validateCartQuantity(safeInputQuantity, min, maxStock);

  if (safeQuantity < min) {
    safeQuantity = min;
  }
  if (safeQuantity > maxStock) {
    safeQuantity = maxStock;
  }

  // LOG: Mostrar tramos y tramo aplicado
  if (item.price_tiers && item.price_tiers.length > 0) {
    const logTiers = item.price_tiers
      .map(t => `${t.min_quantity},${t.price}`)
      .join('\n');
    const tramo = item.price_tiers.find(t => safeQuantity >= t.min_quantity);
    if (tramo) {
      // Log interno
    }
  }

  if (safeQuantity > 0 && safeQuantity <= item.maxStock) {
    const oldQuantity = item.quantity;
    // Obtener price_tiers y precio base
    const price_tiers = item.price_tiers || item.priceTiers || [];
    const basePrice =
      item.originalPrice ||
      item.precioOriginal ||
      item.price ||
      item.precio ||
      0;
    // Calcular nuevo precio unitario
    const newUnitPrice = calculatePriceForQuantity(
      safeQuantity,
      price_tiers,
      basePrice
    );

    set({
      items: currentState.items.map(cartItem =>
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
    });

    // Delegar al módulo de historial
    setTimeout(() => {
      historyStore.saveToHistory(get(), 'updateQuantity', {
        productName: item.name,
        oldQuantity: oldQuantity,
        newQuantity: safeQuantity,
        oldPrice: item.price,
        newPrice: newUnitPrice,
      });
    }, 0);

    // Auto-guardar cambios
    debouncedSave();
  }
};

/**
 * Remueve un item del carrito localmente
 * @param {string} id - ID del producto a remover
 * @param {Function} set - Función set de Zustand
 * @param {Function} get - Función get de Zustand
 * @param {Object} historyStore - Store de historial
 * @param {Function} debouncedSave - Función de guardado automático
 */
export const removeItemLocal = (id, set, get, historyStore, debouncedSave) => {
  const currentState = get();
  const item = currentState.items.find(item => item.id === id);

  if (item) {
    set({ items: currentState.items.filter(item => item.id !== id) });
  } else {
  }

  // Delegar al módulo de historial
  setTimeout(() => {
    historyStore.saveToHistory(get(), 'removeItem', {
      productName: item?.name || 'Producto desconocido',
      quantity: item?.quantity || 0,
    });
  }, 0);

  // Auto-guardar cambios
  debouncedSave();
};

/**
 * Limpia el carrito localmente
 * @param {Function} set - Función set de Zustand
 * @param {Function} get - Función get de Zustand
 * @param {Object} couponsStore - Store de cupones
 * @param {Object} historyStore - Store de historial
 * @param {Function} debouncedSave - Función de guardado automático
 */
export const clearCartLocal = (set, get, historyStore, debouncedSave) => {
  const currentState = get();
  const itemCount = currentState.items.length;

  set({
    items: [],
  });

  // Delegar al módulo de historial
  setTimeout(() => {
    historyStore.saveToHistory(get(), 'clearCart', {
      itemCount: itemCount,
    });
  }, 0);

  // Auto-guardar cambios
  debouncedSave();
};

/**
 * Establece items en el carrito (para operaciones de restauración)
 * @param {Array} items - Items a establecer
 * @param {Function} set - Función set de Zustand
 * @param {Function} debouncedSave - Función de guardado automático
 */
export const setItemsLocal = (items, set, debouncedSave) => {
  set({ items });
  debouncedSave();
};
