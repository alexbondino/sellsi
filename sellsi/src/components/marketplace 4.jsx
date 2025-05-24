import React, { useState } from 'react'
import {
  Box,
  Typography,
  Button,
  Grid,
  Paper,
  TextField,
  Drawer,
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
} from '@mui/material'
import FilterAltIcon from '@mui/icons-material/FilterAlt'
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment'
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight'
import SearchIcon from '@mui/icons-material/Search'
import FavoriteIcon from '@mui/icons-material/Favorite'
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import TopBar from './TopBar'
import BottomBar from './BottomBar'

// Datos de productos
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

// Lista de categorías
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

  return (
    <Card
      elevation={2}
      sx={{
        height: 450, // Aumenté la altura de 420 a 450
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 2,
        transition: 'all 0.3s ease',
        position: 'relative',
        overflow: 'hidden',
        '&:hover': {
          boxShadow: '0 8px 20px rgba(0,0,0,0.12)',
          transform: 'translateY(-4px)',
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
            fontSize: 12,
            py: 0.5,
            px: 1,
            borderRadius: 1,
            zIndex: 2,
            boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
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
          bgcolor: 'rgba(255,255,255,0.9)',
          '&:hover': { bgcolor: 'rgba(255,255,255,1)' },
        }}
        size="small"
      >
        {favorito ? (
          <FavoriteIcon sx={{ color: '#FF5252', fontSize: 20 }} />
        ) : (
          <FavoriteBorderIcon sx={{ color: '#666', fontSize: 20 }} />
        )}
      </IconButton>

      {/* Hot icon para ofertas */}
      {producto.tipo === 'oferta' && (
        <Box
          sx={{
            position: 'absolute',
            top: 40,
            left: 12,
            zIndex: 1,
          }}
        >
          <LocalFireDepartmentIcon
            sx={{
              color: '#FF9800',
              fontSize: 24,
              filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.3))',
            }}
          />
        </Box>
      )}

      {/* Imagen */}
      <CardMedia
        component="img"
        height="180"
        image={imagen}
        alt={nombre}
        sx={{
          objectFit: 'contain',
          p: 1,
          bgcolor: '#fafafa',
        }}
      />

      <CardContent sx={{ flexGrow: 1, p: 2, pb: 1 }}>
        {' '}
        {/* Ajusté el padding bottom */}
        {/* Nombre */}
        <Typography
          variant="subtitle1"
          fontWeight={600}
          sx={{
            mb: 1,
            height: 40,
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            fontSize: 14,
          }}
        >
          {nombre}
        </Typography>
        {/* Rating y ventas */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mr: 1 }}>
            {'★'.repeat(Math.floor(rating))}
            <Typography variant="caption" sx={{ ml: 0.5, color: '#666' }}>
              ({rating})
            </Typography>
          </Box>
          <Typography variant="caption" color="text.secondary">
            {ventas} vendidos
          </Typography>
        </Box>
        {/* Precios */}
        <Box sx={{ mb: 1 }}>
          {precioOriginal > precio && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                textDecoration: 'line-through',
                display: 'block',
                fontSize: 12,
              }}
            >
              ${precioOriginal.toLocaleString('es-CL')}
            </Typography>
          )}
          <Typography
            variant="h6"
            color="primary"
            fontWeight={700}
            sx={{ lineHeight: 1.2, fontSize: 18 }}
          >
            ${precio.toLocaleString('es-CL')}
          </Typography>
        </Box>
        {/* Información adicional */}
        <Typography
          variant="caption"
          color="success.main"
          sx={{ display: 'block', mb: 0.5, fontSize: 11 }}
        >
          {comision}% Comisión
        </Typography>
        <Typography
          variant="caption"
          sx={{
            color: tipoVenta === 'directa' ? '#1976D2' : '#FF9800',
            fontSize: 11,
            display: 'block',
            mb: 0.5,
          }}
        >
          Venta{' '}
          {tipoVenta === 'directa'
            ? 'Directa'
            : tipoVenta === 'indirecta'
            ? 'Indirecta'
            : 'Todos los tipos'}
        </Typography>
        <Typography
          variant="caption"
          color={stock < 10 ? 'error.main' : 'text.secondary'}
          sx={{ fontSize: 11 }}
        >
          {stock < 10 ? `¡Solo ${stock} disponibles!` : `Stock: ${stock}`}
        </Typography>
      </CardContent>

      <CardActions sx={{ p: 2, pt: 1 }}>
        {' '}
        {/* Ajusté el padding top */}
        <Button
          variant="contained"
          color="primary"
          fullWidth
          sx={{
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: 1.5,
            py: 1.2, // Aumenté el padding vertical
            fontSize: '0.9rem', // Ajusté el tamaño de fuente
            minHeight: 44, // Altura mínima del botón
          }}
        >
          AGREGAR AL CARRO
        </Button>
      </CardActions>
    </Card>
  )
}

