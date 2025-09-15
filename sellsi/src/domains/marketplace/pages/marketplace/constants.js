export const SECTIONS = {
  TODOS: 'todos',
  NUEVOS: 'nuevos',
  OFERTAS: 'ofertas',
  TOP_VENTAS: 'topVentas',
}

export const SECTION_LABELS = {
  [SECTIONS.TODOS]: '🛍️ Todos los Productos',
  [SECTIONS.NUEVOS]: '✨ Nuevos Productos',
  [SECTIONS.OFERTAS]: '🔥 Ofertas Destacadas',
  [SECTIONS.TOP_VENTAS]: '⭐ Top Ventas',
}

export const SORT_OPTIONS = {
  RELEVANCIA: 'relevancia',
  MENOR_PRECIO: 'menor-precio',
  MAYOR_PRECIO: 'mayor-precio',
  MAYOR_DESCUENTO: 'mayor-descuento',
  MEJOR_RATING: 'mejor-rating',
  MAS_VENDIDOS: 'mas-vendidos',
}

export const INITIAL_FILTERS = {
  precioMin: '',
  precioMax: '',
  soloConStock: false,
  shippingRegions: [],
  ratingMin: 0,
  negociable: 'todos', // ✅ AGREGAR: Filtro de negociable ('todos', 'si', 'no')
}

export const PRICE_RANGE = [0, 1000000]
export const RATING_RANGE = [0, 5]
