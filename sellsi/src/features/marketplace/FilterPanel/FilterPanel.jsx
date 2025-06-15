// ✅ EDITAR AQUÍ PARA:
// - Cambiar header "Filtros" y botón "Limpiar"
// - Modificar el layout general del panel
// - Ajustar diferencias entre versión desktop/móvil
// - Cambiar animaciones de entrada/salida

// 🔗 SUBCOMPONENTES:
// - PriceFilter.jsx ───── Slider y campos de precio
// - AppliedFiltersDisplay.jsx ─ Chips filtros activos

import React from 'react'
import {
  Box,
  Typography,
  Button,
  IconButton,
  FormControlLabel,
  Checkbox,
  Tooltip,
  Grid,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import ClearAllIcon from '@mui/icons-material/ClearAll' // ✅ AGREGAR
import FilterListIcon from '@mui/icons-material/FilterList'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined' // ✅ AGREGAR

import PriceFilter from './components/PriceFilter'
import AppliedFiltersDisplay from './components/AppliedFiltersDisplay'
import { filterPanelStyles as styles } from '../hooks/FilterPanel/FilterPanel.styles'
import { useProductFilters } from '../hooks/useProductFilters'

// ✅ MEJORA DE RENDIMIENTO: Memoización del componente principal
const FilterPanel = React.memo(({
  filtros,
  categoriaSeleccionada,
  busqueda,
  updateFiltros,
  resetFiltros,
  isMobileOpen,
  onMobileClose,
  totalProductos,
  filtrosAbiertos = false,
  filterPosition = 'left', // Nueva prop para controlar posición
}) => {
  const { handlePrecioChange, handleStockChange } = useProductFilters(
    filtros,
    updateFiltros
  )

  // ✅ MEJORA DE RENDIMIENTO: Memoización del handler de remover filtros
  const handleRemoveFilter = React.useCallback((filterType, value) => {
    switch (filterType) {
      case 'precioMin':
        updateFiltros({ precioMin: '' })
        break
      case 'precioMax':
        updateFiltros({ precioMax: '' })
        break
      case 'soloConStock':
        updateFiltros({ soloConStock: false })
        break
      case 'negociable': // ✅ NUEVO: Resetear filtro negociable
        updateFiltros({ negociable: 'todos' })
        break
      default:
        break
    }
  }, [updateFiltros])

  // ✅ MEJORA DE RENDIMIENTO: Memoización del contenido principal
  const FilterContent = React.useCallback(() => {
    return (
      <>
        {/* ✅ Header con diseño mejorado como en la captura */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 3,
            pb: 2,
            borderBottom: '1px solid #e2e8f0',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <FilterListIcon
              sx={{
                color: '#1976D2',
                fontSize: 24,
              }}
            />
            <Typography
              sx={{
                fontSize: '1.25rem',
                fontWeight: 700,
                color: '#1e293b',
              }}
            >
              Filtros
            </Typography>
          </Box>
          <Button
            onClick={resetFiltros}
            size="small"
            startIcon={<ClearAllIcon sx={{ fontSize: 18 }} />}
            sx={{
              color: '#1976D2', // ✅ CAMBIAR: de '#ef4444' a azul
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.875rem',
              minHeight: 'auto',
              py: 0.75,
              px: 1.5,
              borderRadius: 1.5,
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                bgcolor: 'rgba(25, 118, 210, 0.08)', // ✅ CAMBIAR: hover azul claro
                transform: 'translateY(-1px)',
                boxShadow: '0 2px 8px rgba(25, 118, 210, 0.2)',
              },
            }}
          >
            Limpiar
          </Button>
        </Box>
        <PriceFilter
          filtros={filtros}
          onPrecioChange={handlePrecioChange}
          styles={styles}
        />{' '}
        {/* ✅ NUEVO: Filtro de negociable */}
        <Box sx={styles.filterGroup}>
          <Typography sx={styles.sectionTitle}>🤝 Negociación</Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={filtros.negociable === 'todos'}
                  onChange={(e) => {
                    if (e.target.checked) {
                      updateFiltros({ negociable: 'todos' })
                    }
                  }}
                  size="small"
                />
              }
              label="Todos los productos"
              sx={{
                color:
                  filtros.negociable === 'todos'
                    ? 'primary.main'
                    : 'text.primary',
                fontWeight: filtros.negociable === 'todos' ? 600 : 400,
              }}
            />

            <FormControlLabel
              control={
                <Checkbox
                  checked={filtros.negociable === 'si'}
                  onChange={(e) => {
                    updateFiltros({
                      negociable: e.target.checked ? 'si' : 'todos',
                    })
                  }}
                  size="small"
                />
              }
              label="Solo negociables"
              sx={{
                color:
                  filtros.negociable === 'si' ? 'success.main' : 'text.primary',
                fontWeight: filtros.negociable === 'si' ? 600 : 400,
              }}
            />

            <FormControlLabel
              control={
                <Checkbox
                  checked={filtros.negociable === 'no'}
                  onChange={(e) => {
                    updateFiltros({
                      negociable: e.target.checked ? 'no' : 'todos',
                    })
                  }}
                  size="small"
                />
              }
              label="Solo no negociables"
              sx={{
                color:
                  filtros.negociable === 'no'
                    ? 'text.secondary'
                    : 'text.primary',
                fontWeight: filtros.negociable === 'no' ? 600 : 400,
              }}
            />
          </Box>
        </Box>{' '}
        <Box sx={styles.filterGroup}>
          <Typography sx={styles.sectionTitle}>📦 Disponibilidad</Typography>

          <FormControlLabel
            control={
              <Checkbox
                checked={filtros.soloConStock}
                onChange={(e) => handleStockChange(e.target.checked)}
                size="small"
              />
            }
            label="Solo productos con stock"
          />
        </Box>
        {/* ✅ MOVER filtros activos al final */}
        <AppliedFiltersDisplay
          filtros={filtros}
          categoriaSeleccionada={categoriaSeleccionada}
          busqueda={busqueda}
          onRemoveFilter={handleRemoveFilter}
          styles={styles}
        />
        {/* ✅ Conteo de productos al final */}
        <Box
          sx={{
            mt: 2,
            pt: 2,
            borderTop: '1px solid',
            borderColor: 'divider',
            textAlign: 'center',
          }}
        >
          <Typography variant="caption" color="text.secondary">
            {totalProductos} productos encontrados
          </Typography>        </Box>
      </>
    )
  }, [updateFiltros, resetFiltros, filtros, handlePrecioChange, handleStockChange, handleRemoveFilter, totalProductos])

  // ✅ MEJORA DE RENDIMIENTO: Memoización del panel móvil
  const MobileFilterPanel = React.useCallback(() => {
    return (
      <>
        {/* Backdrop con fade in/out */}
        <Box
          onClick={onMobileClose}
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            bgcolor: 'rgba(0,0,0,0.5)',
            zIndex: 1299,
            opacity: isMobileOpen ? 1 : 0,
            visibility: isMobileOpen ? 'visible' : 'hidden',
            transition: 'opacity 0.3s ease-in-out, visibility 0.3s ease-in-out',
          }}
        />
        {/* Panel móvil con slide desde la derecha */}
        <Box
          sx={{
            ...styles.mobile,
            position: 'fixed',
            top: 0,
            right: 0,
            bottom: 0,
            width: '85%',
            maxWidth: 400,
            zIndex: 1300,
            transform: isMobileOpen ? 'translateX(0%)' : 'translateX(100%)',
            transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: isMobileOpen ? '0 0 20px rgba(0,0,0,0.3)' : 'none',
          }}
        >
          {/* Header móvil */}
          <Box sx={styles.mobileHeader}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <FilterListIcon color="primary" />
              <Typography sx={styles.title}>Filtros</Typography>
            </Box>
            <IconButton onClick={onMobileClose}>
              <CloseIcon />
            </IconButton>
          </Box>
          {/* Contenido móvil */}
          <Box sx={styles.mobileContent}>
            <FilterContent />
          </Box>
          {/* Footer móvil */}
          <Box sx={styles.mobileFooter}>
            <Button
              variant="outlined"
              onClick={resetFiltros}
              sx={{
                flex: 1,
                transition: 'all 0.2s',
                '&:hover': { transform: 'translateY(-1px)' },
              }}
            >
              Limpiar
            </Button>
            <Button
              variant="contained"
              onClick={onMobileClose}
              sx={{ flex: 2, ...styles.applyButton }}
            >
              Ver {totalProductos} productos
            </Button>          </Box>
        </Box>
      </>
    )
  }, [onMobileClose, isMobileOpen, FilterContent])

  // ✅ MEJORA DE RENDIMIENTO: Memoización del panel desktop
  const DesktopFilterPanel = React.useCallback(() => {
    // Configuración de posición basada en la prop filterPosition
    const positionConfig =
      filterPosition === 'right'
        ? {
            // Posición derecha para md/lg/xl breakpoints
            right: { xs: 20, md: 20, lg: 20, xl: 20 },
            left: 'auto',
            transform: filtrosAbiertos ? 'translateX(0)' : 'translateX(100%)',
          }
        : {
            // Posición izquierda (comportamiento original)
            left: 20,
            right: 'auto',
            transform: filtrosAbiertos ? 'translateX(0)' : 'translateX(-100%)',
          }

    return (
      <Box
        sx={{
          ...styles.desktop,
          ...positionConfig,
          zIndex: 1200,
          opacity: filtrosAbiertos ? 1 : 0,
          visibility: filtrosAbiertos ? 'visible' : 'hidden',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          position: 'fixed',
          top: 180,
          maxHeight: 'calc(100vh - 200px)',
          overflowY: 'auto',
          '&::-webkit-scrollbar': {
            width: 6,
          },
          '&::-webkit-scrollbar-track': {
            background: '#f1f1f1',
            borderRadius: 3,
          },
          '&::-webkit-scrollbar-thumb': {
            background: '#c1c1c1',
            borderRadius: 3,
            '&:hover': {
              background: '#a8a8a8',
            },
          },
        }}
      >        <FilterContent />
      </Box>
    )
  }, [filtrosAbiertos, filterPosition, FilterContent])

  return (
    <>
      {/* Mobile FilterPanel - siempre montado para animaciones */}
      <Box sx={{ display: { xs: 'block', md: 'none' } }}>
        <MobileFilterPanel />
      </Box>
      {/* Desktop FilterPanel - siempre montado para animaciones */}
      <Box sx={{ display: { xs: 'none', md: 'block' } }}>
        <DesktopFilterPanel />      </Box>
    </>
  )
})

// ✅ MEJORA DE RENDIMIENTO: DisplayName para debugging
FilterPanel.displayName = 'FilterPanel'

export default FilterPanel
