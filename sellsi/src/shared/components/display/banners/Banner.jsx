import React, { useState, useEffect } from 'react';
import { Alert, Slide, Box } from '@mui/material';

/**
 * Componente Banner reutilizable que muestra mensajes temporales
 * Se posiciona debajo del TopBar y desaparece automáticamente
 */

/*
  Fusionar con Banner Context
*/
const Banner = ({
  message,
  severity = 'success', // 'success', 'info', 'warning', 'error'
  duration = 6000, // 6 segundos por defecto
  show = false,
  onClose,
  position = 'top', // 'top' o 'bottom'
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setIsVisible(true);

      // Auto-cerrar después del tiempo especificado
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => {
          onClose?.();
        }, 300); // Esperar a que termine la animación
      }, duration);

      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [show, duration, onClose]);

  if (!show) return null;
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
      {' '}
      <Slide direction="down" in={isVisible} timeout={300}>
        <Alert
          variant="filled"
          severity={severity}
          onClose={() => {
            setIsVisible(false);
            setTimeout(() => {
              onClose?.();
            }, 300);
          }}
          sx={{
            width: { xs: '90vw', sm: '90vw', md: 'fit-content' }, // Ancho fijo para móviles, ajustado al contenido en desktop
            maxWidth: { xs: '95vw', sm: '90vw', md: 'none' }, // Respaldo por si width no funciona
            borderRadius: { xs: 1, sm: 1.5, md: 2 }, // Bordes más suaves en móviles
            fontSize: { xs: 14, sm: 15, md: 16 }, // Texto más pequeño en móviles
            fontWeight: 600,
            px: { xs: 1, sm: 1, md: 3 }, // Menos padding horizontal en móviles
            py: { xs: 1, sm: 1, md: 1.5 }, // Menos padding vertical en móviles
            boxShadow: { xs: 2, sm: 2, md: 3 }, // Sombra más suave en móviles
            '& .MuiAlert-message': {
              textAlign: 'center',
              whiteSpace: { xs: 'normal', sm: 'normal', md: 'nowrap' }, // Permitir salto de línea en móviles
              wordBreak: { xs: 'break-word', sm: 'break-word', md: 'normal' }, // Romper palabras largas en móviles
              lineHeight: { xs: 1.3, sm: 1.4, md: 1.5 }, // Ajustar altura de línea
            },
          }}
        >
          {message}
        </Alert>
      </Slide>
    </Box>
  );
};

export default Banner;
