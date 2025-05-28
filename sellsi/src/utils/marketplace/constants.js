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

export const SALE_TYPES = {
  DIRECTA: 'directa',
  INDIRECTA: 'indirecta',
  TODOS: 'todos',
}

export const SALE_TYPE_MESSAGES = {
  [SALE_TYPES.DIRECTA]:
    'El productor vende directamente al cliente final, sin usar intermediarios como distribuidores o minoristas.',
  [SALE_TYPES.INDIRECTA]:
    'El producto se comercializa a través de intermediarios antes de llegar al cliente final.',
  default: 'Información sobre el tipo de venta no disponible.',
}

export const INITIAL_FILTERS = {
  precioMin: '',
  precioMax: '',
  comisionMin: '',
  comisionMax: '',
  tiposVenta: [],
  soloConStock: false,
  ratingMin: 0,
}

export const PRICE_RANGE = [0, 1000000]
export const COMMISSION_RANGE = [0, 30]
export const RATING_RANGE = [0, 5]
