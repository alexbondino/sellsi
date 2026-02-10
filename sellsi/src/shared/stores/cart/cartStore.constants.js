/**
 * ============================================================================
 * CART STORE CONSTANTS - CONFIGURACIONES CENTRALIZADAS
 * ============================================================================
 *
 * Todas las constantes y configuraciones del carrito centralizadas.
 * Extraídas del archivo cartStore.js original para mejor mantenibilidad.
 */

// Configuración de versión
export const CART_VERSION = '3.0'
export const PERSIST_VERSION = 3

// Configuración de almacenamiento
export const STORAGE_KEY = 'sellsi-cart-v3-refactored'

// Configuración del carrito
export const CART_CONFIG = {
  MAX_ITEMS: 50,
  MAX_QUANTITY_PER_ITEM: 15000,
  MIN_QUANTITY: 1,
  DEFAULT_STOCK: 15000,
  AUTO_SAVE_DELAY: 50, // ms para debounced save
}

// Configuración de persistencia
export const PERSIST_CONFIG = {
  name: STORAGE_KEY,
  version: PERSIST_VERSION,
  partialize: (state) => ({
    items: state.items,
    productFinancing: state.productFinancing || {}, // ✅ Persistir configuración de financiamiento
    lastModified: Date.now(),
    version: CART_VERSION,
  }),
  onRehydrateStorage: (state) => {
    return (state, error) => {
      if (error) {
        // Error de hidratación manejado silenciosamente
      } else {
        // Hidratación exitosa
      }
    }
  },
}
