import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Button,
  Grid,
  Paper,
  TextField,
  Drawer, // ✅ MANTENER para modal en mobile
  Menu,
  MenuItem,
  Checkbox,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Collapse,
  Divider,
  Slider,
  Select,
  FormControl,
  InputLabel,
  Badge,
  Chip,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Tooltip,
  useMediaQuery, // ✅ AGREGAR para detectar mobile
  useTheme, // ✅ AGREGAR para breakpoints
  Fab, // ✅ AGREGAR para botón flotante
} from '@mui/material'
import FilterAltIcon from '@mui/icons-material/FilterAlt'
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight'
import SearchIcon from '@mui/icons-material/Search'
import FavoriteIcon from '@mui/icons-material/Favorite'
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart'
import InfoIcon from '@mui/icons-material/Info'
import CloseIcon from '@mui/icons-material/Close' // ✅ AGREGAR para cerrar modal
import TopBar from '../components/TopBar'
import BottomBar from '../components/BottomBar'

// Datos de productos (sin cambios)
const productos = [
  {
    id: 1,
    nombre: 'Notebook ASUS TUF',
    imagen: '/Marketplace productos/notebookasustuf.png',
    precio: 899990,
    precioOriginal: 1099990,
    descuento: 18,
    categoria: 'Tecnología',
    tipo: 'nuevo',
    comision: 15,
    tipoVenta: 'directa',
    rating: 4.8,
    ventas: 234,
    stock: 12,
  },
  {
    id: 2,
    nombre: 'Estufa a pellet',
    imagen: '/Marketplace productos/estufapellet.jpg',
    precio: 399990,
    precioOriginal: 489990,
    descuento: 18,
    categoria: 'Electrodomésticos',
    tipo: 'nuevo',
    comision: 18,
    tipoVenta: 'directa',
    rating: 4.5,
    ventas: 89,
    stock: 8,
  },
  {
    id: 3,
    nombre: 'Colchón King size',
    imagen: '/Marketplace productos/colchonking.webp',
    precio: 299990,
    precioOriginal: 399990,
    descuento: 25,
    categoria: 'Hogar y Muebles',
    tipo: 'nuevo',
    comision: 20,
    tipoVenta: 'directa',
    rating: 4.7,
    ventas: 156,
    stock: 5,
  },
  {
    id: 4,
    nombre: 'Lavadora automática',
    imagen: '/Marketplace productos/lavadora.webp',
    precio: 249990,
    precioOriginal: 299990,
    descuento: 17,
    categoria: 'Electrodomésticos',
    tipo: 'nuevo',
    comision: 15,
    tipoVenta: 'directa',
    rating: 4.6,
    ventas: 312,
    stock: 15,
  },
  {
    id: 5,
    nombre: 'Hervidor eléctrico',
    imagen: '/Marketplace productos/hervidor.png',
    precio: 29990,
    precioOriginal: 39990,
    descuento: 25,
    categoria: 'Electrodomésticos',
    tipo: 'oferta',
    comision: 22,
    tipoVenta: 'indirecta',
    rating: 4.3,
    ventas: 567,
    stock: 45,
  },
  {
    id: 6,
    nombre: 'Estantería metálica',
    imagen: '/Marketplace productos/estanteria.jpg',
    precio: 49990,
    precioOriginal: 69990,
    descuento: 29,
    categoria: 'Hogar y Muebles',
    tipo: 'oferta',
    comision: 18,
    tipoVenta: 'directa',
    rating: 4.4,
    ventas: 178,
    stock: 22,
  },
  {
    id: 7,
    nombre: 'Climatizador portátil',
    imagen: '/Marketplace productos/climatizador.webp',
    precio: 119990,
    precioOriginal: 159990,
    descuento: 25,
    categoria: 'Electrodomésticos',
    tipo: 'oferta',
    comision: 16,
    tipoVenta: 'directa',
    rating: 4.2,
    ventas: 93,
    stock: 18,
  },
  {
    id: 8,
    nombre: 'Horno eléctrico',
    imagen: '/Marketplace productos/horno electrico.png',
    precio: 69990,
    precioOriginal: 89990,
    descuento: 22,
    categoria: 'Electrodomésticos',
    tipo: 'oferta',
    comision: 20,
    tipoVenta: 'todos',
    rating: 4.5,
    ventas: 145,
    stock: 11,
  },
  {
    id: 9,
    nombre: 'Zapatos de vestir',
    imagen: '/Marketplace productos/zapatos.jpg',
    precio: 39990,
    precioOriginal: 59990,
    descuento: 33,
    categoria: 'Moda',
    tipo: 'top',
    comision: 25,
    tipoVenta: 'indirecta',
    rating: 4.1,
    ventas: 423,
    stock: 67,
  },
  {
    id: 10,
    nombre: 'Silla ergonómica',
    imagen: '/Marketplace productos/silla.jpg',
    precio: 89990,
    precioOriginal: 119990,
    descuento: 25,
    categoria: 'Hogar y Muebles',
    tipo: 'top',
    comision: 18,
    tipoVenta: 'directa',
    rating: 4.8,
    ventas: 289,
    stock: 9,
  },
  {
    id: 11,
    nombre: 'Inodoro (WC)',
    imagen: '/Marketplace productos/WC.jpg',
    precio: 79990,
    precioOriginal: 99990,
    descuento: 20,
    categoria: 'Construcción',
    tipo: 'general',
    comision: 15,
    tipoVenta: 'directa',
    rating: 4.0,
    ventas: 78,
    stock: 14,
  },
  {
    id: 12,
    nombre: 'Limpiador de vidrios',
    imagen: '/Marketplace productos/limpiadordevidrios.webp',
    precio: 19990,
    precioOriginal: 24990,
    descuento: 20,
    categoria: 'Hogar y Muebles',
    tipo: 'top',
    comision: 30,
    tipoVenta: 'indirecta',
    rating: 4.3,
    ventas: 634,
    stock: 89,
  },
  {
    id: 13,
    nombre: 'Bicicleta urbana',
    imagen: '/Marketplace productos/bicicleta.jpg',
    precio: 159990,
    precioOriginal: 199990,
    descuento: 20,
    categoria: 'Deportes y Fitness',
    tipo: 'general',
    comision: 12,
    tipoVenta: 'directa',
    rating: 4.6,
    ventas: 112,
    stock: 6,
  },
]

