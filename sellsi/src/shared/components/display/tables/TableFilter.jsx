import React from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
} from '@mui/material';

const Filter = ({ statusFilter, setStatusFilter }) => {
  const filterOptions = [
    'Todos',
    'Pendiente',
    'Aceptado',
    'Rechazado',
    'En Transito',
    'Entregado',
  ];

  const handleFilterChange = (event) => {
    setStatusFilter(event.target.value);
  };

  return (
    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 3 }}>
      <Typography fontWeight={600}>Filtrar por estado:</Typography>
      <FormControl size="small" sx={{ minWidth: 180 }}>
        <InputLabel id="status-filter-label">Estado</InputLabel>
        <Select
          labelId="status-filter-label"
          id="status-filter-select"
          value={statusFilter}
          label="Estado"
          onChange={handleFilterChange}
          MenuProps={{
            disableScrollLock: true,
            PaperProps: {
              onMouseDown: (e) => {
                e.stopPropagation();
              },
              onTouchStart: (e) => {
                e.stopPropagation();
              },
            },
          }}
        >
          {filterOptions.map((option) => (
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
