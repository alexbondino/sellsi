import React from 'react';
import { FormControl, InputLabel, Select, MenuItem, Box } from '@mui/material';

const Filter = ({ statusFilter, setStatusFilter }) => {
  const filterOptions = [
    'Todos',
    'Pendiente',
    'Aceptado',
  'En Transito',
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
          // Evita que el dropdown provoque scroll al abrirse o al hacer click
          MenuProps={{
            disableScrollLock: true,
            PaperProps: {
              onMouseDown: e => {
                // Previene el scroll inesperado al hacer click
                e.stopPropagation();
              },
              onTouchStart: e => {
                e.stopPropagation();
              },
            },
          }}
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
