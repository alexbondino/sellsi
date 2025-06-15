import React from 'react'
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Box,
  ListSubheader,
  useTheme,
  useMediaQuery,
} from '@mui/material'
import { useCountrySelector } from './hooks/useCountrySelector'

/**
 * Componente UI puro para seleccionar países
 * @param {Object} props - Props del componente
 * @param {string} props.value - Código del país seleccionado
 * @param {function} props.onChange - Función para manejar cambios
 * @param {string} props.label - Etiqueta del campo
 * @param {boolean} props.required - Si el campo es requerido
 * @param {boolean} props.error - Si hay error en el campo
 * @param {string} props.helperText - Texto de ayuda
 * @param {Object} props.sx - Estilos adicionales
 */

// Componente para renderizar banderas como círculos con colores (solo para desktop)
const FlagIcon = ({ countryCode, flagColors, size = 20 }) => {
  const colors = flagColors[countryCode] || ['#cccccc', '#999999']

  // Diseño especial para Chile
  if (countryCode === 'CL') {
    return (
      <Box
        sx={{
          width: size,
          height: size,
          borderRadius: '50%',
          position: 'relative',
          backgroundColor: colors[2], // rojo como fondo base
          border: '2px solid #d4d4d4',
          flexShrink: 0,
          display: 'inline-block',
          overflow: 'hidden',
          boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
        }}
      >
        {/* Franja superior derecha - Blanca */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '66.66%',
            height: '50%',
            backgroundColor: colors[1], // blanco
            borderTopRightRadius: '50%',
          }}
        />
        {/* Cuadro superior izquierdo - Azul */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '33.33%',
            height: '50%',
            backgroundColor: colors[0], // azul
            borderTopLeftRadius: '50%',
          }}
        />
        {/* Estrella blanca */}
        <Box
          sx={{
            position: 'absolute',
            top: '25%',
            left: '16.65%',
            width: '5px',
            height: '5px',
            backgroundColor: colors[1], // blanco
            clipPath:
              'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
            transform: 'translate(-50%, -50%) scale(0.8)',
          }}
        />
      </Box>
    )
  }

  // Diseño estándar para otros países
  return (
    <Box
      sx={{
        width: size,
        height: size,
        borderRadius: '50%',
        background:
          colors.length === 3
            ? `linear-gradient(to bottom, ${colors[0]} 33%, ${colors[1]} 33% 66%, ${colors[2]} 66%)`
            : `linear-gradient(to bottom, ${colors[0]} 50%, ${colors[1]} 50%)`,
        border: '1px solid #e0e0e0',
        flexShrink: 0,
        display: 'inline-block',
      }}
    />
  )
}

const CountrySelector = ({
  value = '',
  onChange,
  label = 'País',
  required = false,
  error = false,
  helperText = '',
  size = 'medium',
  fullWidth = false,
  sx = {},
  ...props
}) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  const {
    selectedCountry,
    selectedCountryData,
    searchTerm,
    groupedCountries,
    flagColors,
    handleCountryChange,
    handleSearchChange,
  } = useCountrySelector(value)

  const handleSelectChange = (event) => {
    const countryCode = event.target.value
    handleCountryChange(countryCode)
    if (onChange) {
      onChange(event)
    }
  }

  const handleSearchTermChange = (event) => {
    handleSearchChange(event.target.value)
  }

  return (
    <FormControl
      variant="outlined"
      size={size}
      fullWidth={fullWidth}
      error={error}
      sx={sx}
      {...props}
    >
      <InputLabel required={required}>{label}</InputLabel>
      <Select
        value={selectedCountry}
        onChange={handleSelectChange}
        label={label}
        renderValue={(selected) => {
          if (selectedCountryData) {
            return (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {!isMobile && (
                  <FlagIcon
                    countryCode={selectedCountryData.code}
                    flagColors={flagColors}
                    size={20}
                  />
                )}
                <span>{selectedCountryData.name}</span>
              </Box>
            )
          }
          return selected
        }}
        MenuProps={{
          PaperProps: {
            style: {
              maxHeight: 300,
            },
          },
        }}
      >
        <ListSubheader>
          <TextField
            size="small"
            autoFocus
            placeholder="Buscar país..."
            fullWidth
            value={searchTerm}
            onChange={handleSearchTermChange}
            InputProps={{
              style: { fontSize: 14 },
            }}
            sx={{ mb: 1 }}
            onKeyDown={(e) => {
              if (e.key !== 'Escape') {
                e.stopPropagation()
              }
            }}
          />
        </ListSubheader>

        {Object.entries(groupedCountries).map(([region, countries]) => [
          <ListSubheader key={region} sx={{ fontWeight: 'bold' }}>
            {region}
          </ListSubheader>,
          ...countries.map((country) => (
            <MenuItem key={country.code} value={country.code} dense>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  fontSize: 14,
                }}
              >
                {!isMobile && (
                  <FlagIcon
                    countryCode={country.code}
                    flagColors={flagColors}
                    size={18}
                  />
                )}
                <span>{country.name}</span>
              </Box>
            </MenuItem>
          )),
        ])}
      </Select>
      {helperText && (
        <Box
          sx={{
            fontSize: 12,
            color: error ? 'error.main' : 'text.secondary',
            mt: 0.5,
            px: 1.5,
          }}
        >
          {helperText}
        </Box>
      )}
    </FormControl>
  )
}

export default CountrySelector
