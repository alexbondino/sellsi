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
        position: 'relative', // Para permitir imagen de fondo en mobile y posicionar controles
        display: 'flex',
        flexDirection: { xs: 'column', lg: 'row' },
        alignItems: 'center',
        justifyContent: 'space-between',
        minHeight: { xs: 'auto', lg: '70vh' }, // CARRUSEL HEIGHT: Reducido de 80vh a 70vh para menos altura total
        // CARRUSEL MARGINS: Controla el espacio superior e inferior del carrusel
        paddingTop: { xs: 4, sm: 6, lg: 1 }, // MARGIN TOP: Reducido de 2.4 a 1 para desktop
        paddingBottom: { xs: 4, sm: 6, lg: 1 }, // MARGIN BOTTOM: Reducido de 2.4 a 1 para desktop
        backgroundColor: '#e6e6e6',
        gap: { xs: 4, lg: 6 },
        // px: { xs: 2, sm: 4, md: 8, lg: 15, xl: 30 }, // Mover padding al contenido interno
      }}
    >
      {/* Contenido interno con padding específico para mantener los elementos visualmente agrupados */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', lg: 'row' },
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          px: { xs: 2, sm: 4, md: 8, lg: 15, xl: 30 }, // Padding interno para el contenido
          position: 'relative',
        }}
      >
        {/* Carrusel de fondo solo para mobile */}
        <Box
          sx={{
            display: { xs: 'block', lg: 'none' },
            position: 'absolute',
            top: 220,
            right: 40,
            width: 380,
            height: 580,
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
        {/* Fin Carrusel de fondo solo para mobile */}

        {/* Sección izquierda: Texto (y en desktop también botón y estadísticas) */}
        <Box
          sx={{
            flex: 1,
            maxWidth: { xs: '100%', lg: '100%' }, // Ajustado para ocupar más espacio si es necesario
            position: 'relative',
            zIndex: 2, // Asegura que el texto esté sobre la imagen de fondo en mobile
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center', // Centra verticalmente el contenido
            alignItems: { xs: 'center', lg: 'center' }, // Centra horizontalmente en mobile, alinea a la izquierda en desktop
          }}
        >
          {/* Contenedor de texto centrado */}
          <Box
            sx={{
              width: '100%', // Ocupa todo el ancho disponible
              maxWidth: { xs: '100%', lg: 600 }, // Limita el ancho máximo del texto en desktop
              textAlign: { xs: 'center', lg: 'left' }, // Centra texto en mobile, alinea a la izquierda en desktop
            }}
          >
            <Typography
              variant="h1"
              fontWeight="bold"
              gutterBottom
              sx={{
                fontSize: { xs: '2rem', sm: '3rem', md: '3.5rem' },
                lineHeight: 1.4,
                mb: 3,
              }}
            >
              Somos Sellsi, el marketplace que conecta proveedores con
              vendedores
            </Typography>
            <Typography
              variant="h6"
              gutterBottom
              sx={{
                fontSize: { xs: '1rem', md: '1.5rem' },
                mb: 1.6,
                color: 'text.secondary',
              }}
            >
              Conectamos proveedores con vendedores de manera sencilla. Olvídate
              de ir a hablar con cada uno de ellos. Desarrollamos el ecosistema
              que necesitas para transar lo que necesites y cuando lo necesites.
            </Typography>
          </Box>

          {/* Botón y Estadísticas - Solo visible en desktop */}
          <Box
            sx={{
              display: { xs: 'none', lg: 'flex' },
              flexDirection: 'row', // Cambiado a 'row' para alinear horizontalmente
              alignItems: 'center', // Centra los elementos verticalmente
              justifyContent: 'flex-start', // Alinear a la izquierda dentro del contenedor
              gap: 4,
              mt: 1.6,
              width: '100%', // Ocupa todo el ancho disponible
              maxWidth: 600, // Mismo maxWidth que el texto para alineación
            }}
          >
            {/* Botón Ir a marketplace */}
            <Button
              variant="contained"
              sx={{
                backgroundColor: 'primary.main',
                fontWeight: 'bold',
                borderRadius: '8px',
                px: 11,
                py: 2.4,
                fontSize: '1.58rem',
                textTransform: 'none',
                boxShadow: '0 4px 15px rgba(25, 118, 210, 0.3)',
                flexShrink: 0, // Evita que el botón se encoja
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 6px 20px rgba(25, 118, 210, 0.4)',
                },
              }}
              onClick={() => navigate('/marketplace')}
            >
              Ir a marketplace
            </Button>

            {/* Estadísticas horizontales */}
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'row',
                gap: 4,
                alignItems: 'center',
                justifyContent: 'flex-start', // Alinear a la izquierda
                flex: 1, // Permite que las estadísticas ocupen el espacio restante
              }}
            >
              {statistics.map((stat, index) => (
                <StatisticCard key={index} stat={stat} isMobile={false} />
              ))}
            </Box>
          </Box>
        </Box>
        {/* Fin Sección izquierda */}

        {/* Sección derecha: Carrusel de Promoción - Solo Desktop */}
        <Box
          sx={{
            flex: 1,
            display: { xs: 'none', lg: 'flex' },
            justifyContent: 'flex-start', // Alinea la imagen a la izquierda del contenedor
            alignItems: 'center', // Centra la imagen verticalmente
            width: '100%', // Ocupa el ancho disponible
            maxWidth: '120%', // Permite que la imagen sea un poco más ancha que su contenedor si es necesario
            mt: -23, // Ajuste para superponer con el texto
            pl: 16, // Padding a la izquierda para separar del texto
            position: 'relative',
          }}
        >
          {/* Contenedor para la imagen */}
          <Box sx={{ position: 'relative', width: '60%', maxWidth: '60%' }}>
            <img
              src={promoSlides[currentPromoSlide].src}
              alt={promoSlides[currentPromoSlide].alt}
              style={{
                width: '100%',
                height: 'auto',
                maxHeight: '600px', // Limita la altura máxima de la imagen
                objectFit: 'contain', // Asegura que la imagen se escale correctamente
                transition: 'all 0.5s ease', // Transición suave para el cambio de slide
              }}
            />
          </Box>
        </Box>
        {/* Fin Sección derecha */}

        {/* Botón y Estadísticas para Mobile - Sin interferencia de imagen */}
        <Box
          sx={{
            display: { xs: 'flex', lg: 'none' },
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
            width: '100%',
            mt: 14, // Margen superior para separar del texto
            position: 'relative', // Para zIndex
            zIndex: 2, // Por encima de la imagen de fondo
          }}
        >
          {/* Botón Ir a marketplace para Mobile */}
          <Button
            variant="contained"
            sx={{
              backgroundColor: 'primary.main',
              fontWeight: 'bold',
              borderRadius: '8px',
              px: 8.8,
              py: 2.4,
              fontSize: '1.43rem',
              textTransform: 'none',
              boxShadow: '0 4px 15px rgba(25, 118, 210, 0.3)',
              width: 'fit-content', // Ajusta el ancho al contenido
              mt: 28, // Margen superior
              ml: -28, // Ajuste de margen izquierdo
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

          {/* Estadísticas para Mobile */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'row',
              gap: 2,
              alignItems: 'center',
              justifyContent: 'center', // Centra las estadísticas
              width: '100%',
              flexWrap: 'wrap', // Permite que los elementos se envuelvan si no caben
              mb: 2, // Espacio reducido para colocar indicadores debajo
            }}
          >
            {statistics.map((stat, index) => (
              <StatisticCard key={index} stat={stat} isMobile={true} />
            ))}
          </Box>

          {/* Indicadores del carrusel móvil - justo debajo de las estadísticas */}
          <Box
            sx={{
              display: 'flex',
              gap: 1.5,
              justifyContent: 'center',
              alignItems: 'center',
              mt: 1,
              mb: 4,
            }}
          >
            {promoSlides.map((_, index) => (
              <CarouselIndicator
                key={index}
                index={index}
                isActive={index === currentPromoSlide}
                onClick={() => setCurrentPromoSlide(index)}
                variant="mobile"
              />
            ))}
          </Box>
        </Box>
        {/* Fin Botón y Estadísticas para Mobile */}
      </Box>
      {/* Fin Contenido Interno Wrapper */}{' '}
      {/* === FLECHAS DE NAVEGACIÓN PARA MOBILE === */}
      <CarouselNavigationButton
        direction="prev"
        onClick={prevPromoSlide}
        variant="mobile"
      />
      <CarouselNavigationButton
        direction="next"
        onClick={nextPromoSlide}
        variant="mobile"
      />{' '}
      {/* === CONTROLES DEL CARRUSEL PARA DESKTOP (HIJOS DEL HERO BOX PRINCIPAL EXTERNO) === */}
      <CarouselNavigationButton
        direction="prev"
        onClick={prevPromoSlide}
        variant="desktop"
        position={{ xs: '1%', sm: '2%', md: '3%', lg: '2%' }}
      />
      <CarouselNavigationButton
        direction="next"
        onClick={nextPromoSlide}
        variant="desktop"
        position={{ xs: '1%', sm: '2%', md: '3%', lg: '2%' }}
      />
      {/* Indicadores del Carrusel - Desktop */}
      <Box
        sx={{
          display: { xs: 'none', lg: 'flex' }, // Solo visible en desktop
          position: 'absolute',
          bottom: { lg: 20 }, // Más abajo, debajo de las estadísticas
          left: '50%',
          transform: 'translateX(-50%)',
          gap: 1.5,
          zIndex: 5, // Asegura que esté sobre otros elementos del hero
          padding: 1, // Pequeño padding para que no se peguen al borde si hay contenido debajo
          borderRadius: '12px', // Bordes redondeados para el contenedor de indicadores
          backgroundColor: 'rgba(0, 0, 0, 0.1)', // Fondo sutil para agruparlos visualmente
        }}
      >
        {promoSlides.map((_, index) => (
          <CarouselIndicator
            key={index}
            index={index}
            isActive={index === currentPromoSlide}
            onClick={() => setCurrentPromoSlide(index)}
            variant="desktop"
          />
        ))}
      </Box>
    </Box>
  )
}

export default HeroSection
