import React, { useRef, useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Button,
  Container,
  Grid,
  Card,
  CardContent,
  IconButton,
} from '@mui/material'
import { useNavigate } from 'react-router-dom'
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
  ArrowForward,
  ArrowBack,
  Handshake,
  Business,
  BarChart,
} from '@mui/icons-material'
import Wizard from '../components/shared/Wizard'
import Banner from '../components/shared/Banner'

const Home = ({ scrollTargets }) => {
  const navigate = useNavigate()

  const quienesSomosRef = useRef(null)
  const serviciosRef = useRef(null)
  const estadisticasRef = useRef(null)
  const contactanosRef = useRef(null)

  if (scrollTargets) {
    scrollTargets.current = {
      quienesSomosRef,
      serviciosRef,
      estadisticasRef,
      contactanosRef,
    }
  } // Estado para animaciones count-up
  const [animatedNumbers, setAnimatedNumbers] = useState({
    transacciones: 0,
    empresas: 0,
    ventas: 0,
  })

  // Estado para el carrusel de promoción (hero section)
  const [currentPromoSlide, setCurrentPromoSlide] = useState(0)

  // Datos del carrusel de promoción (3 slides iguales por ahora)
  const promoSlides = [
    { src: '/promotion.svg', alt: 'Promoción 1' },
    { src: '/promotion.svg', alt: 'Promoción 2' },
    { src: '/promotion.svg', alt: 'Promoción 3' },
  ]

  // Estado para el carrusel
  const [currentSlide, setCurrentSlide] = useState(0)

  // Datos del carrusel de imágenes
  const carouselImages = [
    {
      src: '/Landing Page/QuienesSomos.jpg',
      title: 'Conectamos Proveedores y Vendedores',
      description: 'La plataforma que revoluciona el comercio digital',
    },
    {
      src: '/Landing Page/Proveedor.webp',
      title: 'Para Proveedores',
      description: 'Vende tus productos de forma directa y eficiente',
    },
    {
      src: '/Landing Page/Vendedor.webp',
      title: 'Para Vendedores',
      description: 'Encuentra productos únicos para revender',
    },
    {
      src: '/Landing Page/Punto de Venta.webp',
      title: 'Puntos de Venta',
      description: 'Optimiza tu espacio comercial y genera ingresos',
    },
  ]

  // Función para generar números aleatorios
  const generateRandomNumbers = () => ({
    transacciones: Math.floor(Math.random() * 3001) + 2000, // 2000-5000
    empresas: Math.floor(Math.random() * 221) + 200, // 200-420
    ventas: Math.floor(Math.random() * 3001) + 2000, // 2000-5000
  })

  // Estado para los números finales (se regeneran en cada carga)
  const [finalNumbers] = useState(generateRandomNumbers())

  // Función de animación count-up
  const animateCountUp = (targetValue, key) => {
    const duration = 1500 // 1.5 segundos
    const steps = 60 // Número de pasos para la animación
    const increment = targetValue / steps
    let current = 0
    let step = 0

    const timer = setInterval(() => {
      step++
      current = Math.min(Math.floor(increment * step), targetValue)

      setAnimatedNumbers((prev) => ({
        ...prev,
        [key]: current,
      }))

      if (step >= steps) {
        clearInterval(timer)
      }
    }, duration / steps)
  }
  // Efecto para iniciar las animaciones cuando el componente se monta
  useEffect(() => {
    const timer = setTimeout(() => {
      animateCountUp(finalNumbers.transacciones, 'transacciones')
      animateCountUp(finalNumbers.empresas, 'empresas')
      animateCountUp(finalNumbers.ventas, 'ventas')
    }, 500) // Pequeño delay antes de iniciar

    return () => clearTimeout(timer)
  }, [finalNumbers])
  // Auto-avance del carrusel de promoción
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPromoSlide((prev) => (prev + 1) % promoSlides.length)
    }, 10000) // Cambia cada 10 segundos

    return () => clearInterval(interval)
  }, [promoSlides.length])

  // Funciones de navegación del carrusel de promoción
  const nextPromoSlide = () => {
    setCurrentPromoSlide((prev) => (prev + 1) % promoSlides.length)
  }

  const prevPromoSlide = () => {
    setCurrentPromoSlide(
      (prev) => (prev - 1 + promoSlides.length) % promoSlides.length
    )
  }

  // Auto-avance del carrusel
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % carouselImages.length)
    }, 10000) // Cambia cada 10 segundos

    return () => clearInterval(interval)
  }, [carouselImages.length])

  // Funciones de navegación del carrusel
  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % carouselImages.length)
  }

  const prevSlide = () => {
    setCurrentSlide(
      (prev) => (prev - 1 + carouselImages.length) % carouselImages.length
    )
  }

  // Función para formatear números con punto como separador de miles
  const formatNumber = (num) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  }

  // Datos de estadísticas actualizados
  const statistics = [
    {
      number: formatNumber(animatedNumbers.transacciones),
      label: 'Transacciones',
      description: 'Completadas exitosamente',
      icon: <Handshake sx={{ fontSize: { xs: 40, md: 50 }, mb: 1 }} />,
    },
    {
      number: formatNumber(animatedNumbers.empresas),
      label: 'Empresas',
      description: 'Confiando en nuestra plataforma',
      icon: <Business sx={{ fontSize: { xs: 40, md: 50 }, mb: 1 }} />,
    },
    {
      number: formatNumber(animatedNumbers.ventas),
      label: 'Ventas',
      description: 'En crecimiento exponencial',
      icon: <BarChart sx={{ fontSize: { xs: 40, md: 50 }, mb: 1 }} />,
    },
  ]

  // Datos de los servicios para elqWizard
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
    <Box sx={{ width: '100%', overflowX: 'hidden' }}>
      {/* Sección Hero con texto, botón, estadísticas y carrusel */}{' '}
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
          {/* Carrusel de fondo solo para mobile */}{' '}
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
            {' '}
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
          </Box>{' '}
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
                Conectamos proveedores con vendedores de manera sencilla.
                Olvídate de ir a hablar con cada uno de ellos. Desarrollamos el
                ecosistema que necesitas para transar lo que necesites y cuando
                lo necesites.
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
                  <Box
                    key={index}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2.5,
                      p: 3,
                      background: 'rgba(255, 255, 255, 0.9)',
                      backdropFilter: 'blur(10px)',
                      borderRadius: 2,
                      minWidth: 200,
                      maxWidth: 200,
                      boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 6px 20px rgba(0,0,0,0.15)',
                      },
                    }}
                  >
                    <Box
                      sx={{
                        color: 'primary.main',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {React.cloneElement(stat.icon, {
                        sx: {
                          fontSize: 32,
                        },
                      })}
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      {' '}
                      {/* Espacio para el texto */}
                      <Typography
                        variant="body2"
                        sx={{
                          fontSize: '1rem',
                          color: 'text.secondary',
                          lineHeight: 1, // Ajustado para mejor visualización
                          mb: 1, // Espacio debajo del label
                        }}
                      >
                        {stat.label}
                      </Typography>
                      <Typography
                        variant="h6"
                        fontWeight="bold"
                        sx={{
                          fontSize: '1.8rem',
                          color: 'primary.main',
                          fontFamily: 'monospace',
                          lineHeight: 1, // Ajustado para mejor visualización
                        }}
                      >
                        {stat.number}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>{' '}
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
          </Box>{' '}
          {/* Fin Sección derecha */}{' '}
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
            </Button>{' '}
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
                <Box
                  key={index}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    p: 2.5,
                    background: 'rgba(255, 255, 255, 0.9)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: 2,
                    minWidth: { xs: 170, sm: 170 },
                    maxWidth: { xs: 170, sm: 170 },
                    boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 6px 20px rgba(0,0,0,0.15)',
                    },
                  }}
                >
                  <Box
                    sx={{
                      color: 'primary.main',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {React.cloneElement(stat.icon, {
                      sx: {
                        fontSize: { xs: 24, sm: 28 },
                      },
                    })}
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    {' '}
                    {/* Espacio para el texto */}
                    <Typography
                      variant="body2"
                      sx={{
                        fontSize: { xs: '0.85rem', sm: '0.9rem' },
                        color: 'text.secondary',
                        lineHeight: 1,
                        mb: 0.8,
                      }}
                    >
                      {stat.label}
                    </Typography>
                    <Typography
                      variant="h6"
                      fontWeight="bold"
                      sx={{
                        fontSize: { xs: '1.5rem', sm: '1.6rem' },
                        color: 'primary.main',
                        fontFamily: 'monospace',
                        lineHeight: 1,
                      }}
                    >
                      {stat.number}
                    </Typography>
                  </Box>
                </Box>
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
                <Box
                  key={index}
                  onClick={() => setCurrentPromoSlide(index)}
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    backgroundColor:
                      index === currentPromoSlide
                        ? 'primary.main'
                        : 'rgba(0,0,0,0.3)',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    border: `2px solid ${
                      index === currentPromoSlide
                        ? 'primary.main'
                        : 'rgba(0,0,0,0.2)'
                    }`,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                    '&:hover': {
                      backgroundColor: 'primary.main',
                      transform: 'scale(1.2)',
                      border: '2px solid primary.main',
                    },
                  }}
                />
              ))}
            </Box>
          </Box>{' '}
          {/* Fin Botón y Estadísticas para Mobile */}{' '}
        </Box>{' '}
        {/* Fin Contenido Interno Wrapper */}
        {/* === FLECHAS DE NAVEGACIÓN PARA MOBILE === */}
        {/* Flecha Izquierda - Mobile */}
        <IconButton
          onClick={prevPromoSlide}
          sx={{
            display: { xs: 'inline-flex', lg: 'none' }, // Solo visible en mobile
            position: 'absolute',
            top: '45%', // A la altura del promotion.svg
            left: '5%',
            transform: 'translateY(-50%)',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            color: 'white',
            zIndex: 5,
            width: 40,
            height: 40,
            '&:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
            },
          }}
        >
          <ArrowBack />
        </IconButton>
        {/* Flecha Derecha - Mobile */}
        <IconButton
          onClick={nextPromoSlide}
          sx={{
            display: { xs: 'inline-flex', lg: 'none' }, // Solo visible en mobile
            position: 'absolute',
            top: '45%', // A la altura del promotion.svg
            right: '5%',
            transform: 'translateY(-50%)',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            color: 'white',
            zIndex: 5,
            width: 40,
            height: 40,
            '&:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
            },
          }}
        >
          <ArrowForward />
        </IconButton>
        {/* === CONTROLES DEL CARRUSEL PARA DESKTOP (HIJOS DEL HERO BOX PRINCIPAL EXTERNO) === */}
        {/* Flecha Izquierda - Desktop */}
        <IconButton
          onClick={prevPromoSlide}
          sx={{
            display: { xs: 'none', lg: 'inline-flex' }, // Solo visible en desktop
            position: 'absolute',
            top: '50%',
            left: { xs: '1%', sm: '2%', md: '3%', lg: '2%' }, // Más al extremo
            transform: 'translateY(-50%)',
            backgroundColor: 'rgba(0, 0, 0, 0.3)', // Más sutil
            color: 'white',
            zIndex: 5, // Asegura que esté sobre otros elementos del hero
            '&:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
            },
            // Ajustes para que no se salga del viewport si el hero es muy ancho
            // Estos valores dependen del padding del contenedor padre (Hero Box)
            // Si el Hero Box tiene padding horizontal, las flechas deben considerar eso.
            // Ejemplo: si el Hero Box tiene px: 2 (16px), left podría ser 16 + un pequeño offset.
            // Por ahora, se usan porcentajes relativos al Hero Box.
          }}
        >
          <ArrowBack fontSize="large" />
        </IconButton>
        {/* Flecha Derecha - Desktop */}
        <IconButton
          onClick={nextPromoSlide}
          sx={{
            display: { xs: 'none', lg: 'inline-flex' }, // Solo visible en desktop
            position: 'absolute',
            top: '50%',
            right: { xs: '1%', sm: '2%', md: '3%', lg: '2%' }, // Más al extremo
            transform: 'translateY(-50%)',
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            color: 'white',
            zIndex: 5,
            '&:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
            },
          }}
        >
          <ArrowForward fontSize="large" />
        </IconButton>
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
            <Box
              key={index}
              onClick={() => setCurrentPromoSlide(index)}
              sx={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                backgroundColor:
                  index === currentPromoSlide
                    ? 'primary.main'
                    : 'rgba(255,255,255,0.7)',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                border: '2px solid white', // Borde blanco para destacar sobre cualquier fondo
                boxShadow: '0 1px 4px rgba(0,0,0,0.2)', // Sombra más sutil
                '&:hover': {
                  backgroundColor: 'primary.light', // Un poco más claro al hacer hover
                  transform: 'scale(1.1)',
                },
              }}
            />
          ))}
        </Box>{' '}
      </Box>{' '}
      {/* Fin Sección Hero */}
      {/* Sección Conoce a nuestros proveedores */}
      <Box
        sx={{
          px: { xs: 2, sm: 4, md: 8, lg: 15, xl: 30 },
          py: { xs: 4, md: 6 },
          backgroundColor: '#f8f9fa',
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: { xs: 3, md: 4 },
        }}
      >
        {/* Título a la izquierda */}
        <Typography
          variant="h4"
          sx={{
            fontWeight: 'bold',
            color: 'text.primary',
            fontSize: { xs: '1.8rem', sm: '2.2rem', md: '2.5rem' },
            textAlign: { xs: 'center', md: 'left' },
            flex: { md: '0 0 auto' },
            minWidth: { md: '300px' },
          }}
        >
          Conoce a nuestros proveedores
        </Typography>{' '}
        {/* Logos de proveedores a la derecha */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: 'center',
            // POSICIÓN DESKTOP: Cambiar justifyContent para mover imágenes más a la izquierda
            justifyContent: { xs: 'center', md: 'flex-start' }, // En desktop: flex-start (más a la izquierda)
            // GAP ENTRE IMÁGENES: Aumentado para desktop
            gap: { xs: 2, sm: 3, md: 5 }, // Aumentado de md: 4 a md: 5
            flex: 1,
            flexWrap: 'wrap',
          }}
        >
          {' '}
          {[
            {
              src: '/Landing Page/Nuestros Proveedores/IKEA.webp',
              alt: 'IKEA',
            },
            {
              src: '/Landing Page/Nuestros Proveedores/johnsons.webp',
              alt: "Johnson's",
            },
            {
              src: '/Landing Page/Nuestros Proveedores/laroche.webp',
              alt: 'La Roche',
            },
            {
              src: '/Landing Page/Nuestros Proveedores/pcfactory.webp',
              alt: 'PC Factory',
            },
            {
              src: '/Landing Page/Nuestros Proveedores/walmart.webp',
              alt: 'Walmart',
            },
          ].map((proveedor, index) => (
            <Box
              key={index}
              sx={{
                // TAMAÑO LOGOS PROVEEDORES: Aumentado 100% - duplicado el tamaño original
                width: { xs: 240, sm: 200, md: 240 }, // Antes: xs: 120, sm: 100, md: 120
                height: { xs: 160, sm: 120, md: 160 }, // Antes: xs: 80, sm: 60, md: 80
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'white',
                borderRadius: 2,
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                padding: 1,
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                },
              }}
            >
              <img
                src={proveedor.src}
                alt={proveedor.alt}
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'contain',
                }}
              />
            </Box>
          ))}
        </Box>
      </Box>
      {/* Fin Sección Conoce a nuestros proveedores */}
      {/* Banner Component */}
      <Banner />
      {/* Secciones restantes */}
      {[
        {
          ref: quienesSomosRef,
          bg: '#ffffff',
          title: '¿Quiénes somos?',
          text: 'En Sellsi, creemos en la eficiencia del comercio digital. Somos una plataforma innovadora que conecta proveedores con vendedores, facilitando transacciones comerciales de manera simple y efectiva. Nuestra misión es democratizar el acceso al comercio electrónico y crear oportunidades para emprendedores de todos los tamaños.',
        },
        {
          ref: serviciosRef,
          bg: '#e6e6e6',
          title: 'Nuestros Servicios',
          text: 'Ofrecemos una plataforma intuitiva para descubrir productos, conectar con proveedores confiables y gestionar tus ventas de manera eficiente. Conoce nuestros tres pilares fundamentales:',
          hasWizard: true,
        },
      ].map(({ ref, bg, title, text, hasWizard }, i) => (
        <Box
          key={i}
          ref={ref}
          sx={{
            // SOLUCIÓN LAYOUT DESKTOP: Padding izquierdo reducido para servicios
            px:
              title === 'Nuestros Servicios'
                ? { xs: 2, sm: 4, md: 2, lg: 4, xl: 8 } // Padding izquierdo reducido en desktop
                : { xs: 2, sm: 4, md: 8, lg: 15, xl: 30 }, // Padding original para otras secciones
            py: { xs: 6, md: 8 },
            backgroundColor: bg,
          }}
        >
          {' '}
          {/* Render title here ONLY if it's NOT the '¿Quiénes somos?' section */}
          {title !== '¿Quiénes somos?' && (
            <Box
              sx={{
                px:
                  title === 'Nuestros Servicios'
                    ? { xs: 0, md: 4, lg: 8, xl: 15 } // Padding reducido para títulos de servicios
                    : 0,
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
                {title}
              </Typography>
              {/* Agregar texto descriptivo específicamente para Nuestros Servicios */}
              {title === 'Nuestros Servicios' && (
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
                  {text}
                </Typography>
              )}
            </Box>
          )}{' '}
          {title === '¿Quiénes somos?' ? (
            <Box>
              {/* Mobile Layout: Logo first, then content flows vertically */}
              <Box sx={{ display: { xs: 'block', md: 'none' } }}>
                {/* Logo for mobile - appears first */}
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    mb: 3,
                  }}
                >
                  <Box
                    component="img"
                    src="/logo.svg"
                    alt="Sellsi Logo"
                    sx={{
                      height: { xs: 50, sm: 60 },
                    }}
                  />
                </Box>

                {/* All text content for mobile */}
                <Box sx={{ mb: 4 }}>
                  <Typography
                    variant="h3"
                    fontWeight="bold"
                    gutterBottom
                    sx={{
                      fontSize: { xs: '2rem' },
                      textAlign: 'left',
                      color: 'common.black',
                      mb: { xs: 2 },
                    }}
                  >
                    {title}
                  </Typography>

                  <Typography
                    variant="body1"
                    sx={{
                      fontSize: { xs: '1.2rem' },
                      lineHeight: 1.7,
                      color: 'text.secondary',
                      mb: 3,
                    }}
                  >
                    En Sellsi, creemos en un comercio más justo, ágil y
                    accesible para todos. Somos la plataforma tecnológica que
                    conecta a proveedores con vendedores de forma simple, rápida
                    y transparente.
                    <br />
                    <br />
                    Creamos un ecosistema donde los productos pueden llegar a
                    nuevos clientes sin intermediarios innecesarios ni
                    fricciones. Aquí, los proveedores definen el precio de venta
                    y la comisión disponible, mientras los vendedores eligen qué
                    ofrecer y ganan por cada venta concretada.
                  </Typography>

                  <Typography
                    variant="h4"
                    fontWeight="bold"
                    sx={{
                      mb: 1.5,
                      fontSize: { xs: '2rem' },
                      color: 'common.black',
                    }}
                  >
                    Nuestra Misión
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{
                      fontSize: { xs: '1.2rem' },
                      lineHeight: 1.7,
                      color: 'text.secondary',
                      mb: 3,
                    }}
                  >
                    Impulsar la economía digital conectando proveedores y
                    vendedores a través de una plataforma tecnológica simple,
                    inclusiva y transparente.
                  </Typography>

                  <Typography
                    variant="h4"
                    fontWeight="bold"
                    sx={{
                      mb: 1.5,
                      fontSize: { xs: '2rem' },
                      color: 'common.black',
                    }}
                  >
                    Nuestra Visión
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{
                      fontSize: { xs: '1.2rem' },
                      lineHeight: 1.7,
                      color: 'text.secondary',
                      mb: 3,
                    }}
                  >
                    Ser el marketplace más ágil y confiable de LATAM para
                    escalar ventas sin límites ni barreras.
                  </Typography>
                </Box>

                {/* QuienesSomos.jpg image for mobile - appears after all text */}
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    mt: 2,
                  }}
                >
                  <Box
                    component="img"
                    src="/Landing Page/QuienesSomos.jpg"
                    alt="Equipo Sellsi trabajando"
                    sx={{
                      width: '100%',
                      maxWidth: { xs: '90%', sm: '80%' },
                      height: 'auto',
                      objectFit: 'cover',
                      borderRadius: '16px',
                      boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                    }}
                  />
                </Box>
              </Box>

              {/* Desktop Layout: Two columns side by side */}
              <Box
                sx={{
                  display: { xs: 'none', md: 'flex' },
                  flexDirection: 'row',
                  gap: 6,
                  alignItems: 'flex-start',
                  mt: 0,
                }}
              >
                {/* Left Column: All Text Content for Desktop */}
                <Box
                  sx={{
                    flex: 1,
                    width: '50%',
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      textAlign: 'left',
                    }}
                  >
                    <Typography
                      variant="h3"
                      fontWeight="bold"
                      gutterBottom
                      sx={{
                        fontSize: { md: '2.5rem' },
                        textAlign: 'left',
                        color: 'common.black',
                        mb: { md: 3 },
                      }}
                    >
                      {title}
                    </Typography>

                    <Typography
                      variant="body1"
                      sx={{
                        fontSize: { md: '1.2rem' },
                        lineHeight: 1.7,
                        color: 'text.secondary',
                        mb: 3,
                      }}
                    >
                      En Sellsi, creemos en un comercio más justo, ágil y
                      accesible para todos. Somos la plataforma tecnológica que
                      conecta a proveedores con vendedores de forma simple,
                      rápida y transparente.
                      <br />
                      <br />
                      Creamos un ecosistema donde los productos pueden llegar a
                      nuevos clientes sin intermediarios innecesarios ni
                      fricciones. Aquí, los proveedores definen el precio de
                      venta y la comisión disponible, mientras los vendedores
                      eligen qué ofrecer y ganan por cada venta concretada.
                    </Typography>

                    <Typography
                      variant="h4"
                      fontWeight="bold"
                      sx={{
                        mb: 1.5,
                        fontSize: { md: '2.5rem' },
                        color: 'common.black',
                      }}
                    >
                      Nuestra Misión
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{
                        fontSize: { md: '1.2rem' },
                        lineHeight: 1.7,
                        color: 'text.secondary',
                        mb: 3,
                      }}
                    >
                      Impulsar la economía digital conectando proveedores y
                      vendedores a través de una plataforma tecnológica simple,
                      inclusiva y transparente.
                    </Typography>

                    <Typography
                      variant="h4"
                      fontWeight="bold"
                      sx={{
                        mb: 1.5,
                        fontSize: { md: '2.5rem' },
                        color: 'common.black',
                      }}
                    >
                      Nuestra Visión
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{
                        fontSize: { md: '1.2rem' },
                        lineHeight: 1.7,
                        color: 'text.secondary',
                      }}
                    >
                      Ser el marketplace más ágil y confiable de LATAM para
                      escalar ventas sin límites ni barreras.
                    </Typography>
                  </Box>
                </Box>

                {/* Right Column: Logo and Image for Desktop */}
                <Box
                  sx={{
                    flex: 1,
                    width: '50%',
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 3,
                      width: '100%',
                      height: '100%',
                    }}
                  >
                    <Box
                      component="img"
                      src="/logo.svg"
                      alt="Sellsi Logo"
                      sx={{
                        height: { md: 70 },
                      }}
                    />
                    <Box
                      component="img"
                      src="/Landing Page/QuienesSomos.jpg"
                      alt="Equipo Sellsi trabajando"
                      sx={{
                        width: '100%',
                        maxWidth: { md: 480 },
                        height: 'auto',
                        objectFit: 'cover',
                        borderRadius: '16px',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                      }}
                    />
                  </Box>
                </Box>
              </Box>
            </Box>
          ) : (
            // Original rendering for other sections (e.g., Nuestros Servicios)
            <>
              {/* El texto ya se renderiza arriba junto al título para Nuestros Servicios */}
              {title !== 'Nuestros Servicios' && (
                <Typography
                  variant="h6"
                  sx={{
                    mb: hasWizard ? { xs: 4, md: 6 } : 0,
                    textAlign: 'left',
                    fontSize: { xs: '1rem', md: '1.2rem' },
                    maxWidth: '800px',
                    mx: 0,
                    lineHeight: 1.6,
                    color: 'text.secondary',
                  }}
                >
                  {text}
                </Typography>
              )}{' '}
              {hasWizard && (
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

                      const timelineConfig = getTimelineConfig(
                        currentService.title
                      )

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
                          {' '}
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
                          </Box>{' '}
                          {/* Contenido del servicio */}{' '}
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
                            {' '}
                            {/* Botones de servicios */}{' '}
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
                                    index === currentStep
                                      ? 'contained'
                                      : 'outlined'
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
                            </Box>{' '}
                            {/* Timeline horizontal con imágenes */}{' '}
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
                              {' '}
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
                                {' '}
                                {/* Línea conectora */}{' '}
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
                                />{' '}
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
                                    {' '}
                                    {/* Imagen del paso */}{' '}
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
                                    </Box>{' '}
                                    {/* Contenido del paso */}{' '}
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
                                      {' '}
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
                                      </Typography>{' '}
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
                          </Box>{' '}
                          {/* This was missing its closing tag for the Box inside renderStep's main Box */}
                        </Box> /* This was missing its closing tag for renderStep's main Box */
                      )
                    }}
                  />
                </Box>
              )}
            </>
          )}
        </Box>
      ))}
      {/* Contáctanos */}
      <Box
        ref={contactanosRef}
        sx={{
          px: { xs: 2, sm: 4, md: 8, lg: 15, xl: 30 },
          py: { xs: 6, md: 10 },
          backgroundColor: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Typography
          variant="h3"
          fontWeight="bold"
          gutterBottom
          sx={{
            fontSize: { xs: '2rem', md: '2.5rem' },
            textAlign: 'center',
            mb: 3,
          }}
        >
          Contáctanos
        </Typography>
        <Typography
          variant="h6"
          sx={{
            mb: 6,
            textAlign: 'center',
            maxWidth: 600,
            fontSize: { xs: '1rem', md: '1.2rem' },
            color: 'text.secondary',
          }}
        >
          ¿Tienes alguna pregunta o quieres formar parte de nuestra comunidad?
          Envíanos un mensaje y nos pondremos en contacto contigo.
        </Typography>

        <Box
          component="form"
          noValidate
          autoComplete="off"
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 3,
            width: '100%',
            maxWidth: 700,
            backgroundColor: 'white',
            p: { xs: 3, md: 5 },
            borderRadius: 4,
            boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
            border: '1px solid #f0f0f0',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              gap: 3,
            }}
          >
            <input
              type="text"
              placeholder="Nombre completo"
              style={{
                flex: 1,
                padding: '14px 16px',
                border: '2px solid #e0e0e0',
                borderRadius: '8px',
                fontSize: '1rem',
                width: '100%',
                backgroundColor: 'white',
                transition: 'border-color 0.3s ease',
                outline: 'none',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#1976d2')}
              onBlur={(e) => (e.target.style.borderColor = '#e0e0e0')}
            />
            <input
              type="email"
              placeholder="Correo electrónico"
              style={{
                flex: 1,
                padding: '14px 16px',
                border: '2px solid #e0e0e0',
                borderRadius: '8px',
                fontSize: '1rem',
                width: '100%',
                backgroundColor: 'white',
                transition: 'border-color 0.3s ease',
                outline: 'none',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#1976d2')}
              onBlur={(e) => (e.target.style.borderColor = '#e0e0e0')}
            />
          </Box>

          <textarea
            placeholder="Cuéntanos sobre tu proyecto o consulta..."
            rows={6}
            style={{
              padding: '14px 16px',
              border: '2px solid #e0e0e0',
              borderRadius: '8px',
              fontSize: '1rem',
              width: '100%',
              resize: 'vertical',
              backgroundColor: 'white',
              fontFamily: 'inherit',
              transition: 'border-color 0.3s ease',
              outline: 'none',
            }}
            onFocus={(e) => (e.target.style.borderColor = '#1976d2')}
            onBlur={(e) => (e.target.style.borderColor = '#e0e0e0')}
          />

          <Button
            variant="contained"
            color="primary"
            size="large"
            sx={{
              mt: 2,
              borderRadius: '8px',
              fontWeight: 'bold',
              fontSize: '1.1rem',
              textTransform: 'none',
              py: 2,
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 25px rgba(25, 118, 210, 0.3)',
              },
            }}
          >
            Enviar Mensaje
          </Button>
        </Box>
      </Box>
    </Box>
  )
}

export default Home
