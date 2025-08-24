// shared/components/display/banners/Banner.jsx
import React, { useEffect, useState } from 'react';
import { Alert, Slide, Box, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useLocation } from 'react-router-dom';
import { useBanner } from './BannerContext';

const Banner = () => {
  const { bannerState, hideBanner } = useBanner();
  const { show, message, severity, duration } = bannerState;
  const location = useLocation();
  const [isVisible, setIsVisible] = useState(false);

  // Mostrar SOLO en la home
  if (location.pathname !== '/') return null;

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      const t = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => hideBanner(), 300);
      }, duration || 6000);
      return () => clearTimeout(t);
    } else {
      setIsVisible(false);
    }
  }, [show, duration, hideBanner]);

  if (!show) return null;

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0, // pegado arriba del viewport
        left: 0,
        right: 0,
        width: '100%',
        zIndex: 1400, // por encima de AppBar/Drawer
        display: 'flex',
        justifyContent: 'center',
        pointerEvents: 'none', // evita bloquear clics del layout; el Alert re-habilita
      }}
    >
      <Slide
        direction="down"
        in={isVisible}
        timeout={250}
        mountOnEnter
        unmountOnExit
      >
        <Alert
          variant="filled"
          severity={severity || 'success'}
          action={
            <IconButton
              size="small"
              aria-label="cerrar"
              onClick={() => {
                setIsVisible(false);
                setTimeout(() => hideBanner(), 250);
              }}
              sx={{ color: 'inherit' }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          }
          sx={{
            mt: 1,
            width: { xs: '92vw', sm: '88vw', md: 'min(1100px, 92vw)' },
            borderRadius: 2,
            boxShadow: 3,
            pointerEvents: 'auto',
            textAlign: 'center',
            fontWeight: 600,
          }}
        >
          {message}
        </Alert>
      </Slide>
    </Box>
  );
};

export default Banner;
