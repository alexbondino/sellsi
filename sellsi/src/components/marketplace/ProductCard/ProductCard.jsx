// ✅ EDITAR AQUÍ PARA:
// - Cambiar diseño de la tarjeta
// - Modificar información mostrada
// - Ajustar botón "AGREGAR" (color, texto, funcionalidad)
// - Cambiar iconos o tooltips
// - Modificar badge de descuento o favoritos

import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
  Popover,
  TextField,
} from '@mui/material'
import FavoriteIcon from '@mui/icons-material/Favorite'
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder'
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart'
import InfoIcon from '@mui/icons-material/Info'
import AddIcon from '@mui/icons-material/Add'
import RemoveIcon from '@mui/icons-material/Remove'
import { generateProductUrl } from '../../../utils/marketplace/productUrl'

const ProductCard = ({ producto, onAddToCart, onViewDetails }) => {
  const [favorito, setFavorito] = useState(false)
  const [anchorEl, setAnchorEl] = useState(null)
  const [cantidad, setCantidad] = useState(1)
  const navigate = useNavigate()

  if (!producto) {
    return null
  }
  // ✅ FUNCIÓN para obtener el mensaje del tooltip - COMMENTED OUT: Sale Type functionality removed
  // const getTooltipMessage = (tipo) => {
  //   switch (tipo) {
  //     case 'directa':
  //       return 'El productor vende directamente al cliente final, sin usar intermediarios como distribuidores o minoristas.'
  //     case 'indirecta':
  //       return 'El producto se comercializa a través de intermediarios antes de llegar al cliente final.'
  //     default:
  //       return 'Información sobre el tipo de venta no disponible.'
  //   }
  // }  // ✅ NUEVA función para manejar click en AGREGAR
  const handleAgregarClick = (event) => {
    event.stopPropagation() // Solo prevenir propagación hacia ProductCard
    console.log('handleAgregarClick ejecutado!', event?.currentTarget)
    setAnchorEl(event.currentTarget)
  }

  // ✅ NUEVA función para cerrar el popover
  const handleClosePopover = () => {
    setAnchorEl(null)
    setCantidad(1) // Reset cantidad al cerrar
  }

  // ✅ NUEVA función para manejar cambio de cantidad
  const handleCantidadChange = (event) => {
    const value = parseInt(event.target.value) || 0
    if (value >= 1 && value <= stock) {
      setCantidad(value)
    }
  }

  // ✅ NUEVA función para incrementar cantidad
  const handleIncrement = () => {
    if (cantidad < stock) {
      setCantidad(cantidad + 1)
    }
  }

  // ✅ NUEVA función para decrementar cantidad
  const handleDecrement = () => {
    if (cantidad > 1) {
      setCantidad(cantidad - 1)
    }
  }

  // ✅ NUEVA función para confirmar agregado al carrito
  const handleConfirmarAgregar = () => {
    console.log(`Agregando ${cantidad} unidades de ${nombre} al carrito`)
    if (onAddToCart) {
      onAddToCart({ ...producto, cantidadSeleccionada: cantidad })
    }
    handleClosePopover()
  }

  const {
    nombre,
    imagen,
    precio,
    precioOriginal,
    descuento,
    // comision, // COMMENTED OUT: Commission functionality removed
    // tipoVenta, // COMMENTED OUT: Sale Type functionality removed
    rating,
    ventas,
    stock,
    negociable, // ✅ AGREGAR: Propiedad negociable
  } = producto

  const toggleFavorito = () => setFavorito(!favorito)

  // Función para navegar a la ficha técnica del producto
  const handleProductClick = (e) => {
    // Prevenir la navegación si se hizo clic en botones específicos
    if (e.target.closest('button') || e.target.closest('.MuiIconButton-root')) {
      return
    }

    // Generar URL y navegar
    const productUrl = generateProductUrl(producto)
    navigate(productUrl)
  }

  return (
    <Card
      elevation={2}
      onClick={handleProductClick}
      sx={{
        height: 450, // ✅ REDUCIR: de 620 a 480 (-140px, -23%)
        minWidth: { xs: 100, sm: 150, md: 180, lg: 280, xl: 300 }, // ✅ REDUCIR: de 400 a 360 (-40px, -10%)
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 2,
        transition: 'all 0.3s ease',
        position: 'relative',
        overflow: 'hidden',
        cursor: 'pointer',
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
        </Box>{' '}
        {/* Información adicional - más compacta */}{' '}
        {/* COMMENTED OUT: Commission functionality removed */}
        {/* <Typography
          variant="body2"
          color="success.main"
          sx={{ display: 'block', mb: 0.8, fontSize: 13, fontWeight: 600 }} // ✅ REDUCIR: de 17 a 13, mb de 1 a 0.8
        >
          {comision}% Comisión
        </Typography> */}
        {/* COMMENTED OUT: Sale Type functionality removed */}
        {/* Tipo de venta - más compacto */}
        {/* <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 0.8 }}>
          <Typography
            variant="body2"
            sx={{
              color: tipoVenta === 'directa' ? '#1976D2' : '#FF9800',
              fontSize: 12,
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
                width: 16,
                height: 16,
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
              <InfoIcon sx={{ fontSize: 12 }} />
            </IconButton>
          </Tooltip>
        </Box> */}{' '}
        <Typography
          variant="body2"
          color={stock < 10 ? 'error.main' : 'text.secondary'}
          sx={{ fontSize: 12, fontWeight: 600 }} // ✅ REDUCIR: de 16 a 12
        >
          {stock < 10 ? `¡Solo ${stock} disponibles!` : `Stock: ${stock}`}
        </Typography>{' '}
        {/* ✅ NUEVO: Botón de negociación */}
        <Box sx={{ mt: 1, mb: 0.5 }}>
          <Button
            variant="contained"
            fullWidth
            disabled={!negociable}
            onClick={
              negociable
                ? () => {
                    // TODO: Abrir modal de negociación
                    console.log('Abrir modal de negociación para:', nombre)
                  }
                : undefined
            }
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.8rem',
              py: 0.5,
              borderRadius: 1.5,
              border: 'none',
              color: negociable ? '#2e7d32' : '#757575',
              backgroundColor: negociable
                ? 'rgba(46, 125, 50, 0.05)'
                : 'rgba(117, 117, 117, 0.05)',
              '&:hover': negociable
                ? {
                    backgroundColor: 'rgba(46, 125, 50, 0.1)',
                    border: 'none',
                  }
                : {
                    border: 'none',
                  },
              '&:active': {
                border: 'none !important',
                outline: 'none !important',
              },
              '&:focus': {
                border: 'none !important',
                outline: 'none !important',
              },
              '&.Mui-disabled': {
                color: '#757575',
                border: 'none',
                backgroundColor: 'rgba(117, 117, 117, 0.05)',
              },
            }}
          >
            {negociable ? 'Negociable' : 'No Negociable'}
          </Button>
        </Box>
      </CardContent>{' '}
      {/* Botón agregar - más pequeño */}
      <CardActions sx={{ p: 1.5, pt: 0.5 }}>
        <Button
          variant="contained"
          color="primary"
          fullWidth
          startIcon={<ShoppingCartIcon sx={{ fontSize: 16 }} />}
          onClick={handleAgregarClick}
          sx={{
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: 2,
            py: 0.8,
            fontSize: '0.9rem',
            color: 'rgb(0, 0, 0)',
            background:
              'linear-gradient(135deg,rgb(231, 254, 255) 0%,rgb(202, 223, 247) 100%)',
            boxShadow: '0 3px 10px rgba(25, 118, 210, 0.3)',
            '&:hover': {
              background:
                'linear-gradient(135deg,rgb(209, 251, 254) 0%,rgb(189, 196, 247) 100%)',
              boxShadow: '0 6px 20px rgba(25, 118, 210, 0.6)',
              transform: 'translateY(-2px)',
              border: 'none',
            },
            '&:active': {
              border: 'none !important',
              outline: 'none !important',
            },
            '&:focus': {
              border: 'none !important',
              outline: 'none !important',
            },
            '& .MuiButton-startIcon': {
              marginRight: 1,
            },
          }}
        >
          AGREGAR
        </Button>
      </CardActions>{' '}
      {/* ✅ NUEVO: Selector de cantidad - Modal que aparece al hacer click en AGREGAR */}
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={handleClosePopover}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        onClick={(e) => e.stopPropagation()} // Prevenir click en ProductCard
        disableScrollLock={true} // ✅ SOLUCIÓN: Prevenir bloqueo de scroll que causa desplazamiento
        disableRestoreFocus={true} // ✅ SOLUCIÓN: Evitar cambios de foco que afecten el layout
        disableAutoFocus={true} // ✅ SOLUCIÓN: Prevenir auto-focus que puede mover el modal
        PaperProps={{
          onClick: (e) => e.stopPropagation(), // Prevenir click en ProductCard
          sx: {
            p: 2,
            borderRadius: 2,
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
            minWidth: 220,
            maxWidth: 240,
            zIndex: 10000,
            bgcolor: 'white',
            border: '1px solid #e0e0e0',
            position: 'fixed', // ✅ SOLUCIÓN: Posición fija para evitar reflow
          },
        }}
        sx={{
          zIndex: 10000,
        }}
      >
        {' '}
        <Box sx={{ userSelect: 'none' }}>
          {' '}
          {/* ✅ SOLUCIÓN: Prevenir selección de texto */}
          <Typography variant="h6" sx={{ mb: 2, textAlign: 'center' }}>
            Seleccionar Cantidad
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <IconButton
              onClick={(e) => {
                e.preventDefault() // ✅ SOLUCIÓN: Prevenir comportamiento por defecto
                e.stopPropagation() // ✅ SOLUCIÓN: Evitar propagación de eventos
                handleDecrement()
              }}
              disabled={cantidad <= 1}
              size="small"
              sx={{
                userSelect: 'none', // ✅ SOLUCIÓN: Prevenir selección
                touchAction: 'manipulation', // ✅ SOLUCIÓN: Mejorar comportamiento táctil
              }}
            >
              <RemoveIcon />
            </IconButton>
            <TextField
              type="number"
              value={cantidad}
              onChange={handleCantidadChange}
              inputProps={{ min: 1, max: stock }}
              sx={{
                width: 100, // Aumentado para soportar 4 dígitos
                '& input': {
                  textAlign: 'center', // Centrar el texto
                  userSelect: 'text', // ✅ SOLUCIÓN: Permitir selección solo en el input
                },
              }}
              size="small"
            />
            <IconButton
              onClick={(e) => {
                e.preventDefault() // ✅ SOLUCIÓN: Prevenir comportamiento por defecto
                e.stopPropagation() // ✅ SOLUCIÓN: Evitar propagación de eventos
                handleIncrement()
              }}
              disabled={cantidad >= stock}
              size="small"
              sx={{
                userSelect: 'none', // ✅ SOLUCIÓN: Prevenir selección
                touchAction: 'manipulation', // ✅ SOLUCIÓN: Mejorar comportamiento táctil
              }}
            >
              <AddIcon />
            </IconButton>
          </Box>
          <Typography
            variant="body2"
            sx={{ mb: 2, textAlign: 'center', color: 'text.secondary' }}
          >
            Stock disponible: {stock}
          </Typography>{' '}
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              onClick={(e) => {
                e.preventDefault() // ✅ SOLUCIÓN: Prevenir comportamiento por defecto
                e.stopPropagation() // ✅ SOLUCIÓN: Evitar propagación de eventos
                handleClosePopover()
              }}
              fullWidth
              sx={{
                userSelect: 'none', // ✅ SOLUCIÓN: Prevenir selección
                touchAction: 'manipulation', // ✅ SOLUCIÓN: Mejorar comportamiento táctil
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="contained"
              onClick={(e) => {
                e.preventDefault() // ✅ SOLUCIÓN: Prevenir comportamiento por defecto
                e.stopPropagation() // ✅ SOLUCIÓN: Evitar propagación de eventos
                handleConfirmarAgregar()
              }}
              fullWidth
              sx={{
                userSelect: 'none', // ✅ SOLUCIÓN: Prevenir selección
                touchAction: 'manipulation', // ✅ SOLUCIÓN: Mejorar comportamiento táctil
              }}
            >
              Agregar
            </Button>
          </Box>
        </Box>
      </Popover>
    </Card>
  )
}

export default React.memo(ProductCard)
