import { useState, useMemo } from 'react' // ✅ Asegurar que useState está importado

// ✅ Definir las opciones de ordenamiento
const sortOptions = [
  { value: 'relevancia', label: 'Más relevantes' },
  { value: 'menor-precio', label: 'Precio: Menor a Mayor' },
  { value: 'mayor-precio', label: 'Precio: Mayor a Menor' },
  { value: 'mayor-descuento', label: 'Mayor Descuento' },
  { value: 'mas-vendidos', label: 'Más Vendidos' },
  { value: 'mejor-rating', label: 'Mejor Rating' },
]

export const useProductSorting = (productos = []) => {
  const [ordenamiento, setOrdenamiento] = useState('relevancia') // ✅ Inicializar estado

  const productosOrdenados = useMemo(() => {
    if (!Array.isArray(productos)) {
      console.warn('useProductSorting: productos no es un array', productos)
      return []
    }

    const productosArray = [...productos] // Crear una copia para no mutar el original

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
      case 'relevancia':
      default:
        // Podrías tener una lógica de relevancia aquí o simplemente devolver el array
        return productosArray
    }
  }, [productos, ordenamiento])

  const getSortLabel = (sortValue) => {
    const option = sortOptions.find((opt) => opt.value === sortValue)
    return option ? option.label : 'Más relevantes'
  }

  return {
    ordenamiento,
    setOrdenamiento,
    productosOrdenados,
    sortOptions, // ✅ Exportar las opciones
    getSortLabel,
  }
}
