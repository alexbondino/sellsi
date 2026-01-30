// ✅ EDITAR AQUÍ PARA:
// - Cambiar placeholder del input
// - Modificar iconos o diseño del campo
// - Ajustar dropdown de ordenamiento
// - Cambiar estilos del botón de filtros

/* Barra de búsqueda */

import React from 'react';
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
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';

import SortIcon from '@mui/icons-material/Sort';

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
  showFiltersButton = true,
  // ✅ NUEVAS PROPS: Para el switch de vistas productos/proveedores
  isProviderView = false,
  onToggleProviderView = () => {},
  hasSideBar = false, // Para determinar si mostrar el switch
  // ✅ NUEVA PROP: Ocultar solo el input de texto en mobile (vista productos) manteniendo el resto
  hideTextInputOnMobile = false,
}) => {
  // ✅ SOLUCIÓN ROBUSTA: Solo usamos el estado global, debouncing manejado en useMarketplaceState

  // ✅ MEJORA DE RENDIMIENTO: Memoización del handler de limpiar búsqueda
  const handleClear = React.useCallback(() => {
    setBusqueda('');
  }, [setBusqueda]);

  // ✅ MEJORA DE RENDIMIENTO: Handler optimizado para cambio de búsqueda
  const handleSearchChange = React.useCallback(
    e => {
      const value = e.target.value;
      setBusqueda(value);
    },
    [setBusqueda]
  );

  // ✅ MEJORA DE RENDIMIENTO: Memoización del handler de cambio de ordenamiento
  const handleSortChange = React.useCallback(
    e => {
      setOrdenamiento(e.target.value);
    },
    [setOrdenamiento]
  );

  // ✅ MEJORA DE RENDIMIENTO: Memoización de estilos del contenedor principal
  const containerStyles = React.useMemo(
    () => ({
      display: 'flex',
      gap: { xs: 0.5, sm: 0.5, md: 1 },
      alignItems: 'center',
      justifyContent: 'flex-start',
      width: '100%',
      // Mantener en fila para que input + selector queden en la misma línea
      flexDirection: { xs: 'row', md: 'row' },
      flexWrap: 'nowrap',
      py: 0.5,
      // ✅ Usar prop searchBarMarginLeft para permitir diferentes valores
      marginLeft: searchBarMarginLeft,
    }),
    [searchBarMarginLeft]
  );

  // ✅ MEJORA DE RENDIMIENTO: Memoización de estilos del TextField - Responsivos según vista
  const textFieldStyles = React.useMemo(
    () => ({
      // Forzar que el TextField ocupe el 100% del wrapper
      width: '100%',
      minWidth: 0,
      '& .MuiOutlinedInput-root': {
        borderRadius: 1.5,
        backgroundColor: 'white',
        height: '36px',
      },
    }),
    [isProviderView]
  );

  // ✅ MEJORA DE RENDIMIENTO: Memoización de estilos del FormControl - Responsivos según vista
  const formControlStyles = React.useMemo(
    () => ({
      // ✅ AJUSTE: Forzar 40% en md+
      width: { xs: '100%', md: '40%' },
      flex: { xs: '0 0 auto', md: '0 0 40%' },
      minWidth: 0,
    }),
    [isProviderView]
  );

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
  );

  // Filtros removidos: eliminado buttonVariantStyles


  // ✅ OPTIMIZACIÓN: Memoización de InputProps para evitar re-creación
  const inputProps = React.useMemo(
    () => ({
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
    }),
    [busqueda, handleClear]
  );

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
  );

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
  );
  return (
    <Box sx={containerStyles}>
      {/* Barra de búsqueda - Más compacta */}
      {/* Input de búsqueda (oculto en mobile si hideTextInputOnMobile y no provider view) */}
      <Box
        sx={{
          display:
                    hideTextInputOnMobile && !isProviderView
                      ? { xs: 'none', sm: 'none', md: 'block' }
                      : 'block',
                  width: isProviderView ? { xs: '100%', md: '100%' } : { xs: '100%', md: '60%' },
                  flex: isProviderView ? { xs: '1 1 auto', md: '0 0 100%' } : { xs: '1 1 auto', md: '0 0 60%' },
                  minWidth: 0,
        }}
      >
        <TextField
          size="small"
          value={busqueda}
          onChange={handleSearchChange}
          placeholder={
            isProviderView ? 'Buscar proveedores...' : 'Buscar productos...'
          }
          variant="outlined"
          InputProps={inputProps}
          sx={textFieldStyles}
          autoComplete="off"
          autoCorrect="off"
        />
      </Box>
      {/* Selector de ordenamiento - Más compacto - Oculto en vista de proveedores */}
      {!isProviderView && (
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
            {sortOptions.map(option => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}
      {/* Control de vista Productos/Proveedores movido al contenedor padre (SearchSection) */}
      {/* Botón de filtros eliminado */}
    </Box>
  );
};

export default React.memo(SearchBar);
