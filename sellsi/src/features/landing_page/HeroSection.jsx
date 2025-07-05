import React from 'react';
import { Box, Typography, useTheme, Fade } from '@mui/material';
import PrimaryButton from '../ui/PrimaryButton';
import StatisticCard from './StatisticCard';
import CarouselIndicator from './CarouselIndicator';
import CarouselNavigationButton from './CarouselNavigationButton';

/**
 * HERO SECTION PROFESIONAL - Nueva versión basada en documentación HeroActual.md
 *
 * Props:
 * - currentPromoSlide, nextPromoSlide, prevPromoSlide, setCurrentPromoSlide
 * - promoSlides: array de slides (ver constants.jsx)
 * - statistics: array de métricas (ver useHomeLogic)
 */
const HeroSection = ({
  currentPromoSlide,
  nextPromoSlide,
  prevPromoSlide,
  setCurrentPromoSlide,
  promoSlides,
  statistics,
}) => {
  const theme = useTheme();
  const currentSlide = promoSlides[currentPromoSlide];

  // --- Estilos de tipografía ---
  const titleStyles = {
    fontWeight: 800,
    fontSize: {
      xs: '2rem',
      sm: '2.3rem',
      md: '2.5rem',
      lg: '3.2rem',
      xl: '4rem',
    },
    lineHeight: 1.15,
    color: currentSlide.type === 'multi-section' ? '#1565c0' : '#fff',
    letterSpacing: '-1px',
    mb: { xs: 0, sm: 2, md: 2.5 },
    textShadow: '0 2px 8px rgba(0,0,0,0.18)',
  };
  const subtitleStyles = {
    fontSize: {
      xs: '1rem',
      sm: '1.1rem',
      md: '1.2rem',
      lg: '1.5rem',
      xl: '1.7rem',
    },
    color: 'rgba(255,255,255,0.92)',
    lineHeight: 1.5,
    mb: { xs: 0, sm: 1, md: 2 },
    fontWeight: 400,
  };

  // --- Renderizado de texto del slide ---
  const SlideText = () => {
    if (currentSlide.type === 'multi-section' && currentSlide.sections) {
      return (
        <Box sx={{ textAlign: 'center' }}>
          {currentSlide.sections.map((section, idx) => (
            <Box key={idx} mb={2.5}>
              <Typography
                sx={{ ...titleStyles, color: '#fff !important' }}
                component="span"
                dangerouslySetInnerHTML={{ __html: section.title }}
              />
              <Typography sx={subtitleStyles}>{section.description}</Typography>
            </Box>
          ))}
          {/* Mostrar el título solo en mobile, debajo de las secciones */}
          <Typography
            sx={{ ...titleStyles, display: { xs: 'block', md: 'none' }, color: '#fff', mt: 2 }}
            dangerouslySetInnerHTML={{ __html: currentSlide.title }}
          />
        </Box>
      );
    }
    return (
      <>
        <Typography
          sx={titleStyles}
          dangerouslySetInnerHTML={{ __html: currentSlide.title }}
        />
        {currentSlide.subtitle && (
          <Typography
            sx={subtitleStyles}
            dangerouslySetInnerHTML={{ __html: currentSlide.subtitle }}
          />
        )}
      </>
    );
  };

  // --- Renderizado de imagen del slide ---
  const SlideImage = ({ isMobile }) => {
    if (currentSlide.type === 'multi-section') return null;
    if (currentSlide.id === 2 && isMobile) return null;
    // Reservar espacio fijo para la imagen, sin depender de carga
    return (
      <Box
        sx={{
          width: { xs: 200, sm:300, md: 400, lg: 480 },
          height: { xs: 200, sm:300,  md: 500, lg: 600 },
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Box
          component="img"
          src={currentSlide.src}
          alt={currentSlide.alt}
          sx={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            borderRadius: 3,
            boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
            transition: 'all 0.5s',
            display: 'block',
          }}
        />
      </Box>
    );
  };

  React.useEffect(() => {
    // Eliminado log de layout para producción
  }, []);

  // ===================== BOX PADRE =====================
  return (
    <Box
      sx={{
        width: '100vw',
        height: '100vh',
        maxHeight: {
          xs: '100vh',
          sm: '100vh',
          md: 550,
          lg: 500,
          xl: 650,
        },
        py: 0,
        px: 0,
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(120deg, #000 80%, #1565c0 120%)', // Degrade negro a azul
        zIndex: 1,
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start',
        alignItems: 'center',
      }}
    >
      {/* Botones de navegación en los extremos, dentro del BoxPadre */}
      <CarouselNavigationButton
        direction="prev"
        onClick={prevPromoSlide}
        position={{
          position: 'absolute',
          left: '2vw',
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 1000,
        }}
      />
      <CarouselNavigationButton
        direction="next"
        onClick={nextPromoSlide}
        position={{
          position: 'absolute',
          right: '2vw',
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 1000,
        }}
      />
      {/* HeroSectionBox centrado y con fondo negro, ocupa 95% de la altura */}
      <Fade in={true} key={currentPromoSlide} timeout={500}>
        <Box
          id="herosection-root"
          sx={{
            width: { xs: '100%', md: '80%' },
            margin: '0 auto',
            position: 'relative',
            display: 'flex',
            flexDirection: {
              xs: 'column', // Siempre columna en mobile para todas las slides
              lg: 'row',
            },
            alignItems: 'center',
            justifyContent: 'center',
            height: '95%',
            minHeight: 0,
            py: { xs: 4, sm: 6, md: 8, lg: 8, xl: 10 },
            px: { xs: 2, sm: 4, md: 8, lg: 16, xl: 28 },
            background: 'transparent', // Fondo transparente para heredar el degrade
            overflow: 'hidden',
            zIndex: 2,
            boxSizing: 'border-box',
          }}
        >
          {/* TEXTO ARRIBA, IMAGEN AL MEDIO, SIEMPRE EN MOBILE */}
          <Box sx={{ width: '100%', mb: 2, zIndex: 2, display: { xs: 'block', md: 'none' } }}>
            <SlideText />
          </Box>
          <Box sx={{ width: '100%', display: { xs: 'flex', md: 'none' }, justifyContent: 'center', alignItems: 'center', mb: 2, zIndex: 2 }}>
            <SlideImage isMobile />
          </Box>
          {/* Box sticky para stats+botón en mobile */}
          <Box
            sx={{
              display: { xs: 'flex', sm: 'flex', md: 'none' },
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'flex-end', // Alinear abajo
              flex: 1, // Ocupar todo el alto disponible
              width: '100%',
              gap: 1.5,
              py: 1,
              background: 'rgba(0,0,0,0.85)',
              position: { xs: 'relative', sm: 'relative', md: 'sticky' },
              bottom: { xs: 'unset', sm: 'unset', md: 0 },
              zIndex: 20,
              boxShadow: '0 -2px 12px rgba(0,0,0,0.08)',
            }}
          >
            <PrimaryButton
              size="large"
              onClick={() => window.location.assign('/marketplace')}
              sx={{
                px: 4,
                py: 1,
                fontSize: '1.1rem',
                borderRadius: 2,
                boxShadow: '0 4px 15px rgba(25, 118, 210, 0.3)',
                backgroundColor: 'primary.main',
                color: '#fff',
                width: '90%',
                maxWidth: 340,
                mb: 1,
                '&:hover': {
                  backgroundColor: 'primary.dark',
                },
              }}
            >
              Ir a marketplace
            </PrimaryButton>
            <Box sx={{ display: 'flex', gap: 1, width: '100%', justifyContent: 'center', flexWrap: 'nowrap', overflowX: 'auto' }}>
              {statistics.map((stat, i) => (
                <StatisticCard key={i} stat={stat} />
              ))}
            </Box>
          </Box>
          {/* Desktop layout: texto e imagen en columnas */}
          {(
            <>
              <Box
                sx={{
                  flex: 1,
                  zIndex: 2,
                  minWidth: 0,
                  maxWidth: { xs: '100%', lg: '50%' },
                  textAlign: { xs: 'center', lg: 'left' },
                  py: { xs: 2, lg: 0 },
                  display: { xs: 'none', md: 'flex' },
                  flexDirection: 'column',
                  justifyContent: 'center',
                  height: { md: '100%', lg: '100%' },
                  maxHeight: { xs: 'calc(100dvh - 180px)', sm: 'calc(100dvh - 180px)', md: 'none' },
                  overflowY: { xs: 'auto', sm: 'auto', md: 'visible' },
                }}
              >
                <SlideText />
              </Box>
              <Box
                sx={{
                  flex: 1,
                  display: { xs: 'none', md: 'flex' },
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: 0,
                  maxWidth: { xs: '100%', lg: '50%' },
                  minHeight: 320,
                  zIndex: 2,
                  height: { md: '100%', lg: '100%' },
                }}
              >
                {currentSlide.type === 'multi-section' ? (
                  <Typography
                    sx={{ ...titleStyles, color: '#fff', textAlign: 'center', width: '100%' }}
                    dangerouslySetInnerHTML={{ __html: currentSlide.title }}
                  />
                ) : (
                  <SlideImage />
                )}
              </Box>
            </>
          )}
        </Box>
      </Fade>
      {/* Box externo para CarouselIndicator, ocupa 5% de la altura */}
      <Box
        sx={{
          width: { xs: '100%', md: '80%' },
          margin: '0 auto',
          height: '5%',
          minHeight: 40,
          maxHeight: 60,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'transparent',
          zIndex: 10,
        }}
      >
        <Box
          sx={{
            display: { xs: 'none', md: 'flex' },
            gap: 1.5,
            background: 'rgba(0,0,0,0.7)',
            borderRadius: 2,
            px: 2,
            py: 1,
          }}
        >
          {promoSlides.map((_, idx) => (
            <CarouselIndicator
              key={idx}
              index={idx}
              isActive={idx === currentPromoSlide}
              onClick={() => setCurrentPromoSlide(idx)}
            />
          ))}
        </Box>
      </Box>
    </Box>
  );
};

export default HeroSection;
