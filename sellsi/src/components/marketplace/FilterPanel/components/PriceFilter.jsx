import React from 'react'
import { Box, TextField, Typography, Slider } from '@mui/material'
import { PRICE_RANGE } from '../../../../utils/marketplace/constants'

const PriceFilter = ({ filtros, onPrecioChange, styles }) => {
  const formatPrice = (value) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(value)
  }

  const handleSliderChange = (event, newValue) => {
    onPrecioChange('precioMin', newValue[0])
    onPrecioChange('precioMax', newValue[1])
  }

  const sliderValue = [
    filtros.precioMin || PRICE_RANGE[0],
    filtros.precioMax || PRICE_RANGE[1],
  ]

  return (
    <Box sx={styles.filterGroup}>
      <Typography sx={styles.sectionTitle}>💰 Precio</Typography>

      <Box sx={{ mb: 2 }}>
        <Slider
          value={sliderValue}
          onChange={handleSliderChange}
          valueLabelDisplay="auto"
          valueLabelFormat={formatPrice}
          min={PRICE_RANGE[0]}
          max={PRICE_RANGE[1]}
          step={10000}
          sx={styles.slider}
        />
      </Box>

      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
        <TextField
          label="Mínimo"
          type="number"
          size="small"
          value={filtros.precioMin}
          onChange={(e) => onPrecioChange('precioMin', e.target.value)}
          sx={styles.input}
        />
        <Typography color="text.secondary">-</Typography>
        <TextField
          label="Máximo"
          type="number"
          size="small"
          value={filtros.precioMax}
          onChange={(e) => onPrecioChange('precioMax', e.target.value)}
          sx={styles.input}
        />
      </Box>

      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ mt: 1, display: 'block' }}
      >
        Rango: {formatPrice(sliderValue[0])} - {formatPrice(sliderValue[1])}
      </Typography>
    </Box>
  )
}

export default React.memo(PriceFilter)
