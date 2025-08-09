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
import { useCountrySelector } from './useCountrySelector'
// Flags (SVG) via flag-icons
import 'flag-icons/css/flag-icons.min.css'

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

// Componente para renderizar banderas SVG reales (flag-icons)
const FlagIcon = ({ countryCode, size = 20, title }) => {
  const code = (countryCode || '').toLowerCase()
  return (
    <Box
      component="span"
      className={`fi fi-${code}`}
      title={title || countryCode}
      sx={{
        width: size * 1.5,
        height: size,
        borderRadius: 1,
        boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
        display: 'inline-block',
        flexShrink: 0,
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
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, fontSize: 12 }}>
                {!isMobile && (
                  <FlagIcon countryCode={selectedCountryData.code} size={16} title={selectedCountryData.name} />
                )}
                <span style={{ fontSize: 13 }}>{selectedCountryData.name}</span>
              </Box>
            )
          }
          return selected
        }}
        MenuProps={{
          disableScrollLock: true,
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
                  fontSize: 12,
                }}
              >
                {!isMobile && (
                  <FlagIcon countryCode={country.code} size={14} title={country.name} />
                )}
                <span style={{ fontSize: 12 }}>{country.name}</span>
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
