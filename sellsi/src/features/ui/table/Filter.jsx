import React from 'react';
import { FormControl, InputLabel, Select, MenuItem, Box } from '@mui/material';

const Filter = ({ statusFilter, setStatusFilter }) => {
  const filterOptions = [
    'Todos',
    'Pendiente',
    'Aceptado',
    'En Ruta',
    'Entregado',
    'Pagado',
    'Rechazado',
    'Atrasado',
  ];

  const handleFilterChange = event => {
    setStatusFilter(event.target.value);
  };

  return (
    <Box sx={{ minWidth: 200, mb: 3, width: '10%' }}>
      <FormControl fullWidth>
        <InputLabel id="status-filter-label">Filtrar por estado</InputLabel>
        <Select
          labelId="status-filter-label"
          id="status-filter-select"
          value={statusFilter}
          label="Filtrar por estado"
          onChange={handleFilterChange}
        >
          {filterOptions.map(option => (
            <MenuItem key={option} value={option}>
              {option}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
};

export default Filter;
