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
  const { products, loading, error, getPriceTiers, registerProductNode } = useProducts()
  
  // 🔍 DEBUG: Log cuando products cambia
  if (products?.length > 0) {
    const sample = products.slice(0, 2).map(p => ({
      id: String(p.id).substring(0, 8),
      minPrice: p.minPrice,
      maxPrice: p.maxPrice,
      tiersStatus: p.tiersStatus
    }))
    console.warn('🔍 [useMarketplaceState] products recibidos:', products.length, 'sample:', sample)
  }
  
  const [seccionActiva, setSeccionActiva] = useState('todos')
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('Todas')
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
        categoriaSeleccionada &&
        categoriaSeleccionada !== 'Todas' &&
        categoriaSeleccionada !== producto.categoria
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

      // Filtrar por regiones de despacho (shippingRegions) - single select
      if (filtros.shippingRegions) {
        const shippingRegions = producto.shippingRegions || producto.delivery_regions || producto.shipping_regions || producto.product_delivery_regions || []

        // Verificar si la región seleccionada coincide
        const matchesRegion = shippingRegions.some(r => {
          const value = r.region || r.value || r
          return value === filtros.shippingRegions
        })

        if (!matchesRegion) return false
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
    setCategoriaSeleccionada('Todas')
    setBusqueda('')
    // Asegurar que la vista vuelva a 'Todos los Productos'
    setSeccionActiva('todos')
  }, [])

  const updateFiltros = useCallback((newFilters) => {
    setFiltros((prev) => ({ ...prev, ...newFilters }))
  }, [])

  const toggleCategoria = useCallback((categoria) => {
    setCategoriaSeleccionada(categoria)
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
  getPriceTiers,
  registerProductNode,

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
