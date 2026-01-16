import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  IconButton,
  useTheme,
  useMediaQuery,
  Fade,
  Slide,
} from '@mui/material';
import {
  Close as CloseIcon,
  NavigateNext as NavigateNextIcon,
  NavigateBefore as NavigateBeforeIcon,
  Circle as CircleIcon,
} from '@mui/icons-material';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';

const HowItWorksModal = ({ 
  open, 
  onClose, 
  title = '¿Cómo funciona?',
  steps = []
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [slideDirection, setSlideDirection] = useState('left');
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  useBodyScrollLock(open);

  useEffect(() => {
    if (!open) {
      const timer = setTimeout(() => setActiveStep(0), 400);
      return () => clearTimeout(timer);
    }
  }, [open]);

  if (!steps || steps.length === 0) return null;

  const maxSteps = steps.length;

  const handleNext = () => {
    setSlideDirection('left');
    setActiveStep((prev) => (prev === maxSteps - 1 ? 0 : prev + 1));
  };

  const handleBack = () => {
    setSlideDirection('right');
    setActiveStep((prev) => (prev === 0 ? maxSteps - 1 : prev - 1));
  };

  const handleStepClick = (index) => {
    setSlideDirection(index > activeStep ? 'left' : 'right');
    setActiveStep(index);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={isMobile ? false : "md"}
      fullWidth={!isMobile}
      fullScreen={isMobile}
      disableScrollLock
      disableRestoreFocus
      sx={{ 
        zIndex: 1500,
        '& .MuiDialog-paper': {
          margin: isMobile ? 0 : 2,
          width: isMobile ? '100vw' : 'auto',
          maxWidth: isMobile ? '100vw' : '900px',
          height: isMobile ? '100vh' : 'auto',
          maxHeight: { xs: '100vh', md: '99vh' },
        },
      }}
      PaperProps={{
        elevation: 0,
        sx: {
          borderRadius: isMobile ? 0 : 3,
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'background.paper',
          m: isMobile ? 0 : undefined,
        },
      }}
      TransitionComponent={Fade}
      TransitionProps={{
        timeout: 300,
        easing: {
          enter: 'cubic-bezier(0.4, 0, 0.2, 1)',
          exit: 'cubic-bezier(0.4, 0, 1, 1)',
        },
      }}
    >
      {/* Header */}
      <DialogTitle
        sx={{
          position: 'relative',
          textAlign: 'center',
          pb: { xs: 1, md: 1 },
          pt: { xs: 2, md: 3 },
          px: { xs: 2, md: 3 },
          backgroundColor: '#2E52B2',
          color: '#fff',
        }}
      >
        <Typography 
          variant="h6"
          component="span"
          fontWeight={700}
          sx={{ 
            fontSize: { xs: '1.1rem', md: '1.25rem' },
            color: '#fff',
          }}
        >
          {title}
        </Typography>
        <IconButton
          onClick={onClose}
          sx={{
            position: 'absolute',
            top: '50%',
            transform: 'translateY(-50%)',
            right: { xs: 8, md: 16 },
            p: { xs: 0.75, md: 1 },
            color: '#fff',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
            },
          }}
        >
          <CloseIcon sx={{ fontSize: { xs: '1.5rem', md: '1.5rem' } }} />
        </IconButton>
      </DialogTitle>

      {/* Content - Carousel */}
      <DialogContent
        sx={{
          px: { xs: 2, md: 4 },
          py: 0,
          pt: { xs: 3, md: 3 },
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-start',
          position: 'relative',
          overflow: 'auto',
          flex: 1,
          WebkitOverflowScrolling: 'touch',
          backgroundColor: 'background.paper',
        }}
      >
        {/* Step Counter */}
        <Box
          sx={{
            position: 'absolute',
            top: { xs: 8, md: 16 },
            right: { xs: 16, md: 24 },
            backgroundColor: 'primary.main',
            color: 'white',
            px: 2,
            py: 0.5,
            borderRadius: 2,
            fontWeight: 600,
            fontSize: { xs: '0.75rem', md: '0.875rem' },
            zIndex: 10,
            boxShadow: '0 4px 16px rgba(46, 82, 178, 0.3)',
            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            '@keyframes pulse': {
              '0%, 100%': {
                opacity: 1,
              },
              '50%': {
                opacity: 0.9,
              },
            },
          }}
        >
          {activeStep + 1} / {maxSteps}
        </Box>

        {/* Carousel Container */}
        <Box
          sx={{
            width: '100%',
            height: { xs: '95%', md: 'auto' },
            minHeight: { md: 450, lg: 500 },
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-start',
            overflow: 'visible',
          }}
        >
          {/* Navigation Buttons - Arrows */}
          {maxSteps > 1 && (
            <>
              <IconButton
                onClick={handleBack}
                sx={{
                  position: 'absolute',
                  left: { xs: 0, md: -16 },
                  top: { xs: '40%', md: '50%' },
                  transform: 'translateY(-50%)',
                  zIndex: 10,
                  backgroundColor: 'background.paper',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                  transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  '&:hover': {
                    backgroundColor: 'primary.main',
                    color: 'white',
                    transform: 'translateY(-50%) scale(1.15) translateX(-4px)',
                    boxShadow: '0 8px 24px rgba(46, 82, 178, 0.3)',
                  },
                  '&:active': {
                    transform: 'translateY(-50%) scale(1.05)',
                  },
                }}
              >
                <NavigateBeforeIcon fontSize="large" />
              </IconButton>
              <IconButton
                onClick={handleNext}
                sx={{
                  position: 'absolute',
                  right: { xs: 0, md: -16 },
                  top: { xs: '40%', md: '50%' },
                  transform: 'translateY(-50%)',
                  zIndex: 10,
                  backgroundColor: 'background.paper',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                  transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  '&:hover': {
                    backgroundColor: 'primary.main',
                    color: 'white',
                    transform: 'translateY(-50%) scale(1.15) translateX(4px)',
                    boxShadow: '0 8px 24px rgba(46, 82, 178, 0.3)',
                  },
                  '&:active': {
                    transform: 'translateY(-50%) scale(1.05)',
                  },
                }}
              >
                <NavigateNextIcon fontSize="large" />
              </IconButton>
            </>
          )}

          {/* Step Content */}
          <Box
            sx={{
              width: '100%',
              textAlign: 'center',
              px: { xs: 0, md: 2, lg: 4 },
              overflow: 'hidden',
            }}
          >
            <Slide
              key={activeStep}
              direction={slideDirection}
              in={true}
              timeout={{
                enter: 600,
                exit: 300,
              }}
              easing={{
                enter: 'cubic-bezier(0.22, 1, 0.36, 1)',
                exit: 'cubic-bezier(0.4, 0, 1, 1)',
              }}
              mountOnEnter
              unmountOnExit
            >
              <Box>
                {/* Step Image */}
                <Box
                  sx={{
                    width: '100%',
                    height: { xs: '250px', sm: '450px', md: '250px', lg: '300px' },
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    mb: { xs: 3, md: 3 },
                    mt: { xs: 1, md: 2 },
                    position: 'relative',
                  }}
                >
                  <Box
                    component="img"
                    src={steps[activeStep].image}
                    alt={steps[activeStep].title}
                    sx={{
                      maxWidth: '100%',
                      maxHeight: '100%',
                      objectFit: 'contain',
                      borderRadius: 3,
                      boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
                      transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
                      '&:hover': {
                        transform: 'scale(1.02)',
                        boxShadow: '0 16px 48px rgba(0,0,0,0.2)',
                      },
                    }}
                  />
                </Box>

                {/* Text Content */}
                <Box
                  sx={{
                    height: { xs: '52%', md: 'auto' },
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                  }}
                >
                  {/* Step Title */}
                  <Typography
                    variant="h4"
                    component="h2"
                    gutterBottom
                    sx={{
                      fontWeight: 700,
                      color: '#2E52B2',
                      fontSize: { xs: '1.5rem', md: '2rem' },
                      mb: 2,
                      textAlign: 'center',
                      transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
                      animation: 'fadeInUp 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
                      '@keyframes fadeInUp': {
                        from: {
                          opacity: 0,
                          transform: 'translateY(20px)',
                        },
                        to: {
                          opacity: 1,
                          transform: 'translateY(0)',
                        },
                      },
                    }}
                  >
                    {steps[activeStep].title}
                  </Typography>

                  {/* Step Description */}
                  <Typography
                    variant="body1"
                    sx={{
                      color: 'text.secondary',
                      fontSize: { xs: '0.95rem', md: '1.1rem' },
                      textAlign: 'center',
                      lineHeight: 1.7,
                      maxWidth: '600px',
                      mx: 'auto',
                      px: { xs: 1, md: 2 },
                      transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
                      animation: 'fadeInUp 0.9s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    }}
                  >
                    {steps[activeStep].description}
                  </Typography>
                </Box>
              </Box>
            </Slide>
          </Box>
        </Box>

        {/* Dots Indicator */}
        {maxSteps > 1 && (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 1.5,
              mt: 3,
            }}
          >
            {steps.map((_, index) => (
              <IconButton
                key={index}
                onClick={() => handleStepClick(index)}
                sx={{
                  p: 0,
                  transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  '&:hover': {
                    transform: 'scale(1.3)',
                  },
                }}
              >
                <CircleIcon
                  sx={{
                    fontSize: index === activeStep ? 16 : 12,
                    color: index === activeStep ? 'primary.main' : 'action.disabled',
                    transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    filter: index === activeStep ? 'drop-shadow(0 2px 4px rgba(46, 82, 178, 0.4))' : 'none',
                  }}
                />
              </IconButton>
            ))}
          </Box>
        )}
      </DialogContent>

      {/* Footer */}
      <DialogActions
        sx={{
          px: { xs: 3, md: 3 },
          pb: { xs: 3, md: 3 },
          pt: { xs: 2, md: 1 },
          justifyContent: 'center',
        }}
      >
        <Button
          onClick={onClose}
          variant="contained"
          size="large"
          sx={{
            textTransform: 'none',
            borderRadius: 2,
            px: 6,
            py: 1.5,
            fontSize: '1rem',
            fontWeight: 600,
            boxShadow: '0 4px 14px rgba(46, 82, 178, 0.25)',
            transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
            '&:hover': {
              boxShadow: '0 8px 24px rgba(46, 82, 178, 0.35)',
              transform: 'translateY(-3px)',
            },
            '&:active': {
              transform: 'translateY(-1px)',
              boxShadow: '0 4px 12px rgba(46, 82, 178, 0.3)',
            },
          }}
        >
          Entendido
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default HowItWorksModal;
