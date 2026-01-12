/**
 * ============================================================================
 * FINANCING FILTERS (SHARED)
 * ============================================================================
 * 
 * Componente de filtros por categoría para financiamientos.
 * Reutilizable entre Supplier y Buyer.
 * Incluye versión desktop (Select) y mobile (MobileFilterAccordion).
 */

import React from 'react';
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import MobileFilterAccordion from '../mobile/MobileFilterAccordion';

const FinancingFilters = ({
  currentFilter,
  onFilterChange,
  filterOptions,
  isMobile = false,
}) => {
  if (isMobile) {
    return (
      <MobileFilterAccordion
        currentFilter={currentFilter}
        onFilterChange={onFilterChange}
        filterOptions={filterOptions}
        label="Estado"
      />
    );
  }

  // Desktop filters
  return (
    <Box sx={{ display: 'flex', gap: 2, p: 2, alignItems: 'center' }}>
      <Typography fontWeight={600}>Filtrar por categoría:</Typography>
      <FormControl size="small" sx={{ minWidth: 280 }}>
        <InputLabel id="financing-filter-label">Categoría</InputLabel>
        <Select
          labelId="financing-filter-label"
          value={currentFilter}
          label="Categoría"
          onChange={(e) => onFilterChange(e.target.value)}
          MenuProps={{ disableScrollLock: true }}
        >
          {filterOptions.map(option => (
            <MenuItem key={option.value} value={option.value}>
              {option.label} ({option.count})
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
};

export default FinancingFilters;
