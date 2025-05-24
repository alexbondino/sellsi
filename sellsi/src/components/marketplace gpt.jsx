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
} from '@mui/material'
import FilterListIcon from '@mui/icons-material/FilterList'
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'
import TopBar from './TopBar'
import BottomBar from './BottomBar'

// Productos y rutas
const PRODUCTOS = [
  {
    nombre: 'Notebook ASUS TUF',
    imagen: '/Marketplace productos/notebookasustuf.png',
    precio: 899990,
    categoria: 'Tecnología',
    tipo: 'nuevo',
  },
  {
    nombre: 'Estufa a pellet',
    imagen: '/Marketplace productos/estufapellet.jpg',
    precio: 399990,
    categoria: 'Electrodomésticos',
    tipo: 'nuevo',
  },
  {
    nombre: 'Colchón King size',
    imagen: '/Marketplace productos/colchonking.webp',
    precio: 299990,
    categoria: 'Hogar y Muebles',
    tipo: 'nuevo',
  },
  {
    nombre: 'Lavadora automática',
    imagen: '/Marketplace productos/lavadora.webp',
    precio: 249990,
    categoria: 'Electrodomésticos',
    tipo: 'nuevo',
  },
  {
    nombre: 'Hervidor eléctrico',
    imagen: '/Marketplace productos/hervidor.png',
    precio: 29990,
    categoria: 'Electrodomésticos',
    tipo: 'oferta',
  },
  {
    nombre: 'Estantería metálica',
    imagen: '/Marketplace productos/estanteria.jpg',
    precio: 49990,
    categoria: 'Hogar y Muebles',
    tipo: 'oferta',
  },
  {
    nombre: 'Climatizador portátil',
    imagen: '/Marketplace productos/climatizador.webp',
    precio: 119990,
    categoria: 'Electrodomésticos',
    tipo: 'oferta',
  },
  {
    nombre: 'Horno eléctrico',
    imagen: '/Marketplace productos/horno electrico.png',
    precio: 69990,
    categoria: 'Electrodomésticos',
    tipo: 'oferta',
  },
  {
    nombre: 'Zapatos de vestir',
    imagen: '/Marketplace productos/zapatos.jpg',
    precio: 39990,
    categoria: 'Moda',
    tipo: 'oferta',
  },
  {
    nombre: 'Silla ergonómica',
    imagen: '/Marketplace productos/silla.jpg',
    precio: 89990,
    categoria: 'Hogar y Muebles',
    tipo: 'general',
  },
  {
    nombre: 'Inodoro (WC)',
    imagen: '/Marketplace productos/WC.jpg',
    precio: 79990,
    categoria: 'Construcción',
    tipo: 'general',
  },
  {
    nombre: 'Limpiador de vidrios',
    imagen: '/Marketplace productos/limpiadordevidrios.webp',
    precio: 19990,
    categoria: 'Hogar y Muebles',
    tipo: 'general',
  },
  {
    nombre: 'Bicicleta urbana',
    imagen: '/Marketplace productos/bicicleta.jpg',
    precio: 159990,
    categoria: 'Deportes y Fitness',
    tipo: 'general',
  },
]

// Categorías para el menú
const CATEGORIAS = [
  'Tecnología',
  'Electrodomésticos',
  'Hogar y Muebles',
  'Moda',
  'Construcción',
  'Deportes y Fitness',
]

// Filtros iniciales
const FILTROS_INICIALES = {
  precioMin: '',
  precioMax: '',
  categorias: [],
}

function ProductoCard({ nombre, imagen, precio }) {
  return (
    <Paper
      elevation={2}
      sx={{
        p: 2,
        height: 320,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        borderRadius: 3,
        transition: 'box-shadow 0.2s',
        '&:hover': { boxShadow: 6 },
      }}
    >
      <Box
        component="img"
        src={imagen}
        alt={nombre}
        sx={{
          height: 140,
          width: 'auto',
          mb: 2,
          objectFit: 'contain',
          borderRadius: 2,
        }}
      />
      <Typography variant="h6" fontWeight={700} align="center" sx={{ mb: 1 }}>
        {nombre}
      </Typography>
      <Typography variant="h5" color="primary" fontWeight={700} sx={{ mb: 1 }}>
        ${precio.toLocaleString('es-CL')}
      </Typography>
      <Button
        variant="contained"
        color="primary"
        sx={{ mt: 'auto', width: '100%', fontWeight: 700, borderRadius: 2 }}
      >
        Ver producto
      </Button>
    </Paper>
  )
}

