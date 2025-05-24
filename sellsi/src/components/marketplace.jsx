import React, { useState, useEffect } from 'react'
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
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Slider,
  Select,
  FormControl,
  InputLabel,
  Badge,
} from '@mui/material'
import FilterAltIcon from '@mui/icons-material/FilterAlt'
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment'
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight'
import TopBar from './TopBar'
import BottomBar from './BottomBar'

// Datos de productos
const productos = [
  {
    id: 1,
    nombre: 'Notebook ASUS TUF',
    imagen: '/Marketplace productos/notebookasustuf.png',
    precio: 899990,
    precioOriginal: 999990,
    descuento: 10,
    categoria: 'Tecnología',
    tipo: 'nuevo',
    comision: 15,
    tipoVenta: 'directa',
  },
  {
    id: 2,
    nombre: 'Estufa a pellet',
    imagen: '/Marketplace productos/estufapellet.jpg',
    precio: 399990,
    precioOriginal: 459990,
    descuento: 13,
    categoria: 'Electrodomésticos',
    tipo: 'nuevo',
    comision: 15,
    tipoVenta: 'directa',
  },
  {
    id: 3,
    nombre: 'Colchón King size',
    imagen: '/Marketplace productos/colchonking.webp',
    precio: 299990,
    precioOriginal: 349990,
    descuento: 14,
    categoria: 'Hogar y Muebles',
    tipo: 'nuevo',
    comision: 20,
    tipoVenta: 'directa',
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
    comision: 20,
    tipoVenta: 'indirecta',
  },
  {
    id: 6,
    nombre: 'Estantería metálica',
    imagen: '/Marketplace productos/estanteria.jpg',
    precio: 49990,
    precioOriginal: 62990,
    descuento: 21,
    categoria: 'Hogar y Muebles',
    tipo: 'oferta',
    comision: 15,
    tipoVenta: 'directa',
  },
  {
    id: 7,
    nombre: 'Climatizador portátil',
    imagen: '/Marketplace productos/climatizador.webp',
    precio: 119990,
    precioOriginal: 149990,
    descuento: 20,
    categoria: 'Electrodomésticos',
    tipo: 'oferta',
    comision: 15,
    tipoVenta: 'directa',
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
  },
  {
    id: 9,
    nombre: 'Zapatos de vestir',
    imagen: '/Marketplace productos/zapatos.jpg',
    precio: 39990,
    precioOriginal: 49990,
    descuento: 20,
    categoria: 'Moda',
    tipo: 'general',
    comision: 20,
    tipoVenta: 'indirecta',
  },
  {
    id: 10,
    nombre: 'Silla ergonómica',
    imagen: '/Marketplace productos/silla.jpg',
    precio: 89990,
    precioOriginal: 109990,
    descuento: 18,
    categoria: 'Hogar y Muebles',
    tipo: 'top',
    comision: 15,
    tipoVenta: 'directa',
  },
  {
    id: 11,
    nombre: 'Inodoro (WC)',
    imagen: '/Marketplace productos/WC.jpg',
    precio: 79990,
    precioOriginal: 94990,
    descuento: 16,
    categoria: 'Construcción',
    tipo: 'general',
    comision: 15,
    tipoVenta: 'directa',
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
    comision: 20,
    tipoVenta: 'indirecta',
  },
  {
    id: 13,
    nombre: 'Bicicleta urbana',
    imagen: '/Marketplace productos/bicicleta.jpg',
    precio: 159990,
    precioOriginal: 189990,
    descuento: 16,
    categoria: 'Deportes y Fitness',
    tipo: 'top',
    comision: 15,
    tipoVenta: 'directa',
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
  const {
    nombre,
    imagen,
    precio,
    precioOriginal,
    descuento,
    comision,
    tipoVenta,
  } = producto

  return (
    <Paper
      elevation={2}
      sx={{
        p: 2,
        height: 350,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        borderRadius: 2,
        transition: 'all 0.3s ease',
        position: 'relative',
        overflow: 'hidden',
        '&:hover': {
          boxShadow: '0 8px 16px rgba(0,0,0,0.15)',
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
            right: 12,
            bgcolor: '#FF5252',
            color: 'white',
            fontWeight: 'bold',
            fontSize: 14,
            py: 0.5,
            px: 1.2,
            borderRadius: 1.5,
            zIndex: 1,
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
          }}
        >
          {descuento}% OFF
        </Box>
      )}

      {/* Hot icon */}
      {producto.tipo === 'oferta' && (
        <Box
          sx={{
            position: 'absolute',
            top: 12,
            left: 12,
            zIndex: 1,
          }}
        >
          <LocalFireDepartmentIcon
            sx={{
              color: '#FF9800',
              fontSize: 28,
              filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.3))',
            }}
          />
        </Box>
      )}

      {/* Imagen */}
      <Box
        sx={{
          width: '100%',
          height: 160,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 2,
          mt: 1,
        }}
      >
        <Box
          component="img"
          src={imagen}
          alt={nombre}
          sx={{
            maxWidth: '100%',
            maxHeight: '100%',
            objectFit: 'contain',
          }}
        />
      </Box>

      {/* Nombre */}
      <Typography
        variant="subtitle1"
        fontWeight={600}
        align="center"
        sx={{
          mb: 1,
          height: 48,
          overflow: 'hidden',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
        }}
      >
        {nombre}
      </Typography>

      {/* Precio */}
      <Box sx={{ width: '100%', mb: 1 }}>
        {precioOriginal > precio && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              textDecoration: 'line-through',
              fontWeight: 500,
              fontSize: 14,
            }}
          >
            ${precioOriginal.toLocaleString('es-CL')}
          </Typography>
        )}
        <Typography
          variant="h6"
          color="primary"
          fontWeight={700}
          sx={{ lineHeight: 1.2 }}
        >
          ${precio.toLocaleString('es-CL')}
        </Typography>
        <Typography
          variant="body2"
          color="success.main"
          fontSize={13}
          sx={{ mb: 0.5 }}
        >
          {comision}% Comisión por unidad
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: tipoVenta === 'directa' ? '#1976D2' : '#FF9800',
            fontSize: 13,
          }}
        >
          Venta{' '}
          {tipoVenta === 'directa'
            ? 'Directa'
            : tipoVenta === 'indirecta'
            ? 'Indirecta'
            : 'Todo Tipo de Venta'}
        </Typography>
      </Box>

      {/* Botón */}
      <Button
        variant="contained"
        color="primary"
        fullWidth
        sx={{
          mt: 'auto',
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: 1.5,
        }}
      >
        Ver producto
      </Button>
    </Paper>
  )
}

