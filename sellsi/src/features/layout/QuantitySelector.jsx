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
import QuantityInputModal from './QuantityInputModal'

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
  
  // Estado para controlar el modal de input directo
  const [showInputModal, setShowInputModal] = useState(false)

  // Sincronizar estado local cuando cambia la prop
  useEffect(() => {
    setInputValue(value.toString())
  }, [value])

  // ============================================================================
  // HANDLERS DE EVENTOS
  // ============================================================================
  // ===== OPTIMIZACIONES DE RENDIMIENTO =====
  
  // Memoizar validaciones para evitar recálculos
  const validations = React.useMemo(() => ({
    isMinDisabled: value <= min,
    isMaxDisabled: value >= max,
    hasError: isNaN(parseInt(inputValue)) || parseInt(inputValue) < min,
    isInputValid: !isNaN(parseInt(inputValue)) && parseInt(inputValue) >= min && parseInt(inputValue) <= max
  }), [value, min, max, inputValue])

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
    setInputValue(inputVal)
    // Solo llamar onChange si es un número válido dentro de rango
    const numValue = parseInt(inputVal)
    if (!isNaN(numValue)) {
      onChange(numValue)
    }
  }, [onChange])

  const handleInputBlur = React.useCallback(() => {
    // Al perder foco, corregir a mínimo si está vacío o menor
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
  }, [inputValue, min, max, value, onChange])

  // Handler para abrir el modal de input directo
  const handleInputClick = React.useCallback(() => {
    if (!disabled) {
      setShowInputModal(true)
    }
  }, [disabled])

  // Handler para confirmar el valor del modal
  const handleModalConfirm = React.useCallback((newValue) => {
    onChange(newValue)
    setInputValue(newValue.toString())
  }, [onChange])

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
      onClick={handleInputClick}
      disabled={disabled}
      size={size === 'large' ? 'medium' : 'small'}
      inputProps={{
        min: min,
        max: max,
        step: step,
        readOnly: true, // Hacer el input de solo lectura para forzar uso del modal
        style: {
          textAlign: 'center',
          width: config.inputWidth,
          padding: size === 'small' ? '4px' : '8px',
          cursor: disabled ? 'default' : 'pointer',
        },
        'aria-label': 'Cantidad - Click para editar',
      }}
      error={parseInt(inputValue) < min}
      helperText={parseInt(inputValue) < min ? `Mínimo ${min}` : ''}
      sx={{
        '& .MuiOutlinedInput-root': {
          '&:hover fieldset': {
            borderColor: disabled ? 'grey.300' : 'primary.main',
          },
          cursor: disabled ? 'default' : 'pointer',
        },
        '& .MuiInputBase-input': {
          cursor: disabled ? 'default' : 'pointer',
        },
      }}
    />
  )

  // ============================================================================
  // RENDERIZADO CONDICIONAL POR ORIENTACIÓN
  // ============================================================================

  if (orientation === 'vertical') {
    return (
      <>
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

          {showStockLimit && stockText && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
              {stockText}
            </Typography>
          )}
        </Box>

        {/* Modal para input directo de cantidad */}
        <QuantityInputModal
          open={showInputModal}
          onClose={() => setShowInputModal(false)}
          onConfirm={handleModalConfirm}
          currentValue={value}
          min={min}
          max={max}
          title="Ingrese la cantidad"
        />
      </>
    )
  }

  // Orientación horizontal (default)
  return (
    <>
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

        {showStockLimit && stockText && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
            {stockText}
          </Typography>
        )}
      </Box>

      {/* Modal para input directo de cantidad */}
      <QuantityInputModal
        open={showInputModal}
        onClose={() => setShowInputModal(false)}
        onConfirm={handleModalConfirm}
        currentValue={value}
        min={min}
        max={max}
        title="Ingrese la cantidad"
      />
    </>
  )
}

export default QuantitySelector
