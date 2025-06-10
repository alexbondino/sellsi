import React from 'react';
import { Box, Typography, Button, Grid } from '@mui/material';
import {
  Store,
  Person,
  Inventory,
  Visibility,
  AttachMoney,
  LocalShipping,
  CheckCircle,
  TrendingUp,
  Groups,
  ShoppingCart,
  AccountBalance,
  Receipt,
} from '@mui/icons-material';
import Wizard from '../../../features/ui/Wizard';

const ServicesSection = ({ serviciosRef }) => {
  // Datos de los servicios para el Wizard (extraído exactamente del original)
  const services = [
    {
      title: 'Proveedor',
      description: 'Vende tus productos de forma directa',
      icon: <Store sx={{ fontSize: { xs: 16, sm: 20, md: 28 } }} />,
      image: '/Landing Page/Proveedor.webp',
      timeline: [
        {
          title: 'Publica',
          description: 'Sube tus productos en el el sitio web',
          icon: <Inventory />,
          image: '/Landing Page/Proveedor/publica.webp',
        },
        {
          title: 'Hazte visible',
          description: 'Tu catálogo será visible para miles de vendedores',
          icon: <Visibility />,
          image: '/Landing Page/Proveedor/visible.webp',
        },
        {
          title: 'Define tu precio',
          description: 'Establece precios y condiciones de venta',
          icon: <AttachMoney />,
          image: '/Landing Page/Proveedor/define.webp',
        },
        {
          title: 'Despacho',
          description: 'Coordina la entrega directa a tus clientes',
          icon: <LocalShipping />,
          image: '/Landing Page/Proveedor/despacho.webp',
        },
        {
          title: 'Venta exitosa',
          description: 'Recibe el pago y construye tu reputación',
          icon: <CheckCircle />,
          image: '/Landing Page/Proveedor/venta.webp',
        },
      ],
    },
    // {
    //   title: 'Intermediario',
    //   description: 'Vende productos de proveedores y gana comisión',
    //   icon: <Person sx={{ fontSize: { xs: 16, sm: 20, md: 28 } }} />,
    //   image: '/Landing Page/Vendedor.webp',
    //   timeline: [
    //     {
    //       title: 'Elige productos',
    //       description:
    //         'Explora nuestro catálogo y selecciona lo que quieres vender',
    //       icon: <ShoppingCart />,
    //       image: '/Landing Page/Vendedor/elige.webp',
    //     },
    //     {
    //       title: 'Vende como quieras',
    //       description: 'Usa redes sociales, tienda física o marketplace',
    //       icon: <TrendingUp />,
    //       image: '/Landing Page/Vendedor/vendecomoquieras.webp',
    //     },
    //     {
    //       title: 'Gana comisión',
    //       description: 'Obtén ganancias por cada venta realizada',
    //       icon: <AttachMoney />,
    //       image: '/Landing Page/Vendedor/ganacomision.webp',
    //     },
    //   ],
    // },
    {
      title: 'Comprador',
      description: 'Gestiona tus compras de forma ágil',
      icon: <Groups sx={{ fontSize: { xs: 16, sm: 20, md: 28 } }} />,
      image: '/Landing Page/Punto de Venta.webp',
      timeline: [
        {
          title: 'Vende tu espacio',
          description: 'Ofrece tu local como punto de retiro',
          icon: <Store />,
          image: '/Landing Page/PuntoDeVenta/vendeespacio.webp',
        },
        {
          title: 'Suma productos',
          description: 'Amplía tu oferta con productos de otros proveedores',
          icon: <Inventory />,
          image: '/Landing Page/PuntoDeVenta/sumaproductos.webp',
        },
        {
          title: 'Simple y transparente',
          description: 'Proceso fácil de gestionar y comisiones claras',
          icon: <Receipt />,
          image: '/Landing Page/PuntoDeVenta/simpletransparente.webp',
        },
        {
          title: 'Acuerdo económico',
          description: 'Genera ingresos adicionales con tu espacio',
          icon: <AccountBalance />,
          image: '/Landing Page/PuntoDeVenta/acuerdodinero.webp',
        },
      ],
    },
  ]; // ✅ CONFIGURACIÓN OPTIMIZADA DE BREAKPOINTS (SIN REDUNDANCIAS)
  const breakpoints = {
    container: {
      px: { xs: 1, sm: 1, md: 8, lg: 15, xl: 30 }, // ✅ REDUCIDO PADDING LATERAL EN XS/SM PARA MÁS ANCHO
      py: { xs: 6, sm: 7, md: 8, lg: 9, xl: 9 },
    },
    title: {
      px: { xs: 0, sm: 0, md: 0, lg: 0, xl: 0 }, // ✅ SIN PADDING - ALINEADO COMPLETAMENTE A LA IZQUIERDA
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
      px: { xs: 0, sm: 0, md: 0, lg: 0, xl: 0 }, // ✅ ELIMINADO PADDING ADICIONAL
    },
    buttons: {
      gap: { xs: 3, sm: 3, md: 6, lg: 8, xl: 12 }, // ✅ Aumentado gap para mejor separación
      mb: { xs: 3, sm: 3, md: 4, lg: 4, xl: 4 },
      minWidth: { xs: 140, sm: 160, md: 230, lg: 240, xl: 305 }, // ✅ Botones más anchos en xs,sm,md,lg
      maxWidth: { xs: 140, sm: 160, md: 230, lg: 240, xl: 305 }, // ✅ Botones más anchos en xs,sm,md,lg
      height: { xs: 100, sm: 100, md: 120, lg: 150, xl: 150 }, // ✅ Aumentado altura
      p: { xs: 1, sm: 1.35, md: 2, lg: 2.2, xl: 2.2 },
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
      imageSize: { xs: 50, sm: 55, md: 120, lg: 140, xl: 160 },
      borderWidth: { xs: 3, sm: 4, md: 6, lg: 6, xl: 7 },
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
  };
  return (
    <Box
      ref={serviciosRef}
      sx={{
        ...breakpoints.container,
        backgroundColor: '#000000',
      }}
    >
      {/* Título y texto descriptivo */}
      <Box sx={breakpoints.title}>
        {' '}
        <Typography
          variant="h3"
          fontWeight="bold"
          gutterBottom
          sx={{
            fontSize: breakpoints.title.fontSize,
            textAlign: 'left',
            mb: breakpoints.title.mb,
            color: 'common.white',
            ml: 0, // ✅ FUERZA margen izquierdo 0
            pl: 0, // ✅ FUERZA padding izquierdo 0
          }}
        >
          Nuestros Servicios
        </Typography>{' '}
        <Typography
          variant="h6"
          sx={{
            mb: breakpoints.description.mb,
            textAlign: 'left',
            fontSize: breakpoints.description.fontSize,
            maxWidth: '800px',
            mx: 0, // Sin margen horizontal
            ml: 0, // ✅ FUERZA margen izquierdo 0
            pl: 0, // ✅ FUERZA padding izquierdo 0
            lineHeight: 1.6,
            color: 'common.white',
          }}
        >
          Ofrecemos una plataforma intuitiva para descubrir productos, conectar
          con proveedores confiables y gestionar tus ventas de manera eficiente.
          Conoce nuestros tres pilares fundamentales:
        </Typography>
      </Box>

      {/* Wizard con todo el contenido interactivo */}
      <Box sx={breakpoints.wizard}>
        {' '}
        <Wizard
          steps={services}
          autoAdvance={true}
          autoAdvanceInterval={15000}
          showControls={false}
          showIndicators={false}
          fadeTransition={false}
          fadeTimeout={0}
          renderStep={(currentStep, currentService, { goToStep }) => (
            <Grid // GRID CONTENEDOR PADRE
              container
              spacing={0}
              justifyContent="center"
              alignItems="center"
              sx={{
                minWidth: '100%', // ✅ SIMPLIFICADO: USAR 100% EN TODOS LOS BREAKPOINTS
                mx: 'auto', // ← CENTRADO HORIZONTAL
                width: '100%',
              }}
            >
              {/* ✅ COLUMNA ÚNICA: 12 COLUMNAS COMPLETAS - CENTRADA */}{' '}
              <Grid
                item
                xs={12}
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
                  {/* ✅ FILA 1: BOTONES DE SERVICIOS - GRID PURO */}
                  <Grid item xs={12} sx={{ width: '100%' }}>
                    <Grid
                      container
                      direction="row"
                      spacing={breakpoints.buttons.gap}
                      justifyContent="center"
                      sx={{
                        mb: breakpoints.buttons.mb,
                        overflowX: { xs: 'auto', sm: 'auto', md: 'visible' },
                        pb: { xs: 1, sm: 0 },
                        width: '100%',
                      }}
                    >
                      {services.map((service, index) => (
                        <Grid item key={index}>
                          {' '}
                          <Button
                            variant={
                              index === currentStep ? 'contained' : 'outlined'
                            }
                            onClick={() => goToStep(index)}
                            sx={{
                              p: breakpoints.buttons.p,
                              justifyContent: 'center',
                              textAlign: 'center',
                              height: breakpoints.buttons.height, // ✅ Alto controlado
                              flexDirection: 'column',
                              alignItems: 'center',
                              transition: 'all 0.3s ease',
                              backgroundColor:
                                index === currentStep
                                  ? '#1976d2'
                                  : 'rgba(255, 255, 255, 0.05)', // Fondo semitransparente cuando no está activo                              borderColor: index === currentStep ? '#1976d2' : 'rgba(25, 118, 210, 0.3)',
                              border:
                                index === currentStep
                                  ? '2.5px solid #1976d2'
                                  : '1.5px solid rgba(25, 118, 210, 0.3)',
                              minWidth: breakpoints.buttons.minWidth, // ✅ Ancho controlado
                              maxWidth: breakpoints.buttons.maxWidth, // ✅ FUERZA EL ANCHO MÁXIMO
                              width: breakpoints.buttons.maxWidth, // ✅ FUERZA EL ANCHO EXACTO
                              borderRadius: 2,
                              display: 'flex', // ✅ Asegurar flex
                              overflow: 'hidden', // ✅ CORTA CONTENIDO QUE SE DESBORDE
                              // Efecto glassmorphism para botones no activos
                              backdropFilter:
                                index === currentStep ? 'none' : 'blur(10px)',
                              boxShadow:
                                index === currentStep
                                  ? '0 8px 32px rgba(25, 118, 210, 0.3)'
                                  : '0 4px 20px rgba(255, 255, 255, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                              '&:hover': {
                                backgroundColor:
                                  index === currentStep
                                    ? '#1565c0'
                                    : 'rgba(25, 118, 210, 0.15)', // Hover más azul y menos transparente
                                borderColor: '#1976d2',
                                transform: 'translateY(-2px)',
                                boxShadow:
                                  index === currentStep
                                    ? '0 12px 40px rgba(25, 118, 210, 0.4)'
                                    : '0 8px 32px rgba(25, 118, 210, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
                                backdropFilter: 'blur(15px)',
                              },
                            }}
                          >
                            {' '}
                            <Box
                              sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                height: '100%',
                                width: '100%', // ✅ Ocupa todo el ancho disponible
                                minWidth: 0, // ✅ CLAVE: Permite ser más angosto que el contenido
                                gap: {
                                  xs: 0.5,
                                  sm: 0.8,
                                  md: 1,
                                  lg: 1.2,
                                  xl: 1.2,
                                },
                              }}
                            >
                              {/* Icono y título - Distribución inteligente */}{' '}
                              <Box
                                sx={{
                                  display: 'flex',
                                  flexDirection: {
                                    xs: 'column', // Vertical en mobile (botón angosto)
                                    sm: 'column', // Vertical en small (botón angosto)
                                    md: 'row', // Horizontal en medium+ (botón más ancho)
                                    lg: 'row', // Horizontal en large+
                                    xl: 'column', // ✅ CAMBIO: Vertical en xl (botón muy angosto)
                                  },
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
                                  width: '100%', // ✅ Ocupa todo el ancho disponible
                                  minWidth: 0, // ✅ CLAVE: Permite ser más angosto que el contenido
                                }}
                              >
                                {service.icon}{' '}
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
                                    // ✅ PERMITIR AJUSTE DEL TÍTULO TAMBIÉN
                                    width: '100%',
                                    maxWidth: '100%',
                                    minWidth: 0, // ✅ CLAVE: Permite ser más angosto que el contenido
                                    wordBreak: 'break-word', // ✅ Permite ruptura de palabras largas
                                    overflowWrap: 'break-word',
                                    whiteSpace: 'normal',
                                  }}
                                >
                                  {service.title}
                                </Typography>
                              </Box>{' '}
                              {/* Descripción - Aprovecha el espacio vertical */}{' '}
                              <Typography
                                variant="body2"
                                sx={{
                                  color:
                                    index === currentStep
                                      ? 'white'
                                      : 'common.white',
                                  textAlign: 'center',
                                  fontSize: breakpoints.buttons.descFontSize,
                                  flex: 1,
                                  display: 'block', // ✅ Block para permitir wrap
                                  lineHeight: {
                                    xs: 1.2, // Texto más compacto en mobile
                                    sm: 1.2, // Texto más compacto en small
                                    md: 1.3, // Texto normal en medium
                                    lg: 1.4, // Texto más espaciado en large
                                    xl: 1.2, // Texto compacto en xl (botón angosto)
                                  }, // ✅ AJUSTE MEJORADO PARA EVITAR CORTE DE PALABRAS
                                  width: '100%', // Ocupar todo el ancho disponible
                                  maxWidth: '100%', // No exceder el ancho del contenedor
                                  minWidth: 0, // ✅ CLAVE: Permite ser más angosto que el contenido
                                  wordBreak: 'keep-all', // ✅ EVITA corte de palabras en xs/sm
                                  overflowWrap: 'break-word', // ✅ Solo rompe palabras largas si es necesario
                                  whiteSpace: 'normal', // ✅ Permite saltos de línea normales                                  hyphens: 'none', // ✅ Sin guiones automáticos
                                  // ✅ MANEJO DE OVERFLOW mejorado
                                  overflow: 'visible', // ✅ Permite que el texto se expanda
                                  textOverflow: 'unset', // ✅ Sin truncamiento
                                  padding: {
                                    xs: '8px 2px', // Padding mínimo
                                    sm: '8px 2px',
                                    md: '12px 8px',
                                    lg: '16px 8px',
                                    xl: '16px 1px', // ✅ Padding ultra-mínimo en XL
                                  },
                                }}
                              >
                                {service.description}
                              </Typography>
                            </Box>
                          </Button>
                        </Grid>
                      ))}{' '}
                    </Grid>
                  </Grid>{' '}
                  {/* ✅ NUEVO: TEXTO DINÁMICO ENTRE BOTONES Y TIMELINE */}
                  <Grid item xs={12} sx={{ width: '100%' }}>
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
                  {/* ✅ FILA 2: TIMELINE HORIZONTAL - GRID PURO */}
                  <Grid item xs={12} sx={{ width: '100%' }}>
                    <Grid
                      container
                      direction="row"
                      spacing={breakpoints.timeline.gap}
                      justifyContent="center"
                      alignItems="flex-start"
                      sx={{
                        position: 'relative',
                        px: { xs: 1, sm: 1, md: 0 },
                        width: '100%',
                      }}
                    >
                      {' '}
                      {/* Línea conectora - Fórmula universal para todos los servicios */}
                      <Box
                        sx={{
                          position: 'absolute',
                          // Posición vertical: centro de las imágenes
                          top: {
                            xs: `calc(${
                              breakpoints.timeline.imageSize.xs / 2
                            }px + ${
                              breakpoints.timeline.borderWidth.xs
                            }px + 2.8 * 8px)`,
                            sm: `calc(${
                              breakpoints.timeline.imageSize.sm / 2
                            }px + ${
                              breakpoints.timeline.borderWidth.sm
                            }px + 3 * 8px)`,
                            md: `calc(${
                              breakpoints.timeline.imageSize.md / 2
                            }px + ${breakpoints.timeline.borderWidth.md}px)`,
                            lg: `calc(${
                              breakpoints.timeline.imageSize.lg / 2
                            }px + ${breakpoints.timeline.borderWidth.lg}px)`,
                            xl: `calc(${
                              breakpoints.timeline.imageSize.xl / 2
                            }px + ${breakpoints.timeline.borderWidth.xl}px)`,
                          }, // Fórmula extendida: líneas ~13% más largas para conectar mejor los círculos
                          left: {
                            xs: `calc((100% / ${
                              currentService.timeline.length
                            }) * 0.37 + ${
                              breakpoints.timeline.imageSize.xs / 2 +
                              breakpoints.timeline.borderWidth.xs
                            }px)`,
                            sm: `calc((100% / ${
                              currentService.timeline.length
                            }) * 0.37 + ${
                              breakpoints.timeline.imageSize.sm / 2 +
                              breakpoints.timeline.borderWidth.sm
                            }px)`,
                            md: `calc((100% / ${
                              currentService.timeline.length
                            }) * 0.37 + ${
                              breakpoints.timeline.imageSize.md / 2 +
                              breakpoints.timeline.borderWidth.md
                            }px)`,
                            lg: `calc((100% / ${
                              currentService.timeline.length
                            }) * 0.37 + ${
                              breakpoints.timeline.imageSize.lg / 2 +
                              breakpoints.timeline.borderWidth.lg
                            }px)`,
                            xl: `calc((100% / ${
                              currentService.timeline.length
                            }) * 0.37 + ${
                              breakpoints.timeline.imageSize.xl / 2 +
                              breakpoints.timeline.borderWidth.xl
                            }px)`,
                          },
                          // Fórmula extendida: líneas ~13% más largas para conectar mejor los círculos
                          right: {
                            xs: `calc((100% / ${
                              currentService.timeline.length
                            }) * 0.37 + ${
                              breakpoints.timeline.imageSize.xs / 2 +
                              breakpoints.timeline.borderWidth.xs
                            }px)`,
                            sm: `calc((100% / ${
                              currentService.timeline.length
                            }) * 0.37 + ${
                              breakpoints.timeline.imageSize.sm / 2 +
                              breakpoints.timeline.borderWidth.sm
                            }px)`,
                            md: `calc((100% / ${
                              currentService.timeline.length
                            }) * 0.37 + ${
                              breakpoints.timeline.imageSize.md / 2 +
                              breakpoints.timeline.borderWidth.md
                            }px)`,
                            lg: `calc((100% / ${
                              currentService.timeline.length
                            }) * 0.37 + ${
                              breakpoints.timeline.imageSize.lg / 2 +
                              breakpoints.timeline.borderWidth.lg
                            }px)`,
                            xl: `calc((100% / ${
                              currentService.timeline.length
                            }) * 0.37 + ${
                              breakpoints.timeline.imageSize.xl / 2 +
                              breakpoints.timeline.borderWidth.xl
                            }px)`,
                          },
                          height: {
                            xs: 4,
                            sm: 6,
                            md: 8,
                            lg: 10,
                            xl: 12,
                          },
                          background:
                            'linear-gradient(90deg,rgb(25, 210, 210) 0%, #1976d2 100%)',
                          borderRadius: 2,
                          zIndex: 1,
                        }}
                      />{' '}
                      {/* Pasos del timeline - GRID PURO CON DISTRIBUCIÓN UNIFORME */}
                      {currentService.timeline.map((item, index) => (
                        <Grid
                          item
                          key={index}
                          xs={true} // Distribución equitativa automática
                          sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            position: 'relative',
                            zIndex: 2,
                            flex: 1, // Asegura distribución uniforme
                          }}
                        >
                          {/* Imagen del paso */}{' '}
                          <Box
                            sx={{
                              width: breakpoints.timeline.imageSize,
                              height: breakpoints.timeline.imageSize,
                              borderRadius: '50%',
                              border: `double #1976d2`,
                              borderWidth: breakpoints.timeline.borderWidth,
                              overflow: 'hidden',
                              mb: { xs: 0, sm: 1, md: 2, lg: 2.5 },
                              mt: { xs: 2.8, sm: 3, md: 0 },
                              backgroundColor: 'white',
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
                          {/* Contenido del paso */}
                          <Box
                            sx={{
                              textAlign: 'center',
                              maxWidth: {
                                xs: 100,
                                sm: 140,
                                md: 240,
                                lg: 260,
                              },
                            }}
                          >
                            <Typography
                              variant="h6"
                              fontWeight="bold"
                              sx={{
                                mb: { xs: 0.5, sm: 0.7, md: 1.2, lg: 1.2 },
                                fontSize: breakpoints.timeline.titleFontSize,
                                color: 'primary.main',
                              }}
                            >
                              {item.title}
                            </Typography>{' '}
                            <Typography
                              variant="body2"
                              color="common.white"
                              sx={{
                                lineHeight: {
                                  xs: 1.0,
                                  sm: 1.1,
                                  md: 1.3,
                                  lg: 1.5,
                                },
                                fontSize: breakpoints.timeline.descFontSize,
                              }}
                            >
                              {item.description}
                            </Typography>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          )}
        />
      </Box>
    </Box>
  );
};

export default ServicesSection;
