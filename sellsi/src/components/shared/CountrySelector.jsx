import React, { useState, useMemo } from 'react'
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Box,
  ListSubheader,
} from '@mui/material'

const COUNTRIES = [
  { code: 'CL', name: 'Chile', flag: '🇨🇱' },
  { code: 'AR', name: 'Argentina', flag: '🇦🇷' },
  { code: 'PE', name: 'Perú', flag: '🇵🇪' },
  { code: 'CO', name: 'Colombia', flag: '🇨🇴' },
  { code: 'MX', name: 'México', flag: '🇲🇽' },
  { code: 'ES', name: 'España', flag: '🇪🇸' },
  { code: 'US', name: 'Estados Unidos', flag: '🇺🇸' },
  { code: 'EC', name: 'Ecuador', flag: '🇪🇨' },
  { code: 'BO', name: 'Bolivia', flag: '🇧🇴' },
  { code: 'UY', name: 'Uruguay', flag: '🇺🇾' },
  { code: 'PY', name: 'Paraguay', flag: '🇵🇾' },
  { code: 'VE', name: 'Venezuela', flag: '🇻🇪' },
  { code: 'BR', name: 'Brasil', flag: '🇧🇷' },
  { code: 'GT', name: 'Guatemala', flag: '🇬🇹' },
  { code: 'CR', name: 'Costa Rica', flag: '🇨🇷' },
  { code: 'PA', name: 'Panamá', flag: '🇵🇦' },
]

const CountrySelector = ({
  value,
  onChange,
  error,
  helperText,
  size = 'small',
  fullWidth = true,
  label = 'País',
  ...props
}) => {
  const [searchTerm, setSearchTerm] = useState('')

  const filteredCountries = useMemo(() => {
    if (!searchTerm) return COUNTRIES
    return COUNTRIES.filter(
      (country) =>
        country.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        country.code.includes(searchTerm)
    )
  }, [searchTerm])

  const selectedCountry = COUNTRIES.find((country) => country.name === value)

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value)
  }

  return (
    <FormControl
      variant="outlined"
      size={size}
      fullWidth={fullWidth}
      error={error}
      {...props}
    >
      <InputLabel>{label}</InputLabel>
      <Select
        value={value}
        onChange={onChange}
        label={label}
        renderValue={(selected) => {
          const country = COUNTRIES.find((c) => c.name === selected)
          if (country) {
            return (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <span>{country.flag}</span>
                <span>{country.code}</span>
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
            onChange={handleSearchChange}
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
        {filteredCountries.map((country) => (
          <MenuItem key={country.name} value={country.name} dense>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                fontSize: 14,
              }}
            >
              <span>{country.flag}</span>
              <span>{country.code}</span>
              <span>{country.name}</span>
            </Box>
          </MenuItem>
        ))}
      </Select>
      {helperText && (
        <Box
          sx={{
            fontSize: 12,
            color: error ? 'error.main' : 'text.secondary',
            mt: 0.5,
          }}
        >
          {helperText}
        </Box>
      )}
    </FormControl>
  )
}

export default CountrySelector
