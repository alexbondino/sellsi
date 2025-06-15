import React from 'react'
import { Box, Chip, Typography } from '@mui/material'

const AppliedFiltersDisplay = ({
  filtros,
  categoriaSeleccionada,
  busqueda,
  onRemoveFilter,
  styles,
}) => {
  const appliedFilters = []

  // Filtros de precio
  if (filtros.precioMin) {
    appliedFilters.push({
      type: 'precio',
      label: `Precio min: $${filtros.precioMin.toLocaleString()}`,
      onRemove: () => onRemoveFilter('precioMin'),
    })
  }

  if (filtros.precioMax) {
    appliedFilters.push({
      type: 'precio',
      label: `Precio max: $${filtros.precioMax.toLocaleString()}`,
      onRemove: () => onRemoveFilter('precioMax'),
    })
  }
  // Solo con stock
  if (filtros.soloConStock) {
    appliedFilters.push({
      type: 'stock',
      label: 'Solo con stock',
      onRemove: () => onRemoveFilter('soloConStock'),
    })
  }

  // ✅ NUEVO: Filtro negociable
  if (filtros.negociable && filtros.negociable !== 'todos') {
    const label =
      filtros.negociable === 'si' ? 'Solo negociables' : 'Solo no negociables'
    appliedFilters.push({
      type: 'negociable',
      label: label,
      onRemove: () => onRemoveFilter('negociable'),
    })
  }

  if (appliedFilters.length === 0) {
    return null
  }

  return (
    <Box sx={styles.filterGroup}>
      <Typography sx={styles.sectionTitle}>🏷️ Filtros aplicados</Typography>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {appliedFilters.map((filter, index) => (
          <Chip
            key={`${filter.type}-${index}`}
            label={filter.label}
            onDelete={filter.onRemove}
            size="small"
            variant="outlined"
            color="primary"
          />
        ))}
      </Box>
    </Box>
  )
}

export default React.memo(AppliedFiltersDisplay)
