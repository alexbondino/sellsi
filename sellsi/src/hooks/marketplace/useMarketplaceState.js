import { useState, useMemo } from 'react'
// ✅ CORREGIR RUTA: desde hooks/marketplace hacia data/marketplace
import { PRODUCTOS, CATEGORIAS } from '../../data/marketplace/products' // ✅ 2 niveles hacia arriba
import { INITIAL_FILTERS } from '../../utils/marketplace/constants' // ✅ 2 niveles hacia arriba

export const useMarketplaceState = () => {
  const [seccionActiva, setSeccionActiva] = useState('todos')
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(['Todas'])
  const [filtroVisible, setFiltroVisible] = useState(true) // ✅ CAMBIAR a true por defecto
  const [busqueda, setBusqueda] = useState('')
  const [filtros, setFiltros] = useState(INITIAL_FILTERS)
  const [precioRango, setPrecioRango] = useState([0, 1000000])
  const [comisionRango, setComisionRango] = useState([0, 30])
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
        return false

      // Filtrar por precio
      if (filtros.precioMin && producto.precio < filtros.precioMin) return false
      if (filtros.precioMax && producto.precio > filtros.precioMax) return false

      // Filtrar por comisión
      if (filtros.comisionMin && producto.comision < filtros.comisionMin)
        return false
      if (filtros.comisionMax && producto.comision > filtros.comisionMax)
        return false

      // Filtrar por tipo de venta
      if (
        filtros.tiposVenta.length > 0 &&
        !filtros.tiposVenta.includes(producto.tipoVenta)
      )
        return false

      // Filtrar por stock
      if (filtros.soloConStock && producto.stock === 0) return false

      // Filtrar por rating
      if (filtros.ratingMin && producto.rating < filtros.ratingMin) return false

      return true
    })
  }, [seccionActiva, busqueda, categoriaSeleccionada, filtros])

  const hayFiltrosActivos = useMemo(() => {
    return Object.values(filtros).some((v) =>
      Array.isArray(v) ? v.length > 0 : v !== '' && v !== false && v !== 0
    )
  }, [filtros])

  const handleTipoVentaChange = (tipo) => {
    setFiltros((prev) => ({
      ...prev,
      tiposVenta: prev.tiposVenta.includes(tipo)
        ? prev.tiposVenta.filter((t) => t !== tipo)
        : [...prev.tiposVenta, tipo],
    }))
  }

  const resetFiltros = () => {
    setFiltros(INITIAL_FILTERS)
    setPrecioRango([0, 1000000])
    setComisionRango([0, 30])
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
    comisionRango,
    categorias: CATEGORIAS, // ✅ USAR CATEGORIAS importadas

    // Setters
    setSeccionActiva,
    setBusqueda,
    setCategoriaSeleccionada,
    setFiltroVisible,
    setFiltroModalOpen,
    setPrecioRango,
    setComisionRango,

    // Actions
    updateFiltros,
    resetFiltros,
    toggleCategoria,
    handleTipoVentaChange,
  }
}
