// shared/components/display/banners/Banner.jsx
import React, { useEffect, useState, useMemo } from 'react';
import { Alert, Slide, Box, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useLocation } from 'react-router-dom';
import { useBanner } from './BannerContext';

// Global Banner component. Can operate in two modes:
// 1) Controlled via props (show, message, severity, duration, onClose)
// 2) Uncontrolled using BannerContext (fallback) when props are not provided.
// It is now GLOBAL (no restricción por pathname) salvo que se pase hideOnPaths.
const Banner = ({
  show: showProp,
  message: messageProp,
  severity: severityProp,
  duration: durationProp,
  onClose: onCloseProp,
  hideOnPaths = [], // optional array of path prefixes to suppress display
  topOffset = 0, // number (pixels) or string (e.g. '80px' or '5rem') to push the banner down
}) => {
  const { bannerState, hideBanner } = useBanner();
  const location = useLocation();
  const computed = useMemo(() => {
    return {
      show: showProp ?? bannerState.show,
      message: messageProp ?? bannerState.message,
      severity: severityProp ?? bannerState.severity,
      duration: durationProp ?? bannerState.duration,
      onClose: onCloseProp ?? hideBanner,
    };
  }, [showProp, messageProp, severityProp, durationProp, onCloseProp, bannerState, hideBanner]);
  const { show, message, severity, duration, onClose } = computed;
  // Allow topOffset as number (px), raw CSS value, or responsive object (e.g. { xs: '45px', md: '64px' })
  let topValue;
  if (topOffset && typeof topOffset === 'object') {
    topValue = topOffset; // pass responsive object directly to MUI sx
  } else {
    topValue = typeof topOffset === 'number' ? `${topOffset}px` : topOffset;
  }
  // Hooks must be called in the same order every render.
  // Declare state and effects before any conditional return.
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      const t = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => onClose(), 300);
      }, duration || 6000);
      return () => clearTimeout(t);
    } else {
      setIsVisible(false);
    }
  }, [show, duration, onClose]);

  // Ocultar si la ruta actual coincide con un prefijo de hideOnPaths
  if (hideOnPaths.some(p => location.pathname.startsWith(p))) return null;
  if (!show) return null;

  return (
    <Box
      sx={{
        position: 'fixed',
        top: topValue, // configurable offset from top of viewport (supports responsive object)
        left: 0,
        right: 0,
        width: '100%',
        minHeight: '54px',
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
                setTimeout(() => onClose(), 250);
              }}
              sx={{ color: 'inherit' }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          }
          sx={{
            mt: 1,
            width: 'auto', // shrink-wrap to content
            maxWidth: { xs: '92vw', sm: '88vw', md: '60%' }, // cap width on large screens
            px: 2, // horizontal padding so short texts have breathing room
            mx: 'auto', // center horizontally within the fixed full-width container
            borderRadius: 2,
            boxShadow: 3,
            pointerEvents: 'auto',
            textAlign: 'center',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: { xs: 14, md: 16 }, // responsive font size in px
            lineHeight: 1.3,
          }}
        >
          {message}
        </Alert>
      </Slide>
    </Box>
  );
};

export default Banner;
