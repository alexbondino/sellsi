import { useCallback } from 'react'

export const useProductFilters = (filtros, updateFiltros) => {
  const handlePrecioChange = useCallback(
    (campo, valor) => {
      updateFiltros({ [campo]: valor })
    },
    [updateFiltros]
  )
  // COMMENTED OUT: Commission functionality removed
  // const handleComisionChange = useCallback(
  //   (campo, valor) => {
  //     updateFiltros({ [campo]: valor })
  //   },
  //   [updateFiltros]
  // )

  // COMMENTED OUT: Sale Type functionality removed
  // const handleTipoVentaChange = useCallback((tipo, checked) => {
  //   updateFiltros({
  //     tiposVenta: checked
  //       ? [...filtros.tiposVenta, tipo]
  //       : filtros.tiposVenta.filter(t => t !== tipo)
  //   })
  // }, [filtros.tiposVenta, updateFiltros])

  const handleStockChange = useCallback(
    (checked) => {
      updateFiltros({ soloConStock: checked })
    },
    [updateFiltros]
  )
  const handleRatingChange = (newRating) => {
    updateFiltros({ ratingMin: newRating })
  }
  return {
    handlePrecioChange,
    // handleComisionChange, // COMMENTED OUT: Commission functionality removed
    // handleTipoVentaChange, // COMMENTED OUT: Sale Type functionality removed
    handleStockChange,
    handleRatingChange,
  }
}
