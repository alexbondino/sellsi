import React, { useState } from 'react'
import {
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Typography,
  Button,
  IconButton,
  Box,
  Tooltip,
} from '@mui/material'
import FavoriteIcon from '@mui/icons-material/Favorite'
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder'
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart'
import InfoIcon from '@mui/icons-material/Info'

const ProductCard = ({ producto, onAddToCart, onViewDetails }) => {
  const [favorito, setFavorito] = useState(false)

  if (!producto) {
    return null
  }

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

  // ✅ AGREGAR función para manejar click en AGREGAR
  const handleAgregarClick = () => {
    const isLoggedIn = !!localStorage.getItem('supplierid')

    if (!isLoggedIn) {
      // Disparar evento para abrir Login modal
      const event = new CustomEvent('openLoginModal')
      window.dispatchEvent(event)
    } else {
      // Lógica para agregar al carrito (usuario logueado)
      console.log('Producto agregado al carrito:', producto.nombre)
      if (onAddToCart) {
        onAddToCart(producto)
      }
    }
  }

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
        height: 480, // ✅ REDUCIR: de 620 a 480 (-140px, -23%)
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 2,
        transition: 'all 0.3s ease',
        position: 'relative',
        overflow: 'hidden',
        '&:hover': {
          boxShadow: '0 8px 16px rgba(0,0,0,0.12)', // ✅ REDUCIR sombra
          transform: 'translateY(-4px)', // ✅ REDUCIR movimiento: -6px a -4px
        },
      }}
    >
      {/* Badge de descuento - más pequeño */}
      {descuento > 0 && (
        <Box
          sx={{
            position: 'absolute',
            top: 8, // ✅ REDUCIR: de 12 a 8
            left: 8, // ✅ REDUCIR: de 12 a 8
            bgcolor: '#FF5252',
            color: 'white',
            fontWeight: 'bold',
            fontSize: 12, // ✅ REDUCIR: de 16 a 12
            py: 0.5, // ✅ REDUCIR: de 1 a 0.5
            px: 1.5, // ✅ REDUCIR: de 2 a 1.5
            borderRadius: 1.5, // ✅ REDUCIR: de 2 a 1.5
            zIndex: 2,
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)', // ✅ REDUCIR sombra
          }}
        >
          -{descuento}%
        </Box>
      )}

      {/* Icono favorito - más pequeño */}
      <IconButton
        onClick={toggleFavorito}
        sx={{
          position: 'absolute',
          top: 6, // ✅ REDUCIR: de 8 a 6
          right: 6, // ✅ REDUCIR: de 8 a 6
          zIndex: 2,
          bgcolor: 'rgba(255,255,255,0.9)',
          width: 32, // ✅ REDUCIR: de 44 a 32
          height: 32, // ✅ REDUCIR: de 44 a 32
          '&:hover': {
            bgcolor: 'rgba(255,255,255,1)',
            transform: 'scale(1.05)', // ✅ REDUCIR: de 1.1 a 1.05
          },
        }}
        size="small"
      >
        {favorito ? (
          <FavoriteIcon sx={{ color: '#FF5252', fontSize: 20 }} /> // ✅ REDUCIR: de 28 a 20
        ) : (
          <FavoriteBorderIcon sx={{ color: '#666', fontSize: 20 }} /> // ✅ REDUCIR: de 28 a 20
        )}
      </IconButton>

      {/* Imagen - más pequeña */}
      <CardMedia
        component="img"
        height="160" // ✅ REDUCIR: de 220 a 160 (-60px, -27%)
        image={imagen}
        alt={nombre}
        sx={{
          objectFit: 'contain',
          p: 1.5, // ✅ REDUCIR: de 2 a 1.5
          bgcolor: '#fafafa',
        }}
      />

      <CardContent sx={{ flexGrow: 1, p: 2, pb: 1 }}>
        {' '}
        {/* ✅ REDUCIR: de 3 a 2 */}
        {/* Nombre - más compacto */}
        <Typography
          variant="h6"
          fontWeight={700}
          sx={{
            mb: 0.5, // ✅ REDUCIR: de 0.1 a 0.5
            height: 48, // ✅ REDUCIR: de 65 a 48 (-17px, -26%)
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            fontSize: 18, // ✅ REDUCIR: de 24 a 18 (-25%)
            lineHeight: 1.2, // ✅ REDUCIR: de 1.3 a 1.2
            color: '#1e293b',
          }}
        >
          {nombre}
        </Typography>
        {/* Rating y ventas - más compacto */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
          {' '}
          {/* ✅ REDUCIR: de 2.5 a 1.5 */}
          <Box sx={{ display: 'flex', alignItems: 'center', mr: 1.5 }}>
            {' '}
            {/* ✅ REDUCIR: de 2 a 1.5 */}
            <Box sx={{ fontSize: 16, color: '#FFD700' }}>
              {' '}
              {/* ✅ REDUCIR: de 24 a 16 */}
              {'★'.repeat(Math.floor(rating))}
            </Box>
            <Typography
              variant="body2"
              sx={{ ml: 0.5, color: '#666', fontSize: 12, fontWeight: 600 }} // ✅ REDUCIR: de 17 a 12
            >
              ({rating})
            </Typography>
          </Box>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ fontSize: 11, fontWeight: 500 }} // ✅ REDUCIR: de 16 a 11
          >
            {ventas} vendidos
          </Typography>
        </Box>
        {/* Precios - más compacto */}
        <Box sx={{ mb: 1.5 }}>
          {' '}
          {/* ✅ REDUCIR: de 2.5 a 1.5 */}
          {precioOriginal > precio && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                textDecoration: 'line-through',
                display: 'block',
                fontSize: 14, // ✅ REDUCIR: de 18 a 14
                fontWeight: 500,
                mb: 0.3, // ✅ REDUCIR: de 0.5 a 0.3
              }}
            >
              ${precioOriginal.toLocaleString('es-CL')}
            </Typography>
          )}
          <Typography
            variant="h5"
            color="primary"
            fontWeight={700}
            sx={{ lineHeight: 1.1, fontSize: 22 }} // ✅ REDUCIR: de 30 a 22
          >
            ${precio.toLocaleString('es-CL')}
          </Typography>
        </Box>
        {/* Información adicional - más compacta */}
        <Typography
          variant="body2"
          color="success.main"
          sx={{ display: 'block', mb: 0.8, fontSize: 13, fontWeight: 600 }} // ✅ REDUCIR: de 17 a 13, mb de 1 a 0.8
        >
          {comision}% Comisión
        </Typography>
        {/* Tipo de venta - más compacto */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 0.8 }}>
          {' '}
          {/* ✅ REDUCIR gaps y margins */}
          <Typography
            variant="body2"
            sx={{
              color: tipoVenta === 'directa' ? '#1976D2' : '#FF9800',
              fontSize: 12, // ✅ REDUCIR: de 16 a 12
              fontWeight: 600,
            }}
          >
            Venta{' '}
            {tipoVenta === 'directa'
              ? 'Directa'
              : tipoVenta === 'indirecta'
              ? 'Indirecta'
              : 'Todos los tipos'}
          </Typography>
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
                width: 16, // ✅ REDUCIR: de 20 a 16
                height: 16, // ✅ REDUCIR: de 20 a 16
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
              <InfoIcon sx={{ fontSize: 12 }} /> {/* ✅ REDUCIR: de 16 a 12 */}
            </IconButton>
          </Tooltip>
        </Box>
        <Typography
          variant="body2"
          color={stock < 10 ? 'error.main' : 'text.secondary'}
          sx={{ fontSize: 12, fontWeight: 600 }} // ✅ REDUCIR: de 16 a 12
        >
          {stock < 10 ? `¡Solo ${stock} disponibles!` : `Stock: ${stock}`}
        </Typography>
      </CardContent>

      {/* Botón agregar - más pequeño */}
      <CardActions sx={{ p: 1.5, pt: 0.5 }}>
        {' '}
        {/* ✅ REDUCIR: de 2.5 a 1.5, pt de 1 a 0.5 */}
        <Button
          variant="contained"
          color="primary"
          fullWidth
          startIcon={<ShoppingCartIcon sx={{ fontSize: 16 }} />} // ✅ REDUCIR icono
          onClick={handleAgregarClick}
          sx={{
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: 2,
            py: 0.8, // ✅ REDUCIR: de 1 a 0.8
            fontSize: '0.9rem', // ✅ REDUCIR: de 1rem a 0.9rem
            minHeight: 32, // ✅ REDUCIR: de 40 a 32
            background: 'linear-gradient(135deg, #1976D2 0%, #1565C0 100%)',
            boxShadow: '0 3px 10px rgba(25, 118, 210, 0.3)', // ✅ REDUCIR sombra
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

export default ProductCard
