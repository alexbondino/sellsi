import { useState, useMemo, useCallback } from 'react'

// ✅ OPTIMIZACIÓN: Memoizar opciones de ordenamiento estáticas
const sortOptions = [
  { value: 'relevancia', label: 'Más relevantes' },
  { value: 'menor-precio', label: 'Precio: Menor a Mayor' },
  { value: 'mayor-precio', label: 'Precio: Mayor a Menor' },
  { value: 'mayor-descuento', label: 'Mayor Descuento' },
  { value: 'mas-vendidos', label: 'Más Vendidos' },
  { value: 'mejor-rating', label: 'Mejor Rating' },
]

export const useProductSorting = (productos = []) => {
  const [ordenamiento, setOrdenamiento] = useState('relevancia')

  // ✅ OPTIMIZACIÓN: Memoizar función de sorting que es costosa
  const productosOrdenados = useMemo(() => {
    if (!Array.isArray(productos) || productos.length === 0) {
      return []
    }

    // ✅ OPTIMIZACIÓN: Solo crear copia si necesitamos ordenar
    if (ordenamiento === 'relevancia') {
      return productos // No necesitamos ordenar si es relevancia
    }

    const productosArray = [...productos] // Crear copia para ordenar

    switch (ordenamiento) {
      case 'menor-precio':
        return productosArray.sort((a, b) => (a.precio || 0) - (b.precio || 0))
      case 'mayor-precio':
        return productosArray.sort((a, b) => (b.precio || 0) - (a.precio || 0))
      case 'mayor-descuento':
        return productosArray.sort(
          (a, b) => (b.descuento || 0) - (a.descuento || 0)
        )
      case 'mas-vendidos':
        return productosArray.sort((a, b) => (b.ventas || 0) - (a.ventas || 0))
      case 'mejor-rating':
        return productosArray.sort((a, b) => (b.rating || 0) - (a.rating || 0))
      default:
        return productosArray
    }
  }, [productos, ordenamiento])

  // ✅ OPTIMIZACIÓN: Memoizar función getSortLabel
  const getSortLabel = useCallback((sortValue) => {
    const option = sortOptions.find((opt) => opt.value === sortValue)
    return option ? option.label : 'Más relevantes'
  }, [])

  return {
    ordenamiento,
    setOrdenamiento,
    productosOrdenados,
    sortOptions,
    getSortLabel,
  }
}
