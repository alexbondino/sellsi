// ✅ EDITAR AQUÍ PARA:
// - Cambiar placeholder del input
// - Modificar iconos o diseño del campo
// - Ajustar dropdown de ordenamiento
// - Cambiar estilos del botón de filtros

import React, { useCallback } from 'react'
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
  Switch,
  FormControlLabel,
  Typography,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import ClearIcon from '@mui/icons-material/Clear'
import FilterAltIcon from '@mui/icons-material/FilterAlt'
import SortIcon from '@mui/icons-material/Sort'

// ✅ OPTIMIZACIÓN: Hook personalizado para debouncing
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = React.useState(value)

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

// ✅ OPTIMIZACIÓN: Memoización del componente SearchBar
const SearchBar = React.memo(({
  busqueda,
  setBusqueda,
  ordenamiento,
  setOrdenamiento,
  sortOptions,
  onToggleFilters,
  hayFiltrosActivos,
  filtroVisible,
  filtroModalOpen,
  // ✅ NUEVAS PROPS: Para manejar estado móvil del FilterPanel
  isMobileFilterOpen = false,
  onMobileFilterClose = () => {},
  searchBarMarginLeft = {
    xs: 0,
    sm: 0,
    md: 2,
    lg: 33.7,
    xl: 41,
  }, // Valores por defecto para Marketplace normal
  showFiltersButton = true,
  // ✅ NUEVAS PROPS: Para el switch de vistas
  isProviderView = false,
  onToggleProviderView = () => {},
  hasSideBar = false, // Para determinar si mostrar el switch
}) => {
  // ✅ OPTIMIZACIÓN: Estado local para el input con debouncing
  const [localBusqueda, setLocalBusqueda] = React.useState(busqueda)
  const debouncedBusqueda = useDebounce(localBusqueda, 300) // 300ms delay

  // ✅ OPTIMIZACIÓN: Estado local simplificado para el switch
  const [localProviderView, setLocalProviderView] = React.useState(isProviderView);

  // ✅ OPTIMIZACIÓN: Sincronizar el valor debounced con el estado global
  React.useEffect(() => {
    if (debouncedBusqueda !== busqueda) {
      setBusqueda(debouncedBusqueda)
    }
  }, [debouncedBusqueda, setBusqueda])

  // ✅ OPTIMIZACIÓN: Sincronizar cambios externos - SIMPLIFICADO
  React.useEffect(() => {
    setLocalBusqueda(busqueda);
  }, [busqueda]);

  // ✅ OPTIMIZACIÓN: Sincronizar el estado local del switch con el prop externo SOLO cuando sea diferente
  React.useEffect(() => {
    if (localProviderView !== isProviderView) {
      setLocalProviderView(isProviderView);
    }
  }, [isProviderView, localProviderView]);

  // ✅ MEJORA DE RENDIMIENTO: Handler optimizado para cambio de búsqueda
  const handleSearchChange = React.useCallback((e) => {
    const value = e.target.value
    setLocalBusqueda(value)
  }, [])

  // ✅ MEJORA DE RENDIMIENTO: Memoización del handler de cambio de ordenamiento
  const handleSortChange = React.useCallback((e) => {
    setOrdenamiento(e.target.value)
  }, [setOrdenamiento])

  // ✅ NUEVO: Handler para manejar filtros móviles
  const handleToggleFilters = React.useCallback(() => {
    onToggleFilters() // Llama la función original para desktop
  }, [onToggleFilters])

  // ✅ OPTIMIZACIÓN: Handler para el switch de vistas - CON memoización optimizada
  const handleToggleView = React.useCallback(() => {
    
    // Actualizar estado local inmediatamente
    const newValue = !localProviderView;
    setLocalProviderView(newValue);
    
    // Llamar al handler externo
    onToggleProviderView();
  }, [localProviderView, onToggleProviderView]);

  // ✅ MEJORA DE RENDIMIENTO: Memoización de estilos del contenedor principal
  const containerStyles = {
    display: 'flex',
    gap: { xs: 0.5, sm: 0.5, md: 1 },
    alignItems: 'center',
    width: '100%',
    flexDirection: 'row',
    py: { xs: 0, md: 0.5 },
    marginLeft: searchBarMarginLeft,
  }

  // ✅ MEJORA DE RENDIMIENTO: Memoización de estilos del TextField - Estáticos
  const textFieldStyles = React.useMemo(
    () => ({
      width: { xs: '30%', sm: '30%', md: '240px' }, // ✅ 40% en xs/sm, tamaño fijo en md+
      minWidth: { xs: 'auto', sm: 'auto', md: '500px' }, // ✅ Sin minWidth en móviles
      '& .MuiOutlinedInput-root': {
        borderRadius: 1.5,
        backgroundColor: 'white',
        height: '36px', // ✅ Altura fija más pequeña
      },
    }),
    []
  )

  // ✅ MEJORA DE RENDIMIENTO: Memoización de estilos del FormControl - Estáticos
  const formControlStyles = React.useMemo(
    () => ({
      width: { xs: '47%', sm: '50%', md: 245 }, // ✅ AUMENTADO a 40% para compensar reducción del botón filtros
      minWidth: 'auto', // ✅ Sin minWidth en móviles
    }),
    []
  )

  // ✅ OPTIMIZACIÓN: Memoización de estilos del botón - Estáticos
  const buttonBaseStyles = React.useMemo(
    () => ({
      borderRadius: 1.5,
      px: { xs: 0.5, sm: 0.5, md: 2 }, // ✅ Padding ultra-mínimo en móviles
      py: 0.5,
      width: { xs: '20%', sm: '20%', md: 'auto' }, // ✅ REDUCIDO a 20% (65% menos)
      minWidth: { xs: '36px', sm: '36px', md: 'auto' }, // ✅ Ancho mínimo igual a la altura
      fontWeight: 600,
      height: '36px', // ✅ Misma altura que search
      fontSize: { xs: '0.75rem', sm: '0.85rem', md: '0.875rem' },
    }),
    []
  )

  // ✅ OPTIMIZACIÓN: Estilos del botón que dependen del estado
  const buttonVariantStyles = React.useMemo(
    () => ({
      variant: filtroVisible || filtroModalOpen ? 'contained' : 'outlined',
    }),
    [filtroVisible, filtroModalOpen]
  )

  // ✅ OPTIMIZACIÓN: Memoización de InputProps para evitar re-creación
  const inputProps = React.useMemo(
    () => ({
      startAdornment: (
        <InputAdornment position="start">
          <SearchIcon color="action" fontSize="small" />
        </InputAdornment>
      ),
      endAdornment: localBusqueda && (
        <InputAdornment position="end">
          <IconButton
            onClick={() => {
              setLocalBusqueda('');
              setBusqueda('');
            }}
            edge="end"
            size="small"
            aria-label="limpiar búsqueda"
            sx={{ mr: 0.5 }}
          >
            <ClearIcon fontSize="small" />
          </IconButton>
        </InputAdornment>
      ),
    }),
    [localBusqueda, setBusqueda]
  )

  // ✅ OPTIMIZACIÓN: Memoización de MenuProps para Select
  const selectMenuProps = React.useMemo(
    () => ({
      disableScrollLock: true,
      PaperProps: {
        style: {
          maxHeight: 200, // Limitar altura del menú
        },
      },
    }),
    []
  )

  // ✅ OPTIMIZACIÓN: Memoización de estilos del Select - Estáticos
  const selectStyles = React.useMemo(
    () => ({
      borderRadius: 1.5,
      backgroundColor: 'white',
      height: '36px',
      '& .MuiSelect-select': {
        pl: 0.5,
        py: 0.5,
        fontSize: '1rem', // ✅ AGREGAR: Texto más pequeño
      },
    }),
    []
  )

  return (
    <Box sx={containerStyles}>
      {/* Barra de búsqueda - Más compacta */}
      <TextField
        size="small" // ✅ Hacer más pequeña
        value={localBusqueda}
        onChange={handleSearchChange}
        placeholder={localProviderView ? "Buscar proveedores..." : "Buscar productos..."}
        variant="outlined"
        InputProps={inputProps}
        sx={textFieldStyles}
      />
      {/* Selector de ordenamiento - Más compacto - Oculto en vista de proveedores */}
      {!localProviderView && (
        <FormControl sx={formControlStyles}>
          <Select
            value={ordenamiento}
            onChange={handleSortChange}
            displayEmpty
            startAdornment={
              <InputAdornment position="start">
                <SortIcon color="action" fontSize="small" />
              </InputAdornment>
            }
            MenuProps={selectMenuProps}
            sx={selectStyles}
          >
            {sortOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}
      {/* Switch de vista Productos/Proveedores - Solo para marketplace con sidebar */}
      {hasSideBar && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            flexShrink: 0,
            ml: { xs: 0.5, md: 1 },
            mr: { xs: 0.5, md: 1 },
          }}
        >
          <FormControlLabel
            control={
              <Switch
                checked={localProviderView}
                onChange={handleToggleView}
                size="small"
                color="primary"
                onClick={() => {}}
              />
            }
            label={
              <Typography
                variant="caption"
                sx={{
                  fontSize: { xs: '0.65rem', sm: '0.7rem', md: '0.75rem' },
                  fontWeight: 500,
                  color: 'text.secondary',
                  whiteSpace: 'nowrap',
                }}
              >
                {localProviderView ? 'Proveedores' : 'Productos'}
              </Typography>
            }
            labelPlacement="top"
            sx={{
              m: 0,
              flexDirection: 'column',
              alignItems: 'center',
              gap: 0.25,
              '& .MuiFormControlLabel-label': {
                fontSize: { xs: '0.65rem', sm: '0.7rem', md: '0.75rem' },
              },
            }}
          />
        </Box>
      )}

      {/* Botón de filtros - Optimizado para móviles */}
      {showFiltersButton !== false && (
        <Button
          size="small"
          variant={buttonVariantStyles.variant}
          onClick={handleToggleFilters}
          sx={buttonBaseStyles}
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
      )}
    </Box>
  )
});

// ✅ OPTIMIZACIÓN: DisplayName para debugging
SearchBar.displayName = 'SearchBar';

export default SearchBar
