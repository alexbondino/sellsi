import React from 'react'
import { Box, Chip, Typography } from '@mui/material'

const AppliedFiltersDisplay = ({ 
  filtros, 
  categoriaSeleccionada, 
  busqueda,
  onRemoveFilter,
  styles 
}) => {
  const appliedFilters = []

  // Filtros de precio
  if (filtros.precioMin) {
    appliedFilters.push({
      type: 'precio',
      label: `Precio min: $${filtros.precioMin.toLocaleString()}`,
      onRemove: () => onRemoveFilter('precioMin')
    })
  }

  if (filtros.precioMax) {
    appliedFilters.push({
      type: 'precio',
      label: `Precio max: $${filtros.precioMax.toLocaleString()}`,
      onRemove: () => onRemoveFilter('precioMax')
    })
  }

  // Filtros de comisión
  if (filtros.comisionMin) {
    appliedFilters.push({
      type: 'comision',
      label: `Comisión min: ${filtros.comisionMin}%`,
      onRemove: () => onRemoveFilter('comisionMin')
    })
  }

  if (filtros.comisionMax) {
    appliedFilters.push({
      type: 'comision',
      label: `Comisión max: ${filtros.comisionMax}%`,
      onRemove: () => onRemoveFilter('comisionMax')
    })
  }

  // Rating
  if (filtros.ratingMin > 0) {
    appliedFilters.push({
      type: 'rating',
      label: `Rating: ${filtros.ratingMin}+ ⭐`,
      onRemove: () => onRemoveFilter('ratingMin')
    })
  }

  // Tipos de venta
  filtros.tiposVenta.forEach(tipo => {
    appliedFilters.push({
      type: 'tipoVenta',
      label: tipo === 'directa' ? 'Venta Directa' : 'Venta Indirecta',
      onRemove: () => onRemoveFilter('tipoVenta', tipo)
    })
  })

  // Solo con stock
  if (filtros.soloConStock) {
    appliedFilters.push({
      type: 'stock',
      label: 'Solo con stock',
      onRemove: () => onRemoveFilter('soloConStock')
    })
  }

  if (appliedFilters.length === 0) {
    return null
  }

  return (
    <Box sx={styles.filterGroup}>
      <Typography sx={styles.sectionTitle}>
        🏷️ Filtros aplicados
      </Typography>
      
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

export default AppliedFiltersDisplay