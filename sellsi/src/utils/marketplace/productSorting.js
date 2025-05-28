import { SORT_OPTIONS } from './constants'

export const sortProducts = (productos, ordenamiento) => {
  const sortedProducts = [...productos]

  switch (ordenamiento) {
    case SORT_OPTIONS.MENOR_PRECIO:
      return sortedProducts.sort((a, b) => a.precio - b.precio)
    
    case SORT_OPTIONS.MAYOR_PRECIO:
      return sortedProducts.sort((a, b) => b.precio - a.precio)
    
    case SORT_OPTIONS.MAYOR_DESCUENTO:
      return sortedProducts.sort((a, b) => b.descuento - a.descuento)
    
    case SORT_OPTIONS.MEJOR_RATING:
      return sortedProducts.sort((a, b) => b.rating - a.rating)
    
    case SORT_OPTIONS.MAS_VENDIDOS:
      return sortedProducts.sort((a, b) => b.ventas - a.ventas)
    
    default:
      return sortedProducts
  }
}