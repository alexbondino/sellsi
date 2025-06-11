import React, { useState, useEffect } from 'react'
import {
  Box,
  IconButton,
  TextField,
  Typography,
  Stack,
  Tooltip,
} from '@mui/material'
import { Add as AddIcon, Remove as RemoveIcon } from '@mui/icons-material'

/**
 * ============================================================================
 * COMPONENTE QUANTITYSELECTOR UNIVERSAL - SELECTOR DE CANTIDAD REUTILIZABLE
 * ============================================================================
 *
 * Componente unificado que combina las mejores características de las versiones
 * anteriores de marketplace y buyer. Soporta múltiples configuraciones y casos de uso.
 *
 * CARACTERÍSTICAS:
 * - ✅ Orientación horizontal y vertical
 * - ✅ Múltiples tamaños (small, medium, large)
 * - ✅ Validación en tiempo real
 * - ✅ Indicador de stock opcional
 * - ✅ Tooltips informativos
 * - ✅ Personalización completa de estilos
 * - ✅ Accesibilidad mejorada
 *
 * @param {Object} props - Propiedades del componente
 * @param {number} props.value - Valor actual de cantidad
 * @param {Function} props.onChange - Función callback cuando cambia la cantidad
 * @param {number} [props.min=1] - Valor mínimo permitido
 * @param {number} [props.max=99] - Valor máximo permitido
 * @param {number} [props.step=1] - Incremento/decremento por paso
 * @param {boolean} [props.disabled=false] - Si el selector está deshabilitado
 * @param {boolean} [props.showStockLimit=false] - Si mostrar límite de stock
 * @param {'small'|'medium'|'large'} [props.size='medium'] - Tamaño del componente
 * @param {'horizontal'|'vertical'} [props.orientation='horizontal'] - Orientación
 * @param {Object} [props.sx={}] - Estilos personalizados del contenedor
 * @param {string} [props.label] - Etiqueta opcional para el selector
 * @param {string} [props.stockText] - Texto personalizado para mostrar stock
 */
const QuantitySelector = ({
  value,
  onChange,
  min = 1,
  max = 99,
  step = 1,
  disabled = false,
  showStockLimit = false,
  size = 'medium',
  orientation = 'horizontal',
  sx = {},
  label,
  stockText,
}) => {
  // Estado local para el input (permite validación en tiempo real)
  const [inputValue, setInputValue] = useState(value.toString())

  // Sincronizar estado local cuando cambia la prop
  useEffect(() => {
    setInputValue(value.toString())
  }, [value])

  // ============================================================================
  // HANDLERS DE EVENTOS
  // ============================================================================

  const handleIncrement = () => {
    const newValue = Math.min(value + step, max)
    if (newValue !== value) {
      onChange(newValue)
    }
  }

  const handleDecrement = () => {
    const newValue = Math.max(value - step, min)
    if (newValue !== value) {
      onChange(newValue)
    }
  }

  const handleInputChange = (event) => {
    const inputVal = event.target.value
    setInputValue(inputVal)

    // Validar solo si es un número válido
    const numValue = parseInt(inputVal)
    if (!isNaN(numValue) && numValue >= min && numValue <= max) {
      onChange(numValue)
    }
  }

  const handleInputBlur = () => {
    // Validar y corregir el valor al perder el foco
    let numValue = parseInt(inputValue)
    if (isNaN(numValue) || numValue < min) {
      numValue = min
    } else if (numValue > max) {
      numValue = max
    }

    setInputValue(numValue.toString())
    if (numValue !== value) {
      onChange(numValue)
    }
  }

  // ============================================================================
  // CONFIGURACIÓN DE ESTILOS POR TAMAÑO
  // ============================================================================

  const sizeConfig = {
    small: {
      buttonSize: 'small',
      inputWidth: 50,
      iconSize: 'small',
      spacing: 0.5,
    },
    medium: {
      buttonSize: 'medium',
      inputWidth: 70,
      iconSize: 'medium',
      spacing: 1,
    },
    large: {
      buttonSize: 'large',
      inputWidth: 90,
      iconSize: 'large',
      spacing: 1.5,
    },
  }

  const config = sizeConfig[size]
  const isMinReached = value <= min
  const isMaxReached = value >= max

  // ============================================================================
  // COMPONENTES INTERNOS
  // ============================================================================

  const DecrementButton = () => (
    <Tooltip title={isMinReached ? `Mínimo: ${min}` : `Disminuir cantidad`}>
      <span>
        <IconButton
          onClick={handleDecrement}
          disabled={disabled || isMinReached}
          size={config.buttonSize}
          sx={{
            border: '1px solid',
            borderColor: 'grey.300',
            '&:hover': {
              borderColor: 'primary.main',
              bgcolor: 'primary.50',
            },
            '&:disabled': {
              borderColor: 'grey.200',
            },
          }}
        >
          <RemoveIcon fontSize={config.iconSize} />
        </IconButton>
      </span>
    </Tooltip>
  )

  const IncrementButton = () => (
    <Tooltip title={isMaxReached ? `Máximo: ${max}` : `Aumentar cantidad`}>
      <span>
        <IconButton
          onClick={handleIncrement}
          disabled={disabled || isMaxReached}
          size={config.buttonSize}
          sx={{
            border: '1px solid',
            borderColor: 'grey.300',
            '&:hover': {
              borderColor: 'primary.main',
              bgcolor: 'primary.50',
            },
            '&:disabled': {
              borderColor: 'grey.200',
            },
          }}
        >
          <AddIcon fontSize={config.iconSize} />
        </IconButton>
      </span>
    </Tooltip>
  )

  const QuantityInput = () => (
    <TextField
      value={inputValue}
      onChange={handleInputChange}
      onBlur={handleInputBlur}
      disabled={disabled}
      size={size === 'large' ? 'medium' : 'small'}
      inputProps={{
        min: min,
        max: max,
        step: step,
        style: {
          textAlign: 'center',
          width: config.inputWidth,
          padding: size === 'small' ? '4px' : '8px',
        },
        'aria-label': 'Cantidad',
      }}
      sx={{
        '& .MuiOutlinedInput-root': {
          '&:hover fieldset': {
            borderColor: 'primary.main',
          },
        },
      }}
    />
  )

  // ============================================================================
  // RENDERIZADO CONDICIONAL POR ORIENTACIÓN
  // ============================================================================

  if (orientation === 'vertical') {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: config.spacing,
          ...sx,
        }}
      >
        {label && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {label}
          </Typography>
        )}

        <IncrementButton />
        <QuantityInput />
        <DecrementButton />

        {showStockLimit && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
            {stockText || `${max} disponibles`}
          </Typography>
        )}
      </Box>
    )
  }

  // Orientación horizontal (default)
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        ...sx,
      }}
    >
      {label && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          {label}
        </Typography>
      )}

      <Stack direction="row" spacing={config.spacing} alignItems="center">
        <DecrementButton />
        <QuantityInput />
        <IncrementButton />
      </Stack>

      {showStockLimit && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
          {stockText || `${max} disponibles`}
        </Typography>
      )}
    </Box>
  )
}

export default QuantitySelector
