import React from 'react'
import { Box, Typography, Slider } from '@mui/material'
import StarIcon from '@mui/icons-material/Star'
import StarHalfIcon from '@mui/icons-material/StarHalf'
import StarBorderIcon from '@mui/icons-material/StarBorder'

const RatingFilter = ({ filtros, onRatingChange, styles }) => {
  // ✅ Función para renderizar estrellas con medias estrellas
  const renderStars = (rating) => {
    const stars = []
    const fullStars = Math.floor(rating)
    const hasHalfStar = rating % 1 !== 0

    // Estrellas completas
    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <StarIcon key={`full-${i}`} sx={{ color: '#fbbf24', fontSize: 20 }} />
      )
    }

    // Media estrella si es necesario
    if (hasHalfStar) {
      stars.push(
        <StarHalfIcon key="half" sx={{ color: '#fbbf24', fontSize: 20 }} />
      )
    }

    // Estrellas vacías
    const emptyStars = 5 - Math.ceil(rating)
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <StarBorderIcon
          key={`empty-${i}`}
          sx={{ color: '#d1d5db', fontSize: 20 }}
        />
      )
    }

    return stars
  }

  // ✅ Marcas para el slider (cada 0.5)
  const marks = [
    { value: 0, label: '0' },
    { value: 1, label: '1' },
    { value: 2, label: '2' },
    { value: 3, label: '3' },
    { value: 4, label: '4' },
    { value: 5, label: '5' },
  ]

  return (
    <Box sx={styles.filterGroup}>
      <Typography sx={styles.sectionTitle}>⭐ Calificación mínima</Typography>

      {/* ✅ Mostrar estrellas según el valor actual */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 2 }}>
        {renderStars(filtros.ratingMin)}
        <Typography variant="body2" sx={{ ml: 1, color: '#6b7280' }}>
          {filtros.ratingMin === 0
            ? 'Todas'
            : `${filtros.ratingMin}+ estrellas`}
        </Typography>
      </Box>

      {/* ✅ Slider para seleccionar calificación */}
      <Slider
        value={filtros.ratingMin}
        onChange={(_, newValue) => onRatingChange(newValue)}
        min={0}
        max={5}
        step={0.5} // ✅ Permite incrementos de 0.5
        marks={marks}
        valueLabelDisplay="auto"
        valueLabelFormat={(value) => `${value} ⭐`}
        sx={{
          ...styles.slider,
          '& .MuiSlider-markLabel': {
            fontSize: '0.75rem',
            color: '#6b7280',
          },
          '& .MuiSlider-thumb': {
            backgroundColor: '#fbbf24',
            '&:hover': {
              boxShadow: '0 0 0 8px rgba(251, 191, 36, 0.16)',
            },
          },
          '& .MuiSlider-track': {
            backgroundColor: '#fbbf24',
          },
          '& .MuiSlider-rail': {
            backgroundColor: '#e5e7eb',
          },
        }}
      />
    </Box>
  )
}

export default RatingFilter
