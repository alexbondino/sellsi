// ✅ EDITAR AQUÍ PARA:
// - Cambiar placeholder del input
// - Modificar iconos o diseño del campo
// - Ajustar dropdown de ordenamiento
// - Cambiar estilos del botón de filtros

import React from 'react'
import {
  TextField,
  InputAdornment,
  IconButton,
  Box,
  Button,
  FormControl,
  Select,
  MenuItem,
  Badge,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import ClearIcon from '@mui/icons-material/Clear'
import FilterAltIcon from '@mui/icons-material/FilterAlt'
import SortIcon from '@mui/icons-material/Sort'

const SearchBar = ({
  busqueda,
  setBusqueda,
  ordenamiento,
  setOrdenamiento,
  sortOptions,
  onToggleFilters,
  hayFiltrosActivos,
  filtroVisible,
  filtroModalOpen,
}) => {
  const handleClear = () => {
    setBusqueda('')
  }

  return (
    <Box
      sx={{
        display: 'flex',
        gap: 1,
        alignItems: 'center',
        width: '100%',
        flexDirection: { xs: 'column', md: 'row' },
        py: 0.5, // ✅ Reducir padding vertical
      }}
    >
      {' '}
      {/* Barra de búsqueda - Más compacta */}
      <TextField
        size="small" // ✅ Hacer más pequeña
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        placeholder="Buscar productos..."
        variant="outlined"
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon color="action" fontSize="small" />
            </InputAdornment>
          ),
          endAdornment: busqueda && (
            <InputAdornment position="end">
              <IconButton
                onClick={handleClear}
                edge="end"
                size="small"
                aria-label="limpiar búsqueda"
              >
                <ClearIcon fontSize="small" />
              </IconButton>
            </InputAdornment>
          ),
        }}
        sx={{
          maxWidth: { xs: '100%', md: '240px' }, // ✅ Aún más pequeña
          minWidth: { md: '500px' },
          '& .MuiOutlinedInput-root': {
            borderRadius: 1.5,
            backgroundColor: 'white',
            height: '36px', // ✅ Altura fija más pequeña
          },
        }}
      />
      {/* Selector de ordenamiento - Más compacto */}
      <FormControl sx={{ minWidth: { xs: '100%', md: 140 } }} size="small">
        <Select
          value={ordenamiento}
          onChange={(e) => setOrdenamiento(e.target.value)}
          displayEmpty
          startAdornment={
            <InputAdornment position="start">
              <SortIcon color="action" fontSize="small" />
            </InputAdornment>
          }
          sx={{
            borderRadius: 1.5,
            backgroundColor: 'white',
            height: '36px',
            '& .MuiSelect-select': {
              pl: 0.5,
              py: 0.5,
              fontSize: '1rem', // ✅ AGREGAR: Texto más pequeño
            },
          }}
        >
          {sortOptions.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      {/* Botón de filtros - Más compacto */}
      <Button
        size="small"
        variant={filtroVisible || filtroModalOpen ? 'contained' : 'outlined'}
        startIcon={
          <Badge color="error" variant="dot" invisible={!hayFiltrosActivos}>
            <FilterAltIcon fontSize="small" />
          </Badge>
        }
        onClick={onToggleFilters}
        sx={{
          borderRadius: 1.5,
          px: 2,
          py: 0.5,
          minWidth: { xs: '100%', md: 'auto' },
          fontWeight: 600,
          height: '36px', // ✅ Misma altura que search
        }}
      >
        Filtros
      </Button>
    </Box>
  )
}

export default React.memo(SearchBar)
