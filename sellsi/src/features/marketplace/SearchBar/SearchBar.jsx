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
  searchBarMarginLeft = {
    xs: 0,
    sm: 0,
    md: 2,
    lg: 33.7,
    xl: 41,
  }, // Valores por defecto para Marketplace normal
}) => {
  const handleClear = () => {
    setBusqueda('')
  }
  return (
    <Box
      sx={{
        display: 'flex',
        gap: { xs: 0.5, sm: 0.5, md: 1 }, // ✅ Gap más pequeño en móviles
        alignItems: 'center',
        width: '100%',
        flexDirection: 'row', // ✅ SIEMPRE en fila para xs/sm/md
        py: 0.5,
        // ✅ Usar prop searchBarMarginLeft para permitir diferentes valores
        marginLeft: searchBarMarginLeft,
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
          width: { xs: '30%', sm: '30%', md: '240px' }, // ✅ 40% en xs/sm, tamaño fijo en md+
          minWidth: { xs: 'auto', sm: 'auto', md: '500px' }, // ✅ Sin minWidth en móviles
          '& .MuiOutlinedInput-root': {
            borderRadius: 1.5,
            backgroundColor: 'white',
            height: '36px', // ✅ Altura fija más pequeña
          },
        }}
      />{' '}
      {/* Selector de ordenamiento - Más compacto */}{' '}
      <FormControl
        sx={{
          width: { xs: '47%', sm: '50%', md: 245 }, // ✅ AUMENTADO a 40% para compensar reducción del botón filtros
          minWidth: 'auto', // ✅ Sin minWidth en móviles
        }}
        size="small"
      >
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
      </FormControl>{' '}
      {/* Botón de filtros - Optimizado para móviles */}
      <Button
        size="small"
        variant={filtroVisible || filtroModalOpen ? 'contained' : 'outlined'}
        onClick={onToggleFilters}
        sx={{
          borderRadius: 1.5,
          px: { xs: 0.5, sm: 0.5, md: 2 }, // ✅ Padding ultra-mínimo en móviles
          py: 0.5,
          width: { xs: '20%', sm: '20%', md: 'auto' }, // ✅ REDUCIDO a 20% (65% menos)
          minWidth: { xs: '36px', sm: '36px', md: 'auto' }, // ✅ Ancho mínimo igual a la altura
          fontWeight: 600,
          height: '36px', // ✅ Misma altura que search
          fontSize: { xs: '0.75rem', sm: '0.85rem', md: '0.875rem' },
        }}
      >
        {/* Solo icono en xs y sm, texto completo en md+ */}
        <Box
          sx={{
            display: { xs: 'none', sm: 'none', md: 'flex' },
            alignItems: 'center',
            gap: 1,
          }}
        >
          <Badge color="error" variant="dot" invisible={!hayFiltrosActivos}>
            <FilterAltIcon fontSize="small" />
          </Badge>
          Filtros
        </Box>
        {/* Solo icono en xs y sm */}
        <Box
          sx={{
            display: { xs: 'flex', sm: 'flex', md: 'none' },
            justifyContent: 'center',
          }}
        >
          <Badge color="error" variant="dot" invisible={!hayFiltrosActivos}>
            <FilterAltIcon fontSize="small" />
          </Badge>
        </Box>
      </Button>
    </Box>
  )
}

export default React.memo(SearchBar)
