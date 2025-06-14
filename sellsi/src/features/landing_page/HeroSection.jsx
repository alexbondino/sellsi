import React from 'react'
import { Box, Typography, Button, IconButton } from '@mui/material'
import { ArrowForward, ArrowBack } from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import StatisticCard from './StatisticCard'
import CarouselIndicator from './CarouselIndicator'
import CarouselNavigationButton from './CarouselNavigationButton'

/**
 * ============================================================================
 * HERO SECTION - SECCIÓN PRINCIPAL/HERO DE LANDING PAGE
 * ============================================================================
 *
 * Componente UI principal de la landing page con carrusel promocional
 *
 * @component
 * @param {Object} props - Propiedades del componente
 * @param {number} props.currentPromoSlide - Índice del slide actual del carrusel
 * @param {Function} props.nextPromoSlide - Función para avanzar al siguiente slide
 * @param {Function} props.prevPromoSlide - Función para retroceder al slide anterior
 * @param {Function} props.setCurrentPromoSlide - Función para ir a un slide específico
 * @param {Array} props.promoSlides - Array de slides promocionales
 * @param {Array} props.statistics - Array de estadísticas para mostrar
 * @param {Function} props.formatNumber - Función para formatear números
 *
 * CARACTERÍSTICAS:
 * - Carrusel promocional con navegación automática y manual
 * - Contenido dinámico por slide (texto, imágenes, secciones múltiples)
 * - Estadísticas animadas con count-up
 * - Botón CTA principal para marketplace
 * - Layout responsivo diferenciado mobile/desktop
 * - Indicadores de posición y botones de navegación
 * - Soporte para slides multi-sección
 *
 * LAYOUT:
 * - Desktop: Dos columnas (contenido + imagen)
 * - Mobile: Una columna con imagen superpuesta
 * - Botón y estadísticas posicionados estratégicamente
 *
 * DEPENDENCIAS:
 * - StatisticCard: Para mostrar métricas destacadas
 * - CarouselIndicator: Para navegación por puntos
 * - CarouselNavigationButton: Para botones prev/next
 */
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
  const currentSlide = promoSlides[currentPromoSlide]
  // Renderizar contenido de imagen o texto según el tipo de slide
  const renderImageContent = (isMobile = false) => {
    if (currentSlide.type === 'multi-section') {
      return (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
            textAlign: 'center',
          }}
        >
          {' '}
          <Typography
            variant="h1"
            fontWeight="bold"
            sx={{
              fontSize: {
                xs: '2rem', // Nunca se usa (slide 3 oculto en mobile)
                sm: '2.5rem', // Nunca se usa (slide 3 oculto en mobile)
                md: '3.5rem', // Tablet en adelante
                lg: '3rem',
                xl: '4.5rem',
              },
              color: 'white',
              textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
              lineHeight: { xs: 1.3, sm: 1.4, md: 1.4, lg: 1.4, xl: 1.4 },
            }}
            dangerouslySetInnerHTML={{ __html: currentSlide.title }}
          />
        </Box>
      )
    }

    // No mostrar imagen para slide 2 en mobile (xs, sm)
    if (currentSlide.id === 2 && isMobile) {
      return null
    }

    // Imagen estándar para slides 1 y 2
    return (
      <img
        src={currentSlide.src}
        alt={currentSlide.alt}
        style={{
          width: '100%',
          height: isMobile ? '100%' : 'auto',
          maxHeight: isMobile ? 'none' : '600px',
          objectFit: 'contain',
          transition: 'all 0.5s ease',
        }}
      />
    )
  }

  // Renderizar contenido según el tipo de slide
  const renderSlideContent = () => {
    if (currentSlide.type === 'multi-section') {
      return (
        <>
          {/* Secciones múltiples para slide 3 - Formato simple de texto */}
          <Box
            sx={{
              width: '100%',
              mt: { xs: 2, sm: 3, md: 3, lg: 3, xl: 3 },
            }}
          >
            {' '}
            {currentSlide.sections.map((section, index) => (
              <Box
                key={index}
                sx={{ mb: { xs: 2, sm: 2.5, md: 3, lg: 3, xl: 3 } }}
              >
                {' '}
                <Typography
                  variant="h1"
                  fontWeight="bold"
                  sx={{
                    fontSize: {
                      xs: '1.7rem', // Ajustado según petición para consistencia
                      sm: '1.9rem', // Ajustado según petición para consistencia
                      md: '3.5rem',
                      lg: '3rem',
                      xl: '4.5rem',
                    },
                    lineHeight: { xs: 1.3, sm: 1.4, md: 1.4, lg: 1.4, xl: 1.4 },
                    mb: { xs: 1, sm: 1.5, md: 2, lg: 2, xl: 2 },
                    color: '#1565c0',
                  }}
                >
                  {section.title}
                </Typography>{' '}
                <Typography
                  variant="h6"
                  sx={{
                    fontSize: {
                      xs: '0.9rem', // Ajustado según petición para consistencia
                      sm: '0.95rem', // Ajustado según petición para consistencia
                      md: '1.5rem',
                      lg: '1.5rem',
                      xl: '1.7rem',
                    },
                    color: 'rgba(255, 255, 255, 0.9)',
                    lineHeight: { xs: 1.5, sm: 1.6, md: 1.6, lg: 1.6, xl: 1.6 },
                  }}
                >
                  {section.description}
                </Typography>
              </Box>
            ))}
          </Box>
        </>
      )
    }

    // Contenido estándar para slides 1 y 2
    return (
      <>
        {' '}
        <Typography
          variant="h1"
          fontWeight="bold"
          gutterBottom
          sx={{
            fontSize: {
              xs: '1.7rem', // Ajustado según petición
              sm: '1.9rem', // Ajustado según petición
              md: '3.5rem',
              lg: '3rem',
              xl: '4.5rem',
            },
            lineHeight: { xs: 1.3, sm: 1.4, md: 1.4, lg: 1.4, xl: 1.4 },
            mb: { xs: 1, sm: 1.5, md: 3, lg: 3, xl: 3 },
            mt: { xs: -1, sm: 0, md: 0 },
            color: 'white',
          }}
          dangerouslySetInnerHTML={{ __html: currentSlide.title }}
        />{' '}
        {currentSlide.subtitle && (
          <Typography
            variant="h6"
            gutterBottom
            sx={{
              fontSize: {
                xs: '0.9rem', // Ajustado según petición
                sm: '0.95rem', // Ajustado según petición
                md: '1.5rem',
                lg: '1.5rem',
                xl: '1.7rem',
              },
              mb: { xs: 0, sm: 0, md: 1.6, lg: 1.6, xl: 1.8 },
              color: 'white',
              lineHeight: { xs: 1.5, sm: 1.6, md: 1.6, lg: 1.6, xl: 1.6 },
            }}
            dangerouslySetInnerHTML={{ __html: currentSlide.subtitle }}
          />
        )}
      </>
    )
  }

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
        {/* Imagen Mobile - Solo visible en mobile */}{' '}
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
            top: { xs: 75, sm: 90, md: 220 },
            right: { xs: 35, sm: 30, md: 40 },
            width: { xs: 300, sm: 320, md: 380 },
            height: { xs: 400, sm: 500, md: 580 },
            zIndex: 1,
            pointerEvents: 'none',
          }}
        >
          {renderImageContent(true)}
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
          {' '}
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
              ml: {
                xs: 0,
                sm: 0,
                md: 0,
                lg: 0,
                xl: 0,
              },
            }}
          >
            {renderSlideContent()}
          </Box>
        </Box>{' '}
        {/* COLUMNA 2: Imagen - Solo Desktop */}
        <Box
          sx={{
            flex: currentSlide.type === 'multi-section' ? 1.2 : 0.7,
            display: {
              xs: 'none', // ✅ Ocultar en mobile
              sm: 'none', // ✅ Ocultar en mobile
              md: 'flex',
              lg: 'flex',
              xl: 'flex',
            },
            justifyContent: 'flex-start',
            alignItems: 'center',
            pl: { lg: 0, xl: 0 },
          }}
        >
          {' '}
          <Box
            sx={{
              width:
                currentSlide.type === 'multi-section'
                  ? { md: '100%', lg: '90%', xl: '95%' }
                  : { lg: '70%', xl: '60%' },
              maxWidth:
                currentSlide.type === 'multi-section'
                  ? { md: 700, lg: 650, xl: 950 }
                  : { lg: 450, xl: 500 },
              ml: { lg: 4, xl: 4 },
            }}
          >
            {renderImageContent(false)}
          </Box>
        </Box>{' '}
        {/* Botón y Estadísticas para Mobile */}
        <Box
          sx={{
            display: {
              xs: 'flex',
              sm: 'flex',
              md: 'none',
              lg: 'none',
              xl: 'none',
            },
            flexDirection: 'column',
            alignItems: 'center',
            gap: { xs: 2, sm: 2.5, md: 3 },
            width: '100%', // Margen superior dinámico según el slide actual
            mt: {
              xs:
                currentSlide.id === 1
                  ? 16 // Slide 1: "Somos Sellsi" - margen estándar
                  : currentSlide.id === 2
                  ? 8.3 // Slide 2: "Termina este 2025" - margen reducido
                  : 10, // Slide 3: "Con Sellsi todos ganan" - margen intermedio
              sm:
                currentSlide.id === 1
                  ? 17 // Slide 1: "Somos Sellsi" - margen estándar
                  : currentSlide.id === 2
                  ? 8.2 // Slide 2: "Termina este 2025" - margen reducido
                  : 13.1, // Slide 3: "Con Sellsi todos ganan" - margen intermedio
            },
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
              px: { xs: 3.68, sm: 4, md: 10, lg: 10, xl: 10 },
              py: { xs: 1.38, sm: 1.5, md: 2.4, lg: 2.4, xl: 2.4 },

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
              mt: { xs: 14, sm: 20, md: 28, lg: 28, xl: 28 },
              mb: 1,
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 6px 20px rgba(25, 118, 210, 0.4)',
              },
            }}
            onClick={() => navigate('/marketplace')}
          >
            Ir a marketplace
          </Button>{' '}
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'row',
              gap: { xs: 1.5, sm: 2, md: 2.5, lg: 2.5, xl: 2.5 },
              alignItems: 'flex-start', // ✅ Alineación superior para evitar desalineación
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
