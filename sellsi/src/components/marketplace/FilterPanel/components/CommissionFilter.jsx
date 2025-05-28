import React from 'react'
import { Box, TextField, Typography, Slider } from '@mui/material'
import { COMMISSION_RANGE } from '../../../../utils/marketplace/constants'

const CommissionFilter = ({ filtros, onComisionChange, styles }) => {
  const handleSliderChange = (event, newValue) => {
    onComisionChange('comisionMin', newValue[0])
    onComisionChange('comisionMax', newValue[1])
  }

  const sliderValue = [
    filtros.comisionMin || COMMISSION_RANGE[0],
    filtros.comisionMax || COMMISSION_RANGE[1],
  ]

  return (
    <Box sx={styles.filterGroup}>
      <Typography sx={styles.sectionTitle}>
        💼 Comisión (%)
      </Typography>
      
      <Box sx={{ mb: 2 }}>
        <Slider
          value={sliderValue}
          onChange={handleSliderChange}
          valueLabelDisplay="auto"
          min={COMMISSION_RANGE[0]}
          max={COMMISSION_RANGE[1]}
          step={1}
          sx={styles.slider}
        />
      </Box>

      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
        <TextField
          label="Mínimo %"
          type="number"
          size="small"
          value={filtros.comisionMin}
          onChange={(e) => onComisionChange('comisionMin', e.target.value)}
          sx={styles.input}
        />
        <Typography color="text.secondary">-</Typography>
        <TextField
          label="Máximo %"
          type="number"
          size="small"
          value={filtros.comisionMax}
          onChange={(e) => onComisionChange('comisionMax', e.target.value)}
          sx={styles.input}
        />
      </Box>

      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
        Rango: {sliderValue[0]}% - {sliderValue[1]}%
      </Typography>
    </Box>
  )
}

export default CommissionFilter