import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Box, Typography, Button, Grid, Fade } from '@mui/material';
import { Wizard } from '../../../../shared/components/navigation';
import { SERVICES_DATA } from '../constants.jsx';

/**
 * ============================================================================
 * SERVICES SECTION - SECCIÓN "NUESTROS SERVICIOS"
 * ============================================================================
 *
 * Componente UI para la sección de servicios con carrusel interactivo
 *
 * @component
 * @param {Object} props - Propiedades del componente
 * @param {React.RefObject} props.serviciosRef - Referencia para scroll navigation
 *
 * CARACTERÍSTICAS:
 * - Carrusel de servicios con auto-advance
 * - Botones de navegación por categoría de usuario
 * - Timeline visual para cada servicio
 * - Layout responsivo con breakpoints optimizados
 * - Wizard interactivo con controles manuales
 * - Diseño glassmorphism para botones
 * - Grid system responsivo con Material UI
 *
 * SERVICIOS INCLUIDOS:
 * 1. Proveedor: Para vendedores directos
 * 2. Comprador: Para gestión de compras ágiles
 *
 * ARQUITECTURA:
 * - UI puro sin lógica de negocio interna
 * - Datos locales para demo/desarrollo
 * - Componente Wizard reutilizable
 * - Estilos responsive completamente configurados
 * - Animaciones y transiciones suaves
 */
