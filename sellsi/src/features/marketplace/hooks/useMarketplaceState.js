import { useState, useMemo } from 'react'
// ✅ CORREGIR RUTA: desde hooks/marketplace hacia data/marketplace
import { PRODUCTOS, CATEGORIAS } from '../products' // ✅ 2 niveles hacia arriba
import { INITIAL_FILTERS } from '../marketplace/constants' // ✅ 2 niveles hacia arriba

export const useMarketplaceState = () => {
  const [seccionActiva, setSeccionActiva] = useState('todos')
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(['Todas'])
  const [filtroVisible, setFiltroVisible] = useState(false) // ✅ CAMBIAR a false para permitir animaciones
  const [busqueda, setBusqueda] = useState('')
  const [filtros, setFiltros] = useState(INITIAL_FILTERS)
  const [precioRango, setPrecioRango] = useState([0, 1000000])
  const [filtroModalOpen, setFiltroModalOpen] = useState(false)
  // ✅ USAR PRODUCTOS importados (no productos)
  const productosFiltrados = useMemo(() => {
    return PRODUCTOS.filter((producto) => {
      // Filtrar por sección activa
      if (seccionActiva === 'nuevos' && producto.tipo !== 'nuevo') return false
      if (seccionActiva === 'ofertas' && producto.tipo !== 'oferta')
        return false
      if (seccionActiva === 'topVentas' && producto.tipo !== 'top') return false

      // Filtrar por búsqueda
      if (
        busqueda &&
        !producto.nombre.toLowerCase().includes(busqueda.toLowerCase())
      )
        return false

      // Filtrar por categoría
      if (
        categoriaSeleccionada.length > 0 &&
        !categoriaSeleccionada.includes('Todas') &&
        !categoriaSeleccionada.includes(producto.categoria)
      )
        return false // Filtrar por precio
      if (filtros.precioMin && producto.precio < filtros.precioMin) return false
      if (filtros.precioMax && producto.precio > filtros.precioMax) return false // Filtrar por stock
      if (filtros.soloConStock && producto.stock === 0) return false // Filtrar por rating
      if (filtros.ratingMin && producto.rating < filtros.ratingMin) return false

      // ✅ NUEVO: Filtrar por negociable
      if (filtros.negociable && filtros.negociable !== 'todos') {
        if (filtros.negociable === 'si' && !producto.negociable) return false
        if (filtros.negociable === 'no' && producto.negociable) return false
      }

      return true
    })
  }, [seccionActiva, busqueda, categoriaSeleccionada, filtros])
  const hayFiltrosActivos = useMemo(() => {
    return Object.entries(filtros).some(([key, value]) => {
      // ✅ EXCLUIR: "Todos los productos" no cuenta como filtro activo
      if (key === 'negociable' && value === 'todos') return false

      return Array.isArray(value)
        ? value.length > 0
        : value !== '' && value !== false && value !== 0
    })
  }, [filtros])
  const resetFiltros = () => {
    setFiltros(INITIAL_FILTERS)
    setPrecioRango([0, 1000000])
    setCategoriaSeleccionada(['Todas'])
    setBusqueda('')
  }

  const updateFiltros = (newFilters) => {
    setFiltros((prev) => ({ ...prev, ...newFilters }))
  }

  const toggleCategoria = (categoria) => {
    if (categoria === 'Todas') {
      setCategoriaSeleccionada(['Todas'])
    } else {
      setCategoriaSeleccionada((prev) => {
        const sinTodas = prev.filter((c) => c !== 'Todas')

        if (sinTodas.includes(categoria)) {
          const nuevaSeleccion = sinTodas.filter((c) => c !== categoria)
          return nuevaSeleccion.length === 0 ? ['Todas'] : nuevaSeleccion
        } else {
          return [...sinTodas, categoria]
        }
      })
    }
  }
  const totalProductos = productosFiltrados.length

  return {
    // Estados
    seccionActiva,
    busqueda,
    categoriaSeleccionada,
    filtros,
    filtroVisible,
    filtroModalOpen,
    productosFiltrados,
    hayFiltrosActivos,
    totalProductos,
    precioRango,
    categorias: CATEGORIAS, // ✅ USAR CATEGORIAS importadas

    // Setters
    setSeccionActiva,
    setBusqueda,
    setCategoriaSeleccionada,
    setFiltroVisible,
    setFiltroModalOpen,
    setPrecioRango,
    updateFiltros,
    resetFiltros,
    toggleCategoria,
  }
}
