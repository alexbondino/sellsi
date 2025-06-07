import React from 'react'
import { Box, IconButton, TextField, Typography, Tooltip } from '@mui/material'
import { Add as AddIcon, Remove as RemoveIcon } from '@mui/icons-material'

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
}) => {
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
    const inputValue = parseInt(event.target.value) || min
    const clampedValue = Math.max(min, Math.min(max, inputValue))
    if (clampedValue !== value) {
      onChange(clampedValue)
    }
  }

  const isMinReached = value <= min
  const isMaxReached = value >= max

  const buttonSize = size === 'small' ? 'small' : 'medium'
  const inputWidth = size === 'small' ? 60 : 80

  if (orientation === 'vertical') {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          ...sx,
        }}
      >
        {' '}
        <Tooltip title={isMaxReached ? `Máximo ${max}` : 'Aumentar cantidad'}>
          <span>
            <IconButton
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                handleIncrement()
              }}
              disabled={disabled || isMaxReached}
              size={buttonSize}
              color="primary"
              sx={{
                userSelect: 'none',
                touchAction: 'manipulation',
                transition: 'all 0.1s ease',
                '&:active': {
                  transform: 'scale(0.95)',
                },
              }}
            >
              <AddIcon />
            </IconButton>
          </span>
        </Tooltip>
        <TextField
          value={value}
          onChange={handleInputChange}
          disabled={disabled}
          size={size}
          type="number"
          inputProps={{
            min,
            max,
            style: { textAlign: 'center' },
          }}
          sx={{
            width: inputWidth,
            my: 1,
            '& .MuiInputBase-input': {
              padding: size === 'small' ? '4px' : '8px',
              userSelect: 'text',
            },
          }}
        />
        <Tooltip title={isMinReached ? `Mínimo ${min}` : 'Disminuir cantidad'}>
          <span>
            <IconButton
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                handleDecrement()
              }}
              disabled={disabled || isMinReached}
              size={buttonSize}
              color="primary"
              sx={{
                userSelect: 'none',
                touchAction: 'manipulation',
                transition: 'all 0.1s ease',
                '&:active': {
                  transform: 'scale(0.95)',
                },
              }}
            >
              <RemoveIcon />
            </IconButton>
          </span>
        </Tooltip>
        {showStockLimit && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
            Máx: {max}
          </Typography>
        )}
      </Box>
    )
  }

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        ...sx,
      }}
    >
      <Tooltip title={isMinReached ? `Mínimo ${min}` : 'Disminuir cantidad'}>
        <span>
          <IconButton
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              handleDecrement()
            }}
            disabled={disabled || isMinReached}
            size={buttonSize}
            color="primary"
            sx={{
              userSelect: 'none',
              touchAction: 'manipulation',
              transition: 'all 0.1s ease',
              '&:active': {
                transform: 'scale(0.95)',
              },
            }}
          >
            <RemoveIcon />
          </IconButton>
        </span>
      </Tooltip>

      <TextField
        value={value}
        onChange={handleInputChange}
        disabled={disabled}
        size={size}
        type="number"
        inputProps={{
          min,
          max,
          style: { textAlign: 'center' },
        }}
        sx={{
          width: inputWidth,
          '& .MuiInputBase-input': {
            padding: size === 'small' ? '4px 8px' : '8px 12px',
            userSelect: 'text',
          },
        }}
      />

      <Tooltip title={isMaxReached ? `Máximo ${max}` : 'Aumentar cantidad'}>
        <span>
          <IconButton
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              handleIncrement()
            }}
            disabled={disabled || isMaxReached}
            size={buttonSize}
            color="primary"
            sx={{
              userSelect: 'none',
              touchAction: 'manipulation',
              transition: 'all 0.1s ease',
              '&:active': {
                transform: 'scale(0.95)',
              },
            }}
          >
            <AddIcon />
          </IconButton>
        </span>
      </Tooltip>

      {showStockLimit && (
        <Typography variant="caption" color="text.secondary">
          / {max}
        </Typography>
      )}
    </Box>
  )
}

export default QuantitySelector
