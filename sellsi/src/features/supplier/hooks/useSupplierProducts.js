/**
 * ============================================================================
 * USE SUPPLIER PRODUCTS - HOOK PRINCIPAL COMBINADO
 * ============================================================================
 *
 * Hook principal que combina los stores especializados y proporciona
 * una interfaz unificada para la gestión de productos del proveedor.
 */

import { useMemo } from 'react'
import useSupplierProductsBase from './useSupplierProductsBase'
import useSupplierProductFilters from './useSupplierProductFilters'
import { isProductActive } from '../../../utils/productActiveStatus'

/**
 * Hook principal para gestión de productos del proveedor
 * Combina funcionalidad de CRUD y filtros
 */
export const useSupplierProducts = () => {
  // Store base de productos
  const {
    products,
    loading,
    error,
    operationStates,
    loadProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    getProductById,
    clearError,
    reset: resetProducts,
  } = useSupplierProductsBase()

  // Store de filtros
  const {
    searchTerm,
    categoryFilter,
    sortBy,
    sortOrder,
    statusFilter,
    stockFilter,
    priceRange,
    dateRange,
    activeFiltersCount,
    setSearchTerm,
    setCategoryFilter,
    setStatusFilter,
    setStockFilter,
    setPriceRange,
    setDateRange,
    setSorting,
    applyFilters,
    clearFilters,
    getFiltersSummary,
    setPresetFilter,
    reset: resetFilters,
  } = useSupplierProductFilters()

  // Productos filtrados (calculado)
  const filteredProducts = useMemo(() => {
    return applyFilters(products)
  }, [
    products,
    searchTerm,
    categoryFilter,
    statusFilter,
    stockFilter,
    priceRange,
    dateRange,
    sortBy,
    sortOrder,
  ])

  // Estadísticas (calculadas)
  const stats = useMemo(() => {
    const total = products.length
    // ✅ USAR NUEVA LÓGICA: productos realmente activos (stock >= compra mínima)
    const active = products.filter(isProductActive).length
    const inStock = products.filter((p) => (p.productqty || 0) > 0).length
    const lowStock = products.filter((p) => {
      const stock = p.productqty || 0
      return stock > 0 && stock <= 10
    }).length
    const outOfStock = products.filter((p) => (p.productqty || 0) === 0).length
    const totalValue = products.reduce(
      (sum, p) => sum + (p.price || 0) * (p.productqty || 0),
      0
    )

    return {
      total,
      active,
      inactive: total - active,
      inStock,
      lowStock,
      outOfStock,
      totalValue,
      averagePrice:
        total > 0
          ? products.reduce((sum, p) => sum + (p.price || 0), 0) / total
          : 0,
    }
  }, [products])

  // Productos para UI (con formato mejorado)
  const uiProducts = useMemo(() => {
    return filteredProducts.map((product) => {
      // Calcular datos de tramos de precio si existen
      let tramoMin = null,
        tramoMax = null,
        tramoPrecioMin = null,
        tramoPrecioMax = null

      if (product.priceTiers?.length > 0) {
        const sorted = [...product.priceTiers].sort(
          (a, b) => a.min_quantity - b.min_quantity
        )
        tramoMin = sorted[0]?.min_quantity

        const maxQuantities = sorted
          .map((t) => t.max_quantity)
          .filter((x) => x != null)
        tramoMax =
          maxQuantities.length > 0
            ? Math.max(...maxQuantities)
            : sorted[sorted.length - 1]?.min_quantity

        tramoPrecioMin = Math.min(...sorted.map((t) => Number(t.price)))
        tramoPrecioMax = Math.max(...sorted.map((t) => Number(t.price)))
      }

      // Obtener imagen principal y thumbnail
      let imagenPrincipal = product.image_url
      let thumbnailUrl = null
      let imagenes = []

      if (product.images?.length > 0) {
        imagenes = product.images.map((img) => img.image_url)
        const principal = product.images.find((img) => img.is_primary)
        imagenPrincipal = principal ? principal.image_url : imagenes[0]
        
        // ✅ NUEVO: Obtener thumbnail_url de la imagen principal
        if (principal && principal.thumbnail_url) {
          thumbnailUrl = principal.thumbnail_url
        } else if (product.images[0]?.thumbnail_url) {
          thumbnailUrl = product.images[0].thumbnail_url
        }
      }

      return {
        id: product.productid,
        productid: product.productid,
        supplier_id: product.supplier_id,
        nombre: product.productnm,
        imagen: imagenPrincipal,
        thumbnail_url: thumbnailUrl, // ✅ NUEVO: Agregar thumbnail_url
        imagenes,
        precio: product.price,
        categoria: product.category,
        stock: product.productqty,
        descripcion: product.description,
        compraMinima: product.minimum_purchase,
        negociable: product.negotiable,
        tipo: product.product_type,
        activo: product.is_active,
        createdAt: product.createddt,
        updatedAt: product.updateddt,
        priceTiers: product.priceTiers || [],
        tramoMin,
        tramoMax,
        tramoPrecioMin,
        tramoPrecioMax,
        // ✅ NUEVO: Incluir regiones de despacho
        delivery_regions: product.delivery_regions || [],
      }
    })
  }, [filteredProducts])

  // Reset completo
  const reset = () => {
    resetProducts()
    resetFilters()
  }

  return {
    // Datos
    products,
    filteredProducts,
    uiProducts,
    stats,

    // Estados
    loading,
    error,
    operationStates,

    // Filtros
    searchTerm,
    categoryFilter,
    sortBy,
    sortOrder,
    statusFilter,
    stockFilter,
    priceRange,
    dateRange,
    activeFiltersCount,

    // Acciones CRUD
    loadProducts,
    createProduct,
    updateProduct,
    deleteProduct,

    // Acciones de filtros
    setSearchTerm,
    setCategoryFilter,
    setStatusFilter,
    setStockFilter,
    setPriceRange,
    setDateRange,
    setSorting,
    clearFilters,
    setPresetFilter,

    // Utilidades
    getProductById,
    getFiltersSummary,
    clearError,
    reset,
  }
}
