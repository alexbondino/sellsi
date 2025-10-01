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
  const [isEditing, setIsEditing] = useState(false)
  const isEditingRef = React.useRef(false) // Ref para control inmediato
  const inputRef = React.useRef(null) // Ref para el input
  
  // Sincronizar estado local cuando cambia la prop - SOLO si no está editando
  useEffect(() => {
    if (!isEditing && !isEditingRef.current) {
      const newValueString = value.toString();
      if (inputValue !== newValueString) {
        setInputValue(newValueString);
      }
    }
  }, [value, isEditing, inputValue]);

  // ============================================================================
  // HANDLERS DE EVENTOS
  // ============================================================================
  
  // Handlers optimizados con useCallback
  const handleIncrement = React.useCallback(() => {
    const newValue = Math.min(value + step, max)
    if (newValue !== value) {
      onChange(newValue)
    }
  }, [value, step, max, onChange])

  const handleDecrement = React.useCallback(() => {
    const newValue = Math.max(value - step, min)
    if (newValue !== value) {
      onChange(newValue)
    }
  }, [value, step, min, onChange])

  const handleInputChange = React.useCallback((event) => {
    const inputVal = event.target.value
    isEditingRef.current = true // Inmediatamente marcar en la ref
    setInputValue(inputVal)
    setIsEditing(true) // Marcar que está editando
  }, [])

  const handleInputBlur = React.useCallback(() => {
    isEditingRef.current = false // Inmediatamente limpiar la ref
    setIsEditing(false) // Ya no está editando
    // Al perder foco, permitir cualquier valor durante edición, 
    // pero corregir automáticamente si es menor al mínimo
    let numValue = parseInt(inputValue)
    if (isNaN(numValue) || numValue < 1) {
      // Si no es un número válido o es menor a 1, usar el mínimo
      numValue = min
    } else if (numValue > max) {
      // Si excede el máximo, usar el máximo
      numValue = max
    } else if (numValue < min) {
      // Si es menor al mínimo, corregir automáticamente al mínimo
      numValue = min
    }
    
    setInputValue(numValue.toString())
    if (numValue !== value) {
      onChange(numValue)
    }
  }, [inputValue, min, max, value, onChange])

  const handleInputFocus = React.useCallback(() => {
    isEditingRef.current = true
    setIsEditing(true)
  }, [])

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
  
  // Memoizar valores para evitar cálculos en cada render
  const isMinReached = React.useMemo(() => value <= min, [value, min])
  const isMaxReached = React.useMemo(() => value >= max, [value, max])

  // ============================================================================
  // COMPONENTES INTERNOS
  // ============================================================================

  const DecrementButton = () => (
    <Tooltip title={isMinReached ? `Mínimo: ${min}` : `Disminuir cantidad`} placement="left">
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
    <Tooltip title={isMaxReached ? `Máximo: ${max}` : `Aumentar cantidad`} placement="right">
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

  // Memoizar el componente QuantityInput para evitar re-creaciones que causen pérdida de foco
  const QuantityInput = React.useMemo(() => (
    <TextField
      ref={inputRef}
      value={inputValue}
      onChange={handleInputChange}
      onFocus={handleInputFocus}
      onBlur={handleInputBlur}
      disabled={disabled}
      size={size === 'large' ? 'medium' : 'small'}
      inputProps={{
        min: min,
        max: max,
        step: step,
        type: 'number',
        style: {
          textAlign: 'center',
          width: config.inputWidth,
          padding: size === 'small' ? '4px' : '8px',
          cursor: disabled ? 'default' : 'text',
        },
        'aria-label': 'Cantidad',
      }}
      sx={{
        '& .MuiOutlinedInput-root': {
          '&:hover fieldset': {
            borderColor: disabled ? 'grey.300' : 'primary.main',
          },
        },
        '& .MuiInputBase-input': {
          cursor: disabled ? 'default' : 'text',
          // Ocultar las flechas de incremento/decremento del input number
          '&::-webkit-outer-spin-button, &::-webkit-inner-spin-button': {
            WebkitAppearance: 'none',
            margin: 0,
          },
          '&[type=number]': {
            MozAppearance: 'textfield', // Firefox
          },
        },
      }}
    />
  ), [
    inputValue, 
    handleInputChange, 
    handleInputFocus, 
    handleInputBlur, 
    disabled, 
    size, 
    config.inputWidth, 
    min, 
    max, 
    step
  ])

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
        {QuantityInput}
        <DecrementButton />

        {showStockLimit && stockText && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
            {stockText}
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
        {QuantityInput}
        <IncrementButton />
      </Stack>

      {showStockLimit && stockText && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
          {stockText}
        </Typography>
      )}
    </Box>
  )
}

export default QuantitySelector
