import React from 'react'
import {
  Box,
  Typography,
  Button,
  IconButton,
  FormControlLabel,
  Checkbox,
  useMediaQuery,
  useTheme,
  Tooltip,
  Grid,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import ClearAllIcon from '@mui/icons-material/ClearAll' // ✅ AGREGAR
import FilterListIcon from '@mui/icons-material/FilterList'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined' // ✅ AGREGAR

import PriceFilter from './components/PriceFilter'
import CommissionFilter from './components/CommissionFilter'
import RatingFilter from './components/RatingFilter'
import SaleTypeFilter from './components/SaleTypeFilter'
import AppliedFiltersDisplay from './components/AppliedFiltersDisplay'
import { filterPanelStyles as styles } from './FilterPanel.styles'
import { useProductFilters } from '../../../hooks/marketplace/useProductFilters'
import {
  SALE_TYPES,
  SALE_TYPE_MESSAGES,
} from '../../../utils/marketplace/constants' // ✅ CORREGIDO: 3 niveles

const FilterPanel = ({
  filtros,
  categoriaSeleccionada,
  busqueda,
  updateFiltros,
  resetFiltros,
  isMobileOpen,
  onMobileClose,
  totalProductos,
  filtrosAbiertos = false, // ✅ AGREGAR esta prop con valor por defecto
}) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  const {
    handlePrecioChange,
    handleComisionChange,
    handleTipoVentaChange,
    handleStockChange,
    handleRatingChange,
  } = useProductFilters(filtros, updateFiltros)

  const handleRemoveFilter = (filterType, value) => {
    switch (filterType) {
      case 'precioMin':
        updateFiltros({ precioMin: '' })
        break
      case 'precioMax':
        updateFiltros({ precioMax: '' })
        break
      case 'comisionMin':
        updateFiltros({ comisionMin: '' })
        break
      case 'comisionMax':
        updateFiltros({ comisionMax: '' })
        break
      case 'ratingMin':
        updateFiltros({ ratingMin: 0 }) // ✅ Resetear a 0
        break
      case 'tipoVenta':
        const newTiposVenta = filtros.tiposVenta.filter(
          (tipo) => tipo !== value
        )
        updateFiltros({ tiposVenta: newTiposVenta })
        break
      case 'soloConStock':
        updateFiltros({ soloConStock: false })
        break
      default:
        break
    }
  }
  const FilterContent = () => (
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
            '&:hover': {
              bgcolor: 'rgba(25, 118, 210, 0.08)', // ✅ CAMBIAR: hover azul claro
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
      />
      <CommissionFilter
        filtros={filtros}
        onComisionChange={handleComisionChange}
        styles={styles}
      />
      <RatingFilter
        filtros={filtros}
        onRatingChange={handleRatingChange}
        styles={styles}
      />
      <SaleTypeFilter
        filtros={filtros}
        onTipoVentaChange={handleTipoVentaChange}
        styles={styles}
      />
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
      />{' '}
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
        </Typography>
      </Box>
    </>
  )

  // Versión mobile
  if (isMobile) {
    if (!isMobileOpen) return null

    return (
      <Box sx={styles.mobile}>
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
          <Button variant="outlined" onClick={resetFiltros} sx={{ flex: 1 }}>
            Limpiar
          </Button>
          <Button
            variant="contained"
            onClick={onMobileClose}
            sx={{ flex: 2, ...styles.applyButton }}
          >
            Ver {totalProductos} productos
          </Button>
        </Box>
      </Box>
    )
  } // Versión desktop - ✅ CON ANIMACIÓN bidireccional
  return (
    <Box
      sx={{
        ...styles.desktop,
        // ✅ CORREGIR: quitar visibility para permitir animación de salida
        transform: filtrosAbiertos ? 'translateX(0)' : 'translateX(-100%)',
        opacity: filtrosAbiertos ? 1 : 0,
        // ✅ REMOVER: visibility: filtrosAbiertos ? 'visible' : 'hidden',
        pointerEvents: filtrosAbiertos ? 'auto' : 'none', // ✅ AGREGAR: para evitar clicks cuando está oculto
      }}
    >
      <FilterContent />
    </Box>
  )
}

export default FilterPanel
