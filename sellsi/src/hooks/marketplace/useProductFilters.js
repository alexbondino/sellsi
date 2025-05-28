import { useCallback } from 'react'

export const useProductFilters = (filtros, updateFiltros) => {
  const handlePrecioChange = useCallback((campo, valor) => {
    updateFiltros({ [campo]: valor })
  }, [updateFiltros])

  const handleComisionChange = useCallback((campo, valor) => {
    updateFiltros({ [campo]: valor })
  }, [updateFiltros])

  const handleTipoVentaChange = useCallback((tipo, checked) => {
    updateFiltros({
      tiposVenta: checked
        ? [...filtros.tiposVenta, tipo]
        : filtros.tiposVenta.filter(t => t !== tipo)
    })
  }, [filtros.tiposVenta, updateFiltros])

  const handleStockChange = useCallback((checked) => {
    updateFiltros({ soloConStock: checked })
  }, [updateFiltros])

  const handleRatingChange = (newRating) => {
    updateFiltros({ ratingMin: newRating })
  }

  return {
    handlePrecioChange,
    handleComisionChange,
    handleTipoVentaChange,
    handleStockChange,
    handleRatingChange,
  }
}