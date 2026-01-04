import { useState, useMemo, useCallback } from 'react';

// ✅ OPTIMIZACIÓN: Memoizar opciones de ordenamiento estáticas
const sortOptions = [
  { value: 'relevancia', label: 'Más relevantes' },
  { value: 'menor-precio', label: 'Precio: Menor a Mayor' },
  { value: 'mayor-precio', label: 'Precio: Mayor a Menor' },
  // { value: 'mayor-descuento', label: 'Mayor Descuento' },
  // { value: 'mas-vendidos', label: 'Más Vendidos' },
  // { value: 'mejor-rating', label: 'Mejor Rating' },
];

export const useProductSorting = (productos = []) => {
  const [ordenamiento, setOrdenamiento] = useState('relevancia');

  // ✅ OPTIMIZACIÓN: Memoizar función de sorting que es costosa
  const productosOrdenados = useMemo(() => {
    if (!Array.isArray(productos) || productos.length === 0) {
      return [];
    }

    const productosArray = [...productos]; // Crear copia para ordenar

    switch (ordenamiento) {
      case 'relevancia':
        // ✅ NUEVO: Ordenamiento por daily_rank (ranking diario aleatorio)
        // Si no hay daily_rank, usar fallback: verificados primero + alfabético
        return productosArray.sort((a, b) => {
          // Si ambos tienen daily_rank, ordenar por él (ASC = menor rank primero)
          const aRank = a.daily_rank;
          const bRank = b.daily_rank;

          if (aRank != null && bRank != null) {
            return aRank - bRank;
          }

          // Fallback: Si alguno no tiene rank, ponerlo al final
          if (aRank != null && bRank == null) return -1;
          if (aRank == null && bRank != null) return 1;

          // Si ninguno tiene rank, usar criterio anterior (verificados + alfabético)
          const aVerificado =
            a.verified || a.proveedorVerificado || a.supplierVerified || false;
          const bVerificado =
            b.verified || b.proveedorVerificado || b.supplierVerified || false;

          if (aVerificado !== bVerificado) {
            return bVerificado ? 1 : -1; // Verificados primero
          }

          const aNombre = (
            a.nombre ||
            a.name ||
            a.user_nm ||
            a.proveedor ||
            ''
          ).toLowerCase();
          const bNombre = (
            b.nombre ||
            b.name ||
            b.user_nm ||
            b.proveedor ||
            ''
          ).toLowerCase();
          return aNombre.localeCompare(bNombre, 'es', { sensitivity: 'base' });
        });
      case 'menor-precio':
        // ✅ FIX: Usar minPrice (precio mínimo de priceTiers) para ordenar de menor a mayor
        return productosArray.sort((a, b) => {
          const aPrice = a.minPrice ?? a.precio ?? 0;
          const bPrice = b.minPrice ?? b.precio ?? 0;
          return aPrice - bPrice;
        });
      case 'mayor-precio':
        // ✅ FIX: Usar maxPrice (precio máximo de priceTiers) para ordenar de mayor a menor
        return productosArray.sort((a, b) => {
          const aPrice = a.maxPrice ?? a.precio ?? 0;
          const bPrice = b.maxPrice ?? b.precio ?? 0;
          return bPrice - aPrice;
        });
      case 'mayor-descuento':
        return productosArray.sort(
          (a, b) => (b.descuento || 0) - (a.descuento || 0)
        );
      case 'mas-vendidos':
        return productosArray.sort((a, b) => (b.ventas || 0) - (a.ventas || 0));
      case 'mejor-rating':
        return productosArray.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      default:
        return productosArray;
    }
  }, [productos, ordenamiento]);

  // ✅ OPTIMIZACIÓN: Memoizar función getSortLabel
  const getSortLabel = useCallback(sortValue => {
    const option = sortOptions.find(opt => opt.value === sortValue);
    return option ? option.label : 'Más relevantes';
  }, []);

  return {
    ordenamiento,
    setOrdenamiento,
    productosOrdenados,
    sortOptions,
    getSortLabel,
  };
};
