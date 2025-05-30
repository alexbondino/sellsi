import React from 'react'
import { Box, Typography, Button, IconButton } from '@mui/material'
import { ArrowForward, ArrowBack } from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import StatisticCard from './StatisticCard'
import CarouselIndicator from './CarouselIndicator'
import CarouselNavigationButton from './CarouselNavigationButton'

const HeroSection = ({
  currentPromoSlide,
  nextPromoSlide,
  prevPromoSlide,
  setCurrentPromoSlide,
  promoSlides,
  statistics,
  formatNumber,
}) => {
  const navigate = useNavigate()

  return (
    <Box
      sx={{
        position: 'relative',
        display: 'flex',
        flexDirection: {
          xs: 'column',
          sm: 'column',
          md: 'column',
          lg: 'row',
          xl: 'row',
        },
        alignItems: 'center',
        justifyContent: 'space-between',
        minHeight: {
          xs: 'auto',
          sm: 'auto',
          md: 'auto',
          lg: '40vh',
          xl: '45vh',
        },
        paddingTop: { xs: 4, sm: 6, md: 2, lg: 1, xl: 1 },
        paddingBottom: { xs: 4, sm: 6, md: 6, lg: 6, xl: 8 },
        backgroundColor: '#000000',
        gap: { xs: 4, sm: 4, md: 5, lg: 6, xl: 6 },
        zIndex: 1,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: {
            xs: 'column',
            sm: 'column',
            md: 'column',
            lg: 'row',
            xl: 'row',
          },
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          px: { xs: 2, sm: 4, md: 8, lg: 15, xl: 30 },
          position: 'relative',
        }}
      >
        {/* Imagen Mobile - Solo visible en mobile */}
        <Box
          sx={{
            display: {
              xs: 'block',
              sm: 'block',
              md: 'block',
              lg: 'none',
              xl: 'none',
            },
            position: 'absolute',
            top: { xs: 180, sm: 200, md: 220 },
            right: { xs: 20, sm: 30, md: 40 },
            width: { xs: 300, sm: 350, md: 380 },
            height: { xs: 480, sm: 530, md: 580 },
            zIndex: 1,
            pointerEvents: 'none',
          }}
        >
          <img
            src={promoSlides[currentPromoSlide].src}
            alt={promoSlides[currentPromoSlide].alt}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              transition: 'all 0.5s ease',
            }}
          />
        </Box>

        {/* COLUMNA 1: Texto - Desktop */}
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            justifyContent: {
              xs: 'center',
              sm: 'center',
              md: 'center',
              lg: 'flex-start',
              xl: 'flex-start',
            },
            alignItems: 'center',
            pr: { xs: 0, sm: 0, md: 0, lg: 0, xl: 0 },
            zIndex: 2,
            backgroundColor: {
              xs: 'transparent',
              sm: 'transparent',
              md: 'transparent',
              lg: 'transparent',
              xl: 'transparent',
            },
          }}
        >
          <Box
            sx={{
              width: '100%',
              maxWidth: 'none',
              textAlign: {
                xs: 'center',
                sm: 'center',
                md: 'center',
                lg: 'left',
                xl: 'left',
              },
              px: { xs: 0, sm: 0, md: 0, lg: 3, xl: 4 },
              ml: { xs: 0, sm: 0, md: 0, lg: 18, xl: 12 }, // Margen izquierdo agregado
            }}
          >
            <Typography
              variant="h1"
              fontWeight="bold"
              gutterBottom
              sx={{
                fontSize: {
                  xs: '2rem',
                  sm: '3rem',
                  md: '3.5rem',
                  lg: '3rem',
                  xl: '4.5rem',
                },
                lineHeight: { xs: 1.3, sm: 1.4, md: 1.4, lg: 1.4, xl: 1.4 },
                mb: { xs: 2, sm: 3, md: 3, lg: 3, xl: 3 },
                color: 'white',
              }}
            >
              Somos <span style={{ color: '#1565c0' }}>Sellsi</span>, el primer
              marketplace B2B y B2C de Chile
            </Typography>
            <Typography
              variant="h6"
              gutterBottom
              sx={{
                fontSize: {
                  xs: '1rem',
                  sm: '1.2rem',
                  md: '1.5rem',
                  lg: '1.5rem',
                  xl: '1.7rem',
                },
                mb: { xs: 1.4, sm: 1.6, md: 1.6, lg: 1.6, xl: 1.8 },
                color: 'white',
                lineHeight: { xs: 1.5, sm: 1.6, md: 1.6, lg: 1.6, xl: 1.6 },
              }}
            >
              Únete a un ecosistema único en Chile que desarrollamos para ti.
            </Typography>
          </Box>
        </Box>

        {/* COLUMNA 2: Imagen - Solo Desktop */}
        <Box
          sx={{
            flex: 0.7,
            display: {
              xs: 'none',
              sm: 'none',
              md: 'none',
              lg: 'flex',
              xl: 'flex',
            },
            justifyContent: 'flex-start',
            alignItems: 'center',
            pl: { lg: 0, xl: 0 },
          }}
        >
          <Box
            sx={{
              width: { lg: '70%', xl: '60%' },
              maxWidth: { lg: 450, xl: 500 },
              ml: { lg: 4, xl: 4 },
            }}
          >
            <img
              src={promoSlides[currentPromoSlide].src}
              alt={promoSlides[currentPromoSlide].alt}
              style={{
                width: '100%',
                height: 'auto',
                maxHeight: '600px',
                objectFit: 'contain',
                transition: 'all 0.5s ease',
              }}
            />
          </Box>
        </Box>

        {/* Botón y Estadísticas para Mobile */}
        <Box
          sx={{
            display: {
              xs: 'flex',
              sm: 'flex',
              md: 'flex',
              lg: 'none',
              xl: 'none',
            },
            flexDirection: 'column',
            alignItems: 'center',
            gap: { xs: 2, sm: 2.5, md: 3 },
            width: '100%',
            mt: { xs: 12, sm: 14, md: 16 },
            position: 'relative',
            zIndex: 2,
          }}
        >
          <Button
            variant="contained"
            sx={{
              backgroundColor: 'primary.main',
              fontWeight: 'bold',
              borderRadius: '8px',
              px: { xs: 6, sm: 8, md: 10, lg: 10, xl: 10 },
              py: { xs: 2, sm: 2.4, md: 2.4, lg: 2.4, xl: 2.4 },
              fontSize: {
                xs: '1.2rem',
                sm: '1.35rem',
                md: '1.5rem',
                lg: '1.5rem',
                xl: '1.5rem',
              },
              textTransform: 'none',
              boxShadow: '0 4px 15px rgba(25, 118, 210, 0.3)',
              width: 'fit-content',
              mt: { xs: 24, sm: 26, md: 28, lg: 28, xl: 28 },
              ml: { xs: -24, sm: -26, md: -28, lg: -28, xl: -28 },
              mb: 1,
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 6px 20px rgba(25, 118, 210, 0.4)',
              },
            }}
            onClick={() => navigate('/marketplace')}
          >
            Ir a marketplace
          </Button>

          <Box
            sx={{
              display: 'flex',
              flexDirection: 'row',
              gap: { xs: 1.5, sm: 2, md: 2.5, lg: 2.5, xl: 2.5 },
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              flexWrap: 'wrap',
              mb: { xs: 1, sm: 2, md: 2, lg: 2, xl: 2 },
            }}
          >
            {statistics.map((stat, index) => (
              <StatisticCard key={index} stat={stat} />
            ))}
          </Box>

          <Box
            sx={{
              display: 'flex',
              gap: { xs: 1, sm: 1.5, md: 1.5, lg: 1.5, xl: 1.5 },
              justifyContent: 'center',
              alignItems: 'center',
              mt: { xs: 1, sm: 1, md: 1, lg: 1, xl: 1 },
              mb: { xs: 3, sm: 4, md: 4, lg: 4, xl: 4 },
            }}
          >
            {promoSlides.map((_, index) => (
              <CarouselIndicator
                key={index}
                index={index}
                isActive={index === currentPromoSlide}
                onClick={() => setCurrentPromoSlide(index)}
              />
            ))}
          </Box>
        </Box>
      </Box>

      {/* === FLECHAS DE NAVEGACIÓN === */}
      <CarouselNavigationButton
        direction="prev"
        onClick={prevPromoSlide}
        position={{ xs: '5%', sm: '5%', md: '5%', lg: '2%', xl: '2%' }}
      />
      <CarouselNavigationButton
        direction="next"
        onClick={nextPromoSlide}
        position={{ xs: '5%', sm: '5%', md: '5%', lg: '2%', xl: '2%' }}
      />

      {/* Indicadores del Carrusel - Desktop */}
      <Box
        sx={{
          display: {
            xs: 'none',
            sm: 'none',
            md: 'none',
            lg: 'flex',
            xl: 'flex',
          },
          position: 'absolute',
          bottom: { xs: 20, sm: 20, md: 20, lg: 20, xl: 20 },
          left: '50%',
          transform: 'translateX(-50%)',
          gap: { xs: 1.5, sm: 1.5, md: 1.5, lg: 1.5, xl: 1.5 },
          zIndex: 5,
          padding: { xs: 1, sm: 1, md: 1, lg: 1, xl: 1 },
          borderRadius: '12px',
          backgroundColor: 'rgb(0, 0, 0)',
        }}
      >
        {promoSlides.map((_, index) => (
          <CarouselIndicator
            key={index}
            index={index}
            isActive={index === currentPromoSlide}
            onClick={() => setCurrentPromoSlide(index)}
          />
        ))}
      </Box>
    </Box>
  )
}

export default HeroSection
