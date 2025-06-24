import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import StatisticCard from './StatisticCard';
import CarouselIndicator from './CarouselIndicator';
import CarouselNavigationButton from './CarouselNavigationButton';

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
 * @param {Function} props.formatNumber - Función para formatear números (no usada directamente aquí, pero se mantiene en la interfaz)
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
}) => {
  const navigate = useNavigate();
  const currentSlide = promoSlides[currentPromoSlide];

  // Estilos comunes para los títulos de los slides
  const titleStyles = {
    fontSize: {
      xs: '1.7rem',
      sm: '1.9rem',
      md: '3.5rem',
      mac: '3.2rem',
      lg: '3rem',
      xl: '4.5rem',
    },
    lineHeight: {
      xs: 1.3,
      sm: 1.4,
      md: 1.4,
      mac: 1.4,
      lg: 1.4,
      xl: 1.4,
    },
  };

  // Estilos comunes para los subtítulos/descripciones de los slides
  const descriptionStyles = {
    fontSize: {
      xs: '0.9rem',
      sm: '0.95rem',
      md: '1.5rem',
      mac: '1.5rem',
      lg: '1.5rem',
      xl: '1.7rem',
    },
    lineHeight: {
      xs: 1.5,
      sm: 1.6,
      md: 1.6,
      mac: 1.6,
      lg: 1.6,
      xl: 1.6,
    },
  };

  /**
   * Componente interno para renderizar el contenido de texto principal del slide.
   * La altura de este Box será controlada por el flexbox padre.
   */
  const SlideTextContent = () => {
    if (currentSlide.type === 'multi-section') {
      return (
        <Box
          sx={{
            width: '100%',
            mt: { xs: 2, sm: 3, md: 3 },
            // Removed minHeight here to let flexbox control it fully
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start',
            textAlign: { xs: 'center', md: 'left' },
          }}
        >
          {currentSlide.sections.map((section, index) => (
            <Box key={index} sx={{ mb: { xs: 2, sm: 2.5, md: 3 } }}>
              <Typography
                variant="h1"
                fontWeight="bold"
                sx={{
                  ...titleStyles,
                  mb: { xs: 1, sm: 1.5, md: 2 },
                  color: '#1565c0',
                }}
              >
                {section.title}
              </Typography>
              <Typography
                variant="h6"
                sx={{ ...descriptionStyles, color: 'rgba(255, 255, 255, 0.9)' }}
              >
                {section.description}
              </Typography>
            </Box>
          ))}
        </Box>
      );
    }

    return (
      <>
        <Typography
          variant="h1"
          fontWeight="bold"
          gutterBottom
          sx={{
            ...titleStyles,
            mb: { xs: 1, sm: 1.5, md: 3 },
            mt: { xs: -1, sm: 0 },
            color: 'white',
            // Removed minHeight here to let flexbox control it fully
          }}
          dangerouslySetInnerHTML={{ __html: currentSlide.title }}
        />
        {currentSlide.subtitle && (
          <Typography
            variant="h6"
            gutterBottom
            sx={{
              ...descriptionStyles,
              mb: { xs: 0, sm: 0, md: 1.6 },
              color: 'white',
              // Removed minHeight here to let flexbox control it fully
            }}
            dangerouslySetInnerHTML={{ __html: currentSlide.subtitle }}
          />
        )}
      </>
    );
  };

  /**
   * Componente interno para renderizar el contenido de imagen del slide.
   * La altura de este Box será controlada por el flexbox padre.
   */
  const SlideImageContent = ({ isMobile = false }) => {
    if (currentSlide.type === 'multi-section') {
      return (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
            textAlign: 'center',
            // Removed minHeight here to let flexbox control it fully
            px: { xs: 2, md: 0 },
          }}
        >
          <Typography
            variant="h1"
            fontWeight="bold"
            sx={{
              ...titleStyles,
              color: 'white',
              textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
              wordBreak: 'break-word',
              whiteSpace: 'normal',
              px: { xs: 0, mac: 2, lg: 0 },
            }}
            dangerouslySetInnerHTML={{ __html: currentSlide.title }}
          />
        </Box>
      );
    }

    if (currentSlide.id === 2 && isMobile) {
      return null;
    }

    return (
      <img
        src={currentSlide.src}
        alt={currentSlide.alt}
        style={{
          width: '100%',
          height: '100%', // Asegura que la imagen intente llenar la altura de su contenedor flex
          maxHeight: isMobile ? 'none' : '550px', // Ajusta este valor según tus imágenes
          objectFit: 'contain',
          transition: 'all 0.5s ease',
        }}
      />
    );
  };

  return (
    <Box
      sx={{
        position: 'relative',
        display: 'flex',
        flexDirection: {
          xs: 'column',
          md: 'column',
          lg: 'row',
        },
        alignItems: 'center',
        justifyContent: 'space-between',
        // ✨ CLAVE: ALTURA FIJA PARA DESKTOP
        height: {
          xs: 'auto', // Auto para móviles y tabletas
          md: 'auto',
          mac: '650px', // Ajusta estos valores basados en tu contenido más alto
          lg: '700px',
          xl: '750px',
        },
        paddingY: { xs: 4, sm: 6, md: 6, mac: 6, lg: 6, xl: 8 },
        paddingTop: { md: 2, mac: 4, lg: 1, xl: 1 },
        backgroundColor: '#000000',
        // ✨ Aseguramos un gap generoso
        gap: { xs: 4, sm: 4, md: 5, mac: 8, lg: 10, xl: 12 },
        zIndex: 1,
        transition: 'height 0.3s ease-in-out',
        // ✨ Opcional: Si el contenido se desborda y quieres cortarlo
        // overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: {
            xs: 'column',
            md: 'column',
            lg: 'row',
          },
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          // ✨ CRÍTICO: Este Box debe tomar el 100% de la altura de su padre (el carrusel principal)
          height: { xs: 'auto', lg: '100%' },
          px: { xs: 2, sm: 4, md: 8, mac: 10, lg: 15, xl: 30 },
          position: 'relative',
        }}
      >
        {/* Imagen Mobile - Visible hasta md */}
        {/* Este Box está posicionado absolutamente y no debería afectar el flujo del layout principal en desktop */}
        <Box
          sx={{
            display: {
              xs: 'block',
              md: 'block',
              lg: 'none',
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
          <SlideImageContent isMobile={true} />
        </Box>

        {/* COLUMNA 1: Texto (Izquierda) */}
        <Box
          sx={{
            // ✨ SIMPLIFICACIÓN: Usar flex: 1 para distribución equitativa.
            // Si necesitas proporciones específicas (e.g., 40/60), usar flex-basis
            // pero asegúrate de que haya espacio suficiente.
            flex: {
              xs: 'none', // No flexbox en móvil
              md: 1, // MD y superiores: crece equitativamente
            },
            display: 'flex',
            // ✨ Alinea la columna a la izquierda en MD y superiores
            justifyContent: { xs: 'center', md: 'flex-start' },
            alignItems: 'center',
            pr: { mac: 4 },
            zIndex: 2,
            width: { xs: '100%', md: '100%', lg: 'auto' },
            // minWidth es crucial para que no se colapse y fuerce el texto a envolverse
            minWidth: { xs: 'auto', lg: '400px' },
            // ✨ CRÍTICO: La columna debe tomar el 100% de la altura de su padre (el contenedor de las dos columnas)
            height: { xs: 'auto', lg: '100%' },
            // Opcional: si la columna de texto se desborda verticalmente
            // overflowY: 'auto',
          }}
        >
          <Box
            sx={{
              width: '100%',
              maxWidth: { mac: '500px', lg: '450px', xl: '550px' }, // Limita el ancho del contenido interno de la columna izquierda
              textAlign: { xs: 'center', md: 'left' },
              px: { lg: 3, xl: 4 },
              // ✨ Asegura que el contenido interno se adapte a la altura de la columna
              height: { xs: 'auto', lg: '100%' },
              display: 'flex',
              flexDirection: 'column',
              // ✨ Centra verticalmente el contenido dentro de esta Box si hay espacio
              justifyContent: 'center',
              // Opcional: si el texto es demasiado largo para la altura fija
              // overflowY: 'auto',
            }}
          >
            <SlideTextContent />
          </Box>
        </Box>

        {/* COLUMNA 2: Imagen / Título de Multi-Section (Derecha) */}
        <Box
          sx={{
            // ✨ SIMPLIFICACIÓN: Usar flex: 1 para distribución equitativa.
            // Opcionalmente, puedes volver a flex-basis con porcentajes si 1:1 no es lo que quieres.
            flex: {
              xs: 'none',
              md: 1, // MD y superiores: crece equitativamente
            },
            display: {
              xs: 'none',
              md: 'flex',
            },
            justifyContent: 'center', // Centra el contenido (imagen o título multi-section) horizontalmente
            alignItems: 'center', // Centra el contenido verticalmente
            pl: { mac: 4 },
            // ✨ CRÍTICO: La columna debe tomar el 100% de la altura de su padre
            height: { xs: 'auto', lg: '100%' },
            // minHeight ya no es tan crítico si el padre tiene height fijo, pero se mantiene como precaución
            minHeight: {
              md: '300px',
              mac: '350px',
              lg: '300px',
              xl: '400px',
            },
            transition: 'height 0.3s ease-in-out',
            // Opcional: si la columna de imagen se desborda verticalmente
            // overflowY: 'auto',
          }}
        >
          <Box
            sx={{
              // ✨ Control más estricto del ancho del contenido de la columna derecha
              width:
                currentSlide.type === 'multi-section'
                  ? { md: '100%', mac: '90%', lg: '95%', xl: '95%' }
                  : { mac: '70%', lg: '80%', xl: '70%' },
              maxWidth:
                currentSlide.type === 'multi-section'
                  ? { md: 700, mac: 800, lg: 900, xl: 1100 }
                  : { mac: 450, lg: 500, xl: 550 },
              ml: { lg: 4, xl: 4 },
              // ✨ Asegura que el contenedor de la imagen también se ajuste a la altura
              height: { xs: 'auto', lg: '100%' },
              display: 'flex',
              flexDirection: 'column', // Para centrar verticalmente el contenido
              justifyContent: 'center', // Centra verticalmente la imagen/título
              alignItems: 'center', // Centra horizontalmente la imagen/título
            }}
          >
            <SlideImageContent />
          </Box>
        </Box>

        {/* Botón y Estadísticas para Mobile (hasta md) */}
        <Box
          sx={{
            display: {
              xs: 'flex',
              md: 'none',
            },
            flexDirection: 'column',
            alignItems: 'center',
            gap: { xs: 2, sm: 2.5 },
            width: '100%',
            mt: {
              xs: currentSlide.id === 1 ? 16 : currentSlide.id === 2 ? 8.3 : 10,
              sm:
                currentSlide.id === 1 ? 17 : currentSlide.id === 2 ? 8.2 : 13.1,
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
              px: { xs: 3.68, sm: 4, md: 10 },
              py: { xs: 1.38, sm: 1.5, md: 2.4 },
              fontSize: { xs: '1.2rem', sm: '1.35rem', md: '1.5rem' },
              textTransform: 'none',
              boxShadow: '0 4px 15px rgba(25, 118, 210, 0.3)',
              width: 'fit-content',
              mt: { xs: 14, sm: 20 },
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
              gap: { xs: 1.5, sm: 2 },
              alignItems: 'flex-start',
              justifyContent: 'center',
              width: '100%',
              flexWrap: 'wrap',
              mb: { xs: 1, sm: 2 },
            }}
          >
            {statistics.map((stat, index) => (
              <StatisticCard key={index} stat={stat} />
            ))}
          </Box>
          <Box
            sx={{
              display: 'flex',
              gap: { xs: 1, sm: 1.5 },
              justifyContent: 'center',
              alignItems: 'center',
              mt: 1,
              mb: { xs: 3, sm: 4 },
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
        position={{
          xs: '5%',
          mac: '5%',
          lg: '2%',
        }}
      />
      <CarouselNavigationButton
        direction="next"
        onClick={nextPromoSlide}
        position={{
          xs: '5%',
          mac: '5%',
          lg: '2%',
        }}
      />

      {/* Indicadores del Carrusel - Desktop (visible desde mac) */}
      <Box
        sx={{
          display: {
            xs: 'none',
            mac: 'flex',
          },
          position: 'absolute',
          bottom: 20,
          left: '50%',
          transform: 'translateX(-50%)',
          gap: 1.5,
          zIndex: 5,
          padding: 1,
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
  );
};

export default HeroSection;
