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
        // SOLUCIÓN LAYOUT DESKTOP: Padding con todos los breakpoints
        px: { xs: 2, sm: 4, md: 2, lg: 7, xl: 7 }, // ← xl copiado de lg
        py: { xs: 6, sm: 7, md: 8, lg: 9, xl: 9 }, // ← xl copiado de lg
        backgroundColor: '#e6e6e6',
      }}
    >
      {/* Título y texto descriptivo */}
      <Box
        sx={{
          px: { xs: 0, sm: 2, md: 4, lg: 8, xl: 8 }, // ← xl copiado de lg
        }}
      >
        <Typography
          variant="h3"
          fontWeight="bold"
          gutterBottom
          sx={{
            fontSize: {
              xs: '2rem',
              sm: '2.2rem',
              md: '2.5rem',
              lg: '2.7rem',
              xl: '2.7rem', // ← xl copiado de lg
            },
            textAlign: 'left',
            mb: { xs: 2, sm: 2.5, md: 3, lg: 3.5, xl: 3.5 }, // ← xl copiado de lg
            color: 'common.black',
          }}
        >
          Nuestros Servicios
        </Typography>
        <Typography
          variant="h6"
          sx={{
            mb: { xs: 4, sm: 5, md: 6, lg: 7, xl: 7 }, // ← xl copiado de lg
            textAlign: 'left',
            fontSize: {
              xs: '1rem',
              sm: '1.1rem',
              md: '1.2rem',
              lg: '1.3rem',
              xl: '1.3rem', // ← xl copiado de lg
            },
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
          // PADDING WIZARD: Todos los breakpoints
          px: { xs: 0, sm: 3, md: 6, lg: 1, xl: 1 }, // ← xl copiado de lg
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
            // CONFIGURACIÓN DINÁMICA DE GAPS: Actualizada con todos los breakpoints
            const getTimelineConfig = (serviceTitle) => {
              switch (serviceTitle) {
                case 'Proveedor':
                  return {
                    maxWidth: {
                      xs: '100%',
                      sm: '100%',
                      md: '2800px',
                      lg: '2000px',
                      xl: '2000px', // ← xl copiado de lg
                    },
                    justifyContent: {
                      xs: 'flex-start',
                      sm: 'flex-start',
                      md: 'center',
                      lg: 'center',
                      xl: 'center', // ← xl copiado de lg
                    },
                    gap: { xs: 2, sm: 3, md: 26, lg: 10, xl: 10 }, // ← xl copiado de lg
                    linePosition: '85px',
                  }
                case 'Vendedor':
                  return {
                    maxWidth: {
                      xs: '100%',
                      sm: '100%',
                      md: '2400px',
                      lg: '1200px',
                      xl: '1200px', // ← xl copiado de lg
                    },
                    justifyContent: {
                      xs: 'flex-start',
                      sm: 'flex-start',
                      md: 'center',
                      lg: 'center',
                      xl: 'center', // ← xl copiado de lg
                    },
                    gap: { xs: 3, sm: 4, md: 38, lg: 8, xl: 8 }, // ← xl copiado de lg
                    linePosition: '150px',
                  }
                case 'Punto de Venta':
                  return {
                    maxWidth: {
                      xs: '100%',
                      sm: '100%',
                      md: '2100px',
                      lg: '1600px',
                      xl: '1600px', // ← xl copiado de lg
                    },
                    justifyContent: {
                      xs: 'flex-start',
                      sm: 'flex-start',
                      md: 'center',
                      lg: 'center',
                      xl: 'center', // ← xl copiado de lg
                    },
                    gap: { xs: 2, sm: 3, md: 26, lg: 6, xl: 6 }, // ← xl copiado de lg
                    linePosition: '95px',
                  }
                default:
                  return {
                    maxWidth: {
                      xs: '100%',
                      sm: '100%',
                      md: '3000px',
                      lg: '3000px',
                      xl: '3000px', // ← xl copiado de lg
                    },
                    justifyContent: {
                      xs: 'flex-start',
                      sm: 'flex-start',
                      md: 'center',
                      lg: 'center',
                      xl: 'center', // ← xl copiado de lg
                    },
                    gap: { xs: 2, sm: 3, md: 6, lg: 6, xl: 6 }, // ← xl copiado de lg
                    linePosition: '85px',
                  }
              }
            }

            const timelineConfig = getTimelineConfig(currentService.title)

            return (
              <Box
                sx={{
                  display: 'flex',
                  gap: { xs: 3, sm: 3, md: 0, lg: 0, xl: 0 }, // ← xl copiado de lg
                  alignItems: 'flex-start',
                  flexDirection: {
                    xs: 'column',
                    sm: 'column',
                    md: 'column',
                    lg: 'column',
                    xl: 'column', // ← xl copiado de lg
                  },
                  mx: { xs: 0, sm: 0, md: 0, lg: 0, xl: 0 }, // ← xl copiado de lg
                  justifyContent: 'center',
                }}
              >
                {/* Imagen del servicio actual - Solo en mobile */}
                <Box
                  sx={{
                    display: {
                      xs: 'flex',
                      sm: 'flex',
                      md: 'none',
                      lg: 'none',
                      xl: 'none', // ← xl copiado de lg
                    },
                    width: '100%',
                    justifyContent: 'center',
                    mb: { xs: 3, sm: 3 },
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
                      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                    }}
                  />
                </Box>

                {/* Contenido del servicio */}
                <Box
                  sx={{
                    flex: { xs: 'none', sm: 'none', md: 1, lg: 1, xl: 1 }, // ← xl copiado de lg
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: {
                      xs: 'stretch',
                      sm: 'stretch',
                      md: 'center',
                      lg: 'center',
                      xl: 'center', // ← xl copiado de lg
                    },
                    justifyContent: 'center',
                    pl: { xs: 0, sm: 0, md: 0, lg: 0, xl: 0 }, // ← xl copiado de lg
                  }}
                >
                  {/* Botones de servicios */}
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: {
                        xs: 'row',
                        sm: 'row',
                        md: 'row',
                        lg: 'row',
                        xl: 'row', // ← xl copiado de lg
                      },
                      gap: { xs: 2, sm: 2, md: 2, lg: 15, xl: 15 }, // ← xl copiado de lg
                      mb: { xs: 4, sm: 4, md: 4, lg: 12, xl: 12 }, // ← xl copiado de lg
                      overflowX: {
                        xs: 'auto',
                        sm: 'auto',
                        md: 'visible',
                        lg: 'visible',
                        xl: 'visible', // ← xl copiado de lg
                      },
                      pb: { xs: 2, sm: 2, md: 0, lg: 0, xl: 0 }, // ← xl copiado de lg
                      justifyContent: {
                        xs: 'flex-start',
                        sm: 'flex-start',
                        md: 'center',
                        lg: 'center',
                        xl: 'center', // ← xl copiado de lg
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
                          p: { xs: 1.35, sm: 1.5, md: 2, lg: 2.2, xl: 2.2 }, // ← xl copiado de lg
                          justifyContent: 'center',
                          textAlign: 'center',
                          height: 'auto',
                          flexDirection: 'column',
                          alignItems: 'center',
                          transition: 'all 0.3s ease',
                          backgroundColor:
                            index === currentStep ? '#1976d2' : 'transparent',
                          borderColor: '#000000',
                          minWidth: {
                            xs: 180,
                            sm: 200,
                            md: 250,
                            lg: 270,
                            xl: 270, // ← xl copiado de lg
                          },
                          width: {
                            xs: 180,
                            sm: 200,
                            md: 250,
                            lg: 270,
                            xl: 270, // ← xl copiado de lg
                          },
                          maxWidth: {
                            xs: 180,
                            sm: 200,
                            md: 250,
                            lg: 270,
                            xl: 270, // ← xl copiado de lg
                          },
                          flexShrink: 0,
                          borderRadius: 2,
                          '&:hover': {
                            backgroundColor:
                              index === currentStep ? '#b0ceea' : '#b0ceea',
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
                                sm: '1rem',
                                md: '1.1rem',
                                lg: '1.2rem',
                                xl: '1.2rem', // ← xl copiado de lg
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
                              sm: '0.8rem',
                              md: '0.85rem',
                              lg: '1rem',
                              xl: '1rem', // ← xl copiado de lg
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
                      display: 'flex',
                      justifyContent: {
                        xs: 'flex-start',
                        sm: 'flex-start',
                        md: 'center',
                        lg: 'center',
                        xl: 'center', // ← xl copiado de lg
                      },
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: timelineConfig.justifyContent,
                        alignItems: 'flex-start',
                        mb: { xs: 6, sm: 6, md: 6, lg: 6, xl: 6 }, // ← xl copiado de lg
                        position: 'relative',
                        px: { xs: 1, sm: 1, md: 0, lg: 0, xl: 0 }, // ← xl copiado de lg
                        width: '100%',
                        ...timelineConfig,
                      }}
                    >
                      {/* Línea conectora */}
                      <Box
                        sx={{
                          position: 'absolute',
                          top: (() => {
                            // Top específico según el servicio
                            switch (currentService.title) {
                              case 'Punto de Venta':
                                return '27.5%' // ← Top específico para Punto de Venta
                              case 'Proveedor':
                                return '33.5%' // ← Top para Proveedor
                              case 'Vendedor':
                                return '33.5%' // ← Top para Vendedor
                              default:
                                return '33.5%' // ← Top por defecto
                            }
                          })(),
                          left: {
                            xs: '10%',
                            sm: '10%',
                            md: timelineConfig.linePosition,
                            lg: timelineConfig.linePosition,
                            xl: timelineConfig.linePosition, // ← xl copiado de lg
                          },
                          right: {
                            xs: '10%',
                            sm: '10%',
                            md: timelineConfig.linePosition,
                            lg: timelineConfig.linePosition,
                            xl: timelineConfig.linePosition, // ← xl copiado de lg
                          },
                          height: { xs: 6, sm: 8, md: 12, lg: 12, xl: 14 }, // ← xl copiado de lg
                          background:
                            'linear-gradient(90deg,rgb(25, 210, 210) 0%, #1976d2 100%)',
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
                            '&:not(:last-child)': {
                              marginRight: timelineConfig.gap,
                            },
                          }}
                        >
                          {/* Imagen del paso */}
                          <Box
                            sx={{
                              width: {
                                xs: 60,
                                sm: 80,
                                md: 170,
                                lg: 190,
                                xl: 190, // ← xl copiado de lg
                              },
                              height: {
                                xs: 60,
                                sm: 80,
                                md: 170,
                                lg: 190,
                                xl: 190, // ← xl copiado de lg
                              },
                              borderRadius: '50%',
                              border: { xs: 3, sm: 4, md: 7, lg: 6, xl: 6 }, // ← xl copiado de lg
                              borderColor: '#1976d2',
                              overflow: 'hidden',
                              mb: { xs: 0, sm: 1, md: 2, lg: 2.5, xl: 2.5 }, // ← xl copiado de lg
                              mt: { xs: 2.8, sm: 3, md: 0, lg: 0, xl: 0 }, // ← xl copiado de lg
                              boxShadow: '0 0px 8px rgba(11, 47, 252, 0.9)',
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
                              maxWidth: {
                                xs: 100,
                                sm: 140,
                                md: 240,
                                lg: 260,
                                xl: 260, // ← xl copiado de lg
                              },
                            }}
                          >
                            <Typography
                              variant="h6"
                              fontWeight="bold"
                              sx={{
                                mb: {
                                  xs: 0.5,
                                  sm: 0.7,
                                  md: 1.2,
                                  lg: 1.2,
                                  xl: 1.2, // ← xl copiado de lg
                                },
                                fontSize: {
                                  xs: '0.7rem',
                                  sm: '0.85rem',
                                  md: '1.1rem',
                                  lg: '1.6rem',
                                  xl: '1.6rem', // ← xl copiado de lg
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
                                lineHeight: (() => {
                                  //Correspon de a la altura del texto
                                  switch (currentService.title) {
                                    case 'Proveedor':
                                      return {
                                        xs: 1.0,
                                        sm: 1.1,
                                        md: 0,
                                        lg: 1.5,
                                        xl: 0, // ← xl copiado de lg
                                      }
                                    case 'Vendedor':
                                      return {
                                        xs: 1.1,
                                        sm: 1.2,
                                        md: 0,
                                        lg: 1.5,
                                        xl: 0, // ← xl copiado de lg
                                      }
                                    case 'Punto de Venta':
                                      return {
                                        xs: 1.2,
                                        sm: 1.3,
                                        md: 0,
                                        lg: 1.5,
                                        xl: 0, // ← xl copiado de lg
                                      }
                                    default:
                                      return {
                                        xs: 1.1,
                                        sm: 1.2,
                                        md: 1.4,
                                        lg: 1.5,
                                        xl: 0, // ← xl copiado de lg
                                      }
                                  }
                                })(),
                                fontSize: {
                                  xs: '0.6rem',
                                  sm: '0.75rem',
                                  md: '0.95rem',
                                  lg: '1rem',
                                  xl: '1.2rem', // ← xl copiado de lg
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