const categorias = [
  'Tecnología',
  'Electrodomésticos',
  'Hogar y Muebles',
  'Moda',
  'Construcción',
  'Deportes y Fitness',
  'Vehículos',
  'Inmuebles',
  'Supermercado',
  'Accesorios para Vehículos',
  'Belleza y Cuidado personal',
  'Juegos y Juguetes',
  'Mascotas',
  'Herramientas',
  'Compra Internacional',
  'Farmacias',
  'Bebés',
  'Productos Sustentables',
  'Más vendidos',
  'Industrias y Oficinas',
  'Tiendas oficiales',
]

// Componente para tarjetas de producto
function ProductoCard({ producto }) {
  const [favorito, setFavorito] = useState(false)
  const {
    nombre,
    imagen,
    precio,
    precioOriginal,
    descuento,
    comision,
    tipoVenta,
    rating,
    ventas,
    stock,
  } = producto

  const toggleFavorito = () => setFavorito(!favorito)

  // ✅ FUNCIÓN para obtener el mensaje del tooltip
  const getTooltipMessage = (tipo) => {
    switch (tipo) {
      case 'directa':
        return 'El productor vende directamente al cliente final, sin usar intermediarios como distribuidores o minoristas.'
      case 'indirecta':
        return 'El producto se comercializa a través de intermediarios antes de llegar al cliente final.'
      default:
        return 'Información sobre el tipo de venta no disponible.'
    }
  }

  return (
    <Card
      elevation={2}
      sx={{
        height: 620,
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 2,
        transition: 'all 0.3s ease',
        position: 'relative',
        overflow: 'hidden',
        '&:hover': {
          boxShadow: '0 12px 24px rgba(0,0,0,0.15)',
          transform: 'translateY(-6px)',
        },
      }}
    >
      {/* Badge de descuento */}
      {descuento > 0 && (
        <Box
          sx={{
            position: 'absolute',
            top: 12,
            left: 12,
            bgcolor: '#FF5252',
            color: 'white',
            fontWeight: 'bold',
            fontSize: 16,
            py: 1,
            px: 2,
            borderRadius: 2,
            zIndex: 2,
            boxShadow: '0 3px 6px rgba(0,0,0,0.3)',
          }}
        >
          -{descuento}%
        </Box>
      )}

      {/* Icono favorito */}
      <IconButton
        onClick={toggleFavorito}
        sx={{
          position: 'absolute',
          top: 8,
          right: 8,
          zIndex: 2,
          bgcolor: 'rgba(255,255,255,0.95)',
          width: 44,
          height: 44,
          '&:hover': {
            bgcolor: 'rgba(255,255,255,1)',
            transform: 'scale(1.1)',
          },
        }}
        size="medium"
      >
        {favorito ? (
          <FavoriteIcon sx={{ color: '#FF5252', fontSize: 28 }} />
        ) : (
          <FavoriteBorderIcon sx={{ color: '#666', fontSize: 28 }} />
        )}
      </IconButton>

      {/* Imagen */}
      <CardMedia
        component="img"
        height="220"
        image={imagen}
        alt={nombre}
        sx={{
          objectFit: 'contain',
          p: 2,
          bgcolor: '#fafafa',
        }}
      />

      <CardContent sx={{ flexGrow: 1, p: 3, pb: 1 }}>
        {/* Nombre */}
        <Typography
          variant="h6"
          fontWeight={700}
          sx={{
            mb: 0.1,
            height: 65,
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            fontSize: 24,
            lineHeight: 1.3,
            color: '#1e293b',
          }}
        >
          {nombre}
        </Typography>

        {/* Rating y ventas */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
            <Box sx={{ fontSize: 24, color: '#FFD700' }}>
              {'★'.repeat(Math.floor(rating))}
            </Box>
            <Typography
              variant="body1"
              sx={{ ml: 0.5, color: '#666', fontSize: 17, fontWeight: 600 }}
            >
              ({rating})
            </Typography>
          </Box>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ fontSize: 16, fontWeight: 600 }}
          >
            {ventas} vendidos
          </Typography>
        </Box>

        {/* Precios */}
        <Box sx={{ mb: 2.5 }}>
          {precioOriginal > precio && (
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{
                textDecoration: 'line-through',
                display: 'block',
                fontSize: 18,
                fontWeight: 500,
                mb: 0.5,
              }}
            >
              ${precioOriginal.toLocaleString('es-CL')}
            </Typography>
          )}
          <Typography
            variant="h4"
            color="primary"
            fontWeight={700}
            sx={{ lineHeight: 1.2, fontSize: 30 }}
          >
            ${precio.toLocaleString('es-CL')}
          </Typography>
        </Box>

        {/* Información adicional */}
        <Typography
          variant="body1"
          color="success.main"
          sx={{ display: 'block', mb: 1, fontSize: 17, fontWeight: 700 }}
        >
          {comision}% Comisión
        </Typography>

        {/* ✅ TOOLTIP MEJORADO con icono de información */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Typography
            variant="body1"
            sx={{
              color: tipoVenta === 'directa' ? '#1976D2' : '#FF9800',
              fontSize: 16,
              fontWeight: 700,
            }}
          >
            Venta{' '}
            {tipoVenta === 'directa'
              ? 'Directa'
              : tipoVenta === 'indirecta'
              ? 'Indirecta'
              : 'Todos los tipos'}
          </Typography>

          {/* ✅ ICONO DE INFORMACIÓN con tooltip */}
          <Tooltip
            title={getTooltipMessage(tipoVenta)}
            arrow
            placement="top"
            componentsProps={{
              tooltip: {
                sx: {
                  bgcolor: '#1e293b',
                  color: 'white',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  p: 2,
                  borderRadius: 2,
                  maxWidth: 300,
                  lineHeight: 1.4,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                },
              },
              arrow: {
                sx: {
                  color: '#1e293b',
                  '&::before': {
                    boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                  },
                },
              },
            }}
            enterDelay={300}
            leaveDelay={200}
            enterTouchDelay={300}
            leaveTouchDelay={3000}
          >
            <IconButton
              size="small"
              sx={{
                width: 20,
                height: 20,
                p: 0,
                color: tipoVenta === 'directa' ? '#1976D2' : '#FF9800',
                '&:hover': {
                  bgcolor:
                    tipoVenta === 'directa'
                      ? 'rgba(25, 118, 210, 0.1)'
                      : 'rgba(255, 152, 0, 0.1)',
                  transform: 'scale(1.1)',
                },
                transition: 'all 0.2s ease',
              }}
            >
              <InfoIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
        </Box>

        <Typography
          variant="body1"
          color={stock < 10 ? 'error.main' : 'text.secondary'}
          sx={{ fontSize: 16, fontWeight: 700 }}
        >
          {stock < 10 ? `¡Solo ${stock} disponibles!` : `Stock: ${stock}`}
        </Typography>
      </CardContent>

      {/* Botón agregar al carrito */}
      <CardActions sx={{ p: 2.5, pt: 1 }}>
        <Button
          variant="contained"
          color="primary"
          fullWidth
          startIcon={<ShoppingCartIcon />}
          sx={{
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: 3,
            py: 1,
            fontSize: '1rem',
            minHeight: 40,
            background: 'linear-gradient(135deg, #1976D2 0%, #1565C0 100%)',
            boxShadow: '0 4px 15px rgba(25, 118, 210, 0.4)',
            '&:hover': {
              background: 'linear-gradient(135deg, #1565C0 0%, #0D47A1 100%)',
              boxShadow: '0 6px 20px rgba(25, 118, 210, 0.6)',
              transform: 'translateY(-2px)',
            },
            '& .MuiButton-startIcon': {
              marginRight: 1,
            },
          }}
        >
          AGREGAR
        </Button>
      </CardActions>
    </Card>
  )
}

