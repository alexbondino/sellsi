import React, { useState, useMemo } from 'react'
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

// Componente para renderizar banderas como círculos con colores (solo para desktop)
const FlagIcon = ({ countryCode, size = 20 }) => {
  const flagColors = {
    CL: ['#0033A0', '#ffffff', '#DA020E'], // Chile: azul marino oficial, blanco puro, rojo oficial
    AR: ['#75aadb', '#ffffff', '#75aadb'], // Argentina: celeste, blanco, celeste
    PE: ['#d52b1e', '#ffffff'], // Perú: rojo, blanco (simplificado)
    CO: ['#fcdd09', '#003893', '#ce1126'], // Colombia: amarillo, azul, rojo
    MX: ['#006847', '#ffffff', '#ce1126'], // México: verde, blanco, rojo
    ES: ['#c60b1e', '#ffc400'], // España: rojo, amarillo (simplificado)
    US: ['#B22234', '#ffffff', '#3C3B6E'], // Estados Unidos: rojo oficial, blanco, azul oficial
    EC: ['#ffdd00', '#0072ce', '#ef3340'], // Ecuador: amarillo, azul, rojo
    BO: ['#d52b1e', '#ffdd00', '#007934'], // Bolivia: rojo, amarillo, verde
    UY: ['#0038a8', '#ffffff', '#0038a8'], // Uruguay: azul, blanco, azul
    PY: ['#d52b1e', '#ffffff', '#0038a8'], // Paraguay: rojo, blanco, azul
    VE: ['#ffcc00', '#003893', '#cf142b'], // Venezuela: amarillo, azul, rojo
    BR: ['#009739', '#ffdf00'], // Brasil: verde, amarillo (simplificado)
    GT: ['#4997d0', '#ffffff'], // Guatemala: azul, blanco (simplificado)
    CR: ['#0038a8', '#ffffff', '#ce1126'], // Costa Rica: azul, blanco, rojo
    PA: ['#ffffff', '#da020e', '#0073ce'], // Panamá: blanco, rojo, azul
  }

  const colors = flagColors[countryCode] || ['#cccccc', '#999999'] // Diseño especial para Chile con proporción 3:2 correcta
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
        {/* Franja superior derecha - Blanca (2/3 del ancho, 1/2 del alto) */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '66.66%', // 2/3 del ancho total
            height: '50%', // 1/2 del alto total
            backgroundColor: colors[1], // blanco
            borderTopRightRadius: '50%',
          }}
        />

        {/* Cuadro superior izquierdo - Azul (1/3 del ancho, 1/2 del alto) */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '33.33%', // 1/3 del ancho total
            height: '50%', // 1/2 del alto total
            backgroundColor: colors[0], // azul
            borderTopLeftRadius: '50%',
          }}
        />

        {/* Estrella blanca de 5 puntas centrada en el cuadro azul */}
        <Box
          sx={{
            position: 'absolute',
            top: '25%', // Centro vertical del cuadro azul
            left: '16.65%', // Centro horizontal del cuadro azul (33.33% / 2)
            width: '5px',
            height: '5px',
            backgroundColor: colors[1], // blanco
            clipPath:
              'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
            transform: 'translate(-50%, -50%) scale(0.8)',
          }}
        />

        {/* Efecto de brillo sutil en la estrella */}
        <Box
          sx={{
            position: 'absolute',
            top: '25%',
            left: '16.65%',
            width: '6px',
            height: '6px',
            background: `radial-gradient(circle, ${colors[1]}60, transparent 70%)`,
            borderRadius: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        />

        {/* Franja inferior completa - Roja (ya es el fondo, pero aseguramos cobertura) */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: '100%', // Todo el ancho
            height: '50%', // 1/2 del alto total
            backgroundColor: colors[2], // rojo
            borderBottomLeftRadius: '50%',
            borderBottomRightRadius: '50%',
          }}
        />
      </Box>
    )
  }

  // Diseño especial para Estados Unidos con efecto de estrellas y rayas
  if (countryCode === 'US') {
    return (
      <Box
        sx={{
          width: size,
          height: size,
          borderRadius: '50%',
          position: 'relative',
          background: `repeating-linear-gradient(
            0deg,
            ${colors[0]} 0px,
            ${colors[0]} 1px,
            ${colors[1]} 1px,
            ${colors[1]} 2px
          )`,
          border: '1px solid #e0e0e0',
          flexShrink: 0,
          display: 'inline-block',
          overflow: 'hidden',
        }}
      >
        {/* Rectángulo azul en la esquina superior izquierda */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '45%',
            height: '55%',
            backgroundColor: colors[2], // azul
            borderTopLeftRadius: '50%',
          }}
        />
        {/* Punto blanco simbólico para las estrellas */}
        <Box
          sx={{
            position: 'absolute',
            top: '20%',
            left: '20%',
            width: '2px',
            height: '2px',
            backgroundColor: colors[1], // blanco
            borderRadius: '50%',
          }}
        />
      </Box>
    )
  }

  // Diseño especial para Panamá con cuadrantes
  if (countryCode === 'PA') {
    return (
      <Box
        sx={{
          width: size,
          height: size,
          borderRadius: '50%',
          position: 'relative',
          backgroundColor: colors[0], // blanco base
          border: '1px solid #e0e0e0',
          flexShrink: 0,
          display: 'inline-block',
          overflow: 'hidden',
        }}
      >
        {/* Cuadrante superior izquierdo - Blanco (ya es el fondo) */}

        {/* Cuadrante superior derecho - Rojo */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '50%',
            height: '50%',
            backgroundColor: colors[1], // rojo
            borderTopRightRadius: '50%',
          }}
        />

        {/* Cuadrante inferior izquierdo - Azul */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: '50%',
            height: '50%',
            backgroundColor: colors[2], // azul
            borderBottomLeftRadius: '50%',
          }}
        />

        {/* Cuadrante inferior derecho - Blanco (ya es el fondo) */}

        {/* Estrella azul en cuadrante superior izquierdo */}
        <Box
          sx={{
            position: 'absolute',
            top: '20%',
            left: '20%',
            width: '4px',
            height: '4px',
            backgroundColor: colors[2], // azul
            clipPath:
              'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
            transform: 'scale(0.6)',
          }}
        />

        {/* Estrella roja en cuadrante inferior derecho */}
        <Box
          sx={{
            position: 'absolute',
            bottom: '20%',
            right: '20%',
            width: '4px',
            height: '4px',
            backgroundColor: colors[1], // rojo
            clipPath:
              'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
            transform: 'scale(0.6)',
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

const COUNTRIES = [
  { code: 'CL', name: 'Chile', flag: '🇨🇱', phoneCode: '+56' },
  { code: 'AR', name: 'Argentina', flag: '🇦🇷', phoneCode: '+54' },
  { code: 'PE', name: 'Perú', flag: '🇵🇪', phoneCode: '+51' },
  { code: 'CO', name: 'Colombia', flag: '🇨🇴', phoneCode: '+57' },
  { code: 'MX', name: 'México', flag: '🇲🇽', phoneCode: '+52' },
  { code: 'ES', name: 'España', flag: '🇪🇸', phoneCode: '+34' },
  { code: 'US', name: 'Estados Unidos', flag: '🇺🇸', phoneCode: '+1' },
  { code: 'EC', name: 'Ecuador', flag: '🇪🇨', phoneCode: '+593' },
  { code: 'BO', name: 'Bolivia', flag: '🇧🇴', phoneCode: '+591' },
  { code: 'UY', name: 'Uruguay', flag: '🇺🇾', phoneCode: '+598' },
  { code: 'PY', name: 'Paraguay', flag: '🇵🇾', phoneCode: '+595' },
  { code: 'VE', name: 'Venezuela', flag: '🇻🇪', phoneCode: '+58' },
  { code: 'BR', name: 'Brasil', flag: '🇧🇷', phoneCode: '+55' },
  { code: 'GT', name: 'Guatemala', flag: '🇬🇹', phoneCode: '+502' },
  { code: 'CR', name: 'Costa Rica', flag: '🇨🇷', phoneCode: '+506' },
  { code: 'PA', name: 'Panamá', flag: '🇵🇦', phoneCode: '+507' },
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
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md')) // Detectar si es móvil

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
                {isMobile ? (
                  <span>{country.flag}</span>
                ) : (
                  <FlagIcon countryCode={country.code} size={20} />
                )}
                <span>{country.phoneCode}</span>
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
        </ListSubheader>{' '}
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
              {isMobile ? (
                <span>{country.flag}</span>
              ) : (
                <FlagIcon countryCode={country.code} size={18} />
              )}
              <span>{country.phoneCode}</span>
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
