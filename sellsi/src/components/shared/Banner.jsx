import React, { useState, useEffect } from 'react'
import { Alert, Slide, Box } from '@mui/material'

/**
 * Componente Banner reutilizable que muestra mensajes temporales
 * Se posiciona debajo del TopBar y desaparece automáticamente
 */
const Banner = ({
  message,
  severity = 'success', // 'success', 'info', 'warning', 'error'
  duration = 6000, // 6 segundos por defecto
  show = false,
  onClose,
  position = 'top', // 'top' o 'bottom'
}) => {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (show) {
      setIsVisible(true)

      // Auto-cerrar después del tiempo especificado
      const timer = setTimeout(() => {
        setIsVisible(false)
        setTimeout(() => {
          onClose?.()
        }, 300) // Esperar a que termine la animación
      }, duration)

      return () => clearTimeout(timer)
    } else {
      setIsVisible(false)
    }
  }, [show, duration, onClose])

  if (!show) return null
  return (
    <Box
      sx={{
        position: 'fixed',
        top: position === 'top' ? { xs: 72, md: 80 } : 'auto', // Más separado del TopBar
        bottom: position === 'bottom' ? 0 : 'auto',
        left: '50%',
        transform: 'translateX(-50%)', // Centrar horizontalmente
        zIndex: 1200, // Por encima del TopBar (1100)
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      <Slide direction="down" in={isVisible} timeout={300}>
        <Alert
          variant="filled"
          severity={severity}
          onClose={() => {
            setIsVisible(false)
            setTimeout(() => {
              onClose?.()
            }, 300)
          }}
          sx={{
            minWidth: 'fit-content',
            maxWidth: '90vw', // Máximo 90% del ancho de la ventana
            borderRadius: 2, // Bordes redondeados
            fontSize: 16,
            fontWeight: 600,
            px: 3, // Padding horizontal
            py: 1.5, // Padding vertical
            boxShadow: 3, // Sombra para destacar
            '& .MuiAlert-message': {
              textAlign: 'center',
              whiteSpace: 'nowrap', // Evita que el texto se divida en múltiples líneas
            },
          }}
        >
          {message}
        </Alert>
      </Slide>
    </Box>
  )
}

export default Banner