export default function MarketplaceGPT() {
  // Estado de sección activa
  const [seccion, setSeccion] = useState('todos')
  // Filtros
  const [filtros, setFiltros] = useState(FILTROS_INICIALES)
  // Drawer de filtros
  const [openFiltro, setOpenFiltro] = useState(false)
  // Menú categorías
  const [anchorCat, setAnchorCat] = useState(null)

  // Filtrado de productos
  let productosFiltrados = PRODUCTOS.filter((p) => {
    // Sección
    if (seccion === 'nuevos' && p.tipo !== 'nuevo') return false
    if (seccion === 'ofertas' && p.tipo !== 'oferta') return false
    // Categoría
    if (
      filtros.categorias.length > 0 &&
      !filtros.categorias.includes(p.categoria)
    )
      return false
    // Precio
    if (filtros.precioMin && p.precio < Number(filtros.precioMin)) return false
    if (filtros.precioMax && p.precio > Number(filtros.precioMax)) return false
    return true
  })

  // Handlers
  const handleFiltroChange = (e) => {
    const { name, value } = e.target
    setFiltros((prev) => ({ ...prev, [name]: value }))
  }
  const handleCategoriaCheck = (cat) => {
    setFiltros((prev) => ({
      ...prev,
      categorias: prev.categorias.includes(cat)
        ? prev.categorias.filter((c) => c !== cat)
        : [...prev.categorias, cat],
    }))
  }
  const handleResetFiltros = () => setFiltros(FILTROS_INICIALES)

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
      <TopBar />
      {/* Top nav marketplace */}
      <Box
        sx={{
          mt: { xs: 7, md: 8.5 },
          px: { xs: 1, md: 4 },
          py: 2,
          bgcolor: '#fff',
          borderBottom: '1px solid #eee',
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        {/* Categorías */}
        <Button
          startIcon={<img src="/categorias.png" alt="" width={24} />}
          endIcon={<ArrowDropDownIcon />}
          onClick={(e) => setAnchorCat(e.currentTarget)}
          sx={{
            fontWeight: 700,
            color: 'text.black',
            fontSize: 18,
            textTransform: 'none',
          }}
        >
          Categorías
        </Button>
        <Menu
          anchorEl={anchorCat}
          open={Boolean(anchorCat)}
          onClose={() => setAnchorCat(null)}
          MenuListProps={{ sx: { width: 240 } }}
        >
          {CATEGORIAS.map((cat) => (
            <MenuItem
              key={cat}
              onClick={() => {
                setFiltros((prev) => ({
                  ...prev,
                  categorias: prev.categorias.includes(cat)
                    ? prev.categorias
                    : [...prev.categorias, cat],
                }))
                setAnchorCat(null)
              }}
            >
              {cat}
            </MenuItem>
          ))}
        </Menu>
        {/* Nuevos */}
        <Button
          startIcon={<img src="/nuevos.png" alt="" width={24} />}
          sx={{
            fontWeight: 700,
            color: seccion === 'nuevos' ? 'primary.main' : 'text.black',
            fontSize: 18,
            textTransform: 'none',
          }}
          onClick={() => setSeccion('nuevos')}
        >
          Nuevos
        </Button>
        {/* Ofertas */}
        <Button
          startIcon={<img src="/ofertas.png" alt="" width={24} />}
          sx={{
            fontWeight: 700,
            color: seccion === 'ofertas' ? 'primary.main' : 'text.black',
            fontSize: 18,
            textTransform: 'none',
          }}
          onClick={() => setSeccion('ofertas')}
        >
          Ofertas
        </Button>
        {/* Top Venta */}
        <Button
          startIcon={
            <span role="img" aria-label="fire">
              🔥
            </span>
          }
          sx={{
            fontWeight: 700,
            color: seccion === 'top' ? 'primary.main' : 'text.black',
            fontSize: 18,
            textTransform: 'none',
          }}
          onClick={() => setSeccion('top')}
        >
          Top Venta
        </Button>
        {/* Filtro */}
        <IconButton
          onClick={() => setOpenFiltro(true)}
          sx={{ ml: 'auto' }}
          aria-label="Abrir filtros"
        >
          <img src="/filtrado.png" alt="Filtrar" width={28} />
        </IconButton>
      </Box>

      {/* Drawer de filtros */}
      <Drawer
        anchor="left"
        open={openFiltro}
        onClose={() => setOpenFiltro(false)}
        PaperProps={{ sx: { width: 320, p: 3 } }}
      >
        <Box sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
            Filtrar productos
          </Typography>
          <TextField
            label="Precio mínimo"
            name="precioMin"
            value={filtros.precioMin}
            onChange={handleFiltroChange}
            type="number"
            fullWidth
            sx={{ mb: 2 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">$</InputAdornment>
              ),
            }}
          />
          <TextField
            label="Precio máximo"
            name="precioMax"
            value={filtros.precioMax}
            onChange={handleFiltroChange}
            type="number"
            fullWidth
            sx={{ mb: 2 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">$</InputAdornment>
              ),
            }}
          />
          <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
            Categorías
          </Typography>
          {CATEGORIAS.map((cat) => (
            <FormControlLabel
              key={cat}
              control={
                <Checkbox
                  checked={filtros.categorias.includes(cat)}
                  onChange={() => handleCategoriaCheck(cat)}
                />
              }
              label={cat}
            />
          ))}
          <Box sx={{ mt: 3, display: 'flex', gap: 1 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={() => setOpenFiltro(false)}
              sx={{ flex: 1 }}
            >
              Aplicar
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              onClick={handleResetFiltros}
              sx={{ flex: 1 }}
            >
              Limpiar
            </Button>
          </Box>
        </Box>
      </Drawer>

      {/* Contenido principal */}
      <Box sx={{ px: { xs: 1, md: 4 }, py: 4, minHeight: '70vh' }}>
        {productosFiltrados.length === 0 ? (
          <Typography
            variant="h6"
            align="center"
            color="text.secondary"
            sx={{ mt: 8 }}
          >
            No se encontraron productos para los filtros seleccionados.
          </Typography>
        ) : (
          <Grid container spacing={3}>
            {productosFiltrados.map((prod, idx) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={prod.nombre + idx}>
                <ProductoCard {...prod} />
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
      <BottomBar />
    </Box>
  )
}
