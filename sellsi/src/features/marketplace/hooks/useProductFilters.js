import { useCallback } from 'react'

export const useProductFilters = (filtros, updateFiltros) => {
  const handlePrecioChange = useCallback(
    (campo, valor) => {
      updateFiltros({ [campo]: valor })
    },
    [updateFiltros]
  )

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
    handleStockChange,
    handleRatingChange,
  }
}
