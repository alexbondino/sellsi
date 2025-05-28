import { SECTIONS } from './constants'

export const filterProductsBySection = (productos, seccionActiva) => {
  return productos.filter((producto) => {
    switch (seccionActiva) {
      case SECTIONS.NUEVOS:
        return producto.tipo === 'nuevo'
      case SECTIONS.OFERTAS:
        return producto.tipo === 'oferta'
      case SECTIONS.TOP_VENTAS:
        return producto.tipo === 'top'
      default:
        return true
    }
  })
}

export const filterProductsBySearch = (productos, busqueda) => {
  if (!busqueda) return productos
  
  return productos.filter((producto) =>
    producto.nombre.toLowerCase().includes(busqueda.toLowerCase())
  )
}

export const filterProductsByCategory = (productos, categoriaSeleccionada) => {
  if (
    categoriaSeleccionada.length === 0 ||
    categoriaSeleccionada.includes('Todas')
  ) {
    return productos
  }
  
  return productos.filter((producto) =>
    categoriaSeleccionada.includes(producto.categoria)
  )
}

export const filterProductsByPrice = (productos, filtros) => {
  return productos.filter((producto) => {
    if (filtros.precioMin && producto.precio < filtros.precioMin) return false
    if (filtros.precioMax && producto.precio > filtros.precioMax) return false
    return true
  })
}

export const filterProductsByCommission = (productos, filtros) => {
  return productos.filter((producto) => {
    if (filtros.comisionMin && producto.comision < filtros.comisionMin) return false
    if (filtros.comisionMax && producto.comision > filtros.comisionMax) return false
    return true
  })
}

export const filterProductsBySaleType = (productos, filtros) => {
  if (filtros.tiposVenta.length === 0) return productos
  
  return productos.filter((producto) =>
    filtros.tiposVenta.includes(producto.tipoVenta)
  )
}

export const filterProductsByStock = (productos, soloConStock) => {
  if (!soloConStock) return productos
  return productos.filter((producto) => producto.stock > 0)
}

export const filterProductsByRating = (productos, ratingMin) => {
  if (!ratingMin) return productos
  return productos.filter((producto) => producto.rating >= ratingMin)
}

export const applyAllFilters = (productos, filtros, busqueda, categoriaSeleccionada, seccionActiva) => {
  let filtered = productos

  // Aplicar filtros en secuencia
  filtered = filterProductsBySection(filtered, seccionActiva)
  filtered = filterProductsBySearch(filtered, busqueda)
  filtered = filterProductsByCategory(filtered, categoriaSeleccionada)
  filtered = filterProductsByPrice(filtered, filtros)
  filtered = filterProductsByCommission(filtered, filtros)
  filtered = filterProductsBySaleType(filtered, filtros)
  filtered = filterProductsByStock(filtered, filtros.soloConStock)
  filtered = filterProductsByRating(filtered, filtros.ratingMin)

  return filtered
}