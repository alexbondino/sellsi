import { useState, useMemo, useCallback, useEffect } from 'react'
import { INITIAL_FILTERS } from '../constants'
import { useProducts } from '../products/useProducts'

// ✅ HOOK PERSONALIZADO: Debouncing global para búsqueda
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

export const useMarketplaceState = () => {
  const { products, loading, error } = useProducts()
  const [seccionActiva, setSeccionActiva] = useState('todos')
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(['Todas'])
  const [filtroVisible, setFiltroVisible] = useState(false)
  const [busqueda, setBusqueda] = useState('')
  const [filtros, setFiltros] = useState(INITIAL_FILTERS)
  const [precioRango, setPrecioRango] = useState([0, 1000000])
  const [filtroModalOpen, setFiltroModalOpen] = useState(false)

  // ✅ DEBOUNCING GLOBAL: Aplicar debouncing a la búsqueda a nivel de estado global
  const debouncedBusqueda = useDebounce(busqueda, 300);

  // ✅ OPTIMIZACIÓN: Memoizar lógica de filtrado compleja
  const productosFiltrados = useMemo(() => {
    if (error || !Array.isArray(products)) return []
    
    return products.filter((producto) => {
      // Filtrar por sección activa
      if (seccionActiva === 'nuevos' && producto.tipo !== 'nuevo') return false
      if (seccionActiva === 'ofertas' && producto.tipo !== 'oferta') return false
      if (seccionActiva === 'topVentas' && producto.tipo !== 'top') return false

      // Filtrar por búsqueda (usando valor debounced)
      if (debouncedBusqueda) {
        const query = debouncedBusqueda.toLowerCase()
        const nombreMatch = producto.nombre?.toLowerCase().includes(query)
        // ✅ NUEVO: Permitir búsqueda por nombre de proveedor (proveedor | user_nm)
        const proveedorMatch = producto.proveedor?.toLowerCase().includes(query) || producto.user_nm?.toLowerCase().includes(query)
        if (!nombreMatch && !proveedorMatch) return false
      }

      // Filtrar por categoría
      if (
        categoriaSeleccionada.length > 0 &&
        !categoriaSeleccionada.includes('Todas') &&
        !categoriaSeleccionada.includes(producto.categoria)
      ) {
        return false
      }

      // Filtrar por precio
      if (filtros.precioMin && producto.precio < filtros.precioMin) return false
      if (filtros.precioMax && producto.precio > filtros.precioMax) return false
      
      // Filtrar por stock
      if (filtros.soloConStock && producto.stock === 0) return false
      
      // Filtrar por rating
      if (filtros.ratingMin && producto.rating < filtros.ratingMin) return false
      
      // Filtrar por negociable
      if (filtros.negociable && filtros.negociable !== 'todos') {
        if (filtros.negociable === 'si' && !producto.negociable) return false
        if (filtros.negociable === 'no' && producto.negociable) return false
      }

      return true
    })
  }, [
    products,
    seccionActiva,
    debouncedBusqueda,
    categoriaSeleccionada,
    filtros,
    error,
  ])

  // ✅ OPTIMIZACIÓN: Memoizar detección de filtros activos
  const hayFiltrosActivos = useMemo(() => {
    return Object.entries(filtros).some(([key, value]) => {
      // Excluir: "Todos los productos" no cuenta como filtro activo
      if (key === 'negociable' && value === 'todos') return false

      return Array.isArray(value)
        ? value.length > 0
        : value !== '' && value !== false && value !== 0
    })
  }, [filtros])

  // ✅ OPTIMIZACIÓN: Memoizar handlers que se pasan como callbacks
  const resetFiltros = useCallback(() => {
    setFiltros(INITIAL_FILTERS)
    setPrecioRango([0, 1000000])
    setCategoriaSeleccionada(['Todas'])
    setBusqueda('')
  }, [])

  const updateFiltros = useCallback((newFilters) => {
    setFiltros((prev) => ({ ...prev, ...newFilters }))
  }, [])

  const toggleCategoria = useCallback((categoria) => {
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
  }, [])

  // ✅ OPTIMIZACIÓN: Memoizar cálculo simple de total
  const totalProductos = useMemo(() => {
    return Array.isArray(productosFiltrados) ? productosFiltrados.length : 0
  }, [productosFiltrados])

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
    loading,
    error,

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
