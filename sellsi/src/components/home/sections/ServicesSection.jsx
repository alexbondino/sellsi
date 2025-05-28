import React from 'react'
import { Box, Typography, Button } from '@mui/material'
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
} from '@mui/icons-material'
import Wizard from '../../shared/Wizard'

const ServicesSection = ({ serviciosRef }) => {
  // Datos de los servicios para el Wizard (extraído exactamente del original)
  const services = [
    {
      title: 'Proveedor',
      description: 'Vende tus productos de forma directa',
      icon: <Store sx={{ fontSize: { xs: 20, md: 24 } }} />,
      image: '/Landing Page/Proveedor.webp',
      timeline: [
        {
          title: 'Publica',
          description:
            'Sube tus productos con fotos y descripciones detalladas',
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
          description: 'Establece precios competitivos y condiciones de venta',
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
    {
      title: 'Vendedor',
      description: 'Encuentra productos para revender',
      icon: <Person sx={{ fontSize: { xs: 20, md: 24 } }} />,
      image: '/Landing Page/Vendedor.webp',
      timeline: [
        {
          title: 'Elige productos',
          description:
            'Explora nuestro catálogo y selecciona lo que quieres vender',
          icon: <ShoppingCart />,
          image: '/Landing Page/Vendedor/elige.webp',
        },
        {
          title: 'Vende como quieras',
          description: 'Usa redes sociales, tienda física o marketplace',
          icon: <TrendingUp />,
          image: '/Landing Page/Vendedor/vendecomoquieras.webp',
        },
        {
          title: 'Gana comisión',
          description: 'Obtén ganancias por cada venta realizada',
          icon: <AttachMoney />,
          image: '/Landing Page/Vendedor/ganacomision.webp',
        },
      ],
    },
    {
      title: 'Punto de Venta',
      description: 'Optimiza tu espacio comercial',
      icon: <Groups sx={{ fontSize: { xs: 20, md: 24 } }} />,
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
  ]

  return (
    <Box
      ref={serviciosRef}
      sx={{
        // SOLUCIÓN LAYOUT DESKTOP: Padding izquierdo reducido para servicios
        px: { xs: 2, sm: 4, md: 2, lg: 4, xl: 8 }, // Padding izquierdo reducido en desktop
        py: { xs: 6, md: 8 },
        backgroundColor: '#e6e6e6',
      }}
    >
      {/* Título y texto descriptivo */}
      <Box
        sx={{
          px: { xs: 0, md: 4, lg: 8, xl: 15 }, // Padding reducido para títulos de servicios
        }}
      >
        <Typography
          variant="h3"
          fontWeight="bold"
          gutterBottom
          sx={{
            fontSize: { xs: '2rem', md: '2.5rem' },
            textAlign: 'left',
            mb: { xs: 2, md: 3 },
            color: 'common.black',
          }}
        >
          Nuestros Servicios
        </Typography>
        <Typography
          variant="h6"
          sx={{
            mb: { xs: 4, md: 6 },
            textAlign: 'left',
            fontSize: { xs: '1rem', md: '1.2rem' },
            maxWidth: '800px',
            mx: 0,
            lineHeight: 1.6,
            color: 'text.secondary',
          }}
        >
          Ofrecemos una plataforma intuitiva para descubrir productos, conectar
          con proveedores confiables y gestionar tus ventas de manera eficiente.
          Conoce nuestros tres pilares fundamentales:
        </Typography>
      </Box>

      {/* Wizard con todo el contenido interactivo */}
      <Box
        sx={{
          // PADDING WIZARD: Reducido para alineación con el contenido
          px: { xs: 0, md: 6, lg: 12, xl: 20 },
        }}
      >
        <Wizard
          steps={services}
          autoAdvance={true}
          autoAdvanceInterval={30000}
          showControls={true}
          fadeTransition={true}
          fadeTimeout={500}
          renderStep={(currentStep, currentService, { goToStep }) => {
            // CONFIGURACIÓN DINÁMICA DE GAPS: Diferentes espacios entre círculos según el tipo de servicio
            const getTimelineConfig = (serviceTitle) => {
              switch (serviceTitle) {
                case 'Proveedor':
                  return {
                    maxWidth: { xs: '100%', md: '2800px' }, // Gap más amplio para Proveedor
                    justifyContent: {
                      xs: 'flex-start',
                      md: 'center',
                    }, // CENTRAR: Desktop centrado
                    gap: { xs: 2, md: 26 }, // Gap extra entre círculos
                    linePosition: '85px', // Posición específica de línea para Proveedor
                  }
                case 'Vendedor':
                  return {
                    maxWidth: { xs: '100%', md: '2400px' }, // Gap medio para Vendedor
                    justifyContent: {
                      xs: 'flex-start',
                      md: 'center',
                    }, // CENTRAR: Desktop centrado
                    gap: { xs: 3, md: 38 },
                    linePosition: '150px', // Posición específica de línea para Vendedor
                  }
                case 'Punto de Venta':
                  return {
                    maxWidth: { xs: '100%', md: '2100px' }, // Gap más compacto para Punto de Venta
                    justifyContent: {
                      xs: 'flex-start',
                      md: 'center',
                    }, // CENTRAR: Desktop centrado
                    gap: { xs: 2, md: 26 },
                    linePosition: '95px', // Posición específica para Punto de Venta
                  }
                default:
                  return {
                    maxWidth: { xs: '100%', md: '3000px' },
                    justifyContent: {
                      xs: 'flex-start',
                      md: 'center',
                    }, // CENTRAR: Desktop centrado
                    gap: { xs: 2, md: 6 },
                    linePosition: '85px', // Posición por defecto
                  }
              }
            }

            const timelineConfig = getTimelineConfig(currentService.title)

            return (
              <Box
                sx={{
                  display: 'flex',
                  gap: { xs: 3, md: 0 },
                  alignItems: 'flex-start',
                  flexDirection: { xs: 'column', lg: 'column' }, // CENTRAR: Cambiar a column en desktop para centrado
                  // CENTRAR: Remover márgenes negativos y centrar
                  mx: { xs: 0, md: 0 },
                  justifyContent: 'center',
                }}
              >
                {/* Imagen del servicio actual - Solo en mobile */}
                <Box
                  sx={{
                    display: { xs: 'flex', lg: 'none' }, // Solo mostrar en mobile
                    width: '100%',
                    justifyContent: 'center',
                    mb: 3,
                  }}
                >
                  <img
                    src={currentService.image}
                    alt={currentService.title}
                    style={{
                      width: '100%',
                      maxWidth: '300px',
                      height: 'auto',
                      borderRadius: '12px',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                    }}
                  />
                </Box>

                {/* Contenido del servicio */}
                <Box
                  sx={{
                    flex: { xs: 'none', lg: 1 }, // Volver a flex 1
                    width: '100%',
                    // CENTRAR CONTENIDO: Centrar timeline y botones en desktop
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: { xs: 'stretch', md: 'center' }, // CENTRAR: Alinear al centro en desktop
                    justifyContent: 'center', // CENTRAR: Justificar al centro
                    // Sin padding para permitir centrado completo
                    pl: { xs: 0, md: 0 },
                  }}
                >
                  {/* Botones de servicios */}
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: { xs: 'row', md: 'row' },
                      gap: 2,
                      mb: 4,
                      overflowX: { xs: 'auto', md: 'visible' },
                      pb: { xs: 2, md: 0 },
                      justifyContent: {
                        xs: 'flex-start',
                        md: 'center', // CENTRAR: Alinear botones al centro en desktop
                      },
                    }}
                  >
                    {services.map((service, index) => (
                      <Button
                        key={index}
                        variant={
                          index === currentStep ? 'contained' : 'outlined'
                        }
                        onClick={() => goToStep(index)}
                        sx={{
                          // TAMAÑO BOTONES: Mobile reducido 10% (1.5->1.35), mismo tamaño para todos
                          p: { xs: 1.35, md: 2 },
                          justifyContent: 'center',
                          textAlign: 'center',
                          height: 'auto',
                          flexDirection: 'column',
                          alignItems: 'center',
                          transition: 'all 0.3s ease',
                          backgroundColor:
                            index === currentStep
                              ? 'primary.main'
                              : 'transparent',
                          borderColor: 'primary.main', // ANCHO BOTONES: Mobile +20% (120->144), Desktop original (150)
                          minWidth: { xs: 180, md: 250 },
                          width: { xs: 180, md: 250 }, // Forzar mismo ancho
                          maxWidth: { xs: 180, md: 250 }, // Prevenir expansión
                          flexShrink: 0,
                          borderRadius: 2,
                          '&:hover': {
                            backgroundColor:
                              index === currentStep
                                ? 'primary.dark'
                                : 'primary.light',
                            borderColor: 'primary.main',
                            transform: 'translateY(-2px)',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                          },
                        }}
                      >
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            mb: 1,
                          }}
                        >
                          {service.icon}
                          <Typography
                            variant="h6"
                            fontWeight="bold"
                            sx={{
                              fontSize: {
                                xs: '0.9rem',
                                md: '1.1rem',
                              },
                            }}
                          >
                            {service.title}
                          </Typography>
                        </Box>
                        <Typography
                          variant="body2"
                          sx={{
                            color:
                              index === currentStep
                                ? 'white'
                                : 'text.secondary',
                            textAlign: 'center',
                            fontSize: {
                              xs: '0.75rem',
                              md: '0.85rem',
                            },
                          }}
                        >
                          {service.description}
                        </Typography>
                      </Button>
                    ))}
                  </Box>

                  {/* Timeline horizontal con imágenes */}
                  <Box
                    sx={{
                      width: '100%',
                      // CENTRAR TIMELINE: Centrar timeline en desktop
                      display: 'flex',
                      justifyContent: {
                        xs: 'flex-start',
                        md: 'center',
                      },
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: timelineConfig.justifyContent,
                        alignItems: 'flex-start',
                        mb: 6,
                        position: 'relative',
                        px: { xs: 1, md: 0 }, // ALINEACIÓN: Remover padding horizontal en desktop
                        // ANCHO TIMELINE DINÁMICO: Configuración específica por servicio
                        width: '100%',
                        ...timelineConfig, // Aplicar configuración dinámica
                      }}
                    >
                      {/* Línea conectora */}
                      <Box
                        sx={{
                          position: 'absolute',
                          top: '37.5%',
                          left: {
                            xs: '10%',
                            md: timelineConfig.linePosition,
                          }, // ALINEACIÓN DINÁMICA: Posición específica por servicio
                          right: {
                            xs: '10%',
                            md: timelineConfig.linePosition,
                          }, // ALINEACIÓN DINÁMICA: Posición específica por servicio
                          // LÍNEA TIMELINE: Engrosada proporcionalmente para círculos más grandes
                          height: { xs: 6, md: 12 },
                          background:
                            'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                          borderRadius: 2,
                          zIndex: 1,
                          transform: 'translateY(-50%)',
                        }}
                      />

                      {/* Pasos del timeline */}
                      {currentService.timeline.map((item, index) => (
                        <Box
                          key={index}
                          sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            flex: 1,
                            position: 'relative',
                            zIndex: 2,
                            // ESPACIADO DINÁMICO: Aplicar gap específico por servicio
                            '&:not(:last-child)': {
                              marginRight: timelineConfig.gap,
                            },
                          }}
                        >
                          {/* Imagen del paso */}
                          <Box
                            sx={{
                              // CÍRCULOS TIMELINE CONFIGURABLES:
                              // Mobile: Variables configurables para pruebas
                              // Desktop: Tamaño fijo optimizado
                              width: {
                                xs: 60, // MOBILE CONFIGURABLE: Cambiar este valor para ajustar tamaño
                                md: 170,
                              },
                              height: {
                                xs: 60, // MOBILE CONFIGURABLE: Cambiar este valor para ajustar tamaño
                                md: 170,
                              },
                              borderRadius: '50%',
                              // BORDE CÍRCULOS CONFIGURABLE:
                              border: {
                                xs: 3, // MOBILE CONFIGURABLE: Cambiar este valor para ajustar borde
                                md: 7,
                              },
                              borderColor: 'primary.main',
                              overflow: 'hidden',
                              // MARGIN BOTTOM CONFIGURABLE:
                              mb: {
                                xs: 0, // MOBILE CONFIGURABLE: Cambiar este valor para ajustar espacio inferior
                                md: 2,
                              },
                              mt: {
                                xs: 2.8, // MOBILE CONFIGURABLE: Cambiar este valor para ajustar espacio inferior
                              },
                              boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
                              backgroundColor: 'white',
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
                              // ANCHO TEXTO TIMELINE CONFIGURABLE:
                              maxWidth: {
                                xs: 100, // MOBILE CONFIGURABLE: Cambiar este valor para ajustar ancho del texto
                                md: 240,
                              },
                            }}
                          >
                            <Typography
                              variant="h6"
                              fontWeight="bold"
                              sx={{
                                mb: {
                                  xs: 0.5, // MOBILE CONFIGURABLE: Cambiar para ajustar espacio entre título y descripción
                                  md: 1,
                                },
                                // TAMAÑO TÍTULO TIMELINE CONFIGURABLE:
                                fontSize: {
                                  xs: '0.7rem', // MOBILE CONFIGURABLE: Cambiar este valor para ajustar tamaño de título
                                  md: '1.1rem',
                                },
                                color: 'primary.main',
                              }}
                            >
                              {item.title}
                            </Typography>
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{
                                lineHeight: {
                                  xs: 1.1, // MOBILE CONFIGURABLE: Cambiar para ajustar espaciado entre líneas
                                  md: 1.4,
                                },
                                // TAMAÑO DESCRIPCIÓN TIMELINE CONFIGURABLE:
                                fontSize: {
                                  xs: '0.6rem', // MOBILE CONFIGURABLE: Cambiar este valor para ajustar tamaño de descripción
                                  md: '0.95rem',
                                },
                              }}
                            >
                              {item.description}
                            </Typography>
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                </Box>
              </Box>
            )
          }}
        />
      </Box>
    </Box>
  )
}

export default ServicesSection
