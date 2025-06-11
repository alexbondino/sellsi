/**
 * ============================================================================
 * ⚠️  ARCHIVO OBSOLETO - NO USAR
 * ============================================================================
 *
 * Este archivo ha sido reemplazado por el componente universal:
 * /src/components/shared/QuantitySelector.jsx
 *
 * MIGRACIÓN: Verificar si este archivo se usa en algún lugar antes de eliminar
 *
 * TODO: Eliminar este archivo una vez confirmado que no rompe nada
 *
 * FECHA DE DEPRECACIÓN: 2024-12-23
 */

import React, { useState } from 'react'
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
 * Componente compartido para selector de cantidad
 * @param {Object} props
 * @param {number} props.quantity - Cantidad actual
 * @param {number} props.min - Cantidad mínima (default: 1)
 * @param {number} props.max - Cantidad máxima
 * @param {function} props.onChange - Función callback cuando cambia la cantidad
 * @param {boolean} props.disabled - Si está deshabilitado
 * @param {string} props.size - Tamaño ('small', 'medium', 'large')
 */
const QuantitySelector = ({
  quantity,
  min = 1,
  max,
  onChange,
  disabled = false,
  size = 'medium',
}) => {
  const [inputValue, setInputValue] = useState(quantity.toString())

  const handleInputChange = (event) => {
    const value = event.target.value
    setInputValue(value)

    const numValue = parseInt(value)
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
    if (numValue !== quantity) {
      onChange(numValue)
    }
  }

  const handleDecrease = () => {
    if (quantity > min) {
      const newQuantity = quantity - 1
      onChange(newQuantity)
      setInputValue(newQuantity.toString())
    }
  }

  const handleIncrease = () => {
    if (quantity < max) {
      const newQuantity = quantity + 1
      onChange(newQuantity)
      setInputValue(newQuantity.toString())
    }
  }

  const sizeProps = {
    small: {
      iconSize: 'small',
      textFieldSize: 'small',
      iconButtonSize: 32,
      textFieldWidth: 60,
    },
    medium: {
      iconSize: 'medium',
      textFieldSize: 'medium',
      iconButtonSize: 40,
      textFieldWidth: 80,
    },
    large: {
      iconSize: 'large',
      textFieldSize: 'medium',
      iconButtonSize: 48,
      textFieldWidth: 100,
    },
  }

  const props = sizeProps[size]

  return (
    <Box>
      <Stack direction="row" spacing={1} alignItems="center">
        <Tooltip title="Disminuir cantidad">
          <span>
            <IconButton
              onClick={handleDecrease}
              disabled={disabled || quantity <= min}
              size={props.iconSize}
              sx={{
                width: props.iconButtonSize,
                height: props.iconButtonSize,
                border: '1px solid',
                borderColor: 'divider',
                '&:hover': {
                  borderColor: 'primary.main',
                  backgroundColor: 'primary.light',
                },
              }}
            >
              <RemoveIcon />
            </IconButton>
          </span>
        </Tooltip>

        <TextField
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          disabled={disabled}
          size={props.textFieldSize}
          inputProps={{
            style: { textAlign: 'center' },
            min,
            max,
          }}
          sx={{
            width: props.textFieldWidth,
            '& .MuiOutlinedInput-root': {
              '& fieldset': {
                borderColor: 'divider',
              },
              '&:hover fieldset': {
                borderColor: 'primary.main',
              },
            },
          }}
        />

        <Tooltip title="Aumentar cantidad">
          <span>
            <IconButton
              onClick={handleIncrease}
              disabled={disabled || quantity >= max}
              size={props.iconSize}
              sx={{
                width: props.iconButtonSize,
                height: props.iconButtonSize,
                border: '1px solid',
                borderColor: 'divider',
                '&:hover': {
                  borderColor: 'primary.main',
                  backgroundColor: 'primary.light',
                },
              }}
            >
              <AddIcon />
            </IconButton>
          </span>
        </Tooltip>
      </Stack>

      {max && (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: 'block', textAlign: 'center', mt: 0.5 }}
        >
          Máximo: {max}
        </Typography>
      )}
    </Box>
  )
}

export default QuantitySelector
