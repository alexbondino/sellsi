// ============================================================================
// CONSTANTES DEL MARKETPLACE - SELLSI
// ============================================================================

/**
 * ⚠️ MIGRACIÓN COMPLETADA
 * 
 * Las constantes de shipping han sido eliminadas ya que eran mocks antiguos.
 * El sistema ahora calcula los precios de envío dinámicamente.
 */

// ============================================================================
// CONSTANTES ESPECÍFICAS DEL MARKETPLACE
// ============================================================================

// Filtros iniciales del marketplace
export const INITIAL_FILTERS = {
  precioMin: '',
  precioMax: '',
  soloConStock: false,
  ratingMin: 0,
  negociable: 'todos', // Filtro de negociable ('todos', 'si', 'no')
}

export const PRICE_RANGE = [0, 1000000]
export const RATING_RANGE = [0, 5]

// Datos de prueba para el carrito
export const SAMPLE_ITEMS = []