// Componente principal del Marketplace
export default function Marketplace4() {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  // Estados existentes
  const [seccionActiva, setSeccionActiva] = useState('todos')
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(['Todas'])
  const [filtroVisible, setFiltroVisible] = useState(false)
  const [anchorElCategorias, setAnchorElCategorias] = useState(null)
  const [busqueda, setBusqueda] = useState('')
  const [ordenamiento, setOrdenamiento] = useState('relevancia')
  const [filtros, setFiltros] = useState({
    precioMin: '',
    precioMax: '',
    comisionMin: '',
    comisionMax: '',
    tiposVenta: [],
    soloConStock: false,
    ratingMin: 0,
  })
  const [precioRango, setPrecioRango] = useState([0, 1000000])
  const [comisionRango, setComisionRango] = useState([0, 30])

  // ✅ ESTADOS mejorados para scroll behavior
  const [scrollY, setScrollY] = useState(0)
  const [prevScrollY, setPrevScrollY] = useState(0)
  const [showSearchBar, setShowSearchBar] = useState(true)
  const [isSearchBarSticky, setIsSearchBarSticky] = useState(false)
  const [filtroModalOpen, setFiltroModalOpen] = useState(false)
  const [showTopBarOnHover, setShowTopBarOnHover] = useState(false)

  // ✅ HOOK mejorado con throttling para mejor performance
  useEffect(() => {
    let ticking = false // ✅ Throttling para scroll
    let mouseThrottle = false // ✅ Throttling para mouse

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const currentScrollY = window.scrollY

          setScrollY(currentScrollY)

          if (isMobile) {
            // 📱 MOBILE: Scroll reactivo
            if (currentScrollY > prevScrollY && currentScrollY > 100) {
              setShowSearchBar(false)
            } else if (currentScrollY < prevScrollY) {
              setShowSearchBar(true)
            }
          } else {
            // 🖥️ DESKTOP: Comportamiento de ocultación
            if (currentScrollY > 150) {
              setIsSearchBarSticky(true)
            } else {
              setIsSearchBarSticky(false)
              setShowTopBarOnHover(false) // ✅ Reset hover cuando no es sticky
            }
          }

          setPrevScrollY(currentScrollY)
          ticking = false
        })
        ticking = true
      }
    }

    // ✅ DETECTAR posición del mouse con throttling
    const handleMouseMove = (e) => {
      if (!mouseThrottle) {
        setTimeout(() => {
          if (!isMobile && isSearchBarSticky) {
            // Mostrar TopBar cuando mouse esté en los primeros 100px
            if (e.clientY < 100) {
              setShowTopBarOnHover(true)
            } else if (e.clientY > 150) {
              // ✅ Zona de histéresis
              setShowTopBarOnHover(false)
            }
          }
          mouseThrottle = false
        }, 16) // ✅ ~60fps throttling
        mouseThrottle = true
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true }) // ✅ Passive para mejor performance
    window.addEventListener('mousemove', handleMouseMove, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [prevScrollY, isMobile, isSearchBarSticky])

  // ✅ DETERMINAR si mostrar barra de búsqueda
  const shouldShowSearchBar = isMobile
    ? showSearchBar
    : isSearchBarSticky
    ? showTopBarOnHover
    : true

  // Manejadores existentes
  const handleAbrirMenuCategorias = (event) => {
    setAnchorElCategorias(event.currentTarget)
  }

  const handleCerrarMenuCategorias = () => {
    setAnchorElCategorias(null)
  }

  const handleSeleccionarCategoria = (categoria) => {
    if (categoria === 'Todas') {
      setCategoriaSeleccionada(['Todas'])
    } else {
      setCategoriaSeleccionada((prev) => {
        const sinTodas = prev.filter((c) => c !== 'Todas')

        if (sinTodas.includes(categoria)) {
          const nuevaSeleccion = sinTodas.filter((c) => c !== categoria)
          return nuevaSeleccion.length === 0 ? ['Todas'] : nuevaSeleccion
        } else {
          return [...sinTodas, categoria]
        }
      })
    }
    handleCerrarMenuCategorias()
  }

  const handleCambiarSeccion = (seccion) => {
    setSeccionActiva(seccion)
  }

  // ✅ MEJORAR toggle de filtros
  const handleToggleFiltro = () => {
    if (isMobile) {
      setFiltroModalOpen(!filtroModalOpen)
    } else {
      setFiltroVisible(!filtroVisible)
    }
  }

  // ✅ CERRAR modal de filtros en mobile
  const handleCerrarFiltroModal = () => {
    setFiltroModalOpen(false)
  }

  const handleChangePrecioRango = (event, newValue) => {
    setPrecioRango(newValue)
    setFiltros({
      ...filtros,
      precioMin: newValue[0],
      precioMax: newValue[1],
    })
  }

  const handleChangeComisionRango = (event, newValue) => {
    setComisionRango(newValue)
    setFiltros({
      ...filtros,
      comisionMin: newValue[0],
      comisionMax: newValue[1],
    })
  }

  const handleTipoVentaChange = (tipo) => {
    setFiltros((prevFiltros) => {
      const tiposActuales = [...prevFiltros.tiposVenta]
      if (tiposActuales.includes(tipo)) {
        return {
          ...prevFiltros,
          tiposVenta: tiposActuales.filter((t) => t !== tipo),
        }
      } else {
        return {
          ...prevFiltros,
          tiposVenta: [...tiposActuales, tipo],
        }
      }
    })
  }

  const resetFiltros = () => {
    setFiltros({
      precioMin: '',
      precioMax: '',
      comisionMin: '',
      comisionMax: '',
      tiposVenta: [],
      soloConStock: false,
      ratingMin: 0,
    })
    setPrecioRango([0, 1000000])
    setComisionRango([0, 30])
    setCategoriaSeleccionada(['Todas'])
    setBusqueda('')
  }

  // Filtrar productos según criterios
  let productosFiltrados = productos.filter((producto) => {
    // Filtrar por sección activa
    if (seccionActiva === 'nuevos' && producto.tipo !== 'nuevo') return false
    if (seccionActiva === 'ofertas' && producto.tipo !== 'oferta') return false
    if (seccionActiva === 'topVentas' && producto.tipo !== 'top') return false

    // Filtrar por búsqueda
    if (
      busqueda &&
      !producto.nombre.toLowerCase().includes(busqueda.toLowerCase())
    )
      return false

    // Filtrar por categoría
    if (
      categoriaSeleccionada.length > 0 &&
      !categoriaSeleccionada.includes('Todas') &&
      !categoriaSeleccionada.includes(producto.categoria)
    )
      return false

    // Filtrar por precio
    if (filtros.precioMin && producto.precio < filtros.precioMin) return false
    if (filtros.precioMax && producto.precio > filtros.precioMax) return false

    // Filtrar por comisión
    if (filtros.comisionMin && producto.comision < filtros.comisionMin)
      return false
    if (filtros.comisionMax && producto.comision > filtros.comisionMax)
      return false

    // Filtrar por tipo de venta
    if (
      filtros.tiposVenta.length > 0 &&
      !filtros.tiposVenta.includes(producto.tipoVenta)
    )
      return false

    // Filtrar por stock
    if (filtros.soloConStock && producto.stock === 0) return false

    // Filtrar por rating
    if (filtros.ratingMin && producto.rating < filtros.ratingMin) return false

    return true
  })

  // Ordenar productos
  if (ordenamiento === 'menor-precio') {
    productosFiltrados = [...productosFiltrados].sort(
      (a, b) => a.precio - b.precio
    )
  } else if (ordenamiento === 'mayor-precio') {
    productosFiltrados = [...productosFiltrados].sort(
      (a, b) => b.precio - a.precio
    )
  } else if (ordenamiento === 'mayor-descuento') {
    productosFiltrados = [...productosFiltrados].sort(
      (a, b) => b.descuento - a.descuento
    )
  } else if (ordenamiento === 'mas-vendidos') {
    productosFiltrados = [...productosFiltrados].sort(
      (a, b) => b.ventas - a.ventas
    )
  }
  // ✅ COMPONENTE de contenido de filtros (tamaño reducido)
  const FiltrosContent = () => (
    <Box
      sx={{
        p: 3,
        height: '100%',
        overflowY: 'auto', // ✅ Scroll interno para el contenido de filtros
        width: isMobile ? '100%' : 290, // ✅ REDUCIDO de 300 a 290 (3% menos)
        // ✅ SCROLLBAR styling para mejor UX
        '&::-webkit-scrollbar': {
          width: '6px',
        },
        '&::-webkit-scrollbar-track': {
          background: '#f1f1f1',
          borderRadius: '10px',
        },
        '&::-webkit-scrollbar-thumb': {
          background: '#c1c1c1',
          borderRadius: '10px',
          '&:hover': {
            background: '#a1a1a1',
          },
        },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
        }}
      >
        <Typography variant="h6" fontWeight={600}>
          Filtros
        </Typography>
        <Button
          variant="text"
          size="small"
          onClick={resetFiltros}
          sx={{ fontSize: 12 }}
        >
          Limpiar todo
        </Button>
      </Box>

      <Divider sx={{ mb: 3 }} />

      {/* Filtro por precio */}
      <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
        💰 Precio
      </Typography>
      <Box sx={{ px: 1, mb: 3 }}>
        <Slider
          value={precioRango}
          onChange={handleChangePrecioRango}
          valueLabelDisplay="auto"
          min={0}
          max={1000000}
          step={10000}
          valueLabelFormat={(value) => `$${value.toLocaleString('es-CL')}`}
          sx={{ mb: 2 }}
        />
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'stretch' }}>
          <TextField
            label="Mínimo"
            variant="outlined"
            size="small"
            value={filtros.precioMin}
            onChange={(e) => {
              const value = parseInt(e.target.value) || ''
              setFiltros((prev) => ({ ...prev, precioMin: value }))
              if (value !== '') {
                setPrecioRango([value, precioRango[1]])
              }
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">$</InputAdornment>
              ),
            }}
            sx={{
              flex: 1,
              '& .MuiOutlinedInput-root': {
                height: '40px',
              },
            }}
          />
          <TextField
            label="Máximo"
            variant="outlined"
            size="small"
            value={filtros.precioMax}
            onChange={(e) => {
              const value = parseInt(e.target.value) || ''
              setFiltros((prev) => ({ ...prev, precioMax: value }))
              if (value !== '') {
                setPrecioRango([precioRango[0], value])
              }
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">$</InputAdornment>
              ),
            }}
            sx={{
              flex: 1,
              '& .MuiOutlinedInput-root': {
                height: '40px',
              },
            }}
          />
        </Box>
      </Box>

      {/* Filtro por comisión */}
      <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
        📈 Comisión
      </Typography>
      <Box sx={{ px: 1, mb: 3 }}>
        <Slider
          value={comisionRango}
          onChange={handleChangeComisionRango}
          valueLabelDisplay="auto"
          min={0}
          max={30}
          step={1}
          valueLabelFormat={(value) => `${value}%`}
          sx={{ mb: 2 }}
        />
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'stretch' }}>
          <TextField
            label="Mínimo"
            variant="outlined"
            size="small"
            value={filtros.comisionMin}
            onChange={(e) => {
              const value = parseInt(e.target.value) || ''
              setFiltros((prev) => ({ ...prev, comisionMin: value }))
              if (value !== '') {
                setComisionRango([value, comisionRango[1]])
              }
            }}
            InputProps={{
              endAdornment: <InputAdornment position="end">%</InputAdornment>,
            }}
            sx={{
              flex: 1,
              '& .MuiOutlinedInput-root': {
                height: '40px',
              },
            }}
          />
          <TextField
            label="Máximo"
            variant="outlined"
            size="small"
            value={filtros.comisionMax}
            onChange={(e) => {
              const value = parseInt(e.target.value) || ''
              setFiltros((prev) => ({ ...prev, comisionMax: value }))
              if (value !== '') {
                setComisionRango([comisionRango[0], value])
              }
            }}
            InputProps={{
              endAdornment: <InputAdornment position="end">%</InputAdornment>,
            }}
            sx={{
              flex: 1,
              '& .MuiOutlinedInput-root': {
                height: '40px',
              },
            }}
          />
        </Box>
      </Box>

      {/* Filtro por tipo de venta */}
      <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
        🏪 Tipo de venta
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', mb: 2 }}>
        <FormControlLabel
          control={
            <Checkbox
              checked={filtros.tiposVenta.includes('directa')}
              onChange={() => handleTipoVentaChange('directa')}
            />
          }
          label="Venta Directa"
          sx={{
            mb: 0.5,
            '& .MuiFormControlLabel-label': {
              fontSize: '0.875rem',
            },
          }}
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={filtros.tiposVenta.includes('indirecta')}
              onChange={() => handleTipoVentaChange('indirecta')}
            />
          }
          label="Venta Indirecta"
          sx={{
            mb: 0,
            '& .MuiFormControlLabel-label': {
              fontSize: '0.875rem',
            },
          }}
        />
      </Box>

      {/* Filtros adicionales */}
      <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
        ⚡ Opciones adicionales
      </Typography>
      <FormControlLabel
        control={
          <Checkbox
            checked={filtros.soloConStock}
            onChange={(e) =>
              setFiltros((prev) => ({
                ...prev,
                soloConStock: e.target.checked,
              }))
            }
          />
        }
        label="Solo con stock"
        sx={{ mb: 1 }}
      />

      {/* Rating mínimo */}
      <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
        ⭐ Valoración mínima
      </Typography>
      <Box sx={{ px: 1, mb: 3 }}>
        {/* Indicador visual de estrellas */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            {filtros.ratingMin === 0
              ? 'Sin filtro'
              : `${filtros.ratingMin}+ estrellas`}
          </Typography>
          <Box sx={{ display: 'flex', gap: 0.5, ml: 1 }}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Box
                key={star}
                sx={{
                  fontSize: '18px',
                  color: star <= filtros.ratingMin ? '#FFD700' : '#E0E0E0',
                  transition: 'color 0.2s ease',
                }}
              >
                ★
              </Box>
            ))}
          </Box>
        </Box>

        {/* Slider mejorado */}
        <Box
          sx={{
            px: 2,
            py: 1,
            bgcolor: '#f8fafc',
            borderRadius: 2,
            border: '1px solid #e2e8f0',
          }}
        >
          <Slider
            value={filtros.ratingMin}
            onChange={(e, value) =>
              setFiltros((prev) => ({ ...prev, ratingMin: value }))
            }
            min={0}
            max={5}
            step={0.5}
            valueLabelDisplay="off"
            marks={[
              { value: 0, label: '0' },
              { value: 1, label: '1' },
              { value: 2, label: '2' },
              { value: 3, label: '3' },
              { value: 4, label: '4' },
              { value: 5, label: '5' },
            ]}
            sx={{
              mb: 0,
              height: 8,
              '& .MuiSlider-track': {
                height: 6,
                border: 'none',
                background: 'linear-gradient(90deg, #FFD700 0%, #FFA500 100%)',
                borderRadius: 3,
              },
              '& .MuiSlider-rail': {
                height: 6,
                opacity: 0.3,
                backgroundColor: '#E0E0E0',
                borderRadius: 3,
              },
              '& .MuiSlider-thumb': {
                height: 24,
                width: 24,
                backgroundColor: '#FFD700',
                border: '3px solid #FFF',
                boxShadow: '0 2px 8px rgba(255, 215, 0, 0.3)',
                '&:focus, &:hover, &.Mui-active': {
                  boxShadow: '0 4px 12px rgba(255, 215, 0, 0.4)',
                  transform: 'scale(1.1)',
                },
                '&:before': {
                  display: 'none',
                },
              },
              '& .MuiSlider-mark': {
                backgroundColor: '#FFD700',
                height: 4,
                width: 4,
                borderRadius: '50%',
                opacity: 0.7,
                '&.MuiSlider-markActive': {
                  backgroundColor: '#FFA500',
                  opacity: 1,
                },
              },
              '& .MuiSlider-markLabel': {
                fontSize: '11px',
                fontWeight: 500,
                color: '#64748b',
                top: 26,
                '&.MuiSlider-markLabelActive': {
                  color: '#1e293b',
                },
              },
            }}
          />
        </Box>

        {/* Texto descriptivo */}
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{
            mt: 1,
            display: 'block',
            textAlign: 'center',
          }}
        >
          Desliza para filtrar por valoración mínima
        </Typography>
      </Box>

      {/* Botón aplicar en versión móvil */}
      <Box sx={{ display: { xs: 'block', md: 'none' }, mt: 4 }}>
        <Button
          variant="contained"
          color="primary"
          fullWidth
          onClick={handleToggleFiltro}
          sx={{ py: 1.5, fontWeight: 600 }}
        >
          Aplicar filtros
        </Button>
      </Box>
    </Box>
  )

  return (
    <Box sx={{ bgcolor: '#f8fafc', minHeight: '100vh' }}>
      {/* ✅ BARRA DE BÚSQUEDA igual que antes... */}
      <Box
        sx={{
          mt: 0,
          py: 0,
          px: { xs: 1, md: 3 },
          bgcolor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          boxShadow: shouldShowSearchBar
            ? '0 4px 20px rgba(0,0,0,0.15)'
            : 'none',
          borderBottom: shouldShowSearchBar ? '1px solid #e2e8f0' : 'none',
          position: 'fixed',
          top: shouldShowSearchBar ? 64 : -200,
          left: 0,
          right: 0,
          zIndex: 1000,
          transition: 'all 0.3s ease-out',
          transform: shouldShowSearchBar
            ? 'translateY(0)'
            : 'translateY(-10px)',
          opacity: shouldShowSearchBar ? 1 : 0,
          willChange: shouldShowSearchBar ? 'auto' : 'transform, opacity',
        }}
      >
        {/* Contenido de la barra igual que antes... */}
        <Box sx={{ py: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <TextField
              placeholder="Buscar productos..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              sx={{
                flexGrow: 1,
                maxWidth: 600,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
              }}
              size="small"
            />

            <FormControl variant="outlined" size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Ordenar por</InputLabel>
              <Select
                value={ordenamiento}
                onChange={(e) => setOrdenamiento(e.target.value)}
                label="Ordenar por"
              >
                <MenuItem value="relevancia">Relevancia</MenuItem>
                <MenuItem value="menor-precio">Menor precio</MenuItem>
                <MenuItem value="mayor-precio">Mayor precio</MenuItem>
                <MenuItem value="mayor-descuento">Mayor descuento</MenuItem>
                <MenuItem value="mejor-rating">Mejor valorado</MenuItem>
                <MenuItem value="mas-vendidos">Más vendidos</MenuItem>
              </Select>
            </FormControl>

            {(!isMobile || shouldShowSearchBar) && (
              <IconButton
                onClick={handleToggleFiltro}
                sx={{
                  color:
                    filtroVisible || filtroModalOpen
                      ? 'primary.main'
                      : '#64748b',
                  bgcolor:
                    filtroVisible || filtroModalOpen
                      ? 'rgba(25, 118, 210, 0.1)'
                      : 'transparent',
                  '&:hover': {
                    bgcolor: 'rgba(25, 118, 210, 0.1)',
                  },
                }}
                aria-label="Filtrar productos"
              >
                <Badge
                  color="primary"
                  variant="dot"
                  invisible={
                    !Object.values(filtros).some((v) =>
                      Array.isArray(v)
                        ? v.length > 0
                        : v !== '' && v !== false && v !== 0
                    )
                  }
                >
                  <FilterAltIcon />
                </Badge>
              </IconButton>
            )}
          </Box>

          {/* Navegación principal */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button
              endIcon={<ArrowDropDownIcon />}
              onClick={handleAbrirMenuCategorias}
              sx={{
                fontWeight: 700,
                color: '#1e293b',
                fontSize: { xs: 14, md: 16 },
                textTransform: 'none',
                py: 1,
                px: 2,
              }}
            >
              Categorías
            </Button>

            {/* Menu de categorías */}
            <Menu
              anchorEl={anchorElCategorias}
              open={Boolean(anchorElCategorias)}
              onClose={handleCerrarMenuCategorias}
              sx={{
                '& .MuiPaper-root': {
                  maxHeight: 450,
                  width: 300,
                  mt: 1,
                },
              }}
            >
              {categorias.map((categoria) => (
                <MenuItem
                  key={categoria}
                  onClick={() => handleSeleccionarCategoria(categoria)}
                  dense
                  sx={{
                    height: 40,
                    '&:hover': { bgcolor: '#f1f5f9' },
                    ...(categoriaSeleccionada.includes(categoria) && {
                      bgcolor: '#e0f2fe',
                      fontWeight: 600,
                      color: 'primary.main',
                    }),
                    ...(categoria === 'Todas' && {
                      borderBottom: '1px solid #e2e8f0',
                      fontWeight: 600,
                    }),
                  }}
                >
                  {categoria}
                  {categoria === 'Tecnología' && (
                    <KeyboardArrowRightIcon
                      fontSize="small"
                      sx={{ ml: 'auto' }}
                    />
                  )}
                  {categoria === 'Todas' &&
                    categoriaSeleccionada.includes('Todas') && (
                      <Box
                        sx={{
                          ml: 'auto',
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          bgcolor: 'primary.main',
                        }}
                      />
                    )}
                </MenuItem>
              ))}
            </Menu>

            <Button
              onClick={() => handleCambiarSeccion('nuevos')}
              sx={{
                fontWeight: 600,
                color: seccionActiva === 'nuevos' ? 'primary.main' : '#475569',
                fontSize: { xs: 14, md: 16 },
                textTransform: 'none',
                borderBottom: seccionActiva === 'nuevos' ? 2 : 0,
                borderColor: 'primary.main',
                borderRadius: 0,
                py: 1,
                px: 2,
              }}
            >
              ✨ Nuevos
            </Button>

            <Button
              onClick={() => handleCambiarSeccion('ofertas')}
              sx={{
                fontWeight: 600,
                color: seccionActiva === 'ofertas' ? 'primary.main' : '#475569',
                fontSize: { xs: 14, md: 16 },
                textTransform: 'none',
                borderBottom: seccionActiva === 'ofertas' ? 2 : 0,
                borderColor: 'primary.main',
                borderRadius: 0,
                py: 1,
                px: 2,
              }}
            >
              🔥 Ofertas
            </Button>

            <Button
              onClick={() => handleCambiarSeccion('topVentas')}
              sx={{
                fontWeight: 600,
                color:
                  seccionActiva === 'topVentas' ? 'primary.main' : '#475569',
                fontSize: { xs: 14, md: 16 },
                textTransform: 'none',
                borderBottom: seccionActiva === 'topVentas' ? 2 : 0,
                borderColor: 'primary.main',
                borderRadius: 0,
                py: 1,
                px: 2,
              }}
            >
              ⭐ Top Ventas
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Botón flotante */}
      {isMobile && !shouldShowSearchBar && (
        <Fab
          color="primary"
          onClick={handleToggleFiltro}
          sx={{
            position: 'fixed',
            bottom: 80,
            right: 20,
            zIndex: 1000,
            transition: 'all 0.3s ease',
          }}
        >
          <Badge
            color="error"
            variant="dot"
            invisible={
              !Object.values(filtros).some((v) =>
                Array.isArray(v)
                  ? v.length > 0
                  : v !== '' && v !== false && v !== 0
              )
            }
          >
            <FilterAltIcon />
          </Badge>
        </Fab>
      )}

      {/* ✅ PANEL DE FILTROS - TAMAÑO REDUCIDO 3% */}
      {!isMobile && (
        <Box
          sx={{
            position: 'fixed',
            left: filtroVisible ? 0 : -330, // ✅ REDUCIDO de -340 a -330 (3% menos)
            top: shouldShowSearchBar ? 180 : 90,
            width: 330, // ✅ REDUCIDO de 340 a 330 (3% menos)
            maxHeight: shouldShowSearchBar
              ? 'calc(100vh - 200px)'
              : 'calc(100vh - 110px)',
            zIndex: 60,
            transition: 'left 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            overflowY: 'auto',
          }}
        >
          <Box
            sx={{
              width: 310, // ✅ REDUCIDO de 320 a 310 (3% menos)
              ml: 1,
              bgcolor: '#fff',
              borderRadius: 2,
              boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
              border: '1px solid #e2e8f0',
              opacity: filtroVisible ? 1 : 0,
              transform: filtroVisible ? 'scale(1)' : 'scale(0.95)',
              transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            <FiltrosContent />
          </Box>
        </Box>
      )}

      {/* Modal de filtros en mobile igual... */}
      {isMobile && (
        <Drawer
          anchor="bottom"
          open={filtroModalOpen}
          onClose={handleCerrarFiltroModal}
          PaperProps={{
            sx: {
              maxHeight: '80vh',
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
            },
          }}
        >
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              p: 2,
              borderBottom: '1px solid #e2e8f0',
            }}
          >
            <Typography variant="h6" fontWeight={600}>
              Filtros
            </Typography>
            <IconButton onClick={handleCerrarFiltroModal}>
              <CloseIcon />
            </IconButton>
          </Box>
          <FiltrosContent />
          <Box sx={{ p: 2 }}>
            <Button
              variant="contained"
              fullWidth
              onClick={handleCerrarFiltroModal}
              sx={{ py: 1.5, fontWeight: 600 }}
            >
              Aplicar filtros
            </Button>
          </Box>
        </Drawer>
      )}

      {/* ✅ CONTENIDO PRINCIPAL - MÁRGENES LATERALES AUMENTADOS 2% */}
      <Box
        sx={{
          pt: { xs: 1, md: shouldShowSearchBar ? 18 : 8 },
          px: { xs: 2.04, md: 6.12 }, // ✅ AUMENTADO 2%: de 2,6 a 2.04,6.12
          pb: 3,
          minHeight: '100vh',
          mx: { xs: 1.02, md: 3.06 }, // ✅ AUMENTADO 2%: de 1,3 a 1.02,3.06
        }}
      >
        {/* ✅ ÁREA DE PRODUCTOS - MÁRGENES AJUSTADOS */}
        <Box
          sx={{
            width: '100%',
            px: { xs: 1.02, md: 3.06 }, // ✅ AUMENTADO 2%: de 1,3 a 1.02,2.06
            mx: { xs: 0, md: 2.04 }, // ✅ AUMENTADO 2%: de 0,2 a 0,2.04
          }}
        >
          {/* ✅ CHIPS DE FILTROS ACTIVOS - PRIMERO */}
          {(categoriaSeleccionada.length > 0 ||
            filtros.precioMin ||
            filtros.precioMax ||
            filtros.comisionMin ||
            filtros.comisionMax ||
            filtros.tiposVenta.length > 0 ||
            filtros.soloConStock ||
            filtros.ratingMin > 0 ||
            busqueda) && (
            <Paper
              elevation={0}
              sx={{
                p: 2,
                mb: 3,
                display: 'flex',
                flexWrap: 'wrap',
                gap: 1,
                alignItems: 'center',
                bgcolor: '#f8fafc',
                borderRadius: 2,
                mx: { xs: 0, md: 1.02 },
              }}
            >
              <Typography variant="body2" sx={{ mr: 1, fontWeight: 600 }}>
                Filtros activos:
              </Typography>

              {busqueda && (
                <Chip
                  label={`Búsqueda: "${busqueda}"`}
                  onDelete={() => setBusqueda('')}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
              )}

              {categoriaSeleccionada
                .filter((cat) => cat !== 'Todas')
                .map((cat) => (
                  <Chip
                    key={cat}
                    label={cat}
                    onDelete={() => handleSeleccionarCategoria(cat)}
                    size="small"
                    variant="outlined"
                  />
                ))}

              {(filtros.precioMin || filtros.precioMax) && (
                <Chip
                  label={`Precio: $${(filtros.precioMin || 0).toLocaleString(
                    'es-CL'
                  )} - $${(filtros.precioMax || 1000000).toLocaleString(
                    'es-CL'
                  )}`}
                  onDelete={() => {
                    setFiltros((prev) => ({
                      ...prev,
                      precioMin: '',
                      precioMax: '',
                    }))
                    setPrecioRango([0, 1000000])
                  }}
                  size="small"
                  variant="outlined"
                />
              )}

              {filtros.tiposVenta.map((tipo) => (
                <Chip
                  key={tipo}
                  label={`${tipo === 'directa' ? 'Directa' : 'Indirecta'}`}
                  onDelete={() => handleTipoVentaChange(tipo)}
                  size="small"
                  variant="outlined"
                />
              ))}

              <Button
                variant="text"
                size="small"
                onClick={resetFiltros}
                sx={{ ml: 'auto', fontSize: 12 }}
              >
                Limpiar todos
              </Button>
            </Paper>
          )}

          {/* ✅ TÍTULO DE SECCIÓN Y CONTADOR - SEGUNDO */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 3,
              marginLeft: { xs: '150px', md: '200px' }, // ✅ AUMENTADO MUCHO MÁS: de 80px/120px a 150px/200px
              marginRight: { xs: '20px', md: '40px' }, // ✅ Mantener margen derecho
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {seccionActiva !== 'todos' && (
                <IconButton
                  onClick={() => handleCambiarSeccion('todos')}
                  sx={{
                    bgcolor: '#f1f5f9',
                    color: 'primary.main',
                    '&:hover': {
                      bgcolor: 'primary.main',
                      color: 'white',
                    },
                    transition: 'all 0.2s ease',
                  }}
                  aria-label="Volver a todos los productos"
                >
                  <ArrowBackIcon />
                </IconButton>
              )}

              <Typography
                variant="h5"
                fontWeight={600}
                sx={{ color: '#1e293b' }}
              >
                {seccionActiva === 'nuevos'
                  ? '✨ Nuevos Productos'
                  : seccionActiva === 'ofertas'
                  ? '🔥 Ofertas Destacadas'
                  : seccionActiva === 'topVentas'
                  ? '⭐ Top Ventas'
                  : '🛍️ Todos los Productos'}
              </Typography>
            </Box>

            <Typography variant="body2" color="text.secondary">
              {productosFiltrados.length} productos encontrados
            </Typography>
          </Box>

          {/* ✅ GRID DE PRODUCTOS - TERCERO */}
          {productosFiltrados.length === 0 ? (
            <Paper
              sx={{
                p: 6,
                textAlign: 'center',
                bgcolor: '#fff',
                borderRadius: 3,
                border: '1px solid #e2e8f0',
                mx: { xs: 0, md: 1.02 },
              }}
            >
              <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
                😞 No se encontraron productos
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Intenta ajustar los filtros o realiza una búsqueda diferente
              </Typography>
              <Button
                variant="outlined"
                onClick={resetFiltros}
                sx={{ borderRadius: 2, px: 3 }}
              >
                Limpiar filtros
              </Button>
            </Paper>
          ) : (
            <Grid
              container
              spacing={3}
              sx={{
                justifyContent: 'center',
                px: { xs: 2.04, md: 4.08 },
                py: 2,
                mx: { xs: 0, md: 2.04 },
                '@media (min-width: 1200px)': {
                  px: 6.12,
                  mx: 4.08,
                },
                '@media (min-width: 1536px)': {
                  px: 8.16,
                  mx: 6.12,
                },
              }}
            >
              {productosFiltrados.map((producto) => (
                <Grid
                  item
                  key={producto.id}
                  xs={12}
                  sm={6}
                  md={4}
                  sx={{
                    px: { xs: 1.02, md: 2.04 },
                    mb: { xs: 2, md: 3 },
                    '@media (min-width: 1200px)': {
                      flex: '0 0 18%',
                      maxWidth: '18%',
                      px: 3.06,
                    },
                    '@media (min-width: 1536px)': {
                      flex: '0 0 18%',
                      maxWidth: '18%',
                      px: 4.08,
                    },
                  }}
                >
                  <ProductoCard producto={producto} />
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      </Box>

      {/* TopBar and BottomBar components */}
      <TopBar />
      <BottomBar />
    </Box>
  )
}
