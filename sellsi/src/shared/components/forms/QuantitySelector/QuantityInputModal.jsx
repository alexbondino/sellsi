import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  Box,
} from '@mui/material'
import { motion, AnimatePresence } from 'framer-motion'

/**
 * Modal para entrada directa de cantidad
 * Se abre cuando el usuario hace clic en el input del QuantitySelector
 */
const QuantityInputModal = ({
  open,
  onClose,
  onConfirm,
  currentValue,
  min = 1,
  max = 99,
  title = "Ingrese la cantidad",
}) => {
  const [inputValue, setInputValue] = useState('')
  const [error, setError] = useState('')

  // Sincronizar valor actual cuando se abre el modal
  useEffect(() => {
    if (open) {
      setInputValue(currentValue.toString())
      setError('')
    }
  }, [open, currentValue])

  // Validar input
  const validateInput = (value) => {
    const numValue = parseInt(value)
    
    if (isNaN(numValue)) {
      return 'Debe ingresar un número válido'
    }
    
    if (numValue < min) {
      return `La cantidad mínima es ${min}`
    }
    
    if (numValue > max) {
      return `La cantidad máxima es ${max}`
    }
    
    return ''
  }

  const handleInputChange = (event) => {
    const value = event.target.value
    setInputValue(value)
    setError(validateInput(value))
  }

  const handleConfirm = () => {
    const numValue = parseInt(inputValue)
    const validationError = validateInput(inputValue)
    
    if (validationError) {
      setError(validationError)
      return
    }
    
    onConfirm(numValue)
    onClose()
  }

  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && !error && inputValue) {
      handleConfirm()
    }
    if (event.key === 'Escape') {
      onClose()
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <Dialog
          open={open}
          onClose={onClose}
          maxWidth="xs"
          fullWidth={false}
          disableScrollLock={true}
          PaperComponent={motion.div}
          PaperProps={{
            initial: { scale: 0.8, opacity: 0 },
            animate: { scale: 1, opacity: 1 },
            exit: { scale: 0.8, opacity: 0 },
            transition: { duration: 0.2 },
            style: {
              borderRadius: 16,
              padding: 8,
              backgroundColor: '#ffffff',
              backgroundImage: 'none',
            },
          }}
          sx={{
            '& .MuiDialog-paper': {
              backgroundColor: '#ffffff',
              backgroundImage: 'none',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
              border: '1px solid rgba(0, 0, 0, 0.1)',
              width: '250px', // Solo aquí definimos el ancho
            },
            '& .MuiBackdrop-root': {
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
            },
          }}
        >
          <DialogTitle sx={{ 
            textAlign: 'center', 
            pb: 1,
            backgroundColor: '#ffffff',
            color: '#1976d2',
            fontWeight: 'bold',
          }}>
            <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
              {title}
            </Typography>
          </DialogTitle>
          
          <DialogContent sx={{ 
            pt: 1,
            backgroundColor: '#ffffff',
          }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                autoFocus
                fullWidth
                type="number"
                placeholder="Ingrese cantidad"
                value={inputValue}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                error={!!error}
                helperText={error || `Rango: ${min} - ${max} unidades`}
                inputProps={{
                  min: min,
                  max: max,
                  style: { textAlign: 'center' },
                }}
                sx={{
                  backgroundColor: '#ffffff',
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: '#ffffff',
                    '& fieldset': {
                      borderColor: 'primary.main',
                    },
                    '&:hover fieldset': {
                      borderColor: 'primary.dark',
                    },
                  },
                  // Ocultar las flechas del input number
                  '& input[type=number]': {
                    MozAppearance: 'textfield',
                  },
                  '& input[type=number]::-webkit-outer-spin-button': {
                    WebkitAppearance: 'none',
                    margin: 0,
                  },
                  '& input[type=number]::-webkit-inner-spin-button': {
                    WebkitAppearance: 'none',
                    margin: 0,
                  },
                }}
              />
            </Box>
          </DialogContent>
          
          <DialogActions sx={{ 
            justifyContent: 'center', 
            gap: 1, 
            pt: 1,
            backgroundColor: '#ffffff',
          }}>
            <Button
              onClick={onClose}
              variant="outlined"
              color="inherit"
              sx={{ minWidth: 80 }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirm}
              variant="contained"
              disabled={!!error || !inputValue}
              sx={{ minWidth: 80 }}
            >
              OK
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </AnimatePresence>
  )
}

export default QuantityInputModal