// Componente principal del Marketplace
export default function Marketplace4() {
  // Estados
  const [seccionActiva, setSeccionActiva] = useState('todos')
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState([])
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

  // Manejadores
  const handleAbrirMenuCategorias = (event) => {
    setAnchorElCategorias(event.currentTarget)
  }

  const handleCerrarMenuCategorias = () => {
    setAnchorElCategorias(null)
  }

  const handleSeleccionarCategoria = (categoria) => {
    setCategoriaSeleccionada((prev) =>
      prev.includes(categoria)
        ? prev.filter((c) => c !== categoria)
        : [...prev, categoria]
    )
    handleCerrarMenuCategorias()
  }

  const handleCambiarSeccion = (seccion) => {
    setSeccionActiva(seccion)
  }

  const handleToggleFiltro = () => {
    setFiltroVisible(!filtroVisible)
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
    setCategoriaSeleccionada([])
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
  } else if (ordenamiento === 'mejor-rating') {
    productosFiltrados = [...productosFiltrados].sort(
      (a, b) => b.rating - a.rating
    )
  } else if (ordenamiento === 'mas-vendidos') {
    productosFiltrados = [...productosFiltrados].sort(
      (a, b) => b.ventas - a.ventas
    )
  }

  return (
    <Box sx={{ bgcolor: '#f8fafc', minHeight: '100vh' }}>
      {/* TopBar */}
      <TopBar />

      {/* Barra de navegación del marketplace */}
      <Box
        sx={{
          mt: { xs: 7, md: 8 },
          py: 2,
          px: { xs: 1, md: 3 },
          bgcolor: '#fff',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          borderBottom: '1px solid #e2e8f0',
          position: 'sticky',
          top: { xs: 56, md: 64 },
          zIndex: 1000,
        }}
      >
        {/* Barra superior con búsqueda */}
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
        </Box>

        {/* Barra de navegación principal */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {/* Botón Categorías */}
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

          {/* Menú de categorías */}
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
              </MenuItem>
            ))}
          </Menu>

          {/* Botón Nuevos */}
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

          {/* Botón Ofertas */}
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

          {/* Botón Top Ventas */}
          <Button
            startIcon={<LocalFireDepartmentIcon sx={{ color: '#f59e0b' }} />}
            onClick={() => handleCambiarSeccion('topVentas')}
            sx={{
              fontWeight: 600,
              color: seccionActiva === 'topVentas' ? 'primary.main' : '#475569',
              fontSize: { xs: 14, md: 16 },
              textTransform: 'none',
              borderBottom: seccionActiva === 'topVentas' ? 2 : 0,
              borderColor: 'primary.main',
              borderRadius: 0,
              py: 1,
              px: 2,
            }}
          >
            Top Ventas
          </Button>

          {/* Botón Filtrar */}
          <IconButton
            onClick={handleToggleFiltro}
            sx={{
              ml: 'auto',
              color: filtroVisible ? 'primary.main' : '#64748b',
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
        </Box>
      </Box>

      {/* Contenedor principal con filtros y productos */}
      <Box sx={{ display: 'flex', p: { xs: 1, md: 3 } }}>
        {/* Panel de filtros */}
        <Collapse
          in={filtroVisible}
          orientation="horizontal"
          sx={{
            width: filtroVisible ? { xs: '100%', md: 300 } : 0,
            minWidth: filtroVisible ? { xs: '100%', md: 300 } : 0, // Ancho mínimo fijo
            maxWidth: filtroVisible ? { xs: '100%', md: 300 } : 0, // Ancho máximo fijo
            flexShrink: 0, // Evita que se encoja
            position: { xs: 'fixed', md: 'relative' },
            zIndex: { xs: 1200, md: 10 },
            bgcolor: '#fff',
            boxShadow: { xs: '0 8px 32px rgba(0,0,0,0.12)', md: 'none' },
            height: { xs: '100%', md: 'auto' },
            top: { xs: 0, md: 'auto' },
            left: { xs: 0, md: 'auto' },
            borderRadius: { xs: 0, md: 2 },
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              p: 3,
              height: '100%',
              overflowY: 'auto',
              width: 300, // Ancho fijo interno
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
                valueLabelFormat={(value) =>
                  `$${value.toLocaleString('es-CL')}`
                }
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
                    endAdornment: (
                      <InputAdornment position="end">%</InputAdornment>
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
                  value={filtros.comisionMax}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || ''
                    setFiltros((prev) => ({ ...prev, comisionMax: value }))
                    if (value !== '') {
                      setComisionRango([comisionRango[0], value])
                    }
                  }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">%</InputAdornment>
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
              <Box
                sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}
              >
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
                        color:
                          star <= filtros.ratingMin ? '#FFD700' : '#E0E0E0',
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
                      background:
                        'linear-gradient(90deg, #FFD700 0%, #FFA500 100%)',
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
        </Collapse>

        {/* Grid de productos */}
        <Box
          sx={{
            flexGrow: 1,
            ml: { xs: 0, md: filtroVisible ? 3 : 0 },
            transition: 'margin-left 0.3s ease',
            minWidth: 0, // Permite que se encoja si es necesario
          }}
        >
          {/* Chips de filtros activos */}
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

              {categoriaSeleccionada.map((cat) => (
                <Chip
                  key={cat}
                  label={cat}
                  onDelete={() =>
                    setCategoriaSeleccionada((prev) =>
                      prev.filter((c) => c !== cat)
                    )
                  }
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

          {/* Título de sección y contador */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 3,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {/* Botón de regreso - solo se muestra cuando no estamos en "todos" */}
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

          {/* Lista de productos */}
          {productosFiltrados.length === 0 ? (
            <Paper
              sx={{
                p: 6,
                textAlign: 'center',
                bgcolor: '#fff',
                borderRadius: 3,
                border: '1px solid #e2e8f0',
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
            <Grid container spacing={3}>
              {productosFiltrados.map((producto) => (
                <Grid item key={producto.id} xs={12} sm={6} md={4} lg={3}>
                  <ProductoCard producto={producto} />
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      </Box>

      {/* BottomBar */}
      <BottomBar />
    </Box>
  )
}
