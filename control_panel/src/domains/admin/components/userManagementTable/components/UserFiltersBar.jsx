import React, { memo } from 'react';
import { Paper, Grid, FormControl, InputLabel, Select, MenuItem, Box, TextField, Typography, Button } from '@mui/material';
import { Search as SearchIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { USER_FILTERS } from '../constants/userConstants';

const UserFiltersBar = memo(function UserFiltersBar({
  filters,
  handleFilterChange,
  searchTerm,
  debouncedSearchTerm,
  initialLoadComplete,
  filteredCount,
  totalCount,
  selectedCount,
  onDeleteMultiple,
  preventSearchFocus,
  menuPropsEstado,
  menuPropsTipo,
  sxEstado,
  sxTipo,
  filtersSectionSx
}) {
  return (
    <Paper sx={filtersSectionSx}>
      <Grid container spacing={3} alignItems="center">
        <Grid item xs={12} sm={6} md={3}>
          <FormControl fullWidth size="medium" sx={sxEstado}>
            <InputLabel>Estado</InputLabel>
            <Select value={filters.status} onChange={(e) => handleFilterChange('status', e.target.value)} label="Estado" MenuProps={menuPropsEstado}>
              {USER_FILTERS.map(filter => (
                <MenuItem key={filter.value} value={filter.value}>
                  {filter.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <FormControl fullWidth size="medium" sx={sxTipo}>
            <InputLabel>Tipo de Usuario</InputLabel>
            <Select value={filters.userType} onChange={(e) => handleFilterChange('userType', e.target.value)} label="Tipo de Usuario" MenuProps={menuPropsTipo}>
              <MenuItem value="all">Todos</MenuItem>
              <MenuItem value="suppliers">Solo Proveedores</MenuItem>
              <MenuItem value="buyers">Solo Compradores</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={12} md={6}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <TextField
              fullWidth
              size="medium"
              placeholder="Buscar por nombre, email o ID..."
              value={searchTerm}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              InputProps={{ startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} /> }}
              sx={{ minWidth: 320, maxWidth: 600, width: '100%' }}
              autoComplete="off"
              onFocus={(e) => { if (preventSearchFocus) e.target.blur(); }}
            />
            <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'nowrap', minWidth: 120 }}>
              {!initialLoadComplete ? 'Cargando...' : searchTerm && debouncedSearchTerm !== searchTerm ? 'Filtrando...' : `Mostrando ${filteredCount} de ${totalCount}`}
            </Typography>
          </Box>
        </Grid>
        {selectedCount > 0 && (
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
              <Button variant="contained" color="error" startIcon={<DeleteIcon />} onClick={onDeleteMultiple}>
                Eliminar {selectedCount} usuario{selectedCount !== 1 ? 's' : ''} seleccionado{selectedCount !== 1 ? 's' : ''}
              </Button>
            </Box>
          </Grid>
        )}
      </Grid>
    </Paper>
  );
});

export default UserFiltersBar;