// Componente principal del Marketplace
export default function Marketplace() {
  // Estados
  const [seccionActiva, setSeccionActiva] = useState('todos')
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState([])
  const [filtroVisible, setFiltroVisible] = useState(false)
  const [anchorElCategorias, setAnchorElCategorias] = useState(null)
  const [filtros, setFiltros] = useState({
    precioMin: '',
    precioMax: '',
    comisionMin: '',
    comisionMax: '',
    tiposVenta: [],
  })
  const [precioRango, setPrecioRango] = useState([0, 1000000])
  const [comisionRango, setComisionRango] = useState([0, 25])

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
    })
    setPrecioRango([0, 1000000])
    setComisionRango([0, 25])
    setCategoriaSeleccionada([])
  }

  // Filtrar productos según criterios
  const productosFiltrados = productos.filter((producto) => {
    // Filtrar por sección activa
    if (seccionActiva === 'nuevos' && producto.tipo !== 'nuevo') return false
    if (seccionActiva === 'ofertas' && producto.tipo !== 'oferta') return false
    if (seccionActiva === 'topVentas' && producto.tipo !== 'top') return false

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

    return true
  })

  // Determinar productos para sección Top Ventas
  const productosTopVentas = productos.filter((p) => p.tipo === 'top')

  return (
    <Box sx={{ bgcolor: '#f5f7fa', minHeight: '100vh' }}>
      {/* TopBar (ya importado) */}
      <TopBar />

      {/* Barra de navegación del marketplace */}
      <Box
        sx={{
          mt: { xs: 7, md: 8 },
          py: 1.5,
          px: { xs: 1, md: 3 },
          bgcolor: '#fff',
          boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
          borderBottom: '1px solid #e0e0e0',
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          position: 'sticky',
          top: 0,
          zIndex: 1000,
        }}
      >
        {/* Botón Categorías */}
        <Button
          endIcon={<ArrowDropDownIcon />}
          onClick={handleAbrirMenuCategorias}
          sx={{
            fontWeight: 700,
            color: '#333',
            fontSize: { xs: 14, md: 16 },
            textTransform: 'none',
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
              width: 280,
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
                height: 36,
                '&:hover': { bgcolor: '#f0f7ff' },
              }}
            >
              <ListItemText primary={categoria} />
              {categoria === 'Tecnología' && (
                <KeyboardArrowRightIcon fontSize="small" />
              )}
            </MenuItem>
          ))}
        </Menu>

        {/* Botón Nuevos */}
        <Button
          onClick={() => handleCambiarSeccion('nuevos')}
          sx={{
            fontWeight: 600,
            color: seccionActiva === 'nuevos' ? 'primary.main' : '#333',
            fontSize: { xs: 14, md: 16 },
            textTransform: 'none',
            borderBottom: seccionActiva === 'nuevos' ? 2 : 0,
            borderColor: 'primary.main',
            borderRadius: 0,
            px: 1,
          }}
        >
          Nuevos
        </Button>

        {/* Botón Ofertas */}
        <Button
          onClick={() => handleCambiarSeccion('ofertas')}
          sx={{
            fontWeight: 600,
            color: seccionActiva === 'ofertas' ? 'primary.main' : '#333',
            fontSize: { xs: 14, md: 16 },
            textTransform: 'none',
            borderBottom: seccionActiva === 'ofertas' ? 2 : 0,
            borderColor: 'primary.main',
            borderRadius: 0,
            px: 1,
          }}
        >
          Ofertas
        </Button>

        {/* Botón Top Ventas */}
        <Button
          startIcon={<LocalFireDepartmentIcon sx={{ color: '#FF9800' }} />}
          onClick={() => handleCambiarSeccion('topVentas')}
          sx={{
            fontWeight: 600,
            color: seccionActiva === 'topVentas' ? 'primary.main' : '#333',
            fontSize: { xs: 14, md: 16 },
            textTransform: 'none',
            borderBottom: seccionActiva === 'topVentas' ? 2 : 0,
            borderColor: 'primary.main',
            borderRadius: 0,
            px: 1,
          }}
        >
          Top Venta
        </Button>

        {/* Botón Filtrar */}
        <IconButton
          onClick={handleToggleFiltro}
          sx={{
            ml: 'auto',
            color: filtroVisible ? 'primary.main' : '#666',
          }}
          aria-label="Filtrar productos"
        >
          <Badge
            color="primary"
            variant="dot"
            invisible={
              !Object.values(filtros).some((v) =>
                Array.isArray(v) ? v.length > 0 : v !== ''
              )
            }
          >
            <FilterAltIcon />
          </Badge>
        </IconButton>

        {/* Selector de Ordenamiento */}
        <FormControl variant="outlined" size="small" sx={{ width: 140 }}>
          <InputLabel id="ordenar-label" sx={{ fontSize: 14 }}>
            Ordenar
          </InputLabel>
          <Select
            labelId="ordenar-label"
            id="ordenar-select"
            label="Ordenar"
            defaultValue=""
            sx={{ fontSize: 14 }}
          >
            <MenuItem value="">Relevancia</MenuItem>
            <MenuItem value="menor-precio">Menor precio</MenuItem>
            <MenuItem value="mayor-precio">Mayor precio</MenuItem>
            <MenuItem value="mayor-descuento">Mayor descuento</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Contenedor principal con filtros y productos */}
      <Box
        sx={{
          display: 'flex',
          p: { xs: 1, md: 3 },
        }}
      >
        {/* Panel de filtros */}
        <Collapse
          in={filtroVisible}
          orientation="horizontal"
          sx={{
            width: filtroVisible ? { xs: '100%', md: 280 } : 0,
            position: { xs: 'fixed', md: 'relative' },
            zIndex: { xs: 1100, md: 10 },
            bgcolor: '#fff',
            boxShadow: { xs: '0 4px 20px rgba(0,0,0,0.15)', md: 'none' },
            height: { xs: '100%', md: 'auto' },
            top: { xs: 0, md: 'auto' },
            left: { xs: 0, md: 'auto' },
            p: filtroVisible ? { xs: 2, md: 0 } : 0,
            transition: 'width 0.3s ease',
            overflowY: 'auto',
          }}
        >
          <Box sx={{ mr: { md: 3 }, mb: { xs: 2, md: 0 } }}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 2,
              }}
            >
              <Typography variant="h6" fontWeight={600}>
                Filtros
              </Typography>
              <Button variant="text" size="small" onClick={resetFiltros}>
                Limpiar
              </Button>
            </Box>

            <Divider sx={{ mb: 2 }} />

            {/* Filtro por precio */}
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
              Precio
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
              />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
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
                  sx={{ width: '48%' }}
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
                  sx={{ width: '48%' }}
                />
              </Box>
            </Box>

            {/* Filtro por comisión */}
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
              Comisión
            </Typography>
            <Box sx={{ px: 1, mb: 3 }}>
              <Slider
                value={comisionRango}
                onChange={handleChangeComisionRango}
                valueLabelDisplay="auto"
                min={0}
                max={25}
                step={5}
                valueLabelFormat={(value) => `${value}%`}
              />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
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
                  sx={{ width: '48%' }}
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
                  sx={{ width: '48%' }}
                />
              </Box>
            </Box>

            {/* Filtro por tipo de venta */}
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
              Tipo de venta
            </Typography>
            <FormControlLabel
              control={
                <Checkbox
                  checked={filtros.tiposVenta.includes('directa')}
                  onChange={() => handleTipoVentaChange('directa')}
                />
              }
              label="Venta Directa"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={filtros.tiposVenta.includes('indirecta')}
                  onChange={() => handleTipoVentaChange('indirecta')}
                />
              }
              label="Venta Indirecta"
            />

            {/* Botón aplicar en versión móvil */}
            <Box sx={{ display: { xs: 'block', md: 'none' }, mt: 4 }}>
              <Button
                variant="contained"
                color="primary"
                fullWidth
                onClick={handleToggleFiltro}
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
            ml: { xs: 0, md: filtroVisible ? 2 : 0 },
            transition: 'margin-left 0.3s ease',
          }}
        >
          {/* Breadcrumb de filtros activos */}
          {(categoriaSeleccionada.length > 0 ||
            filtros.precioMin ||
            filtros.precioMax ||
            filtros.comisionMin ||
            filtros.comisionMax ||
            filtros.tiposVenta.length > 0) && (
            <Paper
              elevation={0}
              sx={{
                p: 1.5,
                mb: 2,
                display: 'flex',
                flexWrap: 'wrap',
                gap: 1,
                alignItems: 'center',
                bgcolor: '#f0f7ff',
              }}
            >
              <Typography variant="body2" sx={{ mr: 1 }}>
                Filtros activos:
              </Typography>

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
                  sx={{ fontSize: 12 }}
                />
              ))}

              {(filtros.precioMin || filtros.precioMax) && (
                <Chip
                  label={`Precio: ${
                    filtros.precioMin
                      ? `$${filtros.precioMin.toLocaleString('es-CL')}`
                      : '$0'
                  } - ${
                    filtros.precioMax
                      ? `$${filtros.precioMax.toLocaleString('es-CL')}`
                      : 'Máx'
                  }`}
                  onDelete={() => {
                    setFiltros((prev) => ({
                      ...prev,
                      precioMin: '',
                      precioMax: '',
                    }))
                    setPrecioRango([0, 1000000])
                  }}
                  size="small"
                  sx={{ fontSize: 12 }}
                />
              )}

              {(filtros.comisionMin || filtros.comisionMax) && (
                <Chip
                  label={`Comisión: ${filtros.comisionMin || 0}% - ${
                    filtros.comisionMax || 25
                  }%`}
                  onDelete={() => {
                    setFiltros((prev) => ({
                      ...prev,
                      comisionMin: '',
                      comisionMax: '',
                    }))
                    setComisionRango([0, 25])
                  }}
                  size="small"
                  sx={{ fontSize: 12 }}
                />
              )}

              {filtros.tiposVenta.map((tipo) => (
                <Chip
                  key={tipo}
                  label={`Venta ${
                    tipo === 'directa' ? 'Directa' : 'Indirecta'
                  }`}
                  onDelete={() => handleTipoVentaChange(tipo)}
                  size="small"
                  sx={{ fontSize: 12 }}
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

          {/* Título de sección */}
          <Typography
            variant="h5"
            fontWeight={600}
            sx={{
              mb: 3,
              color: '#333',
            }}
          >
            {seccionActiva === 'nuevos'
              ? 'Nuevos Productos'
              : seccionActiva === 'ofertas'
              ? 'Ofertas Destacadas'
              : seccionActiva === 'topVentas'
              ? 'Top Ventas'
              : 'Todos los Productos'}
          </Typography>

          {/* Lista de productos */}
          {productosFiltrados.length === 0 ? (
            <Paper
              sx={{
                p: 4,
                textAlign: 'center',
                bgcolor: '#fff',
                borderRadius: 2,
              }}
            >
              <Typography variant="h6" color="text.secondary">
                No se encontraron productos que coincidan con el filtro
              </Typography>
              <Button variant="outlined" onClick={resetFiltros} sx={{ mt: 2 }}>
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

      {/* BottomBar (ya importado) */}
      <BottomBar />
    </Box>
  )
}