const ServicesSection = ({ serviciosRef }) => {
  // Usar los datos centralizados de constants.jsx
  const services = SERVICES_DATA;

  // Memoizar configuración de breakpoints para evitar recreación en cada render
  const breakpoints = useMemo(() => ({
    container: {
      px: { xs: 1, sm: 1, md: 8, mac: 18, lg: 18, xl: 30 },
      py: { xs: 6, sm: 7, md: 8, mac: 6, lg: 9, xl: 9 },
    },
    title: {
      px: { xs: 0, sm: 0, md: 0, lg: 0, xl: 0 },
      fontSize: {
        xs: '1.55rem',
        sm: '1.8rem',
        md: '2.5rem',
        lg: '2.7rem',
        xl: '2.7rem',
      },
      mb: { xs: 2, sm: 2.5, md: 3, lg: 3.5, xl: 3.5 },
    },
    description: {
      mb: { xs: 4, sm: 5, md: 6, lg: 7, xl: 7 },
      fontSize: {
        xs: '0.95rem',
        sm: '1rem',
        md: '1.2rem',
        lg: '1.3rem',
        xl: '1.3rem',
      },
    },
    wizard: {
      px: { xs: 0, sm: 0, md: 0, lg: 0, xl: 0 },
    },
    buttons: {
      gap: { xs: 2, sm: 2, md: 4, lg: 6, xl: 8 },
      mb: { xs: 2, sm: 2, md: 3, lg: 3, xl: 3 },
      minWidth: { xs: 90, sm: 110, md: 150, lg: 160, xl: 200 },
      maxWidth: { xs: 90, sm: 110, md: 150, lg: 160, xl: 200 },
      height: { xs: 60, sm: 65, md: 80, lg: 90, xl: 100 },
      p: { xs: 0.7, sm: 1, md: 1.2, lg: 1.4, xl: 1.4 },
      titleFontSize: {
        xs: '0.8rem',
        sm: '0.8rem',
        md: '1.1rem',
        lg: '1.2rem',
        xl: '1.2rem',
      },
      descFontSize: {
        xs: '0.7rem',
        sm: '0.7rem',
        md: '0.85rem',
        lg: '1rem',
        xl: '1rem',
      },
    },
    timeline: {
      gap: { xs: 1, sm: 1.3, md: 4, lg: 6, xl: 8 },
      imageSize: { xs: 30, sm: 33, md: 72, lg: 84, xl: 96 }, // Reducido 40%
      borderWidth: { xs: 2, sm: 2.4, md: 3.6, lg: 3.6, xl: 4.2 }, // Reducido 40%
      lineHeight: { xs: 6, sm: 8, md: 12, lg: 12, xl: 14 },
      titleFontSize: {
        xs: '0.65rem',
        sm: '0.85rem',
        md: '1.1rem',
        lg: '1.4rem',
        xl: '1.6rem',
      },
      descFontSize: {
        xs: '0.58rem',
        sm: '0.75rem',
        md: '0.95rem',
        lg: '1rem',
        xl: '1.2rem',
      },
    },
  }), []); // Sin dependencias ya que la configuración es estática
  const [currentStep, setCurrentStep] = useState(0);
  const autoAdvanceInterval = 30000;
  const stepsLength = services.length;
  const autoAdvanceRef = useRef();

  // Solo inicializa el timer una vez al montar o si cambia stepsLength
  useEffect(() => {
    if (autoAdvanceRef.current) {
      clearInterval(autoAdvanceRef.current);
    }
    autoAdvanceRef.current = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % stepsLength);
    }, autoAdvanceInterval);
    return () => {
      if (autoAdvanceRef.current) {
        clearInterval(autoAdvanceRef.current);
      }
    };
  }, [stepsLength]);

  // Reinicia el timer solo si el usuario cambia de step manualmente
  const handleStepChange = useCallback((step) => {
    setCurrentStep(step);
    // Reinicia el timer SOLO si el cambio es manual
    if (autoAdvanceRef.current) {
      clearInterval(autoAdvanceRef.current);
      autoAdvanceRef.current = setInterval(() => {
        setCurrentStep((prev) => (prev + 1) % stepsLength);
      }, autoAdvanceInterval);
    }
  }, [stepsLength]);

  // Memoizar renderStep fuera del JSX para evitar renders infinitos
  const renderStep = useCallback((currentStep, currentService) => {
    return (
      <Grid // GRID CONTENEDOR PADRE
        container
        spacing={0}
        justifyContent="center"
        alignItems="center"
        sx={{
          minWidth: '100%',
          mx: 'auto',
          width: '100%',
        }}
      >
        {/* ✅ COLUMNA ÚNICA: 12 COLUMNAS COMPLETAS - CENTRADA */}
        <Grid
          size={12}
          sx={{ display: 'flex', justifyContent: 'center' }}
        >
          {/* ✅ GRID INTERNO PURO: 1 COLUMNA, 2 FILAS - FORZADO */}
          <Grid
            container
            direction="column"
            spacing={2}
            justifyContent="center"
            sx={{ width: '100%' }}
          >
            {/* ✅ NUEVO: TEXTO DINÁMICO ENTRE BOTONES Y TIMELINE */}
            <Grid size={12} sx={{ width: '100%' }}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  px: 0,
                  py: 0,
                  mb: { xs: 2, sm: 3, md: 4, lg: 6 },
                }}
              >
                <Typography
                  variant="body1"
                  sx={{
                    textAlign: 'center',
                    color: 'common.white',
                    fontSize: {
                      xs: '0.9rem',
                      sm: '1rem',
                      md: '1.1rem',
                      lg: '1.2rem',
                      xl: '1.3rem',
                    },
                    lineHeight: {
                      xs: 1.4,
                      sm: 1.5,
                      md: 1.6,
                      lg: 1.6,
                      xl: 1.6,
                    },
                    maxWidth: '1300px',
                    mx: 'auto',
                    fontWeight: 400,
                    letterSpacing: '0.5px',
                  }}
                >
                  {currentService.title === 'Proveedor'
                    ? 'Accede a un canal de ventas digital de bajo costo, gana visibilidad con nuevos públicos y deja que otros vendan por ti, sin perder control sobre tus precios ni tu stock.'
                    : 'Descubre nuevos proveedores confiables y gestiona tus compras de forma más ágil, ahorrando tiempo en cotizaciones, validaciones y comunicación, todo desde una sola plataforma centralizada.'}
                </Typography>
              </Box>
            </Grid>
            
            {/* 🔄 NUEVO: TIMELINE VERTICAL - REDISEÑO COMPLETO */}
            <Grid size={12} sx={{ width: '100%' }}>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  position: 'relative',
                  maxWidth: { xs: '100%', md: '800px', lg: '900px' },
                  mx: 'auto',
                  px: { xs: 2, sm: 3, md: 4 },
                }}
              >
                {/* Línea vertical conectora */}
                <Box
                  sx={{
                    position: 'absolute',
                    left: {
                      xs: `calc(${breakpoints.timeline.imageSize.xs / 2}px + ${breakpoints.timeline.borderWidth.xs}px + 12px)`, // Ajustado para imágenes más pequeñas
                      sm: `calc(${breakpoints.timeline.imageSize.sm / 2}px + ${breakpoints.timeline.borderWidth.sm}px + 16px)`,
                      md: `calc(${breakpoints.timeline.imageSize.md / 2}px + ${breakpoints.timeline.borderWidth.md}px + 20px)`,
                      lg: `calc(${breakpoints.timeline.imageSize.lg / 2}px + ${breakpoints.timeline.borderWidth.lg}px + 24px)`,
                      xl: `calc(${breakpoints.timeline.imageSize.xl / 2}px + ${breakpoints.timeline.borderWidth.xl}px + 24px)`,
                    },
                    top: {
                      xs: `calc(${breakpoints.timeline.imageSize.xs / 2}px + ${breakpoints.timeline.borderWidth.xs}px + 12px)`,
                      sm: `calc(${breakpoints.timeline.imageSize.sm / 2}px + ${breakpoints.timeline.borderWidth.sm}px + 16px)`,
                      md: `calc(${breakpoints.timeline.imageSize.md / 2}px + ${breakpoints.timeline.borderWidth.md}px + 20px)`,
                      lg: `calc(${breakpoints.timeline.imageSize.lg / 2}px + ${breakpoints.timeline.borderWidth.lg}px + 24px)`,
                      xl: `calc(${breakpoints.timeline.imageSize.xl / 2}px + ${breakpoints.timeline.borderWidth.xl}px + 24px)`,
                    },
                    bottom: {
                      xs: `calc(${breakpoints.timeline.imageSize.xs / 2}px + ${breakpoints.timeline.borderWidth.xs}px + 12px)`,
                      sm: `calc(${breakpoints.timeline.imageSize.sm / 2}px + ${breakpoints.timeline.borderWidth.sm}px + 16px)`,
                      md: `calc(${breakpoints.timeline.imageSize.md / 2}px + ${breakpoints.timeline.borderWidth.md}px + 20px)`,
                      lg: `calc(${breakpoints.timeline.imageSize.lg / 2}px + ${breakpoints.timeline.borderWidth.lg}px + 24px)`,
                      xl: `calc(${breakpoints.timeline.imageSize.xl / 2}px + ${breakpoints.timeline.borderWidth.xl}px + 24px)`,
                    },
                    width: {
                      xs: 3, // Línea también más delgada
                      sm: 3,
                      md: 4,
                      lg: 5,
                      xl: 6,
                    },
                    background: '#1565c0',
                    borderRadius: 3,
                    zIndex: 1,
                  }}
                />

                {/* Pasos del timeline vertical */}
                {currentService.timeline.map((item, index) => (
                  <Box
                    key={index}
                    sx={{
                      display: 'flex',
                      flexDirection: 'row',
                      alignItems: 'center',
                      width: '100%',
                      mb: { xs: 3, sm: 3.5, md: 4, lg: 5 }, // Reducido el espaciado entre elementos
                      position: 'relative',
                      zIndex: 2,
                      '&:last-child': { mb: 0 },
                    }}
                  >
                    {/* Círculo con imagen (izquierda) */}
                    <Box
                      sx={{
                        width: breakpoints.timeline.imageSize,
                        height: breakpoints.timeline.imageSize,
                        borderRadius: '50%',
                        border: `double #1976d2`,
                        borderWidth: breakpoints.timeline.borderWidth,
                        overflow: 'hidden',
                        backgroundColor: 'white',
                        flexShrink: 0,
                        mr: { xs: 1.5, sm: 2, md: 2.5, lg: 3 }, // Reducido el margen derecho
                        boxShadow: `0 0 0 2px rgba(25, 118, 210, 0.3), 0 0 15px rgba(25, 118, 210, 0.2)`,
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          boxShadow: `0 0 0 3px rgba(25, 118, 210, 0.5), 0 0 25px rgba(25, 118, 210, 0.4)`,
                          transform: 'scale(1.05)',
                        },
                      }}
                    >
                      <img
                        src={item.image}
                        alt={item.title}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                      />
                    </Box>

                    {/* Contenido de texto (derecha) */}
                    <Box
                      sx={{
                        flex: 1,
                        textAlign: 'left',
                      }}
                    >
                      <Typography
                        variant="h6"
                        fontWeight="bold"
                        sx={{
                          mb: { xs: 0.5, sm: 0.6, md: 0.8, lg: 1 },
                          fontSize: {
                            xs: '0.8rem',
                            sm: '0.9rem',
                            md: '1.1rem',
                            lg: '1.2rem',
                            xl: '1.4rem',
                          },
                          color: 'common.white',
                          lineHeight: 1.2,
                        }}
                      >
                        {item.title}
                      </Typography>
                      {item.title === 'Define tus condiciones' ? (
                        <Typography
                          variant="body2"
                          color="common.white"
                          sx={{
                            fontSize: {
                              xs: '0.7rem',
                              sm: '0.8rem',
                              md: '0.9rem',
                              lg: '1rem',
                              xl: '1.1rem',
                            },
                            lineHeight: {
                              xs: 1.3,
                              sm: 1.4,
                              md: 1.5,
                              lg: 1.6,
                            },
                            opacity: 0.9,
                            pl: { xs: 1, sm: 1.2, md: 3 }, // Sangría a la derecha solo para este texto
                          }}
                          dangerouslySetInnerHTML={{ __html: item.description }}
                        />
                      ) : (
                        <Typography
                          variant="body2"
                          color="common.white"
                          sx={{
                            fontSize: {
                              xs: '0.7rem',
                              sm: '0.8rem',
                              md: '0.9rem',
                              lg: '1rem',
                              xl: '1.1rem',
                            },
                            lineHeight: {
                              xs: 1.3,
                              sm: 1.4,
                              md: 1.5,
                              lg: 1.6,
                            },
                            opacity: 0.9,
                          }}
                          dangerouslySetInnerHTML={{ __html: item.description }}
                        />
                      )}
                    </Box>
                  </Box>
                ))}
              </Box>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    );
  }, [breakpoints]);

  return (
    <Box
      ref={serviciosRef}
      sx={{
        width: '100%',
        background: 'linear-gradient(120deg, #000 80%, #1565c0 120%)',
        height: { xs: 'auto', sm: 'auto', md: 1100 },
        py: { xs: 6, sm: 7, md: 8, mac: 6, lg: 9, xl: 9 },
        boxSizing: 'border-box',
        position: 'relative',
        zIndex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start',
        alignItems: 'left',
        px: { xs: 2.5, sm: 3, md: 8, mac: 18, lg: 18, xl: 30 }, // Padding lateral igual que en Home
      }}
    >
      {/* Contenedor interno sin padding lateral */}
      <Box sx={{ width: '100%' }}>
        {/* Título y texto descriptivo */}
        <Box
          sx={{
            py: { xs: 4, sm: 5, md: 2 }, // Reducido el padding vertical en desktop
            ...breakpoints.title,
            textAlign: { xs: 'center', md: 'left' },
            alignItems: { xs: 'center', md: 'stretch' },
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            justifyContent: { xs: 'center', md: 'flex-start' },
            gap: { xs: 3, md: 4, lg: 7  },
            width: '100%',
            maxWidth: 'none',
            mx: 0,
            maxHeight: { xs: 'none', sm: 'none', md: 210 },
          }}
        >
          {/* Texto a la izquierda */}
          <Box
            sx={{
              flex: 1,
              minWidth: 0,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              width: '100%',
              maxWidth: { xs: '100%', md: '550px' },
              alignItems: { xs: 'center', md: 'flex-start' },
            }}
          >
            <Typography
              variant="h3"
              fontWeight="bold"
              gutterBottom
              sx={{
                fontSize: breakpoints.title.fontSize,
                textAlign: { xs: 'center', md: 'left' },
                mb: breakpoints.title.mb,
                color: 'common.white',
                ml: 0,
                pl: 0,
                width: { xs: '100%', md: 'auto' },
              }}
            >
              Nuestros Servicios
            </Typography>
            <Typography
              variant="h6"
              sx={{
                mb: breakpoints.description.mb,
                textAlign: { xs: 'center', md: 'left' },
                fontSize: breakpoints.description.fontSize,
                maxWidth: { xs: '100%', md: '550px' },
                mx: 0,
                ml: 0,
                pl: 0,
                lineHeight: 1.6,
                color: 'common.white',
              }}
            >
              Ofrecemos una plataforma intuitiva para descubrir productos,
              conectar con proveedores confiables y gestionar tus ventas de manera
              eficiente. Conoce nuestros dos pilares fundamentales:
            </Typography>
          </Box>
          {/* Botones a la derecha en desktop, debajo en mobile */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'row',
              gap: { xs: 2, md: 3 },
              alignItems: 'center',
              justifyContent: { xs: 'center', md: 'flex-end' },
              mt: { xs: 2, md: 0 },
              mb: { xs: 2, md: 0 },
              minWidth: { xs: 'unset', md: 350 },
              ml: { xs: 0, md: 4 },
              width: { xs: '100%', md: 'auto' },
            }}
          >
            {services.map((service, index) => (
              <Button
                key={index}
                variant={currentStep === index ? 'contained' : 'outlined'}
                onClick={() => handleStepChange(index)}
                sx={{
                  p: {
                    ...breakpoints.buttons.p,
                    xl: 3, // Aumenta el padding interno lateral en xl
                  },
                  px: { ...breakpoints.buttons.px, xl: 4 }, // padding horizontal extra en xl
                  justifyContent: 'center',
                  textAlign: 'center',
                  height: breakpoints.buttons.height,
                  flexDirection: 'column',
                  alignItems: 'center',
                  transition: 'all 0.3s ease',
                  backgroundColor:
                    currentStep === index
                      ? '#1976d2'
                      : 'rgba(255, 255, 255, 0.05)',
                  border:
                    currentStep === index
                      ? '2.5px solid #1976d2'
                      : '1.5px solid rgba(25, 118, 210, 0.3)',
                  minWidth: breakpoints.buttons.minWidth,
                  maxWidth: breakpoints.buttons.maxWidth,
                  width: breakpoints.buttons.maxWidth,
                  borderRadius: 2,
                  display: 'flex',
                  overflow: 'hidden',
                  backdropFilter:
                    currentStep === index ? 'none' : 'blur(10px)',
                  boxShadow:
                    currentStep === index
                      ? '0 8px 32px rgba(25, 118, 210, 0.3)'
                      : '0 4px 20px rgba(255, 255, 255, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                  '&:hover': {
                    backgroundColor:
                      currentStep === index
                        ? '#1565c0'
                        : 'rgba(25, 118, 210, 0.15)',
                    borderColor: '#1976d2',
                    transform: 'translateY(-2px)',
                    boxShadow:
                      currentStep === index
                        ? '0 12px 40px rgba(25, 118, 210, 0.4)'
                        : '0 8px 32px rgba(25, 118, 210, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
                    backdropFilter: 'blur(15px)',
                  },
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: {
                      xs: 0.3,
                      sm: 0.3,
                      md: 1,
                      lg: 1,
                      xl: 0.3,
                    },
                    flexShrink: 0,
                    textAlign: 'center',
                    width: '100%',
                    minWidth: 0,
                  }}
                >
                  {service.icon}
                  <Typography
                    variant="h6"
                    fontWeight="bold"
                    sx={{
                      fontSize: breakpoints.buttons.titleFontSize,
                      textAlign: 'center',
                      lineHeight: {
                        xs: 1.1,
                        sm: 1.1,
                        md: 1.2,
                        lg: 1.2,
                        xl: 1.1,
                      },
                      width: '100%',
                      maxWidth: '100%',
                      minWidth: 0,
                      wordBreak: 'break-word',
                      overflowWrap: 'break-word',
                      whiteSpace: 'normal',
                    }}
                  >
                    {service.title}
                  </Typography>
                </Box>

                <Typography
                  variant="body2"
                  sx={{
                    color: 'white',
                    fontSize: breakpoints.buttons.descFontSize,
                    textAlign: 'center',
                    mt: 1,
                  }}
                >
                  {service.description}
                </Typography>
              </Button>
            ))}
          </Box>
        </Box>
        {/* Wizard con todo el contenido interactivo */}
        <Box sx={breakpoints.wizard}>
          <Fade in={true} timeout={350} key={currentStep}>
            <Box sx={{ width: '100%' }}>
              {renderStep(currentStep, services[currentStep])}
            </Box>
          </Fade>
        </Box>
      </Box>
    </Box>
  );
};

export default ServicesSection;
